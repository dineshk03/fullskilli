const express = require('express');
const router = express.Router();

const { auth, isAdmin } = require('../../middleware/auth');
const { optionalUpload } = require('../../middleware/optionalUpload');
const {
  getAllTeamMembersAdmin,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} = require('../../controllers/teamMember');

router.get('/', auth, isAdmin, getAllTeamMembersAdmin);
router.post('/', auth, isAdmin, optionalUpload('image'), createTeamMember);
router.put('/:memberId', auth, isAdmin, optionalUpload('image'), updateTeamMember);
router.delete('/:memberId', auth, isAdmin, deleteTeamMember);

module.exports = router;
