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

async function checkKubernetesCourse() {
    try {
        console.log('\n=== CHECKING KUBERNETES COURSE ASSIGNMENT ===\n');

        // Find the instructor
        const instructor = await User.findOne({ 
            firstName: 'DINESH',
            lastName: 'A',
            accountType: 'Instructor' 
        });

        console.log(`✅ Instructor: ${instructor.firstName} ${instructor.lastName} (${instructor._id})`);

        // Find the Kubernetes course
        const kubernetesCourse = await Course.findOne({ 
            courseName: { $regex: /kubernetes/i }
        }).populate('instructor', 'firstName lastName email');

        if (kubernetesCourse) {
            console.log('\n📚 Kubernetes Course Found:');
            console.log(`   Course: "${kubernetesCourse.courseName}"`);
            console.log(`   Status: ${kubernetesCourse.status}`);
            if (kubernetesCourse.instructor) {
                console.log(`   Assigned to: ${kubernetesCourse.instructor.firstName} ${kubernetesCourse.instructor.lastName}`);
                console.log(`   Instructor Email: ${kubernetesCourse.instructor.email}`);
                console.log(`   Instructor ID: ${kubernetesCourse.instructor._id}`);
                
                if (kubernetesCourse.instructor._id.toString() === instructor._id.toString()) {
                    console.log('   ✅ Course is correctly assigned to DINESH A!');
                } else {
                    console.log('   ❌ Course is NOT assigned to DINESH A');
                }
            } else {
                console.log('   ❌ No instructor assigned');
            }
        } else {
            console.log('❌ Kubernetes course not found');
        }

        // Get ALL courses currently assigned to DINESH A
        const allInstructorCourses = await Course.find({ 
            instructor: instructor._id 
        }).select('courseName status updatedAt').sort({ updatedAt: -1 });

        console.log(`\n🎯 ALL courses assigned to DINESH A: ${allInstructorCourses.length}`);
        allInstructorCourses.forEach((course, index) => {
            console.log(`   ${index + 1}. "${course.courseName}" - Status: ${course.status}`);
            console.log(`      Last updated: ${course.updatedAt}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

checkKubernetesCourse();
