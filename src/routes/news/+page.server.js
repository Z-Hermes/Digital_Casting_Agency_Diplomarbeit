import { db } from '$lib/server/database.js';

export async function load() {
  const [news] = await db.execute(
    `SELECT id, title, excerpt, image_url, category, created_at
     FROM news
     ORDER BY created_at DESC`
  );

  return { news };
}