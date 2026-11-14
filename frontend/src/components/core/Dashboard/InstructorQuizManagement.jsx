import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { deleteQuiz as deleteQuizAPI } from '../../../services/operations/quizAPI';
import { RiDeleteBin6Line, RiEditLine } from 'react-icons/ri';
import { BASE_URL } from '../../../config/api';
import { courseEndpoints } from '../../../services/apis';
const InstructorQuizManagement = () => {
  const {
    token
  } = useSelector(state => state.auth);
  useSelector(state => state.profile);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [quizzes, setQuizzes] = useState([]);

  // Fetch instructor courses

  const fetchInstructorCourses = useCallback(async () => {
    try {
      setLoading(true);

      // Use the existing fetchInstructorCourses API
      const response = await fetch(courseEndpoints.GET_ALL_INSTRUCTOR_COURSES_API, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setCourses(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    fetchInstructorCourses();
  }, [fetchInstructorCourses]);
  const fetchCourseQuizzes = async courseId => {
    try {
      setLoading(true);

      // Use the new API endpoint to fetch quizzes for a specific course
      // Add cache-busting parameter to ensure fresh data
      const response = await fetch(`${BASE_URL}/api/v1/quiz/instructor/course/${courseId}?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setQuizzes(data.quizzes || []);
      } else {
        toast.error(data.message || 'Failed to fetch quizzes');
        setQuizzes([]);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast.error('Failed to fetch quizzes');
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };
  const handleCourseChange = courseId => {
    setSelectedCourse(courseId);
    if (courseId) {
      fetchCourseQuizzes(courseId);
    } else {
      setQuizzes([]);
    }
  };
  const handleDeleteQuiz = async (quizId, quizTitle) => {
    if (!window.confirm(`Are you sure you want to delete the quiz "${quizTitle}"? This action cannot be undone.`)) return;
    try {
      setLoading(true);
      const result = await deleteQuizAPI(quizId, token);
      if (result) {
        // Refresh quizzes after successful deletion
        fetchCourseQuizzes(selectedCourse);
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateQuizStatus = async (quizId, currentStatus, quizTitle) => {
    const newStatus = currentStatus === 'Draft' ? 'Published' : 'Draft';
    const action = newStatus === 'Published' ? 'publish' : 'unpublish';
    if (!window.confirm(`Are you sure you want to ${action} the quiz "${quizTitle}"?`)) return;
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/v1/quiz/status/${quizId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Quiz ${action}ed successfully!`);
        // Refresh quizzes after successful status update with a small delay
        setTimeout(() => {
          fetchCourseQuizzes(selectedCourse);
        }, 500);
      } else {
        toast.error(data.message || `Failed to ${action} quiz`);
      }
    } catch (error) {
      console.error('Error updating quiz status:', error);
      toast.error(`Failed to ${action} quiz`);
    } finally {
      setLoading(false);
    }
  };
  if (loading && courses.length === 0) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Quiz Management 📝
            </h1>
            <p className="text-slate-400 mt-2">
              Create and manage quizzes for your courses
            </p>
          </div>
          <Link to="/dashboard/create-quiz" className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
            Create New Quiz
          </Link>
        </div>
      </div>

      {/* Course Selection */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <h2 className="text-xl font-semibold text-white mb-4">Select Course</h2>
        <select value={selectedCourse} onChange={e => handleCourseChange(e.target.value)} className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
          <option value="">Select a course to view quizzes</option>
          {courses.map(course => <option key={course._id} value={course._id}>
              {course.courseName}
            </option>)}
        </select>
      </div>

      {/* Quizzes List */}
      {selectedCourse && <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Course Quizzes ({quizzes.length})
            </h2>
            <Link to={`/dashboard/create-quiz?courseId=${selectedCourse}`} className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-300">
              Add Quiz to This Course
            </Link>
          </div>

          {loading ? <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div> : quizzes.length > 0 ? <div className="space-y-4">
              {quizzes.map(quiz => <div key={quiz._id} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50 hover:border-purple-500/30 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {quiz.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>📊 {quiz.questions?.length || 0} Questions</span>
                        <span>⏱️ {quiz.duration || 'No time limit'}</span>
                        <span>🎯 {quiz.totalMarks || 0} Marks</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${quiz.status === 'Published' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {quiz.status || 'Draft'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={`/dashboard/quiz/${quiz._id}/analytics`} className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors duration-300">
                        Analytics
                      </Link>
                      <button onClick={() => handleUpdateQuizStatus(quiz._id, quiz.status, quiz.title)} disabled={loading} className={`px-3 py-2 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${quiz.status === 'Draft' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'}`}>
                        {quiz.status === 'Draft' ? 'Publish' : 'Unpublish'}
                      </button>
                      <div className="flex items-center gap-3">
                        <Link to={`/dashboard/create-quiz?courseId=${selectedCourse}&edit=${quiz._id}`} className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors duration-300">
                          <RiEditLine className="w-4 h-4" />
                          Edit
                        </Link>
                        <button onClick={() => handleDeleteQuiz(quiz._id, quiz.title)} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                          <RiDeleteBin6Line className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>)}
            </div> : <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 text-slate-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Quizzes Yet</h3>
              <p className="text-slate-400 mb-4">
                Create your first quiz for this course to get started
              </p>
              <Link to={`/dashboard/create-quiz?courseId=${selectedCourse}`} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create First Quiz
              </Link>
            </div>}
        </div>}

      {/* Quick Stats */}
      {courses.length > 0 && <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Courses</p>
                <p className="text-2xl font-bold text-white">{courses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Quizzes</p>
                <p className="text-2xl font-bold text-white">{quizzes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-400">Quiz Attempts</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
            </div>
          </div>
        </div>}
    </div>;
};
export default InstructorQuizManagement;
