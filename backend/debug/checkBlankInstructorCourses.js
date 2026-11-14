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

async function checkBlankInstructorCourses() {
    try {
        console.log('\n=== CHECKING COURSES WITH NO INSTRUCTOR ===\n');

        // Find courses with no instructor or null instructor
        const coursesWithoutInstructor = await Course.find({
            $or: [
                { instructor: null },
                { instructor: { $exists: false } }
            ]
        }).select('courseName status instructor createdAt');

        console.log(`📚 Courses without instructor: ${coursesWithoutInstructor.length}`);
        
        if (coursesWithoutInstructor.length > 0) {
            coursesWithoutInstructor.forEach((course, index) => {
                console.log(`   ${index + 1}. "${course.courseName}"`);
                console.log(`      Status: ${course.status}`);
                console.log(`      Instructor: ${course.instructor || 'NULL'}`);
                console.log(`      Course ID: ${course._id}`);
                console.log('');
            });
        } else {
            console.log('   ✅ All courses have instructors assigned');
        }

        // Check the specific courses mentioned
        const specificCourses = [
            "Cybersecurity Fundamentals11",
            "Project Management Ready"
        ];

        console.log('\n🔍 Checking specific courses:');
        for (const courseName of specificCourses) {
            const course = await Course.findOne({ courseName: courseName })
                .populate('instructor', 'firstName lastName email accountType');
            
            if (course) {
                console.log(`\n   📖 "${course.courseName}"`);
                console.log(`      Course ID: ${course._id}`);
                console.log(`      Status: ${course.status}`);
                if (course.instructor) {
                    console.log(`      Instructor: ${course.instructor.firstName} ${course.instructor.lastName}`);
                    console.log(`      Instructor Email: ${course.instructor.email}`);
                    console.log(`      Instructor ID: ${course.instructor._id}`);
                } else {
                    console.log(`      ❌ No instructor assigned (NULL)`);
                }
            } else {
                console.log(`   ❌ Course "${courseName}" not found`);
            }
        }

        // Find all instructors available
        const instructors = await User.find({ accountType: 'Instructor' })
            .select('firstName lastName email');
        
        console.log('\n👨‍🏫 Available Instructors:');
        instructors.forEach((instructor, index) => {
            console.log(`   ${index + 1}. ${instructor.firstName} ${instructor.lastName} (${instructor.email})`);
            console.log(`      ID: ${instructor._id}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

checkBlankInstructorCourses();
