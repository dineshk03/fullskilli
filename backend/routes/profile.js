const express = require("express");
const router = express.Router();
const multer = require('multer');

const { auth, isInstructor } = require("../middleware/auth");
const { upload } = require("../middleware/multer");

// controllers
const {
    updateProfile,
    updateUserProfileImage,
    getUserDetails,
    getEnrolledCourses,
    deleteAccount,
    instructorDashboard
} = require('../controllers/profile');


// ********************************************************************************************************
//                                      Profile routes
// ********************************************************************************************************

// Delete User Account
router.delete('/deleteProfile', auth, deleteAccount);
router.put('/updateProfile', auth, updateProfile);
router.get('/getUserDetails', auth, getUserDetails);


// Get Enrolled Courses
router.get('/getEnrolledCourses', auth, getEnrolledCourses);

// update profile image - wrap multer to convert multer errors to clean 400s
router.put('/updateUserProfileImage', auth, (req, res, next) => {
    upload.single('profileImage')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Multer-specific errors (file too large, wrong field, etc.)
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'Profile image must be 500MB or less. Please choose a smaller file.',
                    error: 'FILE_SIZE_EXCEEDED'
                });
            }
            return res.status(400).json({
                success: false,
                message: err.message,
                error: 'MULTER_ERROR'
            });
        } else if (err) {
            // Our custom fileFilter error
            return res.status(400).json({
                success: false,
                message: err.message,
                error: 'INVALID_FILE_TYPE'
            });
        }
        // No error - proceed to controller
        next();
    });
}, updateUserProfileImage);

// instructor Dashboard Details
router.get('/instructorDashboard', auth, isInstructor, instructorDashboard);



module.exports = router;

