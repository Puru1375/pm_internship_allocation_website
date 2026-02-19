const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  postJob, 
  getJobs, 
  getJobById, 
  applyForJob, 
  getCompanyApplicants, 
  updateApplicationStatus,
  updateJob,
  deleteJob,
  getRecommendedJobs
} = require('../controllers/jobController');

// --- 1. SPECIFIC ROUTES FIRST ---

// Public: Get all jobs
router.get('/', getJobs);

router.get('/recommendations', protect, getRecommendedJobs); 
// Protected: Get Applicants (Specific string path)
// MOVED THIS UP! It was likely below /:id before
router.get('/applicants', protect, getCompanyApplicants);

// --- 2. DYNAMIC ROUTES LAST ---

// Public: Get single job by ID (This captures anything not matched above)
router.get('/:id', getJobById);

// Protected: Actions on specific IDs
router.post('/:id/apply', protect, applyForJob);
router.post('/', protect, postJob);
router.put('/:id', protect, updateJob);
router.delete('/:id', protect, deleteJob);
router.put('/application/:id/status', protect, updateApplicationStatus);

module.exports = router;