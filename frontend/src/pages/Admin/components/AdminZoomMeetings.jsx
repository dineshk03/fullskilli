import { useState, useEffect, useCallback } from "react";
import { FiVideo, FiCalendar, FiClock, FiUsers, FiExternalLink, FiTrash2, FiRefreshCw, FiSearch, FiPlus, FiBarChart2, FiUser, FiUserCheck, FiUserX, FiTrendingUp, FiX } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { apiConnector } from "../../../services/apiConnector";
import { zoomEndpoints, courseEndpoints } from "../../../services/apis";
const {
  GET_ADMIN_ZOOM_MEETINGS_API,
  CREATE_ZOOM_MEETING_API,
  DELETE_ZOOM_MEETING_API
} = zoomEndpoints;
export default function AdminZoomMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [formData, setFormData] = useState({
    subSectionId: '',
    title: '',
    description: '',
    startTime: '',
    duration: 60,
    timezone: 'UTC'
  });
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const {
    token
  } = useSelector(state => state.auth);
  const {
    user
  } = useSelector(state => state.profile);

  // Debug authentication state
  console.log('🔐 Authentication Debug:');
  console.log('  - Token exists:', !!token);
  console.log('  - Token length:', token?.length || 0);
  console.log('  - User exists:', !!user);
  console.log('  - User account type:', user?.accountType);
  console.log('  - User email:', user?.email);
  console.log('  - Full auth state:', {
    token: token?.substring(0, 20) + '...',
    user: {
      email: user?.email,
      accountType: user?.accountType
    }
  });

  // Fetch all meetings (admin can see all instructor meetings)
  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching admin meetings...');
      console.log('🔑 Token exists:', !!token);
      console.log('🌐 API Endpoint:', GET_ADMIN_ZOOM_MEETINGS_API);
      const response = await apiConnector("GET", GET_ADMIN_ZOOM_MEETINGS_API, null, {
        Authorization: `Bearer ${token}`
      });
      console.log('📦 API Response:', response);
      console.log('📊 Response data:', response.data);
      if (response.data.success) {
        console.log('✅ Success! Setting meetings data:', response.data.data);
        setMeetings(response.data.data || []);
      } else {
        console.log('❌ API returned failure:', response.data);
      }
    } catch (error) {
      console.error("❌ Error fetching meetings:", error);
      console.error("❌ Error details:", error.response?.data || error.message);
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch all courses for admin
  const fetchCourses = useCallback(async () => {
    try {
      setLoadingCourses(true);
      console.log('🔄 Fetching all courses for admin...');
      const response = await apiConnector("GET", courseEndpoints.GET_ALL_COURSE_API, null, {
        Authorization: `Bearer ${token}`
      });
      console.log('📦 Courses Response:', response);
      if (response.data.success) {
        setCourses(response.data.data);
        console.log('✅ Courses loaded:', response.data.data.length);
      }
    } catch (error) {
      console.error("❌ Error fetching courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoadingCourses(false);
    }
  }, [token]);

  // Handle create meeting
  const handleCreateMeeting = async e => {
    e.preventDefault();
    try {
      console.log('🔄 Creating meeting with data:', formData);
      const response = await apiConnector("POST", CREATE_ZOOM_MEETING_API, formData, {
        Authorization: `Bearer ${token}`
      });
      console.log('📦 Create Response:', response);
      if (response.data.success) {
        toast.success("Meeting created successfully!");
        setShowCreateModal(false);
        setFormData({
          subSectionId: '',
          title: '',
          description: '',
          startTime: '',
          duration: 60,
          timezone: 'UTC'
        });
        fetchMeetings();
      }
    } catch (error) {
      console.error("❌ Error creating meeting:", error);
      toast.error(error.response?.data?.message || "Failed to create meeting");
    }
  };
  useEffect(() => {
    console.log('🔄 useEffect triggered');
    console.log('  - Token available:', !!token);
    console.log('  - User available:', !!user);
    console.log('  - User is Admin:', user?.accountType === 'Admin');
    if (token && user && user.accountType === 'Admin') {
      console.log('✅ Admin authenticated, fetching meetings...');
      fetchMeetings();
    } else {
      console.log('❌ Not authenticated as admin');
      console.log('  - Token:', !!token);
      console.log('  - User:', !!user);
      console.log('  - Account Type:', user?.accountType);
      setLoading(false);
    }
  }, [fetchMeetings, token, user]);

  // Fetch courses when modal opens
  useEffect(() => {
    if (showCreateModal) {
      fetchCourses();
    }
  }, [fetchCourses, showCreateModal]);

  // Handle delete meeting
  const handleDelete = async (subSectionId, meetingTitle) => {
    if (!window.confirm(`Are you sure you want to delete the meeting "${meetingTitle}"?`)) return;
    try {
      const response = await apiConnector("DELETE", DELETE_ZOOM_MEETING_API.replace(':subSectionId', subSectionId), null, {
        Authorization: `Bearer ${token}`
      });
      if (response.data.success) {
        toast.success("Meeting deleted successfully!");
        fetchMeetings();
      }
    } catch (error) {
      console.error("Error deleting meeting:", error);
      toast.error("Failed to delete meeting");
    }
  };
  const formatDateTime = dateString => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };
  const getMeetingStatus = (startTime, duration) => {
    const now = new Date();
    const meetingStart = new Date(startTime);
    const meetingEnd = new Date(meetingStart.getTime() + duration * 60000);
    if (now < meetingStart - 600000) return 'upcoming';
    if (now < meetingStart) return 'starting-soon';
    if (now >= meetingStart && now <= meetingEnd) return 'live';
    return 'ended';
  };
  const getStatusColor = status => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'starting-soon':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'live':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'ended':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };
  const getStatusText = status => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'starting-soon':
        return 'Starting Soon';
      case 'live':
        return 'Live Now';
      case 'ended':
        return 'Ended';
      default:
        return 'Scheduled';
    }
  };

  // Filter meetings based on search and status
  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.zoomMeeting?.topic?.toLowerCase().includes(searchTerm.toLowerCase()) || meeting.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase()) || meeting.title?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterStatus === 'all') return matchesSearch;
    const status = getMeetingStatus(meeting.zoomMeeting?.startTime, meeting.zoomMeeting?.duration);
    return matchesSearch && status === filterStatus;
  });
  const getStats = () => {
    const total = meetings.length;
    const live = meetings.filter(m => getMeetingStatus(m.zoomMeeting?.startTime, m.zoomMeeting?.duration) === 'live').length;
    const upcoming = meetings.filter(m => getMeetingStatus(m.zoomMeeting?.startTime, m.zoomMeeting?.duration) === 'upcoming').length;
    const ended = meetings.filter(m => getMeetingStatus(m.zoomMeeting?.startTime, m.zoomMeeting?.duration) === 'ended').length;
    return {
      total,
      live,
      upcoming,
      ended
    };
  };
  const stats = getStats();

  // Handle view report
  const handleViewReport = meeting => {
    setSelectedMeeting(meeting);
    setShowReportModal(true);
  };

  // Handle view participants
  const handleViewParticipants = meeting => {
    setSelectedMeeting(meeting);
    setShowParticipantsModal(true);
  };

  // Get status badge with enhanced colors for backend status
  const getEnhancedStatusBadge = zoomMeeting => {
    const status = zoomMeeting.status || 'scheduled';
    const statusConfig = {
      'scheduled': {
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        text: 'Scheduled',
        icon: FiCalendar
      },
      'upcoming': {
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        text: 'Upcoming',
        icon: FiCalendar
      },
      'starting-soon': {
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        text: 'Starting Soon',
        icon: FiClock
      },
      'live': {
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        text: 'Live Now',
        icon: FiVideo
      },
      'ended': {
        color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        text: 'Ended',
        icon: FiClock
      },
      'cancelled': {
        color: 'bg-red-500/20 text-red-400 border-red-500/30',
        text: 'Cancelled',
        icon: FiX
      }
    };
    const config = statusConfig[status] || statusConfig['scheduled'];
    const Icon = config.icon;
    return <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="text-xs" />
        {config.text}
      </span>;
  };
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="text-center py-20">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-medium">Loading Zoom meetings...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 rounded-3xl p-8 mb-8 border border-slate-600/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FiVideo className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Zoom Meetings Management
                </h1>
                <p className="text-slate-400 mt-1">Monitor and manage all live lecture sessions</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => {
              setFormData({
                subSectionId: '',
                title: '',
                description: '',
                startTime: '',
                duration: 60,
                timezone: 'UTC'
              });
              setShowCreateModal(true);
            }} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform">
                <FiPlus className="text-xl" />
                <span>Schedule Meeting</span>
              </button>
              <button onClick={fetchMeetings} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform">
                <FiRefreshCw className="text-xl" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-6 border border-blue-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <FiVideo className="text-blue-400 text-xl" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Meetings</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Live Now</p>
                <p className="text-2xl font-bold text-white">{stats.live}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl p-6 border border-yellow-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <FiCalendar className="text-yellow-400 text-xl" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Upcoming</p>
                <p className="text-2xl font-bold text-white">{stats.upcoming}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-500/10 to-slate-500/10 rounded-2xl p-6 border border-gray-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-500/20 rounded-xl flex items-center justify-center">
                <FiClock className="text-gray-400 text-xl" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-white">{stats.ended}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 mb-8 border border-slate-600/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search meetings, courses, or lectures..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2">
              {['all', 'live', 'upcoming', 'ended'].map(status => <button key={status} onClick={() => setFilterStatus(status)} className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 ${filterStatus === status ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>)}
            </div>
          </div>
        </div>

        {/* Meetings List */}
        {filteredMeetings.length === 0 ? <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl p-12 text-center border border-slate-600/50">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FiVideo className="text-4xl text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">No Meetings Found</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              {searchTerm || filterStatus !== 'all' ? "No meetings match your current filters. Try adjusting your search or filter criteria." : "No Zoom meetings have been scheduled yet. Create your first meeting to get started."}
            </p>
            {!searchTerm && filterStatus === 'all' && <button onClick={() => {
          setFormData({
            subSectionId: '',
            title: '',
            description: '',
            startTime: '',
            duration: 60,
            timezone: 'UTC'
          });
          setShowCreateModal(true);
        }} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform">
                Schedule Your First Meeting
              </button>}
          </div> : <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMeetings.map(meeting => {
          const status = getMeetingStatus(meeting.zoomMeeting?.startTime, meeting.zoomMeeting?.duration);
          const statusColor = getStatusColor(status);
          const statusText = getStatusText(status);
          return <div key={meeting._id} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-slate-600/50 backdrop-blur-sm hover:border-slate-500/50 transition-all duration-300">
                  {/* Meeting Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <FiVideo className="text-white text-xl" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white truncate max-w-[200px]">
                          {meeting.zoomMeeting?.topic}
                        </h3>
                        <p className="text-sm text-slate-400">{meeting.courseTitle}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                      {statusText}
                      {status === 'live' && <span className="ml-1">🔴</span>}
                    </div>
                  </div>

                  {/* Enhanced Meeting Details with Analytics */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-slate-300">
                      <FiCalendar className="text-blue-400" />
                      <span className="text-sm">{formatDateTime(meeting.zoomMeeting?.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <FiClock className="text-green-400" />
                      <span className="text-sm">{meeting.zoomMeeting?.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <FiUsers className="text-purple-400" />
                      <span className="text-sm">{meeting.title}</span>
                    </div>
                    
                    {/* Enhanced Analytics */}
                    {meeting.zoomMeeting.totalParticipants !== undefined && <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-600/50">
                        <div className="text-center p-2 bg-slate-700/30 rounded-lg">
                          <div className="text-lg font-bold text-white">{meeting.zoomMeeting.totalParticipants || 0}</div>
                          <div className="text-xs text-slate-400">Total Participants</div>
                        </div>
                        <div className="text-center p-2 bg-slate-700/30 rounded-lg">
                          <div className="text-lg font-bold text-green-400">{meeting.zoomMeeting.attendanceRate || 0}%</div>
                          <div className="text-xs text-slate-400">Attendance Rate</div>
                        </div>
                      </div>}
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => window.open(meeting.zoomMeeting?.joinUrl, '_blank')} className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm rounded-lg transition-all duration-300">
                      <FiExternalLink />
                      <span>Join</span>
                    </button>
                    <button onClick={() => handleViewParticipants(meeting)} className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm rounded-lg transition-all duration-300">
                      <FiUsers />
                      <span>Participants</span>
                    </button>
                    <button onClick={() => handleViewReport(meeting)} className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm rounded-lg transition-all duration-300">
                      <FiBarChart2 />
                      <span>Report</span>
                    </button>
                    <button onClick={() => handleDelete(meeting._id, meeting.zoomMeeting?.topic)} className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-all duration-300">
                      <FiTrash2 />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>;
        })}
          </div>}

        {/* Create Meeting Modal */}
        {showCreateModal && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-2xl w-full border border-slate-600/50">
              <h2 className="text-2xl font-bold text-white mb-6">Schedule New Meeting</h2>
              
              <form onSubmit={handleCreateMeeting} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select Lecture
                  </label>
                  {loadingCourses ? <div className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-400 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-blue-500 rounded-full animate-spin"></div>
                      Loading courses...
                    </div> : <select value={formData.subSectionId} onChange={e => setFormData({
                ...formData,
                subSectionId: e.target.value
              })} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500" required>
                      <option value="">Choose a lecture...</option>
                      {courses.map(course => <optgroup key={course._id} label={`📚 ${course.courseName}`}>
                          {course.courseContent?.map(section => section.subSection?.map(subSection => <option key={subSection._id} value={subSection._id}>
                                📝 {section.sectionName} → {subSection.title}
                              </option>))}
                        </optgroup>)}
                    </select>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Meeting Title
                  </label>
                  <input type="text" value={formData.title} onChange={e => setFormData({
                ...formData,
                title: e.target.value
              })} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="Enter meeting title" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea value={formData.description} onChange={e => setFormData({
                ...formData,
                description: e.target.value
              })} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="Enter meeting description" rows={3} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Start Time
                    </label>
                    <input type="datetime-local" value={formData.startTime} onChange={e => setFormData({
                  ...formData,
                  startTime: e.target.value
                })} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500" required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Duration (minutes)
                    </label>
                    <input type="number" value={formData.duration} onChange={e => setFormData({
                  ...formData,
                  duration: parseInt(e.target.value)
                })} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500" min="15" max="480" required />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300">
                    Schedule Meeting
                  </button>
                </div>
              </form>
            </div>
          </div>}

        {/* Meeting Report Modal */}
        {showReportModal && selectedMeeting && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-600/50 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-600/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <FiBarChart2 className="text-blue-400" />
                    Meeting Report: {selectedMeeting.zoomMeeting?.topic}
                  </h2>
                  <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white transition-colors">
                    <FiX className="text-xl" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Meeting Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-xl p-4 border border-blue-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <FiCalendar className="text-blue-400" />
                      <span className="text-sm text-blue-300">Meeting Date</span>
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {formatDateTime(selectedMeeting.zoomMeeting?.startTime)}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 rounded-xl p-4 border border-green-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <FiUsers className="text-green-400" />
                      <span className="text-sm text-green-300">Total Participants</span>
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {selectedMeeting.zoomMeeting?.totalParticipants || 0}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 rounded-xl p-4 border border-purple-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <FiTrendingUp className="text-purple-400" />
                      <span className="text-sm text-purple-300">Attendance Rate</span>
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {selectedMeeting.zoomMeeting?.attendanceRate || 0}%
                    </div>
                  </div>
                </div>

                {/* Participant Statistics */}
                <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
                  <h3 className="text-lg font-semibold text-white mb-4">Participant Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {selectedMeeting.zoomMeeting?.attendedCount || 0}
                      </div>
                      <div className="text-sm text-slate-400">Attended</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        {selectedMeeting.zoomMeeting?.leftEarlyCount || 0}
                      </div>
                      <div className="text-sm text-slate-400">Left Early</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">
                        {selectedMeeting.zoomMeeting?.noShowCount || 0}
                      </div>
                      <div className="text-sm text-slate-400">No Show</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {selectedMeeting.zoomMeeting?.enrolledStudents || 0}
                      </div>
                      <div className="text-sm text-slate-400">Enrolled Students</div>
                    </div>
                  </div>
                </div>

                {/* Course Information */}
                <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
                  <h3 className="text-lg font-semibold text-white mb-4">Course Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 w-24">Course:</span>
                      <span className="text-white font-medium">{selectedMeeting.courseTitle}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 w-24">Section:</span>
                      <span className="text-white font-medium">{selectedMeeting.sectionName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 w-24">Lecture:</span>
                      <span className="text-white font-medium">{selectedMeeting.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 w-24">Instructor:</span>
                      <span className="text-white font-medium">
                        {selectedMeeting.courseInstructor?.firstName} {selectedMeeting.courseInstructor?.lastName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Meeting Details */}
                <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
                  <h3 className="text-lg font-semibold text-white mb-4">Meeting Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 w-24">Duration:</span>
                      <span className="text-white font-medium">{selectedMeeting.zoomMeeting?.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 w-24">Status:</span>
                      {getEnhancedStatusBadge(selectedMeeting.zoomMeeting)}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 w-24">Meeting ID:</span>
                      <span className="text-white font-medium">{selectedMeeting.zoomMeeting?.meetingId}</span>
                    </div>
                    {selectedMeeting.zoomMeeting?.agenda && <div className="flex items-start gap-3">
                        <span className="text-slate-400 w-24">Agenda:</span>
                        <span className="text-white font-medium">{selectedMeeting.zoomMeeting.agenda}</span>
                      </div>}
                  </div>
                </div>
              </div>
            </div>
          </div>}

        {/* Participants Modal */}
        {showParticipantsModal && selectedMeeting && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-600/50 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-600/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <FiUsers className="text-blue-400" />
                    Participants: {selectedMeeting.zoomMeeting?.topic}
                  </h2>
                  <button onClick={() => setShowParticipantsModal(false)} className="text-slate-400 hover:text-white transition-colors">
                    <FiX className="text-xl" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {selectedMeeting.zoomMeeting?.participants && selectedMeeting.zoomMeeting.participants.length > 0 ? <div className="space-y-4">
                    {/* Participants Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-green-600/20 rounded-xl p-4 border border-green-500/30">
                        <div className="flex items-center gap-3 mb-2">
                          <FiUserCheck className="text-green-400" />
                          <span className="text-sm text-green-300">Attended</span>
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {selectedMeeting.zoomMeeting.attendedCount || 0}
                        </div>
                      </div>
                      
                      <div className="bg-yellow-600/20 rounded-xl p-4 border border-yellow-500/30">
                        <div className="flex items-center gap-3 mb-2">
                          <FiUserX className="text-yellow-400" />
                          <span className="text-sm text-yellow-300">Left Early</span>
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {selectedMeeting.zoomMeeting.leftEarlyCount || 0}
                        </div>
                      </div>
                      
                      <div className="bg-red-600/20 rounded-xl p-4 border border-red-500/30">
                        <div className="flex items-center gap-3 mb-2">
                          <FiUser className="text-red-400" />
                          <span className="text-sm text-red-300">No Show</span>
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {selectedMeeting.zoomMeeting.noShowCount || 0}
                        </div>
                      </div>
                    </div>

                    {/* Participants List */}
                    <div className="bg-slate-700/30 rounded-xl border border-slate-600/50 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-600/50 border-b border-slate-600/50">
                            <tr>
                              <th className="text-left p-4 text-sm font-medium text-slate-300">Participant</th>
                              <th className="text-left p-4 text-sm font-medium text-slate-300">Email</th>
                              <th className="text-left p-4 text-sm font-medium text-slate-300">Join Time</th>
                              <th className="text-left p-4 text-sm font-medium text-slate-300">Duration</th>
                              <th className="text-left p-4 text-sm font-medium text-slate-300">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-600/30">
                            {selectedMeeting.zoomMeeting.participants.map((participant, index) => <tr key={index} className="hover:bg-slate-600/20 transition-colors">
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                      <FiUser className="text-white text-sm" />
                                    </div>
                                    <span className="text-white font-medium">{participant.name}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-slate-300 text-sm">{participant.email}</td>
                                <td className="p-4 text-slate-300 text-sm">
                                  {participant.joinTime ? formatDateTime(participant.joinTime) : 'N/A'}
                                </td>
                                <td className="p-4 text-slate-300 text-sm">
                                  {participant.duration ? `${participant.duration} min` : 'N/A'}
                                </td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${participant.status === 'attended' ? 'bg-green-500/20 text-green-400 border-green-500/30' : participant.status === 'left-early' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                    {participant.status === 'attended' && <FiUserCheck />}
                                    {participant.status === 'left-early' && <FiUserX />}
                                    {participant.status === 'no-show' && <FiUser />}
                                    {participant.status || 'unknown'}
                                  </span>
                                </td>
                              </tr>)}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div> : <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FiUsers className="text-slate-400 text-2xl" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Participants Yet</h3>
                    <p className="text-slate-400">
                      This meeting hasn&apos;t started yet or no participants have joined.
                    </p>
                  </div>}
              </div>
            </div>
          </div>}
      </div>
    </div>;
}
