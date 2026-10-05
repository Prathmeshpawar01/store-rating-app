const ApiError = require('../utils/ApiError');
const config = require('../config/env');

/** 404 for any route that did not match. */
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Central error handler. Produces { success: false, message, errors? } and never
 * leaks stack traces, SQL or other internals to the client.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = 500;
  let message = 'Internal server error';
  let errors;

  if (err instanceof ApiError) {
    status = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON in request body';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  } else if (err.code === 'ER_DUP_ENTRY') {
    status = 409;
    message = 'A record with the same unique value already exists';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    status = 400;
    message = 'Referenced record does not exist';
  } else if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    status = 400;
    message = 'Value violates a database constraint';
  }

  if (status >= 500 && !config.isTest) {
    // Full details are logged server-side only.
    console.error('[error]', err);
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;
  res.status(status).json(body);
};

module.exports = { notFound, errorHandler };
