const { pool } = require('../config/db');
const { success, error } = require('../utils/response');

const REPORT_CONFIGS = {
  clients: {
    from: `FROM clients c
           LEFT JOIN (
             SELECT client_id,
                    COUNT(*)                  AS insurance_count,
                    SUM(premium)              AS total_premium,
                    MIN(premium_due_date)     AS earliest_due,
                    MAX(premium_due_date)     AS latest_due
             FROM insurances
             WHERE is_deleted = 0
             GROUP BY client_id
           ) ins ON ins.client_id = c.id
           WHERE c.is_deleted = 0`,
    columns: {
      name:             'c.name',
      identification_no:'c.identification_no',
      date_of_birth:    'c.date_of_birth',
      phone:            'c.phone',
      email:            'c.email',
      address:          'c.address',
      insurance_count:  'COALESCE(ins.insurance_count, 0) AS insurance_count',
      total_premium:    'COALESCE(ins.total_premium, 0.00) AS total_premium',
      earliest_due:     'ins.earliest_due',
      latest_due:       'ins.latest_due',
      created_at:       'DATE(c.created_at) AS created_at',
      notes:            `(SELECT GROUP_CONCAT(CONCAT('[', DATE_FORMAT(n.created_at,'%d %b %Y %H:%i'), '] ', IF(n.title IS NOT NULL AND n.title != '', CONCAT(n.title, ': '), ''), n.body) ORDER BY n.created_at DESC SEPARATOR '\n') FROM notes n WHERE n.client_id = c.id AND n.is_deleted = 0) AS notes`,
    },
    filterDate: 'c.created_at',
    order:      'ORDER BY c.name ASC',
  },

  insurances: {
    from: `FROM insurances i
           JOIN clients c ON i.client_id = c.id
           LEFT JOIN lookup_values pc  ON i.plan_code_id      = pc.id
           LEFT JOIN lookup_values st  ON i.status_id         = st.id
           LEFT JOIN lookup_values pm  ON i.payment_mode_id   = pm.id
           LEFT JOIN lookup_values pmt ON i.payment_method_id = pmt.id
           WHERE i.is_deleted = 0 AND c.is_deleted = 0`,
    columns: {
      client_name:       'c.name AS client_name',
      policy_no:         'i.policy_no',
      plan_code:         'pc.value AS plan_code',
      status:            'st.value AS status',
      payment_mode:      'pm.value AS payment_mode',
      payment_method:    'pmt.value AS payment_method',
      issued_date:       'i.issued_date',
      maturity_date:     'i.maturity_date',
      premium_due_date:  'i.premium_due_date',
      premium:           'i.premium',
      days_left:         'DATEDIFF(i.premium_due_date, CURDATE()) AS days_left',
    },
    filterDate: 'i.premium_due_date',
    order:      'ORDER BY i.premium_due_date ASC',
  },

  payments: {
    from: `FROM payments p
           JOIN clients c ON p.client_id = c.id
           LEFT JOIN lookup_values pm  ON p.payment_mode_id   = pm.id
           LEFT JOIN lookup_values pmt ON p.payment_method_id = pmt.id
           WHERE p.is_deleted = 0 AND c.is_deleted = 0`,
    columns: {
      client_name:    'c.name AS client_name',
      client_phone:   'c.phone AS client_phone',
      payment_date:   'p.payment_date',
      amount:         'p.amount',
      receipt_no:     'p.receipt_no',
      payment_mode:   'pm.value AS payment_mode',
      payment_method: 'pmt.value AS payment_method',
      remarks:        'p.remarks',
    },
    filterDate: 'p.payment_date',
    order:      'ORDER BY p.payment_date DESC',
  },

  notes: {
    from: `FROM notes n
           JOIN clients c ON n.client_id = c.id
           LEFT JOIN users u ON n.created_by = u.id
           WHERE n.is_deleted = 0 AND c.is_deleted = 0`,
    columns: {
      client_name: 'c.name AS client_name',
      client_phone:'c.phone AS client_phone',
      title:       'n.title',
      body:        'n.body',
      pinned:      "IF(n.pinned = 1, 'Yes', 'No') AS pinned",
      created_by:  'u.name AS created_by',
      note_time:   'n.created_at AS note_time',
    },
    filterDate: 'n.created_at',
    order:      'ORDER BY c.name ASC, n.created_at DESC',
  },
};

async function generate(req, res) {
  const {
    type, fields,
    from: fromDate, to: toDate,
    search, client_id,
    status_id, plan_code_id, payment_mode_id,
    expiry_days, expired,
  } = req.query;

  const config = REPORT_CONFIGS[type];
  if (!config) return error(res, 'Invalid report type');

  const requestedFields = fields ? fields.split(',') : Object.keys(config.columns);
  const selectParts = requestedFields
    .filter(f => config.columns[f])
    .map(f => config.columns[f]);

  if (!selectParts.length) return error(res, 'No valid fields selected');

  const where = [];
  const params = [];

  if (fromDate) { where.push(`DATE(${config.filterDate}) >= ?`); params.push(fromDate); }
  if (toDate)   { where.push(`DATE(${config.filterDate}) <= ?`); params.push(toDate);   }

  if (client_id) { where.push('c.id = ?'); params.push(parseInt(client_id)); }

  if (type === 'clients') {
    if (search) { where.push('c.name LIKE ?'); params.push(`%${search}%`); }
  }

  if (type === 'insurances') {
    if (search) {
      where.push('i.policy_no LIKE ?');
      params.push(`%${search}%`);
    }
    if (plan_code_id)    { where.push('i.plan_code_id = ?');    params.push(plan_code_id);    }
    if (status_id)       { where.push('i.status_id = ?');       params.push(status_id);       }
    if (payment_mode_id) { where.push('i.payment_mode_id = ?'); params.push(payment_mode_id); }

    if (expired === 'true') {
      where.push('i.premium_due_date IS NOT NULL AND DATEDIFF(i.premium_due_date, CURDATE()) < 0');
    } else if (expired === 'false') {
      where.push('i.premium_due_date IS NOT NULL AND DATEDIFF(i.premium_due_date, CURDATE()) >= 0');
    }
    if (expiry_days && expired !== 'true') {
      where.push('i.premium_due_date IS NOT NULL AND DATEDIFF(i.premium_due_date, CURDATE()) BETWEEN 0 AND ?');
      params.push(parseInt(expiry_days));
    }
  }

  if (type === 'payments') {
    if (payment_mode_id) { where.push('p.payment_mode_id = ?'); params.push(payment_mode_id); }
  }

  const whereClause = where.length ? `AND ${where.join(' AND ')}` : '';
  const sql = `SELECT ${selectParts.join(', ')} ${config.from} ${whereClause} ${config.order} LIMIT 5000`;
  const [rows] = await pool.query(sql, params);

  return success(res, { headers: requestedFields, rows, total: rows.length });
}

module.exports = { generate };
