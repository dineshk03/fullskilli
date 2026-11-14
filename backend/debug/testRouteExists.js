const axios = require('axios');

async function testRouteExists() {
    try {
        console.log('🔍 Testing if quiz routes are registered...\n');

        const baseURL = 'http://localhost:5001';
        
        // Test various endpoints to see which ones exist
        const endpoints = [
            { url: '/api/v1/quiz/all', method: 'GET' },
            { url: '/api/v1/quiz/instructor/course/test123', method: 'GET' },
            { url: '/api/v1/quiz/delete/test123', method: 'DELETE' }
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`Testing: ${endpoint.method} ${endpoint.url}`);
                const response = await axios({
                    method: endpoint.method,
                    url: `${baseURL}${endpoint.url}`
                });
                console.log(`✅ ${endpoint.url} - Status: ${response.status}`);
            } catch (error) {
                const status = error.response?.status;
                if (status === 401) {
                    console.log(`🔐 ${endpoint.url} - Status: 401 (Auth required - route exists!)`);
                } else if (status === 403) {
                    console.log(`🚫 ${endpoint.url} - Status: 403 (Forbidden - route exists!)`);
                } else if (status === 404) {
                    console.log(`❌ ${endpoint.url} - Status: 404 (Route not found)`);
                } else {
                    console.log(`⚠️  ${endpoint.url} - Status: ${status} (${error.response?.data?.message || error.message})`);
                }
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testRouteExists();
