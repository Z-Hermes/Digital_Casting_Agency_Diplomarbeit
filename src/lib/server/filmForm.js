// Shared by /films/new and /films/[id]/edit:
// reads the film form, checks it, and returns clean values for the database.

export const STAGES = ['coming_soon', 'casting', 'in_production', 'released'];

// "2026-12-01" for a date, using the SERVER's local time.
// (mysql2 returns DATE columns as local midnight, so toISOString() would
//  move the day back by one in Albania. Do not use it for dates.)
export function toDateString(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function todayString() {
  return toDateString(new Date());
}

/**
 * @param {FormData} data
 * @param {{ currentDeadline?: string | null }} [options]
 *   currentDeadline: the deadline already stored (edit page). It may be in
 *   the past and stay unchanged, so small edits are not blocked.
 * @returns {{ error: string, values: object } | { values: object, film: object }}
 */
export function readFilmForm(data, { currentDeadline = null } = {}) {
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
  const bad = (error) => ({ error, values });

  if (!values.title) return bad('Enter a title.');
  if (values.title.length > 150) return bad('The title can have at most 150 characters.');

  let year = null;
  if (values.year) {
    year = Number(values.year);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      return bad('Enter a year between 1900 and 2100.');
    }
  }

  if (values.description.length > 3000) {
    return bad('The description can have at most 3000 characters.');
  }

  if (!STAGES.includes(values.stage)) return bad('Choose a stage.');

  // the deadline only matters while the film is casting
  let deadline = null;
  if (values.stage === 'casting') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.casting_deadline)) {
      return bad('Enter the last day for applications.');
    }
    const changed = values.casting_deadline !== currentDeadline;
    if (changed && values.casting_deadline < todayString()) {
      return bad('The application deadline must not be in the past.');
    }
    deadline = values.casting_deadline;
  }

  // poster: a path on this site (/media/...) or a full https/http link
  if (values.poster_url) {
    if (values.poster_url.length > 500 || !/^(\/(?!\/)|https?:\/\/)/.test(values.poster_url)) {
      return bad('The poster must be a path like /media/poster.jpg or a link starting with https://');
    }
  }

  // trailer: https link only (YouTube)
  if (values.trailer_url) {
    if (values.trailer_url.length > 500 || !/^https:\/\//.test(values.trailer_url)) {
      return bad('The trailer must be a link starting with https://');
    }
  }

  return {
    values,
    film: {
      title: values.title,
      year,
      description: values.description || null,
      poster_url: values.poster_url || null,
      trailer_url: values.trailer_url || null,
      stage: values.stage,
      casting_deadline: deadline
    }
  };
}