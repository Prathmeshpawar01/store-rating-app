const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { setup, teardown, api, login, loginAs } = require('./helpers');

const VALID_NAME = 'Integration Test Customer Name';

describe('Authentication', () => {
  before(setup);
  after(teardown);

  describe('POST /api/auth/login', () => {
    it('logs in an admin and returns token + role (no password in response)', async () => {
      const res = await api('POST', '/auth/login', { body: { email: 'admin@example.com', password: 'Admin@1234' } });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.equal(res.body.data.user.role, 'ADMIN');
      assert.equal(res.body.data.user.password, undefined);
      assert.ok(!JSON.stringify(res.body).includes('$2'), 'bcrypt hash must never be returned');
    });

    it('logs in a store owner and a normal user with their roles', async () => {
      const owner = await api('POST', '/auth/login', { body: { email: 'owner@example.com', password: 'Admin@1234' } });
      assert.equal(owner.status, 200);
      assert.equal(owner.body.data.user.role, 'OWNER');

      const user = await api('POST', '/auth/login', { body: { email: 'USER@example.com ', password: 'User@1234' } });
      assert.equal(user.status, 200, 'email should be trimmed and case-insensitive');
      assert.equal(user.body.data.user.role, 'USER');
    });

    it('rejects a wrong password with 401', async () => {
      const res = await api('POST', '/auth/login', { body: { email: 'admin@example.com', password: 'Wrong@1234' } });
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, 'Invalid email or password');
    });

    it('rejects an unknown email with the same 401 message', async () => {
      const res = await api('POST', '/auth/login', { body: { email: 'nobody@example.com', password: 'Admin@1234' } });
      assert.equal(res.status, 401);
      assert.equal(res.body.message, 'Invalid email or password');
    });

    it('rejects an invalid email format with 400', async () => {
      const res = await api('POST', '/auth/login', { body: { email: 'not-an-email', password: 'Admin@1234' } });
      assert.equal(res.status, 400);
      assert.ok(res.body.errors.email);
    });

    it('rejects a missing password with 400', async () => {
      const res = await api('POST', '/auth/login', { body: { email: 'admin@example.com' } });
      assert.equal(res.status, 400);
      assert.ok(res.body.errors.password);
    });

    it('returns 400 for malformed JSON', async () => {
      const res = await api('POST', '/auth/login', { raw: '{"email": ' });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });
  });

  describe('POST /api/auth/register', () => {
    it('registers a normal user with role USER', async () => {
      const res = await api('POST', '/auth/register', {
        body: {
          name: VALID_NAME,
          email: 'new.user@example.com',
          address: 'Pune, Maharashtra',
          password: 'Secret@123',
          confirmPassword: 'Secret@123',
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.data.user.role, 'USER');
      assert.equal(res.body.data.user.email, 'new.user@example.com');
      assert.ok(res.body.data.token);
      assert.equal(res.body.data.user.password, undefined);

      const token = await login('new.user@example.com', 'Secret@123');
      assert.ok(token);
    });

    it('never allows public registration as ADMIN or OWNER', async () => {
      for (const role of ['ADMIN', 'OWNER']) {
        const email = `sneaky.${role.toLowerCase()}@example.com`;
        const res = await api('POST', '/auth/register', {
          body: { name: VALID_NAME, email, address: 'Somewhere', password: 'Secret@123', role },
        });
        assert.equal(res.status, 201);
        assert.equal(res.body.data.user.role, 'USER');

        const token = res.body.data.token;
        const adminRes = await api('GET', '/admin/dashboard', { token });
        assert.equal(adminRes.status, 403);
      }
    });

    it('rejects a duplicate email with 409', async () => {
      const res = await api('POST', '/auth/register', {
        body: { name: VALID_NAME, email: 'admin@example.com', address: 'Pune', password: 'Secret@123' },
      });
      assert.equal(res.status, 409);
      assert.equal(res.body.success, false);
    });

    it('rejects an invalid password', async () => {
      const res = await api('POST', '/auth/register', {
        body: { name: VALID_NAME, email: 'weak@example.com', address: 'Pune', password: 'weakpass' },
      });
      assert.equal(res.status, 400);
      assert.ok(res.body.errors.password);
    });

    it('rejects an invalid email', async () => {
      const res = await api('POST', '/auth/register', {
        body: { name: VALID_NAME, email: 'bad@email', address: 'Pune', password: 'Secret@123' },
      });
      assert.equal(res.status, 400);
      assert.ok(res.body.errors.email);
    });

    it('rejects mismatched confirm password', async () => {
      const res = await api('POST', '/auth/register', {
        body: {
          name: VALID_NAME,
          email: 'mismatch@example.com',
          address: 'Pune',
          password: 'Secret@123',
          confirmPassword: 'Secret@124',
        },
      });
      assert.equal(res.status, 400);
      assert.ok(res.body.errors.confirmPassword);
    });
  });

  describe('Tokens', () => {
    it('GET /api/auth/me requires a token', async () => {
      const res = await api('GET', '/auth/me');
      assert.equal(res.status, 401);
    });

    it('rejects a tampered token', async () => {
      const token = await loginAs('user');
      const res = await api('GET', '/auth/me', { token: token.slice(0, -2) + 'xx' });
      assert.equal(res.status, 401);
    });

    it('returns the current user for a valid token', async () => {
      const token = await loginAs('owner');
      const res = await api('GET', '/auth/me', { token });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.user.email, 'owner@example.com');
      assert.equal(res.body.data.user.role, 'OWNER');
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('rejects a wrong current password', async () => {
      const token = await loginAs('amit');
      const res = await api('POST', '/auth/change-password', {
        token,
        body: { currentPassword: 'Wrong@1234', newPassword: 'Newpass@123', confirmNewPassword: 'Newpass@123' },
      });
      assert.equal(res.status, 400);
      assert.ok(res.body.errors.currentPassword);
    });

    it('validates the new password with the mandatory password rules', async () => {
      const token = await loginAs('amit');
      for (const bad of ['short@A', 'nouppercase@1', 'NoSpecial123', 'TooLongPassword@123']) {
        const res = await api('POST', '/auth/change-password', {
          token,
          body: { currentPassword: 'User@1234', newPassword: bad, confirmNewPassword: bad },
        });
        assert.equal(res.status, 400, `expected "${bad}" to be rejected`);
        assert.ok(res.body.errors.newPassword);
      }
    });

    it('rejects a mismatched confirmation', async () => {
      const token = await loginAs('amit');
      const res = await api('POST', '/auth/change-password', {
        token,
        body: { currentPassword: 'User@1234', newPassword: 'Newpass@123', confirmNewPassword: 'Newpass@124' },
      });
      assert.equal(res.status, 400);
      assert.ok(res.body.errors.confirmNewPassword);
    });

    it('changes the password (bcrypt), invalidates old tokens and returns a new one', async () => {
      const oldToken = await loginAs('amit');
      const res = await api('POST', '/auth/change-password', {
        token: oldToken,
        body: { currentPassword: 'User@1234', newPassword: 'Newpass@123', confirmNewPassword: 'Newpass@123' },
      });
      assert.equal(res.status, 200);
      assert.ok(res.body.data.token);

      // Old password no longer works, new one does
      const oldLogin = await api('POST', '/auth/login', { body: { email: 'amit@example.com', password: 'User@1234' } });
      assert.equal(oldLogin.status, 401);
      assert.ok(await login('amit@example.com', 'Newpass@123'));

      // Token issued before the change is rejected; the returned one works
      assert.equal((await api('GET', '/auth/me', { token: oldToken })).status, 401);
      assert.equal((await api('GET', '/auth/me', { token: res.body.data.token })).status, 200);
    });
  });
});
