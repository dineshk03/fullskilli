const express = require('express');
const router = express.Router();

// Import controllers
const {
    getAdminQuizAnalytics,
    getAllStudentQuizPerformance,
    getQuizInsights,
    getStudentComparison,
    generateAdminReport
} = require('../controllers/adminQuizReports');

// Import middlewares
const { auth } = require('../middleware/auth');
const { isAdmin, isInstructor } = require('../middleware/auth');

// Admin Analytics Routes
router.get('/analytics', auth, isAdmin, getAdminQuizAnalytics);
router.get('/all-students', auth, isAdmin, getAllStudentQuizPerformance);
router.get('/quiz-insights/:quizId', auth, isAdmin, getQuizInsights);
router.post('/student-comparison', auth, isAdmin, getStudentComparison);
router.post('/generate-report', auth, isAdmin, generateAdminReport);

// Instructor Routes (subset of admin functionality)
router.get('/instructor/analytics', auth, isInstructor, getAdminQuizAnalytics);
router.get('/instructor/students', auth, isInstructor, getAllStudentQuizPerformance);
router.get('/instructor/quiz-insights/:quizId', auth, isInstructor, getQuizInsights);

module.exports = router;
