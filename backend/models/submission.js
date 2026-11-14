const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true,
        index: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },

    // Submission Data
    submissionType: {
        type: String,
        enum: ['file', 'text', 'link', 'both'],
        required: true
    },
    textContent: {
        type: String,
        default: ''
    },
    linkUrl: {
        type: String,
        default: ''
    },
    files: [{
        fileName: String,
        fileUrl: String,
        fileSize: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Status
    status: {
        type: String,
        enum: ['draft', 'submitted', 'graded', 'returned', 'resubmitted'],
        default: 'draft',
        index: true
    },
    submittedAt: Date,
    isLate: {
        type: Boolean,
        default: false
    },
    lateDays: {
        type: Number,
        default: 0
    },

    // Grading
    grade: {
        type: Number,
        min: 0
    },
    gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    gradedAt: Date,
    feedback: {
        type: String,
        default: ''
    },
    feedbackFiles: [{
        fileName: String,
        fileUrl: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    rubricScores: [{
        criterion: String,
        score: Number,
        comment: String
    }],

    // Resubmission
    attemptNumber: {
        type: Number,
        default: 1
    },
    previousSubmissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Submission'
    }],

    // Plagiarism (for future implementation)
    plagiarismScore: {
        type: Number,
        min: 0,
        max: 100
    },
    plagiarismReport: String,

    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound indexes
submissionSchema.index({ assignment: 1, student: 1 });
submissionSchema.index({ course: 1, status: 1 });
submissionSchema.index({ student: 1, status: 1 });
submissionSchema.index({ submittedAt: -1 });

// Update timestamp on save
submissionSchema.pre('save', function (next) {
    this.updatedAt = new Date();

    // Set submittedAt when status changes to submitted
    if (this.isModified('status') && this.status === 'submitted' && !this.submittedAt) {
        this.submittedAt = new Date();
    }

    next();
});

// Static method to get student submissions
submissionSchema.statics.getStudentSubmissions = async function (studentId, courseId = null) {
    const query = { student: studentId };
    if (courseId) query.course = courseId;

    return this.find(query)
        .populate('assignment', 'title dueDate totalPoints')
        .populate('course', 'courseName')
        .sort({ submittedAt: -1 });
};

// Static method to get assignment submissions
submissionSchema.statics.getAssignmentSubmissions = async function (assignmentId) {
    return this.find({ assignment: assignmentId })
        .populate('student', 'firstName lastName email image')
        .sort({ submittedAt: -1 });
};

// Instance method to calculate if late
submissionSchema.methods.calculateLateness = async function () {
    const Assignment = mongoose.model('Assignment');
    const assignment = await Assignment.findById(this.assignment);

    if (!assignment || !this.submittedAt) return;

    if (this.submittedAt > assignment.dueDate) {
        this.isLate = true;
        const diffTime = Math.abs(this.submittedAt - assignment.dueDate);
        this.lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else {
        this.isLate = false;
        this.lateDays = 0;
    }
};

// Instance method to check if passed
submissionSchema.methods.isPassed = async function () {
    if (!this.grade) return false;

    const Assignment = mongoose.model('Assignment');
    const assignment = await Assignment.findById(this.assignment);

    if (!assignment) return false;

    return this.grade >= assignment.passingPoints;
};

module.exports = mongoose.model('Submission', submissionSchema);
