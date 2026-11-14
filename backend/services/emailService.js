const mailSender = require('../utils/mailSender');
const SubSection = require('../models/subSection');
const Course = require('../models/course');
const User = require('../models/user');

/**
 * Send meeting reminder emails to all enrolled students
 * @param {string} subSectionId - The subSection ID of the meeting
 * @param {Object} meetingDetails - Zoom meeting details
 */
const sendMeetingReminder = async (subSectionId, meetingDetails) => {
  try {
    // Find the course that contains this subsection
    const subSection = await SubSection.findById(subSectionId);
    const course = await Course.findOne({
      courseContent: subSection.section
    }).populate('studentsEnrolled', 'firstName lastName email');

    if (!course) {
      console.log('Course not found for subSection:', subSectionId);
      return;
    }

    const enrolledStudents = course.studentsEnrolled || [];

    if (enrolledStudents.length === 0) {
      console.log('No enrolled students found for course:', course.courseName);
      return;
    }

    // Prepare email content
    const emailSubject = `🔔 Reminder: Zoom Meeting Starting Soon - ${meetingDetails.topic}`;
    const emailHtml = generateMeetingReminderEmail({
      courseName: course.courseName,
      meetingTitle: meetingDetails.topic,
      meetingTime: new Date(meetingDetails.startTime).toLocaleString(),
      duration: meetingDetails.duration,
      joinUrl: meetingDetails.joinUrl,
      password: meetingDetails.password,
      instructorName: 'Course Instructor' // Fixed: no instructor field available
    });

    // Send emails to all enrolled students using existing mailSender
    const emailPromises = enrolledStudents.map(async (student) => {
      if (!student.email) {
        console.log(`⚠️ Skipping student with no email: ${student.firstName} ${student.lastName}`);
        return { success: false, email: student.email, error: 'No email address' };
      }

      try {
        await mailSender(
          student.email,
          emailSubject,
          emailHtml,
          [], // No additional attachments
          'zoom-meeting-reminder' // Context for logging
        );
        console.log(`✅ Reminder email sent to: ${student.email}`);
        return { success: true, email: student.email };
      } catch (error) {
        console.error(`❌ Failed to send email to ${student.email}:`, error);
        return { success: false, email: student.email, error: error.message };
      }
    });

    // Send copy to instructor
    let instructorResult = null;
    if (instructor && instructor.email) {
      try {
        await mailSender(
          instructor.email,
          `[INSTRUCTOR COPY] ${emailSubject}`,
          emailHtml,
          [], // No additional attachments
          'zoom-meeting-reminder-instructor' // Context for logging
        );
        console.log(`✅ Reminder email sent to instructor: ${instructor.email}`);
        instructorResult = { success: true, email: instructor.email };
      } catch (error) {
        console.error(`❌ Failed to send email to instructor ${instructor.email}:`, error);
        instructorResult = { success: false, email: instructor.email, error: error.message };
      }
    }

    const results = await Promise.all(emailPromises);

    // Count successful and failed emails
    const successfulEmails = results.filter(result => result.success);
    const failedEmails = results.filter(result => !result.success);

    console.log(`📊 Reminder Email Summary for ${course.courseName}:`);
    console.log(`✅ Successful: ${successfulEmails.length}/${enrolledStudents.length} students`);
    console.log(`❌ Failed: ${failedEmails.length}/${enrolledStudents.length} students`);
    if (instructorResult) {
      console.log(`👨‍🏫 Instructor: ${instructorResult.success ? '✅ Sent' : '❌ Failed'}`);
    }

    if (failedEmails.length > 0) {
      console.log(`🔍 Failed email details:`);
      failedEmails.forEach(result => {
        console.log(`  - ${result.email}: ${result.error}`);
      });
    }

    if (successfulEmails.length === 0) {
      console.error(`🚨 CRITICAL: All reminder emails failed for ${course.courseName}!`);
      throw new Error(`Failed to send any reminder emails for course: ${course.courseName}`);
    } else if (failedEmails.length > 0) {
      console.warn(`⚠️ WARNING: Some reminder emails failed for ${course.courseName}`);
    } else {
      console.log(`🎉 SUCCESS: All reminder emails sent successfully for ${course.courseName}`);
    }

  } catch (error) {
    console.error('Error sending meeting reminder:', error);
  }
};

/**
 * Generate HTML email template for meeting reminder
 */
