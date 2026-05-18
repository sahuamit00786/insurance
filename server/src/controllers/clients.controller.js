const { pool } = require('../config/db');
const { success, error } = require('../utils/response');

const BASE_SELECT = `
  SELECT c.id, c.name, c.identification_no, c.date_of_birth,
         c.address, c.phone, c.email, c.created_at,
         (SELECT COUNT(*) FROM insurances WHERE client_id = c.id AND is_deleted = 0) AS insurance_count
  FROM clients c
  WHERE c.is_deleted = 0
`;

async function list(req, res) {
  const { search, status_id, plan_code_id, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const where  = [];
  const params = [];

  if (search) {
    where.push('(c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const andOrWhere = where.length ? `AND ${where.join(' AND ')}` : '';
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM clients c WHERE c.is_deleted = 0 ${andOrWhere}`, params
  );
  const [rows] = await pool.query(
    `${BASE_SELECT} ${andOrWhere} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), parseInt(offset)]
  );
  return success(res, { rows, total, page: parseInt(page), limit: parseInt(limit) });
}

async function getOne(req, res) {
  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.identification_no, c.date_of_birth,
            c.address, c.phone, c.email, c.created_at,
            (SELECT COUNT(*) FROM insurances WHERE client_id = c.id AND is_deleted = 0) AS insurance_count
     FROM clients c WHERE c.id = ? AND c.is_deleted = 0`,
    [req.params.id]
  );
  if (!rows.length) return error(res, 'Client not found', 404);
  return success(res, rows[0]);
}

async function create(req, res) {
  const { name, identification_no, date_of_birth, address, phone, email } = req.body;
  if (!name) return error(res, 'Name is required');

  const [result] = await pool.query(
    `INSERT INTO clients (name, identification_no, date_of_birth, address, phone, email, created_by)
     VALUES (?,?,?,?,?,?,?)`,
    [name, identification_no || null, date_of_birth || null, address || null,
     phone || null, email || null, req.user.id]
  );
  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.identification_no, c.date_of_birth,
            c.address, c.phone, c.email, c.created_at,
            0 AS insurance_count
     FROM clients c WHERE c.id = ?`,
    [result.insertId]
  );
  return success(res, rows[0], 201);
}

async function update(req, res) {
  const [existing] = await pool.query('SELECT id FROM clients WHERE id = ?', [req.params.id]);
  if (!existing.length) return error(res, 'Client not found', 404);

  const fields = ['name', 'identification_no', 'date_of_birth', 'address', 'phone', 'email'];
  const sets = [], vals = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) { sets.push(`${f} = ?`); vals.push(req.body[f] || null); }
  });
  if (!sets.length) return error(res, 'No fields to update');

  await pool.query(`UPDATE clients SET ${sets.join(',')} WHERE id = ?`, [...vals, req.params.id]);
  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.identification_no, c.date_of_birth,
            c.address, c.phone, c.email, c.created_at
     FROM clients c WHERE c.id = ?`,
    [req.params.id]
  );
  return success(res, rows[0]);
}

async function remove(req, res) {
  const [existing] = await pool.query('SELECT id FROM clients WHERE id = ? AND is_deleted = 0', [req.params.id]);
  if (!existing.length) return error(res, 'Client not found', 404);
  await pool.query('UPDATE clients SET deleted_at = NOW(), is_deleted = 1 WHERE id = ?', [req.params.id]);
  return success(res, { message: 'Client deleted' });
}

module.exports = { list, getOne, create, update, remove };
