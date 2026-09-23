import { fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcrypt';
import { db } from '$lib/server/database.js';

export async function actions({ request }) {
	const form = await request.formData();

	const name = form.get('name');
	const username = form.get('username');
	const email = form.get('email');
	const password = form.get('password');
	const role = form.get('role');

	if (!name || !username || !email || !password || !role) {
		return fail(400, {
			error: 'Please fill in all fields.'
		});
	}

	if (password.length < 6) {
		return fail(400, {
			error: 'Password must be at least 6 characters.'
		});
	}

	const [existingUser] = await db.execute(
		'SELECT id FROM users WHERE username = ? OR email = ?',
		[username, email]
	);

	if (existingUser.length > 0) {
		return fail(400, {
			error: 'Username or email already exists.'
		});
	}

	const passwordHash = await bcrypt.hash(password, 10);

	await db.execute(
		`INSERT INTO users (username, email, password_hash, name, role)
		 VALUES (?, ?, ?, ?, ?)`,
		[username, email, passwordHash, name, role]
	);

	throw redirect(303, '/login');
}