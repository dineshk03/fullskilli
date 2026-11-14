require('dotenv').config();
const { s3Client, BUCKET_NAME } = require('./config/awsS3');
const { ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');

async function testS3Connection() {
    console.log('🔧 Testing S3 Connection...');
    console.log('Bucket:', BUCKET_NAME);
    console.log('Region:', process.env.AWS_REGION);
    console.log('Has Credentials:', !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY));
    
    try {
        // Test 1: List objects in bucket
        console.log('\n📋 Test 1: Listing bucket contents...');
        const listCommand = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            MaxKeys: 5
        });
        
        const listResult = await s3Client.send(listCommand);
        console.log('✅ Bucket accessible! Objects found:', listResult.KeyCount || 0);
        
        // Test 2: Upload a small test file
        console.log('\n📤 Test 2: Uploading test file...');
        const testContent = Buffer.from('Test upload from LMS backend');
        const uploadCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: 'test/connection-test.txt',
            Body: testContent,
            ContentType: 'text/plain'
        });
        
        await s3Client.send(uploadCommand);
        console.log('✅ Test upload successful!');
        
        console.log('\n🎉 S3 connection is working properly!');
        
    } catch (error) {
        console.error('\n❌ S3 Connection Failed:');
        console.error('Error:', error.message);
        console.error('Code:', error.code || 'Unknown');
        
        if (error.message.includes('NoSuchBucket')) {
            console.error('💡 Solution: Create the S3 bucket or check the bucket name');
        } else if (error.message.includes('AccessDenied')) {
            console.error('💡 Solution: Check AWS credentials and bucket permissions');
        } else if (error.message.includes('NetworkingError')) {
            console.error('💡 Solution: Check internet connection and AWS region');
        }
    }
}

testS3Connection();
