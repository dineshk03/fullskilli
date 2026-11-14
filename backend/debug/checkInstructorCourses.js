const mongoose = require('mongoose');
const Course = require('../models/course');
const User = require('../models/user');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

async function debugInstructorCourses() {
    try {
        console.log('\n=== DEBUGGING INSTRUCTOR COURSES ===\n');

        // 1. Find all instructors
        const instructors = await User.find({ accountType: 'Instructor' }).select('_id firstName lastName email');
        console.log('📋 All Instructors:');
        instructors.forEach(instructor => {
            console.log(`  - ${instructor.firstName} ${instructor.lastName} (${instructor.email}) - ID: ${instructor._id}`);
        });

        // 2. Find all courses and their instructors
        const allCourses = await Course.find({}).populate('instructor', 'firstName lastName email accountType').select('courseName instructor status');
        console.log('\n📚 All Courses:');
        allCourses.forEach(course => {
            console.log(`  - "${course.courseName}" - Status: ${course.status}`);
            if (course.instructor) {
                console.log(`    Instructor: ${course.instructor.firstName} ${course.instructor.lastName} (${course.instructor.email}) - Type: ${course.instructor.accountType}`);
                console.log(`    Instructor ID: ${course.instructor._id}`);
            } else {
                console.log(`    ❌ No instructor assigned!`);
            }
        });

        // 3. For each instructor, check their courses
        console.log('\n🔍 Courses by Instructor:');
        for (const instructor of instructors) {
            const instructorCourses = await Course.find({ instructor: instructor._id }).select('courseName status');
            console.log(`\n  👨‍🏫 ${instructor.firstName} ${instructor.lastName}:`);
            if (instructorCourses.length > 0) {
                instructorCourses.forEach(course => {
                    console.log(`    ✅ "${course.courseName}" - Status: ${course.status}`);
                });
            } else {
                console.log(`    ❌ No courses found for this instructor`);
            }
        }

        // 4. Check for courses with null or invalid instructors
        const coursesWithoutInstructor = await Course.find({ 
            $or: [
                { instructor: null },
                { instructor: { $exists: false } }
            ]
        }).select('courseName status');
        
        console.log('\n⚠️  Courses without instructor:');
        if (coursesWithoutInstructor.length > 0) {
            coursesWithoutInstructor.forEach(course => {
                console.log(`  - "${course.courseName}" - Status: ${course.status}`);
            });
        } else {
            console.log('  ✅ All courses have instructors assigned');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

debugInstructorCourses();
