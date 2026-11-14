const express = require('express');
const { triggerMeetingReminders } = require('../services/meetingReminderScheduler');
const { auth } = require('../middleware/auth');
const router = express.Router();

/**
 * Manual trigger for meeting reminders (for testing)
 * POST /api/v1/meeting-reminders/trigger
 */
router.post('/trigger', auth, async (req, res) => {
  try {
    // Only allow admin or instructor to trigger manually
    if (req.user.accountType !== 'Admin' && req.user.accountType !== 'Instructor') {
      return res.status(403).json({
        success: false,
        message: 'Only admin or instructor can trigger meeting reminders'
      });
    }

    const result = await triggerMeetingReminders();
    
    res.status(200).json({
      success: true,
      message: 'Meeting reminder check completed',
      data: result
    });
  } catch (error) {
    console.error('Error triggering meeting reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger meeting reminders',
      error: error.message
    });
  }
});

/**
 * Get upcoming meetings (for admin dashboard)
 * GET /api/v1/meeting-reminders/upcoming
 */
router.get('/upcoming', auth, async (req, res) => {
  try {
    const SubSection = require('../models/subSection');
    const now = new Date();
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
      select: 'courseName'
    })
    .populate('instructor', 'firstName lastName')
    .select('title zoomMeeting course instructor');

    res.status(200).json({
      success: true,
      data: upcomingMeetings
    });
  } catch (error) {
    console.error('Error fetching upcoming meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming meetings',
      error: error.message
    });
  }
});

/**
 * Test email template (for development)
 * POST /api/v1/meeting-reminders/test-email
 */
router.post('/test-email', auth, async (req, res) => {
  try {
    // Only allow admin to test emails
    if (req.user.accountType !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can test email templates'
      });
    }

    const { sendToUser } = req.body;
    const { sendMeetingReminder } = require('../services/emailService');
    
    // Create a test meeting object
    const testMeeting = {
      topic: 'Test Zoom Meeting - ' + new Date().toLocaleString(),
      startTime: new Date(Date.now() + 5 * 60000),
      duration: 60,
      joinUrl: 'https://zoom.us/test',
      password: '123456'
    };

    // Send test email to the requesting user
    await sendMeetingReminder('test-subsection-id', testMeeting);

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      sentTo: req.user.email
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

module.exports = router;
