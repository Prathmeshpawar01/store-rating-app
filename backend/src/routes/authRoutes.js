const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validationMiddleware');
const { rateLimit } = require('../utils/rateLimiter');
const { registerSchema, loginSchema, changePasswordSchema } = require('../validators/schemas');
const auth = require('../controllers/authController');

const router = express.Router();
// At most 20 failed login/sign-up attempts per IP every 15 minutes.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

router.post('/register', authLimiter, validateBody(registerSchema), asyncHandler(auth.register));
router.post('/login', authLimiter, validateBody(loginSchema), asyncHandler(auth.login));
router.get('/me', authenticateToken, asyncHandler(auth.me));
router.post(
  '/change-password',
  authenticateToken,
  validateBody(changePasswordSchema),
  asyncHandler(auth.changePassword)
);

module.exports = router;
