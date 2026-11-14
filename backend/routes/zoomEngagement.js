const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
    trackEngagementEvent,
    updateEngagementMetrics,
    getMeetingEngagement,
    getStudentEngagement,
    getCourseEngagement
} = require('../controllers/zoomEngagement');

// Track engagement events and metrics
router.post('/track', auth, trackEngagementEvent);
router.patch('/update', auth, updateEngagementMetrics);

// Get engagement data
router.get('/meeting/:meetingId', auth, getMeetingEngagement);
router.get('/student/:studentId', auth, getStudentEngagement);
router.get('/course/:courseId', auth, getCourseEngagement);

module.exports = router;
