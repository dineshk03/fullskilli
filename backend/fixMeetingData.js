const mongoose = require('mongoose');
const ZoomAttendance = require('./models/zoomAttendance');
const SubSection = require('./models/subSection');
const Course = require('./models/course');
const User = require('./models/user');
require('dotenv').config();

const fixMeetingData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    // Get all data
    const courses = await Course.find();
    const subSections = await SubSection.find({ 'zoomMeeting.meetingId': { $exists: true } });
    
    console.log(`Found ${courses.length} courses and ${subSections.length} subsections with Zoom meetings`);

    // Update attendance records to ensure proper course and subsection references
    for (const subSection of subSections) {
      const course = courses.find(c => c.courseContent && c.courseContent.toString() === subSection.section.toString());
      
      if (course) {
        // Update all attendance records for this meeting
        await ZoomAttendance.updateMany(
          { 
            meetingId: subSection.zoomMeeting.meetingId,
            subSection: subSection._id
          },
          { 
            $set: { 
              course: course._id,
              subSection: subSection._id
            }
          }
        );
        
        console.log(`✅ Updated attendance records for meeting: ${subSection.zoomMeeting.meetingId}`);
        console.log(`   Course: ${course.courseName}`);
        console.log(`   SubSection: ${subSection.title}`);
      }
    }

    // Verify the data
    const attendanceRecords = await ZoomAttendance.find({})
      .populate('course', 'courseName')
      .populate('subSection', 'title')
      .populate('userId', 'firstName lastName');

    console.log('\n📊 Updated Attendance Records:');
    attendanceRecords.forEach((record, index) => {
      console.log(`${index + 1}. ${record.participantName}`);
      console.log(`   Course: ${record.course?.courseName || 'Not set'}`);
      console.log(`   SubSection: ${record.subSection?.title || 'Not set'}`);
      console.log(`   Meeting ID: ${record.meetingId}`);
      console.log(`   Duration: ${record.duration} minutes`);
      console.log('');
    });

    console.log('🎉 Meeting data fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing meeting data:', error);
  } finally {
    await mongoose.disconnect();
  }
};

fixMeetingData();
