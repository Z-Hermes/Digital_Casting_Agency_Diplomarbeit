import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/database.js';

export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const userId = locals.user.id;

  const [conversations] = await db.execute(
    `SELECT
       c.id,
       CASE WHEN c.user_one_id = ? THEN c.user_two_id ELSE c.user_one_id END AS other_id,
       CASE WHEN c.user_one_id = ? THEN u2.name ELSE u1.name END AS other_name,
       CASE WHEN c.user_one_id = ? THEN u2.username ELSE u1.username END AS other_username,
       (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_body,
       (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_date,
       (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.recipient_id = ? AND m.read_at IS NULL) AS unread_count
     FROM conversations c
     JOIN users u1 ON u1.id = c.user_one_id
     JOIN users u2 ON u2.id = c.user_two_id
     WHERE c.user_one_id = ? OR c.user_two_id = ?
     ORDER BY last_date DESC`,
    [userId, userId, userId, userId, userId, userId]
  );

  return { conversations };
}