const express = require("express");
const router = express.Router();
const { rateLimit } = require('express-rate-limit');

const {
  generateCertificate,
  verifyCertificate,
  getUserCertificates,
  regenerateCertificatesForCourse,
  getCertificateRegenerationStatus
} = require("../controllers/certificate");

const { auth, isAdmin } = require("../middleware/auth");
const { issueManualCertificates, listManualCertificates, getManualCertificateBatch, setCertificateStatus, deleteCertificate, bulkSetCertificateStatus, bulkDeleteCertificates } = require('../controllers/manualCertificate');
const { uploadCertificateAsset, getCertificateAssetImage } = require('../controllers/certificateAsset');
const { getCertificateTemplate, saveCertificateTemplate } = require('../controllers/certificateTemplate');
const { listColleges, createCollege } = require('../controllers/certificateCollege');

// ********************************************************************************************************
//                                      Certificate routes
// ********************************************************************************************************

// Generate certificate for completed course (Protected)
router.post("/generate", auth, generateCertificate);

// Verify certificate by ID (Public)
const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many verification requests. Please try again later.' },
});
router.get("/verify/:certificateId", verificationLimiter, verifyCertificate);
router.get('/asset-image', getCertificateAssetImage);

// Get user's certificates (Protected)
router.get("/user-certificates", auth, getUserCertificates);

// ********************************************************************************************************
//                                      Admin Certificate routes
// ********************************************************************************************************

const { listLmsEnrollments, createLmsCertificate } = require('../controllers/lmsCertificates');
router.get('/admin/lms/enrollments', auth, isAdmin, listLmsEnrollments);
router.post('/admin/lms/generate', auth, isAdmin, createLmsCertificate);

router.post('/admin/manual', auth, isAdmin, issueManualCertificates);
router.get('/admin/manual', auth, isAdmin, listManualCertificates);
router.get('/admin/colleges', auth, isAdmin, listColleges);
router.post('/admin/colleges', auth, isAdmin, createCollege);
router.get('/admin/batch/:batchId', auth, isAdmin, getManualCertificateBatch);
router.patch('/admin/bulk/status', auth, isAdmin, bulkSetCertificateStatus);
router.delete('/admin/bulk', auth, isAdmin, bulkDeleteCertificates);
router.patch('/admin/:certificateId/status', auth, isAdmin, setCertificateStatus);
router.delete('/admin/:certificateId', auth, isAdmin, deleteCertificate);
router.post('/admin/asset', auth, isAdmin, uploadCertificateAsset);
router.get('/admin/template', auth, isAdmin, getCertificateTemplate);
router.put('/admin/template', auth, isAdmin, saveCertificateTemplate);

// Regenerate certificates for a course (Admin only)
router.post("/regenerate", auth, isAdmin, regenerateCertificatesForCourse);

// Get certificate regeneration status for a course (Admin only)
router.get("/regeneration-status/:courseId", auth, isAdmin, getCertificateRegenerationStatus);

module.exports = router;
