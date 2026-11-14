require('./utils/safeLogger').installSafeLogger();
require('dotenv').config();
const express = require('express')
const app = express();
const { auth, isAdmin } = require('./middleware/auth');
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
const { authenticateToken } = require('./utils/authenticateToken');
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
app.disable('x-powered-by');
const http = require('http');
const socketIo = require('socket.io');

// Create HTTP server
const server = http.createServer(app);

// packages
// const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const session = require('express-session');

// connection to DB and AWS S3
const { connectDB, isConnected, getConnectionStatus } = require('./config/database');

// routes
const userRoutes = require('./routes/user');
const profileRoutes = require('./routes/profile');
const paymentRoutes = require('./routes/payments');
const courseRoutes = require('./routes/course');
const adminRoutes = require('./routes/admin');
const studentProgressRoutes = require('./routes/admin/studentProgress');
const courseAccessRoutes = require('./routes/courseAccess');
const quizRoutes = require('./routes/quiz');
const certificateRoutes = require('./routes/certificate');
const notificationRoutes = require('./routes/notification');
const contactMessageRoutes = require('./routes/contactMessage');
const featuredCoursesRoutes = require('./routes/featuredCourses');
const faqRoutes = require('./routes/faq.js');
const userAnalyticsRoutes = require('./routes/userAnalytics');
const chatRoutes = require('./routes/chat');
const jobRoutes = require('./routes/jobs');
const jobApplicationRoutes = require('./routes/jobApplications');
const recycleBinRoutes = require('./routes/recycleBin');
const uploadRoutes = require('./routes/upload');
const chunkedUploadRoutes = require('./routes/chunkedUpload');
const videoPlaybackRoutes = require('./routes/videoPlayback');
const pidLoginRoutes = require('./routes/pidLogin');
const captchaRoutes = require('./routes/captcha');
const quizReportsRoutes = require('./routes/quizReports');
const adminQuizReportsRoutes = require('./routes/adminQuizReports');
const zoomMeetingRoutes = require('./routes/zoomMeeting');
const meetingReminderRoutes = require('./routes/meetingReminders');
const zoomAttendanceRoutes = require('./routes/zoomAttendance');
const zoomEngagementRoutes = require('./routes/zoomEngagement');
const batchRoutes = require('./routes/Batch');
const assignmentRoutes = require('./routes/assignment');
const submissionRoutes = require('./routes/submission');
const teamMembersRoutes = require('./routes/teamMembers');
const adminTeamMembersRoutes = require('./routes/admin/teamMembers');
const siteSettingsRoutes = require('./routes/siteSettings');
const adminSiteSettingsRoutes = require('./routes/admin/siteSettings');
const emailLogsRoutes = require('./routes/admin/emailLogs');
const bulkUserManagementRoutes = require('./routes/bulkUserManagement');



// middleware 
app.use(cookieParser());

// Session middleware for captcha
app.use(session({
    secret: process.env.SESSION_SECRET || require('node:crypto').createHmac('sha256', process.env.JWT_SECRET).update('captcha-session').digest('hex'),
    store: new (require('./utils/mongoSessionStore').MongoSessionStore)(),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Set to true if using HTTPS
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 30 * 60 * 1000 // 30 minutes (increased from 10 minutes)
    }
}));

// CORS configuration
const getAllowedOrigins = () => {
    const origins = [];

    // Add environment-specific frontend URLs
    if (process.env.FRONTEND_URL) {
        origins.push(process.env.FRONTEND_URL);
    }

    // Add localhost for development
    if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:5173');
    origins.push('http://localhost:5174');
    origins.push('http://localhost'); // For PHP website
    origins.push('http://localhost:80'); // For PHP website
    origins.push('http://localhost:8000'); // For PHP website (Laravel)
    origins.push('http://127.0.0.1'); // For PHP website
    origins.push('http://127.0.0.1:8000'); // For PHP website (Laravel)
    
    // Add specific IP for development
    origins.push('http://192.168.30.222:5173');
    origins.push('http://192.168.30.222');
    }

    // Add PHP website URL if specified
    if (process.env.PHP_WEBSITE_URL) {
        origins.push(process.env.PHP_WEBSITE_URL);
    }

    // Add public IP URLs if available
    if (process.env.PUBLIC_IP) {
        origins.push(`http://${process.env.PUBLIC_IP}:5173`);
        origins.push(`https://${process.env.PUBLIC_IP}:5173`);
        origins.push(`http://${process.env.PUBLIC_IP}`); // For PHP website
    }

    // Remove duplicates
    return [...new Set(origins)];
};

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        const allowedOrigins = getAllowedOrigins();
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // Allow any localhost origin for development
            if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Baseline production security headers without imposing a CSP that could block
