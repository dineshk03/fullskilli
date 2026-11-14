const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../../middleware/auth');
const EmailLog = require('../../models/emailLog');

/**
 * @route   GET /api/admin/email-logs
 * @desc    Get all email logs with filtering and pagination
 * @access  Admin only
 */
router.get('/email-logs', auth, isAdmin, async (req, res) => {
    try {
        const {
            status,      // Filter by status: SENT, FAILED, INVALID, BOUNCED
            email,       // Filter by specific email
            context,     // Filter by context
            page = 1,    // Page number
            limit = 50,  // Results per page
            sortBy = 'createdAt', // Sort field
            sortOrder = 'desc'    // Sort order: asc or desc
        } = req.query;

        // Build filter query
        const filter = {};
        if (status) filter.status = status;
        if (email) filter.email = { $regex: email, $options: 'i' }; // Case-insensitive search
        if (context) filter.context = context;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        // Get total count
        const totalCount = await EmailLog.countDocuments(filter);

        // Get email logs
        const emailLogs = await EmailLog.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .select('-htmlContent -textContent'); // Exclude large content fields

        // Get status statistics
        const statusStats = await EmailLog.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const stats = {
            total: totalCount,
            sent: statusStats.find(s => s._id === 'SENT')?.count || 0,
            failed: statusStats.find(s => s._id === 'FAILED')?.count || 0,
            invalid: statusStats.find(s => s._id === 'INVALID')?.count || 0,
            bounced: statusStats.find(s => s._id === 'BOUNCED')?.count || 0
        };

        res.status(200).json({
            success: true,
            data: emailLogs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalRecords: totalCount,
                recordsPerPage: parseInt(limit)
            },
            stats
        });

    } catch (error) {
        console.error('Error fetching email logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch email logs',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/admin/email-logs/:id
 * @desc    Get single email log with full content
 * @access  Admin only
 */
router.get('/email-logs/:id', auth, isAdmin, async (req, res) => {
    try {
        const emailLog = await EmailLog.findById(req.params.id);

        if (!emailLog) {
            return res.status(404).json({
                success: false,
                message: 'Email log not found'
            });
        }

        res.status(200).json({
            success: true,
            data: emailLog
        });

    } catch (error) {
        console.error('Error fetching email log:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch email log',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/admin/email-logs/stats/summary
 * @desc    Get email statistics summary
 * @access  Admin only
 */
router.get('/email-logs/stats/summary', auth, isAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }

        // Get overall stats
        const totalEmails = await EmailLog.countDocuments(dateFilter);
        const statusBreakdown = await EmailLog.aggregate([
            ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Get context breakdown
        const contextBreakdown = await EmailLog.aggregate([
            ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
            { $group: { _id: '$context', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Get recent invalid emails
        const recentInvalid = await EmailLog.find({
            status: 'INVALID',
            ...dateFilter
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('email subject error createdAt');

        // Calculate success rate
        const sentCount = statusBreakdown.find(s => s._id === 'SENT')?.count || 0;
        const successRate = totalEmails > 0 ? ((sentCount / totalEmails) * 100).toFixed(2) : 0;

        res.status(200).json({
            success: true,
            data: {
                totalEmails,
                successRate: `${successRate}%`,
                statusBreakdown: statusBreakdown.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                contextBreakdown: contextBreakdown.map(item => ({
                    context: item._id || 'unknown',
                    count: item.count
                })),
                recentInvalid
            }
        });

    } catch (error) {
        console.error('Error fetching email stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch email statistics',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/admin/email-logs/:id
 * @desc    Delete a specific email log
 * @access  Admin only
 */
router.delete('/email-logs/:id', auth, isAdmin, async (req, res) => {
    try {
        const emailLog = await EmailLog.findByIdAndDelete(req.params.id);

        if (!emailLog) {
            return res.status(404).json({
                success: false,
                message: 'Email log not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Email log deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting email log:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete email log',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/admin/email-logs/cleanup
 * @desc    Cleanup old email logs
 * @access  Admin only
 */
router.post('/email-logs/cleanup', auth, isAdmin, async (req, res) => {
    try {
        const { daysOld = 90, status } = req.body;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));

        const filter = {
            createdAt: { $lt: cutoffDate }
        };

        if (status) {
            filter.status = status;
        }

        const result = await EmailLog.deleteMany(filter);

        res.status(200).json({
            success: true,
            message: `Cleaned up ${result.deletedCount} email logs older than ${daysOld} days`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('Error cleaning up email logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup email logs',
            error: error.message
        });
    }
});

module.exports = router;
