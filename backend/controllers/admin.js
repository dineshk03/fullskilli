
const User = require('../models/user');
const Course = require('../models/course');
const Profile = require('../models/profile');
const bcrypt = require('bcrypt');

const mongoose = require('mongoose');
const Category = require('../models/category');
const Section = require('../models/section');
const SubSection = require('../models/subSection');
const Notification = require('../models/notification');
const UserNotificationStatus = require('../models/userNotificationStatus');
const EmailLog = require('../models/emailLog');
const mailSender = require('../utils/mailSender');
const bulkUserWelcomeTemplate = require('../mail/templates/bulkUserWelcomeTemplate');
const Batch = require('../models/Batch');
const courseAssignmentTemplate = require('../mail/templates/courseAssignmentTemplate');
const {
    createInstructorApprovalNotification,
    createNewCourseCreationNotification,
    createNewCourseAnnouncementToAll
} = require('./notification');

// ================ TOGGLE USER STATUS ================
exports.toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;

        console.log('Toggle user status request:', { userId, body: req.body });

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const user = await User.findById(userId).populate('additionalDetails');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.active = !user.active;
        await user.save();

        const updatedUser = await User.findById(userId).populate('additionalDetails').select('-password');

        // If activating an instructor, send approval notification
        if (user.active && user.accountType === 'Instructor') {
            await createInstructorApprovalNotification(user._id);
        }

        return res.status(200).json({
            success: true,
            message: `User ${user.active ? 'activated' : 'deactivated'} successfully`,
            user: updatedUser
        });
    } catch (error) {
        console.error('Error toggling user status:', error);
        return res.status(500).json({
            success: false,
            message: 'Error toggling user status',
            error: error.message
        });
    }
};

// ================ CLONE COURSE ================
exports.cloneCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { courseName: requestedName } = req.body || {};

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID'
            });
        }

        const course = await Course.findById(courseId)
            .populate({
                path: 'courseContent',
                populate: {
                    path: 'subSection'
                }
            });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        const baseName = (requestedName || `${course.courseName} (Copy)`).trim();
        let newCourseName = baseName;
        let attempt = 1;
        while (await Course.exists({ courseName: newCourseName })) {
            attempt += 1;
            newCourseName = `${baseName} ${attempt}`;
        }

        const newSectionIds = [];
        const originalSections = Array.isArray(course.courseContent) ? course.courseContent : [];

        for (const sectionDoc of originalSections) {
            const sectionObject = sectionDoc.toObject({ depopulate: true });
            const subSections = Array.isArray(sectionObject.subSection) ? sectionObject.subSection : [];

            const { _id, __v, subSection: _unused, ...restSection } = sectionObject;
            const newSection = await Section.create({
                ...restSection,
                subSection: []
            });

            for (const subDoc of subSections) {
                const subObject = (typeof subDoc.toObject === 'function')
                    ? subDoc.toObject({ depopulate: true })
                    : subDoc;

                const { _id: _subId, __v: _subV, section: _oldSection, ...restSub } = subObject;
                const createdSubSection = await SubSection.create({
                    ...restSub,
                    section: newSection._id
                });
                newSection.subSection.push(createdSubSection._id);
            }

            await newSection.save();
            newSectionIds.push(newSection._id);
        }

        const clonedCoursePayload = {
            courseName: newCourseName,
            courseDescription: course.courseDescription,
            instructor: course.instructor,
            whatYouWillLearn: course.whatYouWillLearn,
            price: course.price,
            tag: course.tag,
            category: course.category,
            thumbnail: course.thumbnail,
            status: 'Draft',
            instructions: course.instructions,
            courseContent: newSectionIds,
            studentsEnrolled: [],
            ratingAndReviews: [],
            courseType: course.courseType,
            adminSetFree: course.adminSetFree,
            originalPrice: course.originalPrice,
            createdAt: new Date(),
        };

        if (course.certificateEnabled !== undefined) {
            clonedCoursePayload.certificateEnabled = course.certificateEnabled;
        }

        const clonedCourse = await Course.create(clonedCoursePayload);

        if (course.instructor) {
            await User.findByIdAndUpdate(course.instructor, {
                $addToSet: { courses: clonedCourse._id }
            }).catch(() => { });
        }

        if (course.category) {
            await Category.findByIdAndUpdate(course.category, {
                $addToSet: { courses: clonedCourse._id }
            }).catch(() => { });
        }

        const populatedClonedCourse = await Course.findById(clonedCourse._id)
            .populate('instructor', 'firstName lastName email')
            .populate('category', 'name description');

        return res.status(201).json({
            success: true,
            message: 'Course cloned successfully',
            course: populatedClonedCourse
        });
    } catch (error) {
        console.error('Error cloning course:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to clone course',
            error: error.message
        });
    }
};

