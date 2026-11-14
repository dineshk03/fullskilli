const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz');

// Import middleware
const { auth, isInstructor, isStudent, isAdmin } = require('../middleware/auth');
const {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getAllQuizzes,
  getQuizById,
  getQuizResults,
  validateSectionAccess,
  submitQuiz,
  getQuizStatus,
  getInstructorCourseQuizzes,
  updateQuizStatus
} = require('../controllers/quiz');

// Routes
router.get('/all', auth, getAllQuizzes);

// Instructor-specific routes (must come before general /:quizId route)
router.get('/instructor/course/:courseId', auth, isInstructor, getInstructorCourseQuizzes);
router.delete('/delete/:quizId', auth, (req, res, next) => {
  // Allow both admin and instructor to delete quizzes
  if (req.user.accountType === 'Admin' || req.user.accountType === 'Instructor') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins and instructors can delete quizzes.'
    });
  }
}, deleteQuiz);

router.post('/create', auth, (req, res, next) => {
  // Allow both admin and instructor to create quizzes
  if (req.user.accountType === 'Admin' || req.user.accountType === 'Instructor') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins and instructors can create quizzes.'
    });
  }
}, createQuiz);
router.get('/status/:quizId', auth, getQuizStatus);
router.get('/results/:quizId', auth, getQuizResults);
router.get('/validate-access/:sectionId', auth, validateSectionAccess);
router.put('/update/:quizId', auth, (req, res, next) => {
  // Allow both admin and instructor to update quizzes
  if (req.user.accountType === 'Admin' || req.user.accountType === 'Instructor') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins and instructors can update quizzes.'
    });
  }
}, updateQuiz);
router.put('/status/:quizId', auth, (req, res, next) => {
  // Allow both admin and instructor to update quiz status
  if (req.user.accountType === 'Admin' || req.user.accountType === 'Instructor') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins and instructors can update quiz status.'
    });
  }
}, updateQuizStatus);
router.post('/submit', auth, submitQuiz);

// General route (must come last to avoid conflicts)
router.get('/:quizId', auth, getQuizById);

module.exports = router;
