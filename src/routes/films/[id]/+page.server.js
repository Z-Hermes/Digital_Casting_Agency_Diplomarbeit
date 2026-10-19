import { error } from '@sveltejs/kit';
import { db } from '$lib/server/database.js';

export async function load({ params }) {
  const [filmRows] = await db.execute(
    `SELECT id, title, year, description, poster_url, trailer_url, published,
     stage, casting_deadline
     FROM films
     WHERE id = ?`,
    [params.id]
  );

  const film = filmRows[0];
  if (!film || !film.published) {
    throw error(404, 'Film not found');
  }

  const [cast] = await db.execute(
    `SELECT u.username, u.name, u.avatar_url, fc.role_name
     FROM film_cast fc
     JOIN users u ON u.id = fc.actor_id
     WHERE fc.film_id = ?`,
    [params.id]
  );

  return { film, cast };
}