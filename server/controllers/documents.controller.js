const path  = require('path');
const fs    = require('fs');
const { pool } = require('../config/db');
const { success, error } = require('../utils/response');

async function list(req, res) {
  const [rows] = await pool.query(
    `SELECT d.*, lv.value AS document_type, u.name AS uploaded_by_name
     FROM documents d
     LEFT JOIN lookup_values lv ON d.document_type_id = lv.id
     LEFT JOIN users u ON d.uploaded_by = u.id
     WHERE d.client_id = ? AND d.is_deleted = 0
     ORDER BY d.created_at DESC`,
    [req.params.clientId]
  );
  return success(res, rows);
}

async function upload(req, res) {
  if (!req.file) return error(res, 'No file uploaded');
  const { document_type_id } = req.body;
  const [result] = await pool.query(
    `INSERT INTO documents (client_id, filename, original_name, file_type, file_size, document_type_id, uploaded_by)
     VALUES (?,?,?,?,?,?,?)`,
    [
      req.params.clientId,
      req.file.filename,
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      document_type_id || null,
      req.user.id,
    ]
  );
  const [rows] = await pool.query('SELECT * FROM documents WHERE id = ?', [result.insertId]);
  return success(res, rows[0], 201);
}

async function remove(req, res) {
  const [rows] = await pool.query('SELECT id FROM documents WHERE id = ? AND is_deleted = 0', [req.params.docId]);
  if (!rows.length) return error(res, 'Document not found', 404);
  await pool.query('UPDATE documents SET deleted_at = NOW(), is_deleted = 1 WHERE id = ?', [req.params.docId]);
  return success(res, { message: 'Document deleted' });
}

async function serveFile(req, res) {
  const [rows] = await pool.query('SELECT * FROM documents WHERE id = ? AND is_deleted = 0', [req.params.docId]);
  if (!rows.length) return error(res, 'Document not found', 404);
  const filePath = path.resolve(process.env.UPLOAD_DIR || 'uploads', rows[0].filename);
  if (!fs.existsSync(filePath)) return error(res, 'File not found on disk', 404);
  res.setHeader('Content-Disposition', `inline; filename="${rows[0].original_name}"`);
  res.setHeader('Content-Type', rows[0].file_type);
  res.sendFile(filePath);
}

module.exports = { list, upload, remove, serveFile };
