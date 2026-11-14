const axios = require('axios');

async function testZoomAPI() {
  try {
    console.log('Testing Zoom API endpoint...');
    
    // Test the admin zoom meetings endpoint
    const response = await axios.get('http://localhost:5001/api/v1/zoom/admin/all');
    
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
    
  } catch (error) {
    console.error('API Test Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

testZoomAPI();
