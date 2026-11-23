import { json, error } from '@sveltejs/kit';
import { loadComments } from '$lib/server/fyp.js';

// GET /foryoupage?videoId=123 -> the comments of one self-tape
export async function GET({ url }) {
	const videoId = Number(url.searchParams.get('videoId'));
	if (!Number.isInteger(videoId) || videoId <= 0) error(400, 'Bad videoId');
	return json(await loadComments(videoId), { headers: { 'Cache-Control': 'no-store' } });
}