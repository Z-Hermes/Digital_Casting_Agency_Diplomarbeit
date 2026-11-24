import { fail } from '@sveltejs/kit';
import { db } from './database.js';

// The For You feed = every actor's self-tape from the media table.
// One upload (on /my-videos or on the FYP) shows on the profile AND here.

const MAX_COMMENT = 300;

export async function loadFeed(viewerId = 0) {
	const [posts] = await db.execute(
		`SELECT m.id, m.url, m.caption, m.created_at,
		        u.id AS user_id, u.username, u.name, u.avatar_url, u.role,
		        ap.city, ap.availability,
		        (SELECT COUNT(*) FROM video_likes vl WHERE vl.media_id = m.id) AS likes,
		        (SELECT COUNT(*) FROM video_comments vc WHERE vc.media_id = m.id) AS comments,
		        EXISTS(SELECT 1 FROM video_likes vl WHERE vl.media_id = m.id AND vl.user_id = ?) AS liked_by_me
		 FROM media m
		 JOIN users u ON u.id = m.user_id
		 LEFT JOIN actor_profiles ap ON ap.user_id = u.id
		 WHERE m.type = 'video' AND u.role = 'actor' AND u.blocked = 0
		 ORDER BY m.id DESC
		 LIMIT 50`,
		[viewerId]
	);
	return posts;
}

export async function toggleLike(userId, mediaId) {
	const [p] = await db.execute(`SELECT id FROM media WHERE id = ? AND type = 'video'`, [mediaId]);
	if (p.length === 0) return fail(404, { videoError: 'Video not found.' });

	const [existing] = await db.execute('SELECT 1 FROM video_likes WHERE media_id = ? AND user_id = ?', [
		mediaId,
		userId
	]);
	let liked;
	if (existing.length > 0) {
		await db.execute('DELETE FROM video_likes WHERE media_id = ? AND user_id = ?', [mediaId, userId]);
		liked = false;
	} else {
		try {
			await db.execute('INSERT INTO video_likes (media_id, user_id) VALUES (?, ?)', [mediaId, userId]);
		} catch {
			// double-tap race: the primary key already has this like
		}
		liked = true;
	}
	const [c] = await db.execute('SELECT COUNT(*) AS n FROM video_likes WHERE media_id = ?', [mediaId]);
	return { liked, likes: c[0].n };
}

export async function loadComments(mediaId) {
	const [comments] = await db.execute(
		`SELECT c.id, c.user_id, c.body, c.created_at, u.username, u.name, u.avatar_url, u.role
		 FROM video_comments c
		 JOIN users u ON u.id = c.user_id
		 WHERE c.media_id = ? AND u.blocked = 0
		 ORDER BY c.created_at ASC, c.id ASC
		 LIMIT 100`,
		[mediaId]
	);
	return comments;
}

export async function addComment(userId, formData) {
	const mediaId = Number(formData.get('videoId'));
	const body = String(formData.get('body') ?? '').trim();
	if (!body || body.length > MAX_COMMENT) {
		return fail(400, { videoError: `A comment must be 1-${MAX_COMMENT} characters.` });
	}
	const [p] = await db.execute(`SELECT id FROM media WHERE id = ? AND type = 'video'`, [mediaId]);
	if (p.length === 0) return fail(404, { videoError: 'Video not found.' });

	const [result] = await db.execute(
		'INSERT INTO video_comments (media_id, user_id, body) VALUES (?, ?, ?)',
		[mediaId, userId, body]
	);
	const [rows] = await db.execute(
		`SELECT c.id, c.user_id, c.body, c.created_at, u.username, u.name, u.avatar_url, u.role
		 FROM video_comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?`,
		[result.insertId]
	);
	return { comment: rows[0] };
}

export async function deleteComment(userId, role, formData) {
	const commentId = Number(formData.get('commentId'));
	const [rows] = await db.execute('SELECT id, user_id FROM video_comments WHERE id = ?', [commentId]);
	const c = rows[0];
	if (!c) return fail(404, { videoError: 'Comment not found.' });
	if (c.user_id !== userId && role !== 'admin') {
		return fail(403, { videoError: 'You can only delete your own comments.' });
	}
	await db.execute('DELETE FROM video_comments WHERE id = ?', [commentId]);
	return { ok: true };
}