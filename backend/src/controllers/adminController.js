const pool = require('../config/database');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const { hashPassword, toPublicUser } = require('../utils/security');
const { parseListQuery, str, likeValue, buildPagination } = require('../utils/queryHelpers');
const { STORE_RATING_AGG, toStoreSummary } = require('../utils/sql');
const { ROLES } = require('../validators/rules');

/* ------------------------------------------------------------------ */
/* Dashboard                                                            */
/* ------------------------------------------------------------------ */

/** GET /api/admin/dashboard */
const getDashboard = async (req, res) => {
  const [[counts]] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users)                    AS total_users,
      (SELECT COUNT(*) FROM users WHERE role = 'USER')  AS total_normal_users,
      (SELECT COUNT(*) FROM users WHERE role = 'ADMIN') AS total_admins,
      (SELECT COUNT(*) FROM users WHERE role = 'OWNER') AS total_owners,
      (SELECT COUNT(*) FROM stores)                   AS total_stores,
      (SELECT COUNT(*) FROM ratings)                  AS total_ratings,
      (SELECT ROUND(AVG(rating), 2) FROM ratings)     AS average_rating
  `);

  return sendSuccess(res, {
    message: 'Dashboard statistics',
    data: {
      totalUsers: Number(counts.total_users),
      totalNormalUsers: Number(counts.total_normal_users),
      totalAdmins: Number(counts.total_admins),
      totalStoreOwners: Number(counts.total_owners),
      totalStores: Number(counts.total_stores),
      totalRatings: Number(counts.total_ratings),
      averageRating: counts.average_rating === null ? null : Number(counts.average_rating),
    },
  });
};

/* ------------------------------------------------------------------ */
/* Users                                                                */
/* ------------------------------------------------------------------ */

const USER_SORT = {
  name: 'u.name',
  email: 'u.email',
  address: 'u.address',
  role: 'u.role',
  createdAt: 'u.created_at',
};

/**
 * GET /api/admin/users
 * Query: search (name/email/address), name, email, address, role, sortBy, order, page, limit
 */
const listUsers = async (req, res) => {
  const { page, limit, offset, sortColumn, order } = parseListQuery(req.query, {
    sortMap: USER_SORT,
    defaultSort: 'createdAt',
    defaultOrder: 'desc',
  });

  const where = [];
  const params = [];

  const search = str(req.query.search);
  if (search) {
    where.push('(u.name LIKE ? OR u.email LIKE ? OR u.address LIKE ?)');
    params.push(likeValue(search), likeValue(search), likeValue(search));
  }
  for (const field of ['name', 'email', 'address']) {
    const v = str(req.query[field]);
    if (v) {
      where.push(`u.${field} LIKE ?`);
      params.push(likeValue(v));
    }
  }
  const role = str(req.query.role).toUpperCase();
  if (role) {
    if (!ROLES.includes(role)) throw ApiError.badRequest(`role must be one of: ${ROLES.join(', ')}`);
    where.push('u.role = ?');
    params.push(role);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM users u ${whereSql}`, params);

  // For store owners, also expose the average rating across their stores.
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.address, u.role, u.created_at, u.updated_at,
            orat.owner_rating
       FROM users u
       LEFT JOIN (
         SELECT s.owner_id, ROUND(AVG(r.rating), 2) AS owner_rating
           FROM stores s JOIN ratings r ON r.store_id = s.id
          GROUP BY s.owner_id
       ) orat ON orat.owner_id = u.id AND u.role = 'OWNER'
       ${whereSql}
      ORDER BY ${sortColumn} ${order}, u.id ${order}
      LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return sendSuccess(res, {
    message: 'Users fetched successfully',
    data: {
      items: rows.map((row) => ({
        ...toPublicUser(row),
        ownerRating: row.role === 'OWNER' && row.owner_rating !== null ? Number(row.owner_rating) : null,
      })),
      pagination: buildPagination(page, limit, Number(total)),
    },
  });
};

