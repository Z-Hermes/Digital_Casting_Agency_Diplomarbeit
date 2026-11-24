import { db } from './database.js';

// Content-based ranking + k-means user segmentation.
// Signals: view=1, watch>80%=3 (partial credit below), like=4, comment=5,
// time-decayed with a 14-day half-life. Score = 0.55*cosine + 0.20*popularity
// + 0.10*freshness + 0.15*cluster affinity. ~1 in 6 slots is exploration.

const HALF_LIFE_HOURS = 24 * 14;
const FRESH_HALF_LIFE_HOURS = 24 * 7;
const K = 4;

// user -> Map(tagId -> decayed weight)
export async function interestVector(userId) {
	if (!userId) return new Map();
	const [rows] = await db.execute(
		`SELECT vt.tag_id,
		        SUM(CASE e.event
		              WHEN 'view' THEN 1
		              WHEN 'like' THEN 4
		              WHEN 'comment' THEN 5
		              WHEN 'watch' THEN (CASE WHEN e.watch_pct >= 0.8 THEN 3 ELSE 2 * e.watch_pct END)
		              ELSE 0 END
		            * POW(0.5, TIMESTAMPDIFF(HOUR, e.created_at, NOW()) / ${HALF_LIFE_HOURS})) AS w
		 FROM video_events e
		 JOIN video_tags vt ON vt.media_id = e.media_id
		 WHERE e.user_id = ?
		 GROUP BY vt.tag_id`,
		[userId]
	);
	return new Map(rows.map((r) => [r.tag_id, Number(r.w)]));
}

function cosine(userVec, videoTagIds) {
	if (userVec.size === 0 || videoTagIds.length === 0) return 0;
	let dot = 0;
	for (const t of videoTagIds) dot += userVec.get(t) ?? 0;
	let normU = 0;
	for (const w of userVec.values()) normU += w * w;
	return dot / (Math.sqrt(normU) * Math.sqrt(videoTagIds.length));
}

// plain k-means on L2-normalized user vectors (the unsupervised part)
function kmeans(points, k, iterations = 12) {
	if (points.length === 0) return [];
	k = Math.max(1, Math.min(k, points.length));
	const used = new Set();
	const centroids = [];
	while (centroids.length < k) {
		const i = Math.floor(Math.random() * points.length);
		if (!used.has(i)) {
			used.add(i);
			centroids.push([...points[i]]);
		}
	}
	const assign = new Array(points.length).fill(0);
	const dim = points[0].length;
	for (let it = 0; it < iterations; it++) {
		for (let i = 0; i < points.length; i++) {
			let best = 0;
			let bestD = Infinity;
			for (let c = 0; c < k; c++) {
				let d = 0;
				for (let j = 0; j < dim; j++) {
					const diff = points[i][j] - centroids[c][j];
					d += diff * diff;
				}
				if (d < bestD) {
					bestD = d;
					best = c;
				}
			}
			assign[i] = best;
		}
		const sums = Array.from({ length: k }, () => new Array(dim).fill(0));
		const counts = new Array(k).fill(0);
		for (let i = 0; i < points.length; i++) {
			counts[assign[i]]++;
			for (let j = 0; j < dim; j++) sums[assign[i]][j] += points[i][j];
		}
		for (let c = 0; c < k; c++) {
			if (counts[c] === 0) {
				centroids[c] = [...points[Math.floor(Math.random() * points.length)]];
				continue;
			}
			for (let j = 0; j < dim; j++) centroids[c][j] = sums[c][j] / counts[c];
		}
	}
	return assign;
}

// recompute clusters at most once per day, otherwise read the stored ones
export async function ensureClusters() {
	const [meta] = await db.execute('SELECT MAX(computed_at) AS t FROM user_clusters');
	const fresh =
		meta[0].t && Date.now() - new Date(meta[0].t).getTime() < 24 * 3600 * 1000;
	if (fresh) {
		const [rows] = await db.execute('SELECT user_id, cluster_id FROM user_clusters');
		return new Map(rows.map((r) => [r.user_id, r.cluster_id]));
	}

	const [users] = await db.execute('SELECT DISTINCT user_id FROM video_events');
	const [tags] = await db.execute('SELECT id FROM tags ORDER BY id');
	const tagIds = tags.map((t) => t.id);

	const points = [];
	const ids = [];
	for (const u of users) {
		const vec = await interestVector(u.user_id);
		if (vec.size === 0) continue;
		const arr = tagIds.map((t) => vec.get(t) ?? 0);
		const norm = Math.sqrt(arr.reduce((s, x) => s + x * x, 0)) || 1;
		points.push(arr.map((x) => x / norm));
		ids.push(u.user_id);
	}

	const assign = kmeans(points, K);
	await db.execute('DELETE FROM user_clusters');
	for (let i = 0; i < ids.length; i++) {
		await db.execute('INSERT INTO user_clusters (user_id, cluster_id) VALUES (?, ?)', [
			ids[i],
			assign[i]
		]);
	}
	return new Map(ids.map((id, i) => [id, assign[i]]));
}

// rank the candidate videos for one viewer
export function rankFeed(rows, tagMap, tagNames, userVec, clusters, likesByCluster, viewerId) {
	if (rows.length === 0) return { posts: [], mode: 'empty' };

	const personal = userVec.size > 0;
	const myCluster = clusters.get(viewerId);
	const maxPop = Math.max(...rows.map((r) => Math.log1p(r.likes + 1.5 * r.comments)), 0.001);

	const scored = rows.map((r) => {
		const tagIds = tagMap.get(r.id) ?? [];
		const pop = Math.log1p(r.likes + 1.5 * r.comments) / maxPop;
		const ageHours = (Date.now() - new Date(r.created_at).getTime()) / 3600000;
		const fresh = Math.pow(0.5, ageHours / FRESH_HALF_LIFE_HOURS);
		const cos = cosine(userVec, tagIds);

		let boost = 0;
		if (myCluster !== undefined) {
			const n = likesByCluster.get(`${r.id}:${myCluster}`) ?? 0;
			boost = n / Math.max(1, r.likes);
		}

		const score = personal
			? 0.55 * cos + 0.2 * pop + 0.1 * fresh + 0.15 * boost
			: 0.7 * pop + 0.3 * fresh;

		const shared = tagIds
			.filter((t) => userVec.has(t))
			.sort((a, b) => userVec.get(b) - userVec.get(a))
			.slice(0, 2)
			.map((t) => tagNames.get(t));

		return {
			...r,
			score,
			match: personal ? Math.round(cos * 100) : null,
			reason: shared.length
				? `Because you watch ${shared.join(' + ')}`
				: boost > 0
					? 'Viewers with your taste liked this'
					: 'Popular right now'
		};
	});

	scored.sort((a, b) => b.score - a.score);

	// exploration: every 6th slot pulls a random video from the pool,
	// so new tapes get data and the feed never becomes a filter bubble
	const pool = [...scored];
	const posts = [];
	while (pool.length > 0 && posts.length < 50) {
		if (posts.length % 6 === 5 && pool.length > 3) {
			const i = Math.floor(Math.random() * pool.length);
			posts.push(pool.splice(i, 1)[0]);
		} else {
			posts.push(pool.shift());
		}
	}
	return { posts, mode: personal ? 'personal' : 'popular' };
}