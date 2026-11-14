const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { s3Client, BUCKET_NAME } = require('../config/awsS3');

// Configure S3 storage
const storage = multerS3({
    s3: s3Client,
    bucket: BUCKET_NAME,
    // ACL removed - bucket uses bucket policy for public access instead
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
        console.log('📝 Setting metadata for file:', file.originalname);
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        // Organize files by type
        let folder = 'documents';

        if (file.fieldname === 'video' || file.fieldname === 'videoFile') {
            folder = 'videos';
        } else if (file.fieldname === 'thumbnail' || file.fieldname === 'image' || file.fieldname === 'thumbnailImage') {
            folder = 'images';
        } else if (file.fieldname === 'profileImage') {
            folder = 'profiles';
        } else if (file.fieldname === 'assignmentFile') {
            folder = 'assignments';
        } else if (file.fieldname === 'files' || file.fieldname === 'submissionFile') {
            folder = 'submissions';
        }

        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = file.fieldname + '-' + uniqueSuffix + ext;
        const s3Key = `${folder}/${filename}`;

        console.log(`📤 Uploading to S3: ${BUCKET_NAME}/${s3Key}`);
        cb(null, s3Key);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB max file size
    },
    fileFilter: function (req, file, cb) {
        // Accept any image (covers jpg, png, gif, webp, svg, avif, heic, bmp, tiff, ico, etc.)
        if (file.mimetype.startsWith('image/')) {
            return cb(null, true);
        }

        // Accept common video formats
        const videoMimetypes = /^video\/(mp4|mpeg|quicktime|x-msvideo|webm|x-matroska|x-flv|x-ms-wmv)$/i;
        if (videoMimetypes.test(file.mimetype)) {
            return cb(null, true);
        }

        // Accept documents by extension as fallback
        const allowedDocExts = /\.(pdf|ppt|pptx|doc|docx|txt|zip)$/i;
        if (file.originalname.match(allowedDocExts)) {
            return cb(null, true);
        }

        return cb(new Error(`Invalid file type "${file.mimetype}". Allowed: images (any format), videos, and documents.`), false);
    }
});

module.exports = { upload };
