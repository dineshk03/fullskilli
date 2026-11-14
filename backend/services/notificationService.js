const nodemailer = require('nodemailer');
const cron = require('node-cron');
const SubSection = require('../models/subSection');
const Course = require('../models/course');
const User = require('../models/user');

// Email transporter configuration
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Send meeting reminder email
 */
const sendMeetingReminder = async (meeting, user, reminderType) => {
  try {
    const transporter = createEmailTransporter();
    
    const emailTemplates = {
      '1hour': {
        subject: `Reminder: ${meeting.topic} starts in 1 hour`,
        text: `Hi ${user.firstName},\n\nThis is a reminder that your meeting "${meeting.topic}" starts in 1 hour.\n\nMeeting Details:\n- Topic: ${meeting.topic}\n- Time: ${new Date(meeting.startTime).toLocaleString()}\n- Duration: ${meeting.duration} minutes\n\nJoin URL: ${meeting.joinUrl}\n\nSee you there!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
              <h2 style="margin: 0;">Meeting Reminder</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
              <p>Hi ${user.firstName},</p>
              <p>This is a reminder that your meeting <strong>"${meeting.topic}"</strong> starts in <strong>1 hour</strong>.</p>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="color: #333; margin-top: 0;">Meeting Details:</h3>
                <p><strong>Topic:</strong> ${meeting.topic}</p>
                <p><strong>Time:</strong> ${new Date(meeting.startTime).toLocaleString()}</p>
                <p><strong>Duration:</strong> ${meeting.duration} minutes</p>
              </div>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="${meeting.joinUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">
                  Join Meeting
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">See you there!</p>
            </div>
          </div>
        `
      },
      '24hour': {
        subject: `Upcoming: ${meeting.topic} tomorrow`,
        text: `Hi ${user.firstName},\n\nThis is a reminder that you have a meeting "${meeting.topic}" scheduled for tomorrow.\n\nMeeting Details:\n- Topic: ${meeting.topic}\n- Time: ${new Date(meeting.startTime).toLocaleString()}\n- Duration: ${meeting.duration} minutes\n\nJoin URL: ${meeting.joinUrl}\n\nDon't forget to attend!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
              <h2 style="margin: 0;">Upcoming Meeting</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
              <p>Hi ${user.firstName},</p>
              <p>You have a meeting <strong>"${meeting.topic}"</strong> scheduled for <strong>tomorrow</strong>.</p>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="color: #333; margin-top: 0;">Meeting Details:</h3>
                <p><strong>Topic:</strong> ${meeting.topic}</p>
                <p><strong>Time:</strong> ${new Date(meeting.startTime).toLocaleString()}</p>
                <p><strong>Duration:</strong> ${meeting.duration} minutes</p>
              </div>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="${meeting.joinUrl}" style="background: #f093fb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">
                  View Meeting Details
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">Don't forget to attend!</p>
            </div>
          </div>
        `
      },
      'instant': {
        subject: `Meeting Started: ${meeting.topic}`,
        text: `Hi ${user.firstName},\n\nYour meeting "${meeting.topic}" has started!\n\nJoin now: ${meeting.joinUrl}\n\nMeeting Details:\n- Topic: ${meeting.topic}\n- Duration: ${meeting.duration} minutes\n\nDon't be late!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
              <h2 style="margin: 0;">🔴 Meeting Started!</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
              <p>Hi ${user.firstName},</p>
              <p>Your meeting <strong>"${meeting.topic}"</strong> has <strong>started</strong>!</p>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="color: #333; margin-top: 0;">Meeting Details:</h3>
                <p><strong>Topic:</strong> ${meeting.topic}</p>
                <p><strong>Duration:</strong> ${meeting.duration} minutes</p>
              </div>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="${meeting.joinUrl}" style="background: #fa709a; color: white; padding: 15px 35px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                  Join Now
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">Don't be late!</p>
            </div>
          </div>
        `
      }
    };

    const template = emailTemplates[reminderType] || emailTemplates['1hour'];
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      ...template
    });
    
    console.log(`✅ ${reminderType} reminder sent to ${user.email} for meeting: ${meeting.topic}`);
    
  } catch (error) {
    console.error('❌ Error sending meeting reminder:', error);
  }
};

/**
 * Schedule meeting reminders
 */
