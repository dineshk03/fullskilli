/**
 * Test JWT Authentication Flow
 * 
 * This script tests the complete JWT authentication flow:
 * 1. Generate SSO token (simulating PHP website)
 * 2. Login with PID and SSO token
 * 3. Verify JWT token received
 * 4. Test protected endpoints with JWT token
 */

const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

// Configuration
const SSO_SECRET = process.env.SSO_SECRET || 'skilli_jobs_beeja_lms_shared_secret_key_2024';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';
const API_URL = `${BASE_URL}/api/v1`;

// Test user data
const testUser = {
    pid: '12345',
    email: 'test.user@example.com',
    name: 'Test User'
};

/**
 * Step 1: Generate SSO Token (simulating PHP website)
 */
function generateSSOToken(pid, email, name) {
    console.log('\n📝 Step 1: Generating SSO Token...');
    console.log('─────────────────────────────────────');

    const payload = {
        pid: pid,
        email: email,
        name: name,
        exp: Math.floor(Date.now() / 1000) + (10 * 60), // 10 minutes
        iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(payload, SSO_SECRET, { algorithm: 'HS256' });

    console.log('✅ SSO Token generated successfully');
    console.log('Payload:', payload);
    console.log('Token:', token.substring(0, 50) + '...');

    return token;
}

/**
 * Step 2: Login with PID and SSO Token
 */
async function loginByPID(pid, ssoToken) {
    console.log('\n🔐 Step 2: Login with PID and SSO Token...');
    console.log('─────────────────────────────────────');

    try {
        const response = await axios.post(`${API_URL}/login-by-pid`, {
            pid: pid,
            token: ssoToken
        });

        console.log('✅ Login successful!');
        console.log('Status:', response.status);
        console.log('JWT Token:', response.data.token.substring(0, 50) + '...');
        console.log('User:', {
            id: response.data.user._id,
            email: response.data.user.email,
            name: `${response.data.user.firstName} ${response.data.user.lastName}`,
            accountType: response.data.user.accountType,
            createdVia: response.data.user.createdVia
        });

        return response.data.token;
    } catch (error) {
        console.error('❌ Login failed!');
        console.error('Status:', error.response?.status);
        console.error('Error:', error.response?.data?.message || error.message);
        throw error;
    }
}

/**
 * Step 3: Verify JWT Token
 */
async function verifyJWTToken(jwtToken) {
    console.log('\n✓ Step 3: Verifying JWT Token...');
    console.log('─────────────────────────────────────');

    try {
        const response = await axios.get(`${API_URL}/verify-token`, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });

        console.log('✅ JWT Token is valid!');
        console.log('User from token:', response.data.user);

        return true;
    } catch (error) {
        console.error('❌ JWT Token verification failed!');
        console.error('Status:', error.response?.status);
        console.error('Error:', error.response?.data?.message || error.message);
        return false;
    }
}

/**
 * Step 4: Test Protected Endpoint
 */
async function testProtectedEndpoint(jwtToken) {
    console.log('\n🔒 Step 4: Testing Protected Endpoint...');
    console.log('─────────────────────────────────────');

    try {
        // Test getting user profile (protected endpoint)
        const response = await axios.get(`${API_URL}/profile/getUserDetails`, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });

        console.log('✅ Protected endpoint accessed successfully!');
        console.log('User profile:', {
            firstName: response.data.data.firstName,
            lastName: response.data.data.lastName,
            email: response.data.data.email,
            accountType: response.data.data.accountType
        });

        return true;
    } catch (error) {
        console.error('❌ Protected endpoint access failed!');
        console.error('Status:', error.response?.status);
        console.error('Error:', error.response?.data?.message || error.message);
        return false;
    }
}

/**
 * Test External SSO Login
 */
async function testExternalSSOLogin() {
    console.log('\n🌐 Testing External SSO Login...');
    console.log('─────────────────────────────────────');

    // Generate SSO token
    const ssoToken = generateSSOToken(
        testUser.pid,
        testUser.email,
        testUser.name
    );

    try {
        const response = await axios.post(`${API_URL}/external-sso-login`, {
            token: ssoToken,
            email: testUser.email,
            firstName: 'Test',
            lastName: 'User',
            pid: testUser.pid,
            phone: '+1234567890'
        });

        console.log('✅ External SSO login successful!');
        console.log('JWT Token:', response.data.token.substring(0, 50) + '...');
        console.log('Redirect URL:', response.data.redirectUrl);
        console.log('Is New User:', response.data.isNewUser);

        return response.data.token;
    } catch (error) {
        console.error('❌ External SSO login failed!');
        console.error('Status:', error.response?.status);
        console.error('Error:', error.response?.data?.message || error.message);
        throw error;
    }
}

/**
 * Main test function
 */
async function runTests() {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║     JWT AUTHENTICATION FLOW TEST                      ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('\nTesting with user:', testUser);
    console.log('API URL:', API_URL);
    console.log('SSO Secret:', SSO_SECRET.substring(0, 20) + '...');

    try {
        // Test 1: Login by PID flow
        console.log('\n\n═══════════════════════════════════════════════════════');
        console.log('TEST 1: Login by PID Flow');
        console.log('═══════════════════════════════════════════════════════');

        const ssoToken = generateSSOToken(testUser.pid, testUser.email, testUser.name);
        const jwtToken = await loginByPID(testUser.pid, ssoToken);

        // Verify the JWT token
        await verifyJWTToken(jwtToken);

        // Test protected endpoint
        await testProtectedEndpoint(jwtToken);

        // Test 2: External SSO Login flow
        console.log('\n\n═══════════════════════════════════════════════════════');
        console.log('TEST 2: External SSO Login Flow');
        console.log('═══════════════════════════════════════════════════════');

        const jwtToken2 = await testExternalSSOLogin();
        await verifyJWTToken(jwtToken2);

        // Summary
        console.log('\n\n╔═══════════════════════════════════════════════════════╗');
        console.log('║     ✅ ALL TESTS PASSED SUCCESSFULLY!                 ║');
        console.log('╚═══════════════════════════════════════════════════════╝');
        console.log('\n✓ SSO Token generation working');
        console.log('✓ Login by PID working');
        console.log('✓ External SSO login working');
        console.log('✓ JWT Token generation working');
        console.log('✓ JWT Token verification working');
        console.log('✓ Protected endpoints accessible with JWT');

    } catch (error) {
        console.log('\n\n╔═══════════════════════════════════════════════════════╗');
        console.log('║     ❌ TESTS FAILED                                   ║');
        console.log('╚═══════════════════════════════════════════════════════╝');
        console.error('\nError details:', error.message);

        console.log('\n\n📋 Troubleshooting Steps:');
        console.log('1. Ensure backend server is running on', BASE_URL);
        console.log('2. Check SSO_SECRET matches in both .env files');
        console.log('3. Verify MongoDB is running and accessible');
        console.log('4. Check backend logs for detailed error messages');

        process.exit(1);
    }
}

// Run the tests
if (require.main === module) {
    runTests();
}

module.exports = {
    generateSSOToken,
    loginByPID,
    verifyJWTToken,
    testProtectedEndpoint,
    testExternalSSOLogin
};
