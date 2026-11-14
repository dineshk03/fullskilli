/**
 * Generate Tokens for Testing PID Login
 * 
 * This script generates both SSO token and PID login token
 * Run: node create-test-user.js [pid]
 */

const jwt = require('jsonwebtoken');

const SSO_SECRET = 'skilli_jobs_beeja_lms_shared_secret_key_2024';

// Test user data
const pid = process.argv[2] || '123';
const testUser = {
    email: 'testuser@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: '+91 9876543210',
    pid: pid
};

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║           TEST USER TOKENS GENERATOR                           ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');
// STEP 1: Generate SSO token (for creating user)
const ssoToken = jwt.sign(
    {
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
    },
    SSO_SECRET
);

// STEP 2: Generate PID login token
const pidToken = jwt.sign(
    {
        pid: testUser.pid,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
    },
    SSO_SECRET
);

console.log('📋 Test User Data:');
console.log('   Email:', testUser.email);
console.log('   Name:', testUser.firstName, testUser.lastName);
console.log('   PID:', testUser.pid);
console.log('   Phone:', testUser.phone);

console.log('\n─────────────────────────────────────────────────────────────────\n');

console.log('STEP 1: Create User in Beeja LMS');
console.log('\nEndpoint: POST http://localhost:5001/api/v1/auth/external-sso-login');
console.log('\nBody:\n');
console.log(JSON.stringify({
    token: ssoToken,
    email: testUser.email,
    firstName: testUser.firstName,
    lastName: testUser.lastName,
    phone: testUser.phone,
    pid: testUser.pid
}, null, 2));

console.log('\n─────────────────────────────────────────────────────────────────\n');

console.log('STEP 2: Login by PID');
console.log('\nEndpoint: POST http://localhost:5001/api/v1/auth/login-by-pid');
console.log('\nBody:\n');
console.log(JSON.stringify({
    pid: testUser.pid,
    token: pidToken
}, null, 2));

console.log('\n─────────────────────────────────────────────────────────────────\n');
console.log('✅ Tokens generated successfully!');
console.log('\n💡 Copy the JSON above and use in Postman\n');
