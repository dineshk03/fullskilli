const express = require('express');
const router = express.Router();

// Import required controllers

// course controllers 
const {
    createCourse,
    getCourseDetails,
    getAllCourses,
    getFullCourseDetails,
    editCourse,
    deleteCourse,
    getInstructorCourses,

} = require('../controllers/course')

const { updateCourseProgress, updateQuizProgress, checkSectionAccess, getProgressPercentage } = require('../controllers/courseProgress')

// categories Controllers
const {
    createCategory,
    updateCategory,
    deleteCategory,
    showAllCategories,
    getCategoryPageDetails,
} = require('../controllers/category');


// sections controllers
const {
    createSection,
    updateSection,
    deleteSection,
} = require('../controllers/section');


// subSections controllers
const {
    createSubSection,
    updateSubSection,
    deleteSubSection
} = require('../controllers/subSection');


// rating controllers
const {
    createRating,
    getAverageRating,
    getAllRatingReview,
    getSelectedReviews
} = require('../controllers/ratingAndReview');


// Middlewares
const { auth, isAdmin, isInstructor, isStudent } = require('../middleware/auth')
const { upload } = require('../middleware/multer')


// ********************************************************************************************************
//                                      Course routes
// ********************************************************************************************************
// Course Management Routes (For both Instructors and Admins)
router.post('/createCourse', auth, isInstructor, upload.single('thumbnailImage'), createCourse);

// Section Management
router.post('/addSection', auth, isInstructor, createSection);
router.post('/updateSection', auth, isInstructor, updateSection);
router.post('/deleteSection', auth, isInstructor, deleteSection);

// Subsection (Lecture) Management
router.post('/addSubSection', auth, isInstructor, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
    { name: 'ppt', maxCount: 1 }
]), createSubSection);
router.post('/updateSubSection', auth, isInstructor, (req, res, next) => {
    console.log('🔧 UPDATE SUBSECTION ROUTE HIT');
    console.log('Request headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    
    const uploadMiddleware = upload.fields([
        { name: 'videoFile', maxCount: 1 },
        { name: 'pdfFile', maxCount: 1 },
        { name: 'pptFile', maxCount: 1 }
    ]);
    
    uploadMiddleware(req, res, (err) => {
        if (err) {
            console.error('❌ MULTER ERROR:', err);
            console.error('Error name:', err.name);
            console.error('Error message:', err.message);
            console.error('Error code:', err.code);
            return res.status(400).json({
                success: false,
                message: 'File upload middleware failed',
                error: err.message,
                details: {
                    errorName: err.name,
                    errorCode: err.code,
                    stack: err.stack
                }
            });
        }
        console.log('✅ MULTER SUCCESS - calling updateSubSection');
        next();
    });
}, updateSubSection);
router.post('/deleteSubSection', auth, isInstructor, deleteSubSection);


// Get Details for a Specific Courses
router.post('/getCourseDetails', getCourseDetails);
// Get all Courses
router.get('/getAllCourses', getAllCourses);
// get full course details
router.post('/getFullCourseDetails', auth, getFullCourseDetails);
// Get all Courses Under a Specific Admin
router.get("/getInstructorCourses", auth, isAdmin, getInstructorCourses)

// Get all Courses Under a Specific Instructor
router.get("/getInstructorCoursesForInstructor", auth, isInstructor, getInstructorCourses)


// Edit Course routes - Allow both instructors and admins
router.post("/editCourse", auth, isInstructor, (req, res, next) => {
    // Use multer to handle file upload with flexible field name
    const uploadMiddle = upload.fields([
        { name: 'thumbnailImage', maxCount: 1 },
        { name: 'courseImage', maxCount: 1 }
    ]);

    uploadMiddle(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({
                success: false,
                message: 'File upload failed',
                error: err.message
            });
        }

        // Normalize file field - check both possible names
        if (req.files) {
            if (req.files.courseImage && req.files.courseImage[0]) {
                req.file = req.files.courseImage[0];
            } else if (req.files.thumbnailImage && req.files.thumbnailImage[0]) {
                req.file = req.files.thumbnailImage[0];
            }
        }

        // Allow both instructors and admins to edit courses
        if (req.user.accountType === 'Instructor' || req.user.accountType === 'Admin') {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only instructors and admins can edit courses."
            });
        }
    });
}, editCourse)

// Delete a Course - Allow both instructors and admins
router.delete("/deleteCourse", auth, isInstructor, deleteCourse)

// update Course Progress
router.post("/updateCourseProgress", auth, isStudent, updateCourseProgress)

// update Quiz Progress
router.post("/updateQuizProgress", auth, isStudent, updateQuizProgress)

// check Section Access
router.post("/checkSectionAccess", auth, isStudent, checkSectionAccess)

// get Progress Percentage
router.post("/getProgressPercentage", auth, isStudent, getProgressPercentage)


// ********************************************************************************************************
//                                      Category routes (Only by Admin)
// ********************************************************************************************************
// Category can Only be Created by Admin

router.post('/createCategory', auth, isAdmin, createCategory);
router.put('/updateCategory', auth, isAdmin, updateCategory);
router.delete('/deleteCategory', auth, isAdmin, deleteCategory);
router.get('/showAllCategories', showAllCategories);
router.post("/getCategoryPageDetails", getCategoryPageDetails)


// ********************************************************************************************************
//                                      Rating and Review
// ********************************************************************************************************
router.post('/createRating', auth, isStudent, createRating);
router.get('/getAverageRating', getAverageRating);
router.get('/getReviews', getAllRatingReview);
router.get('/getSelectedReviews', getSelectedReviews);


module.exports = router;
