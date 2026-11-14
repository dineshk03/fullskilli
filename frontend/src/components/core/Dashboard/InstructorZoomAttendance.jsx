import { useState, useEffect, useCallback } from 'react';
import { FaUsers, FaClock, FaChartBar, FaSync, FaCalendarAlt, FaUserCheck, FaGraduationCap, FaVideo } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
const InstructorZoomAttendance = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [courseAttendance, setCourseAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Helper function to check if meeting has started

  useEffect(() => {
    fetchCourses();
  }, []);
  const fetchCourseAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/zoom-attendance/course/${selectedCourse}/attendance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCourseAttendance(data.data);
      }
    } catch (error) {
      console.error('Error fetching course attendance:', error);
      toast.error('Failed to fetch course attendance');
    } finally {
      setLoading(false);
    }
  }, [selectedCourse]);
  const fetchMeetings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/zoom/instructor/meetings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const courseMeetings = data.data.filter(meeting => meeting.courseId === selectedCourse);
        setMeetings(courseMeetings);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to fetch meetings');
    }
  }, [selectedCourse]);
  useEffect(() => {
    if (selectedCourse) {
      fetchMeetings();
      fetchCourseAttendance();
    }
  }, [fetchCourseAttendance, fetchMeetings, selectedCourse]);
  const fetchMeetingAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/zoom-attendance/meeting/${selectedMeeting}/attendance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data.data);
      }
    } catch (error) {
      console.error('Error fetching meeting attendance:', error);
      toast.error('Failed to fetch meeting attendance');
    } finally {
      setLoading(false);
    }
  }, [selectedMeeting]);
  useEffect(() => {
    if (selectedMeeting) {
      fetchMeetingAttendance();
    }
  }, [fetchMeetingAttendance, selectedMeeting]);
  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching instructor courses...');
      const response = await fetch('/api/v1/course/getInstructorCoursesForInstructor', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Courses loaded successfully:', data.data?.length, 'courses');
        setCourses(data.data || []);
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        toast.error('Failed to fetch courses');

        // Fallback: Try all courses endpoint
        console.log('Trying fallback to getAllCourses...');
        try {
          const fallbackResponse = await fetch('/api/v1/course/getAllCourses', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            console.log('Fallback courses data:', fallbackData);
            setCourses(fallbackData.data || []);
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
    }
  };
  const syncAttendance = async () => {
    if (!selectedMeeting) {
      toast.error('Please select a meeting first');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/zoom-attendance/meeting/${selectedMeeting}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchMeetingAttendance();
        fetchCourseAttendance();
      }
    } catch (error) {
      console.error('Error syncing attendance:', error);
      toast.error('Failed to sync attendance');
    } finally {
      setLoading(false);
    }
  };
  const formatDuration = minutes => {
    if (!minutes) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-20" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
    }}></div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Professional Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                Zoom Attendance Analytics
              </h1>
              <p className="text-gray-400 text-lg">Comprehensive meeting attendance tracking and analysis platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-green-600 to-teal-600 px-4 py-2 rounded-full">
                <span className="text-white text-sm font-semibold">Instructor Dashboard</span>
              </div>
            </div>
          </div>
        </div>

          {/* Action Bar */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Filters Container */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Course Selector */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center">
                  <FaGraduationCap className="mr-2 text-blue-400" />
                  Course Selection
                </label>
                <div className="relative">
                  <select value={selectedCourse} onChange={e => {
                  setSelectedCourse(e.target.value);
                  setSelectedMeeting('');
                  setAttendanceData(null);
                  setCourseAttendance(null);
                }} className="w-full px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 appearance-none cursor-pointer hover:border-blue-400 shadow-lg">
                    <option value="" style={{
                    backgroundColor: '#1f2937',
                    color: '#d1d5db'
                  }}>Select a course...</option>
                    {courses.map(course => <option key={course._id} value={course._id} style={{
                    backgroundColor: '#1f2937',
                    color: '#ffffff'
                  }}>
                        {course.courseName}
                  </option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Meeting Selector */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center">
                  <FaVideo className="mr-2 text-purple-400" />
                  Meeting Selection
                </label>
                <div className="relative">
                  <select value={selectedMeeting} onChange={e => setSelectedMeeting(e.target.value)} disabled={!selectedCourse} className="w-full px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-purple-400 shadow-lg">
                    <option value="" style={{
                    backgroundColor: '#1f2937',
                    color: '#d1d5db'
                  }}>Choose a meeting...</option>
                    {meetings.map(meeting => <option key={meeting._id} value={meeting.zoomMeeting?.meetingId} style={{
                    backgroundColor: '#1f2937',
                    color: '#ffffff'
                  }}>
                        {meeting.title} - {new Date(meeting.zoomMeeting?.startTime).toLocaleDateString()}
                      </option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Sync Button */}
            <div className="flex items-end">
              <button onClick={syncAttendance} disabled={!selectedMeeting || loading} className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg transform hover:scale-105">
                <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Sync Attendance
              </button>
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-2 mb-8 border border-white/20">
          <nav className="flex space-x-2">
            {[{
            id: 'overview',
            label: 'Platform Overview',
            icon: FaChartBar
          }, {
            id: 'meeting',
            label: 'Meeting Details',
            icon: FaVideo
          }, {
            id: 'course',
            label: 'Course Analytics',
            icon: FaUsers
          }].map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${activeTab === tab.id ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                <tab.icon className="text-lg" />
                <span>{tab.label}</span>
              </button>)}
          </nav>
        </div>

        {/* Main Content Container */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          {/* Platform Overview Tab */}
          {activeTab === 'overview' && selectedCourse && selectedMeeting && courseAttendance && <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[{
              label: 'Total Students',
              value: courseAttendance.enrolledStudents || 0,
              icon: FaUsers,
              gradient: 'from-blue-600 to-cyan-600',
              bgLight: 'from-blue-500/20 to-cyan-500/20'
            }, {
              label: 'Total Meetings',
              value: courseAttendance.totalMeetings || 0,
              icon: FaCalendarAlt,
              gradient: 'from-purple-600 to-pink-600',
              bgLight: 'from-purple-500/20 to-pink-500/20'
            }, {
              label: 'Avg Attendance',
              value: `${courseAttendance.attendanceRecords?.length > 0 ? Math.round(courseAttendance.attendanceRecords.reduce((sum, student) => sum + (student.attendancePercentage || 0), 0) / courseAttendance.attendanceRecords.length) : 0}%`,
              icon: FaChartBar,
              gradient: 'from-green-600 to-teal-600',
              bgLight: 'from-green-500/20 to-teal-500/20'
            }, {
              label: 'Active Students',
              value: courseAttendance.attendanceRecords?.filter(student => (student.attendancePercentage || 0) > 0).length || 0,
              icon: FaUserCheck,
              gradient: 'from-orange-600 to-red-600',
              bgLight: 'from-orange-500/20 to-red-500/20'
            }].map((stat, index) => <div key={index} className="relative group">
                    <div className={`absolute inset-0 bg-gradient-to-r ${stat.bgLight} rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300`}></div>
                    <div className={`relative bg-gradient-to-r ${stat.gradient} rounded-2xl p-6 shadow-xl transform hover:scale-105 transition-all duration-300`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/80 text-sm font-medium mb-1">{stat.label}</p>
                          <p className="text-white text-3xl font-bold">{stat.value}</p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-xl">
                          <stat.icon className="text-white text-xl" />
                        </div>
                      </div>
                    </div>
                  </div>)}
              </div>
            </div>}

          {/* Meeting Details Tab */}
          {activeTab === 'meeting' && attendanceData && <div className="space-y-8">
              {/* Meeting Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium mb-1">Total Participants</p>
                      <p className="text-white text-3xl font-bold">{attendanceData.totalParticipants}</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl">
                      <FaUsers className="text-white text-xl" />
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium mb-1">Enrolled Students</p>
                      <p className="text-white text-3xl font-bold">{attendanceData.enrolledStudents}</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl">
                      <FaUserCheck className="text-white text-xl" />
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium mb-1">Avg Duration</p>
                      <p className="text-white text-3xl font-bold">{formatDuration(attendanceData.averageDuration)}</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl">
                      <FaClock className="text-white text-xl" />
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium mb-1">Attendance Rate</p>
                      <p className="text-white text-3xl font-bold">{attendanceData.attendanceRate}%</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl">
                      <FaChartBar className="text-white text-xl" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20">
                <div className="px-8 py-6 border-b border-white/20">
                  <h3 className="text-xl font-semibold text-white">Attendance Records</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-300">Participant</th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-300">Join Time</th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-300">Duration</th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {attendanceData.attendanceRecords?.map((record, index) => <tr key={index} className="hover:bg-white/5 transition-colors">
                          <td className="px-8 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                  <span className="text-sm font-medium text-white">
                                    {record.participantName?.charAt(0).toUpperCase() || 'U'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white">
                                  {record.participantName || 'Unknown'}
                                </div>
                                {record.userId && <div className="text-xs text-green-400">Enrolled Student</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-4 text-sm text-gray-300">{record.email || 'N/A'}</td>
                          <td className="px-8 py-4 text-sm text-gray-300">
                            {record.joinTime ? new Date(record.joinTime).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-8 py-4 text-sm text-gray-300">
                            {formatDuration(record.duration)}
                          </td>
                          <td className="px-8 py-4">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${record.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                              {record.status || 'Unknown'}
                            </span>
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>}

          {/* Course Analytics Tab */}
          {activeTab === 'course' && courseAttendance && <div className="space-y-8">
              <div className="text-center py-12">
                <FaChartBar className="text-6xl text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Course Analytics</h3>
                <p className="text-gray-400">Detailed course-level attendance analytics coming soon</p>
              </div>
            </div>}

          {/* No Data State */}
          {(!selectedCourse || !selectedMeeting) && <div className="text-center py-12">
              <FaVideo className="text-6xl text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">Select Course and Meeting</h3>
              <p className="text-gray-400">Please select a course and meeting to view attendance analytics</p>
            </div>}
        </div>
      </div>
    </div>;
};
export default InstructorZoomAttendance;
