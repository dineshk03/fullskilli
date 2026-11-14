import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiX } from 'react-icons/fi';
import { apiConnector } from '../../../services/apiConnector';
import { assignmentEndpoints } from '../../../services/apis';
import toast from 'react-hot-toast';

export default function EditAssignment() {
  const { assignmentId } = useParams();
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [assignment, setAssignment] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    dueDate: '',
    totalPoints: 100,
    allowLateSubmission: false,
  });
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [deleteAttachment, setDeleteAttachment] = useState(false);

  const toDateTimeLocalValue = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId) return;
      try {
        setFetching(true);

        const res = await apiConnector(
          'GET',
          assignmentEndpoints.GET_ASSIGNMENT_API.replace(':assignmentId', assignmentId),
          null,
          { Authorization: `Bearer ${token}` }
        );

        if (res?.data?.success) {
          const data = res.data.data;
          setAssignment(data);
          setFormData({
            title: data.title || '',
            description: data.description || '',
            instructions: data.instructions || '',
            dueDate: toDateTimeLocalValue(data.dueDate),
            totalPoints: data.totalPoints ?? 100,
            allowLateSubmission: Boolean(data.lateSubmissionAllowed),
          });
        } else {
          toast.error(res?.data?.message || 'Failed to load assignment');
        }
      } catch (err) {
        console.error('Error fetching assignment:', err);
        toast.error(err?.response?.data?.message || 'Failed to load assignment');
      } finally {
        setFetching(false);
      }
    };

    fetchAssignment();
  }, [assignmentId, token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should not exceed 10MB');
        return;
      }
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF and DOC files are allowed');
        return;
      }
      setAssignmentFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter assignment title');
      return;
    }
    if (!formData.dueDate) {
      toast.error('Please select due date');
      return;
    }

    try {
      setLoading(true);

      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('instructions', formData.instructions);
      submitData.append('dueDate', formData.dueDate);
      submitData.append('totalPoints', Number(formData.totalPoints) || 100);
      submitData.append('lateSubmissionAllowed', formData.allowLateSubmission);

      if (deleteAttachment) {
        submitData.append('deleteAttachment', 'true');
      }

      if (assignmentFile) {
        submitData.append('assignmentFile', assignmentFile);
      }

      const res = await apiConnector(
        'PATCH',
        assignmentEndpoints.UPDATE_ASSIGNMENT_API.replace(':assignmentId', assignmentId),
        submitData,
        {
          Authorization: `Bearer ${token}`,
          ...(assignmentFile && { 'Content-Type': 'multipart/form-data' }),
        }
      );

      if (res?.data?.success) {
        toast.success('Assignment updated successfully!');
        // Refetch the assignment to reflect new attachment
        const refetch = await apiConnector(
          'GET',
          assignmentEndpoints.GET_ASSIGNMENT_API.replace(':assignmentId', assignmentId),
          null,
          { Authorization: `Bearer ${token}` }
        );
        if (refetch?.data?.success) {
          setAssignment(refetch.data.data);
        }
        setAssignmentFile(null);
        setDeleteAttachment(false); // Reset delete flag
        // Optionally navigate away or keep user on page
        // navigate('/dashboard/instructor-assignments');
      } else {
        toast.error(res?.data?.message || 'Failed to update assignment');
      }
    } catch (err) {
      console.error('Error updating assignment:', err);
      toast.error(err?.response?.data?.message || 'Failed to update assignment');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-richblack-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-medium">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-richblack-900 flex items-center justify-center p-6">
        <div className="bg-richblack-800 border border-richblack-700 rounded-2xl p-8 text-center max-w-lg w-full">
          <h2 className="text-xl font-semibold text-richblack-5">Assignment not found</h2>
          <p className="text-richblack-300 mt-2">The assignment may have been deleted or you do not have access.</p>
          <button
            onClick={() => navigate('/dashboard/instructor-assignments')}
            className="mt-6 px-5 py-2 rounded-xl bg-richblack-700 hover:bg-richblack-600 text-richblack-5 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-richblack-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-indigo-600/20 rounded-3xl p-8 mb-8 border border-slate-600/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Edit Assignment
              </h1>
              <p className="text-slate-400 mt-2">Update assignment details and save changes.</p>
            </div>
            <button
              onClick={() => navigate('/dashboard/instructor-assignments')}
              className="p-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl transition-all duration-300"
              title="Close"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-richblack-800 rounded-3xl p-8 border border-slate-600/50">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Assignment Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-richblack-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter assignment title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-richblack-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter assignment description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Instructions</label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-3 bg-richblack-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter detailed instructions for students"
              />
            </div>

            {/* Assignment File Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Assignment Document (Optional)
              </label>
              {assignment?.attachments?.length > 0 && (
                <div className="mb-3 p-3 bg-richblack-700/50 border border-richblack-600 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-richblack-300">Current file:</p>
                    <button
                      type="button"
                      onClick={() => setDeleteAttachment(true)}
                      className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  <a
                    href={assignment.attachments[0].fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg text-sm transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {assignment.attachments[0].fileName || 'Open/Download'}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-4">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-richblack-700 border-2 border-dashed border-slate-600 rounded-xl text-slate-300 hover:border-purple-500 cursor-pointer transition-all duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>{assignmentFile ? assignmentFile.name : 'Choose new file to replace'}</span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                  />
                </label>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Upload a new file to replace the current assignment document (PDF or DOC, max 10MB)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-richblack-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Total Points <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="totalPoints"
                  value={formData.totalPoints}
                  onChange={handleChange}
                  min={1}
                  className="w-full px-4 py-3 bg-richblack-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="allowLateSubmission"
                checked={formData.allowLateSubmission}
                onChange={handleChange}
                className="w-5 h-5 rounded border-slate-600 bg-richblack-700 text-purple-600 focus:ring-purple-500"
              />
              <label className="text-sm font-medium text-slate-300">Allow late submission</label>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-600">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave />
                  Save Changes
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard/instructor-assignments')}
              className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl font-medium transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
