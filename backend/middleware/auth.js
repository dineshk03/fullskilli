// AUTH , IS STUDENT , IS INSTRUCTOR , IS ADMIN

const jwt = require("jsonwebtoken");
const TokenBlacklist = require('../models/tokenBlacklist');
require('dotenv').config();


// ================ AUTH ================
// user Authentication by checking token validating
exports.auth = async (req, res, next) => {
    let token = req.header('Authorization')?.replace(/^Bearer\s+/i, '') || req.cookies?.token || req.body?.token;
    if (typeof token === 'string') token = token.trim().replace(/^["']|["']$/g, '');
    if (!token || token === 'null' || token === 'undefined') return res.status(401).json({ success: false, message: 'Token is Missing' });
    if (typeof token !== 'string' || token.split('.').length !== 3) return res.status(401).json({ success: false, message: 'Invalid token format' });
    let decoded;
    try { decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ success: false, message: 'Token expired or invalid. Please login again.', reason: 'TOKEN_EXPIRED' }); }
    if (!decoded.id) return res.status(401).json({ success: false, message: 'Invalid token format' });
    try {
        const User = require('../models/user');
        const [revoked, deactivated, user] = await Promise.all([
            TokenBlacklist.findOne({ token }),
            TokenBlacklist.findOne({ token: 'USER_' + decoded.id + '_ALL_TOKENS' }),
            User.findById(decoded.id)
        ]);
        if (revoked) return res.status(401).json({ success: false, message: 'Token has been invalidated. Please login again.', reason: 'TOKEN_BLACKLISTED' });
        if (!user) return res.status(401).json({ success: false, message: 'User account not found. Please login again.', reason: 'USER_NOT_FOUND' });
        if (deactivated || !user.active) return res.status(401).json({ success: false, message: 'Your account has been deactivated. Please contact support.', reason: 'USER_DEACTIVATED' });
        req.user = { ...decoded, accountType: user.accountType };
        next();
    } catch { return res.status(503).json({ success: false, message: 'Authentication service unavailable' }); }
};

// ================ IS STUDENT ================
exports.isStudent = (req, res, next) => {
    try {
        // console.log('User data -> ', req.user)
        if (req.user?.accountType != 'Student') {
            return res.status(401).json({
                success: false,
                messgae: 'This Page is protected only for student'
            })
        }
        // go to next middleware
        next();
    }
    catch (error) {
        console.log('Error while cheching user validity with student accountType');
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            messgae: 'Error while cheching user validity with student accountType'
        })
    }
}


// ================ IS INSTRUCTOR ================
exports.isInstructor = (req, res, next) => {
    try {
        console.log('=== IS INSTRUCTOR MIDDLEWARE START ===');
        console.log('Checking instructor status for request:', req.method, req.url);
        
        if (!req.user) {
            console.log('❌ No user object found in request');
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Allow both Instructors and Admins
        if (req.user?.accountType !== 'Instructor' && req.user?.accountType !== 'Admin') {
            console.log('❌ User is not instructor or admin:', req.user.accountType);
            return res.status(401).json({
                success: false,
                message: 'This page is protected for Instructors and Admins only',
                currentRole: req.user.accountType
            })
        }
        
        console.log('✅ User verified as Instructor/Admin:', req.user.accountType);
        // go to next middleware
        next();
    }
    catch (error) {
        console.log('❌ Error in isInstructor middleware:', error.message);
        console.log('Error stack:', error.stack);
        console.log('Request user at time of error:', req.user);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while checking user validity with Instructor/Admin accountType'
        })
    }
}


// ================ IS ADMIN ================
exports.isAdmin = (req, res, next) => {
    try {
        console.log('=== IS ADMIN MIDDLEWARE START ===');
        console.log('Checking admin status for request:', req.method, req.url);
        
        if (!req.user) {
            console.log('❌ No user object found in request');
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        if (req.user.accountType !== 'Admin') {
            console.log('❌ User is not admin:', req.user.accountType);
            return res.status(401).json({
                success: false,
                message: 'This page is protected for Admin only',
                currentRole: req.user.accountType
            });
        }

        console.log('✅ User verified as Admin');
        // go to next middleware
        next();
    }
    catch (error) {
        console.log('❌ Error in isAdmin middleware:', error.message);
        console.log('Error stack:', error.stack);
        console.log('Request user at time of error:', req.user);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while checking admin status'
        });
    }
}
