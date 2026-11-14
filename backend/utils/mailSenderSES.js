const AWS = require('aws-sdk');
const path = require('path');

// Configure AWS SES
const ses = new AWS.SES({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-south-1'
});

const mailSenderSES = async (email, title, body, additionalAttachments = []) => {
    try {
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            throw new Error('AWS SES configuration is missing. Please check environment variables.');
        }

        // For SES, we need to handle attachments differently
        // This is a basic implementation without attachments
        const params = {
            Destination: {
                ToAddresses: [email]
            },
            Message: {
                Body: {
                    Html: {
                        Charset: 'UTF-8',
                        Data: body
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: title
                }
            },
            Source: 'beejatest@gmail.com', // Must be verified in SES
            ReplyToAddresses: ['beejatest@gmail.com']
        };

        const result = await ses.sendEmail(params).promise();
        console.log('Email sent successfully via SES to:', email);
        console.log('Message ID:', result.MessageId);
        return result;
    }
    catch (error) {
        console.error('Error while sending mail via SES:', {
            email,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

module.exports = mailSenderSES;
