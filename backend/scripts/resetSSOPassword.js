const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('../models/user');

const resetSSOUserPassword = async (email, newPassword) => {
    try {
        console.log('========================================');
        console.log('SSO User Password Reset');
        console.log('========================================');

        // Connect to database
        console.log('📡 Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('✅ Connected to database');

        // Find user
        console.log('\n🔍 Searching for user:', email);
        const user = await User.findOne({ email });

        if (!user) {
            console.log('❌ User not found:', email);
            console.log('\nPlease check:');
            console.log('1. Email is correct');
            console.log('2. User exists in database');
            await mongoose.connection.close();
            process.exit(1);
        }

        console.log('✅ User found!');
        console.log('\n📋 Current User Details:');
        console.log('  Email:', user.email);
        console.log('  Name:', user.firstName, user.lastName);
        console.log('  PID:', user.pid || 'Not set');
        console.log('  Account Type:', user.accountType);
        console.log('  Created Via:', user.createdVia || 'direct');
        console.log('  Active:', user.active);

        // Check if SSO user
        if (user.createdVia === 'php_website') {
            console.log('\n⚠️  This is an SSO user (created via Skilli Jobs)');
            console.log('  Current login method: SSO only');
            console.log('  After reset: Can login with email/password OR SSO');
        }

        // Hash new password
        console.log('\n🔐 Hashing new password...');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user
        console.log('💾 Updating user password...');
        user.password = hashedPassword;

        // Change createdVia to allow direct login
        if (user.createdVia === 'php_website') {
            user.createdVia = 'direct';
            console.log('📝 Changed createdVia from "php_website" to "direct"');
        }

        await user.save();

        console.log('\n✅ Password reset successfully!');
        console.log('\n📧 User can now login with:');
        console.log('  Email:', email);
        console.log('  Password:', newPassword);
        console.log('\n🎯 Login Methods Available:');
        console.log('  ✅ Direct login (email/password)');
        console.log('  ✅ SSO login (through Skilli Jobs)');

        console.log('\n========================================');
        console.log('Reset Complete!');
        console.log('========================================');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error occurred:', error.message);
        console.error('\nFull error:', error);

        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }

        process.exit(1);
    }
};

// Get email and password from command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
    console.log('❌ Missing arguments!');
    console.log('\nUsage:');
    console.log('  node resetSSOPassword.js <email> <password>');
    console.log('\nExample:');
    console.log('  node resetSSOPassword.js user@example.com NewPassword123');
    process.exit(1);
}

// Run the reset
resetSSOUserPassword(email, password);
