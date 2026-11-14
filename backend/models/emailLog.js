const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    status: { type: String, enum: ['SENT', 'FAILED', 'INVALID', 'BOUNCED'], required: true },
    error: { type: String, default: null },
    context: { type: String, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
    htmlContent: { type: String, default: null },
    textContent: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailLog', emailLogSchema);
