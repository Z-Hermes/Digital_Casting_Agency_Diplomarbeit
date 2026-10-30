import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/database.js';
import { requireAdmin } from '$lib/server/admin.js';
import { loadPhotos, uploadAvatar, removeAvatar, uploadGallery, deletePhoto } from '$lib/server/photos.js';

export async function load({ locals, params }) {
	requireAdmin(locals);

	const [rows] = await db.execute(
		`SELECT u.id, u.username, u.name, u.email, u.avatar_url, u.blocked,
		        DATE_FORMAT(ap.birth_date, '%Y-%m-%d') AS birth_date,
		        ap.gender, ap.height_cm, ap.weight_kg, ap.eye_color, ap.hair_color,
		        ap.city, ap.education, ap.awards, ap.bio, ap.availability
		 FROM users u
		 LEFT JOIN actor_profiles ap ON ap.user_id = u.id
		 WHERE u.id = ? AND u.role = 'actor'`,
		[params.id]
	);

	const actor = rows[0];
	if (!actor) {
		error(404, 'Actor not found');
	}

		return { actor, ...(await loadPhotos(actor.id)) };
}

// makes sure the id in the URL belongs to an actor
async function requireActor(id) {
	const [rows] = await db.execute(`SELECT id FROM users WHERE id = ? AND role = 'actor'`, [id]);
	if (rows.length === 0) {
		error(404, 'Actor not found');
	}
}


// empty text field -> NULL in the database
function textOrNull(value) {
	const text = String(value ?? '').trim();
	return text === '' ? null : text;
}

// empty or invalid number field -> NULL
function numberOrNull(value) {
	const number = parseInt(value, 10);
	return Number.isNaN(number) ? null : number;
}

export const actions = {
	save: async ({ request, locals, params }) => {
		requireAdmin(locals);

		const form = await request.formData();
		const values = Object.fromEntries(form);

		const name = textOrNull(values.name);
		const username = textOrNull(values.username)?.toLowerCase();
		const email = textOrNull(values.email)?.toLowerCase();
		const gender = textOrNull(values.gender);
		const availability = values.availability || 'available';

		// ---- check the input ----
		if (!name || !username || !email) {
			return fail(400, { error: 'Name, username and email are required.', values });
		}
		if (!/^[a-z0-9_-]{3,40}$/.test(username)) {
			return fail(400, {
				error: 'Username: 3-40 characters, only a-z, 0-9, _ and -.',
				values
			});
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(400, { error: 'Please enter a valid email address.', values });
		}
		if (gender && !['female', 'male', 'other'].includes(gender)) {
			return fail(400, { error: 'Invalid gender.', values });
		}
		if (!['available', 'on_set', 'booked'].includes(availability)) {
			return fail(400, { error: 'Invalid availability.', values });
		}

		// username and email must not belong to another user
		const [taken] = await db.execute(
			'SELECT id FROM users WHERE (username = ? OR email = ?) AND id <> ?',
			[username, email, params.id]
		);
		if (taken.length > 0) {
			return fail(400, { error: 'This username or email is already used by someone else.', values });
		}

		// make sure we only edit actors
		const [actorRows] = await db.execute(`SELECT id FROM users WHERE id = ? AND role = 'actor'`, [
			params.id
		]);
		if (actorRows.length === 0) {
			error(404, 'Actor not found');
		}

		// ---- save ----
		await db.execute('UPDATE users SET name = ?, username = ?, email = ? WHERE id = ?', [
			name,
			username,
			email,
			params.id
		]);

		// actor_profiles: insert the row if it does not exist yet, otherwise update it
		await db.execute(
			`INSERT INTO actor_profiles
			   (user_id, birth_date, gender, height_cm, weight_kg, eye_color, hair_color,
			    city, education, awards, bio, availability)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			 ON DUPLICATE KEY UPDATE
			   birth_date = VALUES(birth_date), gender = VALUES(gender),
			   height_cm = VALUES(height_cm), weight_kg = VALUES(weight_kg),
			   eye_color = VALUES(eye_color), hair_color = VALUES(hair_color),
			   city = VALUES(city), education = VALUES(education),
			   awards = VALUES(awards), bio = VALUES(bio),
			   availability = VALUES(availability)`,
			[
				params.id,
				textOrNull(values.birth_date),
				gender,
				numberOrNull(values.height_cm),
				numberOrNull(values.weight_kg),
				textOrNull(values.eye_color),
				textOrNull(values.hair_color),
				textOrNull(values.city),
				textOrNull(values.education),
				textOrNull(values.awards),
				textOrNull(values.bio),
				availability
			]
		);

			redirect(303, `/admin/actors/${params.id}?saved=1`);
	},

	avatar: async ({ request, locals, params }) => {
		requireAdmin(locals);
		await requireActor(params.id);
			return uploadAvatar(params.id, await request.formData());
	},

	removeAvatar: async ({ locals, params }) => {
		requireAdmin(locals);
		await requireActor(params.id);
				return removeAvatar(params.id);
	},

	gallery: async ({ request, locals, params }) => {
		requireAdmin(locals);
		await requireActor(params.id);
				return uploadGallery(params.id, await request.formData());
	},

	deletePhoto: async ({ request, locals, params }) => {
		requireAdmin(locals);
		await requireActor(params.id);
		return deletePhoto(params.id, await request.formData());
	}
};