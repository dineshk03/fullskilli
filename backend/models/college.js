const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 180 },
  normalizedName: { type: String, required: true, unique: true, index: true },
  details: { type: String, default: '', maxlength: 300 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.models.College || mongoose.model('College', collegeSchema);
