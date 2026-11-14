const axios = require('axios');

// Test the API endpoints directly
const testAPI = async () => {
    try {
        console.log('🧪 Testing Quiz Analytics API endpoints...');
        
        const baseURL = 'http://localhost:5001';
        
        // Test 1: Check if server is running
        console.log('1. Testing server health...');
        try {
            const healthResponse = await axios.get(`${baseURL}/`);
            console.log('✅ Server is running');
        } catch (error) {
            console.log('⚠️ Root endpoint failed, trying analytics endpoint directly...');
        }

        // Test 2: Test analytics endpoint without auth (should fail)
        console.log('2. Testing analytics endpoint without auth...');
        try {
            const noAuthResponse = await axios.get(`${baseURL}/api/v1/quiz-reports/admin/analytics`);
            console.log('❌ Unexpected: No auth required');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Correctly requires authentication');
            } else {
                console.log('⚠️ Unexpected error:', error.response?.status, error.message);
            }
        }

        // Test 3: Check if the route exists
        console.log('3. Testing route existence...');
        try {
            const routeResponse = await axios.get(`${baseURL}/api/v1/quiz-reports/admin/analytics`, {
                headers: {
                    'Authorization': 'Bearer invalid-token'
                }
            });
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.log('✅ Route exists, authentication required');
            } else if (error.response?.status === 404) {
                console.log('❌ Route not found - check backend routing');
            } else {
                console.log('⚠️ Unexpected error:', error.response?.status, error.message);
            }
        }

        console.log('🎉 API test completed!');

    } catch (error) {
        console.error('❌ Error testing API:', error.message);
    }
};

// Run the test
testAPI();
