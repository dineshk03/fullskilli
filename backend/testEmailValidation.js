/**
 * Email Validation Test Script
 * Tests the new email validation functionality
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { validateEmail, validateEmailBatch } = require('./utils/emailValidator');
const mailSender = require('./utils/mailSender');

// Test email addresses (mix of valid and invalid)
const testEmails = [
    'dineshbf393@gmail.com',           // Valid
    'keerthanasrinkar23@gmail.com',    // Valid
    'sugg3john96@gmail.com',           // Suspicious (number in middle)
    'jameslaratena@gmail.com',         // Valid format, but check DNS
    'casudha017@gmail.com',            // Valid format, but check DNS
    'ajithalar22@gmail.com',           // Valid
    'gowsudhrappan@gmail.com',         // Valid format, but check DNS
    'pvashkumar1551@gmail.com',        // Valid
    'invalid@gmial.com',               // Typo in domain
    'test@nonexistentdomain12345.com', // Non-existent domain
    'notanemail',                      // Invalid format
    'missing@domain',                  // Missing TLD
    'double..dots@gmail.com',          // Invalid format (double dots)
];

async function testEmailValidation() {
    console.log('='.repeat(80));
    console.log('📧 EMAIL VALIDATION TEST');
    console.log('='.repeat(80));
    console.log('');

    // Connect to database
    try {
        await mongoose.connect(process.env.MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');
        console.log('');
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error.message);
        return;
    }

    // Test 1: Individual email validation
    console.log('TEST 1: Individual Email Validation');
    console.log('-'.repeat(80));

    for (const email of testEmails) {
        console.log(`\nTesting: ${email}`);
        try {
            const result = await validateEmail(email, { checkDNS: true });

            if (result.isValid) {
                console.log(`  ✅ VALID`);
                if (result.warnings.length > 0) {
                    console.log(`  ⚠️  Warnings: ${result.warnings.join(', ')}`);
                }
            } else {
                console.log(`  ❌ INVALID`);
                console.log(`  📝 Errors: ${result.errors.join(', ')}`);
                if (result.suggestedEmail) {
                    console.log(`  💡 Suggestion: ${result.suggestedEmail}`);
                }
            }
        } catch (error) {
            console.log(`  ⚠️  Error during validation: ${error.message}`);
        }
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('');

    // Test 2: Batch validation
    console.log('TEST 2: Batch Email Validation');
    console.log('-'.repeat(80));

    const batchResults = await validateEmailBatch(testEmails, { checkDNS: true });

    const validEmails = batchResults.filter(r => r.isValid);
    const invalidEmails = batchResults.filter(r => !r.isValid);
    const emailsWithWarnings = batchResults.filter(r => r.isValid && r.warnings.length > 0);

    console.log(`\n📊 Summary:`);
    console.log(`  Total emails tested: ${testEmails.length}`);
    console.log(`  ✅ Valid: ${validEmails.length}`);
    console.log(`  ❌ Invalid: ${invalidEmails.length}`);
    console.log(`  ⚠️  Valid with warnings: ${emailsWithWarnings.length}`);

    console.log(`\n❌ Invalid Emails:`);
    invalidEmails.forEach(result => {
        console.log(`  - ${result.email}`);
        console.log(`    Reason: ${result.errors.join(', ')}`);
        if (result.suggestedEmail) {
            console.log(`    Suggestion: ${result.suggestedEmail}`);
        }
    });

    if (emailsWithWarnings.length > 0) {
        console.log(`\n⚠️  Emails with Warnings:`);
        emailsWithWarnings.forEach(result => {
            console.log(`  - ${result.email}`);
            console.log(`    Warnings: ${result.warnings.join(', ')}`);
        });
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('');

    // Test 3: Attempt to send email to invalid address (should be blocked)
    console.log('TEST 3: Attempting to Send to Invalid Email');
    console.log('-'.repeat(80));

    const invalidEmail = 'test@gmial.com'; // Typo in domain
    console.log(`\nAttempting to send email to: ${invalidEmail}`);

    try {
        await mailSender(
            invalidEmail,
            'Test Email',
            '<h1>This should not be sent</h1>',
            [],
            'test-validation'
        );
        console.log('  ⚠️  Email was sent (unexpected!)');
    } catch (error) {
        console.log('  ✅ Email blocked by validation');
        console.log(`  📝 Reason: ${error.message}`);
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('');

    // Test 4: Check database logs
    console.log('TEST 4: Checking Email Logs in Database');
    console.log('-'.repeat(80));

    const EmailLog = require('./models/emailLog');

    const recentLogs = await EmailLog.find({ context: 'test-validation' })
        .sort({ createdAt: -1 })
        .limit(5);

    console.log(`\nRecent email logs (test-validation context):`);
    recentLogs.forEach(log => {
        console.log(`\n  Email: ${log.email}`);
        console.log(`  Status: ${log.status}`);
        console.log(`  Subject: ${log.subject}`);
        if (log.error) {
            console.log(`  Error: ${log.error}`);
        }
        console.log(`  Created: ${log.createdAt}`);
    });

    console.log('');
    console.log('='.repeat(80));
    console.log('✅ All tests completed!');
    console.log('='.repeat(80));

    // Close database connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
}

// Run tests
testEmailValidation().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
