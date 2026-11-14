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

async function findAllCourses() {
    try {
        console.log('\n=== ALL COURSES IN DATABASE ===\n');

        const allCourses = await Course.find({})
            .populate('instructor', 'firstName lastName email accountType')
            .select('courseName status instructor createdAt')
            .sort({ createdAt: -1 });

        console.log(`📚 Total courses found: ${allCourses.length}\n`);

        allCourses.forEach((course, index) => {
            console.log(`${index + 1}. "${course.courseName}"`);
            console.log(`   Status: ${course.status}`);
            if (course.instructor) {
                console.log(`   Instructor: ${course.instructor.firstName} ${course.instructor.lastName} (${course.instructor.email})`);
                console.log(`   Account Type: ${course.instructor.accountType}`);
            } else {
                console.log(`   ❌ No instructor assigned`);
            }
            console.log(`   Created: ${course.createdAt}`);
            console.log('');
        });

        // Look for courses that might match what you're assigning
        const possibleMatches = allCourses.filter(course => 
            course.courseName.toLowerCase().includes('poly') ||
            course.courseName.toLowerCase().includes('glot') ||
            course.courseName.toLowerCase().includes('java') ||
            course.courseName.toLowerCase().includes('python') ||
            course.courseName.toLowerCase().includes('programming')
        );

        if (possibleMatches.length > 0) {
            console.log('\n🔍 Possible matches for the course you\'re assigning:');
            possibleMatches.forEach(course => {
                console.log(`   - "${course.courseName}"`);
                if (course.instructor) {
                    console.log(`     Instructor: ${course.instructor.firstName} ${course.instructor.lastName}`);
                } else {
                    console.log(`     ❌ No instructor`);
                }
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

findAllCourses();
