import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/database.js';
import { readFilmForm, toDateString } from '$lib/server/filmForm.js';

// Only the person who owns the film (producer_id) or an admin may edit it.
async function loadEditableFilm(id, locals) {
  if (!locals.user) {
    redirect(303, '/login');
  }

  const [rows] = await db.execute('SELECT * FROM films WHERE id = ?', [id]);
  const film = rows[0];
  if (!film) {
    error(404, 'Film not found.');
  }

  const isOwner = film.producer_id === locals.user.id;
  if (!isOwner && locals.user.role !== 'admin') {
    error(403, 'You can only edit your own films.');
  }

  return film;
}

export async function load({ params, locals }) {
  const film = await loadEditableFilm(params.id, locals);

  return {
    film: {
      id: film.id,
      title: film.title,
      year: film.year,
      description: film.description,
      poster_url: film.poster_url,
      trailer_url: film.trailer_url,
      stage: film.stage,
      casting_deadline: toDateString(film.casting_deadline) // "2026-12-01" for the date field
    }
  };
}

export const actions = {
  default: async ({ request, params, locals }) => {
    const film = await loadEditableFilm(params.id, locals);

    const result = readFilmForm(await request.formData(), {
      currentDeadline: toDateString(film.casting_deadline)
    });
    if (result.error) {
      return fail(400, { error: result.error, values: result.values });
    }
    const f = result.film;

    try {
      await db.execute(
        `UPDATE films
         SET title = ?, year = ?, description = ?, poster_url = ?, trailer_url = ?,
             stage = ?, casting_deadline = ?
         WHERE id = ?`,
        [f.title, f.year, f.description, f.poster_url, f.trailer_url, f.stage, f.casting_deadline, film.id]
      );
    } catch (err) {
      console.error(err);
      return fail(500, { error: 'The changes could not be saved. Try again.', values: result.values });
    }

    redirect(303, `/films/${film.id}`);
  }
};