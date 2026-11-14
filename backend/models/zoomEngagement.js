const mongoose = require('mongoose');

const zoomEngagementSchema = new mongoose.Schema({
    meetingId: {
        type: String,
        required: true,
        index: true
    },
    subSection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubSection',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Attendance Metrics
    attendance: {
        joinTime: Date,
        leaveTime: Date,
        duration: Number, // in seconds
        status: {
            type: String,
            enum: ['attended', 'late', 'left-early', 'no-show', 'partial'],
            default: 'no-show'
        },
        lateBy: Number, // minutes late
        leftEarlyBy: Number // minutes before end
    },

    // Engagement Metrics
    engagement: {
        activeTime: {
            type: Number,
            default: 0 // seconds actively participating
        },
        chatMessages: {
            type: Number,
            default: 0
        },
        pollResponses: {
            type: Number,
            default: 0
        },
        questionsAsked: {
            type: Number,
            default: 0
        },
        handRaised: {
            type: Number,
            default: 0
        },
        reactionsUsed: {
            type: Number,
            default: 0
        },
        screenShareTime: {
            type: Number,
            default: 0 // seconds
        }
    },

    // Attention Tracking
    attention: {
        focusScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        distractionEvents: {
            type: Number,
            default: 0
        },
        tabSwitches: {
            type: Number,
            default: 0
        },
        cameraOnTime: {
            type: Number,
            default: 0 // seconds
        },
        micOnTime: {
            type: Number,
            default: 0 // seconds
        }
    },

    // Participation Score (calculated)
    participationScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },

    // Timeline of Events
    timeline: [{
        timestamp: {
            type: Date,
            default: Date.now
        },
        event: {
            type: String,
            enum: [
                'joined', 'left', 'camera_on', 'camera_off',
                'mic_on', 'mic_off', 'chat_message', 'poll_response',
                'hand_raised', 'hand_lowered', 'reaction', 'question_asked',
                'screen_share_start', 'screen_share_end', 'tab_switch'
            ]
        },
        details: mongoose.Schema.Types.Mixed
    }],

    // Device Information
    deviceInfo: {
        type: {
            type: String,
            enum: ['desktop', 'mobile', 'tablet', 'unknown'],
            default: 'unknown'
        },
        os: String,
        browser: String,
        connection: {
            type: String,
            enum: ['excellent', 'good', 'fair', 'poor'],
            default: 'good'
        }
    },

    // Feedback
    feedback: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        submittedAt: Date
    },

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
zoomEngagementSchema.index({ meetingId: 1, student: 1 }, { unique: true });
zoomEngagementSchema.index({ course: 1, student: 1 });
zoomEngagementSchema.index({ subSection: 1 });
zoomEngagementSchema.index({ 'attendance.status': 1 });
zoomEngagementSchema.index({ participationScore: -1 });
zoomEngagementSchema.index({ createdAt: -1 });

// Update timestamp on save
zoomEngagementSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Calculate participation score before saving
zoomEngagementSchema.pre('save', function (next) {
    const weights = {
        attendance: 30,
        engagement: 40,
        attention: 30
    };

    // Attendance score (0-100)
    let attendanceScore = 0;
    if (this.attendance.status === 'attended') attendanceScore = 100;
    else if (this.attendance.status === 'late') attendanceScore = 80;
    else if (this.attendance.status === 'left-early') attendanceScore = 70;
    else if (this.attendance.status === 'partial') attendanceScore = 50;

    // Engagement score (0-100)
    const engagementScore = Math.min(100,
        (this.engagement.chatMessages * 5) +
        (this.engagement.pollResponses * 10) +
        (this.engagement.questionsAsked * 15) +
        (this.engagement.handRaised * 5) +
        (this.engagement.reactionsUsed * 2)
    );

    // Attention score (0-100)
    const attentionScore = this.attention.focusScore;

    // Calculate weighted participation score
    this.participationScore = Math.round(
        (attendanceScore * weights.attendance / 100) +
        (engagementScore * weights.engagement / 100) +
        (attentionScore * weights.attention / 100)
    );

    next();
});

// Static method to get engagement stats for a meeting
zoomEngagementSchema.statics.getMeetingStats = async function (meetingId) {
    const stats = await this.aggregate([
        { $match: { meetingId } },
        {
            $group: {
                _id: null,
                totalStudents: { $sum: 1 },
                attended: {
                    $sum: {
                        $cond: [{ $eq: ['$attendance.status', 'attended'] }, 1, 0]
                    }
                },
                avgParticipation: { $avg: '$participationScore' },
                avgEngagement: { $avg: '$engagement.activeTime' },
                totalChatMessages: { $sum: '$engagement.chatMessages' },
                totalPollResponses: { $sum: '$engagement.pollResponses' },
                totalQuestions: { $sum: '$engagement.questionsAsked' }
            }
        }
    ]);

    return stats[0] || {
        totalStudents: 0,
        attended: 0,
        avgParticipation: 0,
        avgEngagement: 0,
        totalChatMessages: 0,
        totalPollResponses: 0,
        totalQuestions: 0
    };
};

// Static method to get student engagement across all meetings
zoomEngagementSchema.statics.getStudentEngagement = async function (studentId, courseId = null) {
    const match = { student: studentId };
    if (courseId) match.course = courseId;

    const stats = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalMeetings: { $sum: 1 },
                attended: {
                    $sum: {
                        $cond: [{ $in: ['$attendance.status', ['attended', 'late', 'left-early']] }, 1, 0]
                    }
                },
                avgParticipation: { $avg: '$participationScore' },
                totalActiveTime: { $sum: '$engagement.activeTime' },
                totalChatMessages: { $sum: '$engagement.chatMessages' },
                totalQuestions: { $sum: '$engagement.questionsAsked' }
            }
        }
    ]);

    return stats[0] || {
        totalMeetings: 0,
        attended: 0,
        avgParticipation: 0,
        totalActiveTime: 0,
        totalChatMessages: 0,
        totalQuestions: 0
    };
};

// Instance method to add timeline event
zoomEngagementSchema.methods.addEvent = function (event, details = {}) {
    this.timeline.push({
        timestamp: new Date(),
        event,
        details
    });

    // Update relevant metrics based on event
    switch (event) {
        case 'chat_message':
            this.engagement.chatMessages++;
            break;
        case 'poll_response':
            this.engagement.pollResponses++;
            break;
        case 'question_asked':
            this.engagement.questionsAsked++;
            break;
        case 'hand_raised':
            this.engagement.handRaised++;
            break;
        case 'reaction':
            this.engagement.reactionsUsed++;
            break;
        case 'tab_switch':
            this.attention.tabSwitches++;
            this.attention.distractionEvents++;
            break;
    }

    return this.save();
};

module.exports = mongoose.model('ZoomEngagement', zoomEngagementSchema);
