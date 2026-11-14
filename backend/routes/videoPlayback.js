const express = require('express');
const mongoose = require('mongoose');
const { pipeline } = require('node:stream/promises');
const { auth } = require('../middleware/auth');
const { canAccessCourse, courseForSubsection } = require('../utils/courseAuthorization');
const { parseRange } = require('../utils/httpRange');
const ChunkedVideo = require('../models/chunkedVideo');
const SubSection = require('../models/subSection');
const { s3Client, BUCKET_NAME, getSignedUrl, GetObjectCommand, HeadObjectCommand } = require('../config/awsS3');
const router = express.Router();

router.use((req, res, next) => {
    if (!req.headers.authorization && typeof req.query.token === 'string') req.headers.authorization = `Bearer ${req.query.token}`;
    res.set('Cache-Control', 'private, no-store');
    auth(req, res, next);
});

function keyFromUrl(value) {
    const url = new URL(value);
    const allowedHosts = [`${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`,
        `${BUCKET_NAME}.s3.amazonaws.com`, process.env.AWS_CLOUDFRONT_DOMAIN].filter(Boolean);
    if (url.protocol !== 'https:' || !allowedHosts.includes(url.hostname)) throw new Error('Unsupported storage URL');
    return decodeURIComponent(url.pathname.slice(1));
}

async function resolveMedia(req) {
    if (req.params.subSectionId) {
        if (!mongoose.isValidObjectId(req.params.subSectionId)) return null;
        const subsection = await SubSection.findById(req.params.subSectionId);
        if (!subsection?.videoUrl) return null;
        return { subsection, key: keyFromUrl(subsection.videoUrl), title: subsection.title };
    }
    const video = await ChunkedVideo.findOne({ videoId: req.params.videoId, isComplete: true });
    if (!video?.finalVideoUrl) return null;
    const subsection = await SubSection.findOne({ videoUrl: video.finalVideoUrl });
    return subsection ? { subsection, key: video.s3Key, video, title: subsection.title } : null;
}

const authorized = handler => async (req, res) => {
    try {
        const media = await resolveMedia(req);
        if (!media) return res.status(404).json({ success: false, message: 'Video not found' });
        if (!await canAccessCourse(req.user, await courseForSubsection(media.subsection._id))) return res.status(403).json({ success: false, message: 'Course access denied' });
        await handler(req, res, media);
    } catch (error) {
        console.error('Video playback failed:', error);
        if (res.headersSent) return res.destroy();
        return res.status(502).json({ success: false, message: 'Video temporarily unavailable' });
    }
};

const info = authorized(async (req, res, media) => {
    const videoUrl = await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: BUCKET_NAME, Key: media.key }), { expiresIn: 300 });
    res.json({ success: true, data: {
        videoId: media.video?.videoId, subSectionId: media.subsection._id, title: media.title,
        duration: media.video?.duration || media.subsection.timeDuration || 0,
        totalSize: media.video?.totalSize, isComplete: true, isChunked: false, videoUrl,
        streamUrl: media.video ? `/api/v1/video/stream/${media.video.videoId}` : `/api/v1/video/direct/${media.subsection._id}`,
        chunks: [{ index: 0, url: videoUrl, size: media.video?.totalSize }]
    } });
});

const stream = authorized(async (req, res, media) => {
    const head = await s3Client.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: media.key }));
    const size = Number(head.ContentLength);
    let range;
    try { range = parseRange(req.headers.range, size); }
    catch { return res.status(416).set('Content-Range', `bytes */${size}`).end(); }
    const object = await s3Client.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: media.key,
        ...(range ? { Range: `bytes=${range.start}-${range.end}` } : {}) }));
    res.status(range ? 206 : 200).set({
        'Content-Type': head.ContentType || 'video/mp4', 'Accept-Ranges': 'bytes',
        'Content-Length': String(range ? range.end - range.start + 1 : size),
        ...(range ? { 'Content-Range': `bytes ${range.start}-${range.end}/${size}` } : {})
    });
    await pipeline(object.Body, res);
});
router.get('/manifest/:videoId', info);
router.get('/info/:videoId', info);
router.get('/direct-info/:subSectionId', info);
router.get('/stream/:videoId', stream);
router.get('/direct/:subSectionId', stream);
module.exports = router;
