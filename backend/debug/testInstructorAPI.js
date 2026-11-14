const axios = require('axios');

async function testInstructorAPI() {
    try {
        console.log('🧪 Testing Instructor Courses API...\n');

        // You'll need to get a valid instructor token
        // For now, let's test with a sample request
        const instructorId = '691c9f471c223e8e7f406aab'; // DINESH A's ID

        const response = await axios.get('http://localhost:5001/api/v1/course/getInstructorCoursesForInstructor', {
            headers: {
                'Authorization': 'Bearer YOUR_INSTRUCTOR_TOKEN_HERE',
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ API Response Status:', response.status);
        console.log('✅ API Response Data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('❌ API Error:', error.response?.status);
        console.error('❌ Error Message:', error.response?.data?.message || error.message);
        console.error('❌ Full Error:', error.response?.data || error.message);
    }
}

console.log('⚠️  To test the API, you need to:');
console.log('1. Login as the instructor (DINESH A) in the frontend');
console.log('2. Get the JWT token from browser developer tools');
console.log('3. Replace "YOUR_INSTRUCTOR_TOKEN_HERE" with the actual token');
console.log('4. Uncomment the line below to run the test\n');

// Uncomment to run the test after adding the token
// testInstructorAPI();
