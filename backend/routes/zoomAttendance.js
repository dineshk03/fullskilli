const express = require('express');
const router = express.Router();
const {
  getMeetingParticipants,
  getCourseAttendance,
  getMeetingAttendance,
  syncMeetingAttendance,
  updateMeetingStatus,
  getRealTimeAttendanceStats
} = require('../controllers/zoomAttendance');
const { auth, isInstructor, isAdmin } = require('../middleware/auth');

// Get participants for a specific meeting (Instructor/Admin only)
router.get('/meeting/:meetingId/participants', auth, isInstructor, getMeetingParticipants);

// Get attendance for a specific meeting (Instructor/Admin only)
router.get('/meeting/:meetingId/attendance', auth, isInstructor, getMeetingAttendance);

// Get real-time attendance statistics (Instructor/Admin only)
router.get('/meeting/:meetingId/stats', auth, isInstructor, getRealTimeAttendanceStats);

// Update meeting status (Instructor/Admin only)
router.put('/meeting/:meetingId/status', auth, isInstructor, updateMeetingStatus);

// Sync attendance for a meeting (Instructor/Admin only)
router.post('/meeting/:meetingId/sync', auth, isInstructor, syncMeetingAttendance);

// Get attendance records for a course (Instructor/Admin only)
router.get('/course/:courseId/attendance', auth, isInstructor, getCourseAttendance);

module.exports = router;
