import { useState, useEffect, useCallback } from 'react';
import { FaUsers, FaClock, FaChartBar, FaSync, FaCalendarAlt, FaUserCheck, FaGraduationCap, FaVideo } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
const AdminZoomAttendance = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [courseAttendance, setCourseAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Helper function to check if meeting has started
  const hasMeetingStarted = useCallback(() => {
    if (!selectedMeeting) return false;
    const selectedMeetingData = meetings.find(m => String(m.zoomMeeting?.meetingId) === String(selectedMeeting));
    if (!selectedMeetingData?.zoomMeeting) return false;

    // Check if meeting is live, ended, or has started
    const meetingStatus = selectedMeetingData.zoomMeeting.status;
    if (meetingStatus === 'live' || meetingStatus === 'ended') {
      return true;
    }

    // For scheduled meetings, check start time
    if (selectedMeetingData.zoomMeeting.startTime) {
      const meetingStartTime = new Date(selectedMeetingData.zoomMeeting.startTime);
      const currentTime = new Date();
      return meetingStartTime <= currentTime;
    }
    return false;
  }, [meetings, selectedMeeting]);
  useEffect(() => {
    fetchAllCourses();
  }, []);
  const fetchCourseAttendance = useCallback(async () => {
    // Only fetch data if a meeting has started
    if (!hasMeetingStarted()) {
      setCourseAttendance(null);
      return;
    }
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
  }, [hasMeetingStarted, selectedCourse]);
  const fetchMeetings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching meetings for course:', selectedCourse);
      const response = await fetch('/api/v1/zoom/admin/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Found meetings:', data.data?.length, 'total meetings');
        const courseMeetings = data.data.filter(meeting => meeting.courseId === selectedCourse);
        console.log('Filtered meetings for course:', courseMeetings?.length, 'meetings');
        setMeetings(courseMeetings);
      } else {
        const errorText = await response.text();
        console.error('Error fetching meetings:', errorText);
        toast.error('Failed to fetch meetings');
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

  // Clear selected meeting if it doesn't exist in the meetings array
  useEffect(() => {
    if (selectedMeeting && meetings.length > 0) {
      const meetingExists = meetings.some(m => String(m.zoomMeeting?.meetingId) === String(selectedMeeting));
      if (!meetingExists) {
        setSelectedMeeting('');
        setAttendanceData(null);
        // Only show notification if user had actually selected this meeting (not just initial load)
        if (selectedMeeting !== '') {
          console.log('Selected meeting is no longer available, clearing selection');
        }
      }
    }
  }, [meetings, selectedMeeting]);
  const fetchMeetingAttendance = useCallback(async () => {
    // Only fetch data if a meeting has started
    if (!hasMeetingStarted()) {
      setAttendanceData(null);
      return;
    }
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
      } else {
        setAttendanceData(null);
      }
    } catch (error) {
      console.error('Error fetching meeting attendance:', error);
      setAttendanceData(null);
    } finally {
      setLoading(false);
    }
  }, [hasMeetingStarted, selectedMeeting]);
  useEffect(() => {
    if (selectedMeeting) {
      fetchMeetingAttendance();
      fetchCourseAttendance(); // Also refetch course attendance when meeting changes
    }
  }, [selectedMeeting, meetings, fetchMeetingAttendance, fetchCourseAttendance]); // Add meetings to dependency array

  const fetchAllCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching all courses for admin...');
      const response = await fetch('/api/v1/course/getAllCourses', {
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

    // Check if the selected meeting exists in the meetings array
    const meetingExists = meetings.some(m => m.zoomMeeting?.meetingId === selectedMeeting);
    if (!meetingExists) {
      toast.error('Selected meeting not found. Please refresh the page and try again.');
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
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Sync error response:', errorData);
        toast.error(errorData.message || 'Failed to sync attendance');
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
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 rounded-full">
                <span className="text-white text-sm font-semibold">Admin Dashboard</span>
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
            <div className="flex items-center">
              <button onClick={syncAttendance} disabled={loading || !selectedMeeting} className="group relative px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative flex items-center gap-2">
                  <FaSync className={`${loading ? 'animate-spin' : ''} group-hover:rotate-180 transition-transform duration-500`} />
                  {loading ? 'Syncing...' : 'Sync Attendance'}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Professional Tabs */}
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
              icon: FaUserCheck,
              gradient: 'from-green-600 to-emerald-600',
              bgLight: 'from-green-500/20 to-emerald-500/20'
            }, {
              label: 'Perfect Attendance',
              value: courseAttendance.attendanceRecords?.filter(student => student.attendancePercentage === 100).length || 0,
              icon: FaChartBar,
              gradient: 'from-orange-600 to-red-600',
              bgLight: 'from-orange-500/20 to-red-500/20'
            }].map((stat, index) => <div key={index} className="group relative">
                    <div className={`absolute inset-0 bg-gradient-to-r ${stat.bgLight} rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300`}></div>
                    <div className={`relative bg-gradient-to-r ${stat.gradient} rounded-2xl p-6 text-white shadow-xl`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/80 text-sm font-medium mb-1">{stat.label}</p>
                          <p className="text-3xl font-bold">{stat.value}</p>
                        </div>
                        <div className="bg-white/20 rounded-xl p-3">
                          <stat.icon className="text-2xl" />
                        </div>
                      </div>
                    </div>
                  </div>)}
              </div>

              {/* Attendance Distribution */}
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <FaChartBar className="mr-3 text-purple-400" />
                  Attendance Distribution Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[{
                range: 'Excellent (80-100%)',
                color: 'from-green-500 to-emerald-500',
                bgLight: 'from-green-500/20 to-emerald-500/20'
              }, {
                range: 'Good (60-79%)',
                color: 'from-yellow-500 to-orange-500',
                bgLight: 'from-yellow-500/20 to-orange-500/20'
              }, {
                range: 'Poor (0-59%)',
                color: 'from-red-500 to-pink-500',
                bgLight: 'from-red-500/20 to-pink-500/20'
              }].map((item, index) => {
                const [min, max] = item.range.match(/\d+/g);
                const count = courseAttendance.attendanceRecords?.filter(student => {
                  const percentage = student.attendancePercentage || 0;
                  return percentage >= parseInt(min) && percentage <= parseInt(max);
                }).length || 0;
                const percentages = courseAttendance.attendanceRecords?.length > 0 ? Math.round(count / courseAttendance.attendanceRecords.length * 100) : 0;
                return <div key={index} className="group">
                        <div className={`bg-gradient-to-r ${item.bgLight} rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300`}>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-white font-semibold">{item.range}</span>
                            <span className="text-2xl font-bold text-white">{count}</span>
                          </div>
                          <div className="relative">
                            <div className="w-full bg-white/10 rounded-full h-3">
                              <div className={`bg-gradient-to-r ${item.color} h-3 rounded-full transition-all duration-500`} style={{
                          width: `${percentages}%`
                        }}></div>
                            </div>
                            <span className="text-white/70 text-sm mt-2">{percentages}% of total students</span>
                          </div>
                        </div>
                      </div>;
              })}
                </div>
              </div>
            </div>}

          {/* Meeting Details Tab */}
          {activeTab === 'meeting' && selectedMeeting && attendanceData && <div className="space-y-8">
              {/* Meeting Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[{
              label: 'Total Participants',
              value: attendanceData.totalParticipants || 0,
              icon: FaUsers,
              gradient: 'from-blue-600 to-cyan-600'
            }, {
              label: 'Enrolled Students',
              value: attendanceData.enrolledStudents || 0,
              icon: FaUserCheck,
              gradient: 'from-green-600 to-emerald-600'
            }, {
              label: 'Avg Duration',
              value: formatDuration(Math.round(attendanceData.averageDuration || 0)),
              icon: FaClock,
              gradient: 'from-purple-600 to-pink-600'
            }, {
              label: 'Completion Rate',
              value: `${attendanceData.totalParticipants > 0 ? Math.round(attendanceData.attendanceRecords?.filter(r => r.status === 'completed').length / attendanceData.totalParticipants * 100) : 0}%`,
              icon: FaChartBar,
              gradient: 'from-orange-600 to-red-600'
            }].map((stat, index) => <div key={index} className="group">
                    <div className={`bg-gradient-to-r ${stat.gradient} rounded-2xl p-6 text-white shadow-xl transform transition-all duration-300 hover:scale-105`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/80 text-sm font-medium mb-1">{stat.label}</p>
                          <p className="text-2xl font-bold">{stat.value}</p>
                        </div>
                        <div className="bg-white/20 rounded-xl p-3">
                          <stat.icon className="text-xl" />
                        </div>
                      </div>
                    </div>
                  </div>)}
              </div>

              {/* Participants Table */}
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <FaUsers className="mr-3 text-blue-400" />
                    Meeting Participants
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Participant</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Join Time</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {attendanceData.attendanceRecords?.map((record, index) => <tr key={index} className="hover:bg-white/5 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${record.userId ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-gray-500 to-slate-500'}`}>
                                  <span className="text-sm font-bold text-white">
                                    {record.participantName?.charAt(0).toUpperCase() || 'U'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white">
                                  {record.participantName || 'Unknown'}
                                </div>
                                <div className={`text-xs ${record.userId ? 'text-green-400' : 'text-gray-400'}`}>
                                  {record.userId ? 'Enrolled Student' : 'External Participant'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {record.participantEmail || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {record.joinTime ? new Date(record.joinTime).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {formatDuration(record.duration || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${record.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : record.status === 'joined' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'}`}>
                              {record.status || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${record.userId ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'}`}>
                              {record.userId ? 'Student' : 'Guest'}
                            </span>
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>}

          {/* Course Analytics Tab */}
          {activeTab === 'course' && selectedCourse && selectedMeeting && courseAttendance && <div className="space-y-8">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <FaUsers className="mr-3 text-purple-400" />
                    Student Performance Analytics
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Attended/Total</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Attendance %</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Duration</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Performance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {courseAttendance.attendanceRecords?.sort((a, b) => (b.attendancePercentage || 0) - (a.attendancePercentage || 0)).map((student, index) => <tr key={index} className="hover:bg-white/5 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                  <span className="text-sm font-bold text-white">
                                    {student.name?.charAt(0).toUpperCase() || 'S'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white">
                                  {student.name || 'Unknown Student'}
                                </div>
                                {student.isEnrolledStudent && <div className="text-xs text-green-400">Enrolled Student</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {student.email || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {student.attendedMeetings || 0}/{student.totalMeetings || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${(student.attendancePercentage || 0) >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : (student.attendancePercentage || 0) >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'}`}>
                              {student.attendancePercentage || 0}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {formatDuration(student.totalDuration || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-2">
                              {index === 0 && <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                                  🏆 Top Performer
                                </span>}
                              {(student.attendancePercentage || 0) === 100 && <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                                  ✅ Perfect Attendance
                                </span>}
                              {(student.attendancePercentage || 0) < 60 && <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white">
                                  ⚠️ At Risk
                                </span>}
                            </div>
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>}

          {/* Empty States for Each Tab */}
          {!loading && activeTab === 'overview' && (!selectedCourse || !selectedMeeting || !hasMeetingStarted()) && <div className="text-center py-20">
              <FaGraduationCap className="text-6xl text-gray-500 mb-6 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                {!selectedCourse ? 'No Course Selected' : !selectedMeeting ? 'No Meeting Selected' : 'Meeting Not Started'}
              </h3>
              <p className="text-gray-500">
                {!selectedCourse ? 'Please select a course from the dropdown above to view attendance analytics.' : !selectedMeeting ? 'Please select a specific meeting to view detailed attendance analytics.' : 'The selected meeting has not started yet. Attendance data will be available once the meeting begins.'}
              </p>
            </div>}

          {!loading && activeTab === 'meeting' && (!selectedMeeting || !hasMeetingStarted()) && <div className="text-center py-20">
              <FaVideo className="text-6xl text-gray-500 mb-6 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                {!selectedMeeting ? 'No Meeting Selected' : 'Meeting Not Started'}
              </h3>
              <p className="text-gray-500">
                {!selectedMeeting ? 'Please select a course and then a specific meeting to view detailed attendance information.' : 'The selected meeting has not started yet. Attendance data will be available once the meeting begins.'}
              </p>
            </div>}

          {!loading && activeTab === 'course' && (!selectedCourse || !selectedMeeting || !hasMeetingStarted()) && <div className="text-center py-20">
              <FaUsers className="text-6xl text-gray-500 mb-6 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                {!selectedCourse ? 'No Course Selected' : !selectedMeeting ? 'No Meeting Selected' : 'Meeting Not Started'}
              </h3>
              <p className="text-gray-500">
                {!selectedCourse ? 'Please select a course from the dropdown above to view student performance analytics.' : !selectedMeeting ? 'Please select a specific meeting to view filtered student performance analytics.' : 'The selected meeting has not started yet. Attendance data will be available once the meeting begins.'}
              </p>
            </div>}

          {/* Loading State */}
          {loading && <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
                <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-purple-500 border-b-transparent animate-spin animation-delay-150"></div>
              </div>
              <p className="mt-4 text-white font-medium">Loading attendance data...</p>
            </div>}

          {/* Empty State */}
          {!loading && !attendanceData && !courseAttendance && <div className="text-center py-20">
              <div className="relative inline-block">
                <FaUsers className="text-6xl text-gray-500 mb-6" />
                <div className="absolute inset-0 blur-xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-20"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">No Attendance Data Available</h3>
              <p className="text-gray-400 text-lg mb-8">Select a course and meeting to view comprehensive attendance reports</p>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 inline-flex px-6 py-3 rounded-xl">
                <span className="text-white font-medium">Get Started by Selecting a Course</span>
              </div>
            </div>}
        </div>
      </div>
    </div>;
};
export default AdminZoomAttendance;
