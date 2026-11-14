const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/lms')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const SubSection = require('./models/subSection');

async function cleanupRemainingZoomMeetings() {
  try {
    console.log('🧹 Cleaning up remaining Zoom meetings...');
    
    // Find subsections with Zoom meetings
    const zoomSubsections = await SubSection.find({ 'zoomMeeting': { $exists: true, $ne: null } })
      .select('title zoomMeeting')
      .lean();
    
    console.log(`📊 Found ${zoomSubsections.length} subsections with Zoom meetings to clean up:`);
    
    for (const ss of zoomSubsections) {
      console.log(`- Removing Zoom meeting from: ${ss.title}`);
      console.log(`  Previous topic: ${ss.zoomMeeting?.topic || 'No topic'}`);
    }
    
    // Remove all zoomMeeting objects
    const result = await SubSection.updateMany(
      { zoomMeeting: { $exists: true } },
      { $unset: { zoomMeeting: 1 } }
    );
    
    console.log(`\n✅ Removed Zoom meetings from ${result.modifiedCount} subsections`);
    
    // Verify cleanup
    const remaining = await SubSection.countDocuments({ 'zoomMeeting': { $exists: true } });
    console.log(`📊 Subsections still with Zoom meetings: ${remaining}`);
    
    if (remaining === 0) {
      console.log('🎉 All Zoom meetings cleaned up successfully!');
      console.log('\n📝 Status Summary:');
      console.log('✅ New lectures will NOT get automatic Zoom meetings');
      console.log('✅ All existing Zoom meetings have been removed');
      console.log('✅ System is now clean - Zoom meetings are optional only');
    } else {
      console.log('⚠️ Some Zoom meetings still exist - manual cleanup may be needed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

cleanupRemainingZoomMeetings();
