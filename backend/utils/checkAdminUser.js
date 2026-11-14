const mongoose = require('mongoose');
const User = require('../models/User');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Connect to database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Check admin users
const checkAdminUsers = async () => {
    try {
        console.log('🔍 Checking for admin users...');

        const adminUsers = await User.find({ accountType: 'Admin' });
        console.log(`📊 Found ${adminUsers.length} admin users:`);

        adminUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ID: ${user._id}`);
        });

        if (adminUsers.length === 0) {
            console.log('❌ No admin users found! Creating a test admin user...');
            
            const testAdmin = new User({
                firstName: 'Test',
                lastName: 'Admin',
                email: 'admin@test.com',
                password: '$2b$10$test.hash.for.password', // This is just a placeholder
                accountType: 'Admin',
                approved: true,
                active: true
            });

            await testAdmin.save();
            console.log('✅ Test admin user created:', testAdmin.email);
        }

        // Also check for any users with quiz data
        const usersWithQuizData = await User.find({ accountType: 'Student' }).limit(5);
        console.log(`📚 Found ${usersWithQuizData.length} student users for quiz data`);

    } catch (error) {
        console.error('❌ Error checking admin users:', error);
    }
};

// Main execution
const main = async () => {
    await connectDB();
    await checkAdminUsers();
    
    console.log('🎉 Admin user check completed!');
    process.exit(0);
};

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { checkAdminUsers };
