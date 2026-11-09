import { db } from '$lib/server/database.js';

export async function load({ locals }) {
  const [films] = await db.execute(
    `SELECT id, title, year, description, poster_url, stage, casting_deadline
     FROM films
     WHERE published = 1
     ORDER BY casting_deadline IS NULL, casting_deadline ASC, year DESC`
  );

  // films the logged-in user applied for: { filmId: 'pending' | 'accepted' | 'declined' }
  let applications = {};
  if (locals.user) {
    const [rows] = await db.execute(
      `SELECT film_id, status
       FROM messages
       WHERE sender_id = ? AND type = 'application' AND film_id IS NOT NULL`,
      [locals.user.id]
    );
    applications = Object.fromEntries(rows.map((row) => [row.film_id, row.status]));
  }

  return { films, applications };
}