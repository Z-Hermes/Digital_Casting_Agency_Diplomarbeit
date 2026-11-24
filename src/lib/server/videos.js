import { fail } from '@sveltejs/kit';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { db } from './database.js';
import { UPLOAD_DIR, deleteImage } from './uploads.js';

const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_DURATION = 60; // seconds
const TOLERANCE = 0.5;
const MAX_CAPTION = 300;
const MAX_TAGS = 3;
export const MAX_VIDEOS = 3;

const VIDEO_TYPES = {
	'video/mp4': 'mp4',
	'video/quicktime': 'mov'
};

export async function loadTags() {
	const [tags] = await db.execute('SELECT id, name FROM tags ORDER BY id');
	return tags;
}

function videoType(file) {
	if (VIDEO_TYPES[file.type]) return file.type;
	const name = String(file.name ?? '').toLowerCase();
	if (!file.type && name.endsWith('.mp4')) return 'video/mp4';
	if (!file.type && name.endsWith('.mov')) return 'video/quicktime';
	return null;
}

export function checkVideo(file) {
	if (!file || typeof file === 'string' || file.size === 0) {
		return 'Please choose a video.';
	}
	if (file.size > MAX_SIZE) {
		return `The video is too big (max. ${MAX_SIZE / 1024 / 1024} MB). Tip: record in 1080p instead of 4K.`;
	}
	if (!videoType(file)) {
		return 'Only MP4 or MOV videos are allowed (phone camera format).';
	}
	return null;
}

function findBox(b, start, end, name) {
	let pos = start;
	while (pos + 8 <= end) {
		let size = b.readUInt32BE(pos);
		const type = b.toString('ascii', pos + 4, pos + 8);
		let header = 8;
		if (size === 1) {
			if (pos + 16 > end) return null;
			size = Number(b.readBigUInt64BE(pos + 8));
			header = 16;
		} else if (size === 0) {
			size = end - pos;
		}
		if (size < header || pos + size > end) return null;
		if (type === name) return { start: pos + header, end: pos + size };
		pos += size;
	}
	return null;
}

function videoDuration(b) {
	const moov = findBox(b, 0, b.length, 'moov');
	if (!moov) return null;
	const mvhd = findBox(b, moov.start, moov.end, 'mvhd');
	if (!mvhd) return null;

	const p = mvhd.start;
	let timescale, duration;
	if (b[p] === 1) {
		if (mvhd.end - p < 32) return null;
		timescale = b.readUInt32BE(p + 20);
		duration = Number(b.readBigUInt64BE(p + 24));
	} else {
		if (mvhd.end - p < 20) return null;
		timescale = b.readUInt32BE(p + 12);
		duration = b.readUInt32BE(p + 16);
		if (duration === 0xffffffff) return null;
	}
	if (timescale === 0 || duration === 0) return null;
	return duration / timescale;
}

export async function saveVideo(file) {
	const type = videoType(file);
	const bytes = Buffer.from(await file.arrayBuffer());

	if (!type || bytes.length < 12 || bytes.toString('ascii', 4, 8) !== 'ftyp') {
		throw new Error('INVALID_VIDEO');
	}
	const duration = videoDuration(bytes);
	if (duration === null) throw new Error('UNKNOWN_DURATION');
	if (duration > MAX_DURATION + TOLERANCE) throw new Error('TOO_LONG');

	await mkdir(UPLOAD_DIR, { recursive: true });
	const fileName = `${crypto.randomUUID()}.${VIDEO_TYPES[type]}`;
	await writeFile(path.join(UPLOAD_DIR, fileName), bytes);
	return `/uploads/${fileName}`;
}

export async function loadVideos(userId) {
	const [videos] = await db.execute(
		`SELECT id, url FROM media WHERE user_id = ? AND type = 'video' ORDER BY sort_order ASC, id ASC`,
		[userId]
	);
	return videos;
}

export async function countVideos(userId) {
	const [rows] = await db.execute(
		`SELECT COUNT(*) AS total FROM media WHERE user_id = ? AND type = 'video'`,
		[userId]
	);
	return rows[0].total;
}

export async function uploadVideo(userId, formData) {
	const file = formData.get('video');
	const caption = String(formData.get('caption') ?? '').trim();
	const tagIds = [...new Set(formData.getAll('tags').map(Number).filter((n) => Number.isInteger(n) && n > 0))];

	const problem = checkVideo(file);
	if (problem) return fail(400, { videoError: problem });
	if (caption.length > MAX_CAPTION) {
		return fail(400, { videoError: `The caption can have at most ${MAX_CAPTION} characters.` });
	}
	if (tagIds.length === 0) {
		return fail(400, { videoError: 'Pick at least one tag so the algorithm can place your tape.' });
	}
	if (tagIds.length > MAX_TAGS) {
		return fail(400, { videoError: `Pick at most ${MAX_TAGS} tags.` });
	}
	const [validTags] = await db.execute(
		`SELECT id FROM tags WHERE id IN (${tagIds.map(() => '?').join(',')})`,
		tagIds
	);
	if (validTags.length !== tagIds.length) {
		return fail(400, { videoError: 'Unknown tag.' });
	}

	const [count] = await db.execute(
		`SELECT COUNT(*) AS total, COALESCE(MAX(sort_order), 0) AS last
		 FROM media WHERE user_id = ? AND type = 'video'`,
		[userId]
	);
	if (count[0].total >= MAX_VIDEOS) {
		return fail(400, { videoError: `You can have at most ${MAX_VIDEOS} videos. Delete one first.` });
	}

	let url;
	try {
		url = await saveVideo(file);
	} catch (e) {
		const messages = {
			INVALID_VIDEO: 'This file is not a valid MP4/MOV video.',
			UNKNOWN_DURATION:
				'The video length could not be read. Please export it as a normal MP4 (H.264).',
			TOO_LONG: `The video is longer than ${MAX_DURATION} seconds.`
		};
		return fail(400, { videoError: messages[e.message] ?? 'The upload failed.' });
	}

	const [result] = await db.execute(
		`INSERT INTO media (user_id, type, url, size, sort_order, caption)
		 VALUES (?, 'video', ?, 'wide', ?, ?)`,
		[userId, url, Number(count[0].last) + 1, caption || null]
	);
	for (const tagId of tagIds) {
		await db.execute('INSERT INTO video_tags (media_id, tag_id) VALUES (?, ?)', [
			result.insertId,
			tagId
		]);
	}
	return { videoMessage: 'Video added.' };
}

export async function deleteVideo(userId, formData) {
	const videoId = Number(formData.get('videoId'));
	const [rows] = await db.execute(
		`SELECT id, url FROM media WHERE id = ? AND user_id = ? AND type = 'video'`,
		[videoId, userId]
	);
	if (rows.length === 0) return fail(404, { videoError: 'Video not found.' });

	await db.execute('DELETE FROM media WHERE id = ?', [videoId]);
	await deleteImage(rows[0].url);
	return { videoMessage: 'Video deleted.' };
}