import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/database.js';
import { readFilmForm } from '$lib/server/filmForm.js';

const ALLOWED_ROLES = ['director', 'producer', 'admin'];

// Only logged-in directors, producers and admins may add films.
function requireFilmmaker(locals) {
  if (!locals.user) {
    redirect(303, '/login');
  }
  if (!ALLOWED_ROLES.includes(locals.user.role)) {
    error(403, 'Only directors and producers can add films.');
  }
}

export function load({ locals }) {
  requireFilmmaker(locals);
  return {};
}

export const actions = {
  default: async ({ request, locals }) => {
    requireFilmmaker(locals);

    const result = readFilmForm(await request.formData());
    if (result.error) {
      return fail(400, { error: result.error, values: result.values });
    }
    const f = result.film;

    // producer_id = the person who gets the applications in his inbox,
    // so it is the director/producer who adds the film.
    let filmId;
    try {
      const [res] = await db.execute(
        `INSERT INTO films
           (title, year, description, poster_url, trailer_url, stage, casting_deadline, published, producer_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [f.title, f.year, f.description, f.poster_url, f.trailer_url, f.stage, f.casting_deadline, locals.user.id]
      );
      filmId = res.insertId;
    } catch (err) {
      console.error(err);
      return fail(500, { error: 'The film could not be saved. Try again.', values: result.values });
    }

    redirect(303, `/films/${filmId}`);
  }
};