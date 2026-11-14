const ZoomRecording = require('../models/zoomRecording');
const SubSection = require('../models/subSection');
const Course = require('../models/course');
const User = require('../models/user');
const axios = require('axios');

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

/**
 * Fetch recordings for a specific meeting
 */
exports.getMeetingRecordings = async (req, res) => {
    try {
        const { meetingId } = req.params;
        
        console.log('📹 Fetching recordings for meeting:', meetingId);
        
        // Get Zoom access token
        const accessToken = await generateZoomToken();
        
        // Fetch recordings from Zoom API
        const recordingsResponse = await axios.get(
            `${ZOOM_API_BASE_URL}/meetings/${meetingId}/recordings`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const recordingsData = recordingsResponse.data;
        console.log('📹 Found recordings:', recordingsData.recording_files?.length || 0);
        
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
        
        // Process each recording file
        const processedRecordings = [];
        
        for (const recordingFile of recordingsData.recording_files || []) {
            // Check if recording already exists in database
            let recordingRecord = await ZoomRecording.findOne({
                recordingId: recordingFile.id,
                meetingId: meetingId
            });
            
            if (!recordingRecord) {
                // Create new recording record
                recordingRecord = new ZoomRecording({
                    meetingId,
                    recordingId: recordingFile.id,
                    topic: recordingsData.topic || subSection.zoomMeeting?.topic || 'Meeting Recording',
                    startTime: new Date(recordingsData.start_time),
                    duration: recordingFile.duration || 0,
                    fileSize: recordingFile.file_size || 0,
                    playUrl: recordingFile.play_url,
                    downloadUrl: recordingFile.download_url,
                    recordingType: recordingFile.recording_type || 'shared_screen_with_speaker_view',
                    password: recordingFile.password || '',
                    status: 'completed',
                    course: course?._id,
                    subSection: subSection._id,
                    instructor: subSection.zoomMeeting?.hostId || null
                });
                
                await recordingRecord.save();
                console.log(`✅ Created recording record: ${recordingFile.id}`);
            }
            
            processedRecordings.push({
                id: recordingFile.id,
                topic: recordingsData.topic || subSection.zoomMeeting?.topic || 'Meeting Recording',
                startTime: recordingsData.start_time,
                duration: recordingFile.duration || 0,
                fileSize: recordingFile.file_size || 0,
                playUrl: recordingFile.play_url,
                downloadUrl: recordingFile.download_url,
                recordingType: recordingFile.recording_type || 'shared_screen_with_speaker_view',
                password: recordingFile.password || '',
                fileType: recordingFile.file_type,
                databaseId: recordingRecord._id
            });
        }
        
        res.status(200).json({
            success: true,
            data: {
                meetingId,
                topic: recordingsData.topic || subSection.zoomMeeting?.topic || 'Meeting Recording',
                startTime: recordingsData.start_time,
                recordings: processedRecordings,
                totalRecordings: processedRecordings.length
            }
        });
        
    } catch (error) {
        console.error('❌ Error fetching meeting recordings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch meeting recordings',
            error: error.message
        });
    }
};

/**
 * Get all recordings for a course
 */
exports.getCourseRecordings = async (req, res) => {
    try {
        const { courseId } = req.params;
        
        console.log('📹 Getting recordings for course:', courseId);
        
        const recordings = await ZoomRecording.findByCourse(courseId);
        
        res.status(200).json({
            success: true,
            data: {
                courseId,
                recordings,
                totalRecordings: recordings.length
            }
        });
        
    } catch (error) {
        console.error('❌ Error getting course recordings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get course recordings',
            error: error.message
        });
    }
};
