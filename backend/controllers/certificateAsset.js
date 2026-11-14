const crypto = require('node:crypto');
const multer = require('multer');
const { s3Client, BUCKET_NAME, PutObjectCommand, DeleteObjectCommand, getPublicUrl } = require('../config/awsS3');
const CertificateAsset = require('../models/certificateAsset');

const types = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    callback(null, Boolean(types[file.mimetype]));
  },
}).single('asset');

function uploadCertificateAsset(req, res) {
  upload(req, res, async error => {
    if (error) return res.status(400).json({ success: false, message: error.code === 'LIMIT_FILE_SIZE' ? 'Image must be under 2 MB' : 'Invalid image upload' });
    if (!req.file) return res.status(400).json({ success: false, message: 'Upload a PNG, JPEG or WebP image' });
    if (!BUCKET_NAME) return res.status(503).json({ success: false, message: 'Certificate image storage is not configured' });
    const key = `certificate-assets/${crypto.randomUUID()}.${types[req.file.mimetype]}`;
    let uploaded = false;
    try {
      await s3Client.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key, Body: req.file.buffer, ContentType: req.file.mimetype }));
      uploaded = true;
      const url = getPublicUrl(key);
      await CertificateAsset.create({ key, url, mimeType: req.file.mimetype, originalName: req.file.originalname, size: req.file.size, data: req.file.buffer, uploadedBy: req.user.id });
      return res.json({ success: true, url });
    } catch (uploadError) {
      console.error('Certificate image upload failed:', uploadError);
      if (uploaded) {
        try { await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key })); }
        catch (cleanupError) { console.error('Certificate image cleanup failed:', cleanupError); }
      }
      return res.status(500).json({ success: false, message: 'Could not upload certificate image' });
    }
  });
}

async function getCertificateAssetImage(req, res) {
  const url = req.query.url;
  if (typeof url !== 'string' || url.length > 2000 || !/^https?:\/\//i.test(url)) return res.status(400).json({ success: false, message: 'Invalid image URL' });
  try {
    const asset = await CertificateAsset.findOne({ url }).select('data mimeType');
    if (!asset?.data?.length) return res.status(404).json({ success: false, message: 'Certificate image not found. Re-upload the image.' });
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('X-Content-Type-Options', 'nosniff');
    return res.type(asset.mimeType).send(asset.data);
  } catch {
    return res.status(500).json({ success: false, message: 'Could not load certificate image' });
  }
}
module.exports = { uploadCertificateAsset, getCertificateAssetImage };
