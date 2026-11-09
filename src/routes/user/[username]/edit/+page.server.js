import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/database.js';

// Only the owner of the profile may edit it. The id comes from the login,
// never from the form.
function requireOwner({ locals, params }) {
  if (!locals.user) {
    redirect(303, '/login');
  }
  if (locals.user.username.toLowerCase() !== params.username.toLowerCase()) {
    error(403, 'You can only edit your own profile.');
  }
  return locals.user.id;
}

export async function load(event) {
  const userId = requireOwner(event);

  const [rows] = await db.execute(
    `SELECT u.id, u.username, u.name, u.role,
            DATE_FORMAT(ap.birth_date, '%Y-%m-%d') AS birth_date,
            ap.gender, ap.height_cm, ap.weight_kg, ap.eye_color, ap.hair_color,
            ap.city, ap.education, ap.awards, ap.bio, ap.availability
     FROM users u
     LEFT JOIN actor_profiles ap ON ap.user_id = u.id
     WHERE u.id = ?`,
    [userId]
  );
  const profile = rows[0];
  if (!profile) {
    error(404, 'Profile not found');
  }

  let allLanguages = [];
  let selectedLanguageIds = [];
  if (profile.role === 'actor') {
    [allLanguages] = await db.execute('SELECT id, name FROM languages ORDER BY name ASC');
    const [mine] = await db.execute(
      'SELECT language_id FROM actor_languages WHERE actor_id = ?',
      [userId]
    );
    selectedLanguageIds = mine.map((row) => row.language_id);
  }

  return { profile, allLanguages, selectedLanguageIds };
}

// whole number inside a range, or null when the field is empty.
// Returns undefined when the number is not valid.
function readInt(raw, min, max) {
  if (raw === '') return null;
  if (!/^\d+$/.test(raw)) return undefined;
  const number = Number(raw);
  return number >= min && number <= max ? number : undefined;
}

const textOrNull = (value) => (value === '' ? null : value);

export const actions = {
  default: async (event) => {
    const userId = requireOwner(event);
    const { request, locals } = event;

    const form = await request.formData();
    const get = (field) => form.get(field)?.toString().trim() ?? '';

    const values = {
      name: get('name'),
      availability: get('availability') || 'available',
      birth_date: get('birth_date'),
      gender: get('gender'),
      city: get('city'),
      height_cm: get('height_cm'),
      weight_kg: get('weight_kg'),
      eye_color: get('eye_color'),
      hair_color: get('hair_color'),
      education: get('education'),
      bio: get('bio'),
      awards: get('awards'),
      languages: form
        .getAll('languages')
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0)
    };
    const bad = (message) => fail(400, { error: message, values });

    // ---- name (every role) ----
    if (!values.name) return bad('Enter your name.');
    if (values.name.length > 80) return bad('The name can have at most 80 characters.');

    await db.execute('UPDATE users SET name = ? WHERE id = ?', [values.name, userId]);

    // directors, producers, admins and film fans have only the name to edit
    if (locals.user.role !== 'actor') {
      redirect(303, `/user/${locals.user.username}/edit?saved=1`);
    }

    // ---- actor profile ----
    if (!['available', 'on_set', 'booked'].includes(values.availability)) {
      return bad('Invalid availability.');
    }
    if (values.gender && !['female', 'male', 'other'].includes(values.gender)) {
      return bad('Invalid gender.');
    }

    let birthDate = null;
    if (values.birth_date) {
      const parsed = new Date(`${values.birth_date}T00:00:00Z`);
      const valid =
        /^\d{4}-\d{2}-\d{2}$/.test(values.birth_date) &&
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === values.birth_date &&
        values.birth_date >= '1900-01-01' &&
        values.birth_date <= new Date().toISOString().slice(0, 10);
      if (!valid) return bad('Enter a valid birth date (not in the future).');
      birthDate = values.birth_date;
    }

    const height = readInt(values.height_cm, 50, 250);
    if (height === undefined) return bad('Height must be between 50 and 250 cm.');
    const weight = readInt(values.weight_kg, 20, 300);
    if (weight === undefined) return bad('Weight must be between 20 and 300 kg.');

    if (values.eye_color.length > 20) return bad('Eye color: at most 20 characters.');
    if (values.hair_color.length > 20) return bad('Hair color: at most 20 characters.');
    if (values.city.length > 80) return bad('City: at most 80 characters.');
    if (values.education.length > 200) return bad('Education: at most 200 characters.');
    if (values.bio.length > 3000) return bad('Bio: at most 3000 characters.');
    if (values.awards.length > 2000) return bad('Awards: at most 2000 characters.');

    // only languages that really exist
    let languageIds = [...new Set(values.languages)];
    if (languageIds.length > 0) {
      const [found] = await db.execute(
        `SELECT id FROM languages WHERE id IN (${languageIds.map(() => '?').join(',')})`,
        languageIds
      );
      languageIds = found.map((row) => row.id);
    }

    // ---- save ----
    // insert the profile row if it is missing, otherwise update it
    await db.execute(
      `INSERT INTO actor_profiles
         (user_id, birth_date, gender, height_cm, weight_kg, eye_color, hair_color,
          city, education, awards, bio, availability)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         birth_date = VALUES(birth_date), gender = VALUES(gender),
         height_cm = VALUES(height_cm), weight_kg = VALUES(weight_kg),
         eye_color = VALUES(eye_color), hair_color = VALUES(hair_color),
         city = VALUES(city), education = VALUES(education),
         awards = VALUES(awards), bio = VALUES(bio),
         availability = VALUES(availability)`,
      [
        userId,
        birthDate,
        textOrNull(values.gender),
        height,
        weight,
        textOrNull(values.eye_color),
        textOrNull(values.hair_color),
        textOrNull(values.city),
        textOrNull(values.education),
        textOrNull(values.awards),
        textOrNull(values.bio),
        values.availability
      ]
    );

    // languages: remove the ones that were unchecked, add the new ones
    if (languageIds.length === 0) {
      await db.execute('DELETE FROM actor_languages WHERE actor_id = ?', [userId]);
    } else {
      const marks = languageIds.map(() => '?').join(',');
      await db.execute(
        `DELETE FROM actor_languages WHERE actor_id = ? AND language_id NOT IN (${marks})`,
        [userId, ...languageIds]
      );
      await db.execute(
        `INSERT IGNORE INTO actor_languages (actor_id, language_id)
         VALUES ${languageIds.map(() => '(?, ?)').join(',')}`,
        languageIds.flatMap((id) => [userId, id])
      );
    }

    redirect(303, `/user/${locals.user.username}/edit?saved=1`);
  }
};