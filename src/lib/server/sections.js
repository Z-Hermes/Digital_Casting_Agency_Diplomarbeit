import { fail } from '@sveltejs/kit';
import { db } from './database.js';
import { checkImage, saveImage, deleteImage } from './uploads.js';

// Sections a user adds to their own profile:
//   text    = a title + a text
//   list    = a title + one item per line (stored in "body")
//   gallery = a title + photos (media rows with this section_id)
// The ORDER of all blocks on the profile is stored in users.profile_layout,
// e.g. "attributes,s4,credits,s7"  (s4 = section with id 4).
// userId always comes from the login (checked by the page), never from the form.

export const SECTION_TYPES = ['text', 'list', 'gallery'];
const MAX_SECTIONS = 20;
const MAX_TITLE = 80;
const MAX_BODY = 5000;
const MAX_PHOTOS_PER_SECTION = 30;

// built-in blocks every profile of this role can have (in default order)
export function builtinBlocks(role) {
	if (role === 'actor') return ['attributes', 'credits', 'photos'];
	if (role === 'director' || role === 'producer') return ['films', 'jobs', 'photos'];
	return ['photos'];
}

// sections of a user, each gallery with its photos
export async function loadSections(userId) {
	const [sections] = await db.execute(
		'SELECT id, type, title, body FROM profile_sections WHERE user_id = ? ORDER BY id ASC',
		[userId]
	);
	const [photos] = await db.execute(
		`SELECT id, section_id, url FROM media
		 WHERE user_id = ? AND type = 'photo' AND section_id IS NOT NULL
		 ORDER BY sort_order ASC, id ASC`,
		[userId]
	);

	return sections.map((section) => ({
		...section,
		key: `s${section.id}`,
		items: section.type === 'list' ? splitLines(section.body) : [],
		photos: photos.filter((photo) => photo.section_id === section.id)
	}));
}

// the saved order, cleaned up: unknown or deleted keys are dropped,
// new blocks / sections are added at the end
export function buildLayout(savedLayout, role, sections) {
	const available = [...builtinBlocks(role), ...sections.map((s) => s.key)];
	const saved = String(savedLayout ?? '')
		.split(',')
		.map((key) => key.trim())
		.filter((key) => available.includes(key));

	const layout = [...new Set(saved)];
	for (const key of available) {
		if (!layout.includes(key)) layout.push(key);
	}
	return layout;
}


// ---------- actions ----------

export async function addSection(userId, formData) {
	const type = String(formData.get('type') ?? '');
	const title = String(formData.get('title') ?? '').trim();

	if (!SECTION_TYPES.includes(type)) {
		return fail(400, { sectionError: 'Please choose text, list or gallery.' });
	}
	if (title === '' || title.length > MAX_TITLE) {
		return fail(400, { sectionError: `The title must be 1-${MAX_TITLE} characters.` });
	}

	const [count] = await db.execute(
		'SELECT COUNT(*) AS total FROM profile_sections WHERE user_id = ?',
		[userId]
	);
	if (count[0].total >= MAX_SECTIONS) {
		return fail(400, { sectionError: `A profile can have at most ${MAX_SECTIONS} sections.` });
	}

	await db.execute('INSERT INTO profile_sections (user_id, type, title) VALUES (?, ?, ?)', [
		userId,
		type,
		title
	]);
	return { sectionMessage: `Section "${title}" added.` };
}

// new title + text (text section) or items (list section)
export async function updateSection(userId, formData) {
	const section = await findSection(userId, formData.get('sectionId'));
	if (!section) return fail(404, { sectionError: 'Section not found.' });

	const title = String(formData.get('title') ?? '').trim();
	const body = String(formData.get('body') ?? '').trim();

	if (title === '' || title.length > MAX_TITLE) {
		return fail(400, { sectionError: `The title must be 1-${MAX_TITLE} characters.` });
	}
	if (body.length > MAX_BODY) {
		return fail(400, { sectionError: `The text can have at most ${MAX_BODY} characters.` });
	}

	await db.execute('UPDATE profile_sections SET title = ?, body = ? WHERE id = ?', [
		title,
		section.type === 'gallery' ? null : body || null,
		section.id
	]);
	return { sectionMessage: `Section "${title}" saved.` };
}

// deletes the section, its photos and their files
export async function deleteSection(userId, formData) {
	const section = await findSection(userId, formData.get('sectionId'));
	if (!section) return fail(404, { sectionError: 'Section not found.' });

	const [photos] = await db.execute('SELECT url FROM media WHERE section_id = ?', [section.id]);
	await db.execute('DELETE FROM profile_sections WHERE id = ?', [section.id]); // media rows: ON DELETE CASCADE
	for (const photo of photos) {
		await deleteImage(photo.url);
	}
	return { sectionMessage: `Section "${section.title}" deleted.` };
}

// one or more photos into a gallery section
export async function uploadSectionPhotos(userId, formData) {
	const section = await findSection(userId, formData.get('sectionId'));
	if (!section || section.type !== 'gallery') {
		return fail(404, { sectionError: 'Gallery not found.' });
	}

	const files = formData.getAll('photos').filter((f) => typeof f !== 'string' && f.size > 0);
	if (files.length === 0) return fail(400, { sectionError: 'Please choose at least one picture.' });

	const [count] = await db.execute(
		'SELECT COUNT(*) AS total, COALESCE(MAX(sort_order), 0) AS last FROM media WHERE section_id = ?',
		[section.id]
	);
	if (count[0].total + files.length > MAX_PHOTOS_PER_SECTION) {
		return fail(400, {
			sectionError: `A gallery can have at most ${MAX_PHOTOS_PER_SECTION} photos.`
		});
	}

	// check every file first, so either all or none are saved
	for (const file of files) {
		const problem = checkImage(file);
		if (problem) return fail(400, { sectionError: `${file.name}: ${problem}` });
	}

	let sortOrder = Number(count[0].last);
	for (const file of files) {
		let url;
		try {
			url = await saveImage(file);
		} catch {
			return fail(400, { sectionError: `${file.name}: this file is not a valid picture.` });
		}
		sortOrder++;
		await db.execute(
			`INSERT INTO media (user_id, section_id, type, url, size, sort_order)
			 VALUES (?, ?, 'photo', ?, 'narrow', ?)`,
			[userId, section.id, url, sortOrder]
		);
	}

	return {
		sectionMessage: files.length === 1 ? 'Photo added.' : `${files.length} photos added.`
	};
}

// saves the new order of the blocks (only keys that really exist)
export async function saveLayout(userId, role, formData) {
	const sections = await loadSections(userId);
	const layout = buildLayout(formData.get('layout'), role, sections);

	await db.execute('UPDATE users SET profile_layout = ? WHERE id = ?', [layout.join(','), userId]);
	return { sectionMessage: 'Order saved.' };
}

// "a\n\nb\n" -> ["a", "b"]
function splitLines(text) {
	return String(text ?? '')
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line !== '');
}


// a section of THIS user (null if it does not exist or belongs to someone else)
async function findSection(userId, sectionId) {
	const [rows] = await db.execute(
		'SELECT id, type, title FROM profile_sections WHERE id = ? AND user_id = ?',
		[Number(sectionId), userId]
	);
	return rows[0] ?? null;
}