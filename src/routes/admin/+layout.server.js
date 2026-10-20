import { requireAdmin } from '$lib/server/admin.js';

// every page under /admin is only for admins
export function load({ locals }) {
	requireAdmin(locals);
}