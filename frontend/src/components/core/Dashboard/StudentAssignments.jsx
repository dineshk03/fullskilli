import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiBook, FiCalendar, FiClock, FiCheckCircle, FiAlertCircle, FiFileText } from 'react-icons/fi';
import { apiConnector } from '../../../services/apiConnector';
import { assignmentEndpoints } from '../../../services/apis';
import AssignmentDetailModal from './AssignmentDetailModal';
import toast from 'react-hot-toast';
export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, submitted, graded
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const {
    token
  } = useSelector(state => state.auth);
  const {
    user
  } = useSelector(state => state.profile);
  const navigate = useNavigate();
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);

      // Get all enrolled courses
      const courses = user?.courses || [];

      // Fetch assignments for each course
      const allAssignments = [];
      for (const courseId of courses) {
        try {
          const response = await apiConnector('GET', assignmentEndpoints.GET_COURSE_ASSIGNMENTS_API.replace(':courseId', courseId), null, {
            Authorization: `Bearer ${token}`
          });
          if (response.data.success) {
            allAssignments.push(...response.data.data);
          }
        } catch (error) {
          console.error(`Error fetching assignments for course ${courseId}:`, error);
        }
      }
      console.log('All assignments loaded:', allAssignments);
      setAssignments(allAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [token, user?.courses]);
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);
  const getStatusBadge = assignment => {
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const status = assignment.submissionStatus || 'not-submitted';
    if (status === 'graded') {
      return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30 flex items-center gap-1">
                    <FiCheckCircle /> Graded
                </span>;
    }
    if (status === 'submitted') {
      return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium border border-blue-500/30 flex items-center gap-1">
                    <FiFileText /> Submitted
                </span>;
    }
    if (now > dueDate) {
      return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium border border-red-500/30 flex items-center gap-1">
                    <FiAlertCircle /> Overdue
                </span>;
    }
    return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium border border-yellow-500/30 flex items-center gap-1">
                <FiClock /> Pending
            </span>;
  };
  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !assignment.submissionStatus || assignment.submissionStatus === 'not-submitted';
    if (filter === 'submitted') return assignment.submissionStatus === 'submitted';
    if (filter === 'graded') return assignment.submissionStatus === 'graded';
    return true;
  });
  if (loading) {
    return <div className="min-h-screen bg-richblack-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white font-medium">Loading assignments...</p>
                </div>
            </div>;
  }
  return <div className="min-h-screen bg-richblack-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 rounded-3xl p-8 mb-8 border border-slate-600/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                My Assignments
                            </h1>
                            <p className="text-slate-400 mt-2">Track and submit your course assignments</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-white">{assignments.length}</div>
                            <div className="text-slate-400 text-sm">Total Assignments</div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-3 mb-6">
                    {['all', 'pending', 'submitted', 'graded'].map(f => <button key={f} onClick={() => setFilter(f)} className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${filter === f ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-richblack-800 text-slate-300 hover:bg-richblack-700'}`}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>)}
                </div>

                {/* Assignments Grid */}
                {filteredAssignments.length === 0 ? <div className="bg-richblack-800 rounded-3xl p-12 text-center border border-slate-600/50">
                        <div className="w-24 h-24 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <FiFileText className="text-4xl text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">No Assignments Found</h3>
                        <p className="text-slate-400">
                            {filter === 'all' ? 'No assignments have been posted yet.' : `No ${filter} assignments found.`}
                        </p>
                    </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAssignments.map(assignment => <div key={assignment._id} className="bg-richblack-800 rounded-2xl p-6 border border-slate-600/50 hover:border-slate-500/50 transition-all duration-300 cursor-pointer" onClick={() => {
          console.log('Assignment clicked:', assignment);
          console.log('Assignment ID:', assignment._id);
          setSelectedAssignmentId(assignment._id);
        }} style={{
          cursor: 'pointer'
        }}>
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                                        <FiBook className="text-white text-xl" />
                                    </div>
                                    {getStatusBadge(assignment)}
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                                    {assignment.title}
                                </h3>

                                {/* Course */}
                                <p className="text-sm text-slate-400 mb-4">
                                    {assignment.course?.courseName || 'Course'}
                                </p>

                                {/* Details */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                                        <FiCalendar className="text-blue-400" />
                                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                                        <FiCheckCircle className="text-green-400" />
                                        <span>{assignment.totalPoints} Points</span>
                                    </div>
                                </div>

                                {/* Grade (if graded) */}
                                {assignment.grade !== null && assignment.grade !== undefined && <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mt-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-400">
                                                {assignment.grade}/{assignment.totalPoints}
                                            </div>
                                            <div className="text-xs text-green-300">Your Grade</div>
                                        </div>
                                    </div>}

                                {/* Action Button */}
                                <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 font-medium" onClick={e => {
            e.stopPropagation();
            console.log('Button clicked for assignment:', assignment._id);
            if (assignment.submissionStatus === 'graded' || assignment.submissionStatus === 'submitted') {
              setSelectedAssignmentId(assignment._id);
              return;
            }
            navigate(`/dashboard/submit-assignment/${assignment._id}`);
          }}>
                                    {assignment.submissionStatus === 'graded' ? 'View Details' : assignment.submissionStatus === 'submitted' ? 'View Submission' : 'Submit Assignment'}
                                </button>
                            </div>)}
                    </div>}

                <AssignmentDetailModal assignmentId={selectedAssignmentId} onClose={() => setSelectedAssignmentId(null)} />
            </div>
        </div>;
}
