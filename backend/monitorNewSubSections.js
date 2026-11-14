const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/lms')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const SubSection = require('./models/subSection');

async function monitorNewSubSections() {
  try {
    console.log('👀 Monitoring for new subsections...');
    
    // Get current count and latest subsection
    const currentCount = await SubSection.countDocuments();
    const latestSubsection = await SubSection.findOne().sort({ createdAt: -1 });
    
    console.log(`📊 Current subsection count: ${currentCount}`);
    console.log(`📊 Latest subsection: ${latestSubsection?.title || 'None'}`);
    
    if (latestSubsection) {
      console.log(`📊 Latest created: ${latestSubsection.createdAt || 'Unknown'}`);
      console.log(`📊 Has Zoom meeting: ${latestSubsection.zoomMeeting ? 'Yes' : 'No'}`);
      if (latestSubsection.zoomMeeting) {
        console.log(`📊 Zoom details:`, latestSubsection.zoomMeeting);
      }
    }
    
    // Check for subsections created in last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const recentSubsections = await SubSection.find({
      createdAt: { $gte: twoMinutesAgo }
    }).select('title createdAt zoomMeeting').lean();
    
    console.log(`\n📋 Subsections created in last 2 minutes: ${recentSubsections.length}`);
    recentSubsections.forEach(ss => {
      const createdTime = ss.createdAt ? new Date(ss.createdAt).toLocaleString() : 'Unknown';
      console.log(`- ${ss.title} (Created: ${createdTime})`);
      console.log(`  Zoom Meeting: ${ss.zoomMeeting ? '✅ Yes - ' + ss.zoomMeeting.topic : '❌ No'}`);
    });
    
    if (recentSubsections.length > 0) {
      console.log(`\n⚠️  NEW SUBSECTIONS DETECTED!`);
      console.log(`If you just created a lecture and see Zoom meetings above, there's an automatic creation issue!`);
    } else {
      console.log(`\n✅ No new subsections detected in last 2 minutes`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

monitorNewSubSections();
