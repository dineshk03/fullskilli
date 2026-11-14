const axios = require('axios');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const SubSection = require('../models/subSection');
const Course = require('../models/course');
const User = require('../models/user');

// Zoom API Configuration
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ZOOM_API_BASE_URL = 'https://api.zoom.us/v2';

// Generate Zoom OAuth 2.0 Token
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

// Create Zoom Meeting
exports.createZoomMeeting = async (req, res) => {
    try {
        console.log('🚀 CREATE ZOOM MEETING REQUEST RECEIVED');
        console.log('📝 Request body:', req.body);
        console.log('👤 User:', req.user?.id, req.user?.email, req.user?.accountType);

        const { subSectionId, title, description, startTime, duration, timezone = 'UTC' } = req.body;
        const userId = req.user.id;
        const userAccountType = req.user.accountType;

        // Validate required fields
        if (!subSectionId || !title || !startTime || !duration) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: subSectionId, title, startTime, duration'
            });
        }

        console.log('🔍 Looking up SubSection:', subSectionId);
        // Find and validate SubSection
        const subSection = await SubSection.findById(subSectionId)
            .populate('section')
            .lean();

        console.log('📋 SubSection found:', subSection ? 'Yes' : 'No');

        if (!subSection) {
            console.log('❌ SubSection not found');
            return res.status(404).json({
                success: false,
                message: 'SubSection not found'
            });
        }

        if (!subSection.section) {
            console.log('❌ Section not found for SubSection');
            return res.status(400).json({
                success: false,
                message: 'This lecture is not properly linked to a section'
            });
        }

        // Find the course that contains this section
        console.log('🔍 Looking up Course for section:', subSection.section._id);
        const course = await Course.findOne({
            courseContent: subSection.section._id
        }).select('instructor studentsEnrolled courseName').lean();

        console.log('📋 Course found:', course ? 'Yes' : 'No');
        console.log('🔍 Course instructor ID:', course?.instructor);
        console.log('🔍 Request user ID:', userId);
        console.log('🔍 Request user account type:', userAccountType);

        if (!course) {
            console.log('❌ Course not found for this section');
            return res.status(400).json({
                success: false,
                message: 'This lecture is not properly linked to a course'
            });
        }

        // Check permissions: Admins can create meetings for any course, instructors can only create for their own courses
        if (userAccountType === 'Admin') {
            console.log('✅ Admin user - can create meeting for any course');
        } else if (course.instructor.toString() !== userId) {
            console.log('❌ User is not the course instructor and not an admin');
            return res.status(403).json({
                success: false,
                message: 'Only the course instructor or admin can create meetings'
            });
        }

        console.log('✅ Permission validation passed');

        // Generate Zoom OAuth 2.0 token
        console.log('🔑 Generating Zoom OAuth 2.0 token...');
        const token = await generateZoomToken();
        console.log('✅ Zoom token generated successfully');

        // Prepare meeting data with enhanced security
        // Handle datetime-local format which may not include seconds
        let formattedStartTime;
        try {
            // If startTime doesn't include seconds, add them
            const startTimeStr = startTime.includes(':') && startTime.split(':').length === 2
                ? `${startTime}:00`
                : startTime;
            formattedStartTime = new Date(startTimeStr).toISOString();
            console.log('📅 Formatted start time:', formattedStartTime);
        } catch (error) {
            console.error('❌ Error formatting start time:', error);
            return res.status(400).json({
                success: false,
                message: 'Invalid start time format'
            });
        }

        const meetingData = {
            topic: title,
            type: 2, // Scheduled meeting
            start_time: formattedStartTime,
            duration: duration,
            timezone: timezone,
            agenda: description,
            settings: {
                host_video: true,
                participant_video: true,
                join_before_host: false,
                mute_upon_entry: true,
                waiting_room: true,
                audio: "both",
                auto_recording: "none"
            }
        };

        // Create meeting via Zoom API
        console.log('📅 Creating Zoom meeting with data:', JSON.stringify(meetingData, null, 2));
        const response = await axios.post(
            `${ZOOM_API_BASE_URL}/users/me/meetings`,
            meetingData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ Zoom meeting created successfully:', response.data.id);

        const zoomMeeting = response.data;

        // Update SubSection with Zoom meeting details
        const updatedSubSection = await SubSection.findByIdAndUpdate(
            subSectionId,
            {
                $set: {
                    zoomMeeting: {
                        meetingId: zoomMeeting.id,
                        meetingNumber: zoomMeeting.id,
                        hostId: zoomMeeting.host_id,
                        topic: zoomMeeting.topic,
                        agenda: zoomMeeting.agenda,
                        startTime: zoomMeeting.start_time,
                        duration: zoomMeeting.duration,
                        timezone: zoomMeeting.timezone,
                        joinUrl: zoomMeeting.join_url,
                        startUrl: zoomMeeting.start_url,
                        password: zoomMeeting.password,
                        status: 'scheduled',
                        createdAt: new Date()
                    }
                }
            },
            { new: true }
        ).populate({
            path: 'section'
        });

        // Send email notifications to enrolled students
        console.log('🔍 Checking for email notifications...');

        try {
            // Find the course that contains this subsection
            const course = await Course.findOne({
                courseContent: updatedSubSection.section
            }).populate('studentsEnrolled', 'firstName lastName email');

            console.log('Section exists:', !!updatedSubSection.section);
            console.log('Course found:', !!course);
            console.log('Students enrolled:', course?.studentsEnrolled?.length || 0);

            if (course?.studentsEnrolled) {
                console.log('📧 Sending Zoom meeting creation emails...');
                const { sendZoomMeetingCreatedEmail } = require('../services/emailService');
                await sendZoomMeetingCreatedEmail(updatedSubSection._id, updatedSubSection.zoomMeeting, course);
                console.log('✅ Email sending process completed');
            } else {
                console.log('⚠️ No course or enrolled students found - skipping email notifications');
            }
        } catch (emailError) {
            console.error('❌ Error in email sending:', emailError);
            // Don't fail the whole request if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Zoom meeting created successfully',
            data: {
                subSection: updatedSubSection,
                zoomMeeting: {
                    id: zoomMeeting.id,
                    topic: zoomMeeting.topic,
                    startTime: zoomMeeting.start_time,
                    duration: zoomMeeting.duration,
                    joinUrl: zoomMeeting.join_url,
                    password: zoomMeeting.password
                }
            }
        });

    } catch (error) {
        console.error('❌ Error creating Zoom meeting:', error.message);

        if (error.response) {
            console.error('🔍 Zoom API Response Error:');
            console.error('  Status:', error.response.status);
            console.error('  Status Text:', error.response.statusText);
            console.error('  Error Data:', JSON.stringify(error.response.data, null, 2));
            console.error('  Headers:', error.response.headers);

            return res.status(error.response.status).json({
                success: false,
                message: error.response.data?.message || 'Zoom API Error',
                error: error.response.data,
                details: {
                    code: error.response.data?.code,
                    message: error.response.data?.message,
                    errors: error.response.data?.errors
                }
            });
        }

        console.error('🔍 General Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create Zoom meeting',
            error: error.message
        });
    }
};

