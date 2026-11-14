const User = require('../models/user');
const Course = require('../models/course');
const Profile = require('../models/profile');
const Order = require('../models/order');
const CourseProgress = require('../models/courseProgress');
const mongoose = require('mongoose');

/**
 * Bulk Deactivate Users
 * @route POST /api/v1/admin/users/bulk-deactivate
 * @access Admin only
 */
exports.bulkDeactivateUsers = async (req, res) => {
    try {
        const { userIds } = req.body;

        console.log('Bulk deactivate users request:', { userIds });

        // Validate input
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User IDs array is required and must not be empty'
            });
        }

        // Validate all user IDs
        const invalidIds = userIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user IDs provided',
                invalidIds
            });
        }

        // Prevent admin from deactivating themselves
        if (userIds.includes(req.user.id)) {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate your own account'
            });
        }

        // Get users to deactivate
        const users = await User.find({ _id: { $in: userIds } });

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No users found with the provided IDs'
            });
        }

        const results = {
            successful: [],
            failed: [],
            alreadyInactive: []
        };

        // Process each user
        for (const user of users) {
            try {
                if (!user.active) {
                    results.alreadyInactive.push({
                        userId: user._id,
                        email: user.email,
                        name: `${user.firstName} ${user.lastName}`
                    });
                    continue;
                }

                // Deactivate user
                user.active = false;
                await user.save();

                results.successful.push({
                    userId: user._id,
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    accountType: user.accountType
                });

                console.log(`✅ User deactivated: ${user.email}`);

            } catch (error) {
                console.error(`❌ Error deactivating user ${user.email}:`, error);
                results.failed.push({
                    userId: user._id,
                    email: user.email,
                    error: error.message
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: `Bulk deactivation completed. ${results.successful.length} users deactivated.`,
            data: {
                summary: {
                    total: userIds.length,
                    successful: results.successful.length,
                    failed: results.failed.length,
                    alreadyInactive: results.alreadyInactive.length
                },
                results
            }
        });

    } catch (error) {
        console.error('Error in bulkDeactivateUsers:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deactivating users',
            error: error.message
        });
    }
};

/**
 * Bulk Activate Users
 * @route POST /api/v1/admin/users/bulk-activate
 * @access Admin only
 */
exports.bulkActivateUsers = async (req, res) => {
    try {
        const { userIds } = req.body;

        console.log('Bulk activate users request:', { userIds });

        // Validate input
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User IDs array is required and must not be empty'
            });
        }

        // Validate all user IDs
        const invalidIds = userIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user IDs provided',
                invalidIds
            });
        }

        // Get users to activate
        const users = await User.find({ _id: { $in: userIds } });

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No users found with the provided IDs'
            });
        }

        const results = {
            successful: [],
            failed: [],
            alreadyActive: []
        };

        // Process each user
        for (const user of users) {
            try {
                if (user.active) {
                    results.alreadyActive.push({
                        userId: user._id,
                        email: user.email,
                        name: `${user.firstName} ${user.lastName}`
                    });
                    continue;
                }

                // Activate user
                user.active = true;
                await user.save();

                results.successful.push({
                    userId: user._id,
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    accountType: user.accountType
                });

                console.log(`✅ User activated: ${user.email}`);

            } catch (error) {
                console.error(`❌ Error activating user ${user.email}:`, error);
                results.failed.push({
                    userId: user._id,
                    email: user.email,
                    error: error.message
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: `Bulk activation completed. ${results.successful.length} users activated.`,
            data: {
                summary: {
                    total: userIds.length,
                    successful: results.successful.length,
                    failed: results.failed.length,
                    alreadyActive: results.alreadyActive.length
                },
                results
            }
        });

    } catch (error) {
        console.error('Error in bulkActivateUsers:', error);
        return res.status(500).json({
            success: false,
            message: 'Error activating users',
            error: error.message
        });
    }
};

/**
 * Bulk Delete Users (Soft Delete - Move to Recycle Bin)
 * @route POST /api/v1/admin/users/bulk-delete
 * @access Admin only
 */
