const express = require('express');
const router = express.Router();
const {
  getMeetingRecordings,
  getCourseRecordings,
  getInstructorRecordings,
  updateRecordingSettings,
  recordRecordingView,
  deleteRecording
} = require('../controllers/zoomRecording');
const { auth, isInstructor, isAdmin } = require('../middleware/auth');

// Get recordings for a specific meeting (Instructor/Admin only)
router.get('/meeting/:meetingId/recordings', auth, isInstructor, getMeetingRecordings);

// Get recordings for a course (Instructor/Admin only)
router.get('/course/:courseId/recordings', auth, isInstructor, getCourseRecordings);

// Get recordings for an instructor (Instructor/Admin only)
router.get('/instructor/:instructorId/recordings', auth, isInstructor, getInstructorRecordings);

// Update recording settings (Instructor/Admin only)
router.put('/recording/:recordingId/settings', auth, isInstructor, updateRecordingSettings);

// Record a student viewing a recording (Student/Instructor/Admin)
router.post('/recording/:recordingId/view', auth, recordRecordingView);

// Delete a recording (Instructor/Admin only)
router.delete('/recording/:recordingId', auth, isInstructor, deleteRecording);

module.exports = router;
