const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    invoiceNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    amount: {
        type: Number,
        required: true
    },
    originalPrice: {
        type: Number,
        default: 0
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    couponUsed: {
        code: {
            type: String,
            default: null
        },
        discountType: {
            type: String,
            enum: {
                values: ['percentage', 'flat'],
                message: 'discountType must be either percentage or flat'
            },
            required: false,
            default: undefined
        },
        discountValue: {
            type: Number,
            default: 0
        },
        discountAmount: {
            type: Number,
            default: 0
        }
    },
    status: {
        type: Boolean,
        default: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    transactionId: {
        type: String,
        required: true
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    adminAssigned: {
        type: Boolean,
        default: false
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
}, { timestamps: true });

// Generate invoice number before saving
orderSchema.pre('save', async function(next) {
    if (!this.invoiceNumber && this.isNew) {
        const date = new Date(this.purchaseDate || Date.now());
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        
        const Counter = require('./counter');
        const counterId = 'invoice-' + year + month;
        const lastOrder = await this.constructor.findOne({ invoiceNumber: new RegExp('^INV-' + year + month + '-') }).sort({ invoiceNumber: -1 });
        const lastSequence = lastOrder ? Number(lastOrder.invoiceNumber.split('-')[2]) || 0 : 0;
        try { await Counter.updateOne({ _id: counterId }, { $setOnInsert: { value: lastSequence } }, { upsert: true }); }
        catch (error) { if (error.code !== 11000) throw error; }
        const counter = await Counter.findByIdAndUpdate(counterId, { $inc: { value: 1 } }, { new: true });
        const sequence = counter.value;

        // Format: INV-YYYYMM-XXXX (e.g., INV-202410-0001)
        this.invoiceNumber = `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;
    }
    next();
});

module.exports = mongoose.model("Order", orderSchema);
