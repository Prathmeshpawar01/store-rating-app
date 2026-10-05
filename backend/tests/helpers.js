/**
 * Test helpers. Every test file:
 *   1. re-creates the test database (DB_NAME_TEST, default "store_rating_test")
 *   2. loads the demo seed data
 *   3. starts the Express app on a random port
 * and talks to it over real HTTP using Node's built-in fetch.
 */
process.env.NODE_ENV = 'test';

const { initDatabase } = require('../src/scripts/initDb');
const config = require('../src/config/env');

let pool;
let server;
let baseUrl;

async function setup() {
  await initDatabase(config.db.database);
  pool = require('../src/config/database');
  const { seed } = require('../src/scripts/seed');
  const ids = await seed(pool);

  const app = require('../src/app');
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  return ids;
}

async function teardown() {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (pool) await pool.end();
}

/** Performs an HTTP request and returns { status, body }. */
async function api(method, path, { token, body, raw } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (raw !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = raw;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(baseUrl + path, { method, headers, body: payload });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, body: json };
}

async function login(email, password) {
  const res = await api('POST', '/auth/login', { body: { email, password } });
  if (res.status !== 200) throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  return res.body.data.token;
}

const CREDENTIALS = {
  admin: ['admin@example.com', 'Admin@1234'],
  owner: ['owner@example.com', 'Admin@1234'],
  owner2: ['owner2@example.com', 'Admin@1234'],
  owner3: ['owner3@example.com', 'Admin@1234'],
  user: ['user@example.com', 'User@1234'],
  amit: ['amit@example.com', 'User@1234'],
  neha: ['neha@example.com', 'User@1234'],
};

async function loginAs(key) {
  return login(...CREDENTIALS[key]);
}

const getPool = () => pool;

module.exports = { setup, teardown, api, login, loginAs, getPool, CREDENTIALS };
