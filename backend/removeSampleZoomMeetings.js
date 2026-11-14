const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/lms')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const SubSection = require('./models/subSection');

async function removeSampleZoomMeetings() {
  try {
    console.log('🧹 Cleaning up sample Zoom meetings...');
    
    // Remove all zoomMeeting objects from subsections
    const result = await SubSection.updateMany(
      { zoomMeeting: { $exists: true } },
      { $unset: { zoomMeeting: 1 } }
    );
    
    console.log(`✅ Removed Zoom meetings from ${result.modifiedCount} subsections`);
    
    // Verify the cleanup
    const remaining = await SubSection.countDocuments({ 'zoomMeeting': { $exists: true } });
    console.log(`📊 Subsections still with Zoom meetings: ${remaining}`);
    
    if (remaining === 0) {
      console.log('🎉 All sample Zoom meetings removed successfully!');
    } else {
      console.log('⚠️ Some Zoom meetings still exist');
    }
    
    // Show current state of subsections
    const sampleSubsections = await SubSection.find({}).limit(5).select('title videoUrl pdfUrl pptUrl zoomMeeting').lean();
    console.log('\n📋 Current subsections:');
    sampleSubsections.forEach((ss, index) => {
      console.log(`${index + 1}. ${ss.title}`);
      console.log(`   Video: ${ss.videoUrl ? 'Yes' : 'No'}`);
      console.log(`   PDF: ${ss.pdfUrl ? 'Yes' : 'No'}`);
      console.log(`   PPT: ${ss.pptUrl ? 'Yes' : 'No'}`);
      console.log(`   Zoom Meeting: ${ss.zoomMeeting ? 'Yes' : 'No'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

removeSampleZoomMeetings();
