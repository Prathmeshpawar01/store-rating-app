const pool = require('../config/database');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const { parseListQuery, str, likeValue, buildPagination } = require('../utils/queryHelpers');
const { STORE_RATING_AGG, toStoreSummary } = require('../utils/sql');

const STORE_SORT = {
  name: 's.name',
  address: 's.address',
  rating: 'COALESCE(rs.avg_rating, 0)',
  totalRatings: 'COALESCE(rs.total_ratings, 0)',
  myRating: 'COALESCE(mr.rating, 0)',
  createdAt: 's.created_at',
};

const STORE_SELECT = `
  SELECT s.id, s.name, s.email, s.address, s.created_at, s.updated_at,
         rs.avg_rating, rs.total_ratings,
         mr.id AS my_rating_id, mr.rating AS my_rating, mr.updated_at AS my_rating_updated_at
    FROM stores s
    ${STORE_RATING_AGG}
    LEFT JOIN ratings mr ON mr.store_id = s.id AND mr.user_id = ?`;

const toUserStore = (row) => ({
  ...toStoreSummary(row),
  myRating: row.my_rating === null || row.my_rating === undefined ? null : Number(row.my_rating),
  myRatingUpdatedAt: row.my_rating_updated_at || null,
});

async function findStoreForUser(storeId, userId) {
  const [rows] = await pool.query(`${STORE_SELECT} WHERE s.id = ?`, [userId, storeId]);
  return rows.length ? toUserStore(rows[0]) : null;
}

/**
 * GET /api/stores
 * Query: search (name OR address), name, address, sortBy (name|address|rating|totalRatings|myRating|createdAt),
 *        order (asc|desc), page, limit
 */
const listStores = async (req, res) => {
  const { page, limit, offset, sortColumn, order } = parseListQuery(req.query, {
    sortMap: STORE_SORT,
    defaultSort: 'name',
    defaultOrder: 'asc',
  });

  const where = [];
  const params = [];
  const search = str(req.query.search);
  if (search) {
    where.push('(s.name LIKE ? OR s.address LIKE ?)');
    params.push(likeValue(search), likeValue(search));
  }
  for (const field of ['name', 'address']) {
    const v = str(req.query[field]);
    if (v) {
      where.push(`s.${field} LIKE ?`);
      params.push(likeValue(v));
    }
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM stores s ${whereSql}`, params);
  const [rows] = await pool.query(
    `${STORE_SELECT} ${whereSql} ORDER BY ${sortColumn} ${order}, s.id ${order} LIMIT ? OFFSET ?`,
    [req.user.id, ...params, limit, offset]
  );

  return sendSuccess(res, {
    message: 'Stores fetched successfully',
    data: { items: rows.map(toUserStore), pagination: buildPagination(page, limit, Number(total)) },
  });
};

/** GET /api/stores/:id */
const getStore = async (req, res) => {
  const store = await findStoreForUser(parseInt(req.params.id, 10), req.user.id);
  if (!store) throw ApiError.notFound('Store not found');
  return sendSuccess(res, { message: 'Store fetched successfully', data: { store } });
};

async function assertStoreExists(storeId) {
  const [rows] = await pool.execute('SELECT id FROM stores WHERE id = ?', [storeId]);
  if (!rows.length) throw ApiError.notFound('Store not found');
}

/**
 * POST /api/stores/:id/rating – submit a first rating (1-5).
 * The UNIQUE(user_id, store_id) constraint guarantees no duplicate rows; a second
 * POST returns 409 and the client should use PUT to modify the rating.
 */
const submitRating = async (req, res) => {
  const storeId = parseInt(req.params.id, 10);
  await assertStoreExists(storeId);

  try {
    await pool.execute('INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)', [
      req.user.id,
      storeId,
      req.body.rating,
    ]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw ApiError.conflict('You have already rated this store. Edit your existing rating instead.');
    }
    throw err;
  }

  const store = await findStoreForUser(storeId, req.user.id);
  return sendSuccess(res, { statusCode: 201, message: 'Rating submitted successfully', data: { store } });
};

/** PUT /api/stores/:id/rating – modify the user's existing rating. */
const updateRating = async (req, res) => {
  const storeId = parseInt(req.params.id, 10);
  await assertStoreExists(storeId);

  const [result] = await pool.execute('UPDATE ratings SET rating = ? WHERE user_id = ? AND store_id = ?', [
    req.body.rating,
    req.user.id,
    storeId,
  ]);
  if (result.affectedRows === 0) {
    throw ApiError.notFound('You have not rated this store yet. Submit a rating first.');
  }

  const store = await findStoreForUser(storeId, req.user.id);
  return sendSuccess(res, { message: 'Rating updated successfully', data: { store } });
};

module.exports = { listStores, getStore, submitRating, updateRating };
