const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:            process.env.DB_HOST,
  port:            parseInt(process.env.DB_PORT),
  database:        process.env.DB_NAME,
  user:            process.env.DB_USER,
  password:        process.env.DB_PASS,
  waitForConnections: true,
  connectionLimit:    20,
  queueLimit:          0,
  timezone:           '+00:00',
});

async function testConnection() {
  const conn = await pool.getConnection();
  conn.release();
  console.log('✓ MySQL connected — database:', process.env.DB_NAME);
}

module.exports = { pool, testConnection };
