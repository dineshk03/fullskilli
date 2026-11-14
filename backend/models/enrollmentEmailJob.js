const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    status: { type: String, enum: ['pending', 'processing', 'sent', 'failed'], default: 'pending' },
    attempts: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: Date.now },
    lockedUntil: Date,
    leaseToken: String,
    sentAt: Date
}, { timestamps: true });
schema.index({ status: 1, nextAttemptAt: 1 });
module.exports = mongoose.models.EnrollmentEmailJob || mongoose.model('EnrollmentEmailJob', schema);
