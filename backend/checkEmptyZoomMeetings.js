const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/lms')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const SubSection = require('./models/subSection');

async function checkEmptyZoomMeetings() {
  try {
    console.log('🔍 Checking for empty Zoom meeting objects...');
    
    // Find subsections with zoomMeeting that exists but is empty
    const emptyZoomMeetings = await SubSection.find({
      'zoomMeeting': { $exists: true },
      $or: [
        { 'zoomMeeting.meetingId': { $exists: false } },
        { 'zoomMeeting.meetingId': null },
        { 'zoomMeeting.meetingId': '' }
      ]
    }).select('title zoomMeeting createdAt').lean();
    
    console.log(`📊 Found ${emptyZoomMeetings.length} subsections with empty Zoom meeting objects:`);
    
    emptyZoomMeetings.forEach((ss, index) => {
      const createdTime = ss.createdAt ? new Date(ss.createdAt).toLocaleString() : 'Unknown';
      console.log(`\n${index + 1}. ${ss.title}`);
      console.log(`   Created: ${createdTime}`);
      console.log(`   Zoom Meeting Object: ${JSON.stringify(ss.zoomMeeting, null, 2)}`);
    });
    
    // Let's also check the raw MongoDB document structure
    console.log('\n🔍 Checking raw document structure...');
    const rawSubsection = await SubSection.findOne({ zoomMeeting: { $exists: true } });
    if (rawSubsection) {
      console.log('Raw zoomMeeting field:', JSON.stringify(rawSubsection.zoomMeeting, null, 2));
      console.log('zoomMeeting field type:', typeof rawSubsection.zoomMeeting);
      console.log('zoomMeeting field keys:', rawSubsection.zoomMeeting ? Object.keys(rawSubsection.zoomMeeting) : 'None');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

checkEmptyZoomMeetings();
