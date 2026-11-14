const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/lms')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check SubSections collection
    const SubSection = require('./models/subSection');
    const subsections = await SubSection.find({});
    console.log('Total SubSections:', subsections.length);
    
    // Check for existing zoom meetings
    const withZoom = await SubSection.find({'zoomMeeting': {$exists: true, $ne: null}});
    console.log('SubSections with Zoom meetings:', withZoom.length);
    
    if (withZoom.length > 0) {
      console.log('Existing Zoom meetings:');
      withZoom.forEach(ss => {
        console.log(`- ${ss.title}: ${ss.zoomMeeting.topic || 'No topic'}`);
      });
    } else {
      console.log('No Zoom meetings found. Creating sample data...');
      
      // Create sample Zoom meetings
      const Course = require('./models/course');
      const Section = require('./models/section');
      
      // Get some sample data
      const courses = await Course.find({}).limit(3);
      const sections = await Section.find({}).limit(5);
      
      if (subsections.length > 0) {
        // Create sample Zoom meetings for first few subsections
        const sampleMeetings = [
          {
            zoomMeeting: {
              meetingId: '123456789',
              hostId: 'host123',
              topic: 'Introduction to Project Management',
              agenda: 'Welcome session and course overview',
              startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
              duration: 60,
              joinUrl: 'https://zoom.us/j/123456789',
              startUrl: 'https://zoom.us/s/123456789',
              password: 'abc123',
              status: 'Scheduled'
            }
          },
          {
            zoomMeeting: {
              meetingId: '987654321',
              hostId: 'host456',
              topic: 'Advanced JavaScript Concepts',
              agenda: 'Deep dive into ES6+ features',
              startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
              duration: 90,
              joinUrl: 'https://zoom.us/j/987654321',
              startUrl: 'https://zoom.us/s/987654321',
              password: 'def456',
              status: 'Scheduled'
            }
          },
          {
            zoomMeeting: {
              meetingId: '555666777',
              hostId: 'host789',
              topic: 'Database Design Workshop',
              agenda: 'Practical database design exercises',
              startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
              duration: 120,
              joinUrl: 'https://zoom.us/j/555666777',
              startUrl: 'https://zoom.us/s/555666777',
              password: 'ghi789',
              status: 'Ended'
            }
          },
          {
            zoomMeeting: {
              meetingId: '111222333',
              hostId: 'host999',
              topic: 'Live Q&A Session',
              agenda: 'Student questions and answers',
              startTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
              duration: 45,
              joinUrl: 'https://zoom.us/j/111222333',
              startUrl: 'https://zoom.us/s/111222333',
              password: 'live123',
              status: 'Live'
            }
          }
        ];
        
        // Update first few subsections with sample meetings
        for (let i = 0; i < Math.min(sampleMeetings.length, subsections.length); i++) {
          await SubSection.findByIdAndUpdate(
            subsections[i]._id,
            sampleMeetings[i]
          );
          console.log(`Created sample meeting for: ${subsections[i].title}`);
        }
        
        console.log('Sample Zoom meetings created successfully!');
      }
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
