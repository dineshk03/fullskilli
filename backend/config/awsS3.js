const { S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { 
    PutObjectCommand, 
    GetObjectCommand, 
    DeleteObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand
} = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
    region: (process.env.AWS_REGION || 'us-east-1').replace(/^["']|["']$/g, ''),
    credentials: {
        accessKeyId: (process.env.AWS_ACCESS_KEY_ID || '').replace(/^["']|["']$/g, ''),
        secretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY || '').replace(/^["']|["']$/g, ''),
    },
});

const BUCKET_NAME = (process.env.AWS_S3_BUCKET_NAME || '').replace(/^["']|["']$/g, '');
const CLOUDFRONT_DOMAIN = (process.env.AWS_CLOUDFRONT_DOMAIN || '').replace(/^["']|["']$/g, '');

// Helper function to get public URL
const getPublicUrl = (key) => {
    if (CLOUDFRONT_DOMAIN) {
        return `https://${CLOUDFRONT_DOMAIN}/${key}`;
    }
    const cleanRegion = (process.env.AWS_REGION || 'us-east-1').replace(/^["']|["']$/g, '');
    return `https://${BUCKET_NAME}.s3.${cleanRegion}.amazonaws.com/${key}`;
};

module.exports = {
    s3Client,
    BUCKET_NAME,
    CLOUDFRONT_DOMAIN,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand,
    getSignedUrl,
    getPublicUrl
};
