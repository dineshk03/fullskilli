const express = require('express');
const router = express.Router();

// Controllers
const {
    signup,
    login,
    sendOTP,
    changePassword,
    googleLogin,
    verifyGoogleOTP,
    linkedinLogin,
    facebookLogin,
    externalSSOLogin,
    loginByPID,
    checkUserByPID,
    ssoLogout
} = require('../controllers/auth');

// Resetpassword controllers
const {
    resetPasswordToken,
    resetPassword,
    verifyResetToken,
} = require('../controllers/resetPassword');

// Coupon controllers
const {
    validateAndApplyCoupon,
    getFrontendCoupons
} = require('../controllers/coupon');

// Middleware
const { auth } = require('../middleware/auth');
const { couponValidationLimiter, authLimiter, emailLimiter } = require('../middleware/rateLimiter');


// Routes for Login, Signup, and Authentication

// ********************************************************************************************************
//                                      Authentication routes
// ********************************************************************************************************

// Route for user signup
router.post('/signup', authLimiter, signup);

// Route for user registration (alias for signup)
router.post('/register', authLimiter, signup);

// Route for user login
router.post('/login', authLimiter, login);

// Route for Google OAuth login
router.post('/google-login', authLimiter, googleLogin);

// Route for verifying Google login OTP
router.post('/verify-google-otp', authLimiter, verifyGoogleOTP);

// Route for LinkedIn OAuth login
router.post('/linkedin-login', authLimiter, linkedinLogin);

// Route for Facebook OAuth login
router.post('/facebook-login', authLimiter, facebookLogin);

// Route for External SSO login (PHP website integration)
router.post('/external-sso-login', authLimiter, externalSSOLogin);

// Route for login by PID (PHP Portal Upskill button)
router.post('/login-by-pid', authLimiter, loginByPID);

// Route for checking user by PID (PHP Portal User Check)
router.get('/check-user-by-pid', checkUserByPID);

// Route for sending OTP to the user's email
router.post('/sendotp', emailLimiter, sendOTP);

// Route for Changing the password
router.post('/changepassword', auth, changePassword);

// Route for verifying token (used by auth checker)
router.get('/verify-token', auth, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Token is valid',
    user: req.user
  });
});

// ********************************************************************************************************
//                                      Coupon Routes (User accessible)
// ********************************************************************************************************

// Route for validating and applying coupons (requires authentication)
router.post('/coupons/validate-and-apply', auth, couponValidationLimiter, validateAndApplyCoupon);

// Route for getting frontend coupons (public endpoint)
router.get('/coupons/frontend', getFrontendCoupons);

// ********************************************************************************************************
//                                      Reset Password
// ********************************************************************************************************

// Route for generating a reset password token
router.post('/reset-password-token', emailLimiter, resetPasswordToken);

// Route for resetting user's password after verification
router.post("/reset-password", authLimiter, resetPassword)

// Route for verifying reset token
router.get("/verify-reset-token/:token", verifyResetToken)

// ********************************************************************************************************
//                                      SSO Integration
// ********************************************************************************************************

// Route for SSO logout (Skilli Jobs integration)
router.post('/sso-logout', auth, (req, res, next) => {
    const User = require('../models/user');
    User.findById(req.user.id).then(user => {
        if (!user?.pid || String(user.pid) !== String(req.body.pid)) return res.status(403).json({ success: false, message: 'Access denied' });
        next();
    }).catch(next);
}, ssoLogout);

module.exports = router
