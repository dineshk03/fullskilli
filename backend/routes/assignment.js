const express = require('express');
const router = express.Router();
const { auth, isInstructor, isAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/multer');
const { optionalUpload } = require('../middleware/optionalUpload');
const {
    createAssignment,
    getCourseAssignments,
    getAssignmentById,
    updateAssignment,
    deleteAssignment,
    publishAssignment,
    getInstructorAssignments
} = require('../controllers/assignment');

// Instructor/Admin routes
router.post('/create', auth, isInstructor, upload.single('assignmentFile'), createAssignment);
router.get('/my-assignments', auth, isInstructor, getInstructorAssignments);
router.patch('/:assignmentId', auth, isInstructor, upload.single('assignmentFile'), updateAssignment);
router.delete('/:assignmentId', auth, isInstructor, deleteAssignment);
router.post('/:assignmentId/publish', auth, isInstructor, publishAssignment);

// Common routes (with role-based filtering in controller)
router.get('/course/:courseId', auth, getCourseAssignments);
router.get('/:assignmentId', auth, getAssignmentById);

module.exports = router;
