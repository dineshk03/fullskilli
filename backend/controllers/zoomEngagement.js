const ZoomEngagement = require('../models/zoomEngagement');
const SubSection = require('../models/subSection');
const Course = require('../models/course');

/**
 * Track engagement event
 * POST /api/v1/zoom/engagement/track
 */
exports.trackEngagementEvent = async (req, res) => {
    try {
        const { meetingId, subSectionId, event, details } = req.body;
        const studentId = req.user.id;

        console.log('📊 Tracking engagement event:', { meetingId, event, studentId });

        // Validate required fields
        if (!meetingId || !subSectionId || !event) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: meetingId, subSectionId, event'
            });
        }

        // Find or create engagement record
        let engagement = await ZoomEngagement.findOne({
            meetingId,
            student: studentId
        });

        if (!engagement) {
            console.log('Creating new engagement record...');

            // Get course and subsection info
            const subSection = await SubSection.findById(subSectionId).populate('section');

            if (!subSection) {
                return res.status(404).json({
                    success: false,
                    message: 'SubSection not found'
                });
            }

            const course = await Course.findOne({ courseContent: subSection.section._id });

            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found for this subsection'
                });
            }

            engagement = new ZoomEngagement({
                meetingId,
                subSection: subSectionId,
                course: course._id,
                student: studentId,
                attendance: {
                    joinTime: event === 'joined' ? new Date() : undefined
                }
            });
        }

        // Add event to timeline
        await engagement.addEvent(event, details);

        // Update specific metrics based on event type
        if (event === 'joined') {
            engagement.attendance.joinTime = new Date();
            engagement.attendance.status = 'attended';
        } else if (event === 'left') {
            engagement.attendance.leaveTime = new Date();
            if (engagement.attendance.joinTime) {
                const duration = (new Date() - engagement.attendance.joinTime) / 1000;
                engagement.attendance.duration = duration;
            }
        }

        await engagement.save();

        console.log('✅ Engagement tracked successfully');

        res.status(200).json({
            success: true,
            message: 'Engagement tracked successfully',
            data: {
                participationScore: engagement.participationScore,
                event: event
            }
        });
    } catch (error) {
        console.error('❌ Error tracking engagement:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track engagement',
            error: error.message
        });
    }
};

/**
 * Update engagement metrics
 * PATCH /api/v1/zoom/engagement/update
 */
exports.updateEngagementMetrics = async (req, res) => {
    try {
        const { meetingId, subSectionId, metrics } = req.body;
        const studentId = req.user.id;

        console.log('📈 Updating engagement metrics:', { meetingId, metrics });

        let engagement = await ZoomEngagement.findOne({
            meetingId,
            student: studentId
        });

        if (!engagement) {
            // Create new engagement record if it doesn't exist
            const subSection = await SubSection.findById(subSectionId).populate('section');
            const course = await Course.findOne({ courseContent: subSection.section._id });

            engagement = new ZoomEngagement({
                meetingId,
                subSection: subSectionId,
                course: course._id,
                student: studentId
            });
        }

        // Update metrics
        if (metrics.activeTime) {
            engagement.engagement.activeTime += metrics.activeTime;
        }

        if (metrics.cameraOnTime) {
            engagement.attention.cameraOnTime += metrics.cameraOnTime;
        }

        if (metrics.micOnTime) {
            engagement.attention.micOnTime += metrics.micOnTime;
        }

        // Recalculate focus score based on activity
        if (engagement.attendance.duration > 0) {
            const activeRatio = engagement.engagement.activeTime / engagement.attendance.duration;
            engagement.attention.focusScore = Math.min(100, Math.round(activeRatio * 100));
        }

        await engagement.save();

        res.status(200).json({
            success: true,
            message: 'Engagement updated successfully',
            data: {
                participationScore: engagement.participationScore,
                focusScore: engagement.attention.focusScore
            }
        });
    } catch (error) {
        console.error('❌ Error updating engagement:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update engagement',
            error: error.message
        });
    }
};

/**
 * Get meeting engagement stats
 * GET /api/v1/zoom/engagement/meeting/:meetingId
 */
