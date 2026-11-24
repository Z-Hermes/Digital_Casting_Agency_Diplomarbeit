import { fail } from '@sveltejs/kit';
import { db } from './database.js';
import { interestVector, ensureClusters, rankFeed } from './recommend.js';

const MAX_COMMENT = 300;

// The feed is now RANKED, not just newest-first.
export async function loadFeed(viewerId = 0) {
	const [rows] = await db.execute(
		`SELECT m.id, m.url, m.caption, m.created_at,
		        u.id AS user_id, u.username, u.name, u.avatar_url, u.role,
		        ap.city, ap.availability,
		        (SELECT COUNT(*) FROM video_likes vl WHERE vl.media_id = m.id) AS likes,
		        (SELECT COUNT(*) FROM video_comments vc WHERE vc.media_id = m.id) AS comments,
		        EXISTS(SELECT 1 FROM video_likes vl WHERE vl.media_id = m.id AND vl.user_id = ?) AS liked_by_me
		 FROM media m
		 JOIN users u ON u.id = m.user_id
		 LEFT JOIN actor_profiles ap ON ap.user_id = u.id
		 WHERE m.type = 'video' AND u.role = 'actor' AND u.blocked = 0`,
		[viewerId]
	);
	if (rows.length === 0) return { posts: [], mode: 'empty' };

	const [vt] = await db.execute('SELECT media_id, tag_id FROM video_tags');
	const tagMap = new Map();
	for (const r of vt) {
		if (!tagMap.has(r.media_id)) tagMap.set(r.media_id, []);
		tagMap.get(r.media_id).push(r.tag_id);
	}
	const [tags] = await db.execute('SELECT id, name FROM tags');
	const tagNames = new Map(tags.map((t) => [t.id, t.name]));

	const userVec = await interestVector(viewerId);
	const clusters = await ensureClusters();

	const [lc] = await db.execute(
		`SELECT vl.media_id, uc.cluster_id, COUNT(*) AS n
		 FROM video_likes vl
		 JOIN user_clusters uc ON uc.user_id = vl.user_id
		 GROUP BY vl.media_id, uc.cluster_id`
	);
	const likesByCluster = new Map(lc.map((r) => [`${r.media_id}:${r.cluster_id}`, r.n]));

	return rankFeed(rows, tagMap, tagNames, userVec, clusters, likesByCluster, viewerId);
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
		await db.execute(
			`DELETE FROM video_events WHERE user_id = ? AND media_id = ? AND event = 'like'
			 ORDER BY id DESC LIMIT 1`,
			[userId, mediaId]
		);
		liked = false;
	} else {
		try {
			await db.execute('INSERT INTO video_likes (media_id, user_id) VALUES (?, ?)', [mediaId, userId]);
			await db.execute(
				`INSERT INTO video_events (user_id, media_id, event) VALUES (?, ?, 'like')`,
				[userId, mediaId]
			);
		} catch {
			// double-tap race
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
	await db.execute(`INSERT INTO video_events (user_id, media_id, event) VALUES (?, ?, 'comment')`, [
		userId,
		mediaId
	]);
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