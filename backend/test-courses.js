const mongoose = require('mongoose');
const Course = require('./models/course');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const courses = await Course.find().select('_id courseName price').limit(5);
  console.log('Available courses:');
  courses.forEach(course => {
    console.log(`ID: ${course._id}, Name: ${course.courseName}, Price: ${course.price}`);
  });
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
