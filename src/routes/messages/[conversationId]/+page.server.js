import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/database.js';

export async function load({ params, locals }) {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const userId = locals.user.id;
  const conversationId = params.conversationId;

  const [convRows] = await db.execute(
    `SELECT c.id, c.user_one_id, c.user_two_id,
            CASE WHEN c.user_one_id = ? THEN u2.name ELSE u1.name END AS other_name
     FROM conversations c
     JOIN users u1 ON u1.id = c.user_one_id
     JOIN users u2 ON u2.id = c.user_two_id
     WHERE c.id = ? AND (c.user_one_id = ? OR c.user_two_id = ?)`,
    [userId, conversationId, userId, userId]
  );

  const conversation = convRows[0];
  if (!conversation) {
    throw error(404, 'Conversation not found');
  }

  // Applications also need the film title and the actor's profile data.
  const [messages] = await db.execute(
    `SELECT m.id, m.sender_id, m.recipient_id, m.body, m.type, m.subject, m.status, m.film_id, m.created_at,
            f.title        AS film_title,
            u.username     AS sender_username,
            u.name         AS sender_name,
            u.avatar_url   AS sender_avatar,
            ap.city        AS sender_city,
            ap.availability AS sender_availability
     FROM messages m
     LEFT JOIN films f           ON f.id = m.film_id
     LEFT JOIN users u           ON u.id = m.sender_id
     LEFT JOIN actor_profiles ap ON ap.user_id = m.sender_id
     WHERE m.conversation_id = ?
       AND NOT (m.type = 'notice' AND m.sender_id = ?)
     ORDER BY m.created_at ASC`,
    [conversationId, userId]
  );

  // mark incoming messages as read
  await db.execute(
    `UPDATE messages SET read_at = NOW()
     WHERE conversation_id = ? AND recipient_id = ? AND read_at IS NULL`,
    [conversationId, userId]
  );

  return {
    conversation,
    messages,
    currentUserId: userId
  };
}

// Accept or decline an application / invitation.
// Only the RECIPIENT of the message may answer, and only while it is pending.
async function respond({ request, params, locals }, newStatus) {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const form = await request.formData();
  const messageId = Number(form.get('message_id'));
  if (!Number.isInteger(messageId)) {
    return fail(400, { error: 'Invalid request.' });
  }

  const [rows] = await db.execute(
    `SELECT m.id, m.sender_id, m.recipient_id, m.type, m.status,
            f.title AS film_title, j.title AS job_title
     FROM messages m
     LEFT JOIN films f ON f.id = m.film_id
     LEFT JOIN jobs j  ON j.id = m.job_id
     WHERE m.id = ? AND m.conversation_id = ?`,
    [messageId, params.conversationId]
  );
  const msg = rows[0];

  if (
    !msg ||
    msg.recipient_id !== locals.user.id ||
    !['application', 'invitation'].includes(msg.type)
  ) {
    return fail(403, { error: 'You cannot answer this request.' });
  }

  if (msg.status !== 'pending') {
    return fail(400, { error: 'This request was already answered.' });
  }

  await db.execute(
    `UPDATE messages SET status = ? WHERE id = ? AND status = 'pending'`,
    [newStatus, msg.id]
  );

  // A 'notice' is only shown to the person who receives it (the one who
  // answered does not see it, see the load function above).
  const title = msg.film_title ?? msg.job_title;
  const verb = newStatus === 'accepted' ? 'accepted' : 'declined';
  const text =
    msg.type === 'application'
      ? `Your application${title ? ` for "${title}"` : ''} was ${verb}.`
      : `${locals.user.name} ${verb} your invitation${title ? ` for "${title}"` : ''}.`;

  await db.execute(
    `INSERT INTO messages (conversation_id, sender_id, recipient_id, type, body)
     VALUES (?, ?, ?, 'notice', ?)`,
    [params.conversationId, locals.user.id, msg.sender_id, text]
  );

  return { success: true };
}

export const actions = {
  send: async ({ request, params, locals }) => {
    if (!locals.user) {
      throw redirect(303, '/login');
    }

    const form = await request.formData();
    const body = form.get('body')?.toString() ?? '';

    if (body.trim() === '') {
      return fail(400, { error: 'Message cannot be empty.' });
    }

    const conversationId = params.conversationId;
    const userId = locals.user.id;

    // only members of the conversation may write into it
    const [convRows] = await db.execute(
      `SELECT user_one_id, user_two_id FROM conversations
       WHERE id = ? AND (user_one_id = ? OR user_two_id = ?)`,
      [conversationId, userId, userId]
    );
    const conversation = convRows[0];
    if (!conversation) {
      throw error(404, 'Conversation not found');
    }

    const recipientId =
      conversation.user_one_id === userId ? conversation.user_two_id : conversation.user_one_id;

    await db.execute(
      `INSERT INTO messages (conversation_id, sender_id, recipient_id, type, body)
       VALUES (?, ?, ?, 'message', ?)`,
      [conversationId, userId, recipientId, body.trim()]
    );

    return { success: true };
  },

  accept: (event) => respond(event, 'accepted'),
  decline: (event) => respond(event, 'declined')
};