const pool = require('../config/database');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const { parseListQuery, str, likeValue, buildPagination } = require('../utils/queryHelpers');
const { STORE_RATING_AGG, toStoreSummary } = require('../utils/sql');

/**
 * GET /api/owner/dashboard
 * Every store owned by the logged-in owner with its average and total ratings,
 * plus an overall summary. Data is always scoped by owner_id = req.user.id.
 */
const getDashboard = async (req, res) => {
  const ownerId = req.user.id;

  const [stores] = await pool.query(
    `SELECT s.id, s.name, s.email, s.address, s.created_at, s.updated_at, rs.avg_rating, rs.total_ratings
       FROM stores s ${STORE_RATING_AGG}
      WHERE s.owner_id = ?
      ORDER BY s.name`,
    [ownerId]
  );

  const [[agg]] = await pool.query(
    `SELECT ROUND(AVG(r.rating), 2) AS avg_rating, COUNT(r.id) AS total,
            COUNT(DISTINCT r.user_id) AS raters
       FROM stores s JOIN ratings r ON r.store_id = s.id
      WHERE s.owner_id = ?`,
    [ownerId]
  );

  const [dist] = await pool.query(
    `SELECT r.rating, COUNT(*) AS cnt
       FROM stores s JOIN ratings r ON r.store_id = s.id
      WHERE s.owner_id = ?
      GROUP BY r.rating`,
    [ownerId]
  );
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  dist.forEach((d) => {
    distribution[d.rating] = Number(d.cnt);
  });

  return sendSuccess(res, {
    message: 'Owner dashboard',
    data: {
      owner: { id: req.user.id, name: req.user.name, email: req.user.email },
      stores: stores.map(toStoreSummary),
      summary: {
        totalStores: stores.length,
        averageRating: agg.avg_rating === null ? null : Number(agg.avg_rating),
        totalRatings: Number(agg.total),
        uniqueRaters: Number(agg.raters),
        ratingDistribution: distribution,
      },
    },
  });
};

const RATING_SORT = {
  date: 'r.updated_at',
  rating: 'r.rating',
  name: 'u.name',
  email: 'u.email',
  store: 's.name',
};

/**
 * GET /api/owner/ratings
 * Users who rated the owner's store(s).
 * Query: storeId (must belong to the owner), search (user name/email), rating (1-5),
 *        sortBy (date|rating|name|email|store), order, page, limit
 */
const getRatings = async (req, res) => {
  const ownerId = req.user.id;
  const { page, limit, offset, sortColumn, order } = parseListQuery(req.query, {
    sortMap: RATING_SORT,
    defaultSort: 'date',
    defaultOrder: 'desc',
  });

  const where = ['s.owner_id = ?'];
  const params = [ownerId];

  const storeId = str(req.query.storeId);
  if (storeId) {
    if (!/^[1-9]\d*$/.test(storeId)) throw ApiError.badRequest('storeId must be a valid id');
    const [stores] = await pool.execute('SELECT owner_id FROM stores WHERE id = ?', [parseInt(storeId, 10)]);
    if (!stores.length) throw ApiError.notFound('Store not found');
    if (stores[0].owner_id !== ownerId) {
      throw ApiError.forbidden('You can only view ratings for your own stores');
    }
    where.push('s.id = ?');
    params.push(parseInt(storeId, 10));
  }

  const search = str(req.query.search);
  if (search) {
    where.push('(u.name LIKE ? OR u.email LIKE ?)');
    params.push(likeValue(search), likeValue(search));
  }

  const ratingFilter = str(req.query.rating);
  if (ratingFilter) {
    if (!/^[1-5]$/.test(ratingFilter)) throw ApiError.badRequest('rating filter must be a whole number from 1 to 5');
    where.push('r.rating = ?');
    params.push(parseInt(ratingFilter, 10));
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const fromSql = `FROM ratings r
       JOIN stores s ON s.id = r.store_id
       JOIN users u ON u.id = r.user_id`;

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${fromSql} ${whereSql}`, params);
  const [rows] = await pool.query(
    `SELECT r.id, r.rating, r.created_at, r.updated_at,
            u.id AS user_id, u.name AS user_name, u.email AS user_email,
            s.id AS store_id, s.name AS store_name
       ${fromSql}
       ${whereSql}
      ORDER BY ${sortColumn} ${order}, r.id ${order}
      LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return sendSuccess(res, {
    message: 'Ratings fetched successfully',
    data: {
      items: rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        user: { id: r.user_id, name: r.user_name, email: r.user_email },
        store: { id: r.store_id, name: r.store_name },
      })),
      pagination: buildPagination(page, limit, Number(total)),
    },
  });
};

module.exports = { getDashboard, getRatings };
