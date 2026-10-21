import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/database.js';

export async function load({ params, locals }) {
  const [filmRows] = await db.execute('SELECT * FROM films WHERE id = ? AND published = 1', [params.id]);
  const film = filmRows[0];

  if (!film) {
    throw redirect(303, '/films');
  }

  const [cast] = await db.execute(`
    SELECT u.name, fc.role_name, u.username, u.avatar_url 
    FROM film_cast fc 
    JOIN users u ON fc.actor_id = u.id 
    WHERE fc.film_id = ?
  `, [params.id]);

  let application = null;
  if (locals.user) {
    const [rows] = await db.execute(
      'SELECT status FROM film_applications WHERE film_id = ? AND actor_id = ?',
      [params.id, locals.user.id]
    );
    application = rows[0] ?? null;
  }

  return { film, cast, application };
}

export const actions = {
  apply: async ({ request, params, locals }) => {
    if (!locals.user) return redirect(303, '/login');

    if (locals.user.role !== 'actor') {
      return fail(403, { error: 'Nur Schauspieler können sich bewerben.' });
    }

    const [films] = await db.execute(
      'SELECT title, stage, casting_deadline FROM films WHERE id = ? AND published = 1',
      [params.id]
    );
    const film = films[0];

    if (!film) return fail(404, { error: 'Film nicht gefunden.' });

    const today = new Date().toISOString().slice(0, 10);
    const deadline = film.casting_deadline
      ? new Date(film.casting_deadline).toISOString().slice(0, 10)
      : null;

    if (film.stage !== 'casting' || (deadline && deadline < today)) {
      return fail(400, { error: 'Das Casting ist geschlossen.' });
    }

    const data = await request.formData();
    const message = data.get('message')?.toString().trim() ?? '';

    if (message.length > 1000) {
      return fail(400, { error: 'Die Nachricht ist zu lang (max. 1000 Zeichen).' });
    }

    try {
      // 1. In film_applications speichern
      await db.execute(
        'INSERT IGNORE INTO film_applications (film_id, actor_id, message) VALUES (?, ?, ?)',
        [params.id, locals.user.id, message]
      );

      // 2. Passenden Job (ID und created_by) anhand des Filmtitels ermitteln
      const [jobRows] = await db.execute(
        'SELECT id, created_by FROM jobs WHERE title LIKE ? LIMIT 1',
        [`%${film.title}%`]
      );
      
      const jobId = jobRows.length > 0 ? jobRows[0].id : null;
      const recipientId = jobRows.length > 0 && jobRows[0].created_by ? jobRows[0].created_by : 12;

      if (recipientId === locals.user.id) {
        return { success: true };
      }

      const userOne = Math.min(locals.user.id, recipientId);
      const userTwo = Math.max(locals.user.id, recipientId);

      // 3. Konversation sicherstellen
      await db.execute(
        'INSERT IGNORE INTO conversations (user_one_id, user_two_id) VALUES (?, ?)',
        [userOne, userTwo]
      );

      const [convRows] = await db.execute(
        'SELECT id FROM conversations WHERE user_one_id = ? AND user_two_id = ?',
        [userOne, userTwo]
      );
      const conversationId = convRows[0].id;

      // 4. Nachricht mit der korrekten job_id (oder NULL) einfügen
      await db.execute(
        `INSERT INTO messages (conversation_id, sender_id, recipient_id, job_id, type, subject, body, status, created_at) 
         VALUES (?, ?, ?, ?, 'application', ?, ?, 'pending', NOW())`,
        [
          conversationId, 
          locals.user.id, 
          recipientId,
          jobId, 
          `Bewerbung: ${film.title}`, 
          message || 'Keine Nachricht angegeben.'
        ]
      );

    } catch (err) {
      console.error(err);
      return fail(500, { error: 'Fehler beim Speichern der Bewerbung.' });
    }

    return { success: true };
  }
};