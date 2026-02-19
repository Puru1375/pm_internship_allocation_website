const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    getAdminStats, 
    getPendingCompanies, 
    verifyCompany,
    verifyIntern,
    confirmAllocation,
    getCompanyById,
    getAllocationMatches,
    getInternById,
    getPendingInterns,
    rejectCompany,
    banIntern,
    getCompletedInternships,
} = require('../controllers/adminController');

// Certificate-specific handlers
const { sendCertificateEmail } = require('../controllers/certificateController');

// All routes here require Admin permission (You can add specific role check middleware later)
router.get('/stats', protect, getAdminStats);
router.get('/allocation/matches', protect, getAllocationMatches);
router.get('/verify/companies', protect, getPendingCompanies);
router.put('/verify/company/:id', protect, verifyCompany);
router.get('/verify/company/:id', protect, getCompanyById);
router.put('/verify/company/:id/reject', protect, rejectCompany);
router.put('/verify/intern/:id/ban', protect, banIntern);
router.get('/verify/intern/:id', protect, getInternById); 
router.put('/verify/intern/:id', protect, verifyIntern);
router.put('/allocation/:id/confirm', protect, confirmAllocation);
router.get('/verify/interns', protect, getPendingInterns); 
router.get('/completed-internships', protect, getCompletedInternships);
router.post('/:id/send', protect, sendCertificateEmail);



module.exports = router;