const generateMeetingReminderEmail = (details) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Zoom Meeting Reminder</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 2px solid #e0e0e0;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2196F3;
          margin-bottom: 10px;
        }
        .meeting-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #2196F3;
        }
        .meeting-title {
          font-size: 20px;
          font-weight: bold;
          color: #2196F3;
          margin-bottom: 15px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .info-label {
          font-weight: 600;
          color: #666;
        }
        .info-value {
          font-weight: 500;
        }
        .join-button {
          display: inline-block;
          background: linear-gradient(135deg, #2196F3, #1976D2);
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          transition: transform 0.2s;
        }
        .join-button:hover {
          transform: translateY(-2px);
        }
        .password-box {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
          text-align: center;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e0e0e0;
          color: #666;
          font-size: 14px;
        }
        .reminder-badge {
          background: #ff6b6b;
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          display: inline-block;
          margin-bottom: 15px;
        }
        .beeja-footer {
          margin-top: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          text-align: center;
        }
        .beeja-logo {
          width: 120px;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="cid:beeja-logo" alt="Beeja Innovative Ventures" class="beeja-logo">
          <div class="logo">Beeja Innovative Learning</div>
          <div class="reminder-badge">⏰ STARTING SOON</div>
          <h1>Zoom Meeting Reminder</h1>
        </div>

        <div class="meeting-info">
          <div class="meeting-title">${details.meetingTitle}</div>
          
          <div class="info-row">
            <span class="info-label">📚 Course:</span>
            <span class="info-value">${details.courseName}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">📅 Date & Time:</span>
            <span class="info-value">${details.meetingTime}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">⏱️ Duration:</span>
            <span class="info-value">${details.duration} minutes</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">👨‍🏫 Instructor:</span>
            <span class="info-value">${details.instructorName}</span>
          </div>
        </div>

        <div style="text-align: center;">
          <a href="${details.joinUrl}" class="join-button">
            📹 Join Meeting Now
          </a>
          
          ${details.password ? `
            <div class="password-box">
              <strong>🔐 Meeting Password:</strong> ${details.password}<br>
              <small>Please keep this password secure</small>
            </div>
          ` : ''}
        </div>

        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1976D2; margin-top: 0;">📝 Important Notes:</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Please join the meeting 2-3 minutes early to avoid technical issues</li>
            <li>Ensure your microphone and camera are working properly</li>
            <li>Find a quiet place with stable internet connection</li>
            <li>Have your course materials ready if needed</li>
          </ul>
        </div>

        <div class="beeja-footer">
          <p><strong>Beeja Innovative Ventures</strong></p>
          <p>Empowering Education Through Innovation</p>
          <p style="font-size: 12px; color: #666; margin-top: 10px;">
            This is an automated reminder from your LMS Platform.<br>
            If you don't want to receive these emails, please update your notification preferences.
          </p>
        </div>

        <div class="footer">
          <p>© 2024 Beeja Innovative Ventures. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const sendZoomMeetingCreatedEmail = async (subSectionId, meetingDetails, course) => {
  try {
    console.log('📧 sendZoomMeetingCreatedEmail called with:', { subSectionId, meetingTopic: meetingDetails.topic });

    if (!course) {
      console.log('❌ No course provided for meeting creation email');
      return;
    }

    const enrolledStudents = course.studentsEnrolled || [];
    console.log('🔍 Course:', course.courseName);
    console.log('👥 Enrolled students:', enrolledStudents.length);
    enrolledStudents.forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.firstName} ${student.lastName} - ${student.email}`);
    });

    if (enrolledStudents.length === 0) {
      console.log('❌ No enrolled students found for course:', course.courseName);
      return;
    }

    // Prepare email content
    const emailSubject = `🎉 New Zoom Meeting Scheduled - ${meetingDetails.topic}`;
    const emailHtml = generateZoomMeetingCreatedEmail({
      courseName: course.courseName,
      meetingTitle: meetingDetails.topic,
      meetingTime: new Date(meetingDetails.startTime).toLocaleString(),
      duration: meetingDetails.duration,
      joinUrl: meetingDetails.joinUrl,
      password: meetingDetails.password,
      instructorName: 'Course Instructor' // Fixed: no instructor field available
    });

    // Send emails to all enrolled students
    const emailPromises = enrolledStudents.map(async (student) => {
      if (!student.email) {
        console.log(`⚠️ Skipping student with no email: ${student.firstName} ${student.lastName}`);
        return { success: false, email: student.email, error: 'No email address' };
      }

      try {
        await mailSender(
          student.email,
          emailSubject,
          emailHtml,
          [], // No additional attachments
          'zoom_meeting_created'
        );
        console.log(`✅ Zoom meeting creation email sent to: ${student.email}`);
        return { success: true, email: student.email };
      } catch (error) {
        console.error(`❌ Failed to send meeting creation email to ${student.email}:`, error);
        return { success: false, email: student.email, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);

    // Count successful and failed emails
    const successfulEmails = results.filter(result => result.success);
    const failedEmails = results.filter(result => !result.success);

    console.log(`📊 Email Summary for ${meetingDetails.topic}:`);
    console.log(`✅ Successful: ${successfulEmails.length}/${enrolledStudents.length}`);
    console.log(`❌ Failed: ${failedEmails.length}/${enrolledStudents.length}`);

    if (failedEmails.length > 0) {
      console.log(`🔍 Failed email details:`);
      failedEmails.forEach(result => {
        console.log(`  - ${result.email}: ${result.error}`);
      });
    }

    if (successfulEmails.length === 0) {
      console.error(`🚨 CRITICAL: All emails failed for ${meetingDetails.topic}!`);
      throw new Error(`Failed to send any emails for meeting: ${meetingDetails.topic}`);
    } else if (failedEmails.length > 0) {
      console.warn(`⚠️ WARNING: Some emails failed for ${meetingDetails.topic}`);
    } else {
      console.log(`🎉 SUCCESS: All emails sent successfully for ${meetingDetails.topic}`);
    }

  } catch (error) {
    console.error('❌ Error sending Zoom meeting creation emails:', error);
  }
};

const sendZoomMeetingDeletedEmail = async (subSectionId, meetingDetails, course) => {
  try {
    console.log('📧 sendZoomMeetingDeletedEmail called with:', { subSectionId, meetingTopic: meetingDetails.topic });

    if (!course) {
      console.log('❌ No course provided for meeting deletion email');
      return;
    }

    const enrolledStudents = course.studentsEnrolled || [];
    console.log('🔍 Course:', course.courseName);
    console.log('👥 Enrolled students:', enrolledStudents.length);
    enrolledStudents.forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.firstName} ${student.lastName} - ${student.email}`);
    });

    if (enrolledStudents.length === 0) {
      console.log('❌ No enrolled students found for course:', course.courseName);
      return;
    }

    // Prepare email content
    const emailSubject = `🚨 Zoom Meeting Cancelled - ${meetingDetails.topic}`;
    const emailHtml = generateZoomMeetingDeletedEmail({
      courseName: course.courseName,
      meetingTitle: meetingDetails.topic,
      originalTime: new Date(meetingDetails.startTime).toLocaleString(),
      instructorName: 'Course Instructor' // Fixed: no instructor field available
    });

    // Send emails to all enrolled students
    const emailPromises = enrolledStudents.map(async (student) => {
      if (!student.email) {
        console.log(`⚠️ Skipping student with no email: ${student.firstName} ${student.lastName}`);
        return { success: false, email: student.email, error: 'No email address' };
      }

      try {
        await mailSender(
          student.email,
          emailSubject,
          emailHtml,
          [], // No additional attachments
          'zoom_meeting_deleted'
        );
        console.log(`✅ Zoom meeting deletion email sent to: ${student.email}`);
        return { success: true, email: student.email };
      } catch (error) {
        console.error(`❌ Failed to send meeting deletion email to ${student.email}:`, error);
        return { success: false, email: student.email, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);

    // Count successful and failed emails
    const successfulEmails = results.filter(result => result.success);
    const failedEmails = results.filter(result => !result.success);

    console.log(`📊 Email Summary for ${meetingDetails.topic}:`);
    console.log(`✅ Successful: ${successfulEmails.length}/${enrolledStudents.length}`);
    console.log(`❌ Failed: ${failedEmails.length}/${enrolledStudents.length}`);

    if (failedEmails.length > 0) {
      console.log(`🔍 Failed email details:`);
      failedEmails.forEach(result => {
        console.log(`  - ${result.email}: ${result.error}`);
      });
    }

    if (successfulEmails.length === 0) {
      console.error(`🚨 CRITICAL: All emails failed for ${meetingDetails.topic}!`);
      throw new Error(`Failed to send any emails for meeting deletion: ${meetingDetails.topic}`);
    } else if (failedEmails.length > 0) {
      console.warn(`⚠️ WARNING: Some emails failed for ${meetingDetails.topic}`);
    } else {
      console.log(`🎉 SUCCESS: All emails sent successfully for ${meetingDetails.topic}`);
    }

  } catch (error) {
    console.error('❌ Error sending Zoom meeting deletion emails:', error);
  }
};

const generateZoomMeetingCreatedEmail = (data) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Zoom Meeting Scheduled</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎉 New Zoom Meeting Scheduled</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">${data.courseName}</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
          <h2 style="color: #667eea; margin-top: 0;">Meeting Details</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>📝 Topic:</strong> ${data.meetingTitle}</p>
            <p style="margin: 10px 0;"><strong>📅 Date & Time:</strong> ${data.meetingTime}</p>
            <p style="margin: 10px 0;"><strong>⏱️ Duration:</strong> ${data.duration} minutes</p>
            <p style="margin: 10px 0;"><strong>👨‍🏫 Instructor:</strong> ${data.instructorName}</p>
            ${data.password ? `<p style="margin: 10px 0;"><strong>🔐 Password:</strong> ${data.password}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.joinUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              📹 Join Zoom Meeting
            </a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; color: #856404;"><strong>💡 Tips:</strong></p>
            <ul style="margin: 10px 0 0 20px; color: #856404;">
              <li>Join 5 minutes early to test your audio/video</li>
              <li>Make sure you have a stable internet connection</li>
              <li>Use headphones for better audio quality</li>
            </ul>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
          <p>This is an automated message from Beeja Academy Learning Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateZoomMeetingDeletedEmail = (data) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Zoom Meeting Cancelled</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🚨 Zoom Meeting Cancelled</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">${data.courseName}</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
          <h2 style="color: #ff6b6b; margin-top: 0;">Meeting Information</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>📝 Topic:</strong> ${data.meetingTitle}</p>
            <p style="margin: 10px 0;"><strong>📅 Originally Scheduled:</strong> ${data.originalTime}</p>
            <p style="margin: 10px 0;"><strong>👨‍🏫 Instructor:</strong> ${data.instructorName}</p>
          </div>
          
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #721c24;"><strong>⚠️ Important:</strong></p>
            <p style="margin: 10px 0 0 0; color: #721c24;">This Zoom meeting has been cancelled and will no longer take place at the scheduled time. Please disregard any previous invitations or calendar entries for this meeting.</p>
          </div>
          
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; color: #0c5460;"><strong>ℹ️ What's Next:</strong></p>
            <p style="margin: 10px 0 0 0; color: #0c5460;">Your instructor will provide information about rescheduling or alternative arrangements. Please check your course announcements for updates.</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
          <p>This is an automated message from Beeja Academy Learning Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send assignment creation email to enrolled students
 * @param {Object} assignment - Assignment details
 * @param {Object} course - Course details with enrolled students
 */
const sendAssignmentCreatedEmail = async (assignment, course) => {
  try {
    console.log('📧 sendAssignmentCreatedEmail called for:', assignment.title);

    if (!course || !course.studentsEnrolled) {
      console.log('❌ No course or enrolled students provided');
      return;
    }

    const enrolledStudents = course.studentsEnrolled;
    console.log(`👥 Sending to ${enrolledStudents.length} students`);

    if (enrolledStudents.length === 0) {
      console.log('❌ No enrolled students found');
      return;
    }

    // Prepare email content
    const emailSubject = `📝 New Assignment: ${assignment.title} - ${course.courseName}`;
    const emailHtml = generateAssignmentCreatedEmail({
      courseName: course.courseName,
      assignmentTitle: assignment.title,
      description: assignment.description,
      dueDate: new Date(assignment.dueDate).toLocaleString(),
      totalPoints: assignment.totalPoints,
      lateSubmissionAllowed: assignment.lateSubmissionAllowed,
      lateDeadline: assignment.lateDeadline ? new Date(assignment.lateDeadline).toLocaleString() : null
    });

    // Send emails to all enrolled students
    const emailPromises = enrolledStudents.map(async (student) => {
      if (!student.email) {
        console.log(`⚠️ Skipping student with no email: ${student.firstName} ${student.lastName}`);
        return { success: false, email: student.email, error: 'No email address' };
      }

      try {
        await mailSender(
          student.email,
          emailSubject,
          emailHtml,
          [],
          'assignment_created'
        );
        console.log(`✅ Assignment email sent to: ${student.email}`);
        return { success: true, email: student.email };
      } catch (error) {
        console.error(`❌ Failed to send assignment email to ${student.email}:`, error);
        return { success: false, email: student.email, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);

    const successfulEmails = results.filter(result => result.success);
    const failedEmails = results.filter(result => !result.success);

    console.log(`📊 Assignment Email Summary for ${assignment.title}:`);
    console.log(`✅ Successful: ${successfulEmails.length}/${enrolledStudents.length}`);
    console.log(`❌ Failed: ${failedEmails.length}/${enrolledStudents.length}`);

    if (failedEmails.length > 0) {
      console.log(`🔍 Failed email details:`);
      failedEmails.forEach(result => {
        console.log(`  - ${result.email}: ${result.error}`);
      });
    }

    return {
      success: successfulEmails.length > 0,
      sent: successfulEmails.length,
      failed: failedEmails.length,
      total: enrolledStudents.length
    };

  } catch (error) {
    console.error('❌ Error sending assignment creation emails:', error);
    throw error;
  }
};

/**
 * Generate HTML email template for assignment creation
 */
const generateAssignmentCreatedEmail = (data) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Assignment</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background: white;
          padding: 0;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .assignment-badge {
          background: #667eea;
          color: white;
          padding: 8px 20px;
          border-radius: 25px;
          font-size: 14px;
          font-weight: bold;
          display: inline-block;
          margin-bottom: 20px;
        }
        .assignment-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #667eea;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 12px 0;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: 600;
          color: #666;
        }
        .info-value {
          font-weight: 500;
          color: #333;
        }
        .description-box {
          background: #fff;
          border: 1px solid #e0e0e0;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .description-box h3 {
          margin-top: 0;
          color: #667eea;
        }
        .action-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 25px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          transition: transform 0.2s;
        }
        .action-button:hover {
          transform: translateY(-2px);
        }
        .deadline-warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
        }
        .deadline-warning strong {
          color: #856404;
          font-size: 18px;
        }
        .tips-box {
          background: #e3f2fd;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .tips-box h3 {
          color: #1976D2;
          margin-top: 0;
        }
        .tips-box ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .tips-box li {
          margin: 8px 0;
          color: #0d47a1;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e0e0e0;
          color: #666;
          font-size: 14px;
        }
        .points-badge {
          background: #4caf50;
          color: white;
          padding: 5px 15px;
          border-radius: 15px;
          font-weight: bold;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📝 New Assignment Posted!</h1>
          <p>${data.courseName}</p>
        </div>
        
        <div class="content">
          <div class="assignment-badge">NEW ASSIGNMENT</div>
          
          <h2 style="color: #667eea; margin-top: 0;">${data.assignmentTitle}</h2>
          
          <div class="assignment-info">
            <div class="info-row">
              <span class="info-label">📚 Course:</span>
              <span class="info-value">${data.courseName}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">📅 Due Date:</span>
              <span class="info-value" style="color: #ff6b6b; font-weight: bold;">${data.dueDate}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">⭐ Total Points:</span>
              <span class="info-value"><span class="points-badge">${data.totalPoints}</span></span>
            </div>
            
            ${data.lateSubmissionAllowed ? `
              <div class="info-row">
                <span class="info-label">⏰ Late Submission:</span>
                <span class="info-value" style="color: #ff9800;">Allowed until ${data.lateDeadline || 'TBD'}</span>
              </div>
            ` : `
              <div class="info-row">
                <span class="info-label">⏰ Late Submission:</span>
                <span class="info-value" style="color: #f44336;">Not Allowed</span>
              </div>
            `}
          </div>
          
          <div class="description-box">
            <h3>📋 Assignment Description</h3>
            <p>${data.description}</p>
          </div>
          
          <div class="deadline-warning">
            <p style="margin: 0;"><strong>⏰ Due: ${data.dueDate}</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #856404;">Don't miss the deadline!</p>
          </div>
          
          <div style="text-align: center;">
            <a href="#" class="action-button">
              📝 View Assignment & Submit
            </a>
          </div>
          
          <div class="tips-box">
            <h3>💡 Submission Tips</h3>
            <ul>
              <li>Read the assignment instructions carefully</li>
              <li>Start working on it early to avoid last-minute rush</li>
              <li>Check file format and size requirements</li>
              <li>Submit before the deadline to avoid penalties</li>
              <li>Keep a backup of your work</li>
            </ul>
          </div>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
            <p style="margin: 0;"><strong>Beeja Innovative Ventures</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
              Empowering Education Through Innovation
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from your LMS Platform.</p>
            <p>© 2024 Beeja Innovative Ventures. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  sendMeetingReminder,
  sendZoomMeetingCreatedEmail,
  sendZoomMeetingDeletedEmail,
  generateMeetingReminderEmail,
  generateZoomMeetingCreatedEmail,
  generateZoomMeetingDeletedEmail,
  sendAssignmentCreatedEmail,
  generateAssignmentCreatedEmail
};
