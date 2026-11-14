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

async function assignNullInstructorCourses() {
    try {
        console.log('\n=== ASSIGNING NULL INSTRUCTOR COURSES ===\n');

        // Find instructors
        const dineshInstructor = await User.findOne({ 
            firstName: 'DINESH',
            lastName: 'A',
            accountType: 'Instructor' 
        });

        const testInstructor = await User.findOne({ 
            firstName: 'test',
            lastName: 's',
            accountType: 'Instructor' 
        });

        if (!dineshInstructor || !testInstructor) {
            console.log('❌ Could not find both instructors!');
            return;
        }

        console.log(`✅ Found DINESH A: ${dineshInstructor._id}`);
        console.log(`✅ Found test s: ${testInstructor._id}`);

        // Course assignments
        const courseAssignments = [
            {
                courseName: "Cybersecurity Fundamentals11",
                instructor: dineshInstructor._id,
                instructorName: "DINESH A"
            },
            {
                courseName: "Project Management Ready", 
                instructor: testInstructor._id,
                instructorName: "test s"
            }
        ];

        console.log('\n📚 Assigning courses:');

        for (const assignment of courseAssignments) {
            try {
                const updateResult = await Course.updateOne(
                    { courseName: assignment.courseName },
                    { 
                        $set: { 
                            instructor: assignment.instructor,
                            updatedAt: new Date()
                        } 
                    }
                );

                if (updateResult.matchedCount > 0) {
                    if (updateResult.modifiedCount > 0) {
                        console.log(`   ✅ "${assignment.courseName}" → ${assignment.instructorName}`);
                    } else {
                        console.log(`   ⚠️  "${assignment.courseName}" → Already assigned to ${assignment.instructorName}`);
                    }
                } else {
                    console.log(`   ❌ "${assignment.courseName}" → Course not found`);
                }
            } catch (error) {
                console.log(`   ❌ "${assignment.courseName}" → Error: ${error.message}`);
            }
        }

        // Verify assignments
        console.log('\n🔍 Verification:');
        for (const assignment of courseAssignments) {
            const course = await Course.findOne({ courseName: assignment.courseName })
                .populate('instructor', 'firstName lastName email');
            
            if (course && course.instructor) {
                console.log(`   ✅ "${course.courseName}" → ${course.instructor.firstName} ${course.instructor.lastName}`);
            } else {
                console.log(`   ❌ "${assignment.courseName}" → Still no instructor assigned`);
            }
        }

        // Show final counts
        const dineshCount = await Course.countDocuments({ instructor: dineshInstructor._id });
        const testCount = await Course.countDocuments({ instructor: testInstructor._id });

        console.log('\n📊 Final Course Counts:');
        console.log(`   DINESH A: ${dineshCount} courses`);
        console.log(`   test s: ${testCount} courses`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

assignNullInstructorCourses();
