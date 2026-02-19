const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resume.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

/* -------------------- Resume Data -------------------- */
router.get(
  '/data/:internId',
  resumeController.getResumeData
);

/* -------------------- Resume Preview -------------------- */
router.post(
  '/preview/:internId/:templateId',
  resumeController.previewResume
);

/* -------------------- Generate PDF -------------------- */
router.post(
  '/generate/:internId/:templateId',
  resumeController.downloadResume
);

/* -------------------- Download PDF -------------------- */
router.get(
  '/download/:filename',
  resumeController.servePDF
);

/* -------------------- Draft Management -------------------- */
router.post(
  '/draft/:internId/:templateId',
  resumeController.saveDraft
);

router.get(
  '/draft/:internId/:templateId',
  resumeController.getDraft
);

/* -------------------- Download History -------------------- */
router.get(
  '/history/:internId',
  resumeController.getDownloadHistory
);

/* -------------------- Templates -------------------- */
router.get(
  '/templates',
  resumeController.getTemplates
);

router.get(
  '/templates/:templateId/preview',
  resumeController.getTemplatePreview
);

module.exports = router;
