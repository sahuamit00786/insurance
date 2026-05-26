const { pool } = require('../config/db');
const { success, error } = require('../utils/response');

async function list(req, res) {
  const { date, month } = req.query;
  let where = '';
  const params = [];

  if (date) {
    where = 'WHERE a.appointment_date = ? AND a.is_deleted = 0';
    params.push(date);
  } else if (month) {
    where = 'WHERE DATE_FORMAT(a.appointment_date, "%Y-%m") = ? AND a.is_deleted = 0';
    params.push(month);
  } else {
    where = 'WHERE a.is_deleted = 0';
  }

  const [rows] = await pool.query(
    `SELECT a.*, COALESCE(c.name, a.guest_name) AS client_name, at.value AS appointment_type
     FROM appointments a
     LEFT JOIN clients c ON a.client_id = c.id
     LEFT JOIN lookup_values at ON a.appointment_type_id = at.id
     ${where}
     ORDER BY a.appointment_date, a.appointment_time`,
    params
  );
  return success(res, rows);
}

async function create(req, res) {
  const { client_id, guest_name, appointment_date, appointment_time, appointment_type_id, note } = req.body;
  if (!appointment_date) return error(res, 'appointment_date required');
  if (!client_id && !guest_name) return error(res, 'client_id or guest_name required');

  const [result] = await pool.query(
    `INSERT INTO appointments (client_id, guest_name, appointment_date, appointment_time, appointment_type_id, note, created_by)
     VALUES (?,?,?,?,?,?,?)`,
    [client_id||null, guest_name||null, appointment_date, appointment_time||null, appointment_type_id||null, note||null, req.user.id]
  );
  const [rows] = await pool.query(
    `SELECT a.*, COALESCE(c.name, a.guest_name) AS client_name, at.value AS appointment_type
     FROM appointments a
     LEFT JOIN clients c ON a.client_id = c.id
     LEFT JOIN lookup_values at ON a.appointment_type_id = at.id
     WHERE a.id = ?`, [result.insertId]
  );
  return success(res, rows[0], 201);
}

async function update(req, res) {
  const [existing] = await pool.query('SELECT id FROM appointments WHERE id = ? AND is_deleted = 0', [req.params.id]);
  if (!existing.length) return error(res, 'Appointment not found', 404);

  const fields = ['client_id','guest_name','appointment_date','appointment_time','appointment_type_id','note'];
  const sets=[]; const vals=[];
  fields.forEach(f => { if (req.body[f] !== undefined) { sets.push(`${f}=?`); vals.push(req.body[f]||null); }});
  if (!sets.length) return error(res, 'No fields to update');

  await pool.query(`UPDATE appointments SET ${sets.join(',')} WHERE id = ?`, [...vals, req.params.id]);
  const [rows] = await pool.query(
    `SELECT a.*, COALESCE(c.name, a.guest_name) AS client_name FROM appointments a
     LEFT JOIN clients c ON a.client_id = c.id WHERE a.id = ?`, [req.params.id]
  );
  return success(res, rows[0]);
}

async function remove(req, res) {
  const [existing] = await pool.query('SELECT id FROM appointments WHERE id = ? AND is_deleted = 0', [req.params.id]);
  if (!existing.length) return error(res, 'Appointment not found', 404);
  await pool.query('UPDATE appointments SET deleted_at = NOW(), is_deleted = 1 WHERE id = ?', [req.params.id]);
  return success(res, { message: 'Appointment deleted' });
}

module.exports = { list, create, update, remove };
