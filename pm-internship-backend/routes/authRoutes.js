const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyEmail, forgotPassword, resetPassword, checkEmailAvailability } = require('../controllers/authController');
const { loginRateLimiter } = require('../middleware/rateLimitMiddleware');

router.post('/register', registerUser);
router.post('/verify-email', verifyEmail);
router.get('/check-email', checkEmailAvailability); // Changed to GET for query parameter support
router.post('/login', loginRateLimiter, loginUser); // Apply rate limiting to login
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
module.exports = router;