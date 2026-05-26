const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const { pool } = require('../config/db');
const { success, error } = require('../utils/response');
const { sendMail } = require('../utils/mailer');
const { otpEmailHtml, welcomeEmailHtml } = require('../utils/emailTemplates');

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return error(res, 'Email and password required');

  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ? AND status = "active" AND is_deleted = 0', [email]
  );
  if (!rows.length) return error(res, 'Invalid credentials', 401);

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return error(res, 'Invalid credentials', 401);

  const [perms] = await pool.query(
    'SELECT module, can_view, can_edit, can_delete, can_update FROM permissions WHERE user_id = ?',
    [user.id]
  );

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return success(res, {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    permissions: perms,
  });
}

async function me(req, res) {
  const [rows] = await pool.query(
    `SELECT id, name, email, role, status, avatar, created_at, updated_at
     FROM users WHERE id = ?`,
    [req.user.id]
  );
  if (!rows.length) return error(res, 'User not found', 404);

  const [perms] = await pool.query(
    'SELECT module, can_view, can_edit, can_delete, can_update FROM permissions WHERE user_id = ?',
    [req.user.id]
  );

  return success(res, { user: rows[0], permissions: perms });
}

async function updateProfile(req, res) {
  const { name, email, password, current_password } = req.body;
  const userId = req.user.id;

  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
  if (!rows.length) return error(res, 'User not found', 404);
  const existing = rows[0];

  if (name !== undefined && !String(name).trim()) {
    return error(res, 'Name is required');
  }

  if (email !== undefined) {
    const nextEmail = String(email).trim().toLowerCase();
    if (!nextEmail) return error(res, 'Email is required');
    const [dup] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [nextEmail, userId]
    );
    if (dup.length) return error(res, 'Email already in use');
  }

  if (password) {
    if (!current_password) return error(res, 'Current password is required to set a new password');
    const valid = await bcrypt.compare(current_password, existing.password);
    if (!valid) return error(res, 'Current password is incorrect', 401);
    if (String(password).length < 8) {
      return error(res, 'New password must be at least 8 characters');
    }
  }

  const sets = [];
  const vals = [];

  if (name !== undefined) {
    sets.push('name = ?');
    vals.push(String(name).trim());
  }
  if (email !== undefined) {
    sets.push('email = ?');
    vals.push(String(email).trim().toLowerCase());
  }
  if (password) {
    sets.push('password = ?');
    vals.push(await bcrypt.hash(password, 10));
  }

  if (!sets.length) return error(res, 'No fields to update');

  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, [...vals, userId]);

  const [updated] = await pool.query(
    `SELECT id, name, email, role, status, avatar, created_at, updated_at
     FROM users WHERE id = ?`,
    [userId]
  );

  return success(res, { user: updated[0] });
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  console.log('[forgotPassword] body:', req.body);
  if (!email) return error(res, 'Email is required');

  const [users] = await pool.query(
    'SELECT id, name, email FROM users WHERE email = ? AND is_deleted = 0',
    [email.trim().toLowerCase()]
  );
  console.log('[forgotPassword] users found:', users.length);
  if (!users.length) return success(res, { message: 'If this email exists, a code has been sent.' });

  const user = users[0];
  const otp   = Math.floor(100000 + Math.random() * 900000).toString();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  console.log('[forgotPassword] generated otp:', otp, 'expires:', expiresAt);

  await pool.query('DELETE FROM password_resets WHERE user_id = ?', [user.id]);
  await pool.query(
    'INSERT INTO password_resets (user_id, token, otp, expires_at) VALUES (?,?,?,?)',
    [user.id, token, otp, expiresAt]
  );
  console.log('[forgotPassword] inserted reset row for user_id:', user.id);

  try {
    await sendMail({
      to: user.email,
      subject: 'Your InsurVault password reset code',
      html: otpEmailHtml({ name: user.name, otp }),
    });
    console.log('[forgotPassword] email sent to:', user.email);
  } catch (mailErr) {
    console.error('[forgotPassword] email FAILED:', mailErr.message);
    return error(res, 'Failed to send OTP email: ' + mailErr.message, 500);
  }

  return success(res, { message: 'OTP sent to your email' });
}

async function verifyOtp(req, res) {
  const { email, otp } = req.body;
  console.log('[verifyOtp] body:', { email, otp });
  if (!email || !otp) return error(res, 'Email and OTP required');

  const [users] = await pool.query(
    'SELECT id FROM users WHERE email = ? AND is_deleted = 0',
    [email.trim().toLowerCase()]
  );
  console.log('[verifyOtp] users found:', users.length);
  if (!users.length) return error(res, 'Invalid code', 400);

  // Debug: check what rows exist for this user
  const [allResets] = await pool.query(
    'SELECT id, otp, used_at, expires_at, UTC_TIMESTAMP() as now FROM password_resets WHERE user_id = ?',
    [users[0].id]
  );
  console.log('[verifyOtp] all reset rows for user:', JSON.stringify(allResets));

  const [resets] = await pool.query(
    `SELECT id, token FROM password_resets
     WHERE user_id = ? AND otp = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP()`,
    [users[0].id, otp]
  );
  console.log('[verifyOtp] matching reset rows:', resets.length);
  if (!resets.length) return error(res, 'Invalid or expired code', 400);

  await pool.query('UPDATE password_resets SET otp_verified = 1 WHERE id = ?', [resets[0].id]);

  return success(res, { reset_token: resets[0].token });
}

async function resetPassword(req, res) {
  const { token, password } = req.body;
  console.log('[resetPassword] token present:', !!token, 'password length:', password?.length);
  if (!token || !password) return error(res, 'Token and password required');
  if (password.length < 8)            return error(res, 'Password must be at least 8 characters');
  if (!/[0-9]/.test(password))         return error(res, 'Password must contain at least one digit');
  if (!/[^A-Za-z0-9]/.test(password))  return error(res, 'Password must contain at least one special character');

  const [allByToken] = await pool.query(
    'SELECT id, used_at, expires_at, otp, otp_verified, UTC_TIMESTAMP() as now FROM password_resets WHERE token = ?',
    [token]
  );
  console.log('[resetPassword] rows for token:', JSON.stringify(allByToken));

  const [resets] = await pool.query(
    `SELECT id, user_id FROM password_resets
     WHERE token = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP()
     AND (otp IS NULL OR otp_verified = 1)`,
    [token]
  );
  console.log('[resetPassword] valid reset rows:', resets.length);
  if (!resets.length) return error(res, 'This link is invalid or has expired', 400);

  await pool.query(
    'UPDATE users SET password = ? WHERE id = ?',
    [await bcrypt.hash(password, 10), resets[0].user_id]
  );
  await pool.query('UPDATE password_resets SET used_at = NOW() WHERE id = ?', [resets[0].id]);

  return success(res, { message: 'Password updated successfully' });
}

module.exports = { login, me, updateProfile, forgotPassword, verifyOtp, resetPassword };
