import { error, redirect } from '@sveltejs/kit';
import { loadVideos, uploadVideo, deleteVideo, MAX_VIDEOS } from '$lib/server/videos.js';

// Only actors can upload videos of themselves here.
function requireActor(locals) {
	if (!locals.user) {
		redirect(303, '/login');
	}
	if (locals.user.role !== 'actor') {
		error(403, 'Only actors can upload videos.');
	}
	return locals.user;
}

export async function load({ locals }) {
	const user = requireActor(locals);
	return { videos: await loadVideos(user.id), maxVideos: MAX_VIDEOS };
}

export const actions = {
	upload: async ({ request, locals }) => {
		const user = requireActor(locals);
		return uploadVideo(user.id, await request.formData());
	},

	deleteVideo: async ({ request, locals }) => {
		const user = requireActor(locals);
		return deleteVideo(user.id, await request.formData());
	}
};