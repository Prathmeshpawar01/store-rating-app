const jwt = require('jsonwebtoken');
const config = require('../config/env');
const pool = require('../config/database');
const ApiError = require('../utils/ApiError');

/**
 * Verifies the `Authorization: Bearer <token>` header, then re-loads the user
 * from the database so the role used for authorization is always the current
 * one stored server-side (never the role the client claims).
 * Sets req.user = { id, name, email, role }.
 */
const authenticateToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw ApiError.unauthorized('Authentication token is missing');
    }

    let payload;
    try {
      payload = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
    } catch (err) {
      throw ApiError.unauthorized(
        err.name === 'TokenExpiredError' ? 'Session expired, please log in again' : 'Invalid authentication token'
      );
    }

    const [rows] = await pool.execute(
      'SELECT id, name, email, role, updated_at FROM users WHERE id = ? LIMIT 1',
      [payload.sub]
    );
    const user = rows[0];
    if (!user) throw ApiError.unauthorized('User no longer exists');

    // Tokens issued before the last password change are rejected.
    if (payload.pwdv !== undefined && payload.pwdv !== passwordVersion(user)) {
      throw ApiError.unauthorized('Session expired, please log in again');
    }

    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    return next();
  } catch (err) {
    return next(err);
  }
};

/**
 * Version stamp embedded in tokens; changes whenever the user row is updated
 * (e.g. password change), which invalidates older tokens.
 */
function passwordVersion(user) {
  return new Date(user.updated_at).getTime();
}

module.exports = { authenticateToken, passwordVersion };
