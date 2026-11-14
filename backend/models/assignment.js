const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    instructions: {
        type: String,
        default: ''
    },

    // Course Association
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true
    },
    section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section'
    },
    subSection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubSection'
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Assignment Details
    totalPoints: {
        type: Number,
        required: true,
        default: 100
    },
    passingPoints: {
        type: Number,
        default: 60
    },

    // Deadlines
    startDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: true
    },
    lateSubmissionAllowed: {
        type: Boolean,
        default: true
    },
    lateDeadline: {
        type: Date
    },
    latePenalty: {
        type: Number,
        default: 10, // percentage
        min: 0,
        max: 100
    },

    // Submission Settings
    submissionType: {
        type: String,
        enum: ['file', 'text', 'link', 'both'],
        default: 'file'
    },
    allowedFileTypes: {
        type: [String],
        default: ['pdf', 'doc', 'docx', 'txt', 'zip', 'jpg', 'png']
    },
    maxFileSize: {
        type: Number,
        default: 10 // MB
    },
    maxFiles: {
        type: Number,
        default: 5
    },
    allowResubmission: {
        type: Boolean,
        default: true
    },
    maxResubmissions: {
        type: Number,
        default: 3
    },

    // Materials
    attachments: [{
        fileName: String,
        fileUrl: String,
        fileSize: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Settings
    published: {
        type: Boolean,
        default: false,
        index: true
    },
    gradingType: {
        type: String,
        enum: ['points', 'percentage', 'pass-fail', 'rubric'],
        default: 'points'
    },
    rubric: [{
        criterion: String,
        points: Number,
        description: String
    }],

    // Analytics
    totalSubmissions: {
        type: Number,
        default: 0
    },
    gradedSubmissions: {
        type: Number,
        default: 0
    },
    averageGrade: {
        type: Number,
        default: 0
    },

    // Email Notification
    emailSent: {
        type: Boolean,
        default: false
    },
    emailSentAt: Date,

    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for efficient queries
assignmentSchema.index({ course: 1, published: 1 });
assignmentSchema.index({ instructor: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ createdAt: -1 });

// Update timestamp on save
assignmentSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Static method to get course assignments
assignmentSchema.statics.getCourseAssignments = async function (courseId, published = true) {
    return this.find({
        course: courseId,
        ...(published && { published: true })
    })
        .populate('instructor', 'firstName lastName email')
        .sort({ dueDate: 1 });
};

// Static method to get instructor assignments
assignmentSchema.statics.getInstructorAssignments = async function (instructorId) {
    return this.find({ instructor: instructorId })
        .populate('course', 'courseName')
        .sort({ createdAt: -1 });
};

// Instance method to check if overdue
assignmentSchema.methods.isOverdue = function () {
    return new Date() > this.dueDate;
};

// Instance method to check if accepting submissions
assignmentSchema.methods.isAcceptingSubmissions = function () {
    const now = new Date();
    if (now < this.startDate) return false;
    if (now > this.dueDate && !this.lateSubmissionAllowed) return false;
    if (this.lateSubmissionAllowed && this.lateDeadline && now > this.lateDeadline) return false;
    return true;
};

module.exports = mongoose.model('Assignment', assignmentSchema);
