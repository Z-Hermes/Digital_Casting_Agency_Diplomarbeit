import { db } from '$lib/server/database.js';

export async function load() {
  const [films] = await db.execute(
    `SELECT id, title, year, description, poster_url, stage, casting_deadline
     FROM films
     WHERE published = 1
     ORDER BY casting_deadline IS NULL, casting_deadline ASC, year DESC`
  );

  return { films };
}