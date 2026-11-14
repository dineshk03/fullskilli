const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/lms')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const SubSection = require('./models/subSection');

async function manuallyDeleteMeeting() {
  try {
    console.log('🗑️ Manually removing Zoom meeting from subsection 6926c03b7c7b9e3dce20c7ca...');
    
    // Remove the zoomMeeting field from this specific subsection
    const result = await SubSection.findByIdAndUpdate(
      '6926c03b7c7b9e3dce20c7ca',
      { $unset: { zoomMeeting: 1 } },
      { new: true }
    );
    
    if (result) {
      console.log('✅ Zoom meeting successfully removed from subsection');
      console.log('📊 Subsection title:', result.title);
      console.log('📊 Zoom meeting field removed');
    } else {
      console.log('❌ Subsection not found');
    }
    
    // Verify the removal
    const subsection = await SubSection.findById('6926c03b7c7b9e3dce20c7ca');
    if (subsection && !subsection.zoomMeeting) {
      console.log('✅ Verification successful - no zoomMeeting field found');
    } else {
      console.log('⚠️ Verification failed - zoomMeeting still exists');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

manuallyDeleteMeeting();
