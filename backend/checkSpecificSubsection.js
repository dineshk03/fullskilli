const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/lms')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const SubSection = require('./models/subSection');

async function checkSpecificSubsection() {
  try {
    console.log('🔍 Checking subsection 6926c1af9cbda496a7c5d801...');
    
    const subsection = await SubSection.findById('6926c1af9cbda496a7c5d801')
      .select('title zoomMeeting section');
    
    if (!subsection) {
      console.log('❌ Subsection not found');
      return;
    }
    
    console.log('✅ Subsection found:');
    console.log('📝 Title:', subsection.title);
    console.log('📊 Section ID:', subsection.section || 'No section');
    console.log('🎥 Zoom Meeting:', subsection.zoomMeeting ? 'EXISTS' : 'REMOVED');
    
    if (subsection.zoomMeeting) {
      console.log('🔗 Zoom Data:', JSON.stringify(subsection.zoomMeeting, null, 2));
    }
    
    // Check all subsections with zoom meetings
    const allWithZoom = await SubSection.find({ 'zoomMeeting': { $exists: true } })
      .select('title zoomMeeting')
      .lean();
    
    console.log(`\n📊 Total subsections with Zoom meetings: ${allWithZoom.length}`);
    
    if (allWithZoom.length > 0) {
      console.log('📋 Remaining Zoom meetings:');
      allWithZoom.forEach((ss, index) => {
        console.log(`${index + 1}. ${ss.title} - ${JSON.stringify(ss.zoomMeeting)}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

checkSpecificSubsection();
