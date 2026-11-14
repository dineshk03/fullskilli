const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    expiresAt: { type: Date, required: true, expires: 0 }
});
module.exports = mongoose.models.EnrollmentLock || mongoose.model('EnrollmentLock', schema);
