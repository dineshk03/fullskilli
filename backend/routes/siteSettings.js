const express = require('express');
const router = express.Router();

const { getPublicSiteSettings } = require('../controllers/siteSettings');

router.get('/', getPublicSiteSettings);

module.exports = router;
