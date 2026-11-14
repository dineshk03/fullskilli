const axios = require('axios');

async function testZoomAPIWithAuth() {
  try {
    console.log('Testing Zoom API endpoint with authentication...');
    
    // First, login as admin to get a token
    const loginResponse = await axios.post('http://localhost:5001/api/v1/auth/login', {
      email: 'admin@example.com', // Replace with actual admin email
      password: 'admin123' // Replace with actual admin password
    });
    
    if (!loginResponse.data.success) {
      console.log('Login failed, using test token...');
      // Create a test token (this would normally come from a real login)
      const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0ZjE3NzQ1YzE3YjU2M2E5ZmQxZjY5ZiIsImFjY291bnRUeXBlIjoiQWRtaW4iLCJpYXQiOjE2OTI5NjQ4MDAsImV4cCI6MTY5MzA1MTIwMH0.test-token';
      
      const response = await axios.get('http://localhost:5001/api/v1/zoom/admin/all', {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      
      console.log('API Response Status:', response.status);
      console.log('Total meetings found:', response.data?.data?.length || 0);
      
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
      console.log('Login successful, using real token...');
      const token = loginResponse.data.token;
      
      const response = await axios.get('http://localhost:5001/api/v1/zoom/admin/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('API Response Status:', response.status);
      console.log('Total meetings found:', response.data?.data?.length || 0);
      
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
    }
    
  } catch (error) {
    console.error('API Test Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

testZoomAPIWithAuth();