exports.getMeetingEngagement = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const userRole = req.user.accountType;

        console.log('📊 Getting meeting engagement:', { meetingId, userRole });

        // Check if user has permission to view this data
        if (userRole !== 'Instructor' && userRole !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Only instructors and admins can view meeting engagement'
            });
        }

        const stats = await ZoomEngagement.getMeetingStats(meetingId);
        const engagements = await ZoomEngagement.find({ meetingId })
            .populate('student', 'firstName lastName email image')
            .sort({ participationScore: -1 });

        // Calculate additional insights
        const topPerformers = engagements.slice(0, 5);
        const needsAttention = engagements.filter(e => e.participationScore < 50);
        const averageScore = stats.avgParticipation || 0;

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    ...stats,
                    attendanceRate: stats.totalStudents > 0
                        ? Math.round((stats.attended / stats.totalStudents) * 100)
                        : 0
                },
                engagements,
                insights: {
                    topPerformers,
                    needsAttention,
                    averageScore,
                    totalStudents: stats.totalStudents
                }
            }
        });
    } catch (error) {
        console.error('❌ Error getting meeting engagement:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get meeting engagement',
            error: error.message
        });
    }
};

/**
 * Get student engagement
 * GET /api/v1/zoom/engagement/student/:studentId
 */
exports.getStudentEngagement = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { courseId } = req.query;
        const requesterId = req.user.id;
        const userRole = req.user.accountType;

        console.log('📊 Getting student engagement:', { studentId, courseId });

        // Check permissions - students can only view their own data
        if (userRole === 'Student' && studentId !== requesterId) {
            return res.status(403).json({
                success: false,
                message: 'You can only view your own engagement data'
            });
        }

        const stats = await ZoomEngagement.getStudentEngagement(studentId, courseId);
        const engagements = await ZoomEngagement.find({
            student: studentId,
            ...(courseId && { course: courseId })
        })
            .populate('subSection', 'title')
            .populate('course', 'courseName')
            .sort({ createdAt: -1 })
            .limit(20);

        // Calculate trends
        const recentEngagements = engagements.slice(0, 5);
        const recentAvg = recentEngagements.length > 0
            ? recentEngagements.reduce((sum, e) => sum + e.participationScore, 0) / recentEngagements.length
            : 0;

        const trend = recentAvg > stats.avgParticipation ? 'improving' :
            recentAvg < stats.avgParticipation ? 'declining' : 'stable';

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    ...stats,
                    attendanceRate: stats.totalMeetings > 0
                        ? Math.round((stats.attended / stats.totalMeetings) * 100)
                        : 0
                },
                engagements,
                insights: {
                    trend,
                    recentAverage: Math.round(recentAvg),
                    totalMeetings: stats.totalMeetings,
                    attended: stats.attended
                }
            }
        });
    } catch (error) {
        console.error('❌ Error getting student engagement:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get student engagement',
            error: error.message
        });
    }
};

/**
 * Get engagement analytics for a course
 * GET /api/v1/zoom/engagement/course/:courseId
 */
exports.getCourseEngagement = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userRole = req.user.accountType;

        console.log('📊 Getting course engagement:', { courseId });

        // Check permissions
        if (userRole !== 'Instructor' && userRole !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Only instructors and admins can view course engagement'
            });
        }

        const engagements = await ZoomEngagement.find({ course: courseId })
            .populate('student', 'firstName lastName email')
            .populate('subSection', 'title');

        // Calculate course-wide statistics
        const totalEngagements = engagements.length;
        const avgParticipation = totalEngagements > 0
            ? engagements.reduce((sum, e) => sum + e.participationScore, 0) / totalEngagements
            : 0;

        const attendanceStats = {
            attended: engagements.filter(e => e.attendance.status === 'attended').length,
            late: engagements.filter(e => e.attendance.status === 'late').length,
            leftEarly: engagements.filter(e => e.attendance.status === 'left-early').length,
            noShow: engagements.filter(e => e.attendance.status === 'no-show').length
        };

        // Group by student
        const studentMap = new Map();
        engagements.forEach(e => {
            const studentId = e.student._id.toString();
            if (!studentMap.has(studentId)) {
                studentMap.set(studentId, {
                    student: e.student,
                    meetings: [],
                    avgScore: 0
                });
            }
            studentMap.get(studentId).meetings.push(e);
        });

        // Calculate average scores per student
        const studentStats = Array.from(studentMap.values()).map(s => {
            s.avgScore = s.meetings.reduce((sum, m) => sum + m.participationScore, 0) / s.meetings.length;
            return s;
        }).sort((a, b) => b.avgScore - a.avgScore);

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalEngagements,
                    avgParticipation: Math.round(avgParticipation),
                    attendanceStats
                },
                studentStats: studentStats.slice(0, 20), // Top 20 students
                topPerformers: studentStats.slice(0, 5),
                needsAttention: studentStats.filter(s => s.avgScore < 50)
            }
        });
    } catch (error) {
        console.error('❌ Error getting course engagement:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get course engagement',
            error: error.message
        });
    }
};
