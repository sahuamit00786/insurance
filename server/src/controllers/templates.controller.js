const { pool } = require('../config/db');
const { success, error } = require('../utils/response');

async function list(req, res) {
  const [rows] = await pool.query(
    `SELECT t.*, u.name AS created_by_name FROM templates t
     LEFT JOIN users u ON t.created_by = u.id
     WHERE t.is_deleted = 0
     ORDER BY t.updated_at DESC`
  );
  return success(res, rows);
}

async function getOne(req, res) {
  const [rows] = await pool.query('SELECT * FROM templates WHERE id = ? AND is_deleted = 0', [req.params.id]);
  if (!rows.length) return error(res, 'Template not found', 404);
  return success(res, rows[0]);
}

async function create(req, res) {
  const { name, body } = req.body;
  if (!name || !body) return error(res, 'name and body required');
  const [result] = await pool.query(
    'INSERT INTO templates (name, body, created_by) VALUES (?,?,?)',
    [name, body, req.user.id]
  );
  const [rows] = await pool.query('SELECT * FROM templates WHERE id = ?', [result.insertId]);
  return success(res, rows[0], 201);
}

async function update(req, res) {
  const [existing] = await pool.query('SELECT id FROM templates WHERE id = ? AND is_deleted = 0', [req.params.id]);
  if (!existing.length) return error(res, 'Template not found', 404);
  const { name, body } = req.body;
  const sets=[]; const vals=[];
  if (name !== undefined) { sets.push('name=?'); vals.push(name); }
  if (body !== undefined) { sets.push('body=?'); vals.push(body); }
  if (!sets.length) return error(res, 'No fields to update');
  await pool.query(`UPDATE templates SET ${sets.join(',')} WHERE id = ?`, [...vals, req.params.id]);
  const [rows] = await pool.query('SELECT * FROM templates WHERE id = ?', [req.params.id]);
  return success(res, rows[0]);
}

async function remove(req, res) {
  const [existing] = await pool.query('SELECT id FROM templates WHERE id = ? AND is_deleted = 0', [req.params.id]);
  if (!existing.length) return error(res, 'Template not found', 404);
  await pool.query('UPDATE templates SET deleted_at = NOW(), is_deleted = 1 WHERE id = ?', [req.params.id]);
  return success(res, { message: 'Template deleted' });
}

async function preview(req, res) {
  const { client_id } = req.body;
  const [tmplRows] = await pool.query('SELECT * FROM templates WHERE id = ? AND is_deleted = 0', [req.params.id]);
  if (!tmplRows.length) return error(res, 'Template not found', 404);
  if (!client_id) return error(res, 'client_id required');

  const [clientRows] = await pool.query(
    `SELECT c.id, c.name, c.date_of_birth, c.address, c.phone, c.email
     FROM clients c WHERE c.id = ?`,
    [client_id]
  );
  if (!clientRows.length) return error(res, 'Client not found', 404);

  const client = clientRows[0];

  const [insRows] = await pool.query(
    `SELECT i.policy_no, i.premium, i.issued_date, i.maturity_date, i.premium_due_date,
            pc.value AS plan_code, pm.value AS payment_mode, st.value AS status
     FROM insurances i
     LEFT JOIN lookup_values pc ON i.plan_code_id = pc.id
     LEFT JOIN lookup_values pm ON i.payment_mode_id = pm.id
     LEFT JOIN lookup_values st ON i.status_id = st.id
     WHERE i.client_id = ? AND i.is_deleted = 0
     ORDER BY i.premium_due_date ASC
     LIMIT 1`,
    [client_id]
  );
  const ins = insRows[0] || {};

  const premium = ins.premium ? `RM ${parseFloat(ins.premium).toFixed(2)}` : '';

  const tokenMap = {
    client_name:   client.name,
    dob:           client.date_of_birth,
    phone:         client.phone,
    email:         client.email,
    address:       client.address,
    policy_no:     ins.policy_no,
    plan_code:     ins.plan_code,
    premium:       premium,
    due_date:      ins.premium_due_date,
    issued_date:   ins.issued_date,
    maturity_date: ins.maturity_date,
    payment_mode:  ins.payment_mode,
    status:        ins.status,
  };

  let body = tmplRows[0].body;
  Object.entries(tokenMap).forEach(([token, val]) => {
    body = body.replace(new RegExp(`\\{${token}\\}`, 'g'), val || '');
  });

  return success(res, { preview: body });
}

module.exports = { list, getOne, create, update, remove, preview };
