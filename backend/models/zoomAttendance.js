const mongoose = require('mongoose');

const zoomAttendanceSchema = new mongoose.Schema({
  meetingId: {
    type: String,
    required: true,
    ref: 'SubSection'
  },
  participantId: {
    type: String,
    required: true
  },
  participantEmail: {
    type: String,
    required: true
  },
  participantName: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  joinTime: {
    type: Date,
    required: true
  },
  leaveTime: {
    type: Date
  },
  duration: {
    type: Number, // Duration in minutes
    default: 0
  },
  status: {
    type: String,
    enum: ['joined', 'left', 'completed'],
    default: 'joined'
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  subSection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubSection'
  }
}, {
  timestamps: true
});

// Index for efficient queries
zoomAttendanceSchema.index({ meetingId: 1, participantEmail: 1 });
zoomAttendanceSchema.index({ course: 1, participantEmail: 1 });
zoomAttendanceSchema.index({ joinTime: 1 });

module.exports = mongoose.model('ZoomAttendance', zoomAttendanceSchema);
