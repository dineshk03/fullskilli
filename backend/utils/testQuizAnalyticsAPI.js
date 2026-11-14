const mongoose = require('mongoose');
const User = require('../models/User');
const { getAdminQuizAnalytics } = require('../controllers/adminQuizReports');

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

// Test the analytics API
const testAnalyticsAPI = async () => {
    try {
        console.log('🧪 Testing Quiz Analytics API...');

        // Mock request and response objects
        const mockReq = {
            query: {
                timeRange: '30'
            }
        };

        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    console.log(`📊 API Response (${code}):`, JSON.stringify(data, null, 2));
                    return data;
                }
            })
        };

        // Call the analytics function
        await getAdminQuizAnalytics(mockReq, mockRes);

        console.log('✅ API test completed successfully!');

    } catch (error) {
        console.error('❌ Error testing API:', error);
    }
};

// Main execution
const main = async () => {
    await connectDB();
    await testAnalyticsAPI();
    
    console.log('🎉 API test completed!');
    process.exit(0);
};

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testAnalyticsAPI };