// configured video, payment, storage, or OAuth providers.
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
});

// Socket.io configuration
const io = socketIo(server, {
    cors: {
        origin: getAllowedOrigins(), // Use same dynamic origins
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Socket.io connection handling

const Chat = require('./models/chat');
const Message = require('./models/message');

io.on('connection', (socket) => {
    socket.use(async ([event], next) => {
        if (event === 'authenticate') return next();
        try {
            const user = await authenticateToken(socket.authToken);
            socket.userId = user.id;
            socket.userRole = user.accountType;
            next();
        } catch { socket.disconnect(true); next(new Error('Authentication required')); }
    });
    console.log('User connected:', socket.id);

    // Authenticate socket connection
    socket.on('authenticate', async (token) => {
        try {
            const decoded = await authenticateToken(token);
            if (socket.userId && socket.userId !== decoded.id) return socket.disconnect(true);
            socket.authToken = token;
            socket.userId = decoded.id;
            socket.userRole = decoded.accountType;

            // Join user-specific room for notifications
            socket.join(decoded.id);

            console.log(`User ${decoded.id} authenticated with role ${decoded.accountType} and joined personal room`);
            socket.emit('authenticated', { success: true });
        } catch (error) {
            console.error('Socket authentication failed:', error);
            socket.emit('authentication_error', { message: 'Invalid token' });
        }
    });

    // Join chat room
    socket.on('join_chat', async (chatId) => {
        try {
            if (!socket.userId) {
                socket.emit('error', { message: 'Not authenticated' });
                return;
            }

            // Verify user has access to this chat
            const chat = await Chat.findById(chatId);
            if (!chat) {
                socket.emit('error', { message: 'Chat not found' });
                return;
            }

            const hasAccess = chat.student.toString() === socket.userId ||
                chat.instructor.toString() === socket.userId ||
                socket.userRole === 'Admin';

            if (!hasAccess) {
                socket.emit('error', { message: 'Access denied' });
                return;
            }

            socket.join(chatId);
            console.log(`User ${socket.userId} joined chat ${chatId}`);
            socket.emit('joined_chat', { chatId });

        } catch (error) {
            console.error('Error joining chat:', error);
            socket.emit('error', { message: 'Error joining chat' });
        }
    });

    // Leave chat room
    socket.on('leave_chat', (chatId) => {
        socket.leave(chatId);
        console.log(`User ${socket.userId} left chat ${chatId}`);
    });

    // Handle new message
    socket.on('send_message', async (data) => {
        try {
            const { chatId, content, messageType = 'text' } = data;

            if (!socket.userId) {
                socket.emit('error', { message: 'Not authenticated' });
                return;
            }

            // Verify chat access
            const chat = await Chat.findById(chatId);
            if (!chat) {
                socket.emit('error', { message: 'Chat not found' });
                return;
            }

            const hasAccess = chat.student.toString() === socket.userId ||
                chat.instructor.toString() === socket.userId ||
                socket.userRole === 'Admin';

            if (!hasAccess) {
                socket.emit('error', { message: 'Access denied' });
                return;
            }

            // Create and save message
            const message = new Message({
                chat: chatId,
                sender: socket.userId,
                messageType,
                content
            });

            await message.save();

            // Update chat's last message
            await Chat.findByIdAndUpdate(chatId, {
                lastMessage: message._id,
                lastMessageTime: new Date()
            });

            // Populate message for broadcasting
            const populatedMessage = await Message.findById(message._id)
                .populate('sender', 'firstName lastName image');

            // Broadcast to all users in the chat room
            io.to(chatId).emit('new_message', populatedMessage);

            console.log(`Message sent in chat ${chatId} by user ${socket.userId}`);

        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', { message: 'Error sending message' });
        }
    });

    // Handle typing indicators
    socket.on('typing_start', (chatId) => {
        if (!socket.rooms.has(chatId)) return;
        socket.to(chatId).emit('user_typing', { userId: socket.userId, typing: true });
    });

    socket.on('typing_stop', (chatId) => {
        if (!socket.rooms.has(chatId)) return;
        socket.to(chatId).emit('user_typing', { userId: socket.userId, typing: false });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Make io available to routes
app.set('io', io);

// Body parser middleware with increased limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve static files from uploads directory with caching
const path = require('path');
const { createCachedStaticMiddleware, getCacheStats, clearCache } = require('./middleware/fileCache');

// Use cached static middleware for better concurrent access
app.use('/uploads', createCachedStaticMiddleware(path.join(__dirname, 'uploads')));

// Increase timeout for large uploads
app.use((req, res, next) => {
    res.setTimeout(300000); // 5 minutes timeout
    next();
});

// Database connection health check middleware
app.use('/api', (req, res, next) => {
    if (!isConnected()) {
        const status = getConnectionStatus();
        console.error('❌ Database not connected for API request:', {
            method: req.method,
            url: req.url,
            connectionStatus: status
        });

        return res.status(503).json({
            success: false,
            message: 'Database connection unavailable. Please try again later.',
            error: 'SERVICE_UNAVAILABLE',
            connectionStatus: status.state
        });
    }
    next();
});

// Log all incoming requests (after body parsing)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// mount routes
// Captcha routes (no /api/v1 prefix to match frontend expectations) - TEMPORARILY DISABLED FOR TESTING
// app.use('/', captchaRoutes);
app.use('/api/v1/auth', userRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/course', courseRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin', studentProgressRoutes);
app.use('/api/v1/course-access', courseAccessRoutes);
app.use('/api/v1/quiz', quizRoutes);
app.use('/api/v1/certificate', certificateRoutes);
app.use('/api/v1/notification', notificationRoutes);
app.use('/api/v1/contact', contactMessageRoutes);
app.use('/api/v1/featured-courses', featuredCoursesRoutes);
// FAQ Routes
app.use('/api/v1/faqs', faqRoutes);
// User Analytics Routes
app.use('/api/v1/user', userAnalyticsRoutes);
// Chat Routes
app.use('/api/v1/chat', chatRoutes);
// Job Routes
app.use('/api/v1/jobs', jobRoutes);
// Job Application Routes
app.use('/api/v1/job-applications', jobApplicationRoutes);
// Recycle Bin Routes
app.use('/api/v1/recycle-bin', recycleBinRoutes);
// Direct Upload Routes
app.use('/api/v1/upload', uploadRoutes);
// Chunked Upload Routes (S3 Multipart)
app.use('/api/v1/chunked-upload', chunkedUploadRoutes);
// Video Playback Routes
app.use('/api/v1/video', videoPlaybackRoutes);
// Quiz Reports Routes
app.use('/api/v1/quiz-reports', quizReportsRoutes);
// Admin Quiz Reports Routes
app.use('/api/v1/quiz-reports/admin', adminQuizReportsRoutes);
// Team Members (public)
app.use('/api/v1/team-members', teamMembersRoutes);
// Team Members (admin)
app.use('/api/v1/admin/team-members', adminTeamMembersRoutes);
// Site Settings (public)
app.use('/api/v1/site-settings', siteSettingsRoutes);
// Site Settings (admin)
app.use('/api/v1/admin/site-settings', adminSiteSettingsRoutes);
// Email Logs (admin)
app.use('/api/v1/admin', emailLogsRoutes);
// Bulk User Management (admin)
app.use('/api/v1/admin', bulkUserManagementRoutes);
// Batch Management
app.use('/api/v1/batch', batchRoutes);
// Zoom Meeting Routes
app.use('/api/v1/zoom', zoomMeetingRoutes);
app.use('/api/v1/meeting-reminders', meetingReminderRoutes);
app.use('/api/v1/zoom-attendance', zoomAttendanceRoutes);
app.use('/api/v1/zoom/engagement', zoomEngagementRoutes);
// Assignment Routes
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/submissions', submissionRoutes);
// PID Login Routes (for Skilli Jobs integration)
app.use('/', pidLoginRoutes);

// Health check route
app.get('/health', (req, res) => {
    const dbStatus = getConnectionStatus();
    const isDbConnected = isConnected();

    res.status(isDbConnected ? 200 : 503).json({
        status: isDbConnected ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
            connected: isDbConnected,
            ...dbStatus
        },
        server: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.version
        }
    });
});

// Database monitoring route
app.get('/api/v1/admin/db-monitor', auth, isAdmin, (req, res) => {
    try {
        const report = connectionMonitor.getDetailedReport();
        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting database monitoring report',
            error: error.message
        });
    }
});

// Database connection test route
app.get('/api/v1/admin/db-test', auth, isAdmin, async (req, res) => {
    try {
        const testResult = await connectionMonitor.testConnection();
        res.status(testResult.success ? 200 : 503).json({
            success: testResult.success,
            data: testResult
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error testing database connection',
            error: error.message
        });
    }
});

// File cache monitoring route
app.get('/api/v1/admin/cache-stats', auth, isAdmin, (req, res) => {
    try {
        const stats = getCacheStats();
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting cache statistics',
            error: error.message
        });
    }
});

// Clear file cache route
app.post('/api/v1/admin/clear-cache', auth, isAdmin, (req, res) => {
    try {
        clearCache();
        res.status(200).json({
            success: true,
            message: 'File cache cleared successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error clearing cache',
            error: error.message
        });
    }
});

// Default Route
app.get('/', (req, res) => {
    const dbStatus = getConnectionStatus();
    const isDbConnected = isConnected();

    res.send(`<div>
        <h2>LMS Backend Server</h2>
        <p>✅ Server is running</p>
        <p>Database Status: ${isDbConnected ? '✅ Connected' : '❌ Disconnected'} (${dbStatus.state})</p>
        <p>Uptime: ${Math.floor(process.uptime())} seconds</p>
        <p><a href="/health">Health Check</a></p>
    </div>`);
});

// 404 handler - must come after all routes
app.use((req, res) => {
    console.log('404 - Route not found:', req.method, req.url);

    const isApiRoute = req.url.startsWith('/api/');

    if (isApiRoute) {
        // Return JSON for API routes
        res.status(404).json({
            success: false,
            error: 'Route not found',
            message: `Cannot ${req.method} ${req.url}`,
            timestamp: new Date().toISOString()
        });
    } else {
        // Return HTML for non-API routes
        res.status(404).send(`
            <div>
                <h1>404 - Page Not Found</h1>
                <p>The requested page could not be found.</p>
            </div>
        `);
    }
});

// Error handling middleware for Multer errors and others
app.use((err, req, res, next) => {
    console.error('Global error handler caught:', err);
    console.error('Request URL:', req.url);
    console.error('Request method:', req.method);

    // Ensure we always return JSON for API routes
    const isApiRoute = req.url.startsWith('/api/');

    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File size is too large. Maximum limit is 500MB.',
                code: 'LIMIT_FILE_SIZE'
            });
        }
        return res.status(400).json({
            success: false,
            error: err.message,
            code: err.code
        });
    }

    // Only handle errors that haven't been handled by route controllers
    if (!res.headersSent) {
        console.error('Unhandled error:', err);

        if (isApiRoute) {
            // Always return JSON for API routes
            res.status(500).json({
                success: false,
                error: 'An internal server error occurred.',
                message: err.message,
                timestamp: new Date().toISOString(),
                stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
            });
        } else {
            // For non-API routes, return HTML
            res.status(500).send(`
                <div>
                    <h1>Internal Server Error</h1>
                    <p>An error occurred while processing your request.</p>
                    ${process.env.NODE_ENV === 'development' ? `<pre>${err.stack}</pre>` : ''}
                </div>
            `);
        }
    }
});

