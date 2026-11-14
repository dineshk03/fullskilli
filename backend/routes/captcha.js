const express = require('express');
const router = express.Router();
const svgCaptcha = require('svg-captcha');

// Generate and return captcha
router.get('/refresh-captcha', (req, res) => {
    try {
        // Generate captcha
        const captcha = svgCaptcha.create({
            size: 6, // Number of characters
            noise: 2, // Noise lines
            color: true, // Use color
            background: '#f0f0f0', // Background color
            fontSize: 50,
            width: 150,
            height: 60,
        });

        // Store captcha text in session
        req.session.captcha = captcha.text.toLowerCase();

        // Send captcha SVG to frontend
        res.status(200).json({
            success: true,
            captcha: captcha.data, // SVG image
        });
    } catch (error) {
        console.error('Error generating captcha:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate captcha',
        });
    }
});

// Verify captcha (can be used by login endpoint)
router.post('/verify-captcha', (req, res) => {
    try {
        const { captcha } = req.body;
        const sessionCaptcha = req.session.captcha;

        if (!sessionCaptcha) {
            return res.status(400).json({
                success: false,
                message: 'No captcha in session. Please refresh captcha.',
            });
        }

        if (captcha.toLowerCase() !== sessionCaptcha) {
            return res.status(400).json({
                success: false,
                message: 'Invalid captcha',
            });
        }

        // Clear captcha from session after verification
        delete req.session.captcha;

        res.status(200).json({
            success: true,
            message: 'Captcha verified successfully',
        });
    } catch (error) {
        console.error('Error verifying captcha:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify captcha',
        });
    }
});

module.exports = router;
