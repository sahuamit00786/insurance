require('dotenv').config();
const { runMigrations }  = require('./utils/migrate');
const { testConnection } = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await runMigrations();
    await testConnection();
    app.listen(PORT, () => console.log(`✓ Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Startup failed:', err.message);
    process.exit(1);
  }
})();