// ================ GET ALL USERS ================
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({})
            .populate('additionalDetails')
            .populate('batches')
            .select('-password')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            users,
            message: 'Users fetched successfully'
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// ================ CREATE USER ================
exports.createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password, accountType, contactNumber } = req.body;

        console.log('Create user request received:', {
            firstName,
            lastName,
            email,
            accountType,
            contactNumber: contactNumber ? 'provided' : 'not provided'
        });

        // Validate required fields
        if (!firstName || !lastName || !email || !password || !accountType) {
            console.log('Validation failed - missing required fields');
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided',
                missingFields: {
                    firstName: !firstName,
                    lastName: !lastName,
                    email: !email,
                    password: !password,
                    accountType: !accountType
                }
            });
        }

        // Validate account type
        if (!['Admin', 'Instructor', 'Student'].includes(accountType)) {
            console.log('Invalid account type:', accountType);
            return res.status(400).json({
                success: false,
                message: 'Invalid account type. Must be Admin, Instructor, or Student'
            });
        }

        // Check for existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists with email:', email);
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create profile
        console.log('Creating profile with contactNumber:', contactNumber);
        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: contactNumber || null
        });

        console.log('Profile created successfully:', profileDetails._id);

        // Create user
        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            accountType,
            additionalDetails: profileDetails._id,
            approved: true,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
        });

        console.log('User created successfully:', user._id);

        // Remove password from response
        user.password = undefined;

        return res.status(201).json({
            success: true,
            user,

        });
    } catch (error) {
        console.error('Error creating user:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });

        // Handle specific MongoDB validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationErrors
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
};

// ================ BULK USER UPLOAD ================
exports.bulkUserUpload = async (req, res) => {
    try {
        const { users } = req.body;

        console.log('Bulk user upload request received:', {
            userCount: users?.length,
            sampleUser: users?.[0]
        });

        // Validate request
        if (!users || !Array.isArray(users) || users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Users array is required and must not be empty'
            });
        }

        const results = {
            successful: [],
            failed: [],
            skipped: [],
            emailStatus: {
                sent: 0,
                failed: 0,
                details: []
            }
        };

        let batchesAssigned = 0;

        const getFieldValue = (row, keys = []) => {
            if (!row || typeof row !== 'object') return undefined;

            // Fast path: exact keys
            for (const key of keys) {
                if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
                    return row[key];
                }
            }

            // Case/space-insensitive match for CSV headers
            const normalizedMap = {};
            for (const k of Object.keys(row)) {
                normalizedMap[String(k).toLowerCase().replace(/\s+/g, '')] = k;
            }

            for (const key of keys) {
                const normalizedKey = String(key).toLowerCase().replace(/\s+/g, '');
                const actualKey = normalizedMap[normalizedKey];
                if (actualKey && row[actualKey] !== undefined && row[actualKey] !== null && String(row[actualKey]).trim() !== '') {
                    return row[actualKey];
                }
            }

            return undefined;
        };

        // Get login URL from environment or use default
        const loginUrl = process.env.FRONTEND_URL
            ? `${process.env.FRONTEND_URL}/login`
            : 'http://lms.skilli.jobs/login';

        // Process each user
        for (let i = 0; i < users.length; i++) {
            const userData = users[i];
            const { firstName, lastName, email, password, accountType, contactNumber, groupName, groups } = userData;

            // Support multiple CSV header variants
            const batchId = getFieldValue(userData, ['batchId', 'BatchId', 'batch_id', 'Batch ID', 'batch id', 'batch']);
            const batchName = getFieldValue(userData, ['batchName', 'BatchName', 'batch_name', 'Batch Name', 'batch name', 'Batch']);

            const normalizedEmail = String(email || '').toLowerCase().trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            try {
                // Validate required fields
                if (!firstName || !lastName || !normalizedEmail || !password || !accountType) {
                    results.failed.push({
                        row: i + 1,
                        email: normalizedEmail || 'N/A',
                        reason: 'Missing required fields',
                        error: 'Missing required fields',
                        missingFields: {
                            firstName: !firstName,
                            lastName: !lastName,
                            email: !normalizedEmail,
                            password: !password,
                            accountType: !accountType
                        }
                    });
                    continue;
                }

                // Validate email format
                if (!emailRegex.test(normalizedEmail)) {
                    results.failed.push({
                        row: i + 1,
                        email: normalizedEmail,
                        reason: 'Invalid email format',
                        error: 'Invalid email format'
                    });
                    continue;
                }

                // Validate account type
                if (!['Admin', 'Instructor', 'Student'].includes(accountType)) {
                    const msg = `Invalid account type: ${accountType}. Must be Admin, Instructor, or Student`;
                    results.failed.push({
                        row: i + 1,
                        email: normalizedEmail,
                        reason: msg,
                        error: msg
                    });
                    continue;
                }

                // Check for existing user (case-insensitive)
                const existingUser = await User.findOne({ email: normalizedEmail });
                if (existingUser) {
                    results.skipped.push({
                        row: i + 1,
                        email: normalizedEmail,
                        reason: 'User with this email already exists'
                    });
                    continue;
                }

                // Store the plain password for email (before hashing)
                const plainPassword = password;

                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Create profile
                const profileDetails = await Profile.create({
                    gender: null,
                    dateOfBirth: null,
                    about: null,
                    contactNumber: contactNumber || null
                });

                // Resolve batch (optional)
                let resolvedBatch = null;
                let resolvedBatchName = null;

                const hasBatchInput = Boolean(
                    (batchId && String(batchId).trim()) || (batchName && String(batchName).trim())
                );

                if (batchId && String(batchId).trim()) {
                    const batchIdRaw = String(batchId).trim();
                    if (mongoose.Types.ObjectId.isValid(batchIdRaw)) {
                        resolvedBatch = await Batch.findById(batchIdRaw);
                    } else {
                        // Some CSVs put the batch name under the batchId column
                        resolvedBatch = await Batch.findOne({ name: batchIdRaw });
                    }
                } else if (batchName && String(batchName).trim()) {
                    resolvedBatch = await Batch.findOne({ name: String(batchName).trim() });
                }

                if (hasBatchInput && !resolvedBatch) {
                    const msg = 'Batch not found. Provide a valid batchId (ObjectId) or an existing batchName';
                    results.failed.push({
                        row: i + 1,
                        email: normalizedEmail,
                        reason: msg,
                        error: msg
                    });
                    continue;
                }

                if (resolvedBatch) {
                    resolvedBatchName = resolvedBatch.name;
                    batchesAssigned++;
                }

                // Prepare user data
                const userPayload = {
                    firstName,
                    lastName,
                    email: normalizedEmail,
                    password: hashedPassword,
                    accountType,
                    additionalDetails: profileDetails._id,
                    approved: true,
                    image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
                    createdVia: 'bulk_upload'
                };

                // Add optional fields
                if (groupName) userPayload.groupName = groupName;
                if (groups && Array.isArray(groups)) userPayload.groups = groups;
                if (resolvedBatch) userPayload.batches = [resolvedBatch._id];

                // Create user
                const user = await User.create(userPayload);

                // Send welcome email
                let emailSent = false;
                let emailError = null;
                try {
                    const emailBody = bulkUserWelcomeTemplate({
                        firstName,
                        lastName,
                        email,
                        temporaryPassword: plainPassword,
                        loginUrl,
                        accountType,
                        batchName: resolvedBatchName || null,
                        groupName,
                        contactNumber,
                        hasTemporaryPassword: Boolean(password),
                        context: {
                            groups,
                            batchId: resolvedBatch?._id || null,
                            createdVia: 'bulk_upload',
                        },
                    });

                    await mailSender(
                        email,
                        'Welcome to Beeja Academy - Your Account is Ready!',
                        emailBody,
                        [],
                        'bulk_user_upload'
                    );

                    emailSent = true;
                    results.emailStatus.sent++;
                    console.log(`✅ Welcome email sent to: ${email}`);
                } catch (emailErr) {
                    emailError = emailErr.message;
                    results.emailStatus.failed++;
                    console.error(`❌ Failed to send email to ${email}:`, emailErr.message);
                }

                results.successful.push({
                    row: i + 1,
                    email: normalizedEmail,
                    userId: user._id,
                    name: `${firstName} ${lastName}`,
                    emailSent,
                    emailError,
                    batchId: resolvedBatch?._id || null,
                    batchName: resolvedBatchName || null,
                    batchAssigned: Boolean(resolvedBatch)
                });

                results.emailStatus.details.push({
                    email,
                    status: emailSent ? 'SENT' : 'FAILED',
                    error: emailError
                });

            } catch (error) {
                console.error(`Error creating user at row ${i + 1}:`, error);
                const msg = error.message || 'Unknown error occurred';
                results.failed.push({
                    row: i + 1,
                    email: normalizedEmail || 'N/A',
                    reason: msg,
                    error: msg
                });
            }
        }

        // Prepare response
        const totalProcessed = results.successful.length + results.failed.length + results.skipped.length;

        return res.status(200).json({
            success: true,
            message: `Bulk upload completed. ${results.successful.length} created, ${results.skipped.length} skipped, ${results.failed.length} failed. Emails: ${results.emailStatus.sent} sent, ${results.emailStatus.failed} failed`,
            data: {
                summary: {
                    total: users.length,
                    processed: totalProcessed,
                    successful: results.successful.length,
                    skipped: results.skipped.length,
                    failed: results.failed.length,
                    emailsSent: results.emailStatus.sent,
                    emailsFailed: results.emailStatus.failed,
                    batchesAssigned
                },
                results
            }
        });

    } catch (error) {
        console.error('Bulk user upload error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error processing bulk user upload',
            error: error.message
        });
    }
};

