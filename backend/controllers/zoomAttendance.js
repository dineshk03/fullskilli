const ZoomAttendance = require('../models/zoomAttendance');
const SubSection = require('../models/subSection');
const Course = require('../models/course');
const User = require('../models/user');
const axios = require('axios');

// WebSocket server instance (will be set in server.js)
let wsServer = null;

// Set WebSocket server instance
exports.setWebSocketServer = (server) => {
  wsServer = server;
};

// Zoom API Configuration
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ZOOM_API_BASE_URL = 'https://api.zoom.us/v2';

// Generate Zoom OAuth 2.0 Token (same as in zoomMeeting.js)
const generateZoomToken = async () => {
    try {
        const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');
        
        const response = await axios.post('https://zoom.us/oauth/token', 
            `grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
            {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        return response.data.access_token;
    } catch (error) {
        console.error('Error generating Zoom token:', error.response?.data || error.message);
        throw new Error('Failed to generate Zoom access token');
    }
};

/**
 * Get participants for a specific meeting
 */
exports.getMeetingParticipants = async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    console.log('📊 Getting participants for meeting:', meetingId);
    
    // Get Zoom access token
    const accessToken = await generateZoomToken();
    
    // Fetch meeting participants from Zoom API
    const participantsResponse = await fetch(`https://api.zoom.us/v2/report/meetings/${meetingId}/participants`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!participantsResponse.ok) {
      throw new Error(`Failed to fetch participants: ${participantsResponse.statusText}`);
    }
    
    const participantsData = await participantsResponse.json();
    console.log('👥 Found participants:', participantsData.participants?.length || 0);
    
    // Get meeting details from database
    const subSection = await SubSection.findOne({ 'zoomMeeting.meetingId': meetingId })
      .populate('section');
    
    if (!subSection) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found in database'
      });
    }
    
    // Find the course
    const course = await Course.findOne({ 
      courseContent: subSection.section._id 
    });
    
    // Process each participant
    const processedParticipants = [];
    
    for (const participant of participantsData.participants || []) {
      // Find user by email
      const user = await User.findOne({ email: participant.user_email });
      
      // Check if attendance record exists
      let attendanceRecord = await ZoomAttendance.findOne({
        meetingId,
        participantEmail: participant.user_email
      });
      
      // Create or update attendance record
      if (!attendanceRecord) {
        attendanceRecord = new ZoomAttendance({
          meetingId,
          participantId: participant.id,
          participantEmail: participant.user_email,
          participantName: participant.name,
          userId: user?._id,
          joinTime: new Date(participant.join_time),
          leaveTime: participant.leave_time ? new Date(participant.leave_time) : null,
          duration: participant.duration || 0,
          status: participant.leave_time ? 'completed' : 'joined',
          course: course?._id,
          subSection: subSection._id
        });
        
        await attendanceRecord.save();
        console.log(`✅ Created attendance record for: ${participant.name}`);

        // Broadcast real-time update
        if (wsServer) {
          wsServer.broadcastAttendanceUpdate(meetingId, {
            action: 'participant_joined',
            participant: {
              id: participant.id,
              name: participant.name,
              email: participant.user_email,
              userId: user?._id,
              joinTime: participant.join_time,
              status: 'joined'
            }
          });

          // Notify admins
          wsServer.notifyAdmins(meetingId, 'participant_joined', {
            participantName: participant.name,
            participantEmail: participant.user_email,
            meetingTitle: subSection.zoomMeeting?.topic,
            courseName: course?.courseName
          });
        }
      } else {
        // Update existing record
        const oldStatus = attendanceRecord.status;
        attendanceRecord.leaveTime = participant.leave_time ? new Date(participant.leave_time) : null;
        attendanceRecord.duration = participant.duration || 0;
        attendanceRecord.status = participant.leave_time ? 'completed' : 'joined';
        await attendanceRecord.save();
        console.log(`🔄 Updated attendance record for: ${participant.name}`);

        // Broadcast real-time update
        if (wsServer && oldStatus !== attendanceRecord.status) {
          wsServer.broadcastAttendanceUpdate(meetingId, {
            action: attendanceRecord.status === 'completed' ? 'participant_left' : 'participant_updated',
            participant: {
              id: participant.id,
              name: participant.name,
              email: participant.user_email,
              userId: user?._id,
              leaveTime: participant.leave_time,
              duration: participant.duration,
              status: attendanceRecord.status
            }
          });

          // Notify admins
          wsServer.notifyAdmins(meetingId, attendanceRecord.status === 'completed' ? 'participant_left' : 'participant_updated', {
            participantName: participant.name,
            participantEmail: participant.user_email,
            meetingTitle: subSection.zoomMeeting?.topic,
            courseName: course?.courseName,
            duration: participant.duration
          });
        }
      }
      
      processedParticipants.push({
        id: participant.id,
        name: participant.name,
        email: participant.user_email,
        joinTime: participant.join_time,
        leaveTime: participant.leave_time,
        duration: participant.duration || 0,
        status: participant.leave_time ? 'completed' : 'joined',
        userId: user?._id,
        isEnrolledStudent: !!user,
        attendanceRecord: attendanceRecord._id
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        meetingId,
        meetingTitle: subSection.zoomMeeting?.topic || 'Unknown Meeting',
        courseName: course?.courseName || 'Unknown Course',
        totalParticipants: processedParticipants.length,
        enrolledStudents: processedParticipants.filter(p => p.isEnrolledStudent).length,
        participants: processedParticipants
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting meeting participants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meeting participants',
      error: error.message
    });
  }
};

