import { db } from '$lib/server/database.js';

export async function load({ url }) {
  const city = url.searchParams.get('city') ?? '';
  const gender = url.searchParams.get('gender') ?? '';
  const availability = url.searchParams.get('availability') ?? '';
  const search = url.searchParams.get('search') ?? '';

  let query = `
    SELECT u.id, u.username, u.name, u.avatar_url,
           ap.city, ap.gender, ap.availability
    FROM users u
    JOIN actor_profiles ap ON ap.user_id = u.id
    WHERE u.role = 'actor' AND u.blocked = 0
  `;
  const params = [];

  if (city) {
    query += ' AND ap.city = ?';
    params.push(city);
  }
  if (gender) {
    query += ' AND ap.gender = ?';
    params.push(gender);
  }
  if (availability) {
    query += ' AND ap.availability = ?';
    params.push(availability);
  }
  if (search) {
    query += ' AND u.name LIKE ?';
    params.push(`%${search}%`);
  }

  query += ' ORDER BY u.name ASC';

  const [actors] = await db.execute(query, params);

  return { actors, filters: { city, gender, availability, search } };
}