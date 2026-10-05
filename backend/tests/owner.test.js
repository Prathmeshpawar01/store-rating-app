const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { setup, teardown, api, loginAs } = require('./helpers');

describe('Store owner module', () => {
  let ids;
  let owner;
  let owner3;

  before(async () => {
    ids = await setup();
    owner = await loginAs('owner');
    owner3 = await loginAs('owner3');
  });
  after(teardown);

  it('shows the owner their own stores with average rating and total ratings', async () => {
    const res = await api('GET', '/owner/dashboard', { token: owner });
    assert.equal(res.status, 200);
    const { stores, summary } = res.body.data;
    assert.deepEqual(stores.map((s) => s.name), ['Sunrise Electronics Hub', 'Sunrise Fresh Mart']);
    const fresh = stores.find((s) => s.name === 'Sunrise Fresh Mart');
    assert.equal(fresh.averageRating, 4);
    assert.equal(fresh.totalRatings, 4);
    assert.ok(fresh.address.includes('Pune'));
    assert.equal(summary.totalRatings, 6);
    assert.equal(summary.averageRating, 4.17);
    assert.equal(summary.totalStores, 2);
  });

  it('lists the users who rated the owner\'s stores', async () => {
    const res = await api('GET', '/owner/ratings?limit=100', { token: owner });
    assert.equal(res.status, 200);
    const items = res.body.data.items;
    assert.equal(items.length, 6);
    for (const r of items) {
      assert.ok(r.user.name && r.user.email && r.rating && r.createdAt);
      assert.ok(['Sunrise Fresh Mart', 'Sunrise Electronics Hub'].includes(r.store.name));
    }
    const rahul = items.find((r) => r.user.email === 'user@example.com' && r.store.name === 'Sunrise Fresh Mart');
    assert.equal(rahul.rating, 5);
  });

  it('filters ratings by one of the owner\'s own stores and sorts them', async () => {
    const res = await api('GET', `/owner/ratings?storeId=${ids.storeIds.sunrise}&sortBy=rating&order=desc`, {
      token: owner,
    });
    assert.equal(res.status, 200);
    const values = res.body.data.items.map((r) => r.rating);
    assert.deepEqual(values, [5, 4, 4, 3]);

    const search = await api('GET', '/owner/ratings?search=amit', { token: owner });
    assert.deepEqual(search.body.data.items.map((r) => r.user.email), ['amit@example.com']);
  });

  it('cannot access another owner\'s store data', async () => {
    const res = await api('GET', `/owner/ratings?storeId=${ids.storeIds.greenleaf}`, { token: owner });
    assert.equal(res.status, 403);

    // Owner 3's dashboard contains none of owner 1's or owner 2's stores/ratings
    const dash = await api('GET', '/owner/dashboard', { token: owner3 });
    const names = dash.body.data.stores.map((s) => s.name);
    assert.deepEqual(names, ['City Book Corner', 'Golden Crust Bakery']);
    const ratings = await api('GET', '/owner/ratings?limit=100', { token: owner3 });
    assert.equal(ratings.body.data.items.length, 2);
    assert.ok(ratings.body.data.items.every((r) => r.store.name === 'Golden Crust Bakery'));
  });

  it('shows empty stats for a store without ratings', async () => {
    const dash = await api('GET', '/owner/dashboard', { token: owner3 });
    const books = dash.body.data.stores.find((s) => s.name === 'City Book Corner');
    assert.equal(books.averageRating, null);
    assert.equal(books.totalRatings, 0);

    const res = await api('GET', `/owner/ratings?storeId=${ids.storeIds.books}`, { token: owner3 });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.items.length, 0);
  });

  it('cannot create users, create stores or modify ratings', async () => {
    const createUser = await api('POST', '/admin/users', {
      token: owner,
      body: { name: 'Owner Trying To Add User', email: 'x@example.com', address: 'Pune', password: 'Abcdef@1', role: 'USER' },
    });
    assert.equal(createUser.status, 403);

    const createStore = await api('POST', '/admin/stores', {
      token: owner,
      body: { name: 'Owner Store Attempt', email: 'y@example.com', address: 'Pune', ownerId: ids.userIds.owner },
    });
    assert.equal(createStore.status, 403);

    const rate = await api('PUT', `/stores/${ids.storeIds.sunrise}/rating`, { token: owner, body: { rating: 1 } });
    assert.equal(rate.status, 403);

    const del = await api('DELETE', `/stores/${ids.storeIds.sunrise}/rating`, { token: owner });
    assert.ok([403, 404].includes(del.status));
  });
});
