import { useState, lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { FaChartBar, FaUsers, FaBookOpen, FaChartLine, FaQuestionCircle, FaGraduationCap, FaTag, FaEnvelope, FaFileAlt, FaVideo, FaCertificate } from 'react-icons/fa';
import { MdSettings } from 'react-icons/md';
import { VscPackage } from 'react-icons/vsc';
import AdminSidebar from '../../components/core/Dashboard/Admin/AdminSidebar';

// Lazy load components to improve initial load performance
const StudentProgress = lazy(() => import('./components/StudentProgress/StudentProgress'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const CourseManagement = lazy(() => import('./components/CourseManagement'));
const CreateCourse = lazy(() => import('./components/CreateCourse/CreateCourse'));
const EnhancedAnalytics = lazy(() => import('./components/EnhancedAnalytics'));
const Settings = lazy(() => import('./components/Settings'));
const CourseAccessRequests = lazy(() => import('../../components/core/Dashboard/Admin/CourseAccessRequests'));
const QuizManagement = lazy(() => import('./components/QuizManagement'));
const CourseCategories = lazy(() => import('../../components/core/Dashboard/AddCategory/CourseCategories'));
const BundleAccessRequests = lazy(() => import('./components/BundleAccessRequests'));
const TeamMembersManagement = lazy(() => import('./components/TeamMembersManagement'));
const Coupons = lazy(() => import('./Coupons'));
const Orders = lazy(() => import('./components/Orders'));
const NotificationManagement = lazy(() => import('./components/NotificationManagement'));
const FeaturedCoursesManagement = lazy(() => import('./components/FeaturedCoursesManagement'));
const ContactMessages = lazy(() => import('../../components/core/Dashboard/Admin/ContactMessages'));
const FaqManagement = lazy(() => import('./components/FaqManagement'));
const AdminChats = lazy(() => import('../Dashboard/AdminChats'));
const CareersManagement = lazy(() => import('./components/CareersManagement'));
const RecycleBin = lazy(() => import('./components/RecycleBin'));
const ReviewManagement = lazy(() => import('./components/ReviewManagement'));
const PaymentReports = lazy(() => import('../../components/core/Dashboard/Admin/PaymentReports'));
const EmailLogs = lazy(() => import('./components/EmailLogs'));
const AdminQuizAnalytics = lazy(() => import('../../components/core/Dashboard/AdminQuizAnalytics'));
const AdminZoomAttendance = lazy(() => import('../Admin/AdminZoomAttendance'));
const ReportsManagement = lazy(() => import('../../components/core/Dashboard/ReportsManagement'));
const AdminZoomMeetings = lazy(() => import('./components/AdminZoomMeetings'));
const AdminAssignments = lazy(() => import('./components/AdminAssignments'));
const CourseAssignmentManagement = lazy(() => import('./components/CourseAssignmentManagement'));
const SiteThemeSettings = lazy(() => import('./components/SiteThemeSettings'));
const ManualCertificates = lazy(() => import('./components/ManualCertificates'));

// Loading component
const LoadingSpinner = () => <div className="flex items-center justify-center py-20">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" style={{
      animationDelay: '0.15s'
    }}></div>
    </div>
  </div>;
const AdminDashboard = () => {
  useSelector(state => state.profile);
  const {
    isCollapsed
  } = useSelector(state => state.sidebar);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'analytics';
  const setActiveTab = tab => setSearchParams(previous => {
    const next = new URLSearchParams(previous);
    next.set('tab', tab);
    return next;
  });
  const [showCreateCourse, setShowCreateCourse] = useState(false);

  // Sidebar navigation items for title display (matching AdminSidebar order)
  const sidebarItems = [{
    id: 'analytics',
    label: 'Analytics Dashboard',
    icon: <FaChartBar className="w-5 h-5" />
  }, {
    id: 'users',
    label: 'User Management',
    icon: <FaUsers className="w-5 h-5" />
  }, {
    id: 'teamMembers',
    label: 'Team Members',
    icon: <FaUsers className="w-5 h-5" />
  }, {
    id: 'siteTheme',
    label: 'Site Theme',
    icon: <MdSettings className="w-5 h-5" />
  }, {
    id: 'categories',
    label: 'Course Categories',
    icon: <FaGraduationCap className="w-5 h-5" />
  }, {
    id: 'courses',
    label: 'Course Management',
    icon: <FaBookOpen className="w-5 h-5" />
  }, {
    id: 'courseAssignments',
    label: 'Course Assignments',
    icon: <FaUsers className="w-5 h-5" />
  }, {
    id: 'studentProgress',
    label: 'Student Progress',
    icon: <FaChartLine className="w-5 h-5" />
  }, {
    id: 'assignments',
    label: 'Assignment Management',
    icon: <FaFileAlt className="w-5 h-5" />
  }, {
    id: 'certificates',
    label: 'Certificates',
    icon: <FaCertificate className="w-5 h-5" />
  }, {
    id: 'quizzes',
    label: 'Quiz Management',
    icon: <FaQuestionCircle className="w-5 h-5" />
  }, {
    id: 'quizAnalytics',
    label: 'Quiz Analytics',
    icon: <FaChartLine className="w-5 h-5" />
  }, {
    id: 'zoomMeetings',
    label: 'Zoom Meetings',
    icon: <FaVideo className="w-5 h-5" />
  }, {
    id: 'reportsManagement',
    label: 'Reports Management',
    icon: <FaFileAlt className="w-5 h-5" />
  }, {
    id: 'recycleBin',
    label: 'Recycle Bin',
    icon: <FaUsers className="w-5 h-5" />
  }, {
    id: 'featuredCourses',
    label: 'Featured Courses Management',
    icon: <FaUsers className="w-5 h-5" />
  }, {
    id: 'reviews',
    label: 'Review ',
    icon: <FaUsers className="w-5 h-5" />
  }, {
    id: 'accessRequests',
    label: 'Access Requests',
    icon: <FaUsers className="w-5 h-5" />
  }, {
    id: 'bundleRequests',
    label: 'Bundle Requests',
    icon: <FaUsers className="w-5 h-5" />
  }, {
    id: 'orders',
    label: 'Orders',
    icon: <VscPackage className="w-5 h-5" />
  }, {
    id: 'paymentReports',
    label: 'Payment Reports',
    icon: <FaChartLine className="w-5 h-5" />
  }, {
    id: 'coupons',
    label: 'Coupons',
    icon: <FaTag className="w-5 h-5" />
  }, {
    id: 'careers',
    label: 'Careers',
    icon: <FaUsers className="w-5 h-5" />
  }, {
    id: 'notifications',
    label: 'Notification Management',
    icon: <FaUsers className="w-5 h-5" />
  }, {
    id: 'contactMessages',
    label: 'Contact Messages',
    icon: <FaUsers className="w-5 h-5" />
  }, {
    id: 'faqs',
    label: 'FAQ Management',
    icon: <FaQuestionCircle className="w-5 h-5" />
  }, {
    id: 'chats',
    label: 'Manage Chats',
    icon: <FaUsers className="w-5 h-5" />
  }, {
    id: 'emailLogs',
    label: 'Email Report',
    icon: <FaEnvelope className="w-5 h-5" />
  }];
  const handleTabChange = tabId => {
    setActiveTab(tabId);
    setShowCreateCourse(false);
  };
  const handleCreateCourse = () => {
    setShowCreateCourse(true);
    setActiveTab('courses');
  };
  return <div className="min-h-screen bg-richblack-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="sm:fixed sm:left-0 sm:top-16 h-[calc(100vh-4rem)] z-30 transition-all duration-300">
          <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {/* Main Content */}
        <div className={`flex-1 mt-16 min-h-[calc(100vh-4rem)] transition-all duration-300 ${isCollapsed ? 'sm:ml-16' : 'sm:ml-64'} w-full px-4 sm:px-0`}>
          <div className="p-4 sm:p-6 overflow-x-hidden">
            {/* Header */}
            {(activeTab !== 'certificates' || showCreateCourse) && <div className="mb-4 sm:mb-8 bg-richblack-800 border border-richblack-700 p-4 sm:p-6 rounded-xl shadow-md">
              <h1 className="text-2xl sm:text-3xl font-bold text-richblack-5">
                {showCreateCourse ? 'Create Course' : sidebarItems.find(item => item.id === activeTab)?.label}
              </h1>
              <p className="text-richblack-200 mt-2">
                Manage your platform efficiently with these tools
              </p>
            </div>}

            {/* Content */}
            <div className={activeTab === 'certificates' && !showCreateCourse ? 'min-w-0' : 'bg-richblack-800 border border-richblack-700 rounded-xl p-4 sm:p-6 shadow-md'}>
              <Suspense fallback={<LoadingSpinner />}>
                {showCreateCourse ? <CreateCourse onCancel={() => setShowCreateCourse(false)} /> : <>
                    {activeTab === 'analytics' && <EnhancedAnalytics />}
                    {activeTab === 'quizAnalytics' && <Suspense fallback={<LoadingSpinner />}>
                        <AdminQuizAnalytics />
                      </Suspense>}
                    {activeTab === 'reportsManagement' && <Suspense fallback={<LoadingSpinner />}>
                      
                        <ReportsManagement />
                      </Suspense>}
                    {activeTab === 'zoomMeetings' && <Suspense fallback={<LoadingSpinner />}>
                        <AdminZoomMeetings />
                      </Suspense>}
                    {activeTab === 'zoomAttendance' && <Suspense fallback={<LoadingSpinner />}>
                        <AdminZoomAttendance />
                      </Suspense>}
                    {activeTab === 'teamMembers' && <Suspense fallback={<LoadingSpinner />}>
                        <TeamMembersManagement />
                      </Suspense>}
                    {activeTab === 'siteTheme' && <Suspense fallback={<LoadingSpinner />}>
                        <SiteThemeSettings />
                      </Suspense>}
                    {activeTab === 'users' && <UserManagement />}
                    {activeTab === 'courses' && <CourseManagement onCreateCourse={handleCreateCourse} />}
                    {activeTab === 'courseAssignments' && <Suspense fallback={<LoadingSpinner />}>
                        <CourseAssignmentManagement />
                      </Suspense>}
                    {activeTab === 'categories' && <CourseCategories />}
                    {activeTab === 'accessRequests' && <CourseAccessRequests />}
                    {activeTab === 'settings' && <Settings />}
                    {activeTab === 'quizzes' && <QuizManagement />}
                    {activeTab === 'bundleRequests' && <BundleAccessRequests />}
                    {activeTab === 'studentProgress' && <StudentProgress />}
                    {activeTab === 'orders' && <Orders />}
                    {activeTab === 'paymentReports' && <PaymentReports />}
                    {activeTab === 'coupons' && <Coupons />}
                    {activeTab === 'notifications' && <NotificationManagement />}
                    {activeTab === 'contactMessages' && <ContactMessages />}
                    {activeTab === 'featuredCourses' && <FeaturedCoursesManagement />}
                    {activeTab === 'reviews' && <ReviewManagement />}
                    {activeTab === 'faqs' && <FaqManagement />}
                    {activeTab === 'chats' && <AdminChats />}
                    {activeTab === 'careers' && <CareersManagement />}
                    {activeTab === 'emailLogs' && <EmailLogs />}
                    {activeTab === 'recycleBin' && <RecycleBin />}
                    {activeTab === 'assignments' && <AdminAssignments />}
                    {activeTab === 'certificates' && <ManualCertificates />}
                  </>}
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default AdminDashboard;
