import { fail } from '@sveltejs/kit';
import { db } from './database.js';
import { checkImage, saveImage, deleteImage } from './uploads.js';

// Photo actions used by BOTH the admin edit page and the actor's "My photos" page.
// userId = whose photos are changed (checked by the page before calling these).

const MAX_GALLERY = 20;

// loads the profile picture and the gallery photos of a user
export async function loadPhotos(userId) {
	const [users] = await db.execute('SELECT avatar_url FROM users WHERE id = ?', [userId]);
	const [photos] = await db.execute(
		`SELECT id, url FROM media WHERE user_id = ? AND type = 'photo' ORDER BY sort_order ASC, id ASC`,
		[userId]
	);
	return { avatarUrl: users[0]?.avatar_url ?? null, photos };
}

// new profile picture (the old uploaded one is deleted)
export async function uploadAvatar(userId, formData) {
	const file = formData.get('photo');
	const problem = checkImage(file);
	if (problem) return fail(400, { photoError: problem });

	let url;
	try {
		url = await saveImage(file);
	} catch {
		return fail(400, { photoError: 'This file is not a valid picture.' });
	}

	const [users] = await db.execute('SELECT avatar_url FROM users WHERE id = ?', [userId]);
	await db.execute('UPDATE users SET avatar_url = ? WHERE id = ?', [url, userId]);
	await deleteImage(users[0]?.avatar_url);

	return { photoMessage: 'Profile picture updated.' };
}

// back to the default picture
export async function removeAvatar(userId) {
	const [users] = await db.execute('SELECT avatar_url FROM users WHERE id = ?', [userId]);
	await db.execute('UPDATE users SET avatar_url = NULL WHERE id = ?', [userId]);
	await deleteImage(users[0]?.avatar_url);

	return { photoMessage: 'Profile picture removed.' };
}

// one or more gallery photos at once
export async function uploadGallery(userId, formData) {
	const files = formData.getAll('photos').filter((f) => typeof f !== 'string' && f.size > 0);
	if (files.length === 0) return fail(400, { photoError: 'Please choose at least one picture.' });

	const [count] = await db.execute(
		`SELECT COUNT(*) AS total, COALESCE(MAX(sort_order), 0) AS last FROM media WHERE user_id = ? AND type = 'photo'`,
		[userId]
	);
	if (count[0].total + files.length > MAX_GALLERY) {
		return fail(400, { photoError: `A gallery can have at most ${MAX_GALLERY} photos.` });
	}

	// check every file first, so either all or none are saved
	for (const file of files) {
		const problem = checkImage(file);
		if (problem) return fail(400, { photoError: `${file.name}: ${problem}` });
	}

	let sortOrder = Number(count[0].last);
	for (const file of files) {
		let url;
		try {
			url = await saveImage(file);
		} catch {
			return fail(400, { photoError: `${file.name}: this file is not a valid picture.` });
		}
		sortOrder++;
		await db.execute(
			`INSERT INTO media (user_id, type, url, size, sort_order) VALUES (?, 'photo', ?, 'narrow', ?)`,
			[userId, url, sortOrder]
		);
	}

	return { photoMessage: files.length === 1 ? 'Photo added.' : `${files.length} photos added.` };
}

// delete one gallery photo (only if it belongs to this user)
export async function deletePhoto(userId, formData) {
	const photoId = Number(formData.get('photoId'));

	const [rows] = await db.execute('SELECT id, url FROM media WHERE id = ? AND user_id = ?', [
		photoId,
		userId
	]);
	if (rows.length === 0) return fail(404, { photoError: 'Photo not found.' });

	await db.execute('DELETE FROM media WHERE id = ?', [photoId]);
	await deleteImage(rows[0].url);

	return { photoMessage: 'Photo deleted.' };
}