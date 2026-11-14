const mongoose = require('mongoose');
const User = require('./models/user');
const jwt = require('jsonwebtoken');

require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/lms')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Find admin users
      const adminUsers = await User.find({ accountType: 'Admin' });
      console.log('Found', adminUsers.length, 'admin users:');
      
      adminUsers.forEach(admin => {
        console.log(`- ${admin.firstName} ${admin.lastName} (${admin.email})`);
      });
      
      if (adminUsers.length > 0) {
        // Create a test token for the first admin
        const admin = adminUsers[0];
        const token = jwt.sign(
          { id: admin._id, email: admin.email, accountType: admin.accountType },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        
        console.log('\nTest token created for:', admin.email);
        console.log('Token:', token);
        
        // Test the API with this token
        const axios = require('axios');
        const response = await axios.get('http://localhost:5001/api/v1/zoom/admin/all', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('\n=== API TEST RESULTS ===');
        console.log('Status:', response.status);
        console.log('Meetings found:', response.data?.data?.length || 0);
        
        if (response.data?.data && response.data.data.length > 0) {
          console.log('\nMeeting Details:');
          response.data.data.forEach((meeting, index) => {
            console.log(`${index + 1}. ${meeting.zoomMeeting?.topic || 'No topic'}`);
            console.log(`   - Status: ${meeting.zoomMeeting?.status || 'No status'}`);
            console.log(`   - Start Time: ${meeting.zoomMeeting?.startTime || 'No time'}`);
            console.log(`   - Course: ${meeting.courseTitle || 'No course'}`);
            console.log(`   - Lecture: ${meeting.title || 'No lecture'}`);
            console.log(`   - Section: ${meeting.sectionName || 'No section'}`);
            if (meeting.courseInstructor) {
              console.log(`   - Instructor: ${meeting.courseInstructor.firstName || ''} ${meeting.courseInstructor.lastName || ''}`);
            }
            console.log('');
          });
        } else {
          console.log('No meetings found in API response');
        }
      } else {
        console.log('No admin users found in database');
      }
      
    } catch (error) {
      console.error('Error:', error.message);
      if (error.response) {
        console.error('Response Status:', error.response.status);
        console.error('Response Data:', error.response.data);
      }
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
