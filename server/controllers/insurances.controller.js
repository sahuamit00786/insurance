const { pool } = require('../config/db');
const { success, error } = require('../utils/response');

/* GET /api/insurances — paginated global list with filters */
async function listAll(req, res) {
  const {
    search, plan_code_id, status_id, payment_mode_id, buying_for_id,
    date_type = 'issued',
    date_from, date_to,
    maturity_from, maturity_to,
    expiry_days,
    expired,
    page = 1, limit = 20,
  } = req.query;

  const rangeFrom = date_from || maturity_from;
  const rangeTo   = date_to   || maturity_to;
  const dateCol = date_type === 'due' ? 'i.premium_due_date' : date_type === 'maturity' ? 'i.maturity_date' : 'i.issued_date';

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const where  = [];
  const params = [];

  if (search) {
    where.push('(c.name LIKE ? OR i.policy_no LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (plan_code_id)    { where.push('i.plan_code_id = ?');    params.push(plan_code_id);    }
  if (status_id)       { where.push('i.status_id = ?');       params.push(status_id);       }
  if (payment_mode_id) { where.push('i.payment_mode_id = ?'); params.push(payment_mode_id); }
  if (buying_for_id)   { where.push('i.buying_for_id = ?');   params.push(buying_for_id);   }

  if (expired === 'true') {
    where.push('i.premium_due_date IS NOT NULL AND DATEDIFF(i.premium_due_date, CURDATE()) < 0');
  } else {
    where.push('i.premium_due_date IS NOT NULL AND DATEDIFF(i.premium_due_date, CURDATE()) >= 0');
  }
  if (rangeFrom) { where.push(`${dateCol} >= ?`); params.push(rangeFrom); }
  if (rangeTo)   { where.push(`${dateCol} <= ?`); params.push(rangeTo);   }
  if (expiry_days) {
    where.push('DATEDIFF(i.premium_due_date, CURDATE()) BETWEEN 0 AND ?');
    params.push(parseInt(expiry_days));
  }

  const andClause = where.length ? `AND ${where.join(' AND ')}` : '';

  const BASE = `
    FROM insurances i
    JOIN clients c ON i.client_id = c.id
    LEFT JOIN lookup_values pc  ON i.plan_code_id      = pc.id
    LEFT JOIN lookup_values st  ON i.status_id         = st.id
    LEFT JOIN lookup_values pm  ON i.payment_mode_id   = pm.id
    LEFT JOIN lookup_values pmt ON i.payment_method_id = pmt.id
    LEFT JOIN lookup_values bf  ON i.buying_for_id     = bf.id
    WHERE i.is_deleted = 0 AND c.is_deleted = 0
  `;

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total ${BASE} ${andClause}`, params
  );

  const [rows] = await pool.query(
    `SELECT
       i.id, i.client_id, i.policy_no, i.identification_no,
       i.issued_date, i.maturity_date, i.premium, i.premium_due_date,
       i.plan_code_id, i.status_id, i.payment_mode_id, i.payment_method_id,
       i.buying_for_id, i.note,
       pc.value  AS plan_code,
       st.value  AS status,
       c.name    AS client_name,
       c.phone,
       c.email,
       pm.value  AS payment_mode,
       pmt.value AS payment_method,
       bf.value  AS buying_for,
       DATEDIFF(i.premium_due_date, CURDATE()) AS days_left
     ${BASE} ${andClause}
     ORDER BY i.premium_due_date ${expired === 'true' ? 'DESC' : 'ASC'}
     LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );

  return success(res, { rows, total, page: parseInt(page), limit: parseInt(limit) });
}

async function list(req, res) {
  const [rows] = await pool.query(
    `SELECT i.*,
            pc.value  AS plan_code,
            st.value  AS status,
            pm.value  AS payment_mode,
            pmt.value AS payment_method,
            bf.value  AS buying_for,
            DATEDIFF(i.premium_due_date, CURDATE()) AS days_left
     FROM insurances i
     LEFT JOIN lookup_values pc  ON i.plan_code_id      = pc.id
     LEFT JOIN lookup_values st  ON i.status_id         = st.id
     LEFT JOIN lookup_values pm  ON i.payment_mode_id   = pm.id
     LEFT JOIN lookup_values pmt ON i.payment_method_id = pmt.id
     LEFT JOIN lookup_values bf  ON i.buying_for_id     = bf.id
     WHERE i.client_id = ? AND i.is_deleted = 0
     ORDER BY i.created_at DESC`,
    [req.params.clientId]
  );
  return success(res, rows);
}

async function create(req, res) {
  const {
    policy_no, identification_no, plan_code_id, issued_date, maturity_date,
    premium, status_id, payment_mode_id, payment_method_id, premium_due_date, note, buying_for_id,
  } = req.body;
  if (!policy_no) return error(res, 'policy_no required');

  const [result] = await pool.query(
    `INSERT INTO insurances
       (client_id, identification_no, policy_no, plan_code_id,
        issued_date, maturity_date, premium, status_id,
        payment_mode_id, payment_method_id, premium_due_date, note, buying_for_id)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      req.params.clientId,
      identification_no || null, policy_no,
      plan_code_id || null, issued_date || null, maturity_date || null,
      premium || null, status_id || null,
      payment_mode_id || null, payment_method_id || null, premium_due_date || null,
      note || null, buying_for_id || null,
    ]
  );
  const [rows] = await pool.query(
    `SELECT i.*,
            pc.value AS plan_code, st.value AS status,
            pm.value AS payment_mode, pmt.value AS payment_method,
            bf.value AS buying_for
     FROM insurances i
     LEFT JOIN lookup_values pc  ON i.plan_code_id      = pc.id
     LEFT JOIN lookup_values st  ON i.status_id         = st.id
     LEFT JOIN lookup_values pm  ON i.payment_mode_id   = pm.id
     LEFT JOIN lookup_values pmt ON i.payment_method_id = pmt.id
     LEFT JOIN lookup_values bf  ON i.buying_for_id     = bf.id
     WHERE i.id = ?`,
    [result.insertId]
  );
  return success(res, rows[0], 201);
}

async function update(req, res) {
  const [existing] = await pool.query('SELECT id FROM insurances WHERE id = ? AND is_deleted = 0', [req.params.insId]);
  if (!existing.length) return error(res, 'Insurance not found', 404);

  const fields = [
    'policy_no', 'identification_no', 'plan_code_id', 'issued_date', 'maturity_date',
    'premium', 'status_id', 'payment_mode_id', 'payment_method_id', 'premium_due_date', 'note', 'buying_for_id',
  ];
  const sets = [], vals = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) { sets.push(`${f}=?`); vals.push(req.body[f] || null); }
  });
  if (!sets.length) return error(res, 'No fields to update');

  await pool.query(`UPDATE insurances SET ${sets.join(',')} WHERE id = ?`, [...vals, req.params.insId]);
  const [rows] = await pool.query(
    `SELECT i.*,
            pc.value AS plan_code, st.value AS status,
            pm.value AS payment_mode, pmt.value AS payment_method,
            bf.value AS buying_for
     FROM insurances i
     LEFT JOIN lookup_values pc  ON i.plan_code_id      = pc.id
     LEFT JOIN lookup_values st  ON i.status_id         = st.id
     LEFT JOIN lookup_values pm  ON i.payment_mode_id   = pm.id
     LEFT JOIN lookup_values pmt ON i.payment_method_id = pmt.id
     LEFT JOIN lookup_values bf  ON i.buying_for_id     = bf.id
     WHERE i.id = ?`,
    [req.params.insId]
  );
  return success(res, rows[0]);
}

async function remove(req, res) {
  const [existing] = await pool.query('SELECT id FROM insurances WHERE id = ? AND is_deleted = 0', [req.params.insId]);
  if (!existing.length) return error(res, 'Insurance not found', 404);
  await pool.query('UPDATE insurances SET deleted_at = NOW(), is_deleted = 1 WHERE id = ?', [req.params.insId]);
  return success(res, { message: 'Insurance deleted' });
}

module.exports = { listAll, list, create, update, remove };
