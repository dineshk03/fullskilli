const multer = require('multer');
const { upload } = require('./multer');

// Middleware that uses multer only if a file is present in the request
const optionalUpload = (fieldName) => (req, res, next) => {
  // Check if the request has the file field
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    // Use multer to handle the request
    return upload.single(fieldName)(req, res, next);
  } else {
    // No file, proceed without multer
    next();
  }
};

module.exports = { optionalUpload };
