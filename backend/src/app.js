const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const pool = require('./config/database');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const storeRoutes = require('./routes/storeRoutes');
const userRoutes = require('./routes/userRoutes');
const ownerRoutes = require('./routes/ownerRoutes');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 'loopback');

// Basic security headers
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Cross-Origin-Resource-Policy': 'same-site',
  });
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin / non-browser requests (no Origin header) and configured origins.
      if (!origin || config.corsOrigins.includes(origin) || config.corsOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '100kb' }));

app.get('/api/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, message: 'API is healthy', data: { database: 'connected' } });
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/owner', ownerRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
