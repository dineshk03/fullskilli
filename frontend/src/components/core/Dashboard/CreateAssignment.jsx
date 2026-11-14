import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiX } from 'react-icons/fi';
import { apiConnector } from '../../../services/apiConnector';
import { assignmentEndpoints, courseEndpoints } from '../../../services/apis';
import toast from 'react-hot-toast';
export default function CreateAssignment() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    sectionId: '',
    subSectionId: '',
    dueDate: '',
    totalPoints: 100,
    allowLateSubmission: false,
    instructions: ''
  });
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subSections, setSubSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCourses, setFetchingCourses] = useState(true);
  const {
    token
  } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const fetchCourses = useCallback(async () => {
    try {
      setFetchingCourses(true);
      const response = await apiConnector('GET', courseEndpoints.GET_ALL_INSTRUCTOR_COURSES_API, null, {
        Authorization: `Bearer ${token}`
      });
      if (response.data.success) {
        setCourses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setFetchingCourses(false);
    }
  }, [token]);
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Fetch sections when course is selected

  const fetchCourseSections = useCallback(async courseId => {
    try {
      const selectedCourse = courses.find(c => c._id === courseId);
      if (selectedCourse && selectedCourse.courseContent) {
        setSections(selectedCourse.courseContent);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  }, [courses]);
  useEffect(() => {
    if (formData.courseId) {
      fetchCourseSections(formData.courseId);
    } else {
      setSections([]);
      setSubSections([]);
      setFormData(prev => ({
        ...prev,
        sectionId: '',
        subSectionId: ''
      }));
    }
  }, [fetchCourseSections, formData.courseId]);

  // Fetch subsections when section is selected
  useEffect(() => {
    if (formData.sectionId) {
      const selectedSection = sections.find(s => s._id === formData.sectionId);
      if (selectedSection) {
        setSubSections(selectedSection.subSection || []);
      }
    } else {
      setSubSections([]);
      setFormData(prev => ({
        ...prev,
        subSectionId: ''
      }));
    }
  }, [formData.sectionId, sections]);
  const handleChange = e => {
    const {
      name,
      value,
      type,
      checked
    } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should not exceed 10MB');
        return;
      }
      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF and DOC files are allowed');
        return;
      }
      setAssignmentFile(file);
    }
  };
  const handleSubmit = async e => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter assignment title');
      return;
    }
    if (!formData.courseId) {
      toast.error('Please select a course');
      return;
    }
    if (!formData.dueDate) {
      toast.error('Please select due date');
      return;
    }
    try {
      setLoading(true);

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('courseId', formData.courseId);
      submitData.append('sectionId', formData.sectionId || '');
      submitData.append('subSectionId', formData.subSectionId || '');
      submitData.append('dueDate', formData.dueDate);
      submitData.append('totalPoints', formData.totalPoints);
      submitData.append('allowLateSubmission', formData.allowLateSubmission);
      submitData.append('instructions', formData.instructions);

      // Add file if selected
      if (assignmentFile) {
        submitData.append('assignmentFile', assignmentFile);
      }
      const response = await apiConnector('POST', assignmentEndpoints.CREATE_ASSIGNMENT_API, submitData, {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      });
      if (response.data.success) {
        toast.success('Assignment created successfully!');
        navigate('/dashboard/instructor-assignments');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };
  if (fetchingCourses) {
    return <div className="min-h-screen bg-richblack-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white font-medium">Loading...</p>
                </div>
            </div>;
  }
  return <div className="min-h-screen bg-richblack-900 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-indigo-600/20 rounded-3xl p-8 mb-8 border border-slate-600/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Create New Assignment
                            </h1>
                            <p className="text-slate-400 mt-2">Fill in the details to create a new assignment</p>
                        </div>
                        <button onClick={() => navigate('/dashboard/instructor-assignments')} className="p-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl transition-all duration-300">
                            <FiX size={20} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-richblack-800 rounded-3xl p-8 border border-slate-600/50">
                    <div className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Assignment Title <span className="text-red-500">*</span>
                            </label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full px-4 py-3 bg-richblack-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Enter assignment title" required />
                        </div>

                        {/* Course Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Select Course <span className="text-red-500">*</span>
                            </label>
                            <select name="courseId" value={formData.courseId} onChange={handleChange} className="w-full px-4 py-3 bg-richblack-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500" required>
                                <option value="">Select a course</option>
                                {courses.map(course => <option key={course._id} value={course._id}>
                                        {course.courseName}
                                    </option>)}
                            </select>
                        </div>

                        {/* Section Selection */}
                        {formData.courseId && sections.length > 0 && <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Select Section (Optional)
                                </label>
                                <select name="sectionId" value={formData.sectionId} onChange={handleChange} className="w-full px-4 py-3 bg-richblack-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                                    <option value="">All sections (Course-wide)</option>
                                    {sections.map(section => <option key={section._id} value={section._id}>
                                            {section.sectionName}
                                        </option>)}
                                </select>
                                <p className="text-xs text-slate-400 mt-1">
                                    Leave empty to assign to the entire course
                                </p>
                            </div>}

                        {/* Subsection/Lecture Selection */}
                        {formData.sectionId && subSections.length > 0 && <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Select Lecture (Optional)
                                </label>
                                <select name="subSectionId" value={formData.subSectionId} onChange={handleChange} className="w-full px-4 py-3 bg-richblack-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                                    <option value="">All lectures in section</option>
                                    {subSections.map(subSection => <option key={subSection._id} value={subSection._id}>
                                            {subSection.title}
                                        </option>)}
                                </select>
                                <p className="text-xs text-slate-400 mt-1">
                                    Leave empty to assign to all lectures in this section
                                </p>
                            </div>}

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Description
                            </label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full px-4 py-3 bg-richblack-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Enter assignment description" />
                        </div>

                        {/* Instructions */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Instructions
                            </label>
                            <textarea name="instructions" value={formData.instructions} onChange={handleChange} rows="6" className="w-full px-4 py-3 bg-richblack-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Enter detailed instructions for students" />
                        </div>

                        {/* Assignment File Upload */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Assignment Document (Optional)
                            </label>
                            <div className="flex items-center gap-4">
                                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-richblack-700 border-2 border-dashed border-slate-600 rounded-xl text-slate-300 hover:border-purple-500 cursor-pointer transition-all duration-300">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span>{assignmentFile ? assignmentFile.name : 'Choose assignment file'}</span>
                                    <input type="file" onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx" />
                                </label>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                Upload assignment questions/instructions (PDF or DOC, max 10MB)
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Due Date */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Due Date <span className="text-red-500">*</span>
                                </label>
                                <input type="datetime-local" name="dueDate" value={formData.dueDate} onChange={handleChange} className="w-full px-4 py-3 bg-richblack-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                            </div>

                            {/* Total Points */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Total Points <span className="text-red-500">*</span>
                                </label>
                                <input type="number" name="totalPoints" value={formData.totalPoints} onChange={handleChange} min="1" className="w-full px-4 py-3 bg-richblack-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                            </div>
                        </div>

                        {/* Allow Late Submission */}
                        <div className="flex items-center gap-3">
                            <input type="checkbox" name="allowLateSubmission" checked={formData.allowLateSubmission} onChange={handleChange} className="w-5 h-5 rounded border-slate-600 bg-richblack-700 text-purple-600 focus:ring-purple-500" />
                            <label className="text-sm font-medium text-slate-300">
                                Allow late submission
                            </label>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-600">
                        <button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg">
                            {loading ? <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Creating...
                                </> : <>
                                    <FiSave />
                                    Create Assignment
                                </>}
                        </button>
                        <button type="button" onClick={() => navigate('/dashboard/instructor-assignments')} className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl font-medium transition-all duration-300">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>;
}
