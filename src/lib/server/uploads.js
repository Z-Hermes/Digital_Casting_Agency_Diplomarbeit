import { mkdir, writeFile, unlink } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// All uploaded pictures are saved in the folder "uploads" in the project
// and shown through the route /uploads/[file] (see src/routes/uploads).
export const UPLOAD_DIR = path.resolve('uploads');

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// which file types are allowed + the first bytes every real file of that type starts with
const IMAGE_TYPES = {
	'image/jpeg': { ext: 'jpg', check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
	'image/png': { ext: 'png', check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
	'image/webp': {
		ext: 'webp',
		check: (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP'
	}
};

// Checks the uploaded file. Returns an error text, or null if it is OK.
export function checkImage(file) {
	if (!file || typeof file === 'string' || file.size === 0) {
		return 'Please choose a picture.';
	}
	if (file.size > MAX_SIZE) {
		return 'The picture is too big (max. 5 MB).';
	}
	if (!IMAGE_TYPES[file.type]) {
		return 'Only JPG, PNG or WebP pictures are allowed.';
	}
	return null;
}

// Saves a checked picture with a random name and returns its URL, e.g. /uploads/3f2a...c1.jpg
export async function saveImage(file) {
	const type = IMAGE_TYPES[file.type];
	const bytes = Buffer.from(await file.arrayBuffer());

	// the content must really be a picture (a renamed .exe would fail here)
	if (!type || !type.check(bytes)) {
		throw new Error('INVALID_IMAGE');
	}

	await mkdir(UPLOAD_DIR, { recursive: true });

	const fileName = `${crypto.randomUUID()}.${type.ext}`;
	await writeFile(path.join(UPLOAD_DIR, fileName), bytes);

	return `/uploads/${fileName}`;
}

// Deletes a picture that was uploaded before. Other URLs (e.g. /media/seed/...) are ignored.
export async function deleteImage(url) {
	if (!url || !url.startsWith('/uploads/')) return;

	const fileName = path.basename(url);
	try {
		await unlink(path.join(UPLOAD_DIR, fileName));
	} catch {
		// file is already gone - nothing to do
	}
}