import { db } from '$lib/server/database.js';

// Featured actors = the actors with the most bookings (see the bookings table)
export async function load() {
  const [actors] = await db.execute(
    `SELECT u.username, u.name, u.avatar_url, ap.availability,
            TIMESTAMPDIFF(YEAR, ap.birth_date, CURDATE()) AS age,
            COUNT(b.id) AS booking_count
     FROM users u
     JOIN actor_profiles ap ON ap.user_id = u.id
     LEFT JOIN bookings b ON b.actor_id = u.id
     WHERE u.role = 'actor' AND u.blocked = 0
     GROUP BY u.id, u.username, u.name, u.avatar_url, ap.availability, ap.birth_date
     ORDER BY booking_count DESC, u.name ASC
     LIMIT 8`
  );

  return { actors };
}