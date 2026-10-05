const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { setup, teardown, api, login, loginAs } = require('./helpers');

describe('Admin module', () => {
  let ids;
  let admin;

  before(async () => {
    ids = await setup();
    admin = await loginAs('admin');
  });
  after(teardown);

  it('returns dashboard statistics', async () => {
    const res = await api('GET', '/admin/dashboard', { token: admin });
    assert.equal(res.status, 200);
    const d = res.body.data;
    assert.equal(d.totalUsers, 9);
    assert.equal(d.totalStores, 5);
    assert.equal(d.totalRatings, 11);
    assert.equal(d.totalStoreOwners, 3);
  });

  describe('Create', () => {
    it('creates a normal user', async () => {
      const res = await api('POST', '/admin/users', {
        token: admin,
        body: {
          name: 'Admin Created Normal User',
          email: 'created.user@example.com',
          address: 'Nashik, Maharashtra',
          password: 'Created@123',
          role: 'USER',
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.data.user.role, 'USER');
      assert.equal(res.body.data.user.password, undefined);
    });

    it('creates another administrator who can use admin APIs', async () => {
      const res = await api('POST', '/admin/users', {
        token: admin,
        body: {
          name: 'Second System Administrator',
          email: 'admin2@example.com',
          address: 'Mumbai, Maharashtra',
          password: 'Admin2@123',
          role: 'ADMIN',
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.data.user.role, 'ADMIN');

      const token = await login('admin2@example.com', 'Admin2@123');
      assert.equal((await api('GET', '/admin/dashboard', { token })).status, 200);
    });

    it('creates a store owner (role is normalised to upper case)', async () => {
      const res = await api('POST', '/admin/users', {
        token: admin,
        body: {
          name: 'Brand New Store Owner Person',
          email: 'new.owner@example.com',
          address: 'Nagpur, Maharashtra',
          password: 'Owner@123',
          role: 'owner',
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.data.user.role, 'OWNER');
    });

    it('rejects a duplicate user email with 409', async () => {
      const res = await api('POST', '/admin/users', {
        token: admin,
        body: {
          name: 'Duplicate Email Person Here',
          email: 'OWNER@example.com',
          address: 'Pune',
          password: 'Owner@123',
          role: 'USER',
        },
      });
      assert.equal(res.status, 409);
    });

    it('lists owners for the store form', async () => {
      const res = await api('GET', '/admin/owners', { token: admin });
      assert.equal(res.status, 200);
      const emails = res.body.data.owners.map((o) => o.email);
      assert.ok(emails.includes('owner@example.com'));
      assert.ok(emails.includes('new.owner@example.com'));
      assert.ok(!emails.includes('user@example.com'));
    });

    it('creates a store assigned to an owner', async () => {
      const owners = (await api('GET', '/admin/owners', { token: admin })).body.data.owners;
      const newOwner = owners.find((o) => o.email === 'new.owner@example.com');
      const res = await api('POST', '/admin/stores', {
        token: admin,
        body: {
          name: 'Orange City Supermarket',
          email: 'Hello@OrangeCity.example.com',
          address: 'Sitabuldi, Nagpur, Maharashtra 440012',
          ownerId: newOwner.id,
        },
      });
      assert.equal(res.status, 201);
      const { store } = res.body.data;
      assert.equal(store.email, 'hello@orangecity.example.com');
      assert.equal(store.owner.email, 'new.owner@example.com');
      assert.equal(store.averageRating, null);
      assert.equal(store.totalRatings, 0);

      // The new owner now sees the store on their dashboard
      const ownerToken = await login('new.owner@example.com', 'Owner@123');
      const dash = await api('GET', '/owner/dashboard', { token: ownerToken });
      assert.equal(dash.body.data.stores.length, 1);
      assert.equal(dash.body.data.stores[0].name, 'Orange City Supermarket');
    });

    it('refuses to assign a store to a user who is not an OWNER', async () => {
      const res = await api('POST', '/admin/stores', {
        token: admin,
        body: { name: 'Invalid Owner Store', email: 'inv@example.com', address: 'Pune', ownerId: ids.userIds.rahul },
      });
      assert.equal(res.status, 400);
      assert.ok(res.body.errors.ownerId);
    });

    it('refuses a non-existent owner and a duplicate store email', async () => {
      const r1 = await api('POST', '/admin/stores', {
        token: admin,
        body: { name: 'Ghost Owner Store', email: 'ghost@example.com', address: 'Pune', ownerId: 999999 },
      });
      assert.equal(r1.status, 400);

      const r2 = await api('POST', '/admin/stores', {
        token: admin,
        body: { name: 'Copycat Store', email: 'contact@sunrisemart.example.com', address: 'Pune', ownerId: ids.userIds.owner },
      });
      assert.equal(r2.status, 409);
    });
  });

  describe('Users list', () => {
    it('searches users by name', async () => {
      const res = await api('GET', '/admin/users?search=Kulkarni', { token: admin });
      assert.equal(res.status, 200);
      assert.deepEqual(res.body.data.items.map((u) => u.email), ['sneha@example.com']);
    });

    it('searches users by email and by address (dedicated filters)', async () => {
      const byEmail = await api('GET', '/admin/users?email=vikram@', { token: admin });
      assert.deepEqual(byEmail.body.data.items.map((u) => u.email), ['vikram@example.com']);

      const byAddress = await api('GET', '/admin/users?address=Jaipur', { token: admin });
      assert.deepEqual(byAddress.body.data.items.map((u) => u.email), ['vikram@example.com']);

      const generic = await api('GET', '/admin/users?search=Bengaluru', { token: admin });
      const emails = generic.body.data.items.map((u) => u.email).sort();
      assert.deepEqual(emails, ['neha@example.com', 'owner3@example.com']);
    });

    it('filters users by role', async () => {
      const res = await api('GET', '/admin/users?role=OWNER&limit=100', { token: admin });
      assert.equal(res.status, 200);
      assert.ok(res.body.data.items.length >= 3);
      assert.ok(res.body.data.items.every((u) => u.role === 'OWNER'));
      // owners expose their average store rating
      const owner = res.body.data.items.find((u) => u.email === 'owner@example.com');
      assert.equal(owner.ownerRating, 4.17);

      const admins = await api('GET', '/admin/users?role=ADMIN', { token: admin });
      assert.ok(admins.body.data.items.every((u) => u.role === 'ADMIN'));

      const combined = await api('GET', '/admin/users?role=USER&search=Pune', { token: admin });
      assert.ok(combined.body.data.items.length > 0);
      assert.ok(combined.body.data.items.every((u) => u.role === 'USER' && u.address.includes('Pune')));
    });

    it('sorts users ascending and descending', async () => {
      const asc = await api('GET', '/admin/users?sortBy=name&order=asc&limit=100', { token: admin });
      const desc = await api('GET', '/admin/users?sortBy=name&order=desc&limit=100', { token: admin });
      const ascNames = asc.body.data.items.map((u) => u.name);
      const descNames = desc.body.data.items.map((u) => u.name);
      assert.deepEqual(ascNames, [...ascNames].sort((a, b) => a.localeCompare(b)));
      assert.deepEqual(descNames, [...ascNames].reverse());

      // Email ordering follows the database collation; descending must be the exact reverse.
      const emailAsc = await api('GET', '/admin/users?sortBy=email&order=asc&limit=100', { token: admin });
      const emailDesc = await api('GET', '/admin/users?sortBy=email&order=desc&limit=100', { token: admin });
      const emails = emailAsc.body.data.items.map((u) => u.email);
      assert.equal(emails[0], 'admin@example.com');
      assert.deepEqual(emailDesc.body.data.items.map((u) => u.email), [...emails].reverse());
    });

    it('paginates results', async () => {
      const p1 = await api('GET', '/admin/users?limit=3&page=1&sortBy=email', { token: admin });
      const p2 = await api('GET', '/admin/users?limit=3&page=2&sortBy=email', { token: admin });
      assert.equal(p1.body.data.items.length, 3);
      assert.equal(p1.body.data.pagination.page, 1);
      assert.ok(p1.body.data.pagination.total >= 12);
      assert.equal(p1.body.data.pagination.totalPages, Math.ceil(p1.body.data.pagination.total / 3));
      const overlap = p1.body.data.items.filter((a) => p2.body.data.items.some((b) => b.id === a.id));
      assert.equal(overlap.length, 0);
    });

    it('returns complete user details (owners include their stores and rating)', async () => {
      const res = await api('GET', `/admin/users/${ids.userIds.owner}`, { token: admin });
      assert.equal(res.status, 200);
      const { user } = res.body.data;
      assert.equal(user.email, 'owner@example.com');
      assert.equal(user.address, '12 FC Road, Shivajinagar, Pune, Maharashtra 411005');
      assert.equal(user.stores.length, 2);
      assert.equal(user.ownerRating, 4.17);
      assert.equal(user.password, undefined);

      const normal = await api('GET', `/admin/users/${ids.userIds.rahul}`, { token: admin });
      assert.equal(normal.body.data.user.ratings.length, 3);

      assert.equal((await api('GET', '/admin/users/999999', { token: admin })).status, 404);
    });
  });

  describe('Stores list', () => {
    it('searches stores by name, email and address', async () => {
      const byName = await api('GET', '/admin/stores?name=Golden', { token: admin });
      assert.deepEqual(byName.body.data.items.map((s) => s.name), ['Golden Crust Bakery']);

      const byEmail = await api('GET', '/admin/stores?email=greenleaf', { token: admin });
      assert.deepEqual(byEmail.body.data.items.map((s) => s.name), ['Green Leaf Organics']);

      const byAddress = await api('GET', '/admin/stores?address=Delhi', { token: admin });
      assert.deepEqual(byAddress.body.data.items.map((s) => s.name), ['City Book Corner']);

      const generic = await api('GET', '/admin/stores?search=Pune', { token: admin });
      assert.equal(generic.body.data.items.length, 2);
    });

    it('lists stores with owner and average rating, sortable both ways', async () => {
      const desc = await api('GET', '/admin/stores?sortBy=rating&order=desc&limit=100', { token: admin });
      assert.equal(desc.status, 200);
      const ratings = desc.body.data.items.map((s) => s.averageRating ?? 0);
      assert.deepEqual(ratings, [...ratings].sort((a, b) => b - a));
      assert.equal(desc.body.data.items[0].name, 'Sunrise Electronics Hub');
      assert.ok(desc.body.data.items[0].owner.name);

      const asc = await api('GET', '/admin/stores?sortBy=name&order=asc&limit=100', { token: admin });
      const names = asc.body.data.items.map((s) => s.name);
      assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)));
    });

    it('returns store details with owner, totals and individual ratings', async () => {
      const res = await api('GET', `/admin/stores/${ids.storeIds.sunrise}`, { token: admin });
      assert.equal(res.status, 200);
      const { store } = res.body.data;
      assert.equal(store.name, 'Sunrise Fresh Mart');
      assert.equal(store.owner.name, 'Rajesh Kumar Store Owner');
      assert.equal(store.owner.email, 'owner@example.com');
      assert.equal(store.totalRatings, 4);
      assert.equal(store.averageRating, 4);
      assert.equal(store.ratings.length, 4);
      for (const r of store.ratings) {
        assert.ok(r.user.name && r.user.email && r.rating && r.createdAt);
      }
      assert.equal((await api('GET', '/admin/stores/999999', { token: admin })).status, 404);
    });
  });
});
