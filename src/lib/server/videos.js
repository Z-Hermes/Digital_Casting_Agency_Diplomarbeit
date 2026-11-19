import { fail } from '@sveltejs/kit';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { db } from './database.js';
import { UPLOAD_DIR, deleteImage } from './uploads.js';

// Self-tape videos: actors upload short clips of themselves (max. 1 minute).
// Saved in the same "uploads" folder as the pictures, served through
// /uploads/[file]. Stored in the existing media table with type = 'video'
// (no database change needed).

const MAX_SIZE = 100 * 1024 * 1024; // 100 MB per video
const MAX_DURATION = 60; // seconds
const TOLERANCE = 0.5; // phones often record "60 s" as 60.03 s
export const MAX_VIDEOS = 3;

const VIDEO_TYPES = {
	'video/mp4': 'mp4',
	'video/quicktime': 'mov' // iPhone camera videos
};

// some browsers send an empty type for .mov files -> use the file name
function videoType(file) {
	if (VIDEO_TYPES[file.type]) return file.type;
	const name = String(file.name ?? '').toLowerCase();
	if (!file.type && name.endsWith('.mp4')) return 'video/mp4';
	if (!file.type && name.endsWith('.mov')) return 'video/quicktime';
	return null;
}

// Checks size + type. Returns an error text, or null if it is OK.
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

// Finds a box ("atom") by name between start and end.
// MP4/MOV files are built from boxes: 4 bytes length + 4 bytes name.
// Returns { start, end } of the box CONTENT, or null.
function findBox(b, start, end, name) {
	let pos = start;
	while (pos + 8 <= end) {
		let size = b.readUInt32BE(pos);
		const type = b.toString('ascii', pos + 4, pos + 8);
		let header = 8;
		if (size === 1) {
			// 64-bit length
			if (pos + 16 > end) return null;
			size = Number(b.readBigUInt64BE(pos + 8));
			header = 16;
		} else if (size === 0) {
			size = end - pos; // box goes to the end of the file
		}
		if (size < header || pos + size > end) return null; // broken file
		if (type === name) return { start: pos + header, end: pos + size };
		pos += size;
	}
	return null;
}

// Reads the real video length in seconds from moov -> mvhd.
// Works WITHOUT ffmpeg and cannot be faked by the browser.
// Returns null when the length cannot be read.
function videoDuration(b) {
	const moov = findBox(b, 0, b.length, 'moov');
	if (!moov) return null;
	const mvhd = findBox(b, moov.start, moov.end, 'mvhd');
	if (!mvhd) return null;

	const p = mvhd.start;
	let timescale, duration;
	if (b[p] === 1) {
		// version 1: 64-bit duration
		if (mvhd.end - p < 32) return null;
		timescale = b.readUInt32BE(p + 20);
		duration = Number(b.readBigUInt64BE(p + 24));
	} else {
		// version 0: 32-bit duration
		if (mvhd.end - p < 20) return null;
		timescale = b.readUInt32BE(p + 12);
		duration = b.readUInt32BE(p + 16);
		if (duration === 0xffffffff) return null; // "unknown"
	}
	if (timescale === 0 || duration === 0) return null;
	return duration / timescale;
}

// Saves a checked video with a random name and returns its URL.
export async function saveVideo(file) {
	const type = videoType(file);
	const bytes = Buffer.from(await file.arrayBuffer());

	// every real MP4/MOV has a "ftyp" box at byte 4 (a renamed .exe fails here)
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

// ---------- database (same pattern as photos.js) ----------

export async function loadVideos(userId) {
	const [videos] = await db.execute(
		`SELECT id, url FROM media WHERE user_id = ? AND type = 'video' ORDER BY sort_order ASC, id ASC`,
		[userId]
	);
	return videos;
}

export async function uploadVideo(userId, formData) {
	const file = formData.get('video');
	const problem = checkVideo(file);
	if (problem) return fail(400, { videoError: problem });

	const [count] = await db.execute(
		`SELECT COUNT(*) AS total, COALESCE(MAX(sort_order), 0) AS last
		 FROM media WHERE user_id = ? AND type = 'video'`,
		[userId]
	);
	if (count[0].total >= MAX_VIDEOS) {
		return fail(400, {
			videoError: `You can have at most ${MAX_VIDEOS} videos. Delete one first.`
		});
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

	await db.execute(
		`INSERT INTO media (user_id, type, url, size, sort_order) VALUES (?, 'video', ?, 'wide', ?)`,
		[userId, url, Number(count[0].last) + 1]
	);
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
	await deleteImage(rows[0].url); // works for any file in /uploads
	return { videoMessage: 'Video deleted.' };
}