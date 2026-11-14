const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ['course', 'manual'],
    default: 'course',
  },
  batchId: { type: String, index: true },
  design: { type: String, enum: ['classic', 'collaboration'], default: 'classic' },
  designData: {
    ...require('../utils/certificateAppearance').appearanceSchema,
    academyName: String, collegeName: String, department: String,
    hours: Number, academicYear: String, collegeDetails: String,
    academyLogoUrl: String, collegeLogoUrl: String, thirdLogoUrl: String,
    principalSignatureUrl: String, directorSignatureUrl: String,
    principalName: String, principalTitle: String,
    directorName: String, directorTitle: String,
  },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', index: true },
  certificateId: {
    type: String,
    required: true,
    unique: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: function () { return this.source !== 'manual'; },
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function () { return this.source !== 'manual'; },
  },
  courseName: {
    type: String,
    required: true,
  },
  categoryName: {
    type: String,
    default: 'General',
  },
  studentName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: function () { return this.source !== 'manual'; },
    default: '',
  },
  completionDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  issuedDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  isActive: { type: Boolean, default: true, index: true },
  disabledAt: Date,
  disabledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

certificateSchema.index({ source: 1, issuedDate: -1 });
certificateSchema.index({ source: 1, design: 1, issuedDate: -1 });

module.exports = mongoose.model("Certificate", certificateSchema);
