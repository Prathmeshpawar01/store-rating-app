const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateBody, validateIdParam } = require('../middleware/validationMiddleware');
const { ratingSchema } = require('../validators/schemas');
const stores = require('../controllers/storeController');

const router = express.Router();

// Store browsing and rating are for normal users only.
router.use(authenticateToken, authorizeRoles('USER'));

router.get('/', asyncHandler(stores.listStores));
router.get('/:id', validateIdParam('id'), asyncHandler(stores.getStore));
router.post('/:id/rating', validateIdParam('id'), validateBody(ratingSchema), asyncHandler(stores.submitRating));
router.put('/:id/rating', validateIdParam('id'), validateBody(ratingSchema), asyncHandler(stores.updateRating));

module.exports = router;
