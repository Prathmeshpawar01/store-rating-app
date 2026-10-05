const ApiError = require('../utils/ApiError');
const { positiveId } = require('../validators/rules');

/**
 * Validates and sanitizes req.body against a schema from validators/schemas.js.
 * Only fields declared in the schema are kept, so extra properties such as
 * `role` on the public register endpoint are silently discarded.
 */
const validateBody = (schema) => (req, res, next) => {
  const input = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const clean = {};
  const errors = {};

  for (const [field, opts] of Object.entries(schema.fields)) {
    let value = input[field];
    if (opts.optional && (value === undefined || value === null || value === '')) continue;
    if (typeof value === 'string') {
      if (opts.trim) value = value.trim();
      if (opts.lower) value = value.toLowerCase();
      if (opts.upper) value = value.toUpperCase();
    }
    const error = opts.rule(value);
    if (error) {
      errors[field] = error;
      continue;
    }
    clean[field] = opts.toInt ? parseInt(value, 10) : value;
  }

  if (Object.keys(errors).length === 0 && typeof schema.check === 'function') {
    Object.assign(errors, schema.check(clean) || {});
  }

  if (Object.keys(errors).length > 0) {
    const first = Object.values(errors)[0];
    return next(ApiError.badRequest(first, errors));
  }

  req.body = clean;
  return next();
};

/** Validates that the named route params are positive integer ids. */
const validateIdParam = (...names) => (req, res, next) => {
  for (const name of names) {
    const error = positiveId('Id')(req.params[name]);
    if (error) return next(ApiError.badRequest(`Invalid ${name}`));
  }
  return next();
};

module.exports = { validateBody, validateIdParam };
