const mongoose = require('mongoose');
const User = require('./models/user');
const Course = require('./models/course');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  console.log('=== STUDENT INFO ===');
  const student = await User.findOne({ email: 'dinesh1@gmail.com' });
  if (student) {
    console.log(`Student ID: ${student._id}`);
    console.log(`Student Name: ${student.firstName} ${student.lastName}`);
    console.log(`Currently Enrolled Courses: ${student.courses.length}`);
    console.log('Enrolled Course IDs:', student.courses);
  } else {
    console.log('Student not found!');
  }

  console.log('\n=== AVAILABLE COURSES ===');
  const courses = await Course.find().select('_id courseName price studentsEnrolled').limit(5);
  courses.forEach(course => {
    console.log(`Course ID: ${course._id}, Name: ${course.courseName}, Price: ${course.price}, Enrolled: ${course.studentsEnrolled.length}`);
  });

  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
