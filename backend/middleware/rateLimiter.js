const rateLimit = require('express-rate-limit');

// Create a limiter for coupon validation
const couponValidationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
        success: false,
        message: 'Too many coupon validation attempts. Please try again later.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = {
    couponValidationLimiter,
    authLimiter: rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false,
        message: { success: false, message: 'Too many authentication attempts. Please try again later.' } }),
    emailLimiter: rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false,
        message: { success: false, message: 'Too many email requests. Please try again later.' } })
};
