const ApiError = require('./ApiError');
const config = require('../config/env');

/**
 * Minimal in-memory fixed-window rate limiter (per IP), used on auth endpoints
 * to slow down password guessing. Disabled while running tests.
 * For multi-instance deployments use a shared store (e.g. Redis) instead.
 */
const rateLimit = ({ windowMs = 15 * 60 * 1000, max = 20, message = 'Too many attempts, please try again later' } = {}) => {
  const hits = new Map();

  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.reset <= now) hits.delete(key);
  }, windowMs);
  timer.unref();

  return (req, res, next) => {
    if (config.isTest) return next();
    const key = req.ip;
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.reset <= now) {
      entry = { count: 0, reset: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return next(new ApiError(429, message));
    }
    return next();
  };
};

module.exports = { rateLimit };
