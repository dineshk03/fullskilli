const mongoose = require('mongoose');

const subSectionSchema = new mongoose.Schema({
    title: {
        type: String
    },
    timeDuration: {
        type: Number,
        default: 0
    },
    description: {
        type: String
    },
    videoUrl: {
        type: String
    },
    pdfUrl: {
        type: String
    },
    pptUrl: {
        type: String
    },
    pptPdfUrl: {
        type: String  // Converted PDF from PowerPoint
    },
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz'
    },
    section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section'
    },
    zoomMeeting: {
        type: mongoose.Schema.Types.Mixed,
        default: undefined
    },
    // Keep the old schema for validation when zoomMeeting is explicitly set
    _zoomMeetingTemplate: {
        meetingId: {
            type: String
        },
        meetingNumber: {
            type: String
        },
        hostId: {
            type: String
        },
        topic: {
            type: String
        },
        agenda: {
            type: String
        },
        startTime: {
            type: Date
        },
        endTime: {
            type: Date
        },
        actualDuration: {
            type: Number // actual duration in minutes
        },
        duration: {
            type: Number // planned duration in minutes
        },
        timezone: {
            type: String
        },
        joinUrl: {
            type: String
        },
        startUrl: {
            type: String
        },
        password: {
            type: String
        },
        status: {
            type: String,
            enum: ['scheduled', 'started', 'ended', 'cancelled']
        },
        participants: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            email: {
                type: String
            },
            name: {
                type: String
            },
            joinTime: {
                type: Date
            },
            leaveTime: {
                type: Date
            },
            duration: {
                type: Number // participation duration in minutes
            },
            status: {
                type: String,
                enum: ['attended', 'left-early', 'no-show']
            }
        }],
        totalParticipants: {
            type: Number
        },
        maxParticipants: {
            type: Number
        },
        recordingUrl: {
            type: String
        },
        createdAt: {
            type: Date
        },
        reminderSent: {
            type: Boolean
        },
        lastReminderSent: {
            type: Date
        }
    }

});

module.exports = mongoose.model('SubSection', subSectionSchema) 
