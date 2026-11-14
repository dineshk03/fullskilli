import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FiX, FiUpload, FiDownload, FiSend, FiCheckCircle, FiClock, FiFileText } from 'react-icons/fi';
import { apiConnector } from '../../../services/apiConnector';
import { assignmentEndpoints, submissionEndpoints } from '../../../services/apis';
import toast from 'react-hot-toast';
export default function SubmitAssignment() {
  const {
    assignmentId
  } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    submissionText: '',
    submissionFile: null
  });
  const {
    token
  } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const fetchAssignment = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiConnector('GET', assignmentEndpoints.GET_ASSIGNMENT_API.replace(':assignmentId', assignmentId), null, {
        Authorization: `Bearer ${token}`
      });
      if (response.data.success) {
        setAssignment(response.data.data);
        // Check if student already submitted
        if (response.data.submission) {
          setSubmission(response.data.submission);
        }
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
      toast.error('Failed to load assignment details');
    } finally {
      setLoading(false);
    }
  }, [assignmentId, token]);
  useEffect(() => {
    fetchAssignment();
  }, [assignmentId, fetchAssignment]);
  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should not exceed 10MB');
        return;
      }
      setFormData({
        ...formData,
        submissionFile: file
      });
    }
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.submissionText.trim() && !formData.submissionFile) {
      toast.error('Please provide submission text or upload a file');
      return;
    }
    try {
      setSubmitting(true);

      // Determine submission type
      const submissionType = formData.submissionFile ? 'file' : 'text';
      const submitData = new FormData();
      submitData.append('assignmentId', assignmentId);
      submitData.append('submissionType', submissionType);
      submitData.append('textContent', formData.submissionText);
      if (formData.submissionFile) {
        submitData.append('files', formData.submissionFile);
      }
      const response = await apiConnector('POST', submissionEndpoints.SUBMIT_ASSIGNMENT_API, submitData, {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      });
      if (response.data.success) {
        toast.success('Assignment submitted successfully!');
        navigate('/dashboard/student-assignments');
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-richblack-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white font-medium">Loading assignment...</p>
                </div>
            </div>;
  }
  if (!assignment) {
    return <div className="min-h-screen bg-richblack-900 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Assignment Not Found</h2>
                    <button onClick={() => navigate('/dashboard/student-assignments')} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300">
                        Back to Assignments
                    </button>
                </div>
            </div>;
  }
  const isOverdue = new Date() > new Date(assignment.dueDate);
  const isSubmitted = submission !== null;
  const isGraded = submission?.gradePoints !== null && submission?.gradePoints !== undefined;
  return <div className="min-h-screen bg-richblack-900 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 rounded-3xl p-8 mb-8 border border-slate-600/50">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            {assignment.title}
                        </h1>
                        <button onClick={() => navigate('/dashboard/student-assignments')} className="p-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl transition-all duration-300">
                            <FiX size={20} />
                        </button>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {isGraded && <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-medium border border-green-500/30 flex items-center gap-2">
                                <FiCheckCircle /> Graded
                            </span>}
                        {!isGraded && isSubmitted && <span className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium border border-blue-500/30 flex items-center gap-2">
                                <FiFileText /> Submitted
                            </span>}
                        {isOverdue && !isSubmitted && <span className="px-4 py-2 bg-red-500/20 text-red-400 rounded-full text-sm font-medium border border-red-500/30">
                                Overdue
                            </span>}
                        <span className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-full text-sm">
                            {assignment.course?.courseName || 'Unknown Course'}
                        </span>
                    </div>
                </div>

                {/* Assignment Details */}
                <div className="bg-richblack-800 rounded-3xl p-8 border border-slate-600/50 mb-8">
                    <h2 className="text-xl font-semibold text-white mb-4">Assignment Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-richblack-700 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-blue-400 mb-2">
                                <FiClock />
                                <span className="text-sm font-medium">Due Date</span>
                            </div>
                            <p className="text-white font-semibold">
                                {new Date(assignment.dueDate).toLocaleDateString()}
                            </p>
                            <p className="text-slate-400 text-sm">
                                {new Date(assignment.dueDate).toLocaleTimeString()}
                            </p>
                        </div>

                        <div className="bg-richblack-700 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-green-400 mb-2">
                                <FiCheckCircle />
                                <span className="text-sm font-medium">Total Points</span>
                            </div>
                            <p className="text-white font-semibold text-2xl">
                                {assignment.totalPoints}
                            </p>
                        </div>

                        {isGraded && <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
                                <div className="flex items-center gap-2 text-green-400 mb-2">
                                    <FiCheckCircle />
                                    <span className="text-sm font-medium">Your Grade</span>
                                </div>
                                <p className="text-white font-semibold text-2xl">
                                    {submission.gradePoints} / {assignment.totalPoints}
                                </p>
                            </div>}
                    </div>

                    {assignment.description && <div className="mb-6">
                            <h3 className="text-white font-medium mb-2">Description</h3>
                            <p className="text-slate-300">{assignment.description}</p>
                        </div>}

                    {assignment.instructions && <div>
                            <h3 className="text-white font-medium mb-2">Instructions</h3>
                            <div className="bg-richblack-700 rounded-xl p-4 text-slate-300 whitespace-pre-wrap">
                                {assignment.instructions}
                            </div>
                        </div>}
                </div>

                {/* Submission Section */}
                {!isSubmitted ? <div className="bg-richblack-800 rounded-3xl p-8 border border-slate-600/50">
                        <h2 className="text-xl font-semibold text-white mb-6">Submit Your Work</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Text Submission */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Submission Text
                                </label>
                                <textarea value={formData.submissionText} onChange={e => setFormData({
              ...formData,
              submissionText: e.target.value
            })} rows="8" className="w-full px-4 py-3 bg-richblack-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter your submission text here..." />
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Upload File (Optional)
                                </label>
                                <div className="flex items-center gap-4">
                                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-richblack-700 border-2 border-dashed border-slate-600 rounded-xl text-slate-300 hover:border-blue-500 cursor-pointer transition-all duration-300">
                                        <FiUpload />
                                        <span>{formData.submissionFile ? formData.submissionFile.name : 'Choose file'}</span>
                                        <input type="file" onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.txt,.zip" />
                                    </label>
                                </div>
                                <p className="text-slate-400 text-xs mt-2">
                                    Max file size: 10MB. Allowed formats: PDF, DOC, DOCX, TXT, ZIP
                                </p>
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-4 pt-4">
                                <button type="submit" disabled={submitting || isOverdue && !assignment.allowLateSubmission} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg">
                                    {submitting ? <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Submitting...
                                        </> : <>
                                            <FiSend />
                                            Submit Assignment
                                        </>}
                                </button>
                                <button type="button" onClick={() => navigate('/dashboard/student-assignments')} className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl font-medium transition-all duration-300">
                                    Cancel
                                </button>
                            </div>

                            {isOverdue && !assignment.allowLateSubmission && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                                    ⚠️ This assignment is overdue and late submissions are not allowed.
                                </div>}
                        </form>
                    </div> : <div className="bg-richblack-800 rounded-3xl p-8 border border-slate-600/50">
                        <h2 className="text-xl font-semibold text-white mb-6">Your Submission</h2>

                        <div className="space-y-4">
                            <div className="bg-richblack-700 rounded-xl p-4">
                                <p className="text-slate-400 text-sm mb-2">Submitted on</p>
                                <p className="text-white font-medium">
                                    {new Date(submission.submittedAt).toLocaleString()}
                                </p>
                            </div>

                            {submission.submissionText && <div className="bg-richblack-700 rounded-xl p-4">
                                    <p className="text-slate-400 text-sm mb-2">Submission Text</p>
                                    <p className="text-white whitespace-pre-wrap">{submission.submissionText}</p>
                                </div>}

                            {submission.submissionFile && <div className="bg-richblack-700 rounded-xl p-4">
                                    <p className="text-slate-400 text-sm mb-2">Submitted File</p>
                                    <a href={submission.submissionFile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300">
                                        <FiDownload />
                                        Download File
                                    </a>
                                </div>}

                            {isGraded && submission.feedback && <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/30">
                                    <p className="text-green-400 text-sm mb-2 font-medium">Instructor Feedback</p>
                                    <p className="text-white whitespace-pre-wrap">{submission.feedback}</p>
                                </div>}
                        </div>
                    </div>}
            </div>
        </div>;
}
