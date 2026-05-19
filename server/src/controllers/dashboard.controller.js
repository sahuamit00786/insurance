const { pool } = require('../config/db');
const { success } = require('../utils/response');

async function getStats(req, res) {
  const [[{ totalClients }]] = await pool.query('SELECT COUNT(*) AS totalClients FROM clients WHERE is_deleted = 0');
  const [[{ activeInsurance }]] = await pool.query(
    `SELECT COUNT(*) AS activeInsurance FROM insurances i
     JOIN lookup_values lv ON i.status_id = lv.id
     WHERE i.is_deleted = 0 AND UPPER(lv.value) IN ('ACTIVE','IN-FORCE')`
  );
  const [[{ totalDocuments }]] = await pool.query('SELECT COUNT(*) AS totalDocuments FROM documents WHERE is_deleted = 0');
  const [[{ totalStaff }]] = await pool.query('SELECT COUNT(*) AS totalStaff FROM users WHERE status = "active" AND is_deleted = 0 AND role != "superadmin"');

  return success(res, { totalClients, activeInsurance, totalDocuments, totalStaff });
}

async function getUpcomingBirthdays(req, res) {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

  const [rows] = await pool.query(
    `SELECT * FROM (
       SELECT
         id, name, date_of_birth, phone,
         CASE
           WHEN STR_TO_DATE(CONCAT(YEAR(CURDATE()), '-', DATE_FORMAT(date_of_birth, '%m-%d')), '%Y-%m-%d') >= CURDATE()
           THEN STR_TO_DATE(CONCAT(YEAR(CURDATE()), '-', DATE_FORMAT(date_of_birth, '%m-%d')), '%Y-%m-%d')
           ELSE STR_TO_DATE(CONCAT(YEAR(CURDATE()) + 1, '-', DATE_FORMAT(date_of_birth, '%m-%d')), '%Y-%m-%d')
         END AS next_birthday,
         DATEDIFF(
           CASE
             WHEN STR_TO_DATE(CONCAT(YEAR(CURDATE()), '-', DATE_FORMAT(date_of_birth, '%m-%d')), '%Y-%m-%d') >= CURDATE()
             THEN STR_TO_DATE(CONCAT(YEAR(CURDATE()), '-', DATE_FORMAT(date_of_birth, '%m-%d')), '%Y-%m-%d')
             ELSE STR_TO_DATE(CONCAT(YEAR(CURDATE()) + 1, '-', DATE_FORMAT(date_of_birth, '%m-%d')), '%Y-%m-%d')
           END,
           CURDATE()
         ) AS days_until_birthday
       FROM clients
       WHERE date_of_birth IS NOT NULL AND is_deleted = 0
     ) t
     WHERE t.days_until_birthday <= 7
     ORDER BY t.days_until_birthday ASC
     LIMIT ?`,
    [limit]
  );

  return success(res, rows);
}

async function getExpiry(req, res) {
  const { type = 'expiring' } = req.query;
  const page   = Math.max(1, parseInt(req.query.page) || 1);
  const limit  = 10;
  const offset = (page - 1) * limit;

  const isExpired = type === 'expired';
  const dateFilter = isExpired
    ? 'DATEDIFF(CURDATE(), i.premium_due_date) BETWEEN 1 AND 7'
    : 'DATEDIFF(i.premium_due_date, CURDATE()) BETWEEN 0 AND 7';
  const orderBy = isExpired
    ? 'i.premium_due_date DESC'
    : 'i.premium_due_date ASC';

  const baseFrom = `
    FROM insurances i
    JOIN clients c ON i.client_id = c.id
    LEFT JOIN lookup_values lv ON i.status_id = lv.id
    WHERE i.premium_due_date IS NOT NULL AND i.is_deleted = 0 AND c.is_deleted = 0 AND ${dateFilter}`;

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${baseFrom}`, []);

  const [rows] = await pool.query(
    `SELECT
       i.id, i.policy_no,
       c.id AS client_id, c.name AS client_name, c.phone, c.date_of_birth,
       i.premium_due_date AS due_date,
       i.maturity_date,
       DATEDIFF(i.premium_due_date, CURDATE()) AS days_until_expiry,
       lv.value AS status
     ${baseFrom}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  return success(res, { rows, total, page, limit });
}

async function getMaturity(req, res) {
  const page   = Math.max(1, parseInt(req.query.page) || 1);
  const limit  = 10;
  const offset = (page - 1) * limit;

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM insurances i
     JOIN clients c ON i.client_id = c.id
     WHERE i.maturity_date IS NOT NULL AND i.is_deleted = 0 AND c.is_deleted = 0
       AND DATEDIFF(i.maturity_date, CURDATE()) BETWEEN 0 AND 30`
  );

  const [rows] = await pool.query(
    `SELECT i.id, i.policy_no,
            c.id AS client_id, c.name AS client_name,
            i.maturity_date,
            DATEDIFF(i.maturity_date, CURDATE()) AS days_until_maturity
     FROM insurances i
     JOIN clients c ON i.client_id = c.id
     WHERE i.maturity_date IS NOT NULL AND i.is_deleted = 0 AND c.is_deleted = 0
       AND DATEDIFF(i.maturity_date, CURDATE()) BETWEEN 0 AND 30
     ORDER BY i.maturity_date ASC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  return success(res, { rows, total, page, limit });
}

module.exports = { getStats, getUpcomingBirthdays, getExpiry, getMaturity };
