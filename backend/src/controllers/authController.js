const pool = require('../config/database');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const { hashPassword, comparePassword, signToken, toPublicUser } = require('../utils/security');

const USER_COLUMNS = 'id, name, email, address, role, created_at, updated_at';

/**
 * POST /api/auth/register
 * Public sign-up. The role is ALWAYS 'USER' – any role sent by the client is
 * stripped by the validation schema and ignored here.
 */
const register = async (req, res) => {
  const { name, email, address, password } = req.body;

  const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (existing.length) throw ApiError.conflict('Email is already registered');

  const hash = await hashPassword(password);
  const [result] = await pool.execute(
    "INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, 'USER')",
    [name, email, hash, address]
  );

  const [rows] = await pool.execute(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [result.insertId]);
  const user = rows[0];

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Registration successful',
    data: { token: signToken(user), user: toPublicUser(user) },
  });
};

/** POST /api/auth/login – common login for all roles. */
const login = async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await pool.execute(`SELECT ${USER_COLUMNS}, password FROM users WHERE email = ? LIMIT 1`, [email]);
  const user = rows[0];

  // Same message whether the email or the password is wrong (no user enumeration).
  const ok = user ? await comparePassword(password, user.password) : false;
  if (!ok) throw ApiError.unauthorized('Invalid email or password');

  return sendSuccess(res, {
    message: 'Login successful',
    data: { token: signToken(user), user: toPublicUser(user) },
  });
};

/** GET /api/auth/me – the currently authenticated user. */
const me = async (req, res) => {
  const [rows] = await pool.execute(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [req.user.id]);
  if (!rows.length) throw ApiError.notFound('User not found');
  return sendSuccess(res, { message: 'Current user', data: { user: toPublicUser(rows[0]) } });
};

/**
 * POST /api/auth/change-password (any authenticated role)
 * Verifies the current password, stores a new bcrypt hash and returns a fresh
 * token (older tokens are invalidated).
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const [rows] = await pool.execute('SELECT id, password FROM users WHERE id = ?', [req.user.id]);
  if (!rows.length) throw ApiError.notFound('User not found');

  const ok = await comparePassword(currentPassword, rows[0].password);
  if (!ok) {
    throw ApiError.badRequest('Current password is incorrect', {
      currentPassword: 'Current password is incorrect',
    });
  }

  const hash = await hashPassword(newPassword);
  // Explicitly bump updated_at so tokens issued before this change stop working.
  await pool.execute(
    'UPDATE users SET password = ?, updated_at = GREATEST(CURRENT_TIMESTAMP, updated_at + INTERVAL 1 SECOND) WHERE id = ?',
    [hash, req.user.id]
  );

  const [fresh] = await pool.execute(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [req.user.id]);
  return sendSuccess(res, {
    message: 'Password updated successfully',
    data: { token: signToken(fresh[0]), user: toPublicUser(fresh[0]) },
  });
};

module.exports = { register, login, me, changePassword };