const scheduleMeetingReminders = async () => {
  try {
    console.log('📅 Scheduling meeting reminders...');
    
    // Find all upcoming Zoom meetings
    const upcomingMeetings = await SubSection.find({
      'zoomMeeting': { $exists: true },
      'zoomMeeting.startTime': { 
        $gte: new Date(),
        $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
      }
    }).populate('zoomMeeting');
    
    for (const subSection of upcomingMeetings) {
      const meeting = subSection.zoomMeeting;
      const meetingTime = new Date(meeting.startTime);
      const now = new Date();
      
      // Get course and enrolled students
      const course = await Course.findOne({ 
        courseContent: subSection.section 
      }).populate('studentsEnrolled instructor');
      
      if (!course) continue;
      
      const recipients = [course.instructor, ...course.studentsEnrolled];
      
      // Schedule 1-hour reminder
      const oneHourBefore = new Date(meetingTime.getTime() - 60 * 60 * 1000);
      if (oneHourBefore > now && oneHourBefore <= new Date(now.getTime() + 60 * 60 * 1000)) {
        setTimeout(() => {
          recipients.forEach(user => {
            if (user && user.email) {
              sendMeetingReminder(meeting, user, '1hour');
            }
          });
        }, oneHourBefore.getTime() - now.getTime());
      }
      
      // Schedule 24-hour reminder
      const oneDayBefore = new Date(meetingTime.getTime() - 24 * 60 * 60 * 1000);
      if (oneDayBefore > now && oneDayBefore <= new Date(now.getTime() + 60 * 60 * 1000)) {
        setTimeout(() => {
          recipients.forEach(user => {
            if (user && user.email) {
              sendMeetingReminder(meeting, user, '24hour');
            }
          });
        }, oneDayBefore.getTime() - now.getTime());
      }
    }
    
    console.log(`✅ Scheduled reminders for ${upcomingMeetings.length} upcoming meetings`);
    
  } catch (error) {
    console.error('❌ Error scheduling meeting reminders:', error);
  }
};

/**
 * Send instant meeting start notification
 */
const sendMeetingStartNotification = async (meetingId) => {
  try {
    const subSection = await SubSection.findOne({ 
      'zoomMeeting.meetingId': meetingId 
    }).populate('zoomMeeting');
    
    if (!subSection || !subSection.zoomMeeting) {
      console.log('❌ Meeting not found for start notification');
      return;
    }
    
    const meeting = subSection.zoomMeeting;
    const course = await Course.findOne({ 
      courseContent: subSection.section 
    }).populate('studentsEnrolled instructor');
    
    if (!course) return;
    
    const recipients = [course.instructor, ...course.studentsEnrolled];
    
    // Send instant notifications
    recipients.forEach(user => {
      if (user && user.email) {
        sendMeetingReminder(meeting, user, 'instant');
      }
    });
    
    console.log(`📢 Sent meeting start notifications for: ${meeting.topic}`);
    
  } catch (error) {
    console.error('❌ Error sending meeting start notification:', error);
  }
};

/**
 * Send attendance alert to instructor
 */
const sendAttendanceAlert = async (meetingId, alertType, data) => {
  try {
    const subSection = await SubSection.findOne({ 
      'zoomMeeting.meetingId': meetingId 
    }).populate('zoomMeeting');
    
    if (!subSection || !subSection.zoomMeeting) return;
    
    const course = await Course.findOne({ 
      courseContent: subSection.section 
    }).populate('instructor');
    
    if (!course || !course.instructor) return;
    
    const transporter = createEmailTransporter();
    
    const alertTemplates = {
      'low_attendance': {
        subject: `⚠️ Low Attendance Alert: ${subSection.zoomMeeting.topic}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
              <h2 style="margin: 0;">⚠️ Low Attendance Alert</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
              <p>Hi ${course.instructor.firstName},</p>
              <p>Your meeting <strong>"${subSection.zoomMeeting.topic}"</strong> has low attendance.</p>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="color: #333; margin-top: 0;">Attendance Details:</h3>
                <p><strong>Expected Students:</strong> ${data.expectedStudents}</p>
                <p><strong>Actual Attendees:</strong> ${data.actualAttendees}</p>
                <p><strong>Attendance Rate:</strong> ${data.attendanceRate}%</p>
              </div>
              
              <p style="color: #666; font-size: 14px;">You may want to check if students are having trouble joining.</p>
            </div>
          </div>
        `
      },
      'student_left_early': {
        subject: `📊 Student Left Early: ${subSection.zoomMeeting.topic}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
              <h2 style="margin: 0;">📊 Student Left Early</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
              <p>Hi ${course.instructor.firstName},</p>
              <p>A student left your meeting <strong>"${subSection.zoomMeeting.topic}"</strong> early.</p>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="color: #333; margin-top: 0;">Details:</h3>
                <p><strong>Student:</strong> ${data.studentName}</p>
                <p><strong>Duration Attended:</strong> ${data.durationAttended}</p>
                <p><strong>Total Meeting Duration:</strong> ${data.totalDuration}</p>
              </div>
              
              <p style="color: #666; font-size: 14px;">You may want to follow up with the student.</p>
            </div>
          </div>
        `
      }
    };
    
    const template = alertTemplates[alertType];
    if (template) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: course.instructor.email,
        subject: template.subject,
        html: template.html
      });
      
      console.log(`📧 Sent ${alertType} alert to instructor: ${course.instructor.email}`);
    }
    
  } catch (error) {
    console.error('❌ Error sending attendance alert:', error);
  }
};

// Initialize notification scheduler
const initializeNotificationSystem = () => {
  // Schedule reminders every hour
  cron.schedule('0 * * * *', scheduleMeetingReminders);
  console.log('📅 Notification system initialized - scheduling reminders every hour');
};

module.exports = {
  sendMeetingReminder,
  scheduleMeetingReminders,
  sendMeetingStartNotification,
  sendAttendanceAlert,
  initializeNotificationSystem
};
