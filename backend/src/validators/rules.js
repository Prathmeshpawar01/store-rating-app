/**
 * Field-level validation rules shared by all request schemas.
 * Each rule receives the (already trimmed, where applicable) value and returns
 * an error message string, or null when the value is valid.
 *
 * The same rules are mirrored on the frontend in frontend/src/utils/validation.js.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;
const ROLES = ['ADMIN', 'USER', 'OWNER'];

const LIMITS = {
  NAME_MIN: 20,
  NAME_MAX: 60,
  STORE_NAME_MIN: 3,
  STORE_NAME_MAX: 60,
  ADDRESS_MAX: 400,
  EMAIL_MAX: 255,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 16,
};

const isBlank = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

const name = (value) => {
  if (isBlank(value)) return 'Name is required';
  if (typeof value !== 'string') return 'Name must be a string';
  const len = value.trim().length;
  if (len < LIMITS.NAME_MIN || len > LIMITS.NAME_MAX) {
    return `Name must be between ${LIMITS.NAME_MIN} and ${LIMITS.NAME_MAX} characters`;
  }
  return null;
};

const storeName = (value) => {
  if (isBlank(value)) return 'Store name is required';
  if (typeof value !== 'string') return 'Store name must be a string';
  const len = value.trim().length;
  if (len < LIMITS.STORE_NAME_MIN || len > LIMITS.STORE_NAME_MAX) {
    return `Store name must be between ${LIMITS.STORE_NAME_MIN} and ${LIMITS.STORE_NAME_MAX} characters`;
  }
  return null;
};

const address = (value) => {
  if (isBlank(value)) return 'Address is required';
  if (typeof value !== 'string') return 'Address must be a string';
  if (value.trim().length > LIMITS.ADDRESS_MAX) {
    return `Address must not exceed ${LIMITS.ADDRESS_MAX} characters`;
  }
  return null;
};

const email = (value) => {
  if (isBlank(value)) return 'Email is required';
  if (typeof value !== 'string') return 'Email must be a string';
  const v = value.trim();
  if (v.length > LIMITS.EMAIL_MAX) return `Email must not exceed ${LIMITS.EMAIL_MAX} characters`;
  if (!EMAIL_REGEX.test(v)) return 'Please provide a valid email address';
  return null;
};

const password = (value) => {
  if (isBlank(value)) return 'Password is required';
  if (typeof value !== 'string') return 'Password must be a string';
  if (!PASSWORD_REGEX.test(value)) {
    return 'Password must be 8-16 characters and include at least one uppercase letter and one special character';
  }
  return null;
};

const requiredString = (label) => (value) => {
  if (isBlank(value)) return `${label} is required`;
  if (typeof value !== 'string') return `${label} must be a string`;
  return null;
};

/** Ratings: only the integers 1, 2, 3, 4, 5. Rejects 0, 6, -1, 5.5, "abc", "", true … */
const rating = (value) => {
  if (value === undefined || value === null || value === '') return 'Rating is required';
  let n;
  if (typeof value === 'number') n = value;
  else if (typeof value === 'string' && /^[1-5]$/.test(value.trim())) n = Number(value.trim());
  else return 'Rating must be a whole number from 1 to 5';
  if (!Number.isInteger(n) || n < 1 || n > 5) return 'Rating must be a whole number from 1 to 5';
  return null;
};

const role = (value) => {
  if (isBlank(value)) return 'Role is required';
  if (!ROLES.includes(value)) return `Role must be one of: ${ROLES.join(', ')}`;
  return null;
};

const positiveId = (label) => (value) => {
  if (value === undefined || value === null || value === '') return `${label} is required`;
  const s = String(value);
  if (!/^[1-9]\d*$/.test(s)) return `${label} must be a valid id`;
  return null;
};

module.exports = {
  EMAIL_REGEX,
  PASSWORD_REGEX,
  ROLES,
  LIMITS,
  name,
  storeName,
  address,
  email,
  password,
  requiredString,
  rating,
  role,
  positiveId,
};