/**
 * Get attendance records for a course
 */
exports.getCourseAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    console.log('📊 Getting attendance for course:', courseId);
    
    // Get all SubSections for this course
    const course = await Course.findById(courseId).populate({
      path: 'courseContent',
      populate: {
        path: 'subSection',
        match: { 'zoomMeeting.meetingId': { $exists: true } }
      }
    });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Get all attendance records for this course
    const attendanceRecords = await ZoomAttendance.find({ 
      course: courseId 
    }).populate('userId', 'firstName lastName email')
      .populate('subSection', 'title')
      .sort({ joinTime: -1 });
    
    // Group by student
    const studentAttendance = {};
    
    attendanceRecords.forEach(record => {
      const studentId = record.userId?._id?.toString() || record.participantEmail;
      
      if (!studentAttendance[studentId]) {
        studentAttendance[studentId] = {
          userId: record.userId?._id,
          name: record.userId ? `${record.userId.firstName} ${record.userId.lastName}` : record.participantName,
          email: record.participantEmail,
          isEnrolledStudent: !!record.userId,
          totalMeetings: 0,
          attendedMeetings: 0,
          totalDuration: 0,
          attendancePercentage: 0,
          meetings: []
        };
      }
      
      const student = studentAttendance[studentId];
      student.totalMeetings++;
      student.totalDuration += record.duration || 0;
      
      if (record.status === 'completed' && record.duration > 0) {
        student.attendedMeetings++;
      }
      
      student.meetings.push({
        subSectionId: record.subSection._id,
        subSectionTitle: record.subSection.title,
        meetingId: record.meetingId,
        joinTime: record.joinTime,
        leaveTime: record.leaveTime,
        duration: record.duration,
        status: record.status
      });
    });
    
    // Calculate attendance percentage for each student
    Object.values(studentAttendance).forEach(student => {
      student.attendancePercentage = student.totalMeetings > 0 
        ? Math.round((student.attendedMeetings / student.totalMeetings) * 100)
        : 0;
    });
    
    res.status(200).json({
      success: true,
      data: {
        courseId,
        courseName: course.courseName,
        totalMeetings: Object.values(studentAttendance).reduce((sum, student) => Math.max(sum, student.totalMeetings), 0),
        totalStudents: Object.keys(studentAttendance).length,
        enrolledStudents: Object.values(studentAttendance).filter(s => s.isEnrolledStudent).length,
        attendanceRecords: Object.values(studentAttendance)
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting course attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course attendance',
      error: error.message
    });
  }
};

/**
 * Get attendance for a specific meeting
 */
