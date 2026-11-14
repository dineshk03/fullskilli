const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const {
    bulkDeactivateUsers,
    bulkActivateUsers,
    bulkDeleteUsers,
    bulkRestoreUsers
} = require('../controllers/bulkUserManagement');

/**
 * @route   POST /api/v1/admin/users/bulk-deactivate
 * @desc    Deactivate multiple users at once
 * @access  Admin only
 * @body    { userIds: ["id1", "id2", ...] }
 */
router.post('/users/bulk-deactivate', auth, isAdmin, bulkDeactivateUsers);

/**
 * @route   POST /api/v1/admin/users/bulk-activate
 * @desc    Activate multiple users at once
 * @access  Admin only
 * @body    { userIds: ["id1", "id2", ...] }
 */
router.post('/users/bulk-activate', auth, isAdmin, bulkActivateUsers);

/**
 * @route   POST /api/v1/admin/users/bulk-delete
 * @desc    Delete multiple users (soft delete by default, permanent if specified)
 * @access  Admin only
 * @body    { userIds: ["id1", "id2", ...], permanent: false }
 */
router.post('/users/bulk-delete', auth, isAdmin, bulkDeleteUsers);

/**
 * @route   POST /api/v1/admin/users/bulk-restore
 * @desc    Restore multiple deleted users from recycle bin
 * @access  Admin only
 * @body    { userIds: ["id1", "id2", ...] }
 */
router.post('/users/bulk-restore', auth, isAdmin, bulkRestoreUsers);

module.exports = router;
