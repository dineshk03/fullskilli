import { useState, useEffect, useCallback } from "react";
import { FiVideo, FiPlus, FiEdit, FiTrash2, FiCalendar, FiClock, FiUsers, FiExternalLink } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { apiConnector } from "../../../services/apiConnector";
import { zoomEndpoints, courseEndpoints } from "../../../services/apis";
const {
  GET_INSTRUCTOR_ZOOM_MEETINGS_API,
  CREATE_ZOOM_MEETING_API,
  UPDATE_ZOOM_MEETING_API,
  DELETE_ZOOM_MEETING_API
} = zoomEndpoints;
export default function InstructorZoomDashboard() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const {
    token
  } = useSelector(state => state.auth);

  // Form state
  const [formData, setFormData] = useState({
    subSectionId: '',
    title: '',
    description: '',
    startTime: '',
    duration: 60,
    timezone: 'UTC'
  });

  // Fetch instructor's courses
  const fetchCourses = useCallback(async () => {
    try {
      setLoadingCourses(true);
      const response = await apiConnector("GET", courseEndpoints.GET_ALL_INSTRUCTOR_COURSES_API, null, {
        Authorization: `Bearer ${token}`
      });
      if (response.data.success) {
        setCourses(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoadingCourses(false);
    }
  }, [token]);

  // Fetch instructor's meetings
  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiConnector("GET", GET_INSTRUCTOR_ZOOM_MEETINGS_API, null, {
        Authorization: `Bearer ${token}`
      });
      if (response.data.success) {
        setMeetings(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    if (token) {
      fetchMeetings();
    }
  }, [fetchMeetings, token]);

  // Fetch courses when modal opens
  useEffect(() => {
    if (showCreateModal && !editingMeeting) {
      fetchCourses();
    }
  }, [showCreateModal, editingMeeting, fetchCourses]);

  // Handle form submission
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const url = editingMeeting ? UPDATE_ZOOM_MEETING_API.replace(':subSectionId', editingMeeting.subSectionId) : CREATE_ZOOM_MEETING_API;
      const method = editingMeeting ? "PATCH" : "POST";
      const response = await apiConnector(method, url, formData, {
        Authorization: `Bearer ${token}`
      });
      if (response.data.success) {
        toast.success(editingMeeting ? "Meeting updated successfully!" : "Meeting created successfully!");
        setShowCreateModal(false);
        setEditingMeeting(null);
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
      console.error("Error saving meeting:", error);
      toast.error(error.response?.data?.message || "Failed to save meeting");
    }
  };

  // Handle delete meeting
  const handleDelete = async subSectionId => {
    if (!window.confirm("Are you sure you want to delete this meeting?")) return;
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

  // Handle edit meeting
  const handleEdit = meeting => {
    setEditingMeeting(meeting);
    setFormData({
      subSectionId: meeting.subSectionId,
      title: meeting.meeting.topic,
      description: meeting.meeting.agenda || '',
      startTime: new Date(meeting.meeting.startTime).toISOString().slice(0, 16),
      duration: meeting.meeting.duration,
      timezone: meeting.meeting.timezone || 'UTC'
    });
    setShowCreateModal(true);
  };
  const formatDateTime = dateString => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const getMeetingStatus = (startTime, duration) => {
    const now = new Date();
    const meetingStart = new Date(startTime);
    const meetingEnd = new Date(meetingStart.getTime() + duration * 60000);
    if (now < meetingStart) return 'upcoming';
    if (now >= meetingStart && now <= meetingEnd) return 'live';
    return 'ended';
  };
  const getStatusColor = status => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'live':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'ended':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white font-medium">Loading your meetings...</p>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 rounded-3xl p-8 mb-8 border border-slate-600/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FiVideo className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Zoom Meetings Dashboard
                </h1>
                <p className="text-slate-400 mt-1">Manage your live lecture sessions</p>
              </div>
            </div>
            <button onClick={() => {
            setEditingMeeting(null);
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
          </div>
        </div>

        {/* Meetings Grid */}
        {meetings.length === 0 ? <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl p-12 text-center border border-slate-600/50">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FiVideo className="text-4xl text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">No Meetings Scheduled</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Get started by scheduling your first Zoom meeting for your lectures.
            </p>
            <button onClick={() => setShowCreateModal(true)} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform">
              Schedule Your First Meeting
            </button>
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meetings.map(meeting => {
          const status = getMeetingStatus(meeting.meeting.startTime, meeting.meeting.duration);
          const statusColor = getStatusColor(status);
          return <div key={meeting.subSectionId} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-slate-600/50 backdrop-blur-sm hover:border-slate-500/50 transition-all duration-300">
                  {/* Meeting Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <FiVideo className="text-white text-xl" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white truncate">
                          {meeting.meeting.topic}
                        </h3>
                        <p className="text-sm text-slate-400">{meeting.courseTitle}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                      {status.toUpperCase()}
                    </div>
                  </div>

                  {/* Meeting Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-slate-300">
                      <FiCalendar className="text-blue-400" />
                      <span className="text-sm">{formatDateTime(meeting.meeting.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <FiClock className="text-green-400" />
                      <span className="text-sm">{meeting.meeting.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <FiUsers className="text-purple-400" />
                      <span className="text-sm">{meeting.subSectionTitle}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button onClick={() => window.open(meeting.meeting.startUrl, '_blank')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm rounded-lg transition-all duration-300">
                      <FiExternalLink />
                      <span>Start</span>
                    </button>
                    <button onClick={() => handleEdit(meeting)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                      <FiEdit />
                    </button>
                    <button onClick={() => handleDelete(meeting.subSectionId)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>;
        })}
          </div>}

        {/* Create/Edit Meeting Modal */}
        {showCreateModal && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-2xl w-full border border-slate-600/50">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select Lecture
                  </label>
                  {loadingCourses ? <div className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-400 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-blue-500 rounded-full animate-spin"></div>
                      Loading your courses...
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
                  <button type="button" onClick={() => {
                setShowCreateModal(false);
                setEditingMeeting(null);
              }} className="flex-1 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300">
                    {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
                  </button>
                </div>
              </form>
            </div>
          </div>}
      </div>
    </div>;
}
