const axios = require('axios');
require('dotenv').config();

// Test Zoom OAuth 2.0 credentials
async function testZoomAuth() {
    try {
        console.log('🔑 Testing Zoom OAuth 2.0 credentials...');
        
        const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
        const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
        const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
        
        console.log('📋 Credentials check:');
        console.log('Account ID:', ZOOM_ACCOUNT_ID ? '✅ Present' : '❌ Missing');
        console.log('Client ID:', ZOOM_CLIENT_ID ? '✅ Present' : '❌ Missing');
        console.log('Client Secret:', ZOOM_CLIENT_SECRET ? '✅ Present' : '❌ Missing');
        
        if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
            console.error('❌ Missing Zoom credentials in environment variables');
            return;
        }
        
        const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');
        
        console.log('🌐 Making OAuth request to Zoom...');
        const response = await axios.post('https://zoom.us/oauth/token', 
            `grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
            {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        console.log('✅ Zoom OAuth successful!');
        console.log('🎫 Access token received:', response.data.access_token ? 'Yes' : 'No');
        console.log('⏰ Token expires in:', response.data.expires_in, 'seconds');
        
    } catch (error) {
        console.error('❌ Zoom OAuth failed:');
        console.error('Status:', error.response?.status);
        console.error('Error:', error.response?.data || error.message);
    }
}

testZoomAuth();
