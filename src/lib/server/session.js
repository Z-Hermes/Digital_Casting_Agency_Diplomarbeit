import { getUserBySession } from '$lib/server/session.js';

export async function handle({ event, resolve }) {
  const sessionId = event.cookies.get('session');

  if (sessionId) {
    try {
      event.locals.user = await getUserBySession(sessionId);
    } catch (error) {
      console.error('Session error:', error);
      event.locals.user = null;
    }
  } else {
    event.locals.user = null;
  }

  return resolve(event);
}