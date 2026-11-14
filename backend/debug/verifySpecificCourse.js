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

async function verifySpecificCourse() {
    try {
        console.log('\n=== VERIFYING COURSE ASSIGNMENT ===\n');

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
        console.log(`   Email: ${instructor.email}`);
        console.log(`   ID: ${instructor._id}`);

        // Check the specific course that was just assigned
        const courseBeingAssigned = await Course.findOne({ 
            courseName: { $regex: /polyglot/i } // Looking for the course in the image
        }).populate('instructor', 'firstName lastName email accountType');

        if (courseBeingAssigned) {
            console.log('\n📚 Found the course being assigned:');
            console.log(`   Course: "${courseBeingAssigned.courseName}"`);
            console.log(`   Status: ${courseBeingAssigned.status}`);
            if (courseBeingAssigned.instructor) {
                console.log(`   Current Instructor: ${courseBeingAssigned.instructor.firstName} ${courseBeingAssigned.instructor.lastName}`);
                console.log(`   Instructor Email: ${courseBeingAssigned.instructor.email}`);
                console.log(`   Instructor ID: ${courseBeingAssigned.instructor._id}`);
                
                if (courseBeingAssigned.instructor._id.toString() === instructor._id.toString()) {
                    console.log('   ✅ Course is correctly assigned to DINESH A!');
                } else {
                    console.log('   ❌ Course is NOT assigned to DINESH A yet');
                }
            } else {
                console.log('   ❌ No instructor assigned to this course');
            }
        }

        // Get ALL courses assigned to DINESH A
        const allInstructorCourses = await Course.find({ 
            instructor: instructor._id 
        }).select('courseName status createdAt');

        console.log(`\n🎯 All courses currently assigned to DINESH A: ${allInstructorCourses.length}`);
        if (allInstructorCourses.length > 0) {
            allInstructorCourses.forEach((course, index) => {
                console.log(`   ${index + 1}. "${course.courseName}" - Status: ${course.status}`);
            });
        } else {
            console.log('   ❌ No courses found for DINESH A');
        }

        // Check for any courses with "polyglot" in the name
        const polyglotCourses = await Course.find({ 
            courseName: { $regex: /polyglot/i } 
        }).populate('instructor', 'firstName lastName email');

        console.log('\n🔍 All courses with "polyglot" in the name:');
        if (polyglotCourses.length > 0) {
            polyglotCourses.forEach(course => {
                console.log(`   - "${course.courseName}"`);
                if (course.instructor) {
                    console.log(`     Instructor: ${course.instructor.firstName} ${course.instructor.lastName} (${course.instructor.email})`);
                } else {
                    console.log(`     ❌ No instructor assigned`);
                }
            });
        } else {
            console.log('   No courses found with "polyglot" in the name');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

verifySpecificCourse();
