const Course = require('./models/course');
const User = require('./models/user');
require('dotenv').config();

async function checkCourseStudents() {
  try {
    console.log('🔍 Checking course enrollments...');
    
    // Find all courses
    const courses = await Course.find({})
      .populate('studentsEnrolled', 'firstName lastName email')
      .select('courseName studentsEnrolled');
    
    console.log(`📊 Found ${courses.length} courses:`);
    
    courses.forEach((course, index) => {
      console.log(`\n${index + 1}. ${course.courseName}`);
      console.log(`   Enrolled Students: ${course.studentsEnrolled.length}`);
      
      if (course.studentsEnrolled.length > 0) {
        course.studentsEnrolled.forEach((student, sIndex) => {
          console.log(`   ${sIndex + 1}. ${student.firstName} ${student.lastName} - ${student.email}`);
        });
      } else {
        console.log('   ⚠️ No students enrolled in this course');
      }
    });
    
    // Check all users to see who are students
    console.log('\n👥 All student users:');
    const students = await User.find({ accountType: 'Student' })
      .select('firstName lastName email')
      .lean();
    
    console.log(`Found ${students.length} student users:`);
    students.forEach((student, index) => {
      console.log(`${index + 1}. ${student.firstName} ${student.lastName} - ${student.email}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking course students:', error);
  }
  process.exit(0);
}

checkCourseStudents();
