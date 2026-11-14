const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/lms')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const SubSection = require('./models/subSection');

async function investigateZoomMeetings() {
  try {
    console.log('🔍 Investigating Zoom meetings...');
    
    // Get subsections with Zoom meetings
    const zoomSubsections = await SubSection.find({ 'zoomMeeting': { $exists: true, $ne: null } })
      .select('title createdAt zoomMeeting videoUrl pdfUrl pptUrl section')
      .lean();
    
    console.log(`📊 Found ${zoomSubsections.length} subsections with Zoom meetings:`);
    
    zoomSubsections.forEach((ss, index) => {
      const createdTime = ss.createdAt ? new Date(ss.createdAt).toLocaleString() : 'Unknown';
      console.log(`\n${index + 1}. ${ss.title}`);
      console.log(`   Section: ${ss.section ? 'Section ID: ' + ss.section : 'Unknown'}`);
      console.log(`   Created: ${createdTime}`);
      console.log(`   Video: ${ss.videoUrl ? 'Yes' : 'No'}`);
      console.log(`   PDF: ${ss.pdfUrl ? 'Yes' : 'No'}`);
      console.log(`   PPT: ${ss.pptUrl ? 'Yes' : 'No'}`);
      console.log(`   Zoom Meeting: ✅ Yes`);
      console.log(`   - Topic: ${ss.zoomMeeting?.topic || 'No topic'}`);
      console.log(`   - Status: ${ss.zoomMeeting?.status || 'No status'}`);
      console.log(`   - Meeting ID: ${ss.zoomMeeting?.meetingId || 'No ID'}`);
      console.log(`   - Start Time: ${ss.zoomMeeting?.startTime ? new Date(ss.zoomMeeting.startTime).toLocaleString() : 'No start time'}`);
      
      // Check if this looks like sample data
      const isSampleData = ss.zoomMeeting?.meetingId && 
        (ss.zoomMeeting.meetingId.includes('123') || 
         ss.zoomMeeting.meetingId.includes('456') || 
         ss.zoomMeeting.meetingId.includes('789') ||
         ss.zoomMeeting.meetingId.includes('111') ||
         ss.zoomMeeting.meetingId.includes('222') ||
         ss.zoomMeeting.meetingId.includes('333') ||
         ss.zoomMeeting.meetingId.includes('444') ||
         ss.zoomMeeting.meetingId.includes('555') ||
         ss.zoomMeeting.meetingId.includes('666') ||
         ss.zoomMeeting.meetingId.includes('777') ||
         ss.zoomMeeting.meetingId.includes('888') ||
         ss.zoomMeeting.meetingId.includes('999'));
      
      if (isSampleData) {
        console.log(`   ⚠️  This appears to be SAMPLE DATA from createSampleZoomMeetings.js`);
      }
    });
    
    // Check if there are any recent subsections (created in last few minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentSubsections = await SubSection.find({
      createdAt: { $gte: tenMinutesAgo }
    }).select('title createdAt zoomMeeting').lean();
    
    console.log(`\n📋 Subsections created in last 10 minutes: ${recentSubsections.length}`);
    recentSubsections.forEach(ss => {
      const createdTime = ss.createdAt ? new Date(ss.createdAt).toLocaleString() : 'Unknown';
      console.log(`- ${ss.title} (Created: ${createdTime}) - Zoom: ${ss.zoomMeeting ? 'Yes' : 'No'}`);
    });
    
    // Check if any recent subsections have Zoom meetings
    const recentWithZoom = recentSubsections.filter(ss => ss.zoomMeeting);
    if (recentWithZoom.length > 0) {
      console.log(`\n⚠️  FOUND RECENT SUBSECTIONS WITH ZOOM MEETINGS!`);
      recentWithZoom.forEach(ss => {
        console.log(`- ${ss.title} - ${ss.zoomMeeting.topic}`);
      });
    } else {
      console.log(`\n✅ No recent subsections have Zoom meetings (good!)`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

investigateZoomMeetings();
