/**
 * Reusable SQL fragments (static strings only – never built from user input).
 */

/** Per-store rating aggregate, joined as `rs`. */
const STORE_RATING_AGG = `
  LEFT JOIN (
    SELECT store_id, ROUND(AVG(rating), 2) AS avg_rating, COUNT(*) AS total_ratings
    FROM ratings
    GROUP BY store_id
  ) rs ON rs.store_id = s.id`;

/** Converts an aggregated store row into the API shape. */
const toStoreSummary = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  address: row.address,
  averageRating: row.avg_rating === null || row.avg_rating === undefined ? null : Number(row.avg_rating),
  totalRatings: Number(row.total_ratings || 0),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

module.exports = { STORE_RATING_AGG, toStoreSummary };
