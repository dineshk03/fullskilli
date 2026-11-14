const express = require('express');
const router = express.Router();

const { capturePayment, verifyPayment, getPurchaseHistory, getPaymentReports, exportPaymentReports, getPurchasedPlans } = require('../controllers/payments');
const { getOrderByCourse } = require('../controllers/order');
const { auth, isAdmin, isInstructor, isStudent } = require('../middleware/auth');

router.post('/capturePayment', auth, isStudent, capturePayment);
router.get('/plans', auth, isStudent, getPurchasedPlans);
router.post('/verifyPayment', auth, isStudent, verifyPayment);
router.get('/purchaseHistory', auth, isStudent, getPurchaseHistory);
router.get('/order/course/:courseId', auth, isStudent, getOrderByCourse);

// Admin routes
router.get('/admin/reports', auth, isAdmin, getPaymentReports);
router.get('/admin/reports/export', auth, isAdmin, exportPaymentReports);

// Backward-compatible admin routes (frontend expects these)
router.get('/reports', auth, isAdmin, getPaymentReports);
router.get('/reports/export', auth, isAdmin, exportPaymentReports);

module.exports = router
