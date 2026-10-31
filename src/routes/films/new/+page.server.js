import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/database.js';

const ALLOWED_ROLES = ['director', 'producer', 'admin'];
const STAGES = ['coming_soon', 'casting', 'in_production', 'released'];

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

    const data = await request.formData();
    const get = (name) => data.get(name)?.toString().trim() ?? '';

    const values = {
      title: get('title'),
      year: get('year'),
      description: get('description'),
      stage: get('stage'),
      casting_deadline: get('casting_deadline'),
      poster_url: get('poster_url'),
      trailer_url: get('trailer_url')
    };

    // ---- validation ----
    if (!values.title) {
      return fail(400, { error: 'Enter a title.', values });
    }
    if (values.title.length > 150) {
      return fail(400, { error: 'The title can have at most 150 characters.', values });
    }

    let year = null;
    if (values.year) {
      year = Number(values.year);
      if (!Number.isInteger(year) || year < 1900 || year > 2100) {
        return fail(400, { error: 'Enter a year between 1900 and 2100.', values });
      }
    }

    if (values.description.length > 3000) {
      return fail(400, { error: 'The description can have at most 3000 characters.', values });
    }

    if (!STAGES.includes(values.stage)) {
      return fail(400, { error: 'Choose a stage.', values });
    }

    // the deadline only matters while the film is casting
    let deadline = null;
    if (values.stage === 'casting') {
      const today = new Date().toISOString().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(values.casting_deadline)) {
        return fail(400, { error: 'Enter the last day for applications.', values });
      }
      if (values.casting_deadline < today) {
        return fail(400, { error: 'The application deadline must not be in the past.', values });
      }
      deadline = values.casting_deadline;
    }

    // poster: a path on this site (/media/...) or a full https/http link
    if (values.poster_url) {
      if (values.poster_url.length > 500 || !/^(\/(?!\/)|https?:\/\/)/.test(values.poster_url)) {
        return fail(400, {
          error: 'The poster must be a path like /media/poster.jpg or a link starting with https://',
          values
        });
      }
    }

    // trailer: https link only (YouTube)
    if (values.trailer_url) {
      if (values.trailer_url.length > 500 || !/^https:\/\//.test(values.trailer_url)) {
        return fail(400, { error: 'The trailer must be a link starting with https://', values });
      }
    }

    // ---- save ----
    // producer_id = the person who gets the applications in his inbox,
    // so it is the director/producer who adds the film.
    let filmId;
    try {
      const [result] = await db.execute(
        `INSERT INTO films
           (title, year, description, poster_url, trailer_url, stage, casting_deadline, published, producer_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [
          values.title,
          year,
          values.description || null,
          values.poster_url || null,
          values.trailer_url || null,
          values.stage,
          deadline,
          locals.user.id
        ]
      );
      filmId = result.insertId;
    } catch (err) {
      console.error(err);
      return fail(500, { error: 'The film could not be saved. Try again.', values });
    }

    redirect(303, `/films/${filmId}`);
  }
};