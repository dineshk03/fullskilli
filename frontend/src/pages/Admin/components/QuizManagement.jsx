import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { getAllCourses } from '../../../services/operations/adminAPI';
import { getFullDetailsOfCourse } from '../../../services/operations/courseDetailsAPI';
import { showAllCategories } from '../../../services/operations/categoryAPI';
import { deleteQuiz } from '../../../services/operations/quizAPI';
import QuizCreator from './QuizCreator';
const QuizManagement = () => {
  const {
    token
  } = useSelector(state => state.auth);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);
  const [selectedSubSection, setSelectedSubSection] = useState(null);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingCourseDetails, setLoadingCourseDetails] = useState(false);
  useEffect(() => {
    fetchCategories();
  }, []);
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const categoriesData = await showAllCategories();
      setCategories(categoriesData || []);
    } catch (error) {
      console.error("Error fetching categories:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setCategories([]);
      // You might want to show a toast error here
      // toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoadingCategories(false);
    }
  };
  const fetchCourses = async categoryId => {
    setLoading(true);
    try {
      if (!token) {
        throw new Error("No authentication token found");
      }
      console.log("Fetching courses with token:", token);

      // Get all courses from admin API
      const result = await getAllCourses(token);
      console.log("Courses data received:", result);
      if (!result?.courses) {
        throw new Error("No courses data received");
      }

      // Filter courses by category if a category is selected
      console.log("Filtering courses for category:", categoryId);
      console.log("Available courses:", result.courses);
      const filteredCourses = categoryId ? result.courses.filter(course => {
        console.log("Course category:", course.category);
        return course.category?._id === categoryId;
      }) : result.courses;
      console.log("Filtered courses:", filteredCourses);
      setCourses(filteredCourses || []);
    } catch (error) {
      console.error("Error fetching courses:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setCourses([]);
      // You might want to show a toast error here
      // toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchCourseDetails = async courseId => {
    setLoadingCourseDetails(true);
    try {
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response = await getFullDetailsOfCourse(courseId, token);
      console.log("Course details API response:", response);
      if (!response?.courseDetails) {
        throw new Error("No course details in response");
      }
      setSelectedCourseDetails(response.courseDetails);
    } catch (error) {
      console.error("Error fetching course details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setSelectedCourseDetails(null);
      // You might want to show a toast error here
      // toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoadingCourseDetails(false);
    }
  };
  const getSubSections = () => {
    try {
      console.log("Getting subsections from course details:", selectedCourseDetails);
      if (!selectedCourseDetails) {
        console.log("No course details available");
        return [];
      }
      if (!selectedCourseDetails.courseContent) {
        console.log("No course content in details");
        return [];
      }
      console.log("Course content:", selectedCourseDetails.courseContent);
      const subsections = selectedCourseDetails.courseContent.reduce((acc, section) => {
        console.log("Processing section:", section);
        if (section.subSection && Array.isArray(section.subSection)) {
          const sectionSubsections = section.subSection.map(sub => ({
            ...sub,
            sectionName: section.sectionName || 'Unknown Section'
          }));
          console.log("Section subsections:", sectionSubsections);
          return [...acc, ...sectionSubsections];
        }
        return acc;
      }, []);
      console.log("All subsections:", subsections);
      return subsections;
    } catch (error) {
      console.error("Error in getSubSections:", error);
      return [];
    }
  };
  const handleQuizCreated = () => {
    // Refresh course details to get updated quiz data
    if (selectedCourse) {
      fetchCourseDetails(selectedCourse._id);
    }
    setShowQuizForm(false);
  };
  const handleDeleteQuiz = async (quizId, quizTitle) => {
    if (!window.confirm(`Are you sure you want to delete the quiz "${quizTitle}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setLoading(true);
      const result = await deleteQuiz(quizId, token);
      if (result) {
        toast.success('Quiz deleted successfully!');
        // Refresh course details to get updated quiz data
        if (selectedCourse) {
          fetchCourseDetails(selectedCourse._id);
        }
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    } finally {
      setLoading(false);
    }
  };
  try {
    return <div className="space-y-6">
        {/* Header */}
        <div className="bg-richblack-800/60 backdrop-blur-xl rounded-2xl p-6 border border-richblack-700">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-50 to-yellow-200 bg-clip-text text-transparent">
              Quiz Management
            </h1>
            <p className="text-richblack-300 text-sm">
              Select a category and course to add, edit, or delete quizzes on specific lectures.
            </p>
          </div>
        </div>

        {/* Selection */}
        <div className="bg-richblack-800 rounded-2xl p-6 border border-richblack-700">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-richblack-200">Category</label>
              {loadingCategories ? <div className="flex items-center gap-3 px-4 py-3 bg-richblack-700 rounded-lg border border-richblack-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-yellow-50"></div>
                  <span className="text-sm text-richblack-300">Loading categories...</span>
                </div> : <select value={selectedCategory || ""} onChange={e => {
              try {
                const categoryId = e.target.value;
                setSelectedCategory(categoryId);
                setSelectedCourse(null);
                setSelectedCourseDetails(null);
                setSelectedSubSection(null);
                if (categoryId) {
                  fetchCourses(categoryId);
                }
              } catch (error) {
                console.error("Error in category selection:", error);
              }
            }} className="w-full bg-richblack-700 text-richblack-5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-50/60 border border-richblack-600">
                  <option value="">Select a category</option>
                  {categories?.map(category => <option key={category._id} value={category._id}>
                      {category.name}
                    </option>)}
                </select>}
            </div>

            {/* Course Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-richblack-200">Course</label>
              <select disabled={!selectedCategory || loading} value={selectedCourse?._id || ""} onChange={e => {
              try {
                const course = courses.find(c => c._id === e.target.value);
                setSelectedCourse(course);
                setSelectedCourseDetails(null);
                setSelectedSubSection(null);
                if (course) {
                  fetchCourseDetails(course._id);
                }
              } catch (error) {
                console.error("Error in course selection:", error);
              }
            }} className="w-full bg-richblack-700 text-richblack-5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-50/60 border border-richblack-600 disabled:opacity-50 disabled:cursor-not-allowed">
                <option value="">{selectedCategory ? loading ? 'Loading courses...' : 'Select a course' : 'Select a category first'}</option>
                {courses?.map(course => <option key={course._id} value={course._id}>
                    {course.courseName}
                  </option>)}
              </select>
            </div>
          </div>

          {selectedCategory && !loading && courses.length === 0 && <div className="mt-5 bg-richblack-700/60 border border-richblack-600 rounded-xl p-5">
              <p className="text-richblack-5 font-semibold">No courses found</p>
              <p className="text-sm text-richblack-300 mt-1">There are no courses available in this category.</p>
            </div>}
        </div>

        {/* Lectures List */}
        {selectedCourse && <div className="bg-richblack-800 rounded-2xl p-6 border border-richblack-700">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-richblack-5">Lectures</h2>
                <p className="text-sm text-richblack-300">Manage quizzes lecture-wise for: <span className="text-richblack-50 font-medium">{selectedCourse.courseName}</span></p>
              </div>
              {loadingCourseDetails && <div className="flex items-center gap-2 text-sm text-richblack-300">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-yellow-50"></div>
                  Loading...
                </div>}
            </div>
            
            {selectedCourseDetails && !loadingCourseDetails && <div className="space-y-3">
                {getSubSections().map(subsection => <div key={subsection._id} className="bg-richblack-700/60 border border-richblack-600 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${subsection.quiz ? 'bg-caribbeangreen-900/40 text-caribbeangreen-200 border-caribbeangreen-700/50' : 'bg-yellow-900/30 text-yellow-200 border-yellow-700/50'}`}>
                          {subsection.quiz ? 'Quiz Added' : 'No Quiz'}
                        </span>
                        <p className="text-xs text-richblack-400 truncate">{subsection.sectionName}</p>
                      </div>
                      <h4 className="text-richblack-5 font-semibold truncate">{subsection.title}</h4>
                      {subsection.quiz && <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                          <div className="bg-richblack-800/60 rounded-lg px-3 py-2 border border-richblack-600">
                            <p className="text-richblack-400 text-xs">Questions</p>
                            <p className="text-richblack-50 font-semibold">{subsection.quiz.questions?.length || 0}</p>
                          </div>
                          <div className="bg-richblack-800/60 rounded-lg px-3 py-2 border border-richblack-600">
                            <p className="text-richblack-400 text-xs">Total Marks</p>
                            <p className="text-richblack-50 font-semibold">{subsection.quiz.questions?.reduce((sum, q) => sum + (q.marks || 0), 0) || 0}</p>
                          </div>
                          <div className="bg-richblack-800/60 rounded-lg px-3 py-2 border border-richblack-600">
                            <p className="text-richblack-400 text-xs">Time Limit</p>
                            <p className="text-richblack-50 font-semibold">{Math.floor((subsection.quiz.timeLimit || 1800) / 60)} min</p>
                          </div>
                        </div>}
                    </div>

                    <div className="flex items-center gap-2 lg:justify-end">
                      {subsection.quiz ? <>
                          <button onClick={() => {
                  setSelectedSubSection(subsection);
                  setShowQuizForm(true);
                }} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                            <FaEdit className="text-sm" />
                            Edit
                          </button>
                          <button onClick={() => handleDeleteQuiz(subsection.quiz._id, `${subsection.sectionName} - ${subsection.title}`)} disabled={loading} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <FaTrash className="text-sm" />
                            Delete
                          </button>
                        </> : <button onClick={() => {
                setSelectedSubSection(subsection);
                setShowQuizForm(true);
              }} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-yellow-50 hover:bg-yellow-100 text-richblack-900 text-sm font-semibold transition-colors">
                          <FaPlus className="text-sm" />
                          Add Quiz
                        </button>}
                    </div>
                  </div>)}

                {getSubSections().length === 0 && <div className="bg-richblack-700/60 border border-richblack-600 rounded-xl p-6 text-center">
                    <p className="text-richblack-5 font-semibold">No lectures found</p>
                    <p className="text-richblack-300 text-sm mt-1">This course doesn&apos;t have any lectures yet.</p>
                  </div>}
              </div>}
          </div>}

        {/* Quiz Creator Modal */}
        {showQuizForm && selectedSubSection && <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-richblack-800 rounded-lg p-4 sm:p-6 w-full max-w-[800px] max-h-[90vh] overflow-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <h3 className="text-lg sm:text-xl font-semibold text-richblack-5">
                  {selectedSubSection.quiz ? 'Edit' : 'Add'} Quiz - {selectedSubSection.title}
                </h3>
                <button onClick={() => setShowQuizForm(false)} className="text-richblack-300 hover:text-richblack-50 text-xl self-end sm:self-auto">
                  ✕
                </button>
              </div>
              <QuizCreator subSectionId={selectedSubSection._id} existingQuiz={selectedSubSection.quiz} onClose={() => setShowQuizForm(false)} onSuccess={handleQuizCreated} />
            </div>
          </div>}
      </div>;
  } catch (error) {
    console.error("Error rendering QuizManagement component:", error);
    return <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-richblack-5">Quiz Management</h1>
        <div className="bg-pink-900 border border-pink-700 rounded-lg p-6">
          <p className="text-pink-200">
            An error occurred while loading the quiz management interface. Please refresh the page and try again.
          </p>
          <p className="text-pink-300 text-sm mt-2">
            Error: {error.message}
          </p>
        </div>
      </div>;
  }
};
export default QuizManagement;
