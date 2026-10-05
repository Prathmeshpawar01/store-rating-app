const ApiError = require('../utils/ApiError');

/**
 * Allows the request through only if the authenticated user's role (loaded from
 * the database by authenticateToken) is one of `roles`.
 *
 *   router.get('/admin/users', authenticateToken, authorizeRoles('ADMIN'), getUsers)
 */
const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to access this resource'));
  }
  return next();
};

module.exports = { authorizeRoles };
