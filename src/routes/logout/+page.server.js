import { redirect } from '@sveltejs/kit';
import { logout } from '$lib/server/auth';

export function load() {
	redirect(303, '/');
}

export const actions = {
	default: async ({ cookies }) => {
		const sessionId = cookies.get('session');

		if (sessionId) {
			await logout(sessionId);
		}

		cookies.delete('session', { path: '/' });

		redirect(303, '/login');
	}
};