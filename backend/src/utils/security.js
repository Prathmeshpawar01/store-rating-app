const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { passwordVersion } = require('../middleware/authMiddleware');

const hashPassword = (plain) => bcrypt.hash(plain, config.bcryptRounds);

const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

/** Signs a JWT for a user row (must include id, role and updated_at). */
const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role, pwdv: passwordVersion(user) }, config.jwt.secret, {
    algorithm: 'HS256',
    expiresIn: config.jwt.expiresIn,
  });

/** Public representation of a user – never includes the password hash. */
const toPublicUser = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  address: row.address,
  role: row.role,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

module.exports = { hashPassword, comparePassword, signToken, toPublicUser };