// Update Zoom Meeting
exports.updateZoomMeeting = async (req, res) => {
    try {
        const { subSectionId } = req.params;
        const { title, description, startTime, duration, timezone } = req.body;
        const instructorId = req.user.id;

        // Get SubSection with Zoom meeting
        const subSection = await SubSection.findById(subSectionId).populate('section');

        if (!subSection || !subSection.zoomMeeting) {
            return res.status(404).json({
                success: false,
                message: 'SubSection or Zoom meeting not found'
            });
        }

        // Find the course that contains this section
        const course = await Course.findOne({
            courseContent: subSection.section._id
        }).select('instructor').lean();

        if (!course) {
            return res.status(400).json({
                success: false,
                message: 'This lecture is not properly linked to a course'
            });
        }

        if (course.instructor.toString() !== instructorId) {
            return res.status(403).json({
                success: false,
                message: 'Only the course instructor can update meetings'
            });
        }

        const token = await generateZoomToken();
        const meetingId = subSection.zoomMeeting.meetingId;

        // Prepare update data
        const updateData = {};
        if (title) updateData.topic = title;
        if (description) updateData.agenda = description;
        if (startTime) updateData.start_time = moment(startTime).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
        if (duration) updateData.duration = parseInt(duration);
        if (timezone) updateData.timezone = timezone;

        // Update meeting via Zoom API
        await axios.patch(
            `${ZOOM_API_BASE_URL}/meetings/${meetingId}`,
            updateData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Update SubSection
        const updatedFields = {};
        if (title) updatedFields['zoomMeeting.topic'] = title;
        if (description) updatedFields['zoomMeeting.agenda'] = description;
        if (startTime) updatedFields['zoomMeeting.startTime'] = startTime;
        if (duration) updatedFields['zoomMeeting.duration'] = duration;
        if (timezone) updatedFields['zoomMeeting.timezone'] = timezone;

        const updatedSubSection = await SubSection.findByIdAndUpdate(
            subSectionId,
            { $set: updatedFields },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Zoom meeting updated successfully',
            data: updatedSubSection
        });

    } catch (error) {
        console.error('Error updating Zoom meeting:', error);

        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: 'Zoom API Error',
                error: error.response.data
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update Zoom meeting',
            error: error.message
        });
    }
};