exports.bulkDeleteUsers = async (req, res) => {
    try {
        const { userIds, permanent = false } = req.body;

        console.log('Bulk delete users request:', { userIds, permanent });

        // Validate input
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User IDs array is required and must not be empty'
            });
        }

        // Validate all user IDs
        const invalidIds = userIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user IDs provided',
                invalidIds
            });
        }

        // Prevent admin from deleting themselves
        if (userIds.includes(req.user.id)) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        // Get users to delete
        const users = await User.find({ _id: { $in: userIds } });

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No users found with the provided IDs'
            });
        }

        const results = {
            successful: [],
            failed: [],
            protected: []
        };

        // Process each user
        for (const user of users) {
            try {
                // Protect admin accounts from deletion
                if (user.accountType === 'Admin' && !permanent) {
                    results.protected.push({
                        userId: user._id,
                        email: user.email,
                        name: `${user.firstName} ${user.lastName}`,
                        reason: 'Admin accounts cannot be soft deleted'
                    });
                    continue;
                }

                if (permanent) {
                    // PERMANENT DELETE - Remove all related data

                    // Remove user from enrolled courses
                    await Course.updateMany(
                        { studentsEnrolled: user._id },
                        { $pull: { studentsEnrolled: user._id } }
                    );

                    // Delete course progress
                    await CourseProgress.deleteMany({ userId: user._id });

                    // Delete orders
                    await Order.deleteMany({ user: user._id });

                    // Delete profile
                    if (user.additionalDetails) {
                        await Profile.findByIdAndDelete(user.additionalDetails);
                    }

                    // Delete the user
                    await User.findByIdAndDelete(user._id);

                    results.successful.push({
                        userId: user._id,
                        email: user.email,
                        name: `${user.firstName} ${user.lastName}`,
                        accountType: user.accountType,
                        deletionType: 'permanent'
                    });

                    console.log(`✅ User permanently deleted: ${user.email}`);

                } else {
                    // SOFT DELETE - Mark as deleted
                    user.isDeleted = true;
                    user.deletedAt = new Date();
                    user.deletedBy = req.user.id;
                    user.active = false; // Also deactivate
                    await user.save();

                    results.successful.push({
                        userId: user._id,
                        email: user.email,
                        name: `${user.firstName} ${user.lastName}`,
                        accountType: user.accountType,
                        deletionType: 'soft'
                    });

                    console.log(`✅ User soft deleted: ${user.email}`);
                }

            } catch (error) {
                console.error(`❌ Error deleting user ${user.email}:`, error);
                results.failed.push({
                    userId: user._id,
                    email: user.email,
                    error: error.message
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: `Bulk deletion completed. ${results.successful.length} users ${permanent ? 'permanently deleted' : 'moved to recycle bin'}.`,
            data: {
                summary: {
                    total: userIds.length,
                    successful: results.successful.length,
                    failed: results.failed.length,
                    protected: results.protected.length
                },
                results
            }
        });

    } catch (error) {
        console.error('Error in bulkDeleteUsers:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting users',
            error: error.message
        });
    }
};

/**
 * Bulk Restore Users (from Recycle Bin)
 * @route POST /api/v1/admin/users/bulk-restore
 * @access Admin only
 */
exports.bulkRestoreUsers = async (req, res) => {
    try {
        const { userIds } = req.body;

        console.log('Bulk restore users request:', { userIds });

        // Validate input
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User IDs array is required and must not be empty'
            });
        }

        // Get deleted users
        const users = await User.find({
            _id: { $in: userIds },
            isDeleted: true
        });

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No deleted users found with the provided IDs'
            });
        }

        const results = {
            successful: [],
            failed: []
        };

        // Process each user
        for (const user of users) {
            try {
                user.isDeleted = false;
                user.deletedAt = null;
                user.deletedBy = null;
                user.active = true; // Reactivate
                await user.save();

                results.successful.push({
                    userId: user._id,
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    accountType: user.accountType
                });

                console.log(`✅ User restored: ${user.email}`);

            } catch (error) {
                console.error(`❌ Error restoring user ${user.email}:`, error);
                results.failed.push({
                    userId: user._id,
                    email: user.email,
                    error: error.message
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: `Bulk restore completed. ${results.successful.length} users restored.`,
            data: {
                summary: {
                    total: userIds.length,
                    successful: results.successful.length,
                    failed: results.failed.length
                },
                results
            }
        });

    } catch (error) {
        console.error('Error in bulkRestoreUsers:', error);
        return res.status(500).json({
            success: false,
            message: 'Error restoring users',
            error: error.message
        });
    }
};

module.exports = {
    bulkDeactivateUsers: exports.bulkDeactivateUsers,
    bulkActivateUsers: exports.bulkActivateUsers,
    bulkDeleteUsers: exports.bulkDeleteUsers,
    bulkRestoreUsers: exports.bulkRestoreUsers
};
