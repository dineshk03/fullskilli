const Assignment = require('../models/assignment');
const Submission = require('../models/submission');
const Course = require('../models/course');
const { sendAssignmentCreatedEmail } = require('../services/emailService');

/**
 * Create a new assignment
 * POST /api/v1/assignments/create
 */
exports.createAssignment = async (req, res) => {
    try {
        console.log('📝 Creating new assignment...');
        console.log('Request body:', req.body);
        console.log('Uploaded file:', req.file);
        console.log('User:', req.user);

        const {
            title,
            description,
            instructions,
            courseId,
            sectionId,
            subSectionId,
            totalPoints,
            passingPoints,
            dueDate,
            allowLateSubmission,
            lateSubmissionAllowed,
            lateDeadline,
            latePenalty,
            submissionType,
            allowedFileTypes,
            maxFileSize,
            maxFiles,
            allowResubmission,
            maxResubmissions,
            gradingType,
            rubric,
            published
        } = req.body;

        const instructorId = req.user.id;
        const uploadedFile = req.file; // File from multer

        // Validate required fields
        if (!title || !courseId || !dueDate) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, courseId, dueDate'
            });
        }

        // Verify course exists and user has permission
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if user is instructor or admin
        if (req.user.accountType !== 'Admin' && course.instructor.toString() !== instructorId) {
            return res.status(403).json({
                success: false,
                message: 'Only the course instructor or admin can create assignments'
            });
        }

        // Prepare assignment data
        const assignmentData = {
            title,
            description: description || '',
            instructions: instructions || '',
            course: courseId,
            instructor: instructorId,
            totalPoints: totalPoints || 100,
            passingPoints: passingPoints || 60,
            dueDate: new Date(dueDate),
            lateSubmissionAllowed: allowLateSubmission === 'true' || allowLateSubmission === true || lateSubmissionAllowed === 'true' || lateSubmissionAllowed === true,
            lateDeadline: lateDeadline ? new Date(lateDeadline) : null,
            latePenalty: latePenalty || 10,
            submissionType: submissionType || 'file',
            allowedFileTypes: allowedFileTypes || ['pdf', 'doc', 'docx', 'txt', 'zip'],
            maxFileSize: maxFileSize || 10,
            maxFiles: maxFiles || 5,
            allowResubmission: allowResubmission !== undefined ? allowResubmission : true,
            maxResubmissions: maxResubmissions || 3,
            gradingType: gradingType || 'points',
            rubric: rubric || [],
            published: published || false
        };

        // Add section and subsection if provided
        if (sectionId && sectionId !== '') {
            assignmentData.section = sectionId;
        }
        if (subSectionId && subSectionId !== '') {
            assignmentData.subSection = subSectionId;
        }

        // Add uploaded file URL if present
        if (uploadedFile) {
            const fileUrl = uploadedFile.location || uploadedFile.path || uploadedFile.url;
            assignmentData.attachmentUrl = fileUrl;
            assignmentData.attachments = [
                {
                    fileName: uploadedFile.originalname || uploadedFile.key || 'attachment',
                    fileUrl,
                    fileSize: uploadedFile.size,
                },
            ];
            console.log('📎 Assignment file uploaded:', fileUrl);
        }

        // Create assignment
        const assignment = await Assignment.create(assignmentData);

        console.log('✅ Assignment created:', assignment._id);

        // If published, send email notifications to enrolled students
        if (published) {
            try {
                console.log('📧 Assignment is published, sending email notifications...');

                // Get course with enrolled students
                const courseWithStudents = await Course.findById(courseId)
                    .populate('studentsEnrolled', 'firstName lastName email');

                if (courseWithStudents && courseWithStudents.studentsEnrolled.length > 0) {
                    const emailResult = await sendAssignmentCreatedEmail(assignment, courseWithStudents);

                    // Update assignment with email status
                    assignment.emailSent = emailResult.success;
                    assignment.emailSentAt = new Date();
                    await assignment.save();

                    console.log(`✅ Emails sent: ${emailResult.sent}/${emailResult.total}`);
                } else {
                    console.log('⚠️ No enrolled students found, skipping email notifications');
                }
            } catch (emailError) {
                console.error('❌ Error sending emails:', emailError);
                // Don't fail the request if email fails
            }
        }

        // Populate instructor details
        await assignment.populate('instructor', 'firstName lastName email');

        res.status(201).json({
            success: true,
            message: 'Assignment created successfully',
            data: assignment
        });

    } catch (error) {
        console.error('❌ Error creating assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create assignment',
            error: error.message
        });
    }
};

/**
 * Get all assignments for a course
 * GET /api/v1/assignments/course/:courseId
 */
exports.getCourseAssignments = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.accountType;

        console.log(`📚 Getting assignments for course: ${courseId}`);

        // Students only see published assignments
        const published = userRole === 'Student' ? true : undefined;

        const assignments = await Assignment.getCourseAssignments(courseId, published);

        // For students, include their submission status
        if (userRole === 'Student') {
            const assignmentsWithStatus = await Promise.all(
                assignments.map(async (assignment) => {
                    const submission = await Submission.findOne({
                        assignment: assignment._id,
                        student: userId
                    });

                    return {
                        ...assignment.toObject(),
                        submissionStatus: submission ? submission.status : 'not-submitted',
                        grade: submission ? submission.grade : null,
                        submittedAt: submission ? submission.submittedAt : null
                    };
                })
            );

            return res.status(200).json({
                success: true,
                count: assignmentsWithStatus.length,
                data: assignmentsWithStatus
            });
        }

        res.status(200).json({
            success: true,
            count: assignments.length,
            data: assignments
        });

    } catch (error) {
        console.error('❌ Error getting course assignments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get assignments',
            error: error.message
        });
    }
};

