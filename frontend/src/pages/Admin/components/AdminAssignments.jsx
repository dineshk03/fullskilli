import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiFileText, FiUsers, FiCheckCircle, FiClock, FiTrendingUp, FiBook, FiMail, FiEye } from 'react-icons/fi';
import { apiConnector } from '../../../services/apiConnector';
import { courseEndpoints, assignmentEndpoints } from '../../../services/apis';
import AssignmentDetailModal from '../../../components/core/Dashboard/AssignmentDetailModal';
import ViewSubmissions from '../../../components/core/Dashboard/ViewSubmissions';
import toast from 'react-hot-toast';
export default function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [submissionsAssignmentId, setSubmissionsAssignmentId] = useState(null);
  const {
    token
  } = useSelector(state => state.auth);
  useNavigate();
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all courses
      const coursesResponse = await apiConnector('GET', courseEndpoints.GET_ALL_COURSE_API, null, {
        Authorization: `Bearer ${token}`
      });
      if (coursesResponse.data.success) {
        setCourses(coursesResponse.data.data || []);

        // Fetch assignments for each course
        const allAssignments = [];
        for (const course of coursesResponse.data.data || []) {
          try {
            `/api/v1/assignments/course/${course._id}`;
            const response = await apiConnector('GET', assignmentEndpoints.GET_COURSE_ASSIGNMENTS_API.replace(':courseId', course._id), null, {
              Authorization: `Bearer ${token}`
            });
            if (response.data.success) {
              const assignmentsWithCourse = response.data.data.map(a => ({
                ...a,
                courseName: course.courseName,
                courseId: course._id
              }));
              allAssignments.push(...assignmentsWithCourse);
            }
          } catch (error) {
            console.error(`Error fetching assignments for course ${course._id}:`, error);
          }
        }
        setAssignments(allAssignments);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const filteredAssignments = selectedCourse === 'all' ? assignments : assignments.filter(a => a.courseId === selectedCourse);
  const stats = {
    total: assignments.length,
    published: assignments.filter(a => a.published).length,
    totalSubmissions: assignments.reduce((sum, a) => sum + (a.totalSubmissions || 0), 0),
    emailsSent: assignments.filter(a => a.emailSent).length,
    averageGrade: assignments.length > 0 ? (assignments.reduce((sum, a) => sum + (a.averageGrade || 0), 0) / assignments.length).toFixed(1) : 0
  };
  if (loading) {
    return <div className="min-h-screen bg-richblack-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white font-medium">Loading assignments...</p>
                </div>
            </div>;
  }
  return <div className="p-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-600/20 via-rose-600/20 to-red-600/20 rounded-3xl p-8 mb-8 border border-slate-600/50">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                            Assignment Management
                        </h1>
                        <p className="text-slate-400 mt-2">System-wide assignment analytics and overview</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-3xl font-bold text-white">{stats.total}</div>
                            <div className="text-slate-400 text-sm">Total Assignments</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div className="bg-richblack-800 rounded-2xl p-6 border border-slate-600/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <FiFileText className="text-blue-400 text-xl" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats.total}</div>
                    <div className="text-slate-400 text-sm">Total Assignments</div>
                </div>

                <div className="bg-richblack-800 rounded-2xl p-6 border border-slate-600/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <FiCheckCircle className="text-green-400 text-xl" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-green-400 mb-1">{stats.published}</div>
                    <div className="text-slate-400 text-sm">Published</div>
                </div>

                <div className="bg-richblack-800 rounded-2xl p-6 border border-slate-600/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                            <FiUsers className="text-purple-400 text-xl" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-purple-400 mb-1">{stats.totalSubmissions}</div>
                    <div className="text-slate-400 text-sm">Total Submissions</div>
                </div>

                <div className="bg-richblack-800 rounded-2xl p-6 border border-slate-600/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                            <FiMail className="text-pink-400 text-xl" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-pink-400 mb-1">{stats.emailsSent}</div>
                    <div className="text-slate-400 text-sm">Emails Sent</div>
                </div>

                <div className="bg-richblack-800 rounded-2xl p-6 border border-slate-600/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                            <FiTrendingUp className="text-yellow-400 text-xl" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-yellow-400 mb-1">{stats.averageGrade}%</div>
                    <div className="text-slate-400 text-sm">Avg Grade</div>
                </div>
            </div>

            {/* Course Filter */}
            <div className="mb-6">
                <label className="text-white font-medium mb-3 block">Filter by Course</label>
                <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="w-full md:w-96 px-4 py-3 bg-richblack-800 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-pink-500 transition-all duration-300">
                    <option value="all">All Courses ({assignments.length})</option>
                    {courses.map(course => <option key={course._id} value={course._id}>
                            {course.courseName} ({assignments.filter(a => a.courseId === course._id).length})
                        </option>)}
                </select>
            </div>

            {/* Assignments Table */}
            {filteredAssignments.length === 0 ? <div className="bg-richblack-800 rounded-3xl p-12 text-center border border-slate-600/50">
                    <div className="w-24 h-24 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FiFileText className="text-4xl text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">No Assignments Found</h3>
                    <p className="text-slate-400">
                        {selectedCourse === 'all' ? 'No assignments have been created yet.' : 'No assignments found for the selected course.'}
                    </p>
                </div> : <div className="bg-richblack-800 rounded-2xl border border-slate-600/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-richblack-700">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Assignment</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Course</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Instructor</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Due Date</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Points</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Submissions</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Email</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {filteredAssignments.map(assignment => <tr key={assignment._id} className="hover:bg-richblack-700/50 transition-colors duration-200 cursor-pointer" onClick={() => {
              console.log('Admin assignment clicked:', assignment);
              setSelectedAssignmentId(assignment._id);
            }}>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{assignment.title}</div>
                                            <div className="text-sm text-slate-400 line-clamp-1">{assignment.description}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <FiBook className="text-blue-400" />
                                                <span className="text-sm">{assignment.courseName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-300">
                                                {assignment.instructor?.firstName} {assignment.instructor?.lastName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-300">
                                                {new Date(assignment.dueDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-white">{assignment.totalPoints}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm font-medium text-purple-400">
                                                    {assignment.totalSubmissions || 0}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    ({assignment.gradedSubmissions || 0} graded)
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {assignment.published ? <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30">
                                                    Published
                                                </span> : <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium border border-gray-500/30">
                                                    Draft
                                                </span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {assignment.emailSent ? <div className="flex items-center gap-2">
                                                    <FiMail className="text-green-400" />
                                                    <span className="text-xs text-green-400">Sent</span>
                                                </div> : <div className="flex items-center gap-2">
                                                    <FiClock className="text-gray-400" />
                                                    <span className="text-xs text-gray-400">Pending</span>
                                                </div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button type="button" onClick={e => {
                  e.stopPropagation();
                  setSubmissionsAssignmentId(assignment._id);
                }} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all duration-200" title="View submitted assignments">
                                                <FiEye />
                                                <span className="text-sm font-medium">View</span>
                                            </button>
                                        </td>
                                    </tr>)}
                            </tbody>
                        </table>
                    </div>
                </div>}

            {submissionsAssignmentId && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-richblack-900 border border-richblack-700 rounded-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden shadow-2xl">
                        <div className="overflow-y-auto max-h-[92vh]">
                            <ViewSubmissions assignmentIdProp={submissionsAssignmentId} inModal={true} onClose={() => setSubmissionsAssignmentId(null)} />
                        </div>
                    </div>
                </div>}

            <AssignmentDetailModal assignmentId={selectedAssignmentId} onClose={() => setSelectedAssignmentId(null)} />
        </div>;
}
