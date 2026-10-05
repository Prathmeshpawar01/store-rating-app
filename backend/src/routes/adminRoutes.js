const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateBody, validateIdParam } = require('../middleware/validationMiddleware');
const { adminCreateUserSchema, createStoreSchema } = require('../validators/schemas');
const admin = require('../controllers/adminController');

const router = express.Router();

// Every admin route requires a valid token AND the ADMIN role (checked server-side).
router.use(authenticateToken, authorizeRoles('ADMIN'));

router.get('/dashboard', asyncHandler(admin.getDashboard));

router.get('/users', asyncHandler(admin.listUsers));
router.post('/users', validateBody(adminCreateUserSchema), asyncHandler(admin.createUser));
router.get('/users/:id', validateIdParam('id'), asyncHandler(admin.getUser));

router.get('/owners', asyncHandler(admin.listOwners));

router.get('/stores', asyncHandler(admin.listStores));
router.post('/stores', validateBody(createStoreSchema), asyncHandler(admin.createStore));
router.get('/stores/:id', validateIdParam('id'), asyncHandler(admin.getStore));

module.exports = router;
