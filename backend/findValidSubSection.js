const mongoose = require('mongoose');
const SubSection = require('./models/subSection');
const Section = require('./models/section');
const Course = require('./models/course');
require('dotenv').config();

async function findValidSubSection() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('✅ Connected to MongoDB');

        console.log('🔍 Finding SubSections with proper section/course relationships...');

        // Find SubSections with populated data
        const validSubSections = await SubSection.find({})
            .populate({
                path: 'section',
                populate: {
                    path: 'course',
                    select: 'instructor studentsEnrolled courseName'
                }
            })
            .limit(5)
            .lean();

        console.log('📋 Found', validSubSections.length, 'SubSections');

        validSubSections.forEach((subSection, index) => {
            console.log(`\n--- SubSection ${index + 1} ---`);
            console.log('ID:', subSection._id);
            console.log('Title:', subSection.title);
            console.log('Section exists:', subSection.section ? 'Yes' : 'No');
            
            if (subSection.section) {
                console.log('Section name:', subSection.section.sectionName);
                console.log('Course exists:', subSection.section.course ? 'Yes' : 'No');
                
                if (subSection.section.course) {
                    console.log('Course name:', subSection.section.course.courseName);
                    console.log('Instructor ID:', subSection.section.course.instructor);
                    console.log('✅ This SubSection is VALID for Zoom meetings');
                } else {
                    console.log('❌ No course data');
                }
            } else {
                console.log('❌ No section data');
            }
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

findValidSubSection();
