const express = require('express');
const router = express.Router();

const { auth, isAdmin } = require('../../middleware/auth');
const { getAdminSiteSettings, updateAdminSiteSettings } = require('../../controllers/siteSettings');

router.get('/', auth, isAdmin, getAdminSiteSettings);
router.put('/', auth, isAdmin, updateAdminSiteSettings);

module.exports = router;
