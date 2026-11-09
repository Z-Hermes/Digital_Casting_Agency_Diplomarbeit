import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/database.js';
import { uploadAvatar } from '$lib/server/photos.js';

export async function load({ params, locals }) {
  const [userRows] = await db.execute(
    `SELECT u.id, u.username, u.name, u.role, u.avatar_url, u.blocked, u.created_at,
            ap.birth_date, ap.gender, ap.height_cm, ap.weight_kg,
            ap.eye_color, ap.hair_color, ap.city, ap.education,
            ap.awards, ap.bio, ap.cv_url, ap.availability
     FROM users u
     LEFT JOIN actor_profiles ap ON ap.user_id = u.id
     WHERE u.username = ?`,
    [params.username]
  );

  const profile = userRows[0];
  if (!profile || profile.blocked) {
    throw error(404, 'Profile not found');
  }

  const isOwner = locals.user?.id === profile.id;

  // ---- data that depends on the role of the profile ----
  let languages = [];
  let credits = [];
  let films = [];
  let jobs = [];

  if (profile.role === 'actor') {
    const [langRows] = await db.execute(
      `SELECT l.name
       FROM actor_languages al
       JOIN languages l ON l.id = al.language_id
       WHERE al.actor_id = ?`,
      [profile.id]
    );
    languages = langRows.map((l) => l.name);

    [credits] = await db.execute(
      `SELECT id, title, year, role_name, poster_url
       FROM credits
       WHERE actor_id = ?
       ORDER BY year DESC`,
      [profile.id]
    );
  }

  if (profile.role === 'director' || profile.role === 'producer') {
    // films this person added (producer_id = owner of the film)
    [films] = await db.execute(
      `SELECT id, title, year, stage, poster_url
       FROM films
       WHERE producer_id = ? AND published = 1
       ORDER BY year DESC, id DESC`,
      [profile.id]
    );

    // open job posts of this person
    [jobs] = await db.execute(
      `SELECT id, title, production_type, city, deadline
       FROM jobs
       WHERE created_by = ? AND status = 'open'
       ORDER BY created_at DESC`,
      [profile.id]
    );
  }

  const [media] = await db.execute(
    `SELECT id, type, url, size
     FROM media
     WHERE user_id = ?
     ORDER BY sort_order ASC`,
    [profile.id]
  );

  return {
    profile,
    isOwner,
    languages,
    credits,
    films,
    jobs,
    media
  };
}

// The profile picture may only be changed by the owner of the profile (any role).
// The id comes from the login, never from the form, so nobody can change
// the photos of somebody else.
function requireOwner({ locals, params }) {
  if (!locals.user) {
    redirect(303, '/login');
  }
  if (locals.user.username.toLowerCase() !== params.username.toLowerCase()) {
    error(403, 'You can only change your own profile picture.');
  }
  return locals.user.id;
}

export const actions = {
  avatar: async (event) => {
    const userId = requireOwner(event);
    return uploadAvatar(userId, await event.request.formData());
  }
};