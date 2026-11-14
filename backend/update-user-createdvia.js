// Quick script to update user's createdVia field
const mongoose = require('mongoose');

const MONGODB_URL = "mongodb://localhost:27017/lms";
const USER_EMAIL = "beeja22movievalleyenterp@gmail.com";

async function updateUser() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URL);
        console.log('✅ Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        console.log(`🔍 Finding user: ${USER_EMAIL}`);
        const user = await User.findOne({ email: USER_EMAIL });

        if (!user) {
            console.log('❌ User not found!');
            process.exit(1);
        }

        console.log('📝 Current user data:', {
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            createdVia: user.createdVia || 'undefined'
        });

        console.log('🔄 Updating createdVia to "php_website"...');
        user.createdVia = 'php_website';
        await user.save();

        console.log('✅ User updated successfully!');
        console.log('📝 New user data:', {
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            createdVia: user.createdVia
        });

        console.log('\n🎉 Done! Now:');
        console.log('1. Logout from Beeja LMS');
        console.log('2. Clear browser cache (Ctrl+Shift+Delete)');
        console.log('3. Login again from Skilli Jobs');
        console.log('4. Navbar should show "Skilli" ✅');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

updateUser();
