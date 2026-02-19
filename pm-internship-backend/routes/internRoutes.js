const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getInternProfile, 
  updateInternProfile, 
  getMyApplications // <--- Import this
} = require('../controllers/internController');

// All routes here are protected
router.get('/profile', protect, getInternProfile);
router.put('/profile', protect, updateInternProfile);
router.get('/applications', protect, getMyApplications); // <--- Add this line

module.exports = router;