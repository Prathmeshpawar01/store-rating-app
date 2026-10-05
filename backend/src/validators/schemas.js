/**
 * Request body schemas. Each schema maps a field to:
 *   - rule:     validation function from ./rules
 *   - trim:     trim whitespace before validating/storing
 *   - lower:    lower-case (emails)
 *   - toInt:    convert to integer after validation
 *   - optional: skip when the field is absent
 * A schema may also define `check(body)` for cross-field rules (e.g. confirm password).
 */
const r = require('./rules');

const registerSchema = {
  fields: {
    name: { rule: r.name, trim: true },
    email: { rule: r.email, trim: true, lower: true },
    address: { rule: r.address, trim: true },
    password: { rule: r.password },
    confirmPassword: { rule: r.requiredString('Confirm password'), optional: true },
  },
  check(body) {
    if (body.confirmPassword !== undefined && body.confirmPassword !== body.password) {
      return { confirmPassword: 'Passwords do not match' };
    }
    return null;
  },
};

const loginSchema = {
  fields: {
    email: { rule: r.email, trim: true, lower: true },
    password: { rule: r.requiredString('Password') },
  },
};

const changePasswordSchema = {
  fields: {
    currentPassword: { rule: r.requiredString('Current password') },
    newPassword: { rule: r.password },
    confirmNewPassword: { rule: r.requiredString('Confirm new password') },
  },
  check(body) {
    if (body.newPassword !== body.confirmNewPassword) {
      return { confirmNewPassword: 'Passwords do not match' };
    }
    if (body.newPassword === body.currentPassword) {
      return { newPassword: 'New password must be different from the current password' };
    }
    return null;
  },
};

const adminCreateUserSchema = {
  fields: {
    name: { rule: r.name, trim: true },
    email: { rule: r.email, trim: true, lower: true },
    address: { rule: r.address, trim: true },
    password: { rule: r.password },
    role: { rule: r.role, trim: true, upper: true },
  },
};

const createStoreSchema = {
  fields: {
    name: { rule: r.storeName, trim: true },
    email: { rule: r.email, trim: true, lower: true },
    address: { rule: r.address, trim: true },
    ownerId: { rule: r.positiveId('Store owner'), toInt: true },
  },
};

const ratingSchema = {
  fields: {
    rating: { rule: r.rating, toInt: true },
  },
};

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  adminCreateUserSchema,
  createStoreSchema,
  ratingSchema,
};
