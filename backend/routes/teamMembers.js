const express = require('express');
const router = express.Router();

const { getPublicTeamMembers } = require('../controllers/teamMember');

router.get('/', getPublicTeamMembers);

module.exports = router;
