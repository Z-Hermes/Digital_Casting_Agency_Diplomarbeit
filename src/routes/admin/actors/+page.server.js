import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/database.js';
import { requireAdmin } from '$lib/server/admin.js';

export async function load({ locals, url }) {
	requireAdmin(locals);

	const search = url.searchParams.get('search') ?? '';

	let query = `
		SELECT u.id, u.username, u.name, u.email, u.avatar_url, u.blocked,
		       ap.city, ap.availability,
		       TIMESTAMPDIFF(YEAR, ap.birth_date, CURDATE()) AS age
		FROM users u
		LEFT JOIN actor_profiles ap ON ap.user_id = u.id
		WHERE u.role = 'actor'
	`;
	const params = [];

	if (search) {
		query += ' AND (u.name LIKE ? OR u.username LIKE ? OR u.email LIKE ?)';
		params.push(`%${search}%`, `%${search}%`, `%${search}%`);
	}

	// active actors first, then alphabetically
	query += ' ORDER BY u.blocked ASC, u.name ASC';

	const [actors] = await db.execute(query, params);

	return { actors, search };
}

// finds an actor by the id sent with the form (only actors, never admins or directors)
async function findActor(request) {
	const form = await request.formData();
	const id = Number(form.get('id'));

	const [rows] = await db.execute(
		`SELECT id, name, email, blocked FROM users WHERE id = ? AND role = 'actor'`,
		[id]
	);

	return rows[0] ?? null;
}

export const actions = {
	// deactivate <-> activate (uses the "blocked" column, nothing is deleted)
	toggleBlocked: async ({ request, locals }) => {
		requireAdmin(locals);

		const actor = await findActor(request);
		if (!actor) {
			return fail(404, { error: 'Actor not found.' });
		}

		const blocked = actor.blocked ? 0 : 1;
		await db.execute('UPDATE users SET blocked = ? WHERE id = ?', [blocked, actor.id]);

		// a deactivated actor is logged out everywhere
		if (blocked) {
			await db.execute('DELETE FROM sessions WHERE user_id = ?', [actor.id]);
		}

		return {
			message: blocked ? `${actor.name} was deactivated.` : `${actor.name} is active again.`
		};
	}
};