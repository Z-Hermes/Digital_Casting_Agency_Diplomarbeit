import { error } from '@sveltejs/kit';
import { readFile, stat } from 'fs/promises';
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import path from 'path';
import { UPLOAD_DIR } from '$lib/server/uploads.js';

const CONTENT_TYPES = {
	jpg: 'image/jpeg',
	png: 'image/png',
	webp: 'image/webp',
	mp4: 'video/mp4',
	mov: 'video/quicktime'
};

// Shows an uploaded picture or video, e.g. /uploads/3f2a...c1.mp4
export async function GET({ params, request }) {
	// only names like we create them (random id + allowed extension)
	const match = params.file.match(/^[a-f0-9-]{36}\.(jpg|png|webp|mp4|mov)$/);
	if (!match) {
		error(404, 'Not found');
	}

	const ext = match[1];
	const filePath = path.join(UPLOAD_DIR, params.file);
	const contentType = CONTENT_TYPES[ext];

	// ---- pictures: unchanged ----
	if (ext === 'jpg' || ext === 'png' || ext === 'webp') {
		try {
			const file = await readFile(filePath);
			return new Response(file, {
				headers: {
					'Content-Type': contentType,
					'Cache-Control': 'public, max-age=31536000, immutable'
				}
			});
		} catch {
			error(404, 'Not found');
		}
	}

	// ---- videos: support "Range" requests so seeking works
	// (Safari / iPhone refuses to play videos without them) ----
	let size;
	try {
		({ size } = await stat(filePath));
	} catch {
		error(404, 'Not found');
	}

	let start = 0;
	let end = size - 1;
	let status = 200;

	const range = request.headers.get('range')?.match(/^bytes=(\d*)-(\d*)$/);
	if (range && (range[1] !== '' || range[2] !== '')) {
		if (range[1] === '') {
			start = Math.max(0, size - Number(range[2])); // last N bytes
		} else {
			start = Number(range[1]);
			if (range[2] !== '') end = Math.min(Number(range[2]), size - 1);
		}
		if (start >= size || start > end) {
			return new Response(null, {
				status: 416,
				headers: { 'Content-Range': `bytes */${size}` }
			});
		}
		status = 206;
	}

	const headers = {
		'Content-Type': contentType,
		'Content-Length': String(end - start + 1),
		'Accept-Ranges': 'bytes',
		'Cache-Control': 'public, max-age=31536000, immutable'
	};
	if (status === 206) headers['Content-Range'] = `bytes ${start}-${end}/${size}`;

	const stream = Readable.toWeb(createReadStream(filePath, { start, end }));
	return new Response(stream, { status, headers });
}