/**
 * Get assignment by ID
 * GET /api/v1/assignments/:assignmentId
 */
exports.getAssignmentById = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.accountType;

        const assignment = await Assignment.findById(assignmentId)
            .populate('instructor', 'firstName lastName email')
            .populate('course', 'courseName')
            .populate('attachments');

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Students can only view published assignments
        if (userRole === 'Student' && !assignment.published) {
            return res.status(403).json({
                success: false,
                message: 'This assignment is not yet published'
            });
        }

        // For students, include their submission
        if (userRole === 'Student') {
            const submission = await Submission.findOne({
                assignment: assignmentId,
                student: userId
            });

            return res.status(200).json({
                success: true,
                data: {
                    ...assignment.toObject(),
                    submission: submission || null
                }
            });
        }

        res.status(200).json({
            success: true,
            data: assignment
        });

    } catch (error) {
        console.error('❌ Error getting assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get assignment',
            error: error.message
        });
    }
};

/**
 * Update assignment
 * PATCH /api/v1/assignments/:assignmentId
 */
exports.updateAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const instructorId = req.user.id;
        const userRole = req.user.accountType;
        const uploadedFile = req.file; // File from multer

        const assignment = await Assignment.findById(assignmentId);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Check permission
        if (userRole !== 'Admin' && assignment.instructor.toString() !== instructorId) {
            return res.status(403).json({
                success: false,
                message: 'Only the assignment creator or admin can update this assignment'
            });
        }

        // Update fields
        const allowedUpdates = [
            'title', 'description', 'instructions', 'totalPoints', 'passingPoints',
            'dueDate', 'lateSubmissionAllowed', 'lateDeadline', 'latePenalty',
            'submissionType', 'allowedFileTypes', 'maxFileSize', 'maxFiles',
            'allowResubmission', 'maxResubmissions', 'gradingType', 'rubric'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                assignment[field] = req.body[field];
            }
        });

        // Handle attachment deletion
        if (req.body.deleteAttachment === 'true') {
            assignment.attachmentUrl = undefined;
            assignment.attachments = [];
            console.log('🗑️ Assignment attachment deleted');
        }

        // Handle file upload if present
        if (uploadedFile) {
            const fileUrl = uploadedFile.location || uploadedFile.path || uploadedFile.url;
            assignment.attachmentUrl = fileUrl;
            assignment.attachments = [
                {
                    fileName: uploadedFile.originalname || uploadedFile.key || 'attachment',
                    fileUrl,
                    fileSize: uploadedFile.size,
                },
            ];
            console.log('📎 Assignment file updated:', fileUrl);
        }

        await assignment.save();

        res.status(200).json({
            success: true,
            message: 'Assignment updated successfully',
            data: assignment
        });

    } catch (error) {
        console.error('❌ Error updating assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update assignment',
            error: error.message
        });
    }
};

/**
 * Delete assignment
 * DELETE /api/v1/assignments/:assignmentId
 */
exports.deleteAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const instructorId = req.user.id;
        const userRole = req.user.accountType;

        const assignment = await Assignment.findById(assignmentId);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Check permission
        if (userRole !== 'Admin' && assignment.instructor.toString() !== instructorId) {
            return res.status(403).json({
                success: false,
                message: 'Only the assignment creator or admin can delete this assignment'
            });
        }

        // Delete all submissions for this assignment
        await Submission.deleteMany({ assignment: assignmentId });

        // Delete assignment
        await Assignment.findByIdAndDelete(assignmentId);

        res.status(200).json({
            success: true,
            message: 'Assignment and all submissions deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error deleting assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete assignment',
            error: error.message
        });
    }
};

/**
 * Publish/Unpublish assignment
 * POST /api/v1/assignments/:assignmentId/publish
 */
exports.publishAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { published } = req.body;
        const instructorId = req.user.id;
        const userRole = req.user.accountType;

        const assignment = await Assignment.findById(assignmentId);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Check permission
        if (userRole !== 'Admin' && assignment.instructor.toString() !== instructorId) {
            return res.status(403).json({
                success: false,
                message: 'Only the assignment creator or admin can publish this assignment'
            });
        }

        assignment.published = published;
        await assignment.save();

        // If publishing for the first time, send emails
        if (published && !assignment.emailSent) {
            try {
                const courseWithStudents = await Course.findById(assignment.course)
                    .populate('studentsEnrolled', 'firstName lastName email');

                if (courseWithStudents && courseWithStudents.studentsEnrolled.length > 0) {
                    const emailResult = await sendAssignmentCreatedEmail(assignment, courseWithStudents);

                    assignment.emailSent = emailResult.success;
                    assignment.emailSentAt = new Date();
                    await assignment.save();

                    console.log(`✅ Emails sent: ${emailResult.sent}/${emailResult.total}`);
                }
            } catch (emailError) {
                console.error('❌ Error sending emails:', emailError);
            }
        }

        res.status(200).json({
            success: true,
            message: `Assignment ${published ? 'published' : 'unpublished'} successfully`,
            data: assignment
        });

    } catch (error) {
        console.error('❌ Error publishing assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to publish assignment',
            error: error.message
        });
    }
};

/**
 * Get instructor's assignments
 * GET /api/v1/assignments/my-assignments
 */
exports.getInstructorAssignments = async (req, res) => {
    try {
        const instructorId = req.user.id;

        const assignments = await Assignment.getInstructorAssignments(instructorId);

        res.status(200).json({
            success: true,
            count: assignments.length,
            data: assignments
        });

    } catch (error) {
        console.error('❌ Error getting instructor assignments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get assignments',
            error: error.message
        });
    }
};