/** GET /api/admin/users/:id – full user details (plus stores & ratings for owners). */
const getUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const [rows] = await pool.execute(
    'SELECT id, name, email, address, role, created_at, updated_at FROM users WHERE id = ?',
    [id]
  );
  if (!rows.length) throw ApiError.notFound('User not found');
  const user = toPublicUser(rows[0]);

  if (user.role === 'OWNER') {
    const [stores] = await pool.query(
      `SELECT s.id, s.name, s.email, s.address, s.created_at, s.updated_at, rs.avg_rating, rs.total_ratings
         FROM stores s ${STORE_RATING_AGG}
        WHERE s.owner_id = ?
        ORDER BY s.name`,
      [id]
    );
    const [[agg]] = await pool.query(
      `SELECT ROUND(AVG(r.rating), 2) AS avg_rating, COUNT(r.id) AS total
         FROM stores s JOIN ratings r ON r.store_id = s.id WHERE s.owner_id = ?`,
      [id]
    );
    user.stores = stores.map(toStoreSummary);
    user.ownerRating = agg.avg_rating === null ? null : Number(agg.avg_rating);
    user.ownerTotalRatings = Number(agg.total);
  }

  if (user.role === 'USER') {
    const [ratings] = await pool.query(
      `SELECT r.id, r.rating, r.created_at, r.updated_at, s.id AS store_id, s.name AS store_name
         FROM ratings r JOIN stores s ON s.id = r.store_id
        WHERE r.user_id = ?
        ORDER BY r.updated_at DESC`,
      [id]
    );
    user.ratings = ratings.map((r) => ({
      id: r.id,
      rating: r.rating,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      store: { id: r.store_id, name: r.store_name },
    }));
  }

  return sendSuccess(res, { message: 'User fetched successfully', data: { user } });
};

/**
 * POST /api/admin/users
 * Body: name, email, address, password, role (ADMIN | USER | OWNER)
 */
const createUser = async (req, res) => {
  const { name, email, address, password, role } = req.body;

  const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (existing.length) throw ApiError.conflict('Email is already registered');

  const hash = await hashPassword(password);
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
    [name, email, hash, address, role]
  );
  const [rows] = await pool.execute(
    'SELECT id, name, email, address, role, created_at, updated_at FROM users WHERE id = ?',
    [result.insertId]
  );

  const label = { ADMIN: 'Administrator', USER: 'User', OWNER: 'Store owner' }[role];
  return sendSuccess(res, {
    statusCode: 201,
    message: `${label} created successfully`,
    data: { user: toPublicUser(rows[0]) },
  });
};

