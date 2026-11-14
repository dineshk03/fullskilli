const mailSender = require('./utils/mailSender');
require('dotenv').config();

async function testEmail() {
    try {
        console.log('Testing email configuration...');
        console.log('MAIL_HOST:', process.env.MAIL_HOST);
        console.log('MAIL_USER:', process.env.MAIL_USER);
        console.log('MAIL_PASS:', process.env.MAIL_PASS ? 'Set' : 'Not set');
        
        const testEmail = 'test@example.com';
        const testSubject = 'Test Email from LMS';
        const testBody = `
            <h1>Test Email</h1>
            <p>This is a test email to verify the email configuration.</p>
            <p>If you receive this, the email service is working correctly.</p>
        `;
        
        const result = await mailSender(testEmail, testSubject, testBody);
        console.log('Email sent successfully:', result);
        
    } catch (error) {
        console.error('Email test failed:', error.message);
        console.error('Full error:', error);
    }
}

testEmail();