// Delete Zoom Meeting
exports.deleteZoomMeeting = async (req, res) => {
    try {
        console.log('🗑️ DELETE ZOOM MEETING REQUEST RECEIVED');
        console.log('👤 User:', req.user?.id, req.user?.email, req.user?.accountType);

        const { subSectionId } = req.params;
        const userId = req.user.id;
        const userAccountType = req.user.accountType;

        // Get SubSection with Zoom meeting
        const subSection = await SubSection.findById(subSectionId).populate('section');

        if (!subSection || !subSection.zoomMeeting) {
            return res.status(404).json({
                success: false,
                message: 'SubSection or Zoom meeting not found'
            });
        }

        // Find the course that contains this section
        const course = await Course.findOne({
            courseContent: subSection.section._id
        }).select('instructor').lean();

        if (!course) {
            return res.status(400).json({
                success: false,
                message: 'This lecture is not properly linked to a course'
            });
        }

        // Check permissions: Admins can delete any meeting, instructors can only delete their own
        if (userAccountType === 'Admin') {
            console.log('✅ Admin user - can delete any meeting');
        } else if (course.instructor.toString() !== userId) {
            console.log('❌ User is not the course instructor and not an admin');
            return res.status(403).json({
                success: false,
                message: 'Only the course instructor or admin can delete meetings'
            });
        }

        const meetingId = subSection.zoomMeeting.meetingId;

        // Only call Zoom API for real meetings (not test meetings)
        if (meetingId && !String(meetingId).startsWith('999') && !String(meetingId).startsWith('123')) {
            try {
                const token = await generateZoomToken();

                // Delete meeting via Zoom API
                await axios.delete(
                    `${ZOOM_API_BASE_URL}/meetings/${meetingId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
            } catch (zoomError) {
                console.log('Zoom API delete failed (might be test meeting):', zoomError.message);
                // Continue with database deletion even if Zoom API fails
            }
        } else {
            console.log('Skipping Zoom API call for test meeting:', meetingId);
        }

        // Get SubSection with section details before deletion for email notification
        const subSectionForEmail = await SubSection.findById(subSectionId);

        // Find the course that contains this subsection
        const courseForEmail = await Course.findOne({
            courseContent: subSectionForEmail.section
        }).populate('studentsEnrolled', 'firstName lastName email');

        // Remove Zoom meeting from SubSection
        const updatedSubSection = await SubSection.findByIdAndUpdate(
            subSectionId,
            {
                $unset: {
                    zoomMeeting: 1
                }
            },
            { new: true }
        );

        // Send email notifications about meeting deletion
        if (courseForEmail?.studentsEnrolled && subSection.zoomMeeting) {
            const { sendZoomMeetingDeletedEmail } = require('../services/emailService');
            await sendZoomMeetingDeletedEmail(subSectionForEmail._id, subSection.zoomMeeting, courseForEmail);
        }

        res.status(200).json({
            success: true,
            message: 'Zoom meeting deleted successfully',
            data: updatedSubSection
        });

    } catch (error) {
        console.error('Error deleting Zoom meeting:', error);

        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: 'Zoom API Error',
                error: error.response.data
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to delete Zoom meeting',
            error: error.message
        });
    }
};

// Get Zoom Meeting Details
exports.getZoomMeeting = async (req, res) => {
    try {
        const { subSectionId } = req.params;
        const userId = req.user.id;

        const subSection = await SubSection.findById(subSectionId).populate('section');

        if (!subSection) {
            return res.status(404).json({
                success: false,
                message: 'SubSection not found'
            });
        }

        // Find the course that contains this section
        const course = await Course.findOne({
            courseContent: subSection.section._id
        }).select('instructor studentsEnrolled');

        if (!course) {
            return res.status(400).json({
                success: false,
                message: 'This lecture is not properly linked to a course'
            });
        }

        // Check if user has access (instructor or enrolled student)
        const isInstructor = course.instructor.toString() === userId;
        const isEnrolledStudent = course.studentsEnrolled.includes(userId);

        if (!isInstructor && !isEnrolledStudent) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You must be enrolled in this course.'
            });
        }

        if (!subSection.zoomMeeting) {
            return res.status(404).json({
                success: false,
                message: 'No Zoom meeting scheduled for this lecture'
            });
        }

        // Return appropriate data based on user role
        const meetingData = {
            id: subSection.zoomMeeting.meetingId,
            topic: subSection.zoomMeeting.topic,
            agenda: subSection.zoomMeeting.agenda,
            startTime: subSection.zoomMeeting.startTime,
            duration: subSection.zoomMeeting.duration,
            timezone: subSection.zoomMeeting.timezone,
            status: subSection.zoomMeeting.status
        };

        if (isInstructor) {
            meetingData.startUrl = subSection.zoomMeeting.startUrl;
            meetingData.hostId = subSection.zoomMeeting.hostId;
        }

        meetingData.joinUrl = subSection.zoomMeeting.joinUrl;
        meetingData.password = subSection.zoomMeeting.password;

        res.status(200).json({
            success: true,
            data: {
                meeting: meetingData,
                userRole: isInstructor ? 'instructor' : 'student'
            }
        });

    } catch (error) {
        console.error('Error getting Zoom meeting:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get Zoom meeting details',
            error: error.message
        });
    }
};

// Get All Zoom Meetings for Instructor
exports.getInstructorZoomMeetings = async (req, res) => {
    try {
        console.log('=== GET INSTRUCTOR ZOOM MEETINGS ===');
        console.log('User:', req.user);

        const instructorId = req.user.id;
        console.log('Instructor ID:', instructorId);

        // Find all courses taught by this instructor
        const courses = await Course.find({ instructor: instructorId })
            .populate({
                path: 'courseContent',
                populate: {
                    path: 'subSection',
                    select: 'title zoomMeeting'
                }
            });

        console.log(`Found ${courses.length} courses for instructor`);

        const meetings = [];
        courses.forEach(course => {
            course.courseContent.forEach(section => {
                if (section.subSection) {
                    section.subSection.forEach(subSection => {
                        // Check if subSection has a valid zoom meeting
                        if (subSection.zoomMeeting &&
                            subSection.zoomMeeting.meetingId &&
                            subSection.zoomMeeting.topic) {
                            meetings.push({
                                subSectionId: subSection._id,
                                subSectionTitle: subSection.title,
                                courseTitle: course.courseName,
                                sectionName: section.sectionName,
                                meeting: subSection.zoomMeeting
                            });
                        }
                    });
                }
            });
        });

        console.log(`Found ${meetings.length} meetings for instructor`);

        res.status(200).json({
            success: true,
            data: meetings,
            message: meetings.length > 0 ? 'Meetings loaded successfully' : 'No meetings found'
        });

    } catch (error) {
        console.error('Error getting instructor meetings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get instructor meetings',
            error: error.message
        });
    }
};

// Get Student's Upcoming Zoom Meetings
exports.getStudentZoomMeetings = async (req, res) => {
    try {
        const studentId = req.user.id;

        const student = await User.findById(studentId).populate({
            path: 'courses',
            populate: {
                path: 'courseContent',
                populate: {
                    path: 'subSection',
                    match: { zoomMeeting: { $exists: true } },
                    select: 'title zoomMeeting'
                }
            }
        });

        const meetings = [];
        student.courses.forEach(course => {
            course.courseContent.forEach(section => {
                section.subSection.forEach(subSection => {
                    if (subSection.zoomMeeting) {
                        meetings.push({
                            subSectionId: subSection._id,
                            subSectionTitle: subSection.title,
                            courseTitle: course.courseName,
                            meeting: {
                                id: subSection.zoomMeeting.meetingId,
                                topic: subSection.zoomMeeting.topic,
                                startTime: subSection.zoomMeeting.startTime,
                                duration: subSection.zoomMeeting.duration,
                                joinUrl: subSection.zoomMeeting.joinUrl,
                                password: subSection.zoomMeeting.password,
                                status: subSection.zoomMeeting.status
                            }
                        });
                    }
                });
            });
        });

        // Sort by start time
        meetings.sort((a, b) => new Date(a.meeting.startTime) - new Date(b.meeting.startTime));

        res.status(200).json({
            success: true,
            data: meetings
        });

    } catch (error) {
        console.error('Error getting student meetings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get student meetings',
            error: error.message
        });
    }
};

// Get All Zoom Meetings for Admin
exports.getAllAdminZoomMeetings = async (req, res) => {
    try {
        console.log('=== GET ALL ADMIN ZOOM MEETINGS ===');
        console.log('User:', req.user);

        // Find all courses and populate their sections and subsections
        const courses = await Course.find({})
            .populate({
                path: 'courseContent',
                populate: {
                    path: 'subSection',
                    match: { 'zoomMeeting': { $exists: true, $ne: null } },
                    select: 'title zoomMeeting section',
                    populate: {
                        path: 'zoomMeeting.participants.userId',
                        select: 'firstName lastName email'
                    }
                }
            })
            .populate('instructor', 'firstName lastName email')
            .populate('studentsEnrolled', 'firstName lastName email')
            .lean();

        console.log(`Found ${courses.length} courses`);

        const meetings = [];
        const now = new Date();

        courses.forEach(course => {
            course.courseContent.forEach(section => {
                if (section.subSection) {
                    section.subSection.forEach(subSection => {
                        if (subSection.zoomMeeting) {
                            const zoomMeeting = subSection.zoomMeeting;

                            // Calculate meeting status and analytics
                            const startTime = new Date(zoomMeeting.startTime);
                            const endTime = zoomMeeting.endTime ? new Date(zoomMeeting.endTime) :
                                new Date(startTime.getTime() + (zoomMeeting.duration || 60) * 60000);

                            let status = 'scheduled';
                            if (zoomMeeting.status === 'cancelled') {
                                status = 'cancelled';
                            } else if (now >= startTime && now <= endTime) {
                                status = 'live';
                            } else if (now > endTime) {
                                status = 'ended';
                            } else if (now < startTime) {
                                status = 'upcoming';
                            }

                            // Calculate participant statistics
                            const participants = zoomMeeting.participants || [];
                            const totalParticipants = participants.length;
                            const attendedCount = participants.filter(p => p.status === 'attended').length;
                            const leftEarlyCount = participants.filter(p => p.status === 'left-early').length;
                            const noShowCount = participants.filter(p => p.status === 'no-show').length;

                            // Calculate attendance rate
                            const enrolledStudents = course.studentsEnrolled || [];
                            const attendanceRate = enrolledStudents.length > 0 ?
                                (attendedCount / enrolledStudents.length * 100).toFixed(1) : 0;

                            meetings.push({
                                _id: subSection._id,
                                courseId: course._id, // Add courseId here
                                title: subSection.title,
                                courseTitle: course.courseName,
                                courseInstructor: course.instructor,
                                sectionName: section.sectionName,
                                zoomMeeting: {
                                    ...zoomMeeting,
                                    // Enhanced analytics
                                    status,
                                    totalParticipants,
                                    attendedCount,
                                    leftEarlyCount,
                                    noShowCount,
                                    attendanceRate: parseFloat(attendanceRate),
                                    enrolledStudents: enrolledStudents.length,
                                    participants: participants.map(p => ({
                                        userId: p.userId,
                                        name: p.name || (p.userId && `${p.userId.firstName} ${p.userId.lastName}`) || 'Unknown',
                                        email: p.email || (p.userId && p.userId.email) || 'unknown@example.com',
                                        joinTime: p.joinTime,
                                        leaveTime: p.leaveTime,
                                        duration: p.duration,
                                        status: p.status
                                    }))
                                }
                            });
                        }
                    });
                }
            });
        });

        console.log(`Processed ${meetings.length} meetings for admin`);

        res.status(200).json({
            success: true,
            data: meetings,
            message: meetings.length > 0 ? 'Admin meetings loaded successfully' : 'No meetings found'
        });

    } catch (error) {
        console.error('Error getting admin meetings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get admin meetings',
            error: error.message
        });
    }
};

/**
 * Validate meeting security settings
 */
exports.validateMeetingSecurity = async (req, res) => {
    try {
        const { meetingId } = req.params;

        console.log('🔒 Validating meeting security:', meetingId);

        // Find the subsection with the meeting
        const subSection = await SubSection.findOne({ 'zoomMeeting.meetingId': meetingId })
            .populate('section')
            .populate({
                path: 'section',
                populate: {
                    path: 'course'
                }
            });

        if (!subSection) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        const meeting = subSection.zoomMeeting;
        const course = subSection.section.course;

        // Security validation checks
        const securityChecks = {
            waitingRoomEnabled: meeting.settings?.waiting_room || false,
            requireLogin: meeting.settings?.enforce_login || false,
            meetingAuthentication: meeting.settings?.meeting_authentication || false,
            watermarkEnabled: meeting.settings?.watermark || false,
            joinBeforeHost: meeting.settings?.join_before_host || false,
            allowMultipleDevices: meeting.settings?.allow_multiple_devices || false,
            muteOnEntry: meeting.settings?.mute_upon_entry || false,
            autoRecording: meeting.settings?.auto_recording === 'cloud',
            usePersonalMeetingId: meeting.settings?.use_pmi || false
        };

        // Calculate security score
        let securityScore = 0;
        const maxScore = 100;

        // Weight different security features
        if (securityChecks.waitingRoomEnabled) securityScore += 20;
        if (securityChecks.requireLogin) securityScore += 15;
        if (securityChecks.meetingAuthentication) securityScore += 15;
        if (securityChecks.watermarkEnabled) securityScore += 10;
        if (!securityChecks.joinBeforeHost) securityScore += 10;
        if (!securityChecks.allowMultipleDevices) securityScore += 10;
        if (securityChecks.muteOnEntry) securityScore += 10;
        if (securityChecks.autoRecording) securityScore += 5;
        if (!securityChecks.usePersonalMeetingId) securityScore += 5;

        // Security recommendations
        const recommendations = [];

        if (!securityChecks.waitingRoomEnabled) {
            recommendations.push('Enable waiting room to screen participants');
        }

        if (!securityChecks.requireLogin) {
            recommendations.push('Require login to prevent anonymous access');
        }

        if (!securityChecks.meetingAuthentication) {
            recommendations.push('Enable meeting authentication for additional security');
        }

        if (!securityChecks.watermarkEnabled) {
            recommendations.push('Enable watermark to prevent unauthorized recording');
        }

        if (securityChecks.joinBeforeHost) {
            recommendations.push('Disable join before host to maintain control');
        }

        if (securityChecks.allowMultipleDevices) {
            recommendations.push('Disable multiple device joins to prevent sharing');
        }

        // Security level classification
        let securityLevel = 'Low';
        let securityColor = '#ef4444'; // Red

        if (securityScore >= 80) {
            securityLevel = 'High';
            securityColor = '#22c55e'; // Green
        } else if (securityScore >= 60) {
            securityLevel = 'Medium';
            securityColor = '#f59e0b'; // Orange
        }

        res.status(200).json({
            success: true,
            data: {
                meetingId,
                securityScore,
                securityLevel,
                securityColor,
                securityChecks,
                recommendations,
                meetingInfo: {
                    topic: meeting.topic,
                    startTime: meeting.startTime,
                    duration: meeting.duration,
                    courseName: course?.courseName || 'Unknown Course'
                }
            }
        });

    } catch (error) {
        console.error('❌ Error validating meeting security:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate meeting security',
            error: error.message
        });
    }
};