// ================ GET EMAIL LOGS ================
exports.getEmailLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50, status, email, dateFrom, dateTo } = req.query;

        const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
        const parsedLimit = Math.max(parseInt(limit, 10) || 50, 1);

        // Build query filter
        const filter = {};
        if (status) filter.status = status;

        const searchTerm = typeof email === 'string' ? email.trim() : '';
        if (searchTerm) {
            const safeRegex = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.$or = [
                { email: { $regex: safeRegex, $options: 'i' } },
                { subject: { $regex: safeRegex, $options: 'i' } },
            ];
        }

        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) {
                const from = new Date(dateFrom);
                if (!Number.isNaN(from.getTime())) {
                    filter.createdAt.$gte = from;
                }
            }
            if (dateTo) {
                const to = new Date(dateTo);
                if (!Number.isNaN(to.getTime())) {
                    // include the entire day when date only is passed
                    to.setHours(23, 59, 59, 999);
                    filter.createdAt.$lte = to;
                }
            }
            if (Object.keys(filter.createdAt).length === 0) {
                delete filter.createdAt;
            }
        }

        // Calculate pagination
        const skip = (parsedPage - 1) * parsedLimit;

        // Fetch email logs
        const emailLogs = await EmailLog.find(filter)
            .sort({ createdAt: -1 })
            .limit(parsedLimit)
            .skip(skip);

        // Stats for current filter
        const totalCount = await EmailLog.countDocuments(filter);
        const sentCount = await EmailLog.countDocuments({ ...filter, status: 'SENT' });
        const failedCount = await EmailLog.countDocuments({ ...filter, status: 'FAILED' });

        return res.status(200).json({
            success: true,
            data: emailLogs,
            stats: {
                total: totalCount,
                sent: sentCount,
                failed: failedCount,
            },
            pagination: {
                currentPage: parsedPage,
                totalPages: Math.ceil(totalCount / parsedLimit),
                totalLogs: totalCount,
                logsPerPage: parsedLimit,
            },
            message: 'Email logs fetched successfully'
        });

    } catch (error) {
        console.error('Error fetching email logs:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching email logs',
            error: error.message
        });
    }
};

// ================ UPDATE USER ================
exports.updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { firstName, lastName, email, accountType, contactNumber } = req.body;

        const user = await User.findById(userId).populate('additionalDetails');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email;
        if (accountType) user.accountType = accountType;

        if (contactNumber && user.additionalDetails) {
            await Profile.findByIdAndUpdate(user.additionalDetails._id, { contactNumber }, { new: true });
        }

        await user.save();

        const updatedUser = await User.findById(userId).populate('additionalDetails').select('-password');

        return res.status(200).json({
            success: true,
            user: updatedUser,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
};

// ================ TOGGLE COURSE VISIBILITY ================
exports.toggleCourseVisibility = async (req, res) => {
    try {
        const { courseId } = req.params;

        console.log('Toggle course visibility request:', { courseId, body: req.body });

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ success: false, message: 'Invalid course ID' });
        }

        const course = await Course.findById(courseId)
            .populate('instructor', 'firstName lastName email')
            .populate('category', 'name');

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const wasPublished = course.status === 'Published';
        course.isVisible = !course.isVisible;
        course.status = course.isVisible ? 'Published' : 'Draft';

        await course.save();

        // Send notifications when course is made visible/published for the first time
        if (course.isVisible && !wasPublished) {
            try {
                await createNewCourseAnnouncementToAll(courseId, course.instructor._id);
                console.log("Public notifications sent for newly visible course:", course.courseName);
            } catch (notificationError) {
                console.error("Error sending course visibility notifications:", notificationError);
                // Don't fail the visibility toggle if notifications fail
            }
        }

        const updatedCourse = await Course.findById(courseId)
            .populate('instructor', 'firstName lastName email')
            .populate('category', 'name');

        return res.status(200).json({
            success: true,
            message: `Course ${course.isVisible ? 'visible' : 'hidden'} successfully`,
            course: updatedCourse
        });
    } catch (error) {
        console.error('Error toggling course visibility:', error);
        return res.status(500).json({
            success: false,
            message: 'Error toggling course visibility',
            error: error.message
        });
    }
};

// ================ DELETE USER ================
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        console.log('Delete user request:', { userId, body: req.body, user: req.user?.id });

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const user = await User.findById(userId).populate('additionalDetails');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }

        // Delete associated profile
        if (user.additionalDetails) {
            await Profile.findByIdAndDelete(user.additionalDetails._id);
        }

        // Delete the user
        await User.findByIdAndDelete(user._id);

        return res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user failed:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error deleting user'
        });
    }
};

// ================ GET ALL COURSES ================
exports.getAllCourses = async (req, res) => {
    try {
        console.log('Fetching all courses with populated category...');
        const courses = await Course.find({})
            .populate('instructor', 'firstName lastName email')
            .populate('category', 'name _id')
            .sort({ createdAt: -1 });

        console.log('Courses fetched:', courses.length);
        console.log('Sample course category:', courses[0]?.category);

        return res.status(200).json({
            success: true,
            courses,
            message: 'Courses fetched successfully'
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching courses',
            error: error.message
        });
    }
};

// ================ APPROVE COURSE ================
exports.approveCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findByIdAndUpdate(
            courseId,
            { status: 'Published' },
            { new: true }
        ).populate('instructor', 'firstName lastName email');

        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        // Send notifications when course is approved and published
        try {
            await createNewCourseAnnouncementToAll(courseId, course.instructor._id);
            console.log("Public notifications sent for newly published course:", course.courseName);
        } catch (notificationError) {
            console.error("Error sending course approval notifications:", notificationError);
            // Don't fail the approval if notifications fail
        }

        return res.status(200).json({
            success: true,
            course,

        });
    } catch (error) {
        console.error('Error approving course:', error);
        return res.status(500).json({
            success: false,
            message: 'Error approving course',
            error: error.message
        });
    }
};

// ================ DELETE COURSE ================
exports.deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        console.log('Delete course request:', { courseId, body: req.body });

        if (!courseId) {
            return res.status(400).json({ success: false, message: 'Course ID is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ success: false, message: 'Invalid course ID' });
        }

        const course = await Course.findById(courseId)
            .populate('instructor', 'firstName lastName email')
            .populate('courseContent');

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Unenroll students from the course
        const studentsEnrolled = course.studentsEnrolled || [];
        for (const studentId of studentsEnrolled) {
            await User.findByIdAndUpdate(studentId, {
                $pull: { courses: courseId },
            });
        }

        // Delete sections and sub-sections
        const courseSections = course.courseContent || [];
        for (const sectionId of courseSections) {
            // Delete sub-sections of the section
            const Section = require('../models/section');
            const SubSection = require('../models/subSection');

            const section = await Section.findById(sectionId);
            if (section) {
                const subSections = section.subSection || [];
                for (const subSectionId of subSections) {
                    await SubSection.findByIdAndDelete(subSectionId);
                }
            }

            // Delete the section
            await Section.findByIdAndDelete(sectionId);
        }

        // Remove course from instructor's courses list
        if (course.instructor) {
            await User.findByIdAndUpdate(course.instructor._id, {
                $pull: { courses: courseId }
            });
        }

        // Remove course from category
        if (course.category) {
            const Category = require('../models/category');
            await Category.findByIdAndUpdate(course.category, {
                $pull: { courses: courseId }
            });
        }

        // Delete the course
        await Course.findByIdAndDelete(courseId);

        return res.status(200).json({
            success: true,

        });
    } catch (error) {
        console.error('Delete course failed:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error deleting course'
        });
    }
};

