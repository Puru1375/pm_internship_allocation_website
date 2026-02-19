const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    getCertificates,
    getCertificateById,
    revalidateCertificate,
    downloadCertificate,
    revokeCertificate,
    issueCertificate,
    verifyCertificate,
    sendCertificateEmail
} = require('../controllers/certificateController');

// Route: GET /api/certificates
router.get('/', protect, getCertificates);
// Static routes before param routes to avoid capture by :id
router.get('/download/:hash', downloadCertificate);
router.get('/verify/:hash', verifyCertificate);
router.post('/:id/send', protect, sendCertificateEmail);
router.get('/:id', protect, getCertificateById);
router.put('/:id/revalidate', protect, revalidateCertificate);
router.put('/:id/revoke', protect, revokeCertificate);
router.post('/issue', protect, issueCertificate);

module.exports = router;