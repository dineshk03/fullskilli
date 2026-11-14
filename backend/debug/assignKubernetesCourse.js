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

async function assignKubernetesCourse() {
    try {
        console.log('\n=== ASSIGNING KUBERNETES COURSE TO DINESH A ===\n');

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

        // Find and update the Kubernetes course
        const updateResult = await Course.updateOne(
            { courseName: { $regex: /kubernetes/i } },
            { 
                $set: { 
                    instructor: instructor._id,
                    updatedAt: new Date()
                } 
            }
        );

        console.log('\n📚 Update Result:');
        console.log(`   Matched: ${updateResult.matchedCount} course(s)`);
        console.log(`   Modified: ${updateResult.modifiedCount} course(s)`);

        if (updateResult.modifiedCount > 0) {
            console.log('   ✅ Course successfully assigned to DINESH A!');
            
            // Verify the assignment
            const updatedCourse = await Course.findOne({ 
                courseName: { $regex: /kubernetes/i }
            }).populate('instructor', 'firstName lastName email');

            if (updatedCourse && updatedCourse.instructor) {
                console.log('\n🎉 Verification:');
                console.log(`   Course: "${updatedCourse.courseName}"`);
                console.log(`   Now assigned to: ${updatedCourse.instructor.firstName} ${updatedCourse.instructor.lastName}`);
                console.log(`   Email: ${updatedCourse.instructor.email}`);
            }
        } else {
            console.log('   ❌ No courses were modified');
        }

        // Show all courses now assigned to DINESH A
        const allInstructorCourses = await Course.find({ 
            instructor: instructor._id 
        }).select('courseName status');

        console.log(`\n🎯 All courses now assigned to DINESH A: ${allInstructorCourses.length}`);
        allInstructorCourses.forEach((course, index) => {
            console.log(`   ${index + 1}. "${course.courseName}" - Status: ${course.status}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

assignKubernetesCourse();
