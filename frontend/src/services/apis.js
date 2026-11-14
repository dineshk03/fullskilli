import { BASE_URL as SERVER_URL } from '../config/api';
const BASE_URL = SERVER_URL + '/api/v1';

export { BASE_URL };

// AUTH ENDPOINTS
export const endpoints = {
  SENDOTP_API: BASE_URL + "/auth/sendotp",
  SIGNUP_API: BASE_URL + "/auth/signup",
  LOGIN_API: BASE_URL + "/auth/login",
  GOOGLE_LOGIN_API: BASE_URL + "/auth/google-login",
  VERIFY_GOOGLE_OTP_API: BASE_URL + "/auth/verify-google-otp",
  LINKEDIN_LOGIN_API: BASE_URL + "/auth/linkedin-login",
  FACEBOOK_LOGIN_API: BASE_URL + "/auth/facebook-login",
  EXTERNAL_SSO_LOGIN_API: BASE_URL + "/auth/external-sso-login",
  LOGIN_BY_PID_API: BASE_URL + "/auth/login-by-pid",
  RESETPASSTOKEN_API: BASE_URL + "/auth/reset-password-token",
  RESETPASSWORD_API: BASE_URL + "/auth/reset-password",
  // User Analytics
  USER_ANALYTICS_API: BASE_URL + "/user/analytics",
  USER_ACTIVITY_API: BASE_URL + "/user/activity",
  UPDATE_WATCH_TIME_API: BASE_URL + "/user/update-watch-time",
}

// PROFILE ENDPOINTS
export const profileEndpoints = {
  GET_USER_DETAILS_API: BASE_URL + "/profile/getUserDetails",
  GET_USER_ENROLLED_COURSES_API: BASE_URL + "/profile/getEnrolledCourses",
  GET_INSTRUCTOR_DATA_API: BASE_URL + "/profile/instructorDashboard",
}

// STUDENTS ENDPOINTS
export const studentEndpoints = {
  COURSE_PAYMENT_API: BASE_URL + "/payment/capturePayment",
  COURSE_VERIFY_API: BASE_URL + "/payment/verifyPayment",
  SEND_PAYMENT_SUCCESS_EMAIL_API: BASE_URL + "/payment/sendPaymentSuccessEmail",
  GET_ORDER_BY_COURSE_API: BASE_URL + "/payment/order/course/:courseId",
}

// COURSE ENDPOINTS
export const courseEndpoints = {
  GET_ALL_COURSE_API: BASE_URL + "/course/getAllCourses",
  COURSE_DETAILS_API: BASE_URL + "/course/getCourseDetails",
  EDIT_COURSE_API: BASE_URL + "/course/editCourse",
  COURSE_CATEGORIES_API: BASE_URL + "/course/showAllCategories",
  CREATE_CATEGORY_API: BASE_URL + "/course/createCategory",
  UPDATE_CATEGORY_API: BASE_URL + "/course/updateCategory",
  DELETE_CATEGORY_API: BASE_URL + "/course/deleteCategory",
  CREATE_COURSE_API: BASE_URL + "/course/createCourse",
  CREATE_SECTION_API: BASE_URL + "/course/addSection",
  CREATE_SUBSECTION_API: BASE_URL + "/course/addSubSection",
  UPDATE_SECTION_API: BASE_URL + "/course/updateSection",
  UPDATE_SUBSECTION_API: BASE_URL + "/course/updateSubSection",
  GET_ALL_INSTRUCTOR_COURSES_API: BASE_URL + "/course/getInstructorCoursesForInstructor",
  COURSE_PURCHASE_HISTORY_API: BASE_URL + "/payment/purchaseHistory",
  DELETE_SECTION_API: BASE_URL + "/course/deleteSection",
  DELETE_SUBSECTION_API: BASE_URL + "/course/deleteSubSection",
  DELETE_COURSE_API: BASE_URL + "/course/deleteCourse",
  GET_FULL_COURSE_DETAILS_AUTHENTICATED: BASE_URL + "/course/getFullCourseDetails",
  LECTURE_COMPLETION_API: BASE_URL + "/course/updateCourseProgress",
  UPDATE_QUIZ_PROGRESS_API: BASE_URL + "/course/updateQuizProgress",
  CHECK_SECTION_ACCESS_API: BASE_URL + "/course/checkSectionAccess",
  GET_PROGRESS_PERCENTAGE_API: BASE_URL + "/course/getProgressPercentage",
  CREATE_RATING_API: BASE_URL + "/course/createRating",
}

