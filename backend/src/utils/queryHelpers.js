const ApiError = require('./ApiError');

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Parses and validates list query params: page, limit, sortBy, order.
 *
 * `sortMap` is a whitelist mapping the public sortBy value to a trusted SQL
 * expression. Anything not in the whitelist is rejected with 400, so user input
 * never reaches the ORDER BY clause.
 */
const parseListQuery = (query, { sortMap, defaultSort, defaultOrder = 'asc' }) => {
  const errors = {};

  let page = 1;
  if (query.page !== undefined && query.page !== '') {
    if (!/^[1-9]\d{0,6}$/.test(String(query.page))) errors.page = 'page must be a positive integer';
    else page = parseInt(query.page, 10);
  }

  let limit = DEFAULT_LIMIT;
  if (query.limit !== undefined && query.limit !== '') {
    if (!/^[1-9]\d{0,3}$/.test(String(query.limit)) || parseInt(query.limit, 10) > MAX_LIMIT) {
      errors.limit = `limit must be an integer between 1 and ${MAX_LIMIT}`;
    } else limit = parseInt(query.limit, 10);
  }

  const sortBy = query.sortBy === undefined || query.sortBy === '' ? defaultSort : String(query.sortBy);
  if (!Object.prototype.hasOwnProperty.call(sortMap, sortBy)) {
    errors.sortBy = `sortBy must be one of: ${Object.keys(sortMap).join(', ')}`;
  }

  const orderRaw = query.order === undefined || query.order === '' ? defaultOrder : String(query.order).toLowerCase();
  if (!['asc', 'desc'].includes(orderRaw)) errors.order = 'order must be "asc" or "desc"';

  if (Object.keys(errors).length) {
    throw ApiError.badRequest(Object.values(errors)[0], errors);
  }

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    sortBy,
    sortColumn: sortMap[sortBy],
    order: orderRaw.toUpperCase(),
  };
};

/** Reads an optional string filter, trimmed; returns '' when absent. */
const str = (v) => (typeof v === 'string' ? v.trim() : '');

/** Escapes LIKE wildcards so user input is matched literally. */
const likeValue = (v) => `%${v.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

module.exports = { parseListQuery, str, likeValue, buildPagination, DEFAULT_LIMIT, MAX_LIMIT };
