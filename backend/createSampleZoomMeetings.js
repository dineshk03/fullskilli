const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/lms')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const SubSection = require('./models/subSection');
    
    // Get all subsections
    const subsections = await SubSection.find({});
    console.log('Found', subsections.length, 'subsections');
    
    // Create sample Zoom meetings with different statuses
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
      },
      {
        zoomMeeting: {
          meetingId: '444555666',
          hostId: 'host777',
          topic: 'React Components Deep Dive',
          agenda: 'Understanding React hooks and context',
          startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          duration: 75,
          joinUrl: 'https://zoom.us/j/444555666',
          startUrl: 'https://zoom.us/s/444555666',
          password: 'react456',
          status: 'Scheduled'
        }
      }
    ];
    
    // Update subsections with sample meetings
    for (let i = 0; i < Math.min(sampleMeetings.length, subsections.length); i++) {
      await SubSection.findByIdAndUpdate(
        subsections[i]._id,
        sampleMeetings[i]
      );
      console.log(`Created sample meeting for: ${subsections[i].title} - ${sampleMeetings[i].zoomMeeting.topic}`);
    }
    
    // Verify the meetings were created
    const withZoom = await SubSection.find({'zoomMeeting': {$exists: true, $ne: null}});
    console.log('\nTotal Zoom meetings created:', withZoom.length);
    
    withZoom.forEach(ss => {
      const meeting = ss.zoomMeeting;
      const status = meeting.status || 'Scheduled';
      const startTime = new Date(meeting.startTime);
      const now = new Date();
      
      // Determine actual status based on time
      let actualStatus = status;
      if (startTime > now) {
        actualStatus = 'Upcoming';
      } else if (startTime <= now && startTime.getTime() + (meeting.duration * 60 * 1000) > now.getTime()) {
        actualStatus = 'Live';
      } else {
        actualStatus = 'Ended';
      }
      
      console.log(`- ${meeting.topic} (${actualStatus}) - ${ss.title}`);
    });
    
    console.log('\nSample Zoom meetings created successfully!');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
