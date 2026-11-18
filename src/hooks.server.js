import { sequence } from '@sveltejs/kit/hooks';
import { getTextDirection } from '$lib/paraglide/runtime.js';
import { paraglideMiddleware } from '$lib/paraglide/server.js';
import { getUserFromSession } from '$lib/server/auth.js';

async function originalHandle({ event, resolve }) {
	const sessionId = event.cookies.get('session');

	if (sessionId) {
		try {
			event.locals.user = await getUserFromSession(sessionId);
		} catch (error) {
			console.error('Session error:', error);
			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	return resolve(event);
}

/** @type {import('@sveltejs/kit').Handle} */ const handleParaglide = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		return resolve(
			{ ...event, request },
			{
				transformPageChunk: ({ html }) =>
					html
						.replace('%paraglide.lang%', locale)
						.replace('%paraglide.dir%', getTextDirection(locale))
			}
		);
	});

export const handle = sequence(originalHandle, handleParaglide);
