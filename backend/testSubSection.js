const mongoose = require('mongoose');
const SubSection = require('./models/subSection');
require('dotenv').config();

async function testSubSection() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('✅ Connected to MongoDB');

        const subSectionId = '692593eaf4f68491f94d759b';
        console.log('🔍 Testing SubSection lookup for:', subSectionId);

        // Test basic lookup
        const basicSubSection = await SubSection.findById(subSectionId);
        console.log('📋 Basic SubSection found:', basicSubSection ? 'Yes' : 'No');
        
        if (basicSubSection) {
            console.log('- SubSection title:', basicSubSection.title);
            console.log('- Section ID:', basicSubSection.section);
        }

        // Test with populate
        const populatedSubSection = await SubSection.findById(subSectionId)
            .populate({
                path: 'section',
                populate: {
                    path: 'course',
                    select: 'instructor studentsEnrolled courseName'
                }
            })
            .lean();

        console.log('📋 Populated SubSection found:', populatedSubSection ? 'Yes' : 'No');
        
        if (populatedSubSection) {
            console.log('- SubSection title:', populatedSubSection.title);
            console.log('- Section exists:', populatedSubSection.section ? 'Yes' : 'No');
            
            if (populatedSubSection.section) {
                console.log('- Section name:', populatedSubSection.section.sectionName);
                console.log('- Course exists:', populatedSubSection.section.course ? 'Yes' : 'No');
                
                if (populatedSubSection.section.course) {
                    console.log('- Course name:', populatedSubSection.section.course.courseName);
                    console.log('- Instructor ID:', populatedSubSection.section.course.instructor);
                }
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

testSubSection();