// ================ SET COURSE TYPE (ADMIN) ================
exports.setCourseType = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { courseType } = req.body; // 'Paid' or 'Free'

        if (!['Paid', 'Free'].includes(courseType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course type. Use "Paid" or "Free"'
            });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Store original price if setting to free for the first time
        if (courseType === 'Free' && !course.originalPrice) {
            course.originalPrice = course.price;
        }

        // Update course type and admin settings
        course.courseType = courseType;
        course.adminSetFree = courseType === 'Free';

        // Set price based on course type
        if (courseType === 'Free') {
            course.price = 0;
        } else if (courseType === 'Paid' && course.originalPrice) {
            course.price = course.originalPrice;
        }

        await course.save();

        const updatedCourse = await Course.findById(courseId)
            .populate('instructor', 'firstName lastName email')
            .populate('category', 'name');

        return res.status(200).json({
            success: true,
            message: `Course set as ${courseType.toLowerCase()} successfully`,
            data: updatedCourse
        });

    } catch (error) {
        console.error('Error setting course type:', error);
        return res.status(500).json({
            success: false,
            message: 'Error setting course type',
            error: error.message
        });
    }
};

// ================ GET ANALYTICS DATA ================
exports.getAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const studentCount = await User.countDocuments({ accountType: 'Student' });
        const instructorCount = await User.countDocuments({ accountType: 'Instructor' });
        const adminCount = await User.countDocuments({ accountType: 'Admin' });

        const totalCourses = await Course.countDocuments();
        const publishedCourses = await Course.countDocuments({ status: 'Published' });
        const draftCourses = await Course.countDocuments({ status: 'Draft' });
        const freeCourses = await Course.countDocuments({ courseType: 'Free' });
        const paidCourses = await Course.countDocuments({ courseType: 'Paid' });

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentRegistrations = await User.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        // Get pending access requests count
        const CourseAccessRequest = require('../models/courseAccessRequest');
        const pendingRequests = await CourseAccessRequest.countDocuments({ status: 'Pending' });

        // Get recent courses (last 30 days to show more courses)
        const thirtyDaysAgoForCourses = new Date();
        thirtyDaysAgoForCourses.setDate(thirtyDaysAgoForCourses.getDate() - 30);

        console.log('Fetching recent courses created after:', thirtyDaysAgoForCourses);

        const recentCourses = await Course.find({
            createdAt: { $gte: thirtyDaysAgoForCourses }
        })
            .populate('instructor', 'firstName lastName')
            .populate('category', 'name')
            .select('courseName createdAt instructor category status price courseType')
            .sort({ createdAt: -1 })
            .limit(10);

        console.log('Found recent courses:', recentCourses.length);
        console.log('Recent courses data:', recentCourses.map(course => ({
            name: course.courseName,
            createdAt: course.createdAt,
            instructor: course.instructor ? `${course.instructor.firstName} ${course.instructor.lastName}` : 'Unknown'
        })));

        // Get recent user logins (last 7 days to show more activity)
        const sevenDaysAgoForUsers = new Date();
        sevenDaysAgoForUsers.setDate(sevenDaysAgoForUsers.getDate() - 7);

        console.log('Fetching recent users created after:', sevenDaysAgoForUsers);

        // For recent logins, we'll get recently created users as a proxy since we don't track login times
        const recentLogins = await User.find({
            createdAt: { $gte: sevenDaysAgoForUsers }
        })
            .select('firstName lastName email accountType createdAt')
            .sort({ createdAt: -1 })
            .limit(10);

        console.log('Found recent users:', recentLogins.length);

        // Get active users (users created in last 30 days)
        const activeLogins = await User.find({
            createdAt: { $gte: thirtyDaysAgo }
        })
            .select('firstName lastName email accountType createdAt')
            .sort({ createdAt: -1 })
            .limit(10);

        return res.status(200).json({
            success: true,
            analytics: {
                users: {
                    total: totalUsers,
                    students: studentCount,
                    instructors: instructorCount,
                    admins: adminCount,
                    recentRegistrations
                },
                courses: {
                    total: totalCourses,
                    published: publishedCourses,
                    draft: draftCourses,
                    free: freeCourses,
                    paid: paidCourses
                },
                requests: {
                    pendingAccessRequests: pendingRequests
                },
                recentCourses: recentCourses,
                recentLogins: recentLogins,
                activeLogins: activeLogins
            },
            message: 'Analytics data fetched successfully'
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching analytics',
            error: error.message
        });
    }
};

