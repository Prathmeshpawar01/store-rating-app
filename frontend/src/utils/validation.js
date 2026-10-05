/**
 * Client-side validation. Mirrors backend/src/validators/rules.js so users get
 * instant feedback; the backend re-validates everything regardless.
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

export const LIMITS = {
  NAME_MIN: 20,
  NAME_MAX: 60,
  STORE_NAME_MIN: 3,
  STORE_NAME_MAX: 60,
  ADDRESS_MAX: 400,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 16,
};

const blank = (v) => v === undefined || v === null || String(v).trim() === '';

export function validateName(value) {
  if (blank(value)) return 'Name is required';
  const len = value.trim().length;
  if (len < LIMITS.NAME_MIN || len > LIMITS.NAME_MAX) {
    return `Name must be between ${LIMITS.NAME_MIN} and ${LIMITS.NAME_MAX} characters (currently ${len})`;
  }
  return '';
}

export function validateStoreName(value) {
  if (blank(value)) return 'Store name is required';
  const len = value.trim().length;
  if (len < LIMITS.STORE_NAME_MIN || len > LIMITS.STORE_NAME_MAX) {
    return `Store name must be between ${LIMITS.STORE_NAME_MIN} and ${LIMITS.STORE_NAME_MAX} characters`;
  }
  return '';
}

export function validateAddress(value) {
  if (blank(value)) return 'Address is required';
  if (value.trim().length > LIMITS.ADDRESS_MAX) return `Address must not exceed ${LIMITS.ADDRESS_MAX} characters`;
  return '';
}

export function validateEmail(value) {
  if (blank(value)) return 'Email is required';
  if (!EMAIL_REGEX.test(value.trim())) return 'Enter a valid email address, like name@example.com';
  return '';
}

export function validatePassword(value) {
  if (blank(value)) return 'Password is required';
  if (!PASSWORD_REGEX.test(value)) {
    return 'Use 8-16 characters with at least one uppercase letter and one special character';
  }
  return '';
}

export function passwordChecks(value = '') {
  return [
    { label: '8-16 characters', ok: value.length >= LIMITS.PASSWORD_MIN && value.length <= LIMITS.PASSWORD_MAX },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(value) },
    { label: 'One special character', ok: /[^A-Za-z0-9]/.test(value) },
  ];
}

export function validateRating(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) return 'Choose a rating from 1 to 5 stars';
  return '';
}

/** Runs a { field: validatorFn } map against values; returns { field: message } for failures. */
export function runValidators(values, validators) {
  const errors = {};
  for (const [field, fn] of Object.entries(validators)) {
    const msg = fn(values[field], values);
    if (msg) errors[field] = msg;
  }
  return errors;
}
