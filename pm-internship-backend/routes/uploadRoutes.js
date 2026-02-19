const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { uploadResume, uploadCompanyDocs } = require('../controllers/uploadController');

const companyUploads = upload.fields([
  { name: 'hr_sign', maxCount: 1 },
  { name: 'ceo_sign', maxCount: 1 },
  { name: 'registration_doc', maxCount: 1 }
]);

// Intern uploads resume (field name must be 'resume')
router.post('/resume', protect, upload.single('resume'), uploadResume);

// Company uploads docs (hr_sign, ceo_sign, registration_doc)
router.post('/docs', protect, companyUploads, uploadCompanyDocs);

module.exports = router;