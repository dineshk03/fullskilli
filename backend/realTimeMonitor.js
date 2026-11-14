const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/lms')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const SubSection = require('./models/subSection');

async function realTimeMonitor() {
  try {
    console.log('👀 REAL-TIME MONITORING ACTIVE...');
    console.log('📝 Create a new lecture now and I will detect it!\n');
    
    let initialCount = await SubSection.countDocuments();
    let initialLatest = await SubSection.findOne().sort({ createdAt: -1 });
    
    console.log(`📊 Initial count: ${initialCount}`);   
    console.log(`📊 Latest subsection: ${initialLatest?.title || 'None'}`);
    console.log(`📊 Latest created: ${initialLatest?.createdAt || 'Unknown'}`);
    console.log(`📊 Latest has Zoom: ${initialLatest?.zoomMeeting ? 'Yes' : 'No'}`);
    
    // Monitor every 2 seconds for changes
    const monitorInterval = setInterval(async () => {
      try {
        const currentCount = await SubSection.countDocuments();
        const currentLatest = await SubSection.findOne().sort({ createdAt: -1 });
        
        if (currentCount > initialCount) {
          console.log('\n🚨 NEW SUBSECTION DETECTED!');
          console.log(`📊 Count changed: ${initialCount} → ${currentCount}`);
          
          // Get the new subsection(s)
          const newSubsections = await SubSection.find({
            createdAt: { $gt: initialLatest?.createdAt || new Date(0) }
          }).sort({ createdAt: 1 });
          
          newSubsections.forEach((ss, index) => {
            const createdTime = ss.createdAt ? new Date(ss.createdAt).toLocaleString() : 'Unknown';
            console.log(`\n${index + 1}. 📝 NEW SUBSECTION:`);
            console.log(`   Title: ${ss.title}`);
            console.log(`   Created: ${createdTime}`);
            console.log(`   Video: ${ss.videoUrl ? 'Yes' : 'No'}`);
            console.log(`   PDF: ${ss.pdfUrl ? 'Yes' : 'No'}`);
            console.log(`   PPT: ${ss.pptUrl ? 'Yes' : 'No'}`);
            console.log(`   Zoom Meeting: ${ss.zoomMeeting ? '🚨 YES - AUTOMATIC CREATION!' : '✅ No (Good!)'}`);
            
            if (ss.zoomMeeting) {
              console.log(`   ⚠️ ZOOM DETAILS:`);
              console.log(`      - Topic: ${ss.zoomMeeting.topic || 'No topic'}`);
              console.log(`      - Status: ${ss.zoomMeeting.status || 'No status'}`);
              console.log(`      - Meeting ID: ${ss.zoomMeeting.meetingId || 'No ID'}`);
              console.log(`      - Start Time: ${ss.zoomMeeting.startTime ? new Date(ss.zoomMeeting.startTime).toLocaleString() : 'No start time'}`);
              console.log(`      - Duration: ${ss.zoomMeeting.duration || 'No duration'} minutes`);
              console.log(`      - Join URL: ${ss.zoomMeeting.joinUrl || 'No join URL'}`);
              console.log(`      - Password: ${ss.zoomMeeting.password || 'No password'}`);
              
              // Check if this looks like sample data
              const isSampleData = ss.zoomMeeting.meetingId && 
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
                console.log(`      🔍 This appears to be SAMPLE DATA from createSampleZoomMeetings.js`);
              } else {
                console.log(`      🚨 THIS IS REAL AUTOMATIC ZOOM CREATION!`);
              }
            }
          });
          
          // Update initial values for next monitoring cycle
          initialCount = currentCount;
          initialLatest = currentLatest;
          
          console.log('\n✅ Monitoring continues... Create another lecture to test again');
        }
      } catch (error) {
        console.error('❌ Monitoring error:', error);
      }
    }, 2000); // Check every 2 seconds
    
    // Stop monitoring after 60 seconds
    setTimeout(() => {
      clearInterval(monitorInterval);
      console.log('\n⏰ Monitoring stopped after 60 seconds');
      console.log('📝 If no new subsections were detected, try creating one while monitoring is active');
      process.exit(0);
    }, 60000);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(0);
  }
}

realTimeMonitor();