// RATINGS AND REVIEWS
export const ratingsEndpoints = {
  REVIEWS_DETAILS_API: BASE_URL + "/course/getReviews",
  SELECTED_REVIEWS_API: BASE_URL + "/course/getSelectedReviews",
}

// CATAGORIES API
export const categories = {
  CATEGORIES_API: BASE_URL + "/course/showAllCategories",
}

// CATALOG PAGE DATA
export const catalogData = {
  CATALOGPAGEDATA_API: BASE_URL + "/course/getCategoryPageDetails",
}
// CONTACT-US API
export const contactusEndpoint = {
  CONTACT_US_API: BASE_URL + "/contact/submit",
}

// CONTACT MESSAGE ENDPOINTS (Admin)
export const contactMessageEndpoints = {
  GET_ALL_MESSAGES_API: BASE_URL + "/contact/messages",
  MARK_MESSAGE_READ_API: BASE_URL + "/contact/messages/:messageId/mark-read",
  DELETE_MESSAGE_API: BASE_URL + "/contact/messages/:messageId",
  GET_MESSAGE_STATS_API: BASE_URL + "/contact/stats",
}

// SETTINGS PAGE API
export const settingsEndpoints = {
  UPDATE_DISPLAY_PICTURE_API: BASE_URL + "/profile/updateUserProfileImage",
  UPDATE_PROFILE_API: BASE_URL + "/profile/updateProfile",
  CHANGE_PASSWORD_API: BASE_URL + "/auth/changepassword",
  DELETE_PROFILE_API: BASE_URL + "/profile/deleteProfile",
}

// FEATURED COURSES ENDPOINTS
export const featuredCoursesEndpoints = {
  GET_FEATURED_COURSES_API: BASE_URL + "/featured-courses",
  UPDATE_FEATURED_COURSES_API: BASE_URL + "/featured-courses/update",
}

// SITE SETTINGS (PUBLIC)
export const siteSettingsEndpoints = {
  GET_PUBLIC_SITE_SETTINGS_API: BASE_URL + "/site-settings",
}

// TEAM MEMBERS (PUBLIC)
export const teamMembersEndpoints = {
  GET_PUBLIC_TEAM_MEMBERS_API: BASE_URL + "/team-members",
}

// BATCH ENDPOINTS
export const batchEndpoints = {
  CREATE_BATCH_API: BASE_URL + "/batch/create",
  GET_ALL_BATCHES_API: BASE_URL + "/batch/all",
  UPDATE_BATCH_API: BASE_URL + "/batch/update", // Append /:batchId in service
  DELETE_BATCH_API: BASE_URL + "/batch/delete", // Append /:batchId in service
}

