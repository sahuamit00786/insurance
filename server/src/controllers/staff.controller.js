const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { success, error } = require('../utils/response');

const MODULES = ['dashboard','clients','insurances','staff','lookup','reports','templates'];

async function list(req, res) {
  const [rows] = await pool.query(
    "SELECT id, name, email, phone, role, status, created_at FROM users WHERE role != 'superadmin' AND is_deleted = 0 ORDER BY created_at DESC"
  );
  return success(res, rows);
}

async function getOne(req, res) {
  const [rows] = await pool.query(
    'SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ? AND is_deleted = 0', [req.params.id]
  );
  if (!rows.length) return error(res, 'Staff not found', 404);
  return success(res, rows[0]);
}

async function create(req, res) {
  const { name, email, phone, password, role, status } = req.body;
  if (!name || !email || !password) return error(res, 'name, email, password required');
  if (role === 'superadmin') return error(res, 'Cannot create superadmin', 403);

  const [exists] = await pool.query('SELECT id FROM users WHERE email = ? AND is_deleted = 0', [email]);
  if (exists.length) return error(res, 'Email already exists');

  // Check staff limit from 'no_of_staffs' lookup category
  const [[limitRow]] = await pool.query(
    `SELECT lv.value FROM lookup_values lv
     JOIN lookup_categories lc ON lv.category_id = lc.id
     WHERE lc.slug = 'no_of_staffs' AND lv.is_active = 1 AND lv.is_deleted = 0
     ORDER BY lv.id ASC LIMIT 1`
  );
  if (limitRow) {
    const limit = parseInt(limitRow.value);
    if (!isNaN(limit)) {
      const [[{ count }]] = await pool.query(
        "SELECT COUNT(*) AS count FROM users WHERE is_deleted = 0 AND role NOT IN ('superadmin')"
      );
      if (count >= limit) {
        return error(res, `Staff limit reached. Maximum ${limit} staff allowed.`, 400);
      }
    }
  }

  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, phone, password, role, status) VALUES (?,?,?,?,?,?)',
    [name, email, phone || null, hash, role||'staff', status||'active']
  );

  // Default permissions: all 0 for non-admin
  if ((role||'staff') !== 'admin') {
    const permRows = MODULES.map(m => [result.insertId, m, 0,0,0,0]);
    await pool.query(
      'INSERT IGNORE INTO permissions (user_id, module, can_view, can_edit, can_delete, can_update) VALUES ?',
      [permRows]
    );
  }

  const [rows] = await pool.query(
    'SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?', [result.insertId]
  );
  return success(res, rows[0], 201);
}

async function update(req, res) {
  const [existing] = await pool.query('SELECT id, role FROM users WHERE id = ? AND is_deleted = 0', [req.params.id]);
  if (!existing.length) return error(res, 'Staff not found', 404);
  if (existing[0].role === 'superadmin') return error(res, 'Cannot modify superadmin', 403);

  const fields = ['name', 'email', 'phone', 'role', 'status'];
  const sets=[]; const vals=[];
  fields.forEach(f => { if (req.body[f] !== undefined) { sets.push(`${f}=?`); vals.push(req.body[f]); }});

  if (req.body.password) {
    sets.push('password=?');
    vals.push(await bcrypt.hash(req.body.password, 10));
  }
  if (!sets.length) return error(res, 'No fields to update');

  await pool.query(`UPDATE users SET ${sets.join(',')} WHERE id = ?`, [...vals, req.params.id]);
  const [rows] = await pool.query(
    'SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?', [req.params.id]
  );
  return success(res, rows[0]);
}

async function remove(req, res) {
  if (parseInt(req.params.id) === req.user.id) return error(res, 'Cannot delete yourself');
  const [existing] = await pool.query('SELECT id, role FROM users WHERE id = ? AND is_deleted = 0', [req.params.id]);
  if (!existing.length) return error(res, 'Staff not found', 404);
  if (existing[0].role === 'superadmin') return error(res, 'Cannot delete superadmin', 403);
  await pool.query('UPDATE users SET deleted_at = NOW(), is_deleted = 1 WHERE id = ?', [req.params.id]);
  return success(res, { message: 'Staff deleted' });
}

async function getPermissions(req, res) {
  const [rows] = await pool.query(
    'SELECT module, can_view, can_edit, can_delete, can_update FROM permissions WHERE user_id = ?',
    [req.params.id]
  );
  // Fill missing modules with zeros
  const map = {};
  rows.forEach(r => { map[r.module] = r; });
  const result = MODULES.map(m => map[m] || { module: m, can_view:0, can_edit:0, can_delete:0, can_update:0 });
  return success(res, result);
}

async function updatePermissions(req, res) {
  const { permissions } = req.body; // array of {module, can_view, can_edit, can_delete, can_update}
  if (!Array.isArray(permissions)) return error(res, 'permissions must be array');

  for (const p of permissions) {
    await pool.query(
      `INSERT INTO permissions (user_id, module, can_view, can_edit, can_delete, can_update)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE can_view=?, can_edit=?, can_delete=?, can_update=?`,
      [
        req.params.id, p.module,
        p.can_view?1:0, p.can_edit?1:0, p.can_delete?1:0, p.can_update?1:0,
        p.can_view?1:0, p.can_edit?1:0, p.can_delete?1:0, p.can_update?1:0,
      ]
    );
  }
  return success(res, { message: 'Permissions updated' });
}

module.exports = { list, getOne, create, update, remove, getPermissions, updatePermissions };
