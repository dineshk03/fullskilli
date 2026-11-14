const mongoose = require('mongoose');

// A gateway order can fund several course allocations, but can be claimed once.
const schema = new mongoose.Schema({
    gatewayOrderId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    items: [{ course: mongoose.Schema.Types.ObjectId, price: Number }],
    amount: { type: Number, required: true },
    discount: { type: Number, required: true },
    couponCode: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'review'], default: 'pending' },
    paymentId: String
}, { timestamps: true });

module.exports = mongoose.models.Checkout || mongoose.model('Checkout', schema);
