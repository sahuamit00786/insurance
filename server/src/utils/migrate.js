const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

async function runMigrations() {
  // Connect without db first to ensure it exists
  const bare = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT),
    user:     process.env.DB_USER,
    password: process.env.DB_PASS,
  });

  await bare.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
  await bare.query(`USE \`${process.env.DB_NAME}\``);

  await bare.query(`
    CREATE TABLE IF NOT EXISTS migrations_log (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      filename   VARCHAR(255) NOT NULL UNIQUE,
      run_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [ran] = await bare.query('SELECT filename FROM migrations_log');
  const ranSet = new Set(ran.map(r => r.filename));

  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (ranSet.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      try {
        await bare.query(stmt);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`  ⚠ column already exists, skipping`);
        } else {
          throw err;
        }
      }
    }
    await bare.query('INSERT INTO migrations_log (filename) VALUES (?)', [file]);
    console.log('  ✓ migration:', file);
  }

  await bare.end();
  console.log('✓ All migrations complete');
}

module.exports = { runMigrations };
