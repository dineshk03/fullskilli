const mongoose = require('mongoose');
const ZoomAttendance = require('./models/zoomAttendance');
const Course = require('./models/course');
const SubSection = require('./models/subSection');
const User = require('./models/user');
require('dotenv').config();

const createSampleAttendanceData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    // Get existing data
    const courses = await Course.find().limit(3);
    const users = await User.find({ accountType: 'Student' }).limit(5);
    const subSections = await SubSection.find({ 'zoomMeeting.meetingId': { $exists: true } }).limit(3);

    if (courses.length === 0 || users.length === 0) {
      console.log('❌ No courses or users found. Please create some test data first.');
      return;
    }

    console.log(`📚 Found ${courses.length} courses`);
    console.log(`👥 Found ${users.length} students`);
    console.log(`📹 Found ${subSections.length} subsections with Zoom meetings`);

    // Clear existing attendance data
    await ZoomAttendance.deleteMany({});
    console.log('🗑️ Cleared existing attendance data');

    // Sample attendance records
    const sampleAttendanceData = [];

    subSections.forEach((subSection, sectionIndex) => {
      const course = courses[sectionIndex % courses.length];
      const meetingId = subSection.zoomMeeting?.meetingId || `meeting_${sectionIndex + 1}`;
      
      // Create attendance records for each student
      users.forEach((user, userIndex) => {
        // Simulate different attendance scenarios
        const attendanceScenarios = [
          { status: 'completed', duration: 45, joinTime: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // 2 hours ago, 45 min
          { status: 'completed', duration: 60, joinTime: new Date(Date.now() - 1 * 60 * 60 * 1000) }, // 1 hour ago, 60 min
          { status: 'completed', duration: 30, joinTime: new Date(Date.now() - 3 * 60 * 60 * 1000) }, // 3 hours ago, 30 min
          { status: 'joined', duration: 15, joinTime: new Date(Date.now() - 30 * 60 * 1000) }, // 30 min ago, still in meeting
          { status: 'completed', duration: 55, joinTime: new Date(Date.now() - 4 * 60 * 60 * 1000) }, // 4 hours ago, 55 min
        ];

        const scenario = attendanceScenarios[userIndex % attendanceScenarios.length];
        
        sampleAttendanceData.push({
          meetingId: meetingId,
          participantId: `participant_${user._id}`,
          participantEmail: user.email,
          participantName: `${user.firstName} ${user.lastName}`,
          userId: user._id,
          joinTime: scenario.joinTime,
          leaveTime: scenario.status === 'completed' ? new Date(scenario.joinTime.getTime() + scenario.duration * 60 * 1000) : null,
          duration: scenario.duration,
          status: scenario.status,
          course: course._id,
          subSection: subSection._id
        });
      });
    });

    // Insert sample data
    await ZoomAttendance.insertMany(sampleAttendanceData);
    console.log(`✅ Created ${sampleAttendanceData.length} sample attendance records`);

    // Create summary statistics
    const totalRecords = await ZoomAttendance.countDocuments();
    const uniqueStudents = await ZoomAttendance.distinct('userId');
    const uniqueMeetings = await ZoomAttendance.distinct('meetingId');
    const completedMeetings = await ZoomAttendance.countDocuments({ status: 'completed' });

    console.log('\n📊 Sample Data Summary:');
    console.log(`   Total Attendance Records: ${totalRecords}`);
    console.log(`   Unique Students: ${uniqueStudents.length}`);
    console.log(`   Unique Meetings: ${uniqueMeetings.length}`);
    console.log(`   Completed Attendances: ${completedMeetings}`);
    console.log(`   Average Duration: ${Math.round(sampleAttendanceData.reduce((sum, record) => sum + record.duration, 0) / sampleAttendanceData.length)} minutes`);

    console.log('\n🎉 Sample Zoom attendance data created successfully!');
    console.log('📱 You can now test the AdminZoomAttendance component');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the script
createSampleAttendanceData();
