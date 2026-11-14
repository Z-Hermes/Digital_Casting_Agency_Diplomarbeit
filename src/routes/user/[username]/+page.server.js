import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/database.js';
import { uploadAvatar, deletePhoto } from '$lib/server/photos.js';
import { getConversation } from '$lib/server/inbox.js';
import {
  loadSections,
  buildLayout,
  addSection,
  updateSection,
  deleteSection,
  uploadSectionPhotos,
  saveLayout
} from '$lib/server/sections.js';

export async function load({ params, locals }) {
  const [userRows] = await db.execute(
    `SELECT u.id, u.username, u.name, u.role, u.avatar_url, u.blocked, u.created_at,
            ap.birth_date, ap.gender, ap.height_cm, ap.weight_kg,
            ap.eye_color, ap.hair_color, ap.city, ap.education,
            ap.awards, ap.bio, ap.cv_url, ap.availability, u.profile_layout
     FROM users u
     LEFT JOIN actor_profiles ap ON ap.user_id = u.id
     WHERE u.username = ?`,
    [params.username]
  );

  const profile = userRows[0];
  if (!profile || profile.blocked) {
    throw error(404, 'Profile not found');
  }

  const isOwner = locals.user?.id === profile.id;

  // ---- data that depends on the role of the profile ----
  let languages = [];
  let credits = [];
  let films = [];
  let jobs = [];

  if (profile.role === 'actor') {
    const [langRows] = await db.execute(
      `SELECT l.name
       FROM actor_languages al
       JOIN languages l ON l.id = al.language_id
       WHERE al.actor_id = ?`,
      [profile.id]
    );
    languages = langRows.map((l) => l.name);

    [credits] = await db.execute(
      `SELECT id, title, year, role_name, poster_url
       FROM credits
       WHERE actor_id = ?
       ORDER BY year DESC`,
      [profile.id]
    );
  }

  if (profile.role === 'director' || profile.role === 'producer') {
    // films this person added (producer_id = owner of the film)
    [films] = await db.execute(
      `SELECT id, title, year, stage, poster_url
       FROM films
       WHERE producer_id = ? AND published = 1
       ORDER BY year DESC, id DESC`,
      [profile.id]
    );

    // open job posts of this person
    [jobs] = await db.execute(
      `SELECT id, title, production_type, city, deadline
       FROM jobs
       WHERE created_by = ? AND status = 'open'
       ORDER BY created_at DESC`,
      [profile.id]
    );
  }

    // photos without a section (uploaded before sections existed, or on /my-photos)
  const [media] = await db.execute(
    `SELECT id, type, url, size
     FROM media
     WHERE user_id = ? AND section_id IS NULL
     ORDER BY sort_order ASC`,
    [profile.id]
  );

  // the user's own sections + the order of all blocks
  const sections = await loadSections(profile.id);
  const layout = buildLayout(profile.profile_layout, profile.role, sections);

  return {
    profile,
    isOwner,
    languages,
    credits,
    films,
    jobs,
    media,
    sections,
    layout
  };
}

// Only the owner may change the profile (picture, sections, order).
// The id comes from the login, never from the form, so nobody can change
// the profile of somebody else.
function requireOwner({ locals, params }) {
  if (!locals.user) {
    redirect(303, '/login');
  }
  if (locals.user.username.toLowerCase() !== params.username.toLowerCase()) {
    error(403, 'You can only change your own profile.');
  }
  return locals.user.id;
}

export const actions = {
  avatar: async (event) => {
    const userId = requireOwner(event);
    return uploadAvatar(userId, await event.request.formData());
  },

  // ---- sections (logic in src/lib/server/sections.js) ----
  addSection: async (event) => {
    const userId = requireOwner(event);
    return addSection(userId, await event.request.formData());
  },

  updateSection: async (event) => {
    const userId = requireOwner(event);
    return updateSection(userId, await event.request.formData());
  },

  deleteSection: async (event) => {
    const userId = requireOwner(event);
    return deleteSection(userId, await event.request.formData());
  },

  sectionPhotos: async (event) => {
    const userId = requireOwner(event);
    return uploadSectionPhotos(userId, await event.request.formData());
  },

  deletePhoto: async (event) => {
    const userId = requireOwner(event);
    return deletePhoto(userId, await event.request.formData());
  },

  saveLayout: async (event) => {
    const userId = requireOwner(event);
    return saveLayout(userId, event.locals.user.role, await event.request.formData());
  },

  // "Send message": opens (or creates) the chat with this person
  message: async ({ locals, params }) => {
    if (!locals.user) {
      redirect(303, '/login');
    }

    const [rows] = await db.execute('SELECT id FROM users WHERE username = ? AND blocked = 0', [
      params.username
    ]);
    const other = rows[0];
    if (!other) {
      error(404, 'Profile not found');
    }
    if (other.id === locals.user.id) {
      return fail(400, { error: 'You cannot send a message to yourself.' });
    }

    const conversationId = await getConversation(locals.user.id, other.id);
    redirect(303, `/messages/${conversationId}`);
  }
};

export const actions = {
  avatar: async (event) => {
    const userId = requireOwner(event);
    return uploadAvatar(userId, await event.request.formData());
  }
};