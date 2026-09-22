import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { db } from './database.js';

export async function login(username, password) {
	const [rows] = await db.execute(
		`SELECT id, username, email, password_hash, name, role, blocked, avatar_url
		 FROM users
		 WHERE username = ?`,
		[username]
	);

	if (rows.length === 0) {
		return null;
	}

	const user = rows[0];

	// Blocked users cannot log in
	if (user.blocked) {
		return null;
	}

	// Check password
	const passwordCorrect = await bcrypt.compare(password, user.password_hash);

	if (!passwordCorrect) {
		return null;
	}

	// Create session
	const sessionId = randomUUID();

	await db.execute(
		`INSERT INTO sessions (id, user_id, expires_at)
		 VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
		[sessionId, user.id]
	);

	return {
		sessionId,
		user: {
			id: user.id,
			username: user.username,
			email: user.email,
			name: user.name,
			role: user.role,
			avatar_url: user.avatar_url
		}
	};
}

export async function getUserFromSession(sessionId) {
	if (!sessionId) {
		return null;
	}

	const [rows] = await db.execute(
		`SELECT users.id,
		        users.username,
		        users.email,
		        users.name,
		        users.role,
		        users.blocked,
		        users.avatar_url
		 FROM sessions
		 JOIN users ON sessions.user_id = users.id
		 WHERE sessions.id = ?
		   AND sessions.expires_at > NOW()`,
		[sessionId]
	);

	if (rows.length === 0) {
		return null;
	}

	const user = rows[0];

	// Blocked users should no longer be considered logged in
	if (user.blocked) {
		await logout(sessionId);
		return null;
	}

	return {
		id: user.id,
		username: user.username,
		email: user.email,
		name: user.name,
		role: user.role,
		avatar_url: user.avatar_url
	};
}

export async function logout(sessionId) {
	if (!sessionId) {
		return;
	}

	await db.execute(
		'DELETE FROM sessions WHERE id = ?',
		[sessionId]
	);
}