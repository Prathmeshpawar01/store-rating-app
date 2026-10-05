const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { setup, teardown, api, loginAs } = require('./helpers');

describe('Normal user store listing', () => {
  let ids;
  let user;

  before(async () => {
    ids = await setup();
    user = await loginAs('user');
  });
  after(teardown);

  it('lists all stores with overall rating and the user\'s own rating', async () => {
    const res = await api('GET', '/stores?limit=100', { token: user });
    assert.equal(res.status, 200);
    const items = res.body.data.items;
    assert.equal(items.length, 5);
    const fresh = items.find((s) => s.name === 'Sunrise Fresh Mart');
    assert.equal(fresh.averageRating, 4);
    assert.equal(fresh.myRating, 5);
    const books = items.find((s) => s.name === 'City Book Corner');
    assert.equal(books.myRating, null);
    assert.equal(books.averageRating, null);
  });

  it('searches stores by name', async () => {
    const res = await api('GET', '/stores?search=bakery', { token: user });
    assert.deepEqual(res.body.data.items.map((s) => s.name), ['Golden Crust Bakery']);
  });

  it('searches stores by address', async () => {
    const res = await api('GET', '/stores?search=Mumbai', { token: user });
    assert.deepEqual(res.body.data.items.map((s) => s.name), ['Green Leaf Organics']);

    const byField = await api('GET', '/stores?address=pune&sortBy=name', { token: user });
    assert.deepEqual(byField.body.data.items.map((s) => s.name), ['Sunrise Electronics Hub', 'Sunrise Fresh Mart']);
  });

  it('sorts by name ascending and descending', async () => {
    const asc = await api('GET', '/stores?sortBy=name&order=asc', { token: user });
    const desc = await api('GET', '/stores?sortBy=name&order=desc', { token: user });
    const a = asc.body.data.items.map((s) => s.name);
    assert.deepEqual(a, [...a].sort((x, y) => x.localeCompare(y)));
    assert.deepEqual(desc.body.data.items.map((s) => s.name), [...a].reverse());
  });

  it('sorts by average rating and by address', async () => {
    const res = await api('GET', '/stores?sortBy=rating&order=desc', { token: user });
    const r = res.body.data.items.map((s) => s.averageRating ?? 0);
    assert.deepEqual(r, [...r].sort((x, y) => y - x));

    const addr = await api('GET', '/stores?sortBy=address&order=asc', { token: user });
    const a = addr.body.data.items.map((s) => s.address);
    assert.deepEqual(a, [...a].sort((x, y) => x.localeCompare(y)));
  });

  it('returns a single store and 404 for unknown stores', async () => {
    const res = await api('GET', `/stores/${ids.storeIds.golden}`, { token: user });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.store.name, 'Golden Crust Bakery');
    assert.equal(res.body.data.store.myRating, 3);
    assert.equal((await api('GET', '/stores/999999', { token: user })).status, 404);
  });

  it('returns the user profile with rating stats', async () => {
    const res = await api('GET', '/users/me', { token: user });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.email, 'user@example.com');
    assert.equal(res.body.data.stats.totalRatings, 3);
  });
});
