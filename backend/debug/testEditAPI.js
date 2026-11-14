const axios = require('axios');

async function testEditAPI() {
    try {
        console.log('🧪 Testing Edit Course API directly...\n');

        // This is just a test to see if the API endpoint responds
        // We'll send a minimal request to trigger the logs
        
        const response = await axios.post('http://localhost:5001/api/v1/course/editCourse', {
            courseId: 'test123' // This will fail but should trigger our logs
        }, {
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImJlZWphaW5ub3ZhdGl2ZXZlbnR1cmVzQGdtYWlsLmNvbSIsImlkIjoiNjhmZDEwMzI5MWIwYTk4NWQ5YzhhY2QwIiwiYWNjb3VudFR5cGUiOiJBZG1pbiIsImlhdCI6MTc2NDA0ODM0NCwiZXhwIjoxNzY0MTM0NzQ0fQ.7E6_L6NIT9uevb1Pdg57Ohvn2i-vXIaOSF7TOoTe5ZM',
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ API Response:', response.status);
    } catch (error) {
        console.log('Expected error (this is normal):', error.response?.status);
        console.log('Error message:', error.response?.data?.message);
    }
}

console.log('This will trigger the edit course logs in the backend...');
testEditAPI();
