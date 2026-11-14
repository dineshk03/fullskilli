const express = require('express');
const router = express.Router();
const { loginByPID } = require('../controllers/auth');
const { authLimiter } = require('../middleware/rateLimiter');
router.use(authLimiter);

// Route for PID-based login from Skilli Jobs
router.post('/pid-login', loginByPID);

// Frontend route for PID login (handles GET requests from browser)
router.get('/pid-login', async (req, res) => {
    try {
        const { pid, token, redirect } = req.query;
        
        if (!pid || !token) {
            return res.status(400).json({
                success: false,
                message: 'Invalid login link. Missing PID or token.',
                redirectUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
            });
        }

        // Call the loginByPID function
        const mockReq = { body: { pid, token } };
        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    if (code === 200 && data.success) {
                        // Set cookie and redirect to frontend
                        res.cookie('token', data.token, {
                            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'lax'
                        });
                        
                        const redirectUrl = typeof redirect === 'string' && /^\/(?![\/\\])/.test(redirect) ? redirect : '/courses';
                        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                        return res.redirect(`${frontendUrl}${redirectUrl}?login=success`);
                    } else {
                        return res.status(code).json({
                            success: false,
                            message: data.message || 'Login failed',
                            redirectUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
                        });
                    }
                }
            }),
            cookie: (name, value, options) => {
                res.cookie(name, value, options);
            }
        };

        await loginByPID(mockReq, mockRes);

    } catch (error) {
        console.error('Error in PID login route:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login',
            redirectUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
        });
    }
});

module.exports = router;