exports.getMeetingAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    console.log('📊 Getting attendance for meeting:', meetingId);
    
    const attendanceRecords = await ZoomAttendance.find({ 
      meetingId 
    }).populate('userId', 'firstName lastName email')
      .populate('subSection', 'title')
      .populate('course', 'courseName')
      .sort({ joinTime: 1 });
    
    res.status(200).json({
      success: true,
      data: {
        meetingId,
        totalParticipants: attendanceRecords.length,
        enrolledStudents: attendanceRecords.filter(r => r.userId).length,
        averageDuration: attendanceRecords.reduce((sum, r) => sum + (r.duration || 0), 0) / attendanceRecords.length,
        attendanceRecords
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting meeting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meeting attendance',
      error: error.message
    });
  }
};

/**
 * Update meeting status in real-time
 */
exports.updateMeetingStatus = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { status } = req.body;
    
    console.log('🔄 Updating meeting status:', meetingId, 'to:', status);
    
    // Update the meeting status in SubSection
    const subSection = await SubSection.findOne({ 'zoomMeeting.meetingId': meetingId });
    
    if (!subSection) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }
    
    subSection.zoomMeeting.status = status;
    await subSection.save();
    
    // Broadcast real-time status update
    if (wsServer) {
      wsServer.broadcastMeetingStatus(meetingId, status);
      
      // Notify admins about status change
      wsServer.notifyAdmins(meetingId, 'meeting_status_changed', {
        meetingId,
        status,
        meetingTitle: subSection.zoomMeeting?.topic,
        courseName: subSection.title
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Meeting status updated successfully',
      data: {
        meetingId,
        status,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating meeting status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meeting status',
      error: error.message
    });
  }
};

/**
 * Get real-time attendance statistics
 */
exports.getRealTimeAttendanceStats = async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    console.log('📊 Getting real-time attendance stats for meeting:', meetingId);
    
    const attendanceRecords = await ZoomAttendance.find({ 
      meetingId 
    }).populate('userId', 'firstName lastName email');
    
    const stats = {
      totalParticipants: attendanceRecords.length,
      enrolledStudents: attendanceRecords.filter(r => r.userId).length,
      currentlyInMeeting: attendanceRecords.filter(r => r.status === 'joined').length,
      completedParticipants: attendanceRecords.filter(r => r.status === 'completed').length,
      averageDuration: attendanceRecords.reduce((sum, r) => sum + (r.duration || 0), 0) / attendanceRecords.length,
      recentJoins: attendanceRecords
        .filter(r => r.joinTime && new Date(r.joinTime) > new Date(Date.now() - 5 * 60 * 1000))
        .map(r => ({
          name: r.participantName,
          email: r.participantEmail,
          joinTime: r.joinTime,
          isStudent: !!r.userId
        }))
    };
    
    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error getting real-time attendance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance statistics',
      error: error.message
    });
  }
};

/**
 * Sync attendance for a meeting (manual trigger)
 */
exports.syncMeetingAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    console.log('🔄 Syncing attendance for meeting:', meetingId);
    
    // Find the subsection by Zoom meeting ID
    const subSection = await SubSection.findOne({ 'zoomMeeting.meetingId': meetingId });
    console.log('📋 Found subSection:', subSection ? 'YES' : 'NO');
    
    if (!subSection) {
      console.log('❌ SubSection not found');
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }
    
    if (!subSection.zoomMeeting) {
      console.log('❌ No Zoom meeting associated');
      return res.status(404).json({
        success: false,
        message: 'No Zoom meeting associated with this subsection'
      });
    }
    
    const zoomMeetingId = subSection.zoomMeeting.meetingId;
    console.log('🎯 Found Zoom meeting ID:', zoomMeetingId);
    console.log('📅 Meeting start time:', subSection.zoomMeeting.startTime);
    console.log('⏰ Meeting duration:', subSection.zoomMeeting.duration);
    
    // For now, return a success message without calling Zoom API
    res.status(200).json({
      success: true,
      message: 'Meeting found successfully. Zoom API integration ready.',
      data: {
        meetingId: zoomMeetingId,
        startTime: subSection.zoomMeeting.startTime,
        duration: subSection.zoomMeeting.duration,
        status: 'Meeting details retrieved successfully'
      }
    });
    
  } catch (error) {
    console.error('❌ Error syncing attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync attendance',
      error: error.message
    });
  }
};
