const Razorpay = require("razorpay");

// Only initialize Razorpay if credentials are provided
let instance = null;

if (process.env.RAZORPAY_KEY && process.env.RAZORPAY_SECRET) {
    try {
        instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY,
            key_secret: process.env.RAZORPAY_SECRET,
        });
    } catch (error) {
        console.error("❌ Failed to initialize Razorpay:", error.message);
        instance = null;
    }
} else {
    console.warn("⚠️  Razorpay credentials not found. Payment features will be disabled.");
}

module.exports = {
    instance
};
