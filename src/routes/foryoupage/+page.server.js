import { error, redirect } from '@sveltejs/kit';
import { loadFeed, toggleLike, addComment, deleteComment } from '$lib/server/fyp.js';
import { uploadVideo, deleteVideo, countVideos, loadTags, MAX_VIDEOS } from '$lib/server/videos.js';

function requireLogin(locals) {
	if (!locals.user) redirect(303, '/login');
	return locals.user;
}

function requireActor(locals) {
	const user = requireLogin(locals);
	if (user.role !== 'actor') error(403, 'Only actors can upload self-tapes.');
	return user;
}

export async function load({ locals }) {
	const { posts, mode } = await loadFeed(locals.user?.id ?? 0);
	const myVideos = locals.user?.role === 'actor' ? await countVideos(locals.user.id) : 0;
	const tags = await loadTags();
	return { posts, mode, tags, myVideos, maxVideos: MAX_VIDEOS };
}

export const actions = {
	upload: async ({ request, locals }) => {
		const user = requireActor(locals);
		return uploadVideo(user.id, await request.formData());
	},

	deleteVideo: async ({ request, locals }) => {
		const user = requireLogin(locals);
		return deleteVideo(user.id, await request.formData());
	},

	like: async ({ request, locals }) => {
		const user = requireLogin(locals);
		const formData = await request.formData();
		return toggleLike(user.id, Number(formData.get('videoId')));
	},

	addComment: async ({ request, locals }) => {
		const user = requireLogin(locals);
		return addComment(user.id, await request.formData());
	},

	deleteComment: async ({ request, locals }) => {
		const user = requireLogin(locals);
		return deleteComment(user.id, user.role, await request.formData());
	}
};