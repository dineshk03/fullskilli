require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Profile = require('../models/profile');

async function createTestStudent() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('✅ Connected to database');

        // Check if student already exists
        const existingStudent = await User.findOne({ email: 'student@test.com' });
        if (existingStudent) {
            console.log('⚠️  Test student already exists');
            console.log('Email: student@test.com');
            console.log('Password: password123');
            process.exit(0);
        }

        // Create profile first
        const profile = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: null
        });

        // Hash password
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Create student user
        const student = await User.create({
            firstName: 'Test',
            lastName: 'Student',
            email: 'student@test.com',
            password: hashedPassword,
            accountType: 'Student',
            active: true,
            approved: true,
            additionalDetails: profile._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=Test Student`,
            courses: []
        });

        console.log('✅ Test student created successfully!');
        console.log('\n📧 Login Credentials:');
        console.log('Email: student@test.com');
        console.log('Password: password123');
        console.log('\nYou can now log in and test the payment integration!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating test student:', error);
        process.exit(1);
    }
}

createTestStudent();
