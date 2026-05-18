const { pool } = require('../config/db');
const { success, error } = require('../utils/response');

async function list(req, res) {
  const [rows] = await pool.query(
    `SELECT p.*, pm.value AS payment_mode, pmt.value AS payment_method
     FROM payments p
     LEFT JOIN lookup_values pm  ON p.payment_mode_id   = pm.id
     LEFT JOIN lookup_values pmt ON p.payment_method_id = pmt.id
     WHERE p.client_id = ? AND p.is_deleted = 0
     ORDER BY p.payment_date DESC`,
    [req.params.clientId]
  );
  return success(res, rows);
}

async function create(req, res) {
  const { payment_date, amount, receipt_no, payment_mode_id, payment_method_id, remarks, insurance_id } = req.body;
  if (!payment_date || !amount) return error(res, 'payment_date and amount required');

  const [result] = await pool.query(
    `INSERT INTO payments (client_id, insurance_id, payment_date, amount, receipt_no, payment_mode_id, payment_method_id, remarks, created_by)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [req.params.clientId, insurance_id||null, payment_date, amount, receipt_no||null, payment_mode_id||null, payment_method_id||null, remarks||null, req.user.id]
  );
  const [rows] = await pool.query('SELECT * FROM payments WHERE id = ?', [result.insertId]);
  return success(res, rows[0], 201);
}

async function update(req, res) {
  const [existing] = await pool.query('SELECT id FROM payments WHERE id = ?', [req.params.payId]);
  if (!existing.length) return error(res, 'Payment not found', 404);

  const fields = ['insurance_id','payment_date','amount','receipt_no','payment_mode_id','payment_method_id','remarks'];
  const sets = []; const vals = [];
  fields.forEach(f => { if (req.body[f] !== undefined) { sets.push(`${f}=?`); vals.push(req.body[f]||null); }});
  if (!sets.length) return error(res, 'No fields to update');

  await pool.query(`UPDATE payments SET ${sets.join(',')} WHERE id = ?`, [...vals, req.params.payId]);
  const [rows] = await pool.query('SELECT * FROM payments WHERE id = ?', [req.params.payId]);
  return success(res, rows[0]);
}

async function remove(req, res) {
  const [existing] = await pool.query('SELECT id FROM payments WHERE id = ? AND is_deleted = 0', [req.params.payId]);
  if (!existing.length) return error(res, 'Payment not found', 404);
  await pool.query('UPDATE payments SET deleted_at = NOW(), is_deleted = 1 WHERE id = ?', [req.params.payId]);
  return success(res, { message: 'Payment deleted' });
}

module.exports = { list, create, update, remove };
