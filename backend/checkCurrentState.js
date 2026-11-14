const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/lms')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const SubSection = require('./models/subSection');

async function checkCurrentState() {
  try {
    console.log('🔍 Checking current state of subsections...');
    
    // Count subsections with and without Zoom meetings
    const totalSubsections = await SubSection.countDocuments();
    const withZoom = await SubSection.countDocuments({ 'zoomMeeting': { $exists: true, $ne: null } });
    const withoutZoom = totalSubsections - withZoom;
    
    console.log(`📊 Total subsections: ${totalSubsections}`);
    console.log(`📊 With Zoom meetings: ${withZoom}`);
    console.log(`📊 Without Zoom meetings: ${withoutZoom}`);
    
    // Show recent subsections with creation time
    const recentSubsections = await SubSection.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title createdAt zoomMeeting videoUrl pdfUrl pptUrl')
      .lean();
    
    console.log('\n📋 Recent subsections (newest first):');
    recentSubsections.forEach((ss, index) => {
      const createdTime = ss.createdAt ? new Date(ss.createdAt).toLocaleString() : 'Unknown';
      console.log(`${index + 1}. ${ss.title}`);
      console.log(`   Created: ${createdTime}`);
      console.log(`   Video: ${ss.videoUrl ? 'Yes' : 'No'}`);
      console.log(`   PDF: ${ss.pdfUrl ? 'Yes' : 'No'}`);
      console.log(`   PPT: ${ss.pptUrl ? 'Yes' : 'No'}`);
      console.log(`   Zoom Meeting: ${ss.zoomMeeting ? '✅ Yes - ' + ss.zoomMeeting.topic : '❌ No'}`);
      console.log('');
    });
    
    // Check for any automatic creation patterns
    if (withZoom > 0) {
      console.log('⚠️ Found subsections with Zoom meetings:');
      const zoomSubsections = await SubSection.find({ 'zoomMeeting': { $exists: true, $ne: null } })
        .select('title createdAt zoomMeeting')
        .lean();
      
      zoomSubsections.forEach(ss => {
        const createdTime = ss.createdAt ? new Date(ss.createdAt).toLocaleString() : 'Unknown';
        console.log(`- ${ss.title} (Created: ${createdTime})`);
        console.log(`  Zoom: ${ss.zoomMeeting.topic} (${ss.zoomMeeting.status})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

checkCurrentState();
