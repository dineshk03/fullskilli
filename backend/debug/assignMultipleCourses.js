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

async function assignMultipleCourses() {
    try {
        console.log('\n=== ASSIGNING MULTIPLE COURSES TO DINESH A ===\n');

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

        // List of course names to assign (you can modify this)
        const coursesToAssign = [
            "Mobile App Development with React Native",
            "Android Development with Kotlin", 
            "iOS Development with Swift",
            "Flutter Development for Beginners",
            "Data Science Fundamentals",
            "Machine Learning A-Z"
            // Add more course names as needed
        ];

        console.log('\n📚 Courses to assign:');
        coursesToAssign.forEach((courseName, index) => {
            console.log(`   ${index + 1}. ${courseName}`);
        });

        // Update courses one by one
        let successCount = 0;
        let failCount = 0;

        for (const courseName of coursesToAssign) {
            try {
                const updateResult = await Course.updateOne(
                    { courseName: courseName },
                    { 
                        $set: { 
                            instructor: instructor._id,
                            updatedAt: new Date()
                        } 
                    }
                );

                if (updateResult.matchedCount > 0) {
                    if (updateResult.modifiedCount > 0) {
                        console.log(`   ✅ "${courseName}" - Successfully assigned`);
                        successCount++;
                    } else {
                        console.log(`   ⚠️  "${courseName}" - Already assigned to this instructor`);
                        successCount++;
                    }
                } else {
                    console.log(`   ❌ "${courseName}" - Course not found`);
                    failCount++;
                }
            } catch (error) {
                console.log(`   ❌ "${courseName}" - Error: ${error.message}`);
                failCount++;
            }
        }

        console.log(`\n📊 Assignment Summary:`);
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ❌ Failed: ${failCount}`);

        // Show all courses now assigned to DINESH A
        const allInstructorCourses = await Course.find({ 
            instructor: instructor._id 
        }).select('courseName status').sort({ courseName: 1 });

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

assignMultipleCourses();
