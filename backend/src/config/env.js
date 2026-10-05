const path = require('path');
const dotenv = require('dotenv');

// Load backend/.env (if present). Real environment variables always win.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isTest = process.env.NODE_ENV === 'test';

const config = {
  env: process.env.NODE_ENV || 'development',
  isTest,
  port: parseInt(process.env.PORT, 10) || 5000,
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: isTest
      ? process.env.DB_NAME_TEST || 'store_rating_test'
      : process.env.DB_NAME || 'store_rating',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  bcryptRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
};

if (!config.jwt.secret) {
  if (isTest) {
    // Tests get an ephemeral secret so they never depend on a developer's .env
    config.jwt.secret = 'test_only_jwt_secret_' + process.pid;
  } else {
    throw new Error(
      'JWT_SECRET is not set. Copy backend/.env.example to backend/.env and set JWT_SECRET.'
    );
  }
}

module.exports = config;
