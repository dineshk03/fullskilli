const { sendZoomMeetingCreatedEmail, sendZoomMeetingDeletedEmail } = require('./services/emailService');
require('dotenv').config();

async function testZoomEmails() {
  try {
    console.log('🧪 Testing Zoom Email Notifications...');
    
    // Test meeting data
    const testMeeting = {
      meetingId: '123456789',
      topic: 'Test Zoom Meeting',
      startTime: new Date(Date.now() + 10 * 60000), // 10 minutes from now
      duration: 30,
      joinUrl: 'https://zoom.us/j/123456789',
      password: 'test123'
    };
    
    const testSubSectionId = '6926c20d9cbda496a7c5d933'; // Use existing subsection ID
    
    console.log('\n📧 Test 1: Zoom Meeting Creation Email...');
    await sendZoomMeetingCreatedEmail(testSubSectionId, testMeeting);
    console.log('✅ Creation email test completed');
    
    console.log('\n🗑️ Test 2: Zoom Meeting Deletion Email...');
    await sendZoomMeetingDeletedEmail(testSubSectionId, testMeeting);
    console.log('✅ Deletion email test completed');
    
    console.log('\n🎉 All Zoom email tests completed!');
    console.log('💡 Check your email inbox for the test messages');
    
  } catch (error) {
    console.error('❌ Error testing Zoom emails:', error);
  }
  process.exit(0);
}

testZoomEmails();
