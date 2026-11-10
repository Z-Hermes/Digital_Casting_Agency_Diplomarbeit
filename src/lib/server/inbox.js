import { db } from '$lib/server/database.js';

// Finds the conversation between two users, or creates it. Returns its id.
export async function getConversation(userA, userB) {
	const [rows] = await db.execute(
		`SELECT id FROM conversations
		 WHERE (user_one_id = ? AND user_two_id = ?)
		    OR (user_one_id = ? AND user_two_id = ?)`,
		[userA, userB, userB, userA]
	);
	if (rows.length > 0) {
		return rows[0].id;
	}

	// smaller id first, so the pair is always stored the same way
	const [result] = await db.execute(
		'INSERT INTO conversations (user_one_id, user_two_id) VALUES (?, ?)',
		[Math.min(userA, userB), Math.max(userA, userB)]
	);
	return result.insertId;
}

// Puts a message into the recipient's inbox.
export async function sendMessage(senderId, recipientId, subject, body) {
	const conversationId = await getConversation(senderId, recipientId);
	await db.execute(
		`INSERT INTO messages (conversation_id, sender_id, recipient_id, type, subject, body)
		 VALUES (?, ?, ?, 'message', ?, ?)`,
		[conversationId, senderId, recipientId, subject, body]
	);
	return conversationId;
}