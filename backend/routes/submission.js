const express = require('express');
const router = express.Router();
const { auth, isInstructor, isStudent } = require('../middleware/auth');
const { upload } = require('../middleware/multer');
const {
    submitAssignment,
    getStudentSubmissions,
    getAssignmentSubmissions,
    gradeSubmission
} = require('../controllers/submission');

// Student routes
router.post('/submit', auth, isStudent, upload.single('files'), submitAssignment);
router.get('/my-submissions', auth, isStudent, getStudentSubmissions);

// Instructor routes
router.get('/assignment/:assignmentId', auth, isInstructor, getAssignmentSubmissions);
router.post('/:submissionId/grade', auth, isInstructor, gradeSubmission);

module.exports = router;