// Import seed function and connection monitor
const { seedDatabase } = require('./utils/seedData');
const { connectionMonitor } = require('./utils/connectionMonitor');

// Storage permissions are provisioned separately; startup never changes bucket policies.
// Startup function to handle initialization
const startServer = async () => {
    try {
        // Connect to database
        await connectDB();
        if (process.env.RUN_EMAIL_WORKER !== 'false') require('./services/enrollmentEmailWorker').startEnrollmentEmailWorker();

        // AWS S3 is ready to use
        console.log('🗄️ AWS S3 storage is configured and ready');

        // Run seed data if SEED_DATABASE environment variable is set to true
        if (process.env.SEED_DATABASE === 'true') {
            console.log('🌱 SEED_DATABASE is enabled, running database seeding...');
            try {
                const seedResult = await seedDatabase();
                console.log('✅ Seeding completed:', seedResult.message);
            } catch (seedError) {
                console.error('❌ Seeding failed:', seedError.message);
                console.log('⚠️  Server will continue without seeding...');
            }
        } else {
            console.log('ℹ️  Database seeding skipped (SEED_DATABASE not set to true)');
        }

        if (process.env.RUN_SCHEDULERS === 'true') {
        // Initialize recycle bin cleanup scheduler
        const { scheduleCleanup } = require('./scripts/recycleBinCleanup');
        scheduleCleanup();

        // Initialize meeting reminder scheduler
        const { startMeetingReminderScheduler, resetReminderFlags } = require('./services/meetingReminderScheduler');
        startMeetingReminderScheduler();
        resetReminderFlags();

        }

        // Start connection monitoring
        connectionMonitor.startMonitoring(30000); // Check every 30 seconds

        // Start the server
        const PORT = process.env.PORT || 5001;
        server.listen(PORT, () => {
            console.log(`🚀 Server Started on PORT ${PORT}`);
            const serverHost = process.env.PUBLIC_IP || process.env.HOST || 'localhost';
            console.log(`🔌 Socket.IO server is running on http://${serverHost}:${PORT}`);
            console.log('🔍 Database connection monitoring started');
            console.log('✅ Server initialization completed successfully!');
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();