// ADMIN ENDPOINTS
export const adminEndpoints = {
  // User Management
  GET_ALL_USERS_API: BASE_URL + "/admin/users",
  CREATE_USER_API: BASE_URL + "/admin/users",
  BULK_USER_UPLOAD_API: BASE_URL + "/admin/users/bulk-upload",
  UPDATE_USER_API: BASE_URL + "/admin/users/:userId",
  DELETE_USER_API: BASE_URL + "/admin/users/:userId",
  TOGGLE_USER_STATUS_API: BASE_URL + "/admin/users/:userId/toggle-status",
  GET_ALL_INSTRUCTORS_API: BASE_URL + "/admin/instructors",

  // Coupon Management
  GET_ALL_COUPONS_API: BASE_URL + "/admin/coupons",
  GET_FRONTEND_COUPONS_API: BASE_URL + "/admin/coupons/frontend",
  CREATE_COUPON_API: BASE_URL + "/admin/coupons/create",
  VALIDATE_COUPON_API: BASE_URL + "/admin/coupons/validate",
  APPLY_COUPON_API: BASE_URL + "/admin/coupons/apply",
  VALIDATE_AND_APPLY_COUPON_API: BASE_URL + "/admin/coupons/validate-and-apply",
  TOGGLE_COUPON_STATUS_API: BASE_URL + "/admin/coupons/:couponId/toggle",

  // Course Management
  GET_ALL_COURSES_API: BASE_URL + "/admin/courses",
  CREATE_COURSE_AS_ADMIN_API: BASE_URL + "/admin/courses/create",
  CLONE_COURSE_API: BASE_URL + "/admin/courses/:courseId/clone",
  APPROVE_COURSE_API: BASE_URL + "/admin/courses/:courseId/approve",
  ADMIN_DELETE_COURSE_API: BASE_URL + "/admin/courses/:courseId",
  TOGGLE_COURSE_VISIBILITY_API: BASE_URL + "/admin/courses/:courseId/toggle-visibility",
  SET_COURSE_TYPE_API: BASE_URL + "/admin/courses/:courseId/set-type",

  // Student Progress Tracking
  GET_STUDENTS_BY_COURSE_API: BASE_URL + "/admin/courses/:courseId/students",
  GET_STUDENT_PROGRESS_API: BASE_URL + "/admin/courses/:courseId/students/:studentId/progress",

  // Analytics
  GET_ANALYTICS_API: BASE_URL + "/admin/analytics",

  // Orders Management
  GET_ALL_ORDERS_API: BASE_URL + "/admin/orders",
  DELETE_ORDER_API: BASE_URL + "/admin/orders/:orderId",
  UPDATE_ORDER_STATUS_API: BASE_URL + "/admin/orders/:orderId/status",
  GENERATE_ORDERS_PDF_API: BASE_URL + "/admin/orders/export-pdf",
  GET_ORDER_BY_COURSE_API: BASE_URL + "/admin/orders/course/:courseId",
  // Notification Management
  SEND_NOTIFICATION_API: BASE_URL + "/admin/notifications/send",
  GET_ALL_NOTIFICATIONS_API: BASE_URL + "/admin/notifications",
  DELETE_NOTIFICATION_API: BASE_URL + "/admin/notifications/:notificationId",
  GET_NOTIFICATION_COUNTS_API: BASE_URL + "/admin/notification-counts",
  MARK_SECTION_SEEN_API: BASE_URL + "/admin/mark-section-seen/:sectionId",

  // Review Management
  GET_ALL_REVIEWS_ADMIN_API: BASE_URL + "/admin/reviews",
  TOGGLE_REVIEW_SELECTION_API: BASE_URL + "/admin/reviews/:reviewId/toggle-selection",
  BULK_UPDATE_REVIEW_SELECTION_API: BASE_URL + "/admin/reviews/bulk-update-selection",
  DELETE_REVIEW_API: BASE_URL + "/admin/reviews/:reviewId",

  // Course Assignment Management
  ASSIGN_COURSE_TO_STUDENT_API: BASE_URL + "/admin/assign-course",
  ASSIGN_COURSES_BULK_API: BASE_URL + "/admin/assign-courses-bulk",
  GET_STUDENT_COURSE_ASSIGNMENTS_API: BASE_URL + "/admin/student-assignments/:studentId",

  // Team Members Management
  GET_ADMIN_TEAM_MEMBERS_API: BASE_URL + "/admin/team-members",
  CREATE_TEAM_MEMBER_API: BASE_URL + "/admin/team-members",
  UPDATE_TEAM_MEMBER_API: BASE_URL + "/admin/team-members/:memberId",
  DELETE_TEAM_MEMBER_API: BASE_URL + "/admin/team-members/:memberId",

  // Site Settings
  GET_ADMIN_SITE_SETTINGS_API: BASE_URL + "/admin/site-settings",
  UPDATE_ADMIN_SITE_SETTINGS_API: BASE_URL + "/admin/site-settings",
}

