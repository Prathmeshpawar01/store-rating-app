const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const owner = require('../controllers/ownerController');

const router = express.Router();

// Owners get read-only access to rating data for their own stores.
router.use(authenticateToken, authorizeRoles('OWNER'));

router.get('/dashboard', asyncHandler(owner.getDashboard));
router.get('/ratings', asyncHandler(owner.getRatings));

module.exports = router;
