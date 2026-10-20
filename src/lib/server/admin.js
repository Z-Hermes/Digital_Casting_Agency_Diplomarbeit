import { error, redirect } from '@sveltejs/kit';

// Stops everyone who is not a logged-in admin.
// Use it in every load AND every form action of an admin page:
// a check in +layout.server.js alone does NOT protect form actions.
export function requireAdmin(locals) {
	if (!locals.user) {
		redirect(303, '/login');
	}

	if (locals.user.role !== 'admin') {
		error(403, 'Only admins can open this page.');
	}

	return locals.user;
}