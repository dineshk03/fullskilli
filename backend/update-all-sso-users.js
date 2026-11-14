// Update ALL users who have a PID to set createdVia: 'php_website'
const mongoose = require('mongoose');

const MONGODB_URL = "mongodb://localhost:27017/lms";

async function updateAllSSOUsers() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URL);
        console.log('✅ Connected to MongoDB\n');

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        // Find all users who have a PID (came from PHP/Skilli Jobs)
        console.log('🔍 Finding all users with PID...');
        const usersWithPID = await User.find({ 
            pid: { $exists: true, $ne: null } 
        });

        console.log(`📊 Found ${usersWithPID.length} users with PID\n`);

        if (usersWithPID.length === 0) {
            console.log('No users found with PID. They might not have logged in via Skilli Jobs yet.');
            await mongoose.connection.close();
            process.exit(0);
        }

        let updatedCount = 0;
        let alreadySetCount = 0;

        for (const user of usersWithPID) {
            if (user.createdVia === 'php_website') {
                console.log(`✓ ${user.email} - Already set correctly`);
                alreadySetCount++;
            } else {
                console.log(`🔄 Updating ${user.email}...`);
                user.createdVia = 'php_website';
                await user.save();
                console.log(`✅ Updated ${user.email}`);
                updatedCount++;
            }
        }

        console.log('\n📊 Summary:');
        console.log(`   Total users with PID: ${usersWithPID.length}`);
        console.log(`   Already correct: ${alreadySetCount}`);
        console.log(`   Updated: ${updatedCount}`);

        if (updatedCount > 0) {
            console.log('\n🎉 Done! Now:');
            console.log('1. Logout from Beeja LMS');
            console.log('2. Close ALL browser windows');
            console.log('3. Reopen browser');
            console.log('4. Go to http://127.0.0.1:8000');
            console.log('5. Login and click "Upskills"');
            console.log('6. Should see "Skilli" branding ✅');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

updateAllSSOUsers();
