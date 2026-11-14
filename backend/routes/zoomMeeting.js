const express = require('express');
const router = express.Router();

console.log('🚀 Zoom routes module loaded');

const {
    createZoomMeeting,
    updateZoomMeeting,
    deleteZoomMeeting,
    getZoomMeeting,
    getInstructorZoomMeetings,
    getStudentZoomMeetings,
    getAllAdminZoomMeetings,
    validateMeetingSecurity
} = require('../controllers/zoomMeeting');

const { auth, isInstructor, isStudent, isAdmin } = require('../middleware/auth');

// Debug middleware
const debugMiddleware = (req, res, next) => {
    console.log('🔍 ZOOM ROUTE HIT:', req.method, req.path);
    console.log('🔍 Headers:', req.headers.authorization ? 'Token present' : 'No token');
    console.log('🔍 User:', req.user ? { email: req.user.email, accountType: req.user.accountType } : 'No user');
    next();
};

// Create Zoom meeting (Instructor or Admin)
router.post('/create', debugMiddleware, auth, (req, res, next) => {
    if (req.user.accountType === 'Instructor' || req.user.accountType === 'Admin') {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: 'Only instructors and admins can create meetings'
    });
}, createZoomMeeting);

// Update Zoom meeting (Instructor only)
router.put('/update/:subSectionId', auth, isInstructor, updateZoomMeeting);

// Delete Zoom meeting (Instructor or Admin)
router.delete('/delete/:subSectionId', debugMiddleware, auth, (req, res, next) => {
    console.log('🗑️ DELETE ROUTE AUTH CHECK');
    console.log('👤 User account type:', req.user?.accountType);
    console.log('🔍 Checking if Instructor or Admin...');
    
    if (req.user.accountType === 'Instructor' || req.user.accountType === 'Admin') {
        console.log('✅ Access granted - User is Instructor or Admin');
        return next();
    }
    
    console.log('❌ Access denied - User is neither Instructor nor Admin');
    return res.status(403).json({
        success: false,
        message: 'Only instructors and admins can delete meetings'
    });
}, deleteZoomMeeting);

// Get specific Zoom meeting details (Instructor or enrolled student)
router.get('/details/:subSectionId', auth, getZoomMeeting);

// Get all Zoom meetings for instructor
router.get('/instructor/meetings', auth, isInstructor, getInstructorZoomMeetings);

// Get all upcoming Zoom meetings for student
router.get('/student/meetings', auth, isStudent, getStudentZoomMeetings);

// Get all Zoom meetings for admin
router.get('/admin/all', debugMiddleware, auth, isAdmin, getAllAdminZoomMeetings);

// Validate meeting security (Instructor or Admin)
router.get('/security/:meetingId/validate', auth, (req, res, next) => {
    if (req.user.accountType === 'Instructor' || req.user.accountType === 'Admin') {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: 'Only instructors and admins can validate meeting security'
    });
}, validateMeetingSecurity);


// Catch-all route for debugging
router.use('*', (req, res, next) => {
    console.log('🚨 Zoom routes catch-all hit:', req.method, req.originalUrl);
    console.log('🚨 This should not happen - route not found in zoom routes');
    next();
});

module.exports = router;