// ================ GET ALL INSTRUCTORS ================
exports.getAllInstructors = async (req, res) => {
    try {
        const instructors = await User.find({ accountType: 'Instructor' })
            .select('firstName lastName email _id')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Instructors fetched successfully',
            instructors
        });

    } catch (error) {
        console.error('Error fetching instructors:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.sendNotification = async (req, res) => {
    try {
        const { title, message, recipients, selectedUsers, relatedCourse, priority = 'medium' } = req.body;

        console.log('=== SEND NOTIFICATION DEBUG ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('Recipients:', recipients);
        console.log('Selected Users:', selectedUsers);
        console.log('Selected Users type:', typeof selectedUsers);
        console.log('Selected Users length:', selectedUsers?.length);

        // Validate admin user
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Admin ID missing'
            });
        }

        // Validate required fields
        if (!title?.trim() || !message?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required and cannot be empty'
            });
        }

        if (!recipients || !['all', 'students', 'instructors', 'admins', 'specific'].includes(recipients)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid recipient type. Must be one of: all, students, instructors, admins, specific'
            });
        }

        // Validate specific recipients
        if (recipients === 'specific') {
            if (!selectedUsers || !Array.isArray(selectedUsers) || selectedUsers.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Selected users array is required for specific recipients'
                });
            }

            // Validate each user ID format - simplified validation
            const invalidIds = [];
            for (const id of selectedUsers) {
                if (!id || typeof id !== 'string' || id.length !== 24) {
                    invalidIds.push(id);
                }
            }

            if (invalidIds.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid user IDs: ${invalidIds.join(', ')}`
                });
            }

            // Verify users exist - with error handling
            try {
                const validUsers = await User.find({
                    _id: { $in: selectedUsers },
                    active: true
                }).select('_id');

                if (validUsers.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'No valid active users found from the selected users'
                    });
                }

                if (validUsers.length !== selectedUsers.length) {
                    const foundIds = validUsers.map(u => u._id.toString());
                    const notFoundIds = selectedUsers.filter(id => !foundIds.includes(id));
                    console.log('Some users were not found or are inactive:', notFoundIds);
                }
            } catch (userValidationError) {
                console.error('Error validating users:', userValidationError);
                return res.status(400).json({
                    success: false,
                    message: 'Error validating selected users'
                });
            }
        }

        // Validate priority
        if (priority && !['low', 'medium', 'high'].includes(priority)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid priority. Must be one of: low, medium, high'
            });
        }

        // Get target users based on recipient type
        let targetUsers = [];
        let recipientType = '';

        console.log('Processing recipients:', recipients);
        console.log('Selected users:', selectedUsers);

        switch (recipients) {
            case 'all':
                recipientType = 'All';
                targetUsers = await User.find({ active: true }).select('_id accountType firstName lastName');
                break;
            case 'students':
                recipientType = 'Student';
                targetUsers = await User.find({
                    accountType: 'Student',
                    active: true
                }).select('_id accountType firstName lastName');
                break;
            case 'instructors':
                recipientType = 'Instructor';
                targetUsers = await User.find({
                    accountType: 'Instructor',
                    active: true
                }).select('_id accountType firstName lastName');
                break;
            case 'admins':
                recipientType = 'Admin';
                targetUsers = await User.find({
                    accountType: 'Admin',
                    active: true
                }).select('_id accountType firstName lastName');
                break;
            case 'specific':
                recipientType = 'Specific';
                if (!selectedUsers || !Array.isArray(selectedUsers) || selectedUsers.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Selected users are required for specific recipients'
                    });
                }

                console.log('Processing specific users:', selectedUsers);

                // Find valid users
                targetUsers = await User.find({
                    _id: { $in: selectedUsers },
                    active: true
                }).select('_id accountType firstName lastName');

                console.log(`Found ${targetUsers.length} valid users out of ${selectedUsers.length} selected`);

                if (targetUsers.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'No valid active users found from the selected users'
                    });
                }

                // Log which users were not found (for debugging)
                const foundUserIds = targetUsers.map(user => user._id.toString());
                const notFoundUsers = selectedUsers.filter(id => !foundUserIds.includes(id));
                if (notFoundUsers.length > 0) {
                    console.log('Users not found or inactive:', notFoundUsers);
                }
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid recipients type'
                });
        }

        if (targetUsers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid users found for the selected recipient type'
            });
        }

        // Generate a unique bulk ID for grouping these notifications
        const bulkId = new mongoose.Types.ObjectId();

        // Create individual notification records for each target user
        const notifications = targetUsers.map(user => ({
            recipient: user._id,
            recipientType: recipientType,
            recipients: recipients === 'specific' ? selectedUsers : undefined,
            type: 'ADMIN_ANNOUNCEMENT',
            title,
            message,
            sender: req.user.id,
            priority,
            relatedCourse: relatedCourse || null,
            bulkId: bulkId,
            isRead: false,
            read: false,
            metadata: {
                sentByAdmin: true,
                adminId: req.user.id,
                sentAt: new Date(),
                recipientType: recipientType,
                recipients: recipients === 'specific' ? selectedUsers : undefined,
                targetUsers: recipients === 'specific' ? selectedUsers : undefined,
                bulkId: bulkId
            },
            createdAt: new Date()
        }));

        // Insert all notifications in bulk
        const insertedNotifications = await Notification.insertMany(notifications);

        console.log(`Created ${insertedNotifications.length} individual notifications for ${recipientType} users with bulkId: ${bulkId}`);

        return res.status(201).json({
            success: true,
            message: `Notification sent to ${targetUsers.length} users successfully`,
            data: {
                notificationId: bulkId,
                title,
                recipientType,
                recipientCount: targetUsers.length,
                priority,
                bulkId: bulkId
            }
        });

    } catch (error) {
        console.error('Error sending notification:', error);
        return res.status(500).json({
            success: false,
            message: 'Error sending notification',
            error: error.message
        });
    }
};
// Get all notifications sent by admin
exports.getAllNotifications = async (req, res) => {
    try {
        // First, get distinct bulkIds from both the dedicated field and metadata
        const distinctBulkIds = await Notification.distinct('bulkId', {
            $or: [
                { 'metadata.sentByAdmin': true },
                { type: 'ADMIN_ANNOUNCEMENT' }
            ],
            bulkId: { $exists: true, $ne: null }
        });

        // Also get bulkIds from metadata for backward compatibility
        const metadataBulkIds = await Notification.distinct('metadata.bulkId', {
            $or: [
                { 'metadata.sentByAdmin': true },
                { type: 'ADMIN_ANNOUNCEMENT' }
            ],
            'metadata.bulkId': { $exists: true, $ne: null }
        });

        // Combine both arrays and remove duplicates
        const allBulkIds = [...new Set([...distinctBulkIds, ...metadataBulkIds])];

        // Get all admin notifications with populated user data
        const allNotifications = await Notification.find({
            $or: [
                { 'metadata.sentByAdmin': true },
                { type: 'ADMIN_ANNOUNCEMENT' }
            ]
        })
            .sort({ createdAt: -1 })
            .populate('sender', 'firstName lastName email')
            .populate('recipient', 'firstName lastName email'); // Populate recipient details for specific notifications

        // Group notifications
        const groupedNotifications = new Map();

        // First, handle notifications with bulkIds
        for (const bulkId of allBulkIds) {
            const bulkNotifications = allNotifications.filter(
                n => n.bulkId?.toString() === bulkId.toString() ||
                    n.metadata?.bulkId?.toString() === bulkId.toString()
            );

            if (bulkNotifications.length > 0) {
                const firstNotification = bulkNotifications[0];
                groupedNotifications.set(bulkId.toString(), {
                    _id: firstNotification._id,
                    title: firstNotification.title,
                    message: firstNotification.message,
                    sender: firstNotification.sender,
                    recipients: (() => {
                        // For specific recipients, show actual email addresses
                        if (firstNotification.metadata?.recipientType === 'Specific' ||
                            firstNotification.recipientType === 'Specific') {
                            const emails = bulkNotifications
                                .filter(n => n.recipient && n.recipient.email)
                                .map(n => n.recipient.email);
                            return emails.length > 0 ? emails.join(', ') : 'Specific users';
                        }
                        // For bulk recipients (all, students, instructors, admins), show the type
                        return firstNotification.metadata?.recipientType ||
                            firstNotification.recipientType || 'unknown';
                    })(),
                    relatedCourse: firstNotification.relatedCourse,
                    createdAt: firstNotification.createdAt,
                    recipientCount: bulkNotifications.length,
                    readCount: bulkNotifications.filter(n => n.read).length,
                    type: firstNotification.type,
                    bulkId: bulkId,
                    priority: firstNotification.priority || 'normal'
                });
            }
        }

        // Then handle individual notifications (without bulkId)
        allNotifications
            .filter(notification => !notification.bulkId && !notification.metadata?.bulkId)
            .forEach(notification => {
                groupedNotifications.set(notification._id.toString(), {
                    _id: notification._id,
                    title: notification.title,
                    message: notification.message,
                    sender: notification.sender,
                    recipients: notification.recipient?.email || notification.recipientType || 'unknown',
                    relatedCourse: notification.relatedCourse,
                    createdAt: notification.createdAt,
                    recipientCount: 1,
                    readCount: notification.read ? 1 : 0,
                    type: notification.type,
                    bulkId: null,
                    priority: notification.priority || 'normal'
                });
            });

        // Convert map to array and sort by creation date
        const formattedNotifications = Array.from(groupedNotifications.values())
            .map(notification => ({
                ...notification,
                // Use bulkId as displayId for bulk notifications, otherwise use the notification _id
                displayId: notification.bulkId || notification._id
            }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 50); // Limit to 50 most recent

        console.log('Found grouped notifications:', formattedNotifications.length);

        return res.status(200).json({
            success: true,
            data: formattedNotifications,
            message: 'Notifications fetched successfully'
        });

    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching notifications',
            error: error.message
        });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;

        console.log('Delete notification request:', {
            notificationId,
            user: req.user?.id,
            userType: req.user?.accountType
        });

        // Validate notification ID format
        if (!notificationId) {
            console.log('Missing notification ID');
            return res.status(400).json({
                success: false,
                message: 'Notification ID is required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            console.log('Invalid notification ID format:', notificationId);
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID format'
            });
        }

        // Check if this is a bulk notification (using bulkId) or individual notification
        let deletedCount = 0;

        // First, try to find notifications with this bulkId
        const bulkNotifications = await Notification.find({ bulkId: notificationId });

        if (bulkNotifications.length > 0) {
            // This is a bulk notification - delete all notifications with this bulkId
            console.log(`Found ${bulkNotifications.length} notifications with bulkId: ${notificationId}`);

            // Delete related user notification statuses for all bulk notifications
            const bulkNotificationIds = bulkNotifications.map(n => n._id);
            const statusDeleteResult = await UserNotificationStatus.deleteMany({
                notification: { $in: bulkNotificationIds }
            });
            console.log(`Deleted ${statusDeleteResult.deletedCount} user notification statuses for bulk notifications`);

            // Delete all notifications with this bulkId
            const deleteResult = await Notification.deleteMany({ bulkId: notificationId });
            deletedCount = deleteResult.deletedCount;
            console.log(`Successfully deleted ${deletedCount} bulk notifications`);
        } else {
            // Try to find individual notification by ID
            const notification = await Notification.findById(notificationId);
            if (!notification) {
                console.log('Notification not found in database');
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            console.log('Found individual notification to delete:', {
                id: notification._id,
                title: notification.title,
                type: notification.type
            });

            // Delete related user notification statuses
            const statusDeleteResult = await UserNotificationStatus.deleteMany({
                notification: notificationId
            });
            console.log(`Deleted ${statusDeleteResult.deletedCount} user notification statuses`);

            // Delete the individual notification
            await Notification.findByIdAndDelete(notificationId);
            deletedCount = 1;
            console.log('Successfully deleted individual notification');
        }

        return res.status(200).json({
            success: true,
            message: `${deletedCount} notification${deletedCount > 1 ? 's' : ''} deleted successfully`,
            deletedCount: deletedCount
        });

    } catch (error) {
        console.error('Error deleting notification:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code,
            notificationId: req.params?.notificationId
        });

        return res.status(500).json({
            success: false,
            message: 'Error deleting notification',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
// ================ CREATE COURSE AS ADMIN ================
exports.createCourseAsAdmin = async (req, res) => {
    try {
        console.log('Create course request received:', {
            body: req.body,
            files: req.files ? Object.keys(req.files) : 'No files'
        });

        const {
            courseName,
            courseDescription,
            price,
            category,
            whatYouWillLearn,
            instructorId,
            status,
            tag,
            instructions,
            certificateEnabled
        } = req.body;

        // Get the thumbnail image from multer upload (already uploaded to S3)
        const thumbnailFile = req.files?.thumbnailImage?.[0];
        
        console.log('Extracted data:', {
            courseName,
            courseDescription,
            price,
            category,
            whatYouWillLearn,
            instructorId,
            status,
            tag,
            instructions,
            certificateEnabled,
            thumbnailFile: thumbnailFile ? 'File present' : 'No file'
        });

        // Validation - thumbnail is now optional
        if (!courseName || !courseDescription || !price || !category ||
            !whatYouWillLearn || !instructorId || !status) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided',
                missingFields: {
                    courseName: !courseName,
                    courseDescription: !courseDescription,
                    price: !price,
                    category: !category,
                    whatYouWillLearn: !whatYouWillLearn,
                    instructorId: !instructorId,
                    status: !status
                }
            });
        }

        // Verify instructor exists
        console.log('Looking for instructor with ID:', instructorId);
        const instructor = await User.findById(instructorId);
        console.log('Found instructor:', instructor ? { id: instructor._id, name: `${instructor.firstName} ${instructor.lastName}`, type: instructor.accountType } : 'Not found');
        
        if (!instructor || instructor.accountType !== 'Instructor') {
            console.log('Instructor validation failed:', { 
                notFound: !instructor, 
                wrongType: instructor ? instructor.accountType !== 'Instructor' : false,
                actualType: instructor ? instructor.accountType : null 
            });
            return res.status(400).json({
                success: false,
                message: 'Invalid instructor ID'
            });
        }

        // Verify category exists
        const categoryDetails = await Category.findById(category);
        if (!categoryDetails) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
            });
        }
        
        // Use the S3 URL from multer upload instead of uploading again
        let thumbnailImage = null;
        if (thumbnailFile) {
            thumbnailImage = {
                secure_url: thumbnailFile.location // multer-s3 provides the S3 URL in location field
            };
            console.log('Using uploaded thumbnail from multer:', thumbnailImage.secure_url);
        } else {
            console.log('No thumbnail provided - course will be created without thumbnail');
        }

        // Parse JSON fields
        let parsedTags = [];
        let parsedInstructions = [];

        try {
            parsedTags = tag ? JSON.parse(tag) : [];
            parsedInstructions = instructions ? JSON.parse(instructions) : [];
        } catch (parseError) {
            console.error('Error parsing JSON fields:', parseError);
            parsedTags = [];
            parsedInstructions = [];
        }

        console.log('Parsed data:', {
            parsedTags,
            parsedInstructions
        });

        // Create new course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorId,
            whatYouWillLearn,
            price: Number(price),
            tag: parsedTags,
            category,
            thumbnail: thumbnailImage ? thumbnailImage.secure_url : null,
            status,
            instructions: parsedInstructions,
            certificateEnabled: certificateEnabled === 'true' || certificateEnabled === true,
            createdAt: new Date(),
        });

        console.log('Course created successfully:', newCourse._id);

        // Add course to instructor's courses
        await User.findByIdAndUpdate(
            instructorId,
            { $push: { courses: newCourse._id } },
            { new: true }
        );

        // Add course to category
        await Category.findByIdAndUpdate(
            category,
            { $push: { courses: newCourse._id } },
            { new: true }
        );

        // Populate the course with instructor and category details
        const populatedCourse = await Course.findById(newCourse._id)
            .populate('instructor', 'firstName lastName email')
            .populate('category', 'name description');

        // Send notifications
        try {
            // Always create notification for admins about new course creation
            await createNewCourseCreationNotification(newCourse._id, instructorId);
            console.log("Admin notification sent for new course creation");

            // Create notification for all students and instructors if course is published
            if (status === "Published") {
                await createNewCourseAnnouncementToAll(newCourse._id, instructorId);
                console.log("Public notifications sent for new published course:", newCourse.courseName);
            } else {
                console.log("Course created in draft state - only admin notified");
            }
        } catch (notificationError) {
            console.error("Error sending notifications:", notificationError);
            // Don't fail the course creation if notifications fail
        }

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            course: populatedCourse
        });

    } catch (error) {
        console.error('Error creating course:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            fullError: error
        });

        // Handle specific errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationErrors
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID format',
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// ================ BULK USER UPLOAD (LEGACY - DO NOT USE) ================
// NOTE: This handler is kept only for reference. The active endpoint uses the
// bulkUserUpload implementation defined earlier in this file.
exports.bulkUserUploadLegacy = async (req, res) => {
    try {
        const { users } = req.body;

        console.log('Bulk user upload request:', { userCount: users?.length });

        // Validate input
        if (!users || !Array.isArray(users) || users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Users array is required and must not be empty'
            });
        }

        const results = {
            successful: [],
            failed: []
        };

        let emailsSent = 0;
        let batchesAssigned = 0;

        // Process each user
        for (let i = 0; i < users.length; i++) {
            const userData = users[i];
            const rowNumber = i + 2; // +2 because CSV row 1 is header, and we're 0-indexed

            try {
                // Validate required fields
                if (!userData.firstName || !userData.lastName || !userData.email || !userData.accountType) {
                    results.failed.push({
                        row: rowNumber,
                        email: userData.email || 'N/A',
                        data: userData,
                        error: 'Missing required fields (firstName, lastName, email, accountType)'
                    });
                    continue;
                }

                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(userData.email)) {
                    results.failed.push({
                        row: rowNumber,
                        email: userData.email,
                        data: userData,
                        error: 'Invalid email format'
                    });
                    continue;
                }

                // Validate account type
                const validAccountTypes = ['Admin', 'Instructor', 'Student'];
                if (!validAccountTypes.includes(userData.accountType)) {
                    results.failed.push({
                        row: rowNumber,
                        email: userData.email,
                        data: userData,
                        error: `Invalid account type. Must be one of: ${validAccountTypes.join(', ')}`
                    });
                    continue;
                }

                // Check if user already exists
                const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
                if (existingUser) {
                    results.failed.push({
                        row: rowNumber,
                        email: userData.email,
                        data: userData,
                        error: 'User with this email already exists'
                    });
                    continue;
                }

                // Generate a random temporary password
                const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
                const hashedPassword = await bcrypt.hash(tempPassword, 10);

                // Create profile
                const profileDetails = await Profile.create({
                    gender: null,
                    dateOfBirth: null,
                    about: null,
                    contactNumber: userData.contactNumber || null,
                });

                // Create user
                const newUser = await User.create({
                    firstName: userData.firstName.trim(),
                    lastName: userData.lastName.trim(),
                    email: userData.email.toLowerCase().trim(),
                    password: hashedPassword,
                    accountType: userData.accountType,
                    additionalDetails: profileDetails._id,
                    active: true,
                    approved: true,
                    image: `https://api.dicebear.com/5.x/initials/svg?seed=${userData.firstName}%20${userData.lastName}`,
                });

                console.log(` User created: ${newUser.email}`);

                // Handle batch assignment if batchId is provided
                let batchAssigned = false;
                let batchName = null;
                if (userData.batchId && userData.batchId.trim()) {
                    try {
                        const Batch = require('../models/Batch');
                        const batch = await Batch.findById(userData.batchId.trim());
                        if (batch) {
                            // Add user to batch
                            if (!batch.students.includes(newUser._id)) {
                                batch.students.push(newUser._id);
                                await batch.save();
                                batchAssigned = true;
                                batchName = batch.name;
                                batchesAssigned++;
                                console.log(` User ${newUser.email} assigned to batch: ${batch.name}`);
                            }
                        } else {
                            console.log(` Batch not found for ID: ${userData.batchId}`);
                        }
                    } catch (batchError) {
                        console.error(` Error assigning batch for user ${newUser.email}:`, batchError);
                    }
                }

                // Send welcome email with temporary password
                let emailSent = false;
                try {
                    const mailSender = require('../utils/mailSender');
                    const emailBody = `
                        <h2>Welcome to the Learning Management System!</h2>
                        <p>Dear ${userData.firstName} ${userData.lastName},</p>
                        <p>Your account has been created successfully.</p>
                        <p><strong>Account Details:</strong></p>
                        <ul>
                            <li>Email: ${userData.email}</li>
                            <li>Account Type: ${userData.accountType}</li>
                            <li>Temporary Password: <code>${tempPassword}</code></li>
                        </ul>
                        ${batchAssigned ? `<p>You have been enrolled in the batch: <strong>${batchName}</strong></p>` : ''}
                        <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
                        <p>Best regards,<br/>The LMS Team</p>
                    `;

                    await mailSender(
                        userData.email,
                        'Welcome to LMS - Your Account Details',
                        emailBody
                    );
                    emailSent = true;
                    emailsSent++;
                    console.log(` Welcome email sent to: ${userData.email}`);
                } catch (emailError) {
                    console.error(` Error sending email to ${userData.email}:`, emailError);
                }

                results.successful.push({
                    row: rowNumber,
                    userId: newUser._id,
                    email: newUser.email,
                    name: `${newUser.firstName} ${newUser.lastName}`,
                    accountType: newUser.accountType,
                    emailSent,
                    batchAssigned,
                    batchName,
                    batchId: batchAssigned ? userData.batchId : null
                });

            } catch (error) {
                console.error(` Error creating user at row ${rowNumber}:`, error);
                results.failed.push({
                    row: rowNumber,
                    email: userData.email || 'N/A',
                    data: userData,
                    error: error.message || 'Unknown error occurred'
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: `Bulk upload completed. ${results.successful.length} users created successfully.`,
            summary: {
                total: users.length,
                successful: results.successful.length,
                failed: results.failed.length,
                emailsSent,
                batchesAssigned
            },
            results
        });

    } catch (error) {
        console.error('Error in bulk user upload:', error);
        return res.status(500).json({
            success: false,
            message: 'Error in bulk user upload',
            error: error.message
        });
    }
};

