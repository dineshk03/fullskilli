const axios = require('axios');

async function testInstructorQuizAPI() {
    try {
        console.log('🧪 Testing Instructor Quiz Management API...\n');

        const baseURL = 'http://localhost:5001';
        const courseId = '69181d987545328fcf389758'; // From the error message
        
        // Use the token from the error logs
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRpbmVzaEBqaW8uY29tIiwiaWQiOiI2OTFjOWY0NzFjMjIzZThlN2Y0MDZhYWIiLCJhY2NvdW50VHlwZSI6Ikluc3RydWN0b3IiLCJpYXQiOjE3MzI1MzUzNjYsImV4cCI6MTczMjYyMTc2Nn0.XIaOSF7TOoTe5ZM';

        console.log('1. Testing instructor course quizzes endpoint...');
        console.log(`URL: ${baseURL}/api/v1/quiz/instructor/course/${courseId}`);
        
        try {
            const response = await axios.get(`${baseURL}/api/v1/quiz/instructor/course/${courseId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ Success! Status:', response.status);
            console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
            
        } catch (error) {
            console.log('❌ Error details:');
            console.log('   Status:', error.response?.status);
            console.log('   Message:', error.response?.data?.message || error.message);
            console.log('   URL:', error.config?.url);
            
            if (error.response?.status === 404) {
                console.log('\n🔍 404 Error Analysis:');
                console.log('   - Route might not be registered correctly');
                console.log('   - Server might need restart');
                console.log('   - Check if middleware is working');
            }
        }

        // Test 2: Check if the base quiz route works
        console.log('\n2. Testing base quiz route...');
        try {
            const response = await axios.get(`${baseURL}/api/v1/quiz/all`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ Base quiz route works! Status:', response.status);
            
        } catch (error) {
            console.log('❌ Base quiz route error:', error.response?.status);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testInstructorQuizAPI();
