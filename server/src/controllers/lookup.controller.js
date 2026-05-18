const { pool } = require('../config/db');
const { success, error } = require('../utils/response');

async function listCategories(req, res) {
  const [rows] = await pool.query('SELECT * FROM lookup_categories ORDER BY name');
  return success(res, rows);
}

async function createCategory(req, res) {
  const { name, slug } = req.body;
  if (!name || !slug) return error(res, 'name and slug required');
  const [result] = await pool.query(
    'INSERT INTO lookup_categories (name, slug) VALUES (?,?)', [name, slug]
  );
  const [rows] = await pool.query('SELECT * FROM lookup_categories WHERE id = ?', [result.insertId]);
  return success(res, rows[0], 201);
}

const LOOKUP_ITEM_SELECT = `
  SELECT
    lv.id,
    lv.value        AS lookup_name,
    lv.category_id,
    lv.is_active,
    lv.sort_order,
    lv.no_of_staffs,
    lv.created_at,
    lc.name         AS lookup_type,
    lc.slug         AS lookup_type_slug
  FROM lookup_values lv
  JOIN lookup_categories lc ON lv.category_id = lc.id
`;

async function listAllValues(req, res) {
  const [rows] = await pool.query(
    `${LOOKUP_ITEM_SELECT} WHERE lv.is_deleted = 0 ORDER BY lc.name, lv.sort_order, lv.value`
  );
  return success(res, rows);
}

async function listValues(req, res) {
  const [rows] = await pool.query(
    `${LOOKUP_ITEM_SELECT} WHERE lc.slug = ? AND lv.is_active = 1 AND lv.is_deleted = 0 ORDER BY lv.sort_order, lv.value`,
    [req.params.slug]
  );
  return success(res, rows);
}

async function createValue(req, res) {
  const { category_id, value, sort_order, is_active, no_of_staffs } = req.body;
  if (!category_id || !value) return error(res, 'category_id and value required');
  const [result] = await pool.query(
    'INSERT INTO lookup_values (category_id, value, sort_order, is_active, no_of_staffs) VALUES (?,?,?,?,?)',
    [category_id, value.trim(), sort_order ?? 0, is_active === false || is_active === 0 ? 0 : 1, no_of_staffs || null]
  );
  const [rows] = await pool.query(
    `${LOOKUP_ITEM_SELECT} WHERE lv.id = ?`,
    [result.insertId]
  );
  return success(res, rows[0], 201);
}

async function updateValue(req, res) {
  const [existing] = await pool.query('SELECT id FROM lookup_values WHERE id = ? AND is_deleted = 0', [req.params.id]);
  if (!existing.length) return error(res, 'Lookup value not found', 404);
  const { value, sort_order, is_active, category_id, no_of_staffs } = req.body;
  const sets = [];
  const vals = [];
  if (value !== undefined) { sets.push('value=?'); vals.push(value.trim()); }
  if (sort_order !== undefined) { sets.push('sort_order=?'); vals.push(sort_order); }
  if (is_active !== undefined) { sets.push('is_active=?'); vals.push(is_active ? 1 : 0); }
  if (category_id !== undefined) { sets.push('category_id=?'); vals.push(category_id); }
  if (no_of_staffs !== undefined) { sets.push('no_of_staffs=?'); vals.push(no_of_staffs || null); }
  if (!sets.length) return error(res, 'No fields to update');
  await pool.query(`UPDATE lookup_values SET ${sets.join(',')} WHERE id = ?`, [...vals, req.params.id]);
  const [rows] = await pool.query(
    `${LOOKUP_ITEM_SELECT} WHERE lv.id = ?`,
    [req.params.id]
  );
  return success(res, rows[0]);
}

async function deleteValue(req, res) {
  const [existing] = await pool.query('SELECT id FROM lookup_values WHERE id = ? AND is_deleted = 0', [req.params.id]);
  if (!existing.length) return error(res, 'Lookup value not found', 404);
  await pool.query('UPDATE lookup_values SET deleted_at = NOW(), is_deleted = 1 WHERE id = ?', [req.params.id]);
  return success(res, { message: 'Deleted' });
}

module.exports = {
  listCategories, createCategory, listAllValues, listValues,
  createValue, updateValue, deleteValue,
};
