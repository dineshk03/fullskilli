const mongoose = require('mongoose');

const certificateTemplateSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'collaboration' },
  courseName: { type: String, default: '' },
  categoryName: { type: String, default: '' },
  design: { type: String, enum: ['classic', 'collaboration'], default: 'collaboration' },
  designData: {
    ...require('../utils/certificateAppearance').appearanceSchema,
    academyName: String, collegeName: String, department: String,
    hours: Number, academicYear: String, collegeDetails: String,
    academyLogoUrl: String, collegeLogoUrl: String, thirdLogoUrl: String,
    principalSignatureUrl: String, directorSignatureUrl: String,
    principalName: String, principalTitle: String,
    directorName: String, directorTitle: String,
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('CertificateTemplate', certificateTemplateSchema);
