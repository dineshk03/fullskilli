const express = require('express');
const router = express.Router();

// Import controllers
const {
    getQuizReports,
    getQuizAnalytics,
    getStudentQuizPerformance,
    getQuizLeaderboard,
    exportQuizReports
} = require('../controllers/quizReports');

// Import middleware
const { auth, isAdmin } = require('../middleware/auth');

// ********************************************************************************************************
//                                      Quiz Reports Routes
// ********************************************************************************************************

// Get comprehensive quiz reports (Admin only)
router.get('/reports', auth, isAdmin, getQuizReports);

// Get quiz analytics and statistics (Admin only)
router.get('/analytics', auth, isAdmin, getQuizAnalytics);

// Get student-specific quiz performance
router.get('/student/:studentId', auth, getStudentQuizPerformance);

// Get quiz leaderboard
router.get('/leaderboard', auth, getQuizLeaderboard);

// Export quiz reports to CSV (Admin only)
router.get('/export', auth, isAdmin, exportQuizReports);

module.exports = router;
