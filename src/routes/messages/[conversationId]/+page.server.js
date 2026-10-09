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

  const [messages] = await db.execute(
    `SELECT id, sender_id, body, type, created_at
     FROM messages
     WHERE conversation_id = ?
     ORDER BY created_at ASC`,
    [conversationId]
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

export const actions = {
  default: async ({ request, params, locals }) => {
    if (!locals.user) {
      throw redirect(303, '/login');
    }

    const form = await request.formData();
    const body = form.get('body');

    if (!body || body.trim() === '') {
      return fail(400, { error: 'Message cannot be empty.' });
    }

    const conversationId = params.conversationId;
    const userId = locals.user.id;

    const [convRows] = await db.execute(
      'SELECT user_one_id, user_two_id FROM conversations WHERE id = ?',
      [conversationId]
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
  }
};