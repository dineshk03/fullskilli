const mailSender = require('./utils/mailSender');
const SubSection = require('./models/subSection');
require('dotenv').config();

async function testEmailSystem() {
  try {
    console.log('🧪 Testing Email System for Zoom Meetings...');
    
    // Test 1: Basic email sending
    console.log('\n📧 Test 1: Basic email sending...');
    await mailSender(
      'beejainnovativeventures@gmail.com',
      '🧪 Test Email from Beeja Academy',
      '<h1>Test Email</h1><p>This is a test email to verify the email system is working.</p>'
    );
    console.log('✅ Basic email test completed');
    
    // Test 2: Check for existing Zoom meetings
    console.log('\n🔍 Test 2: Checking for Zoom meetings...');
    const meetings = await SubSection.find({
      'zoomMeeting': { $exists: true }
    }).select('title zoomMeeting').lean();
    
    console.log(`📊 Found ${meetings.length} meetings with Zoom data:`);
    meetings.forEach((meeting, index) => {
      console.log(`${index + 1}. ${meeting.title}`);
      console.log(`   Meeting ID: ${meeting.zoomMeeting?.meetingId}`);
      console.log(`   Topic: ${meeting.zoomMeeting?.topic}`);
      console.log(`   Start Time: ${meeting.zoomMeeting?.startTime ? new Date(meeting.zoomMeeting.startTime).toLocaleString() : 'Not set'}`);
      console.log(`   Reminder Sent: ${meeting.zoomMeeting?.reminderSent || false}`);
      console.log('');
    });
    
    // Test 3: Check email configuration
    console.log('\n⚙️ Test 3: Email configuration check...');
    console.log(`MAIL_HOST: ${process.env.MAIL_HOST ? '✅ Set' : '❌ Missing'}`);
    console.log(`MAIL_USER: ${process.env.MAIL_USER ? '✅ Set' : '❌ Missing'}`);
    console.log(`MAIL_PASS: ${process.env.MAIL_PASS ? '✅ Set' : '❌ Missing'}`);
    console.log(`MAIL_PORT: ${process.env.MAIL_PORT || 587}`);
    
    // Test 4: Check if reminder scheduler should be running
    console.log('\n⏰ Test 4: Reminder scheduler status...');
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);
    
    const upcomingMeetings = await SubSection.find({
      'zoomMeeting': { $exists: true },
      'zoomMeeting.startTime': {
        $gte: new Date(fiveMinutesFromNow.getTime() - 30000),
        $lte: new Date(fiveMinutesFromNow.getTime() + 30000)
      },
      'zoomMeeting.status': { $ne: 'cancelled' }
    });
    
    console.log(`📅 Meetings starting in 5 minutes: ${upcomingMeetings.length}`);
    
    if (upcomingMeetings.length > 0) {
      console.log('Upcoming meetings that should trigger reminders:');
      upcomingMeetings.forEach((meeting, index) => {
        console.log(`${index + 1}. ${meeting.title}`);
        console.log(`   Start Time: ${new Date(meeting.zoomMeeting.startTime).toLocaleString()}`);
        console.log(`   Reminder Sent: ${meeting.zoomMeeting.reminderSent || false}`);
      });
    } else {
      console.log('ℹ️ No meetings starting in the next 5 minutes');
      console.log('💡 To test reminders, create a meeting with start time 5 minutes from now');
    }
    
    console.log('\n🎉 Email system test completed!');
    
  } catch (error) {
    console.error('❌ Error testing email system:', error);
  }
  process.exit(0);
}

testEmailSystem();
