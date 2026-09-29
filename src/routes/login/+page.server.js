import { fail, redirect } from '@sveltejs/kit';
import { login } from '$lib/server/auth.js';

export async function actions({ request, cookies }) {
	const form = await request.formData();

	const username = form.get('username');
	const password = form.get('password');

	if (!username || !password) {
		return fail(400, {
			error: 'Please enter your username and password.'
		});
	}

	const result = await login(username, password);

	if (!result) {
		return fail(400, {
			error: 'Invalid username or password.'
		});
	}

	cookies.set('session', result.sessionId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: false,
		maxAge: 60 * 60 * 24 * 7
	});

	throw redirect(303, '/dashboard');
}