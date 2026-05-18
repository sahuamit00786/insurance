require('express-async-errors');
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const path        = require('path');
const { error }   = require('./utils/response');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
const ALLOWED_ORIGINS = [
  'https://insurance.upgrowventures.com',
  'http://localhost:5173',
  'http://localhost:5174',
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
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders:   false,
}));

// Static uploads
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || 'uploads')));

// Routes
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

// 404
app.use((req, res) => error(res, `Route ${req.path} not found`, 404));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  const code = err.statusCode || err.status || 500;
  error(res, err.message || 'Internal server error', code);
});

module.exports = app;
