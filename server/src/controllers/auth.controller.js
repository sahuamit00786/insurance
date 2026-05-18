const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { pool } = require('../config/db');
const { success, error } = require('../utils/response');

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return error(res, 'Email and password required');

  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ? AND status = "active" AND is_deleted = 0', [email]
  );
  if (!rows.length) return error(res, 'Invalid credentials', 401);

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return error(res, 'Invalid credentials', 401);

  const [perms] = await pool.query(
    'SELECT module, can_view, can_edit, can_delete, can_update FROM permissions WHERE user_id = ?',
    [user.id]
  );

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return success(res, {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    permissions: perms,
  });
}

async function me(req, res) {
  const [rows] = await pool.query(
    `SELECT id, name, email, role, status, avatar, created_at, updated_at
     FROM users WHERE id = ?`,
    [req.user.id]
  );
  if (!rows.length) return error(res, 'User not found', 404);

  const [perms] = await pool.query(
    'SELECT module, can_view, can_edit, can_delete, can_update FROM permissions WHERE user_id = ?',
    [req.user.id]
  );

  return success(res, { user: rows[0], permissions: perms });
}

async function updateProfile(req, res) {
  const { name, email, password, current_password } = req.body;
  const userId = req.user.id;

  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
  if (!rows.length) return error(res, 'User not found', 404);
  const existing = rows[0];

  if (name !== undefined && !String(name).trim()) {
    return error(res, 'Name is required');
  }

  if (email !== undefined) {
    const nextEmail = String(email).trim().toLowerCase();
    if (!nextEmail) return error(res, 'Email is required');
    const [dup] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [nextEmail, userId]
    );
    if (dup.length) return error(res, 'Email already in use');
  }

  if (password) {
    if (!current_password) return error(res, 'Current password is required to set a new password');
    const valid = await bcrypt.compare(current_password, existing.password);
    if (!valid) return error(res, 'Current password is incorrect', 401);
    if (String(password).length < 6) {
      return error(res, 'New password must be at least 6 characters');
    }
  }

  const sets = [];
  const vals = [];

  if (name !== undefined) {
    sets.push('name = ?');
    vals.push(String(name).trim());
  }
  if (email !== undefined) {
    sets.push('email = ?');
    vals.push(String(email).trim().toLowerCase());
  }
  if (password) {
    sets.push('password = ?');
    vals.push(await bcrypt.hash(password, 10));
  }

  if (!sets.length) return error(res, 'No fields to update');

  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, [...vals, userId]);

  const [updated] = await pool.query(
    `SELECT id, name, email, role, status, avatar, created_at, updated_at
     FROM users WHERE id = ?`,
    [userId]
  );

  return success(res, { user: updated[0] });
}

module.exports = { login, me, updateProfile };
