const path = require('path');
const fs   = require('fs');

require('dotenv').config({ path: path.join(__dirname, '.env') });
const { patchConsole } = require('./utils/logger');
patchConsole();

require('express-async-errors');

process.on('uncaughtException',  err => console.error('Uncaught exception:', err.stack || err));
process.on('unhandledRejection', err => console.error('Unhandled rejection:', err?.stack || err));

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const { error }          = require('./utils/response');
const { testConnection } = require('./config/db');
const { runMigrations }  = require('./utils/migrate');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ crossOriginResourcePolicy: false }));

const ALLOWED_ORIGINS = [
  'https://testing.insur-vault.com',
  'https://murale.insur-vault.com',
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('tiny'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

const UPLOAD_DIR = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

app.use('/api/auth',         require('./routes/auth.routes'));
app.use('/api/dashboard',    require('./routes/dashboard.routes'));
app.use('/api/clients',      require('./routes/clients.routes'));
app.use('/api/documents',    require('./routes/documents.routes'));
app.use('/api/payments',     require('./routes/payments.routes'));
app.use('/api/insurances',   require('./routes/insurances.routes'));
app.use('/api/appointments', require('./routes/appointments.routes'));
app.use('/api/staff',        require('./routes/staff.routes'));
app.use('/api/lookup',       require('./routes/lookup.routes'));
app.use('/api/templates',    require('./routes/templates.routes'));
app.use('/api/reports',      require('./routes/reports.routes'));

app.use((req, res) => error(res, `Route ${req.path} not found`, 404));

app.use((err, req, res, next) => {
  console.error(err);
  const code = err.statusCode || err.status || 500;
  error(res, err.message || 'Internal server error', code);
});

(async () => {
  try {
    await testConnection();
    app.listen(PORT, () => console.log(`✓ Server running on port ${PORT}`));
  } catch (err) {
    console.error('Startup failed:', err.message);
    process.exit(1);
  }
})();

module.exports = app;
