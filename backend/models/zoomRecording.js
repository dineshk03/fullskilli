const mongoose = require('mongoose');

const zoomRecordingSchema = new mongoose.Schema({
  meetingId: {
    type: String,
    required: true,
    ref: 'SubSection'
  },
  recordingId: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  playUrl: {
    type: String,
    required: true
  },
  downloadUrl: {
    type: String,
    required: true
  },
  recordingType: {
    type: String,
    enum: ['shared_screen_with_speaker_view', 'speaker_view', 'gallery_view', 'shared_screen', 'audio_only'],
    default: 'shared_screen_with_speaker_view'
  },
  password: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed', 'deleted'],
    default: 'processing'
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  subSection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubSection',
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shareSettings: {
    allowStudents: {
      type: Boolean,
      default: true
    },
    requirePassword: {
      type: Boolean,
      default: false
    },
    expiryDate: {
      type: Date
    },
    downloadEnabled: {
      type: Boolean,
      default: true
    }
  },
  viewingStats: {
    totalViews: {
      type: Number,
      default: 0
    },
    uniqueViewers: [{
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      viewCount: {
        type: Number,
        default: 1
      },
      lastViewed: {
        type: Date,
        default: Date.now
      },
      watchDuration: {
        type: Number,
        default: 0
      }
    }],
    averageWatchTime: {
      type: Number,
      default: 0
    }
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

// Index for efficient queries
zoomRecordingSchema.index({ meetingId: 1 });
zoomRecordingSchema.index({ course: 1 });
zoomRecordingSchema.index({ subSection: 1 });
zoomRecordingSchema.index({ instructor: 1 });
zoomRecordingSchema.index({ status: 1 });
zoomRecordingSchema.index({ createdAt: -1 });

// Update the updatedAt field before saving
zoomRecordingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find recordings by course
zoomRecordingSchema.statics.findByCourse = function(courseId) {
  return this.find({ 
    course: courseId, 
    status: 'completed' 
  }).populate('instructor', 'firstName lastName email')
    .populate('subSection', 'title')
    .sort({ startTime: -1 });
};

// Static method to find recordings by instructor
zoomRecordingSchema.statics.findByInstructor = function(instructorId) {
  return this.find({ 
    instructor: instructorId, 
    status: 'completed' 
  }).populate('course', 'courseName')
    .populate('subSection', 'title')
    .sort({ startTime: -1 });
};

// Instance method to record a view
zoomRecordingSchema.methods.recordView = function(studentId, watchDuration = 0) {
  const existingViewer = this.viewingStats.uniqueViewers.find(
    viewer => viewer.student.toString() === studentId.toString()
  );

  if (existingViewer) {
    existingViewer.viewCount += 1;
    existingViewer.lastViewed = new Date();
    existingViewer.watchDuration += watchDuration;
  } else {
    this.viewingStats.uniqueViewers.push({
      student: studentId,
      viewCount: 1,
      lastViewed: new Date(),
      watchDuration: watchDuration
    });
  }

  this.viewingStats.totalViews += 1;
  
  // Calculate average watch time
  const totalWatchTime = this.viewingStats.uniqueViewers.reduce(
    (sum, viewer) => sum + viewer.watchDuration, 0
  );
  this.viewingStats.averageWatchTime = totalWatchTime / this.viewingStats.uniqueViewers.length;

  return this.save();
};

// Instance method to check if student can access recording
zoomRecordingSchema.methods.canStudentAccess = function(studentId, courseId) {
  // Check if sharing is allowed for students
  if (!this.shareSettings.allowStudents) {
    return false;
  }

  // Check if recording has expired
  if (this.shareSettings.expiryDate && new Date() > this.shareSettings.expiryDate) {
    return false;
  }

  // Check if student is enrolled in the course
  // This would need to be implemented based on your enrollment logic
  return true;
};

// Virtual for formatted file size
zoomRecordingSchema.virtual('formattedFileSize').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for formatted duration
zoomRecordingSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
});

module.exports = mongoose.model('ZoomRecording', zoomRecordingSchema);
