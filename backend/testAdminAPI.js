const mongoose = require('mongoose');
const User = require('./models/user');
const jwt = require('jsonwebtoken');
const axios = require('axios');

require('dotenv').config();

async function testAdminAPI() {
  try {
    console.log('=== Testing Admin API ===');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/lms');
    console.log('✅ Connected to MongoDB');
    
    // Find admin user
    const adminUser = await User.findOne({ accountType: 'Admin' });
    if (!adminUser) {
      console.log('❌ No admin user found');
      return;
    }
    
    console.log('✅ Found admin user:', adminUser.email);
    
    // Create admin token
    const token = jwt.sign(
      { id: adminUser._id, email: adminUser.email, accountType: adminUser.accountType },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('✅ Created admin token');
    
    // Test the admin API endpoint
    console.log('\n📡 Testing API endpoint...');
    const response = await axios.get('http://localhost:5001/api/v1/zoom/admin/all', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ Total meetings found:', response.data?.data?.length || 0);
    
    if (response.data?.data && response.data.data.length > 0) {
      console.log('\n📋 Meeting Details:');
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
      console.log('⚠️ No meetings found in API response');
    }
    
    console.log('\n✅ Admin API test completed successfully!');
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
    if (error.response) {
      console.error('❌ Response Status:', error.response.status);
      console.error('❌ Response Data:', error.response.data);
    }
  } finally {
    await mongoose.connection.close();
  }
}

testAdminAPI();
