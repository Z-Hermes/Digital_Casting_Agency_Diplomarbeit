import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import bcrypt from 'bcrypt';
import { db } from '$lib/server/database.js';
import { login } from '$lib/server/auth.js';

// only these roles can be chosen when registering (never 'admin')
const ROLES = ['actor', 'producer', 'director', 'spectator'];

export const actions = {
  register: async ({ request, cookies }) => {
    const form = await request.formData();
    const get = (field) => form.get(field)?.toString().trim() ?? '';

    const name = get('name');
    const username = get('username').toLowerCase();
    const email = get('email').toLowerCase();
    const password = form.get('password')?.toString() ?? '';
    const role = get('role');

    // sent back on an error so the form stays filled in (never the password)
    const values = { name, username, email, role };

    if (!name || !username || !email || !password || !role) {
      return fail(400, { error: 'Please fill in all fields.', values });
    }

    if (name.length > 80) {
      return fail(400, { error: 'The name can have at most 80 characters.', values });
    }

    // the username is part of the profile link (/user/[username])
    if (!/^[a-z0-9_-]{3,40}$/.test(username)) {
      return fail(400, {
        error: 'Username: 3-40 characters, only letters, numbers, _ and - (no spaces).',
        values
      });
    }

    if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(400, { error: 'Please enter a valid email address.', values });
    }

    // bcrypt only looks at the first 72 bytes of a password
    if (password.length < 6 || Buffer.byteLength(password) > 72) {
      return fail(400, { error: 'Password must be 6 to 72 characters long.', values });
    }

    if (!ROLES.includes(role)) {
      return fail(400, { error: 'Please choose a valid role.', values });
    }

    const [existingUser] = await db.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existingUser.length > 0) {
      return fail(400, { error: 'Username or email already exists.', values });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const [result] = await db.execute(
        `INSERT INTO users (username, email, password_hash, name, role)
         VALUES (?, ?, ?, ?, ?)`,
        [username, email, passwordHash, name, role]
      );

      // every actor gets an (empty) profile row, so the actor list and the
      // profile page work from the first minute
      if (role === 'actor') {
        await db.execute('INSERT INTO actor_profiles (user_id) VALUES (?)', [result.insertId]);
      }
    } catch (err) {
      // two people registered the same name at the same moment
      if (err.code === 'ER_DUP_ENTRY') {
        return fail(400, { error: 'Username or email already exists.', values });
      }
      console.error(err);
      return fail(500, { error: 'Registration failed. Please try again.', values });
    }

    // log the new user in right away (same as the login page does)
    const session = await login(username, password);
    if (!session) {
      redirect(303, '/login');
    }

    cookies.set('session', session.sessionId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: !dev, // https only on the real server
      maxAge: 60 * 60 * 24 * 7
    });

    redirect(303, '/');
  }
};