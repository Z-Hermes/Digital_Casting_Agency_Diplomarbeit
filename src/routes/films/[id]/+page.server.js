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

  // has the logged-in actor already applied? (applications are stored as messages)
  let application = null;
  if (locals.user) {
    const [rows] = await db.execute(
      `SELECT status FROM messages
       WHERE sender_id = ? AND film_id = ? AND type = 'application'`,
      [locals.user.id, params.id]
    );
    application = rows[0] ?? null;
  }

  return { film, cast, application };
}

export const actions = {
  apply: async ({ request, params, locals }) => {
    if (!locals.user) redirect(303, '/login');

    if (locals.user.role !== 'actor') {
      return fail(403, { error: 'Nur Schauspieler können sich bewerben.' });
    }

    const [films] = await db.execute(
      `SELECT id, title, stage, casting_deadline, producer_id
       FROM films WHERE id = ? AND published = 1`,
      [params.id]
    );
    const film = films[0];

    if (!film) return fail(404, { error: 'Film nicht gefunden.' });

    if (!film.producer_id) {
      return fail(400, { error: 'Für diesen Film ist noch kein Producer eingetragen.' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const deadline = film.casting_deadline
      ? new Date(film.casting_deadline).toISOString().slice(0, 10)
      : null;

    if (film.stage !== 'casting' || (deadline && deadline < today)) {
      return fail(400, { error: 'Das Casting ist geschlossen.' });
    }

    const data = await request.formData();
    let message = data.get('message')?.toString().trim() ?? '';

    if (message.length > 1000) {
      return fail(400, { error: 'Die Nachricht ist zu lang (max. 1000 Zeichen).' });
    }

    // the inbox preview needs a text, so use a default if the actor wrote nothing
    if (!message) message = `Ich möchte mich für "${film.title}" bewerben.`;

    const actorId = locals.user.id;
    const producerId = film.producer_id;

    // one conversation per pair of people: the smaller id always goes first
    const userOne = Math.min(actorId, producerId);
    const userTwo = Math.max(actorId, producerId);

    try {
      await db.execute(
        'INSERT IGNORE INTO conversations (user_one_id, user_two_id) VALUES (?, ?)',
        [userOne, userTwo]
      );

      const [convRows] = await db.execute(
        'SELECT id FROM conversations WHERE user_one_id = ? AND user_two_id = ?',
        [userOne, userTwo]
      );
      const conversationId = convRows[0].id;

      // the unique key (sender_id, film_id, type) blocks a second application
      await db.execute(
        `INSERT INTO messages
           (conversation_id, sender_id, recipient_id, film_id, type, subject, body, status)
         VALUES (?, ?, ?, ?, 'application', ?, ?, 'pending')`,
        [conversationId, actorId, producerId, film.id, `Bewerbung: ${film.title}`, message]
      );

      return { success: true, conversationId };
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return fail(400, { error: 'Du hast dich bereits beworben.' });
      }
      console.error(err);
      return fail(500, { error: 'Fehler beim Speichern der Bewerbung.' });
    }
  }
};