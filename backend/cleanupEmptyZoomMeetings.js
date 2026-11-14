const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/lms')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const SubSection = require('./models/subSection');

async function cleanupEmptyZoomMeetings() {
  try {
    console.log('🧹 Cleaning up empty Zoom meeting objects...');
    
    // Find subsections with empty zoomMeeting objects (only have default fields)
    const emptyZoomMeetings = await SubSection.find({
      'zoomMeeting': { $exists: true },
      $or: [
        { 'zoomMeeting.meetingId': { $exists: false } },
        { 'zoomMeeting.meetingId': null },
        { 'zoomMeeting.meetingId': '' }
      ]
    }).select('title zoomMeeting').lean();
    
    console.log(`📊 Found ${emptyZoomMeetings.length} subsections with empty Zoom meeting objects:`);
    
    for (const ss of emptyZoomMeetings) {
      console.log(`- Removing empty Zoom meeting from: ${ss.title}`);
      console.log(`  Current object: ${JSON.stringify(ss.zoomMeeting)}`);
    }
    
    // Remove all empty zoomMeeting objects
    const result = await SubSection.updateMany(
      { 
        'zoomMeeting': { $exists: true },
        $or: [
          { 'zoomMeeting.meetingId': { $exists: false } },
          { 'zoomMeeting.meetingId': null },
          { 'zoomMeeting.meetingId': '' }
        ]
      },
      { $unset: { zoomMeeting: 1 } }
    );
    
    console.log(`\n✅ Removed empty Zoom meetings from ${result.modifiedCount} subsections`);
    
    // Verify cleanup
    const remainingEmpty = await SubSection.countDocuments({
      'zoomMeeting': { $exists: true },
      $or: [
        { 'zoomMeeting.meetingId': { $exists: false } },
        { 'zoomMeeting.meetingId': null },
        { 'zoomMeeting.meetingId': '' }
      ]
    });
    
    const totalWithZoom = await SubSection.countDocuments({ 'zoomMeeting': { $exists: true } });
    
    console.log(`📊 Subsections with empty Zoom meetings: ${remainingEmpty}`);
    console.log(`📊 Total subsections with any Zoom meeting: ${totalWithZoom}`);
    
    if (remainingEmpty === 0 && totalWithZoom === 0) {
      console.log('\n🎉 SUCCESS: All Zoom meetings cleaned up!');
      console.log('✅ Schema fix applied - no more automatic empty Zoom objects');
      console.log('✅ New lectures will NOT get automatic Zoom meetings');
    } else {
      console.log('\n⚠️ Some Zoom meetings still exist - manual cleanup may be needed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

cleanupEmptyZoomMeetings();