// NOTE: bulkUserUpload is implemented above. This duplicate implementation previously
// sent an old/basic email template. It has been removed to ensure a single code path.

// NOTE: getEmailLogs is implemented above with filtering & stats.
// This duplicate implementation previously overrode it and broke filters.
exports.getEmailLogsLegacy = async (req, res) => {
    try {
        const EmailLog = require('../models/emailLog');
        const emailLogs = await EmailLog.find({}).sort({ createdAt: -1 }).limit(100);
        return res.status(200).json({
            success: true,
            data: emailLogs,
            message: 'Email logs fetched successfully'
        });
    } catch (error) {
        console.error('Error fetching email logs:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching email logs',
            error: error.message
        });
    }
};

// ================ ASSIGN COURSE TO STUDENT ================
exports.assignCourseToStudent = async (req, res) => {
    try {
        const { studentId, courseId, courseIds } = req.body;
        const Order = require('../models/order');
        const adminId = req.user?.id;

        // Build the list of courses to assign (support both single courseId and courseIds array)
        let targetCourseIds = [];
        if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
            targetCourseIds = courseIds;
        } else if (courseId) {
            targetCourseIds = [courseId];
        }

        if (!studentId || targetCourseIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Student ID and at least one Course ID are required' });
        }

        const student = await User.findById(studentId);
        if (!student || student.accountType !== 'Student') {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        let successful = 0;
        let skipped = 0;
        const assignedCourseNames = [];

        for (const cId of targetCourseIds) {
            try {
                const course = await Course.findById(cId);
                if (!course) { skipped++; continue; }

                // Skip if already enrolled
                if (student.courses.map(c => c.toString()).includes(cId.toString())) {
                    skipped++;
                    continue;
                }

                // Enroll student
                student.courses.push(cId);
                await student.save();

                if (!course.studentsEnrolled.map(s => s.toString()).includes(studentId.toString())) {
                    course.studentsEnrolled.push(studentId);
                    await course.save();
                }

                // Create Order record so it appears in admin Orders table
                await Order.create({
                    user: studentId,
                    course: cId,
                    amount: 0,
                    originalPrice: course.price || 0,
                    discountAmount: course.price || 0,
                    paymentMethod: 'admin_assigned',
                    transactionId: `ADMIN_SINGLE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    status: true,
                    adminAssigned: true,
                    assignedBy: adminId || null,
                    purchaseDate: new Date()
                });

                assignedCourseNames.push(course.courseName);
                successful++;
            } catch (err) {
                console.error(`Error assigning course ${cId} to student:`, err);
                skipped++;
            }
        }

        // Send email if any courses were assigned
        if (assignedCourseNames.length > 0) {
            try {
                const name = `${student.firstName} ${student.lastName}`.trim();
                const emailBody = courseAssignmentTemplate({
                    name,
                    courses: assignedCourseNames,
                    title: '📚 Course Assigned',
                    subtitle: `New course(s) have been added to your learning dashboard.`,
                });
                await mailSender(
                    student.email,
                    assignedCourseNames.length === 1
                        ? `Course Assigned: ${assignedCourseNames[0]}`
                        : `${assignedCourseNames.length} Courses Assigned`,
                    emailBody,
                    [],
                    'course_assignment_single'
                );
            } catch (emailErr) {
                console.error('Error sending course assignment email:', emailErr);
            }
        }

        return res.status(200).json({
            success: true,
            message: `Course assignment completed. ${successful} assigned, ${skipped} skipped.`,
            data: { summary: { successful, skipped } }
        });
    } catch (error) {
        console.error('Error assigning course:', error);
        return res.status(500).json({ success: false, message: 'Error assigning course', error: error.message });
    }
};

// ================ ASSIGN COURSES BULK ================
exports.assignCoursesBulk = async (req, res) => {
    try {
        const { studentIds, courseIds } = req.body;
        const Order = require('../models/order');
        const adminId = req.user?.id;

        if (!studentIds || !courseIds || !Array.isArray(studentIds) || !Array.isArray(courseIds)) {
            return res.status(400).json({ success: false, message: 'Student IDs and Course IDs arrays are required' });
        }

        let successCount = 0;
        let errorCount = 0;
        const emailQueue = [];

        for (const studentId of studentIds) {
            const assignedCoursesForStudent = [];

            for (const courseId of courseIds) {
                try {
                    const student = await User.findById(studentId);
                    const course = await Course.findById(courseId);

                    if (!student || !course) { errorCount++; continue; }

                    // Skip if already enrolled
                    if (student.courses.map(c => c.toString()).includes(courseId.toString())) {
                        continue;
                    }

                    // Enroll student
                    student.courses.push(courseId);
                    await student.save();

                    if (!course.studentsEnrolled.map(s => s.toString()).includes(studentId.toString())) {
                        course.studentsEnrolled.push(studentId);
                        await course.save();
                    }

                    // Create Order record so batch assignments appear in the admin Orders table
                    const batchLabel = `ADMIN_BULK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    await Order.create({
                        user: studentId,
                        course: courseId,
                        amount: 0,
                        originalPrice: course.price || 0,
                        discountAmount: course.price || 0,
                        paymentMethod: 'admin_assigned',
                        transactionId: batchLabel,
                        status: true,
                        adminAssigned: true,
                        assignedBy: adminId || null,
                        purchaseDate: new Date()
                    });

                    assignedCoursesForStudent.push({ courseName: course.courseName });
                    successCount++;
                } catch (err) {
                    errorCount++;
                    console.error(`Error assigning course ${courseId} to student ${studentId}:`, err);
                }
            }

            if (assignedCoursesForStudent.length > 0) {
                const student = await User.findById(studentId).select('email firstName lastName');
                if (student?.email) {
                    emailQueue.push({
                        email: student.email,
                        name: `${student.firstName} ${student.lastName}`.trim(),
                        courses: assignedCoursesForStudent.map(c => c.courseName).filter(Boolean)
                    });
                }
            }
        }

        // Send emails after all assignments are done
        for (const item of emailQueue) {
            try {
                const emailBody = courseAssignmentTemplate({
                    name: item.name || 'there',
                    courses: item.courses,
                    title: '📚 New Courses Assigned',
                    subtitle: 'Your learning dashboard has been updated.',
                });
                await mailSender(
                    item.email,
                    `New Courses Assigned (${item.courses.length})`,
                    emailBody,
                    [],
                    'course_assignment_bulk'
                );
            } catch (emailErr) {
                console.error('Error sending bulk assignment email:', emailErr);
            }
        }

        return res.status(200).json({
            success: true,
            message: `Bulk assignment completed. ${successCount} successful, ${errorCount} failed`,
            data: { summary: { successful: successCount, failed: errorCount } },
            successCount,
            errorCount
        });
    } catch (error) {
        console.error('Error in bulk course assignment:', error);
        return res.status(500).json({ success: false, message: 'Error in bulk course assignment', error: error.message });
    }
};

// ================ GET STUDENT COURSE ASSIGNMENTS ================
exports.getStudentCourseAssignments = async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await User.findById(studentId).populate('courses', 'courseName thumbnail instructor price');
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        return res.status(200).json({
            success: true,
            data: student.courses,
            message: 'Student course assignments fetched successfully'
        });
    } catch (error) {
        console.error('Error fetching student assignments:', error);
        return res.status(500).json({ success: false, message: 'Error fetching student assignments', error: error.message });
    }
};