/** GET /api/admin/owners – lightweight list of OWNER accounts for the "Add Store" form. */
const listOwners = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, COUNT(s.id) AS store_count
       FROM users u LEFT JOIN stores s ON s.owner_id = u.id
      WHERE u.role = 'OWNER'
      GROUP BY u.id, u.name, u.email
      ORDER BY u.name`
  );
  return sendSuccess(res, {
    message: 'Store owners fetched successfully',
    data: {
      owners: rows.map((r) => ({ id: r.id, name: r.name, email: r.email, storeCount: Number(r.store_count) })),
    },
  });
};

/* ------------------------------------------------------------------ */
/* Stores                                                               */
/* ------------------------------------------------------------------ */

const STORE_SORT = {
  name: 's.name',
  email: 's.email',
  address: 's.address',
  owner: 'o.name',
  rating: 'COALESCE(rs.avg_rating, 0)',
  totalRatings: 'COALESCE(rs.total_ratings, 0)',
  createdAt: 's.created_at',
};

/** POST /api/admin/stores – Body: name, email, address, ownerId */
const createStore = async (req, res) => {
  const { name, email, address, ownerId } = req.body;

  const [owners] = await pool.execute('SELECT id, role FROM users WHERE id = ?', [ownerId]);
  if (!owners.length) {
    throw ApiError.badRequest('Selected store owner does not exist', { ownerId: 'Store owner does not exist' });
  }
  if (owners[0].role !== 'OWNER') {
    throw ApiError.badRequest('Selected user is not a store owner', {
      ownerId: 'Selected user must have the OWNER role',
    });
  }

  const [dup] = await pool.execute('SELECT id FROM stores WHERE email = ? LIMIT 1', [email]);
  if (dup.length) throw ApiError.conflict('A store with this email already exists');

  const [result] = await pool.execute(
    'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
    [name, email, address, ownerId]
  );

  const store = await fetchStoreDetails(result.insertId);
  return sendSuccess(res, { statusCode: 201, message: 'Store created successfully', data: { store } });
};

/**
 * GET /api/admin/stores
 * Query: search (name/email/address), name, email, address, ownerId, sortBy, order, page, limit
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
    where.push('(s.name LIKE ? OR s.email LIKE ? OR s.address LIKE ?)');
    params.push(likeValue(search), likeValue(search), likeValue(search));
  }
  for (const field of ['name', 'email', 'address']) {
    const v = str(req.query[field]);
    if (v) {
      where.push(`s.${field} LIKE ?`);
      params.push(likeValue(v));
    }
  }
  const ownerId = str(req.query.ownerId);
  if (ownerId) {
    if (!/^[1-9]\d*$/.test(ownerId)) throw ApiError.badRequest('ownerId must be a valid id');
    where.push('s.owner_id = ?');
    params.push(parseInt(ownerId, 10));
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM stores s ${whereSql}`, params);

  const [rows] = await pool.query(
    `SELECT s.id, s.name, s.email, s.address, s.created_at, s.updated_at,
            rs.avg_rating, rs.total_ratings,
            o.id AS owner_id, o.name AS owner_name, o.email AS owner_email
       FROM stores s
       JOIN users o ON o.id = s.owner_id
       ${STORE_RATING_AGG}
       ${whereSql}
      ORDER BY ${sortColumn} ${order}, s.id ${order}
      LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return sendSuccess(res, {
    message: 'Stores fetched successfully',
    data: {
      items: rows.map((row) => ({
        ...toStoreSummary(row),
        owner: { id: row.owner_id, name: row.owner_name, email: row.owner_email },
      })),
      pagination: buildPagination(page, limit, Number(total)),
    },
  });
};

/** Store + owner + aggregate + every individual rating with the rating user. */
async function fetchStoreDetails(storeId) {
  const [rows] = await pool.query(
    `SELECT s.id, s.name, s.email, s.address, s.created_at, s.updated_at,
            rs.avg_rating, rs.total_ratings,
            o.id AS owner_id, o.name AS owner_name, o.email AS owner_email, o.address AS owner_address
       FROM stores s
       JOIN users o ON o.id = s.owner_id
       ${STORE_RATING_AGG}
      WHERE s.id = ?`,
    [storeId]
  );
  if (!rows.length) return null;
  const row = rows[0];

  const [ratings] = await pool.query(
    `SELECT r.id, r.rating, r.created_at, r.updated_at, u.id AS user_id, u.name AS user_name, u.email AS user_email
       FROM ratings r JOIN users u ON u.id = r.user_id
      WHERE r.store_id = ?
      ORDER BY r.updated_at DESC, r.id DESC`,
    [storeId]
  );

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach((r) => {
    distribution[r.rating] += 1;
  });

  return {
    ...toStoreSummary(row),
    owner: { id: row.owner_id, name: row.owner_name, email: row.owner_email, address: row.owner_address },
    ratingDistribution: distribution,
    ratings: ratings.map((r) => ({
      id: r.id,
      rating: r.rating,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      user: { id: r.user_id, name: r.user_name, email: r.user_email },
    })),
  };
}

/** GET /api/admin/stores/:id */
const getStore = async (req, res) => {
  const store = await fetchStoreDetails(parseInt(req.params.id, 10));
  if (!store) throw ApiError.notFound('Store not found');
  return sendSuccess(res, { message: 'Store fetched successfully', data: { store } });
};

module.exports = {
  getDashboard,
  listUsers,
  getUser,
  createUser,
  listOwners,
  createStore,
  listStores,
  getStore,
  fetchStoreDetails,
};
