const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getCompanyProfile, 
  updateCompanyProfile,
  getApplicantById,
  generateOfferLetter,
  sendOfferLetter,
  sendConfirmationEmail
} = require('../controllers/companyController');
const { updateApplicationStatus, getCompanyPostings } = require('../controllers/jobController');

// All routes are protected (User must be logged in)
router.get('/profile', protect, getCompanyProfile);
router.put('/profile', protect, updateCompanyProfile);
router.get('/applicant/:id', protect, getApplicantById); 
router.put('/application/:id/status', protect, updateApplicationStatus);
router.get('/postings', protect, getCompanyPostings);
router.get('/offer-letter/:applicationId', protect, generateOfferLetter);
router.post('/offer-letter/:applicationId/send', protect, sendOfferLetter);
router.post('/application/:id/confirm', protect, sendConfirmationEmail);

module.exports = router;