// COURSE ACCESS ENDPOINTS
export const courseAccessEndpoints = {
  // Public
  GET_FREE_COURSES_API: BASE_URL + "/course-access/free-courses",

  // Student
  REQUEST_COURSE_ACCESS_API: BASE_URL + "/course-access/request-access",
  GET_USER_ACCESS_REQUESTS_API: BASE_URL + "/course-access/my-requests",
  REQUEST_BUNDLE_ACCESS_API: BASE_URL + "/course-access/bundle-request",

  // Admin
  GET_ALL_ACCESS_REQUESTS_API: BASE_URL + "/course-access/requests",
  HANDLE_ACCESS_REQUEST_API: BASE_URL + "/course-access/requests/:requestId",
  GET_BUNDLE_REQUESTS_API: BASE_URL + "/course-access/bundle-requests",
  UPDATE_BUNDLE_REQUEST_STATUS_API: BASE_URL + "/course-access/bundle-update-status/:bundleId",
}

// QUIZ ENDPOINTS
export const quizEndpoints = {
  CREATE_QUIZ_API: BASE_URL + "/quiz/create",
  UPDATE_QUIZ_API: BASE_URL + "/quiz/update/:quizId",
  DELETE_QUIZ_API: BASE_URL + "/quiz/delete/:quizId",
  GET_QUIZ_API: BASE_URL + "/quiz/:quizId",
  GET_ALL_QUIZZES_API: BASE_URL + "/quiz/all",
  SUBMIT_QUIZ_API: BASE_URL + "/quiz/submit",
  GET_QUIZ_RESULTS_API: BASE_URL + "/quiz/results/:quizId",
  GET_QUIZ_STATUS_API: BASE_URL + "/quiz/status/:quizId",
  VALIDATE_SECTION_ACCESS_API: BASE_URL + "/quiz/validate-access/:sectionId",
}

// QUIZ REPORTS ENDPOINTS
export const quizReportsEndpoints = {
  // Student-specific performance
  GET_STUDENT_QUIZ_PERFORMANCE_API: BASE_URL + "/quiz-reports/student/:studentId",
  GET_QUIZ_PERFORMANCE_API: BASE_URL + "/quiz-reports/quiz-performance/:quizId/:courseId",
  GET_COURSE_PERFORMANCE_API: BASE_URL + "/quiz-reports/course-performance/:courseId",
}

// ADMIN QUIZ REPORTS ENDPOINTS
export const adminQuizReportsEndpoints = {
  GET_ADMIN_QUIZ_ANALYTICS_API: BASE_URL + "/quiz-reports/admin/analytics",
  GET_ALL_STUDENT_QUIZ_PERFORMANCE_API: BASE_URL + "/quiz-reports/admin/all-students",
  GET_QUIZ_INSIGHTS_API: BASE_URL + "/quiz-reports/admin/quiz-insights",
  GET_STUDENT_COMPARISON_API: BASE_URL + "/quiz-reports/admin/student-comparison",
  GENERATE_ADMIN_REPORT_API: BASE_URL + "/quiz-reports/admin/generate-report",
}

// ZOOM MEETING ENDPOINTS
export const zoomEndpoints = {
  CREATE_ZOOM_MEETING_API: BASE_URL + "/zoom/create",
  UPDATE_ZOOM_MEETING_API: BASE_URL + "/zoom/update/:subSectionId",
  DELETE_ZOOM_MEETING_API: BASE_URL + "/zoom/delete/:subSectionId",
  GET_ZOOM_MEETING_API: BASE_URL + "/zoom/details/:subSectionId",
  GET_INSTRUCTOR_ZOOM_MEETINGS_API: BASE_URL + "/zoom/instructor/meetings",
  GET_STUDENT_ZOOM_MEETINGS_API: BASE_URL + "/zoom/student/meetings",
  GET_ADMIN_ZOOM_MEETINGS_API: BASE_URL + "/zoom/admin/all",
  // Enhanced Zoom endpoints
  VALIDATE_MEETING_SECURITY_API: BASE_URL + "/zoom/security/:meetingId/validate",
  UPDATE_MEETING_SECURITY_API: BASE_URL + "/zoom/security/:meetingId/update",
  // Engagement tracking endpoints
  TRACK_ENGAGEMENT_API: BASE_URL + "/zoom/engagement/track",
  UPDATE_ENGAGEMENT_API: BASE_URL + "/zoom/engagement/update",
  GET_MEETING_ENGAGEMENT_API: BASE_URL + "/zoom/engagement/meeting/:meetingId",
  GET_STUDENT_ENGAGEMENT_API: BASE_URL + "/zoom/engagement/student/:studentId",
  GET_COURSE_ENGAGEMENT_API: BASE_URL + "/zoom/engagement/course/:courseId",
}

