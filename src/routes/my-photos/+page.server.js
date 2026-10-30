
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