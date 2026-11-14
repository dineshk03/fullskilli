import PropTypes from "prop-types";
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FiX, FiDownload, FiCheck, FiUser } from 'react-icons/fi';
import { apiConnector } from '../../../services/apiConnector';
import { submissionEndpoints, assignmentEndpoints } from '../../../services/apis';
import { BASE_URL } from '../../../services/apis';
import toast from 'react-hot-toast';
export default function ViewSubmissions({
  assignmentIdProp,
  inModal = false,
  onClose
}) {
  const params = useParams();
  const assignmentId = assignmentIdProp || params.assignmentId;
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [grading, setGrading] = useState(false);
  const [gradeForm, setGradeForm] = useState({
    grade: '',
    feedback: ''
  });
  const {
    token
  } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const backendBaseUrl = (() => {
    if (!BASE_URL) return '';
    return BASE_URL.replace(/\/api\/v1\/?$/, '');
  })();
  const resolveFileUrl = file => {
    const rawUrl = typeof file === 'string' ? file : file?.secureUrl || file?.fileUrl;
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

    // Support local uploads served from backend at /uploads
    const normalized = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
    if (normalized.startsWith('/uploads') && backendBaseUrl) {
      return `${backendBaseUrl}${normalized}`;
    }
    return rawUrl;
  };
  const handleDownload = file => {
    const url = resolveFileUrl(file);
    if (!url) {
      toast.error('File URL not available');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  const fetchAssignmentAndSubmissions = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch assignment details
      const assignmentResponse = await apiConnector('GET', assignmentEndpoints.GET_ASSIGNMENT_API.replace(':assignmentId', assignmentId), null, {
        Authorization: `Bearer ${token}`
      });
      if (assignmentResponse.data.success) {
        setAssignment(assignmentResponse.data.data);
      }

      // Fetch submissions
      const submissionsResponse = await apiConnector('GET', submissionEndpoints.GET_ASSIGNMENT_SUBMISSIONS_API.replace(':assignmentId', assignmentId), null, {
        Authorization: `Bearer ${token}`
      });
      if (submissionsResponse.data.success) {
        setSubmissions(submissionsResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, [assignmentId, token]);
  useEffect(() => {
    if (!assignmentId) return;
    fetchAssignmentAndSubmissions();
  }, [assignmentId, fetchAssignmentAndSubmissions]);
  const handleGradeSubmission = async submissionId => {
    if (!gradeForm.grade) {
      toast.error('Please enter a grade');
      return;
    }
    try {
      setGrading(true);
      const response = await apiConnector('POST', submissionEndpoints.GRADE_SUBMISSION_API.replace(':submissionId', submissionId), gradeForm, {
        Authorization: `Bearer ${token}`
      });
      if (response.data.success) {
        toast.success('Submission graded successfully!');
        setSelectedSubmission(null);
        setGradeForm({
          grade: '',
          feedback: ''
        });
        fetchAssignmentAndSubmissions();
      }
    } catch (error) {
      console.error('Error grading submission:', error);
      toast.error(error.response?.data?.message || 'Failed to grade submission');
    } finally {
      setGrading(false);
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-richblack-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white font-medium">Loading submissions...</p>
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
                                {assignment?.title || 'Assignment'} - Submissions
                            </h1>
                            <p className="text-slate-400 mt-2">Review and grade student submissions</p>
                        </div>
                        <button onClick={() => {
            if (inModal && onClose) {
              onClose();
              return;
            }
            navigate('/dashboard/instructor-assignments');
          }} className="p-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl transition-all duration-300">
                            <FiX size={20} />
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-richblack-800 rounded-2xl p-6 border border-slate-600/50">
                        <div className="text-3xl font-bold text-white mb-2">{submissions.length}</div>
                        <div className="text-slate-400">Total Submissions</div>
                    </div>
                    <div className="bg-richblack-800 rounded-2xl p-6 border border-slate-600/50">
                        <div className="text-3xl font-bold text-green-400 mb-2">
                            {submissions.filter(s => s.status === 'graded').length}
                        </div>
                        <div className="text-slate-400">Graded</div>
                    </div>
                    <div className="bg-richblack-800 rounded-2xl p-6 border border-slate-600/50">
                        <div className="text-3xl font-bold text-yellow-400 mb-2">
                            {submissions.filter(s => s.status !== 'graded').length}
                        </div>
                        <div className="text-slate-400">Pending Review</div>
                    </div>
                </div>

                {/* Submissions List */}
                {submissions.length === 0 ? <div className="bg-richblack-800 rounded-3xl p-12 text-center border border-slate-600/50">
                        <h3 className="text-2xl font-bold text-white mb-4">No Submissions Yet</h3>
                        <p className="text-slate-400">Students haven&apos;t submitted any work for this assignment.</p>
                    </div> : <div className="space-y-4">
                        {submissions.map(submission => <div key={submission._id} className="bg-richblack-800 rounded-2xl p-6 border border-slate-600/50 hover:border-slate-500/50 transition-all duration-300">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <FiUser className="text-purple-400" />
                                            <h3 className="text-lg font-semibold text-white">
                                                {submission.student?.firstName} {submission.student?.lastName}
                                            </h3>
                                            {submission.status === 'graded' ? <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30">
                                                    Graded
                                                </span> : <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium border border-yellow-500/30">
                                                    Pending
                                                </span>}
                                        </div>

                                        <div className="text-sm text-slate-400 mb-3">
                                            Submitted: {new Date(submission.submittedAt).toLocaleString()}
                                        </div>

                                        {submission.textContent && <div className="bg-richblack-700 rounded-xl p-4 mb-3">
                                                <p className="text-slate-300 whitespace-pre-wrap">{submission.textContent}</p>
                                            </div>}

                                        {submission.files && submission.files.length > 0 && <div className="mb-3">
                                                <button type="button" onClick={() => handleDownload(submission.files[0])} className="flex items-center gap-2 text-blue-400 hover:text-blue-300">
                                                    <FiDownload />
                                                    Download Submitted File
                                                </button>
                                            </div>}

                                        {submission.status === 'graded' && <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-green-400 font-medium">Grade:</span>
                                                    <span className="text-white font-bold text-xl">
                                                        {submission.grade} / {assignment?.totalPoints}
                                                    </span>
                                                </div>
                                                {submission.feedback && <div>
                                                        <span className="text-green-400 text-sm font-medium">Feedback:</span>
                                                        <p className="text-slate-300 mt-1">{submission.feedback}</p>
                                                    </div>}
                                            </div>}
                                    </div>

                                    {submission.status !== 'graded' && <button onClick={() => {
              setSelectedSubmission(submission);
              setGradeForm({
                grade: '',
                feedback: ''
              });
            }} className="ml-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-300">
                                            Grade
                                        </button>}
                                </div>
                            </div>)}
                    </div>}

                {/* Grading Modal */}
                {selectedSubmission && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-richblack-800 rounded-3xl p-8 max-w-2xl w-full border border-slate-600/50">
                            <h2 className="text-2xl font-bold text-white mb-6">
                                Grade Submission - {selectedSubmission.student?.firstName} {selectedSubmission.student?.lastName}
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Grade (out of {assignment?.totalPoints})
                                    </label>
                                    <input type="number" value={gradeForm.grade} onChange={e => setGradeForm({
                ...gradeForm,
                grade: e.target.value
              })} min="0" max={assignment?.totalPoints} className="w-full px-4 py-3 bg-richblack-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Enter grade" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Feedback (Optional)
                                    </label>
                                    <textarea value={gradeForm.feedback} onChange={e => setGradeForm({
                ...gradeForm,
                feedback: e.target.value
              })} rows="6" className="w-full px-4 py-3 bg-richblack-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Provide feedback to the student..." />
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => handleGradeSubmission(selectedSubmission._id)} disabled={grading} className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2">
                                        {grading ? <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Grading...
                                            </> : <>
                                                <FiCheck />
                                                Submit Grade
                                            </>}
                                    </button>
                                    <button onClick={() => setSelectedSubmission(null)} className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl font-medium transition-all duration-300">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>}
            </div>
        </div>;
}
ViewSubmissions.propTypes = {
  "assignmentIdProp": PropTypes.string,
  "inModal": PropTypes.bool,
  "onClose": PropTypes.func
};
