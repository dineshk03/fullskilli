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

async function debugFormSubmission() {
    try {
        console.log('\n=== DEBUGGING FORM SUBMISSION ISSUE ===\n');

        // Find both instructors
        const instructors = await User.find({ accountType: 'Instructor' })
            .select('firstName lastName email');
        
        console.log('👨‍🏫 Available Instructors:');
        instructors.forEach((instructor, index) => {
            console.log(`   ${index + 1}. ${instructor.firstName} ${instructor.lastName} (${instructor.email})`);
            console.log(`      ID: ${instructor._id}`);
        });

        // Find courses with the specific content from the form
        const coursesWithBenefits = await Course.find({
            $or: [
                { whatYouWillLearn: { $regex: /dsfjlkjsdf/i } },
                { courseName: { $regex: /test|sample|demo/i } },
                { status: 'Draft' }
            ]
        }).populate('instructor', 'firstName lastName email')
          .select('courseName whatYouWillLearn instructions status instructor createdAt updatedAt');

        console.log('\n📚 Courses that might match the form:');
        if (coursesWithBenefits.length > 0) {
            coursesWithBenefits.forEach((course, index) => {
                console.log(`\n   ${index + 1}. "${course.courseName}"`);
                console.log(`      Status: ${course.status}`);
                console.log(`      Benefits: ${course.whatYouWillLearn ? course.whatYouWillLearn.slice(0, 50) + '...' : 'None'}`);
                if (course.instructor) {
                    console.log(`      Current Instructor: ${course.instructor.firstName} ${course.instructor.lastName}`);
                    console.log(`      Instructor ID: ${course.instructor._id}`);
                } else {
                    console.log(`      ❌ No instructor assigned`);
                }
                console.log(`      Course ID: ${course._id}`);
                console.log(`      Last Updated: ${course.updatedAt}`);
            });
        } else {
            console.log('   No matching courses found');
        }

        // Check recent course updates
        const recentCourses = await Course.find({})
            .populate('instructor', 'firstName lastName email')
            .select('courseName instructor status updatedAt')
            .sort({ updatedAt: -1 })
            .limit(5);

        console.log('\n🕒 5 Most Recently Updated Courses:');
        recentCourses.forEach((course, index) => {
            console.log(`   ${index + 1}. "${course.courseName}"`);
            if (course.instructor) {
                console.log(`      Instructor: ${course.instructor.firstName} ${course.instructor.lastName}`);
            } else {
                console.log(`      ❌ No instructor`);
            }
            console.log(`      Updated: ${course.updatedAt}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

debugFormSubmission();