// ZOOM ATTENDANCE ENDPOINTS
export const zoomAttendanceEndpoints = {
  GET_MEETING_PARTICIPANTS_API: BASE_URL + "/zoom-attendance/meeting/:meetingId/participants",
  GET_MEETING_ATTENDANCE_API: BASE_URL + "/zoom-attendance/meeting/:meetingId/attendance",
  GET_COURSE_ATTENDANCE_API: BASE_URL + "/zoom-attendance/course/:courseId/attendance",
  SYNC_MEETING_ATTENDANCE_API: BASE_URL + "/zoom-attendance/meeting/:meetingId/sync",
  GET_REAL_TIME_STATS_API: BASE_URL + "/zoom-attendance/meeting/:meetingId/stats",
  UPDATE_MEETING_STATUS_API: BASE_URL + "/zoom-attendance/meeting/:meetingId/status",
}

// ZOOM RECORDING ENDPOINTS
export const zoomRecordingEndpoints = {
  GET_MEETING_RECORDINGS_API: BASE_URL + "/zoom-recording/meeting/:meetingId/recordings",
  GET_COURSE_RECORDINGS_API: BASE_URL + "/zoom-recording/course/:courseId/recordings",
  GET_INSTRUCTOR_RECORDINGS_API: BASE_URL + "/zoom-recording/instructor/:instructorId/recordings",
  UPDATE_RECORDING_SETTINGS_API: BASE_URL + "/zoom-recording/recording/:recordingId/settings",
  RECORD_VIEWING_API: BASE_URL + "/zoom-recording/recording/:recordingId/view",
  DELETE_RECORDING_API: BASE_URL + "/zoom-recording/recording/:recordingId",
}

// CERTIFICATE ENDPOINTS
export const certificateEndpoints = {
  GENERATE_CERTIFICATE_API: BASE_URL + "/certificate/generate",
  VERIFY_CERTIFICATE_API: BASE_URL + "/certificate/verify",
  GET_USER_CERTIFICATES_API: BASE_URL + "/certificate/user-certificates",
  ADMIN_MANUAL_CERTIFICATES_API: BASE_URL + "/certificate/admin/manual",
  ADMIN_CERTIFICATE_ASSET_API: BASE_URL + "/certificate/admin/asset",
  ADMIN_CERTIFICATE_TEMPLATE_API: BASE_URL + "/certificate/admin/template",
  ADMIN_CERTIFICATE_BATCH_API: BASE_URL + "/certificate/admin/batch",
}
// NOTIFICATION ENDPOINTS
export const notificationEndpoints = {
  GET_NOTIFICATIONS_API: BASE_URL + "/notification/get-notifications",
  MARK_AS_READ_API: BASE_URL + "/notification/mark-as-read",
  MARK_ALL_READ_API: BASE_URL + "/notification/mark-all-as-read",
  DELETE_NOTIFICATION_API: BASE_URL + "/notification/delete",
}

// FAQ ENDPOINTS
export const faqEndpoints = {
  SUBMIT_QUESTION_API: BASE_URL + "/faqs/ask",
  GET_ALL_FAQS_API: BASE_URL + "/faqs/all",
  GET_PUBLISHED_FAQS_API: BASE_URL + "/faqs/published",
  ANSWER_FAQ_API: BASE_URL + "/faqs/answer/:id",
  TOGGLE_FAQ_PUBLISH_API: BASE_URL + "/faqs/toggle-publish/:id",
  DELETE_FAQ_API: BASE_URL + "/faqs/delete/:id",
}

