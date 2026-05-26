const { pool } = require('../config/db');
const { success, error } = require('../utils/response');

async function list(req, res) {
  const [rows] = await pool.query(
    `SELECT n.*, u.name AS created_by_name
     FROM notes n
     LEFT JOIN users u ON n.created_by = u.id
     WHERE n.client_id = ? AND n.is_deleted = 0
     ORDER BY n.pinned DESC, n.created_at DESC`,
    [req.params.clientId]
  );
  return success(res, rows);
}

async function create(req, res) {
  const { title, body, color = 'blue', pinned = 0 } = req.body;
  if (!body) return error(res, 'Note body is required');
  const [result] = await pool.query(
    `INSERT INTO notes (client_id, title, body, color, pinned, created_by)
     VALUES (?,?,?,?,?,?)`,
    [req.params.clientId, title || null, body, color, pinned ? 1 : 0, req.user.id]
  );
  const [rows] = await pool.query(
    `SELECT n.*, u.name AS created_by_name FROM notes n
     LEFT JOIN users u ON n.created_by = u.id WHERE n.id = ?`,
    [result.insertId]
  );
  return success(res, rows[0], 201);
}

async function update(req, res) {
  const [existing] = await pool.query(
    'SELECT id FROM notes WHERE id = ? AND client_id = ? AND is_deleted = 0',
    [req.params.noteId, req.params.clientId]
  );
  if (!existing.length) return error(res, 'Note not found', 404);
  const { title, body, color, pinned } = req.body;
  const sets = []; const vals = [];
  if (title  !== undefined) { sets.push('title=?');  vals.push(title || null); }
  if (body   !== undefined) { sets.push('body=?');   vals.push(body);          }
  if (color  !== undefined) { sets.push('color=?');  vals.push(color);         }
  if (pinned !== undefined) { sets.push('pinned=?'); vals.push(pinned ? 1 : 0);}
  if (!sets.length) return error(res, 'No fields to update');
  await pool.query(`UPDATE notes SET ${sets.join(',')} WHERE id = ?`, [...vals, req.params.noteId]);
  const [rows] = await pool.query(
    `SELECT n.*, u.name AS created_by_name FROM notes n
     LEFT JOIN users u ON n.created_by = u.id WHERE n.id = ?`,
    [req.params.noteId]
  );
  return success(res, rows[0]);
}

async function remove(req, res) {
  const [existing] = await pool.query(
    'SELECT id FROM notes WHERE id = ? AND client_id = ? AND is_deleted = 0',
    [req.params.noteId, req.params.clientId]
  );
  if (!existing.length) return error(res, 'Note not found', 404);
  await pool.query('UPDATE notes SET deleted_at = NOW(), is_deleted = 1 WHERE id = ?', [req.params.noteId]);
  return success(res, { message: 'Note deleted' });
}

module.exports = { list, create, update, remove };
