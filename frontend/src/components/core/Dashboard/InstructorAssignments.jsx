import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiUsers, FiCheckCircle } from 'react-icons/fi';
import { apiConnector } from '../../../services/apiConnector';
import { assignmentEndpoints } from '../../../services/apis';
import toast from 'react-hot-toast';
export default function InstructorAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const {
    token
  } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiConnector('GET', assignmentEndpoints.GET_INSTRUCTOR_ASSIGNMENTS_API, null, {
        Authorization: `Bearer ${token}`
      });
      if (response.data.success) {
        setAssignments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);
  const deleteAssignment = async assignmentId => {
    if (!window.confirm('Are you sure you want to delete this assignment? All submissions will be deleted.')) {
      return;
    }
    try {
      const response = await apiConnector('DELETE', assignmentEndpoints.DELETE_ASSIGNMENT_API.replace(':assignmentId', assignmentId), null, {
        Authorization: `Bearer ${token}`
      });
      if (response.data.success) {
        toast.success('Assignment deleted successfully');
        fetchAssignments();
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
    }
  };
  const togglePublish = async (assignmentId, currentStatus) => {
    try {
      const response = await apiConnector('POST', assignmentEndpoints.PUBLISH_ASSIGNMENT_API.replace(':assignmentId', assignmentId), {
        published: !currentStatus
      }, {
        Authorization: `Bearer ${token}`
      });
      if (response.data.success) {
        toast.success(`Assignment ${!currentStatus ? 'published' : 'unpublished'} successfully`);
        if (!currentStatus) {
          toast.success('Email notifications sent to students!', {
            duration: 4000
          });
        }
        fetchAssignments();
      }
    } catch (error) {
      console.error('Error toggling publish:', error);
      toast.error('Failed to update assignment');
    }
  };
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
                <div className="bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-indigo-600/20 rounded-3xl p-8 mb-8 border border-slate-600/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Manage Assignments
                            </h1>
                            <p className="text-slate-400 mt-2">Create and manage course assignments</p>
                        </div>
                        <button onClick={() => navigate('/dashboard/create-assignment')} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-300 flex items-center gap-2 shadow-lg">
                            <FiPlus /> Create Assignment
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-richblack-800 rounded-2xl p-6 border border-slate-600/50">
                        <div className="text-3xl font-bold text-white mb-2">{assignments.length}</div>
                        <div className="text-slate-400">Total Assignments</div>
                    </div>
                    <div className="bg-richblack-800 rounded-2xl p-6 border border-slate-600/50">
                        <div className="text-3xl font-bold text-green-400 mb-2">
                            {assignments.filter(a => a.published).length}
                        </div>
                        <div className="text-slate-400">Published</div>
                    </div>
                    <div className="bg-richblack-800 rounded-2xl p-6 border border-slate-600/50">
                        <div className="text-3xl font-bold text-yellow-400 mb-2">
                            {assignments.reduce((sum, a) => sum + (a.totalSubmissions || 0), 0)}
                        </div>
                        <div className="text-slate-400">Total Submissions</div>
                    </div>
                </div>

                {/* Assignments List */}
                {assignments.length === 0 ? <div className="bg-richblack-800 rounded-3xl p-12 text-center border border-slate-600/50">
                        <div className="w-24 h-24 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <FiPlus className="text-4xl text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">No Assignments Yet</h3>
                        <p className="text-slate-400 mb-6">Create your first assignment to get started</p>
                        <button onClick={() => navigate('/dashboard/create-assignment')} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-300">
                            Create Assignment
                        </button>
                    </div> : <div className="space-y-4">
                        {assignments.map(assignment => <div key={assignment._id} className="bg-richblack-800 rounded-2xl p-6 border border-slate-600/50 hover:border-slate-500/50 transition-all duration-300">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-xl font-semibold text-white">{assignment.title}</h3>
                                            {assignment.published ? <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30">
                                                    Published
                                                </span> : <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium border border-gray-500/30">
                                                    Draft
                                                </span>}
                                            {assignment.emailSent && <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium border border-blue-500/30">
                                                    📧 Emailed
                                                </span>}
                                        </div>

                                        <p className="text-slate-400 mb-4 line-clamp-2">{assignment.description}</p>

                                        <div className="flex items-center gap-6 text-sm">
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <FiCheckCircle className="text-purple-400" />
                                                <span>{assignment.totalPoints} Points</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <FiUsers className="text-blue-400" />
                                                <span>{assignment.totalSubmissions || 0} Submissions</span>
                                            </div>
                                            <div className="text-slate-400">
                                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                            </div>
                                            <div className="text-slate-400">
                                                Course: {assignment.course?.courseName || 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <button onClick={() => navigate(`/dashboard/assignment/${assignment._id}/submissions`)} className="p-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all duration-300" title="View Submissions">
                                            <FiEye />
                                        </button>
                                        <button onClick={() => navigate(`/dashboard/edit-assignment/${assignment._id}`)} className="p-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-all duration-300" title="Edit">
                                            <FiEdit />
                                        </button>
                                        <button onClick={() => togglePublish(assignment._id, assignment.published)} className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${assignment.published ? 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-400' : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'}`}>
                                            {assignment.published ? 'Unpublish' : 'Publish'}
                                        </button>
                                        <button onClick={() => deleteAssignment(assignment._id)} className="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-300" title="Delete">
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </div>
                            </div>)}
                    </div>}
            </div>
        </div>;
}
