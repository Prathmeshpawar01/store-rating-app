const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { setup, teardown, api, loginAs, getPool } = require('./helpers');

describe('Ratings', () => {
  let ids;
  let user;
  let neha;
  let admin;
  let bookStoreId;

  before(async () => {
    ids = await setup();
    bookStoreId = ids.storeIds.books; // seeded with no ratings
    user = await loginAs('user');
    neha = await loginAs('neha');
    admin = await loginAs('admin');
  });
  after(teardown);

  it('submits a rating (201) and returns the updated store with myRating', async () => {
    const res = await api('POST', `/stores/${bookStoreId}/rating`, { token: user, body: { rating: 4 } });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.store.myRating, 4);
    assert.equal(res.body.data.store.averageRating, 4);
    assert.equal(res.body.data.store.totalRatings, 1);
  });

  it('accepts a numeric string rating', async () => {
    const res = await api('POST', `/stores/${bookStoreId}/rating`, { token: neha, body: { rating: '2' } });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.store.myRating, 2);
    assert.equal(res.body.data.store.averageRating, 3);
  });

  it('prevents duplicate ratings: a second POST returns 409 and no new row is created', async () => {
    const res = await api('POST', `/stores/${bookStoreId}/rating`, { token: user, body: { rating: 1 } });
    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);

    const [rows] = await getPool().query('SELECT COUNT(*) AS c FROM ratings WHERE user_id = ? AND store_id = ?', [
      ids.userIds.rahul,
      bookStoreId,
    ]);
    assert.equal(Number(rows[0].c), 1);
  });

  it('the database UNIQUE(user_id, store_id) constraint rejects duplicates directly', async () => {
    await assert.rejects(
      getPool().execute('INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, 3)', [ids.userIds.rahul, bookStoreId]),
      (err) => err.code === 'ER_DUP_ENTRY'
    );
  });

  it('modifies an existing rating with PUT', async () => {
    const res = await api('PUT', `/stores/${bookStoreId}/rating`, { token: user, body: { rating: 5 } });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.store.myRating, 5);
    assert.equal(res.body.data.store.totalRatings, 2);
    assert.equal(res.body.data.store.averageRating, 3.5);

    const list = await api('GET', `/stores?search=${encodeURIComponent('City Book')}`, { token: user });
    assert.equal(list.body.data.items[0].myRating, 5);
  });

  it('PUT on a store the user has not rated returns 404', async () => {
    const amit = await loginAs('amit');
    const res = await api('PUT', `/stores/${bookStoreId}/rating`, { token: amit, body: { rating: 3 } });
    assert.equal(res.status, 404);
  });

  it('rating a non-existent store returns 404', async () => {
    assert.equal((await api('POST', '/stores/999999/rating', { token: user, body: { rating: 3 } })).status, 404);
    assert.equal((await api('PUT', '/stores/999999/rating', { token: user, body: { rating: 3 } })).status, 404);
  });

  it('rejects out-of-range ratings on update as well', async () => {
    for (const rating of [0, 6, 4.5]) {
      const res = await api('PUT', `/stores/${bookStoreId}/rating`, { token: user, body: { rating } });
      assert.equal(res.status, 400);
    }
  });

  it('admin store details reflect individual ratings and the users who submitted them', async () => {
    const res = await api('GET', `/admin/stores/${bookStoreId}`, { token: admin });
    assert.equal(res.status, 200);
    const { store } = res.body.data;
    assert.equal(store.totalRatings, 2);
    assert.equal(store.averageRating, 3.5);
    const emails = store.ratings.map((r) => r.user.email).sort();
    assert.deepEqual(emails, ['neha@example.com', 'user@example.com']);
    assert.equal(store.ratings.find((r) => r.user.email === 'user@example.com').rating, 5);
  });

  it('GET /api/users/me/ratings lists the user\'s own ratings', async () => {
    const res = await api('GET', '/users/me/ratings', { token: user });
    assert.equal(res.status, 200);
    assert.ok(res.body.data.ratings.some((r) => r.store.id === bookStoreId && r.rating === 5));
  });
});
