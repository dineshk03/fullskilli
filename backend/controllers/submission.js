const Submission = require('../models/submission');
const Assignment = require('../models/assignment');

/**
 * Submit assignment
 * POST /api/v1/submissions/submit
 */
exports.submitAssignment = async (req, res) => {
    try {
        const { assignmentId, submissionType, textContent, linkUrl } = req.body;
        const studentId = req.user.id;
        const uploadedFile = req.file; // File from multer

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Check if accepting submissions
        if (!assignment.isAcceptingSubmissions()) {
            return res.status(400).json({
                success: false,
                message: 'This assignment is no longer accepting submissions'
            });
        }

        // Check for existing submission
        let submission = await Submission.findOne({
            assignment: assignmentId,
            student: studentId
        });

        if (submission && submission.status === 'submitted') {
            if (!assignment.allowResubmission) {
                return res.status(400).json({
                    success: false,
                    message: 'Resubmission is not allowed for this assignment'
                });
            }

            if (submission.attemptNumber >= assignment.maxResubmissions) {
                return res.status(400).json({
                    success: false,
                    message: `Maximum resubmission limit (${assignment.maxResubmissions}) reached`
                });
            }

            // Create resubmission
            submission.previousSubmissions.push(submission._id);
            submission.attemptNumber += 1;
            submission.status = 'resubmitted';
        } else {
            // Create new submission
            submission = new Submission({
                assignment: assignmentId,
                student: studentId,
                course: assignment.course
            });
        }

        submission.submissionType = submissionType || 'text';
        submission.textContent = textContent || '';
        submission.linkUrl = linkUrl || '';

        // Handle file upload
        if (uploadedFile) {
            const fileUrl = uploadedFile.location || uploadedFile.path || uploadedFile.url;
            submission.files = [
                {
                    fileName: uploadedFile.originalname || uploadedFile.key || 'submission-file',
                    fileUrl,
                    fileSize: uploadedFile.size,
                },
            ];
        } else {
            submission.files = [];
        }

        submission.submittedAt = new Date();
        // Mark as submitted (or keep resubmitted status if this is a resubmission)
        submission.status = submission.status === 'resubmitted' ? 'resubmitted' : 'submitted';

        // Calculate if late
        await submission.calculateLateness();

        await submission.save();

        // Update assignment stats
        assignment.totalSubmissions += 1;
        await assignment.save();

        res.status(201).json({
            success: true,
            message: 'Assignment submitted successfully',
            data: submission
        });

    } catch (error) {
        console.error('Error submitting assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit assignment',
            error: error.message
        });
    }
};

/**
 * Get student submissions
 * GET /api/v1/submissions/my-submissions
 */
exports.getStudentSubmissions = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { courseId } = req.query;

        const submissions = await Submission.getStudentSubmissions(studentId, courseId);

        res.status(200).json({
            success: true,
            count: submissions.length,
            data: submissions
        });

    } catch (error) {
        console.error('Error getting submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get submissions',
            error: error.message
        });
    }
};

/**
 * Get assignment submissions (for instructor)
 * GET /api/v1/submissions/assignment/:assignmentId
 */
exports.getAssignmentSubmissions = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const submissions = await Submission.getAssignmentSubmissions(assignmentId);

        res.status(200).json({
            success: true,
            count: submissions.length,
            data: submissions
        });

    } catch (error) {
        console.error('Error getting assignment submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get submissions',
            error: error.message
        });
    }
};

/**
 * Grade submission
 * POST /api/v1/submissions/:submissionId/grade
 */
exports.gradeSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { grade, feedback, rubricScores } = req.body;
        const instructorId = req.user.id;

        const submission = await Submission.findById(submissionId);
        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        submission.grade = grade;
        submission.feedback = feedback || '';
        submission.rubricScores = rubricScores || [];
        submission.gradedBy = instructorId;
        submission.gradedAt = new Date();
        submission.status = 'graded';

        await submission.save();

        // Update assignment stats
        const assignment = await Assignment.findById(submission.assignment);
        if (assignment) {
            assignment.gradedSubmissions += 1;

            // Recalculate average grade
            const allGradedSubmissions = await Submission.find({
                assignment: assignment._id,
                status: 'graded'
            });

            const totalGrade = allGradedSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0);
            assignment.averageGrade = totalGrade / allGradedSubmissions.length;

            await assignment.save();
        }

        res.status(200).json({
            success: true,
            message: 'Submission graded successfully',
            data: submission
        });

    } catch (error) {
        console.error('Error grading submission:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to grade submission',
            error: error.message
        });
    }
};
