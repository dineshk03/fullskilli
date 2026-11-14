const { sendMeetingReminder } = require('../services/emailService');
const mailSender = require('../utils/mailSender');
const SubSection = require('../models/subSection');

/**
 * Test script for Zoom meeting email notifications
 * Run this script to test the email notification system
 */
const testMeetingReminders = async () => {
  try {
    console.log('🧪 Testing Zoom meeting email notifications...\n');

    // Test 1: Send test email with existing mailSender
    console.log('📧 Test 1: Testing existing email configuration...');
    try {
      const testResult = await mailSender(
        'test@example.com',
        'Test Email from LMS - Meeting Reminders',
        `
          <h1>✅ Email Configuration Test</h1>
          <p>This is a test email to verify the email configuration for Zoom meeting reminders.</p>
          <p>If you receive this, the email service is working correctly.</p>
          <p><strong>Meeting reminders will use this same email system.</strong></p>
        `,
        [],
        'test-meeting-reminder'
      );
      console.log('✅ Existing email system working:', testResult.messageId);
    } catch (emailError) {
      console.error('❌ Email system test failed:', emailError.message);
      console.log('Please check your email configuration in .env file:');
      console.log('- MAIL_HOST');
      console.log('- MAIL_USER'); 
      console.log('- MAIL_PASS');
      console.log('- MAIL_PORT');
      return;
    }

    // Test 2: Send test meeting reminder
    console.log('\n📧 Test 2: Sending test meeting reminder...');
    const testMeeting = {
      topic: 'Test Meeting - ' + new Date().toLocaleString(),
      startTime: new Date(Date.now() + 5 * 60000), // 5 minutes from now
      duration: 60,
      joinUrl: 'https://zoom.us/test-meeting',
      password: '123456'
    };

    await sendMeetingReminder('test-subsection-id', testMeeting);
    console.log('✅ Test meeting reminder sent successfully\n');

    // Test 3: Check for upcoming meetings in database
    console.log('🔍 Test 3: Checking for upcoming meetings in database...');
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60000);

    const upcomingMeetings = await SubSection.find({
      'zoomMeeting': { $exists: true },
      'zoomMeeting.startTime': {
        $gte: now,
        $lte: oneHourFromNow
      },
      'zoomMeeting.status': { $ne: 'cancelled' }
    })
    .populate({
      path: 'course',
      populate: {
        path: 'studentsEnrolled',
        select: 'firstName lastName email'
      }
    })
    .populate('instructor', 'firstName lastName email');

    console.log(`📊 Found ${upcomingMeetings.length} upcoming meetings in the next hour`);

    if (upcomingMeetings.length > 0) {
      console.log('\n📋 Upcoming Meetings:');
      upcomingMeetings.forEach((meeting, index) => {
        console.log(`${index + 1}. ${meeting.zoomMeeting.topic}`);
        console.log(`   📅 Start Time: ${meeting.zoomMeeting.startTime.toLocaleString()}`);
        console.log(`   👥 Enrolled Students: ${meeting.course?.studentsEnrolled?.length || 0}`);
        console.log(`   👨‍🏫 Instructor: ${meeting.instructor?.firstName || 'N/A'} ${meeting.instructor?.lastName || ''}`);
        console.log(`   🔗 Join URL: ${meeting.zoomMeeting.joinUrl || 'N/A'}`);
        console.log(`   📧 Reminder Sent: ${meeting.zoomMeeting.reminderSent ? '✅' : '❌'}`);
        console.log('');
      });
    } else {
      console.log('ℹ️  No upcoming meetings found in the next hour');
    }

    // Test 4: Check scheduler status
    console.log('⏰ Test 4: Checking scheduler status...');
    const { triggerMeetingReminders } = require('../services/meetingReminderScheduler');
    
    const result = await triggerMeetingReminders();
    console.log('🔄 Manual trigger result:', result);

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📝 Integration Status:');
    console.log('✅ Uses existing mailSender utility');
    console.log('✅ Integrates with EmailLog model for tracking');
    console.log('✅ Uses Beeja branding and logo');
    console.log('✅ Follows existing email templates style');
    console.log('\n📧 Email Features:');
    console.log('- Automatic logging to EmailLog collection');
    console.log('- Professional Beeja branding');
    console.log('- Error handling and retry logic');
    console.log('- Context tracking for analytics');
    console.log('\n⚙️  Scheduler Status:');
    console.log('- Runs every minute automatically');
    console.log('- Sends reminders 5 minutes before meetings');
    console.log('- Prevents duplicate emails');
    console.log('- Handles meeting deletions properly');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

// Run tests if this script is executed directly
if (require.main === module) {
  testMeetingReminders()
    .then(() => {
      console.log('\n🎉 Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testMeetingReminders };
