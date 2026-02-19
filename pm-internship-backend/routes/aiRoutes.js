const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { generateResumeAI } = require('../controllers/aiController');

// Protected route (User must be logged in to use AI tokens)
router.post('/generate-resume', protect, generateResumeAI);

module.exports = router;