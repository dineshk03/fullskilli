const mongoose = require('mongoose');
const CourseProgress = require('../models/courseProgress');
const User = require('../models/User');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Connect to database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Create sample quiz data
const createSampleQuizData = async () => {
    try {
        console.log('🔄 Creating sample quiz data...');

        // Find existing users and courses
        const users = await User.find({ accountType: 'Student' }).limit(5);
        const courses = await Course.find().limit(3);

        if (users.length === 0) {
            console.log('❌ No student users found. Please create some users first.');
            return;
        }

        if (courses.length === 0) {
            console.log('❌ No courses found. Please create some courses first.');
            return;
        }

        console.log(`📊 Found ${users.length} students and ${courses.length} courses`);

        // Create sample quiz results for each user and course
        const sampleResults = [];
        const now = new Date();

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            
            for (let j = 0; j < courses.length; j++) {
                const course = courses[j];
                
                // Create 2-4 quiz attempts per user per course
                const numAttempts = Math.floor(Math.random() * 3) + 2;
                
                for (let k = 0; k < numAttempts; k++) {
                    const score = Math.floor(Math.random() * 100);
                    const totalMarks = 100;
                    const percentage = score;
                    const passed = percentage >= 60;
                    
                    // Random date within last 30 days
                    const daysAgo = Math.floor(Math.random() * 30);
                    const completedAt = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
                    
                    const quizResult = {
                        quiz: new mongoose.Types.ObjectId(), // Mock quiz ID
                        score: score,
                        totalMarks: totalMarks,
                        percentage: percentage,
                        passed: passed,
                        attempts: k + 1,
                        completedAt: completedAt,
                        timeTaken: Math.floor(Math.random() * 1800) + 300 // 5-35 minutes
                    };
                    
                    sampleResults.push({
                        userId: user._id,
                        courseID: course._id,
                        quizResult: quizResult
                    });
                }
            }
        }

        console.log(`📝 Generated ${sampleResults.length} sample quiz results`);

        // Insert or update CourseProgress documents
        for (const result of sampleResults) {
            let courseProgress = await CourseProgress.findOne({
                userId: result.userId,
                courseID: result.courseID
            });

            if (!courseProgress) {
                courseProgress = new CourseProgress({
                    userId: result.userId,
                    courseID: result.courseID,
                    completedVideos: [],
                    quizResults: [result.quizResult]
                });
            } else {
                courseProgress.quizResults.push(result.quizResult);
            }

            await courseProgress.save();
        }

        console.log('✅ Sample quiz data created successfully!');
        console.log('📊 You can now view live data in the Quiz Analytics dashboard');

    } catch (error) {
        console.error('❌ Error creating sample data:', error);
    }
};

// Main execution
const main = async () => {
    await connectDB();
    await createSampleQuizData();
    
    console.log('🎉 Sample data creation completed!');
    process.exit(0);
};

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { createSampleQuizData };
