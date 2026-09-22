import { getUserFromSession } from '$lib/server/auth.js';

export async function handle({ event, resolve }) {
	const sessionId = event.cookies.get('session');

	if (sessionId) {
		event.locals.user = await getUserFromSession(sessionId);
	} else {
		event.locals.user = null;
	}

	return resolve(event);
}