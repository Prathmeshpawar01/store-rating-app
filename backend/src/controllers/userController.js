const pool = require('../config/database');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const { toPublicUser } = require('../utils/security');

/** GET /api/users/me – profile of the logged-in normal user. */
const getProfile = async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, name, email, address, role, created_at, updated_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!rows.length) throw ApiError.notFound('User not found');

  const [[stats]] = await pool.query(
    'SELECT COUNT(*) AS total, ROUND(AVG(rating), 2) AS avg_given FROM ratings WHERE user_id = ?',
    [req.user.id]
  );

  return sendSuccess(res, {
    message: 'Profile fetched successfully',
    data: {
      user: toPublicUser(rows[0]),
      stats: {
        totalRatings: Number(stats.total),
        averageRatingGiven: stats.avg_given === null ? null : Number(stats.avg_given),
      },
    },
  });
};

/** GET /api/users/me/ratings – every rating the logged-in user has submitted. */
const getMyRatings = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.id, r.rating, r.created_at, r.updated_at, s.id AS store_id, s.name AS store_name, s.address AS store_address
       FROM ratings r JOIN stores s ON s.id = r.store_id
      WHERE r.user_id = ?
      ORDER BY r.updated_at DESC, r.id DESC`,
    [req.user.id]
  );
  return sendSuccess(res, {
    message: 'Ratings fetched successfully',
    data: {
      ratings: rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        store: { id: r.store_id, name: r.store_name, address: r.store_address },
      })),
    },
  });
};

module.exports = { getProfile, getMyRatings };
