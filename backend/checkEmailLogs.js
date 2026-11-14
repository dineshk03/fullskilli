/**
 * Check Recent Email Logs
 * Quick script to view recent email logs and their statuses
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EmailLog = require('./models/emailLog');

async function checkRecentEmails() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('✅ Connected to MongoDB\n');

        // Get recent email logs
        const recentLogs = await EmailLog.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .select('email subject status error createdAt context');

        console.log('📧 RECENT EMAIL LOGS (Last 20)');
        console.log('='.repeat(100));
        console.log('');

        if (recentLogs.length === 0) {
            console.log('No email logs found.');
        } else {
            recentLogs.forEach((log, index) => {
                const statusIcon = {
                    'SENT': '✅',
                    'INVALID': '⚠️',
                    'FAILED': '❌',
                    'BOUNCED': '📧'
                }[log.status] || '❓';

                console.log(`${index + 1}. ${statusIcon} ${log.status.padEnd(10)} | ${log.email}`);
                console.log(`   Subject: ${log.subject}`);
                console.log(`   Context: ${log.context || 'N/A'}`);
                if (log.error) {
                    console.log(`   Error: ${log.error}`);
                }
                console.log(`   Time: ${log.createdAt.toLocaleString()}`);
                console.log('');
            });
        }

        // Get statistics
        const stats = await EmailLog.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        console.log('='.repeat(100));
        console.log('📊 EMAIL STATISTICS');
        console.log('='.repeat(100));
        console.log('');

        const statusMap = {
            'SENT': '✅ Sent',
            'INVALID': '⚠️  Invalid',
            'FAILED': '❌ Failed',
            'BOUNCED': '📧 Bounced'
        };

        stats.forEach(stat => {
            const label = statusMap[stat._id] || stat._id;
            console.log(`${label.padEnd(20)}: ${stat.count}`);
        });

        const total = stats.reduce((sum, stat) => sum + stat.count, 0);
        const sentCount = stats.find(s => s._id === 'SENT')?.count || 0;
        const successRate = total > 0 ? ((sentCount / total) * 100).toFixed(2) : 0;

        console.log('');
        console.log(`Total Emails: ${total}`);
        console.log(`Success Rate: ${successRate}%`);

        // Get recent invalid emails with details
        console.log('');
        console.log('='.repeat(100));
        console.log('⚠️  RECENT INVALID EMAILS (Last 10)');
        console.log('='.repeat(100));
        console.log('');

        const invalidLogs = await EmailLog.find({ status: 'INVALID' })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('email error meta createdAt');

        if (invalidLogs.length === 0) {
            console.log('No invalid emails found. ✅');
        } else {
            invalidLogs.forEach((log, index) => {
                console.log(`${index + 1}. Email: ${log.email}`);
                console.log(`   Error: ${log.error}`);
                if (log.meta?.validationResult?.suggestedEmail) {
                    console.log(`   💡 Suggestion: ${log.meta.validationResult.suggestedEmail}`);
                }
                console.log(`   Time: ${log.createdAt.toLocaleString()}`);
                console.log('');
            });
        }

        await mongoose.connection.close();
        console.log('✅ Database connection closed');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkRecentEmails();
