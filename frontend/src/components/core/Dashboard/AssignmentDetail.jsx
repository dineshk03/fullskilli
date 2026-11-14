import PropTypes from "prop-types";
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiCalendar, FiCheckCircle, FiFile, FiDownload, FiArrowLeft, FiBook, FiClock, FiAlertCircle } from 'react-icons/fi';
import { apiConnector } from '../../../services/apiConnector';
import { assignmentEndpoints } from '../../../services/apis';
import { ACCOUNT_TYPE } from '../../../utils/constants';
import toast from 'react-hot-toast';
export default function AssignmentDetail({
  assignmentIdProp,
  inModal = false,
  onClose
}) {
  console.log('AssignmentDetail component loaded');
  const {
    token
  } = useSelector(state => state.auth);
  const {
    user
  } = useSelector(state => state.profile);
  const params = useParams();
  const assignmentId = assignmentIdProp || params.assignmentId;
  console.log('Assignment ID:', assignmentId);
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState(null);
  const [error, setError] = useState(null);
  const fetchAssignmentDetails = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching assignment details for ID:', assignmentId);

      // Fetch assignment details (this endpoint already includes submission data for students)
      const response = await apiConnector('GET', assignmentEndpoints.GET_ASSIGNMENT_API.replace(':assignmentId', assignmentId), null, {
        Authorization: `Bearer ${token}`
      });
      console.log('Assignment API response:', response);
      if (response.data.success) {
        console.log('Assignment data received:', response.data.data);
        setAssignment(response.data.data);
        // For students, submission is already included in response
        if (response.data.data.submission) {
          console.log('Submission data found:', response.data.data.submission);
          setSubmission(response.data.data.submission);
        }
      }
    } catch (error) {
      console.error('Error fetching assignment details:', error);
      console.error('Error details:', error.response?.data);
      setError(error.response?.data?.message || error.message || 'Failed to load assignment details');
      toast.error('Failed to load assignment details');
    } finally {
      setLoading(false);
    }
  }, [assignmentId, token]);
  useEffect(() => {
    if (!assignmentId) return;
    fetchAssignmentDetails();
  }, [assignmentId, fetchAssignmentDetails]);
  const downloadFile = async (fileUrl, fileName) => {
    try {
      // S3/public URLs should be fetched WITHOUT Authorization headers.
      // Some S3/CORS setups may block programmatic fetch; in that case, fall back to opening URL.
      const response = await fetch(fileUrl);
      if (!response.ok) {
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      // Most likely a CORS error - open directly
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  };
  const getStatusBadge = status => {
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    if (status === 'graded') {
      return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30 flex items-center gap-1">
                    <FiCheckCircle /> Graded
                </span>;
    }
    if (status === 'submitted') {
      return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium border border-blue-500/30 flex items-center gap-1">
                    <FiFile /> Submitted
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
  if (error) {
    return <div className="min-h-screen bg-richblack-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FiAlertCircle className="text-4xl text-red-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Error Loading Assignment</h3>
                    <p className="text-slate-400 mb-4">{error}</p>
                    <button onClick={() => {
          setError(null);
          fetchAssignmentDetails();
        }} className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-300">
                        Try Again
                    </button>
                    <button onClick={() => inModal && onClose ? onClose() : navigate('/dashboard/assignments')} className="mt-4 ml-4 px-6 py-3 bg-richblack-700 hover:bg-richblack-600 text-white rounded-lg font-medium transition-all duration-300">
                        Back to Assignments
                    </button>
                </div>
            </div>;
  }
  if (loading) {
    return <div className="min-h-screen bg-richblack-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white font-medium">Loading assignment details...</p>
                </div>
            </div>;
  }
  if (!assignment) {
    return <div className="min-h-screen bg-richblack-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FiBook className="text-4xl text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Assignment Not Found</h3>
                    <p className="text-slate-400">The assignment you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
                    <button onClick={() => inModal && onClose ? onClose() : navigate('/dashboard/assignments')} className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-300">
                        <FiArrowLeft className="inline mr-2" />
                        Back to Assignments
                    </button>
                </div>
            </div>;
  }
  const normalizedAttachments = Array.isArray(assignment.attachments) && assignment.attachments.length > 0 ? assignment.attachments : assignment.attachmentUrl ? [{
    fileName: 'Attachment',
    fileUrl: assignment.attachmentUrl
  }] : [];
  return <div className="min-h-screen bg-richblack-900 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 rounded-3xl p-8 mb-8 border border-slate-600/50">
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={() => inModal && onClose ? onClose() : navigate('/dashboard/assignments')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                            <FiArrowLeft />
                            <span>Back to Assignments</span>
                        </button>
                        {getStatusBadge(submission ? 'submitted' : 'not-submitted')}
                    </div>
                    
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                        {assignment.title}
                    </h1>
                    
                    <div className="flex items-center gap-6 text-slate-300">
                        <div className="flex items-center gap-2">
                            <FiCalendar className="text-blue-400" />
                            <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FiCheckCircle className="text-green-400" />
                            <span>{assignment.totalPoints || 100} Points</span>
                        </div>
                    </div>
                    
                    {assignment.course?.courseName && <p className="text-slate-400 mt-2">
                            Course: {assignment.course.courseName}
                        </p>}
                </div>

                {/* Assignment Content */}
                <div className="bg-richblack-800 rounded-3xl p-8 mb-8 border border-slate-600/50">
                    <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                        <FiBook className="text-blue-400" />
                        Assignment Content
                    </h2>
                    
                    <div className="bg-richblack-700 rounded-2xl p-6 border border-slate-600/30">
                        <div className="prose prose-lg prose-invert max-w-none text-richblack-100" dangerouslySetInnerHTML={{
            __html: assignment.description || assignment.instructions || assignment.content
          }} />
                    </div>
                </div>

                {/* Attached Files */}
                {normalizedAttachments.length > 0 && <div className="bg-richblack-800 rounded-3xl p-8 mb-8 border border-slate-600/50">
                        <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                            <FiFile className="text-purple-400" />
                            Attached Files
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {normalizedAttachments.map((file, index) => <div key={file._id || index} className="bg-richblack-700 rounded-2xl p-4 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-600/20 rounded-lg">
                                            <FiFile className="text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-white font-medium mb-1 truncate">
                                                {file.fileName || file.originalName || `File ${index + 1}`}
                                            </h4>
                                            <p className="text-slate-400 text-sm mb-3">
                                                {file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                                            </p>
                                            <button onClick={() => downloadFile(file.secureUrl || file.fileUrl, file.fileName || file.originalName)} className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all duration-300">
                                                <FiDownload />
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                </div>)}
                        </div>
                    </div>}

                {/* Submission Details */}
                {submission && <div className="bg-richblack-800 rounded-3xl p-8 border border-slate-600/50">
                        <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                            <FiFile className="text-green-400" />
                            Your Submission
                        </h2>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Submitted Content */}
                            {submission.content && <div className="bg-richblack-700 rounded-2xl p-6 border border-slate-600/30">
                                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                        <FiFile className="text-blue-400" />
                                        Submitted Content
                                    </h3>
                                    <div className="prose prose-invert max-w-none text-richblack-100" dangerouslySetInnerHTML={{
              __html: submission.content
            }} />
                                </div>}
                            
                            {/* Submitted Files */}
                            {submission.attachments && submission.attachments.length > 0 && <div className="bg-richblack-700 rounded-2xl p-6 border border-slate-600/30">
                                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                        <FiFile className="text-purple-400" />
                                        Submitted Files
                                    </h3>
                                    <div className="space-y-3">
                                        {submission.attachments.map((file, index) => <div key={file._id || index} className="flex items-center justify-between p-3 bg-richblack-600 rounded-lg border border-slate-600/20">
                                                <div className="flex items-center gap-2">
                                                    <FiFile className="text-blue-400" />
                                                    <span className="text-white text-sm truncate">
                                                        {file.fileName || file.originalName || `Submission File ${index + 1}`}
                                                    </span>
                                                </div>
                                                <button onClick={() => downloadFile(file.secureUrl || file.fileUrl, file.fileName || file.originalName)} className="flex items-center gap-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors">
                                                    <FiDownload />
                                                </button>
                                            </div>)}
                                    </div>
                                </div>}
                        </div>
                        
                        {/* Grade Information */}
                        {submission.grade !== null && submission.grade !== undefined && <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-400 mb-2">
                                        {submission.grade}/{assignment.totalPoints}
                                    </div>
                                    <div className="text-sm text-green-300">Your Grade</div>
                                    {submission.feedback && <div className="mt-4 p-3 bg-richblack-700 rounded-lg">
                                            <h4 className="text-white font-medium mb-2">Feedback:</h4>
                                            <p className="text-slate-300 text-sm">{submission.feedback}</p>
                                        </div>}
                                </div>
                            </div>}
                    </div>}

                {/* Submit Assignment Button (for students who haven't submitted) */}
                {user?.accountType === ACCOUNT_TYPE.STUDENT && !submission && <div className="bg-richblack-800 rounded-3xl p-8 border border-slate-600/50">
                        <div className="text-center">
                            <h3 className="text-xl font-semibold text-white mb-4">Ready to Submit?</h3>
                            <p className="text-slate-400 mb-6">
                                Submit your assignment before the due date to avoid late penalties.
                            </p>
                            <button onClick={() => navigate(`/dashboard/submit-assignment/${assignmentId}`)} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-300">
                                Submit Assignment
                            </button>
                        </div>
                    </div>}
            </div>
        </div>;
}
AssignmentDetail.propTypes = {
  "assignmentIdProp": PropTypes.string,
  "inModal": PropTypes.bool,
  "onClose": PropTypes.func
};
