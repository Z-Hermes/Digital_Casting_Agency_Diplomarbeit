import { error } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import path from 'path';
import { UPLOAD_DIR } from '$lib/server/uploads.js';

const CONTENT_TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

// Shows an uploaded picture, e.g. /uploads/3f2a...c1.jpg
export async function GET({ params }) {
	// only names like we create them (random id + .jpg/.png/.webp), so nobody can read other files
	const match = params.file.match(/^[a-f0-9-]{36}\.(jpg|png|webp)$/);
	if (!match) {
		error(404, 'Not found');
	}

	try {
		const file = await readFile(path.join(UPLOAD_DIR, params.file));
		return new Response(file, {
			headers: {
				'Content-Type': CONTENT_TYPES[match[1]],
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		});
	} catch {
		error(404, 'Not found');
	}
}