const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const users = require('../controllers/userController');

const router = express.Router();

router.use(authenticateToken, authorizeRoles('USER'));

router.get('/me', asyncHandler(users.getProfile));
router.get('/me/ratings', asyncHandler(users.getMyRatings));

module.exports = router;
