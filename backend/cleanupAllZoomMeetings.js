const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/lms')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const SubSection = require('./models/subSection');

async function cleanupAllZoomMeetings() {
  try {
    console.log('🧹 Cleaning up ALL Zoom meeting objects to fix 500 errors...');
    
    // Find all subsections with zoomMeeting objects
    const subsectionsWithZoom = await SubSection.find({ 
      'zoomMeeting': { $exists: true } 
    }).select('title zoomMeeting _id').lean();
    
    console.log(`📊 Found ${subsectionsWithZoom.length} subsections with Zoom meetings:`);
    
    for (const ss of subsectionsWithZoom) {
      console.log(`- ${ss.title} (ID: ${ss._id})`);
      console.log(`  Zoom data: ${JSON.stringify(ss.zoomMeeting)}`);
    }
    
    if (subsectionsWithZoom.length === 0) {
      console.log('✅ No Zoom meetings found - cleanup not needed');
      process.exit(0);
    }
    
    // Remove all zoomMeeting objects
    const result = await SubSection.updateMany(
      { 'zoomMeeting': { $exists: true } },
      { $unset: { zoomMeeting: 1 } }
    );
    
    console.log(`\n✅ Removed Zoom meetings from ${result.modifiedCount} subsections`);
    
    // Verify cleanup
    const remaining = await SubSection.countDocuments({ 
      'zoomMeeting': { $exists: true } 
    });
    
    console.log(`📊 Subsections with Zoom meetings remaining: ${remaining}`);
    
    if (remaining === 0) {
      console.log('\n🎉 SUCCESS: All Zoom meetings cleaned up!');
      console.log('✅ The 500 delete errors should now be resolved');
      console.log('✅ Try deleting meetings from admin panel again');
    } else {
      console.log('\n⚠️ Some Zoom meetings still exist - manual cleanup may be needed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

cleanupAllZoomMeetings();
