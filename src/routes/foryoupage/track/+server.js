import { json } from '@sveltejs/kit';
import { db } from '$lib/server/database.js';

// POST /foryoupage/track  { videoId, event: 'view'|'watch', watch_pct }
// Fired by sendBeacon when a slide becomes active / is left.
export async function POST({ request, locals }) {
	if (!locals.user) return json({ ok: false });

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false });
	}

	const videoId = Number(body?.videoId);
	const event = body?.event === 'watch' ? 'watch' : body?.event === 'view' ? 'view' : null;
	if (!event || !Number.isInteger(videoId) || videoId <= 0) return json({ ok: false });

	const pct = Math.min(1, Math.max(0, Number(body?.watch_pct) || 0));
	const [v] = await db.execute(`SELECT id FROM media WHERE id = ? AND type = 'video'`, [videoId]);
	if (v.length === 0) return json({ ok: false });

	await db.execute('INSERT INTO video_events (user_id, media_id, event, watch_pct) VALUES (?, ?, ?, ?)', [
		locals.user.id,
		videoId,
		event,
		event === 'watch' ? pct : null
	]);
	return json({ ok: true });
}