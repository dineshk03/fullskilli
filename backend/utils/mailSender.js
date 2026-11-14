const nodemailer = require('nodemailer');
const path = require('path');
const EmailLog = require('../models/emailLog');
const { validateEmail } = require('./emailValidator');

const mailSender = async (email, title, body, additionalAttachments = [], context = null) => {
    try {
        // Step 1: Validate email format and domain
        console.log(`🔍 Validating email: ${email}`);
        const validation = await validateEmail(email, {
            checkDNS: true, // Check if domain can receive emails
            allowDisposable: true // Allow disposable emails for now
        });

        if (!validation.isValid) {
            const errorMessage = validation.errors.join(', ');
            const suggestionMessage = validation.suggestedEmail
                ? ` Suggested: ${validation.suggestedEmail}`
                : '';

            console.error(`❌ Email validation failed for ${email}: ${errorMessage}${suggestionMessage}`);

            // Log invalid email to database
            try {
                await EmailLog.create({
                    email,
                    subject: title,
                    status: 'INVALID',
                    error: `${errorMessage}${suggestionMessage}`,
                    context: context,
                    meta: {
                        validationResult: validation,
                        timestamp: new Date()
                    },
                    htmlContent: body,
                    textContent: body.replace(/<[^>]*>/g, '')
                });
            } catch (logError) {
                console.error('Failed to save invalid email log:', logError.message);
            }

            // Throw error to prevent sending
            throw new Error(`Invalid email address: ${errorMessage}${suggestionMessage}`);
        }

        // Log warnings if any
        if (validation.warnings && validation.warnings.length > 0) {
            console.warn(`⚠️ Email validation warnings for ${email}:`, validation.warnings);
        }

        console.log(`✅ Email validation passed for: ${email}`);

        // Step 2: Check mail configuration
        if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
            throw new Error('Mail configuration is missing. Please check environment variables.');
        }

        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT || 587,
            secure: false, // Use TLS on 587
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            },
            tls: {
                rejectUnauthorized: false, // Accept all certificates
                minVersion: 'TLSv1'  // Allow older TLS versions
            }
        });

        // Base attachments (logo)
        const baseAttachments = [
            {
                filename: 'beeja-logo.png',
                path: path.join(__dirname, '../public/images/Beeja innovative ventures.png'),
                cid: 'beeja-logo'
            }
        ];

        // Combine base attachments with additional attachments
        const allAttachments = [...baseAttachments, ...additionalAttachments];

        const info = await transporter.sendMail({
            from: `"Beeja Innovative Learning" <${process.env.MAIL_USER}>`,
            to: email,
            subject: title,
            html: body,
            attachments: allAttachments
        });

        console.log('Email sent successfully to:', email, {
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected,
            response: info.response
        });

        // Persist success log
        try {
            await EmailLog.create({
                email,
                subject: title,
                status: 'SENT',
                error: null,
                context: context,
                meta: {
                    messageId: info.messageId,
                    accepted: info.accepted,
                    rejected: info.rejected,
                    response: info.response,
                    validationPassed: true
                },
                htmlContent: body,
                textContent: body.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
            });
        } catch (logError) {
            console.error('Failed to save email success log:', logError.message);
        }

        return info;
    }
    catch (error) {
        console.error('Error while sending mail:', {
            email,
            error: error.message,
            stack: error.stack
        });

        // Persist failure log (only if not already logged as INVALID)
        if (!error.message.includes('Invalid email address')) {
            try {
                await EmailLog.create({
                    email,
                    subject: title,
                    status: 'FAILED',
                    error: error.message,
                    context: context,
                    meta: null,
                    htmlContent: body,
                    textContent: body.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
                });
            } catch (logError) {
                console.error('Failed to save email failure log:', logError.message);
            }
        }
        throw error; // Propagate error to handle it in the calling function
    }
}

module.exports = mailSender;