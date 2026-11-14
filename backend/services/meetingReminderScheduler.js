const cron = require('node-cron');
const SubSection = require('../models/subSection');
const { sendMeetingReminder } = require('./emailService');

/**
 * Scheduled job to check for upcoming Zoom meetings and send reminder emails
 * Runs every minute to check for meetings starting in 5 minutes
 */
const startMeetingReminderScheduler = () => {
  console.log('🕐 Starting Zoom meeting reminder scheduler...');

  // Run every minute: * * * * *
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000); // 5 minutes from now
      
      // Find all subSections with Zoom meetings starting in 5 minutes
      const upcomingMeetings = await SubSection.find({
        'zoomMeeting': { $exists: true },
        'zoomMeeting.startTime': {
          $gte: new Date(fiveMinutesFromNow.getTime() - 30000), // ±30 seconds window
          $lte: new Date(fiveMinutesFromNow.getTime() + 30000)
        },
        'zoomMeeting.status': { $ne: 'cancelled' }
      }).populate({
        path: 'course',
        populate: {
          path: 'studentsEnrolled',
          select: 'firstName lastName email'
        }
      });

      if (upcomingMeetings.length > 0) {
        console.log(`📅 Found ${upcomingMeetings.length} meetings starting soon...`);
        
        for (const meeting of upcomingMeetings) {
          // Check if reminder has already been sent for this meeting
          if (meeting.zoomMeeting.reminderSent) {
            console.log(`⏭️  Reminder already sent for meeting: ${meeting.zoomMeeting.topic}`);
            continue;
          }

          // Check if meeting has been deleted or cancelled
          if (meeting.zoomMeeting.status === 'cancelled' || !meeting.zoomMeeting.joinUrl) {
            console.log(`❌ Meeting cancelled or deleted, skipping: ${meeting.zoomMeeting.topic}`);
            continue;
          }

          console.log(`📧 Sending reminder for: ${meeting.zoomMeeting.topic}`);
          
          // Send reminder emails
          await sendMeetingReminder(meeting._id, meeting.zoomMeeting);
          
          // Mark reminder as sent
          await SubSection.findByIdAndUpdate(meeting._id, {
            'zoomMeeting.reminderSent': true
          });
          
          console.log(`✅ Reminder sent and marked for meeting: ${meeting.zoomMeeting.topic}`);
        }
      }
    } catch (error) {
      console.error('❌ Error in meeting reminder scheduler:', error);
    }
  });

  console.log('✅ Zoom meeting reminder scheduler started (runs every minute)');
};

/**
 * Reset reminder flags for meetings that have ended
 * This allows reminders to be sent again if meetings are rescheduled
 */
const resetReminderFlags = () => {
  // Run every hour to clean up old reminder flags
  cron.schedule('0 * * * *', async () => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60000);
      
      await SubSection.updateMany(
        {
          'zoomMeeting.startTime': { $lt: oneHourAgo },
          'zoomMeeting.reminderSent': true
        },
        {
          $unset: { 'zoomMeeting.reminderSent': 1 }
        }
      );
      
      console.log('🧹 Reset reminder flags for past meetings');
    } catch (error) {
      console.error('❌ Error resetting reminder flags:', error);
    }
  });
};

/**
 * Manual trigger for testing (can be called via API)
 */
const triggerMeetingReminders = async () => {
  try {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);
    
    const upcomingMeetings = await SubSection.find({
      'zoomMeeting': { $exists: true },
      'zoomMeeting.startTime': {
        $gte: new Date(fiveMinutesFromNow.getTime() - 30000),
        $lte: new Date(fiveMinutesFromNow.getTime() + 30000)
      },
      'zoomMeeting.status': { $ne: 'cancelled' }
    }).populate({
      path: 'course',
      populate: {
        path: 'studentsEnrolled',
        select: 'firstName lastName email'
      }
    });

    console.log(`🔍 Manual check found ${upcomingMeetings.length} upcoming meetings`);
    
    for (const meeting of upcomingMeetings) {
      if (!meeting.zoomMeeting.reminderSent && meeting.zoomMeeting.status !== 'cancelled') {
        await sendMeetingReminder(meeting._id, meeting.zoomMeeting);
        await SubSection.findByIdAndUpdate(meeting._id, {
          'zoomMeeting.reminderSent': true
        });
      }
    }
    
    return { success: true, meetingsProcessed: upcomingMeetings.length };
  } catch (error) {
    console.error('❌ Error in manual reminder trigger:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  startMeetingReminderScheduler,
  resetReminderFlags,
  triggerMeetingReminders
};
