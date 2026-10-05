const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { setup, teardown, api, loginAs } = require('./helpers');

const ADMIN_ENDPOINTS = [
  ['GET', '/admin/dashboard'],
  ['GET', '/admin/users'],
  ['GET', '/admin/users/1'],
  ['GET', '/admin/owners'],
  ['GET', '/admin/stores'],
  ['GET', '/admin/stores/1'],
  ['POST', '/admin/users'],
  ['POST', '/admin/stores'],
];

describe('Role-based authorization', () => {
  let tokens;

  before(async () => {
    await setup();
    tokens = {
      admin: await loginAs('admin'),
      owner: await loginAs('owner'),
      user: await loginAs('user'),
    };
  });
  after(teardown);

  it('admin can access admin APIs', async () => {
    for (const [method, path] of ADMIN_ENDPOINTS.filter(([m]) => m === 'GET')) {
      const res = await api(method, path, { token: tokens.admin });
      assert.equal(res.status, 200, `${method} ${path}`);
    }
  });

  it('normal user cannot access admin APIs (403)', async () => {
    for (const [method, path] of ADMIN_ENDPOINTS) {
      const res = await api(method, path, { token: tokens.user, body: method === 'POST' ? {} : undefined });
      assert.equal(res.status, 403, `${method} ${path}`);
      assert.equal(res.body.success, false);
    }
  });

  it('owner cannot access admin APIs (403)', async () => {
    for (const [method, path] of ADMIN_ENDPOINTS) {
      const res = await api(method, path, { token: tokens.owner, body: method === 'POST' ? {} : undefined });
      assert.equal(res.status, 403, `${method} ${path}`);
    }
  });

  it('unauthenticated requests are rejected (401)', async () => {
    for (const path of ['/admin/dashboard', '/owner/dashboard', '/stores', '/users/me']) {
      const res = await api('GET', path);
      assert.equal(res.status, 401, path);
    }
  });

  it('normal user cannot access owner APIs (403)', async () => {
    for (const path of ['/owner/dashboard', '/owner/ratings']) {
      const res = await api('GET', path, { token: tokens.user });
      assert.equal(res.status, 403, path);
    }
  });

  it('admin cannot access owner APIs (403)', async () => {
    const res = await api('GET', '/owner/dashboard', { token: tokens.admin });
    assert.equal(res.status, 403);
  });

  it('owner and admin cannot use the normal-user store/rating APIs (403)', async () => {
    for (const token of [tokens.owner, tokens.admin]) {
      assert.equal((await api('GET', '/stores', { token })).status, 403);
      assert.equal((await api('POST', '/stores/1/rating', { token, body: { rating: 5 } })).status, 403);
    }
  });

  it('owner can access owner APIs and user can access user APIs', async () => {
    assert.equal((await api('GET', '/owner/dashboard', { token: tokens.owner })).status, 200);
    assert.equal((await api('GET', '/owner/ratings', { token: tokens.owner })).status, 200);
    assert.equal((await api('GET', '/stores', { token: tokens.user })).status, 200);
    assert.equal((await api('GET', '/users/me', { token: tokens.user })).status, 200);
  });

  it('role claims inside a forged token are not trusted', async () => {
    // A token signed with a different secret claiming ADMIN must be rejected.
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: 1, role: 'ADMIN' })).toString('base64url');
    const forged = `${header}.${payload}.invalidsignature`;
    assert.equal((await api('GET', '/admin/dashboard', { token: forged })).status, 401);

    // "alg: none" tokens are rejected as well.
    const noneHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    assert.equal((await api('GET', '/admin/dashboard', { token: `${noneHeader}.${payload}.` })).status, 401);
  });

  it('unknown routes return 404 JSON', async () => {
    const res = await api('GET', '/does-not-exist', { token: tokens.admin });
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });
});
