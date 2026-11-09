import { redirect } from '@sveltejs/kit';
import { loadPhotos, uploadAvatar, removeAvatar, uploadGallery, deletePhoto } from '$lib/server/photos.js';

// Every logged-in user can only change THEIR OWN photos here (locals.user.id).
function requireLogin(locals) {
	if (!locals.user) {
		redirect(303, '/login');
	}
	return locals.user;
}

export async function load({ locals }) {
	const user = requireLogin(locals);
	return loadPhotos(user.id);
}

export const actions = {
	avatar: async ({ request, locals }) => {
		const user = requireLogin(locals);
		return uploadAvatar(user.id, await request.formData());
	},

	removeAvatar: async ({ locals }) => {
		const user = requireLogin(locals);
		return removeAvatar(user.id);
	},

	gallery: async ({ request, locals }) => {
		const user = requireLogin(locals);
		return uploadGallery(user.id, await request.formData());
	},

	deletePhoto: async ({ request, locals }) => {
		const user = requireLogin(locals);
		return deletePhoto(user.id, await request.formData());
	}
};