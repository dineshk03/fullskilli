const mongoose = require('mongoose');
const Course = require('../models/course');
const User = require('../models/user');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

async function fixDevOpsCourse() {
    try {
        console.log('\n=== FIXING DEVOPS COURSE ASSIGNMENT ===\n');

        // Find the instructor
        const instructor = await User.findOne({ 
            firstName: 'DINESH',
            lastName: 'A',
            accountType: 'Instructor' 
        });

        if (!instructor) {
            console.log('❌ Instructor DINESH A not found!');
            return;
        }

        console.log(`✅ Found instructor: ${instructor.firstName} ${instructor.lastName}`);
        console.log(`   ID: ${instructor._id}`);

        // Find the DevOps course
        const devOpsCourse = await Course.findOne({ 
            courseName: { $regex: /devops.*kubernetes/i }
        });

        if (!devOpsCourse) {
            console.log('❌ DevOps with Kubernetes course not found!');
            return;
        }

        console.log(`\n📚 Found course: "${devOpsCourse.courseName}"`);
        console.log(`   Current instructor: ${devOpsCourse.instructor}`);
        console.log(`   Course ID: ${devOpsCourse._id}`);

        // Update the course
        const updateResult = await Course.updateOne(
            { _id: devOpsCourse._id },
            { 
                $set: { 
                    instructor: instructor._id,
                    updatedAt: new Date()
                } 
            }
        );

        console.log('\n📊 Update Result:');
        console.log(`   Matched: ${updateResult.matchedCount} course(s)`);
        console.log(`   Modified: ${updateResult.modifiedCount} course(s)`);

        if (updateResult.modifiedCount > 0) {
            console.log('   ✅ DevOps course successfully assigned to DINESH A!');
            
            // Verify the assignment
            const updatedCourse = await Course.findById(devOpsCourse._id)
                .populate('instructor', 'firstName lastName email');

            if (updatedCourse && updatedCourse.instructor) {
                console.log('\n🎉 Verification:');
                console.log(`   Course: "${updatedCourse.courseName}"`);
                console.log(`   Now assigned to: ${updatedCourse.instructor.firstName} ${updatedCourse.instructor.lastName}`);
                console.log(`   Email: ${updatedCourse.instructor.email}`);
            }
        } else {
            console.log('   ⚠️  Course was already assigned to DINESH A');
        }

        // Show final count
        const finalCount = await Course.countDocuments({ instructor: instructor._id });
        console.log(`\n🎯 Total courses now assigned to DINESH A: ${finalCount}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

fixDevOpsCourse();
