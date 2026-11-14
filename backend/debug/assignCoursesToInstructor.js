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

async function assignCoursesToInstructor() {
    try {
        console.log('\n=== ASSIGNING COURSES TO INSTRUCTOR ===\n');

        // Find the instructor
        const instructor = await User.findOne({ 
            email: 'dinesh@jio.com', 
            accountType: 'Instructor' 
        });

        if (!instructor) {
            console.log('❌ Instructor not found!');
            return;
        }

        console.log(`✅ Found instructor: ${instructor.firstName} ${instructor.lastName} (${instructor.email})`);
        console.log(`   Instructor ID: ${instructor._id}`);

        // Get list of course names to assign (you can modify this list)
        const coursesToAssign = [
            "Complete Web Development Bootcamp",
            "Advanced JavaScript Concepts",
            "React - The Complete Guide",
            "Node.js and Express.js Fundamentals"
            // Add more course names as needed
        ];

        console.log('\n📚 Courses to assign:');
        coursesToAssign.forEach(courseName => {
            console.log(`  - ${courseName}`);
        });

        // Update courses
        const updateResult = await Course.updateMany(
            { courseName: { $in: coursesToAssign } },
            { $set: { instructor: instructor._id } }
        );

        console.log(`\n✅ Updated ${updateResult.modifiedCount} courses`);

        // Verify the assignment
        const assignedCourses = await Course.find({ 
            instructor: instructor._id 
        }).select('courseName status');

        console.log('\n🎉 Courses now assigned to instructor:');
        assignedCourses.forEach(course => {
            console.log(`  ✅ "${course.courseName}" - Status: ${course.status}`);
        });

        console.log(`\n📊 Total courses assigned: ${assignedCourses.length}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

// Run the assignment
assignCoursesToInstructor();
