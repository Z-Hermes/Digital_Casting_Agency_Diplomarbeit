import { error } from '@sveltejs/kit';
import { db } from '$lib/server/database.js';

export async function load({ params }) {
  const [userRows] = await db.execute(
    `SELECT u.id, u.username, u.name, u.role, u.avatar_url, u.blocked,
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

  const [languages] = await db.execute(
    `SELECT l.name
     FROM actor_languages al
     JOIN languages l ON l.id = al.language_id
     WHERE al.actor_id = ?`,
    [profile.id]
  );

  const [credits] = await db.execute(
    `SELECT id, title, year, role_name, poster_url
     FROM credits
     WHERE actor_id = ?
     ORDER BY year DESC`,
    [profile.id]
  );

  const [media] = await db.execute(
    `SELECT id, type, url, size
     FROM media
     WHERE user_id = ?
     ORDER BY sort_order ASC`,
    [profile.id]
  );

  return {
    profile,
    languages: languages.map((l) => l.name),
    credits,
    media
  };
}