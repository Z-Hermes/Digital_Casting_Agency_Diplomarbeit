import { error } from '@sveltejs/kit';
import { db } from '$lib/server/database.js';

export async function load({ params }) {
  const [rows] = await db.execute(
    `SELECT n.id, n.title, n.body, n.image_url, n.category, n.created_at, u.name AS author_name
     FROM news n
     LEFT JOIN users u ON u.id = n.author_id
     WHERE n.id = ?`,
    [params.id]
  );

  const article = rows[0];
  if (!article) {
    throw error(404, 'Article not found');
  }

  return { article };
}