// CHAT ENDPOINTS
export const chatEndpoints = {
  // Student endpoints
  INITIATE_CHAT_API: BASE_URL + "/chat/initiate",
  GET_STUDENT_CHATS_API: BASE_URL + "/chat/student/chats",

  // Instructor endpoints
  GET_INSTRUCTOR_CHATS_API: BASE_URL + "/chat/instructor/chats",

  // Admin endpoints
  GET_ALL_CHATS_API: BASE_URL + "/chat/admin/chats",
  ARCHIVE_CHAT_API: BASE_URL + "/chat/admin/archive",
  UNARCHIVE_CHAT_API: BASE_URL + "/chat/admin/unarchive",
  FLAG_CHAT_API: BASE_URL + "/chat/admin/flag",
  UNFLAG_CHAT_API: BASE_URL + "/chat/admin/unflag",
  DELETE_CHAT_API: BASE_URL + "/chat/admin/delete",
  HIDE_MESSAGE_API: BASE_URL + "/chat/admin/hide-message",

  // Common endpoints
  SEND_MESSAGE_API: BASE_URL + "/chat/message",
  GET_CHAT_MESSAGES_API: BASE_URL + "/chat/messages",
  GET_CHAT_DETAILS_API: BASE_URL + "/chat/details",
}

// JOB ENDPOINTS
export const jobsEndpoints = {
  // Public endpoints
  GET_PUBLISHED_JOBS_API: BASE_URL + "/jobs/published",
  GET_JOB_DETAILS_API: BASE_URL + "/jobs/details/:jobId",

  // Admin job management endpoints
  CREATE_JOB_API: BASE_URL + "/jobs/create",
  GET_ALL_JOBS_API: BASE_URL + "/jobs/all",
  UPDATE_JOB_API: BASE_URL + "/jobs/update/:jobId",
  DELETE_JOB_API: BASE_URL + "/jobs/delete/:jobId",
  TOGGLE_JOB_PUBLICATION_API: BASE_URL + "/jobs/toggle-publication/:jobId",
  GET_JOBS_ANALYTICS_API: BASE_URL + "/jobs/analytics",

  // Application management endpoints (Admin)
  GET_JOB_APPLICATIONS_API: BASE_URL + "/jobs/applications/:jobId",
  GET_ALL_APPLICATIONS_API: BASE_URL + "/jobs/applications",
  UPDATE_APPLICATION_STATUS_API: BASE_URL + "/jobs/application/:applicationId/status",

  // Job application endpoints (Public)
  SUBMIT_APPLICATION_API: BASE_URL + "/job-applications/submit",
  GET_APPLICATION_BY_ID_API: BASE_URL + "/job-applications/:applicationId",
  DELETE_APPLICATION_API: BASE_URL + "/job-applications/:applicationId",
  BULK_UPDATE_APPLICATION_STATUS_API: BASE_URL + "/job-applications/bulk-update",
  GET_APPLICATION_STATISTICS_API: BASE_URL + "/job-applications/statistics/:jobId?",
  GET_APPLICATIONS_BY_EMAIL_API: BASE_URL + "/job-applications/email/:email",
  DOWNLOAD_RESUME_API: BASE_URL + "/job-applications/download/:applicationId",
}

// COUPON ENDPOINTS (User accessible)
export const couponEndpoints = {
  // User accessible coupon endpoints
  GET_FRONTEND_COUPONS_API: BASE_URL + "/auth/coupons/frontend",
  VALIDATE_AND_APPLY_COUPON_API: BASE_URL + "/auth/coupons/validate-and-apply",

  // Legacy endpoints (for backward compatibility)
  VALIDATE_COUPON_API: BASE_URL + "/auth/coupons/validate-and-apply",
  APPLY_COUPON_API: BASE_URL + "/auth/coupons/validate-and-apply",
}

// PAYMENT ENDPOINTS
export const paymentEndpoints = {
  PAYMENT_REPORTS_API: BASE_URL + "/payment/reports",
  EXPORT_PAYMENT_REPORTS_API: BASE_URL + "/payment/reports/export",
}

