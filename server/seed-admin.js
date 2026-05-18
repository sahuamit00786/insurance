require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/db');

(async () => {
  const hash = await bcrypt.hash('Admin@123', 10);
  await pool.query(`
    INSERT INTO users (name, email, password, role, status)
    VALUES ('Super Admin', 'admin@insurance.com', ?, 'admin', 'active')
    ON DUPLICATE KEY UPDATE password = ?, status = 'active', is_deleted = 0
  `, [hash, hash]);
  console.log('✓ Admin user seeded: admin@insurance.com / Admin@123');
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
