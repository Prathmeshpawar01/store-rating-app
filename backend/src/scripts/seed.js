/**
 * Inserts demo accounts, stores and ratings.
 * Run after `npm run db:init` (or just use `npm run db:setup`).
 *
 * Existing rows are cleared first so the script can be re-run safely.
 */
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const data = require('./seedData');

async function seed(pool) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM ratings');
    await conn.query('DELETE FROM stores');
    await conn.query('DELETE FROM users');

    // Hash each distinct password once.
    const hashCache = {};
    const hashFor = async (pw) => {
      if (!hashCache[pw]) hashCache[pw] = await bcrypt.hash(pw, config.bcryptRounds);
      return hashCache[pw];
    };

    const userIds = {};
    for (const u of data.users) {
      const [res] = await conn.execute(
        'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
        [u.name, u.email, await hashFor(u.password), u.address, u.role]
      );
      userIds[u.key] = res.insertId;
    }

    const storeIds = {};
    for (const s of data.stores) {
      const [res] = await conn.execute(
        'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
        [s.name, s.email, s.address, userIds[s.owner]]
      );
      storeIds[s.key] = res.insertId;
    }

    for (const [userKey, storeKey, value] of data.ratings) {
      await conn.execute('INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)', [
        userIds[userKey],
        storeIds[storeKey],
        value,
      ]);
    }

    await conn.commit();
    return { userIds, storeIds };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

if (require.main === module) {
  const pool = require('../config/database');
  seed(pool)
    .then(() => {
      console.log(`[db:seed] Demo data inserted into "${config.db.database}"`);
      console.log('[db:seed] Admin: admin@example.com / Admin@1234');
      console.log('[db:seed] Owner: owner@example.com / Admin@1234');
      console.log('[db:seed] User : user@example.com  / User@1234');
      return pool.end();
    })
    .then(() => process.exit(0))
    .catch(async (err) => {
      console.error(`[db:seed] Failed: ${err.message}`);
      await pool.end().catch(() => {});
      process.exit(1);
    });
}

module.exports = { seed };
