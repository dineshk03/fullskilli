const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/lms')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const SubSection = require('./models/subSection');

async function checkSubSections() {
  try {
    const subSections = await SubSection.find({}).limit(5).select('title description videoUrl pdfUrl pptUrl zoomMeeting createdAt').lean();
    console.log('Recent SubSections:');
    subSections.forEach((ss, index) => {
      console.log(`${index + 1}. ${ss.title}`);
      console.log(`   Created: ${ss.createdAt}`);
      console.log(`   Video: ${ss.videoUrl ? 'Yes' : 'No'}`);
      console.log(`   PDF: ${ss.pdfUrl ? 'Yes' : 'No'}`);
      console.log(`   PPT: ${ss.pptUrl ? 'Yes' : 'No'}`);
      console.log(`   Zoom Meeting: ${ss.zoomMeeting ? 'Yes - ' + JSON.stringify(ss.zoomMeeting) : 'No'}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkSubSections();
