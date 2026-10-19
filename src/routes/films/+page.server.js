import { db } from '$lib/server/database.js';

export async function load() {
  const [films] = await db.execute(
    `SELECT id, title, year, description, poster_url
     FROM films
     WHERE published = 1
     ORDER BY year DESC`
  );

  return { films };
}