// ASSIGNMENT ENDPOINTS
export const assignmentEndpoints = {
  // Instructor/Admin
  CREATE_ASSIGNMENT_API: BASE_URL + "/assignments/create",
  GET_INSTRUCTOR_ASSIGNMENTS_API: BASE_URL + "/assignments/my-assignments",
  UPDATE_ASSIGNMENT_API: BASE_URL + "/assignments/:assignmentId",
  DELETE_ASSIGNMENT_API: BASE_URL + "/assignments/:assignmentId",
  PUBLISH_ASSIGNMENT_API: BASE_URL + "/assignments/:assignmentId/publish",

  // Common
  GET_COURSE_ASSIGNMENTS_API: BASE_URL + "/assignments/course/:courseId",
  GET_ASSIGNMENT_API: BASE_URL + "/assignments/:assignmentId",
  GET_ASSIGNMENT_DETAILS_API: BASE_URL + "/assignments/:assignmentId/details",
}

// SUBMISSION ENDPOINTS
export const submissionEndpoints = {
  // Student
  SUBMIT_ASSIGNMENT_API: BASE_URL + "/submissions/submit",
  GET_ASSIGNMENT_SUBMISSIONS_API: BASE_URL + "/submissions/assignment/:assignmentId",
  GET_SUBMISSION_DETAILS_API: BASE_URL + "/submissions/assignment/:assignmentId/student",
  // Instructor
  GRADE_SUBMISSION_API: BASE_URL + "/submissions/:submissionId/grade",
}

// PLAN INTEGRATION ENDPOINTS
const PLAN_BASE_URL = (import.meta.env.VITE_PLAN_API_BASE_URL || '').replace(/\/$/, '');
export const planEndpoints = {
  // Plan Management - External API URLs
  GET_PLAN_PURCHASE_API: PLAN_BASE_URL ? `${PLAN_BASE_URL}/plan-purchase` : null,
  UPDATE_PLAN_USAGE_API: PLAN_BASE_URL ? `${PLAN_BASE_URL}/plan-usage-update` : null,
  
  // Internal API Routes (Laravel Backend)
  VALIDATE_ACTIVATION_CODE_API: BASE_URL + "/plans/validate-code",
  GET_ACTIVE_PLANS_API: BASE_URL + "/plans/active",
  CHECK_FEATURE_ACCESS_API: BASE_URL + "/plans/check-access",
  
  // Protected Plan Routes (require auth)
  GET_MY_PLANS_API: BASE_URL + "/plans/my-plans",
  CONSUME_SKILL_TEST_API: BASE_URL + "/plans/consume-skill-test",
  CONSUME_COURSE_API: BASE_URL + "/plans/consume-course",
  CONSUME_INTERNSHIP_API: BASE_URL + "/plans/consume-internship",
}

// SKILLI INTEGRATION ENDPOINTS
export const skilliEndpoints = {
  // Skill Test Integration
  INITIALIZE_SKILL_TEST_API: BASE_URL + "/skilli/skill-test/initialize",
  COMPLETE_SKILL_TEST_API: BASE_URL + "/skilli/skill-test/complete",
  GET_SKILL_TEST_STATS_API: BASE_URL + "/skilli/skill-test/stats",
  
  // Course Integration
  INITIALIZE_COURSE_API: BASE_URL + "/skilli/course/initialize",
  ENROLL_IN_COURSE_API: BASE_URL + "/skilli/course/enroll",
  
  // Virtual Internship Integration
  INITIALIZE_INTERNSHIP_API: BASE_URL + "/skilli/internship/initialize",
  START_INTERNSHIP_API: BASE_URL + "/skilli/internship/start",
}

// LMS INTEGRATION ENDPOINTS
export const lmsEndpoints = {
  // LMS Access Management
  VALIDATE_ACTIVATION_FOR_LMS_API: BASE_URL + "/lms/validate-activation",
  GET_LMS_ACCESS_URL_API: BASE_URL + "/lms/access-url",
  VALIDATE_LMS_TOKEN_API: BASE_URL + "/lms/validate-token",
  REDIRECT_TO_LMS_API: BASE_URL + "/lms/redirect",
  
  // LMS Access Tracking
  GET_LMS_ACCESS_HISTORY_API: BASE_URL + "/lms/access-history",
  CHECK_COURSE_ACCESS_API: BASE_URL + "/lms/check-course-access",
  GET_LMS_ENROLLMENT_STATUS_API: BASE_URL + "/lms/enrollment-status",
}
