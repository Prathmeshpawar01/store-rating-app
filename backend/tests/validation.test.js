const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { setup, teardown, api, loginAs } = require('./helpers');
const rules = require('../src/validators/rules');

describe('Validation rules (unit)', () => {
  it('name must be 20-60 characters after trimming', () => {
    assert.ok(rules.name('a'.repeat(19)));
    assert.equal(rules.name('a'.repeat(20)), null);
    assert.equal(rules.name('a'.repeat(60)), null);
    assert.ok(rules.name('a'.repeat(61)));
    assert.ok(rules.name(`   ${'a'.repeat(19)}   `), 'whitespace must not count');
    assert.ok(rules.name(''));
    assert.ok(rules.name(undefined));
  });

  it('address is required and at most 400 characters', () => {
    assert.equal(rules.address('x'.repeat(400)), null);
    assert.ok(rules.address('x'.repeat(401)));
    assert.ok(rules.address(''));
    assert.ok(rules.address('   '));
  });

  it('email must match the standard pattern', () => {
    for (const ok of ['a@b.co', 'john.doe@example.com', 'x+y@sub.domain.org']) assert.equal(rules.email(ok), null, ok);
    for (const bad of ['', 'plain', 'a@b', '@b.com', 'a b@c.com', 'a@b .com', 'a@@b.com']) assert.ok(rules.email(bad), bad);
  });

  it('password must be 8-16 chars with an uppercase letter and a special character', () => {
    for (const ok of ['Admin@1234', 'Abcdefg!', 'Sixteen@Chars123']) assert.equal(rules.password(ok), null, ok);
    for (const bad of ['Ab@1', 'admin@1234', 'Admin12345', 'Seventeen@Chars12', '']) assert.ok(rules.password(bad), bad);
  });

  it('rating accepts only the integers 1-5', () => {
    for (const ok of [1, 2, 3, 4, 5, '1', '5']) assert.equal(rules.rating(ok), null, String(ok));
    for (const bad of [0, 6, -1, 5.5, 'abc', '', null, undefined, true, '5.5', '05', [], {}]) {
      assert.ok(rules.rating(bad), JSON.stringify(bad));
    }
  });
});

describe('Validation (API)', () => {
  let admin;
  let user;

  before(async () => {
    await setup();
    admin = await loginAs('admin');
    user = await loginAs('user');
  });
  after(teardown);

  const base = {
    name: 'Validation Test User Account',
    email: 'valid@example.com',
    address: 'Pune, Maharashtra',
    password: 'Valid@123',
  };

  it('rejects invalid names (too short / too long)', async () => {
    for (const name of ['Short Name', 'x'.repeat(61), '                         ']) {
      const res = await api('POST', '/auth/register', { body: { ...base, name } });
      assert.equal(res.status, 400);
      assert.ok(res.body.errors.name);
    }
  });

  it('accepts names at the 20 and 60 character boundaries and stores them trimmed', async () => {
    const twenty = 'A'.repeat(20);
    const r1 = await api('POST', '/auth/register', { body: { ...base, email: 'b20@example.com', name: `  ${twenty}  ` } });
    assert.equal(r1.status, 201);
    assert.equal(r1.body.data.user.name, twenty);

    const r2 = await api('POST', '/auth/register', { body: { ...base, email: 'b60@example.com', name: 'B'.repeat(60) } });
    assert.equal(r2.status, 201);
  });

  it('rejects invalid addresses (missing / over 400 chars)', async () => {
    for (const address of ['', 'x'.repeat(401)]) {
      const res = await api('POST', '/auth/register', { body: { ...base, email: 'addr@example.com', address } });
      assert.equal(res.status, 400);
      assert.ok(res.body.errors.address);
    }
  });

  it('rejects invalid emails', async () => {
    for (const email of ['invalid', 'a@b', 'a@b c.com']) {
      const res = await api('POST', '/admin/users', { token: admin, body: { ...base, email, role: 'USER' } });
      assert.equal(res.status, 400);
      assert.ok(res.body.errors.email);
    }
  });

  it('rejects invalid passwords', async () => {
    for (const password of ['abc', 'alllowercase@1', 'NOSPECIAL123', 'Waytoolongpassword@1']) {
      const res = await api('POST', '/admin/users', {
        token: admin,
        body: { ...base, email: 'pw@example.com', password, role: 'USER' },
      });
      assert.equal(res.status, 400, password);
      assert.ok(res.body.errors.password);
    }
  });

  it('rejects invalid ratings (0, 6, -1, 5.5, "abc", missing)', async () => {
    for (const rating of [0, 6, -1, 5.5, 'abc', '5.5', null]) {
      const res = await api('POST', '/stores/5/rating', { token: user, body: { rating } });
      assert.equal(res.status, 400, `rating ${JSON.stringify(rating)}`);
      assert.ok(res.body.errors.rating);
    }
    const missing = await api('POST', '/stores/5/rating', { token: user, body: {} });
    assert.equal(missing.status, 400);
  });

  it('rejects invalid roles when an admin creates a user', async () => {
    const res = await api('POST', '/admin/users', {
      token: admin,
      body: { ...base, email: 'role@example.com', role: 'SUPERUSER' },
    });
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.role);
  });

  it('validates store fields', async () => {
    const res = await api('POST', '/admin/stores', {
      token: admin,
      body: { name: '', email: 'nope', address: 'x'.repeat(401), ownerId: 'abc' },
    });
    assert.equal(res.status, 400);
    for (const field of ['name', 'email', 'address', 'ownerId']) assert.ok(res.body.errors[field], field);
  });

  it('rejects unknown sort fields and order values (no SQL injection via ORDER BY)', async () => {
    const inj = encodeURIComponent('name; DROP TABLE users');
    const r1 = await api('GET', `/admin/users?sortBy=${inj}`, { token: admin });
    assert.equal(r1.status, 400);
    const r2 = await api('GET', '/admin/stores?order=sideways', { token: admin });
    assert.equal(r2.status, 400);
    const r3 = await api('GET', '/stores?sortBy=password', { token: user });
    assert.equal(r3.status, 400);
    const r4 = await api('GET', '/admin/users?page=0', { token: admin });
    assert.equal(r4.status, 400);
    const r5 = await api('GET', '/admin/users?limit=1000', { token: admin });
    assert.equal(r5.status, 400);

    // users table is intact
    const ok = await api('GET', '/admin/users', { token: admin });
    assert.equal(ok.status, 200);
  });

  it('treats search input as data, not SQL', async () => {
    const res = await api('GET', `/admin/users?search=${encodeURIComponent("' OR '1'='1")}`, { token: admin });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.items.length, 0);

    const pct = await api('GET', `/admin/users?search=${encodeURIComponent('%')}`, { token: admin });
    assert.equal(pct.status, 200);
    assert.equal(pct.body.data.items.length, 0, '% must be matched literally');
  });

  it('rejects non-numeric id parameters', async () => {
    assert.equal((await api('GET', '/admin/users/abc', { token: admin })).status, 400);
    assert.equal((await api('GET', '/admin/stores/1.5', { token: admin })).status, 400);
    assert.equal((await api('GET', '/stores/-1', { token: user })).status, 400);
  });
});