// ================ GET NOTIFICATION COUNTS ================
exports.getNotificationCounts = async (req, res) => {
    try {
        const totalNotifications = await Notification.countDocuments({
            $or: [
                { 'metadata.sentByAdmin': true },
                { type: 'ADMIN_ANNOUNCEMENT' }
            ]
        });

        const unreadNotifications = await Notification.countDocuments({
            $or: [
                { 'metadata.sentByAdmin': true },
                { type: 'ADMIN_ANNOUNCEMENT' }
            ],
            read: false
        });

        return res.status(200).json({
            success: true,
            data: {
                total: totalNotifications,
                unread: unreadNotifications,
                read: totalNotifications - unreadNotifications
            },
            message: 'Notification counts fetched successfully'
        });
    } catch (error) {
        console.error('Error fetching notification counts:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching notification counts',
            error: error.message
        });
    }
};

// ================ MARK SECTION AS SEEN ================
exports.markSectionAsSeen = async (req, res) => {
    try {
        const { sectionId } = req.params;

        // This is a placeholder for marking notification sections as seen
        // Implement based on your notification section logic
        return res.status(200).json({
            success: true,
            message: 'Section marked as seen successfully'
        });
    } catch (error) {
        console.error('Error marking section as seen:', error);
        return res.status(500).json({
            success: false,
            message: 'Error marking section as seen',
            error: error.message
        });
    }
};

