const { pool } = require('../config/db');
const { error } = require('../utils/response');

function checkPermission(module, action) {
  return async (req, res, next) => {
    if (req.user.role === 'superadmin' || req.user.role === 'admin') return next();

    const [rows] = await pool.query(
      'SELECT ?? FROM permissions WHERE user_id = ? AND module = ?',
      [`can_${action}`, req.user.id, module]
    );

    if (!rows.length || !rows[0][`can_${action}`]) {
      return error(res, 'Permission denied', 403);
    }
    next();
  };
}

module.exports = { checkPermission };
