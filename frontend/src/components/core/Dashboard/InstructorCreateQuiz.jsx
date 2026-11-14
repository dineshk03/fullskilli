import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { RiArrowLeftLine } from 'react-icons/ri';
import QuizCreator from '../../../pages/Admin/components/QuizCreator';
import { BASE_URL } from '../../../config/api';
const InstructorCreateQuiz = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCourseId = searchParams.get('courseId');
  const editQuizId = searchParams.get('edit');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(preselectedCourseId || '');
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [subSections, setSubSections] = useState([]);
  const [selectedSubSection, setSelectedSubSection] = useState('');
  const [showQuizCreator, setShowQuizCreator] = useState(false);
  const [existingQuiz, setExistingQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const {
    token
  } = useSelector(state => state.auth);

  // Fetch instructor courses

  const fetchInstructorCourses = useCallback(async () => {
    try {
      console.log('Fetching instructor courses...');
      const response = await fetch(`${BASE_URL}/api/v1/course/getInstructorCoursesForInstructor`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('Instructor courses response:', data);
      if (data.success) {
        const coursesData = data.data || [];
        console.log('Courses data:', coursesData);
        setCourses(coursesData);
      } else {
        console.log('Failed to fetch courses:', data.message);
        toast.error(data.message || 'Failed to fetch courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
    }
  }, [token]);
  useEffect(() => {
    fetchInstructorCourses();
  }, [fetchInstructorCourses]);

  // Fetch sections when course is selected

  const fetchCourseSectionsAlternative = useCallback(async courseId => {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/course/getCourseDetails/${courseId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('Alternative course details response:', data);
      if (data.success) {
        const courseContent = data.data?.courseContent || data.courseContent || data.data?.courseDetails?.courseContent || data.data?.sections || data.sections;
        if (courseContent && Array.isArray(courseContent)) {
          setSections(courseContent);
        } else {
          console.log('No sections found in alternative API');
          // For debugging - add some mock data
          console.log('Adding mock sections for testing...');
          setSections([{
            _id: 'mock-section-1',
            sectionName: 'Introduction',
            subSection: [{
              _id: 'mock-subsection-1',
              title: 'Getting Started'
            }, {
              _id: 'mock-subsection-2',
              title: 'Basic Concepts'
            }]
          }, {
            _id: 'mock-section-2',
            sectionName: 'Advanced Topics',
            subSection: [{
              _id: 'mock-subsection-3',
              title: 'Advanced Techniques'
            }, {
              _id: 'mock-subsection-4',
              title: 'Best Practices'
            }]
          }]);
          toast.error('No sections found for this course - using mock data for testing');
        }
      } else {
        toast.error(data.message || 'Failed to fetch course sections');
      }
    } catch (error) {
      console.error('Error with alternative API:', error);
      toast.error('Failed to fetch course sections');
    }
  }, [token]);
  const fetchCourseSections = useCallback(async courseId => {
    try {
      console.log('Fetching sections for course:', courseId);

      // Try the full course details API first
      const response = await fetch(`${BASE_URL}/api/v1/course/getFullCourseDetails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId
        })
      });
      const data = await response.json();
      console.log('Full course details response:', data);
      if (data.success) {
        // Try different possible data structures
        const courseContent = data.data?.courseContent || data.courseContent || data.data?.courseDetails?.courseContent || data.data?.sections || data.sections;
        console.log('Course content:', courseContent);
        if (courseContent && Array.isArray(courseContent)) {
          setSections(courseContent);
          console.log('Sections set:', courseContent);
        } else {
          console.log('No course content found or not an array, trying alternative API');
          // Fallback to the original API
          await fetchCourseSectionsAlternative(courseId);
        }
      } else {
        console.log('API response not successful, trying alternative API');
        await fetchCourseSectionsAlternative(courseId);
      }
    } catch (error) {
      console.error('Error fetching sections, trying alternative API:', error);
      await fetchCourseSectionsAlternative(courseId);
    }
  }, [fetchCourseSectionsAlternative, token]);
  useEffect(() => {
    if (selectedCourse) {
      fetchCourseSections(selectedCourse);
      setSelectedSection('');
      setSelectedSubSection('');
    }
  }, [fetchCourseSections, selectedCourse]);

  // Fetch subsections when section is selected

  const fetchSectionSubSections = useCallback(sectionId => {
    console.log('Fetching subsections for section:', sectionId);
    console.log('Available sections:', sections);
    const section = sections.find(s => s._id === sectionId);
    console.log('Found section:', section);
    if (section) {
      // Try different possible property names for subsections
      const subsections = section.subSection || section.subSections || section.lectures || [];
      console.log('Subsections found:', subsections);
      if (Array.isArray(subsections)) {
        setSubSections(subsections);
      } else {
        console.log('Subsections is not an array:', subsections);
        setSubSections([]);
      }
    } else {
      console.log('Section not found');
      setSubSections([]);
    }
  }, [sections]);

  // Fetch existing quiz data for editing
  useEffect(() => {
    if (selectedSection) {
      fetchSectionSubSections(selectedSection);
      setSelectedSubSection('');
    }
  }, [fetchSectionSubSections, selectedSection]);

  // Load existing quiz if in edit mode

  const findCourseForSection = useCallback(async (sectionId, subsectionId) => {
    try {
      // First, make sure we have courses loaded
      if (courses.length === 0) {
        await fetchInstructorCourses();
      }

      // If we have the preselected course ID from URL, use it directly
      if (preselectedCourseId) {
        setSelectedCourse(preselectedCourseId);
        await fetchCourseSections(preselectedCourseId);
        setSelectedSection(sectionId);
        setTimeout(() => {
          setSelectedSubSection(subsectionId);
          setShowQuizCreator(true);
        }, 500);
        return;
      }

      // Check each course to find which one contains this section
      for (let course of courses) {
        try {
          const response = await fetch(`${BASE_URL}/api/v1/course/getFullCourseDetails`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              courseId: course._id
            })
          });
          const courseData = await response.json();
          if (courseData.success) {
            // Try different possible data structures
            const courseContent = courseData.data?.courseContent || courseData.courseContent || courseData.data?.courseDetails?.courseContent || courseData.data?.sections || courseData.sections || [];

            // Check if this course contains our section (try different formats)
            const hasSection = courseContent.some(section => {
              const sectionIdToCheck = section._id || section.id;
              return sectionIdToCheck === sectionId;
            });
            if (hasSection) {
              // Set the course and fetch its sections
              setSelectedCourse(course._id);
              await fetchCourseSections(course._id);

              // Set the section
              setSelectedSection(sectionId);

              // Wait a bit for sections to load, then set subsection
              setTimeout(() => {
                setSelectedSubSection(subsectionId);
                setShowQuizCreator(true);
              }, 500);
              return;
            }
          }
        } catch (courseError) {
          // Continue checking other courses
          console.log('Error checking course:', course.courseName, courseError.message);
        }
      }

      // If we still can't find the course, try a simpler approach
      // Just use the first course and let the user select manually
      if (courses.length > 0) {
        toast.info('Please verify the course selection and proceed');
        setSelectedCourse(courses[0]._id);
        await fetchCourseSections(courses[0]._id);
        setSelectedSection(sectionId);
        setTimeout(() => {
          setSelectedSubSection(subsectionId);
          setShowQuizCreator(true);
        }, 500);
        return;
      }
      toast.error('Could not determine course for this quiz');
    } catch (error) {
      console.error('Error finding course:', error);
      toast.error('Error loading quiz course information');
    }
  }, [courses, fetchCourseSections, fetchInstructorCourses, preselectedCourseId, token]);
  const fetchExistingQuiz = useCallback(async quizId => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/v1/quiz/${quizId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        const quiz = data.data;
        setExistingQuiz(quiz);

        // Get subsection info
        const subsectionId = quiz.subSection?._id || quiz.subSection;
        const sectionId = quiz.subSection?.section?._id || quiz.subSection?.section;
        if (subsectionId && sectionId) {
          // Find the course that contains this section
          await findCourseForSection(sectionId, subsectionId);
        } else {
          toast.error('Quiz data is incomplete. Please try again.');
        }
      } else {
        toast.error('Failed to load quiz data');
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('Failed to load quiz data');
    } finally {
      setLoading(false);
    }
  }, [findCourseForSection, token]);

  // Find which course contains the given section
  useEffect(() => {
    if (editQuizId && token && courses.length > 0) {
      fetchExistingQuiz(editQuizId);
    }
  }, [editQuizId, token, courses, fetchExistingQuiz]);
  const handleProceedToQuizCreation = () => {
    if (!selectedCourse) {
      toast.error('Please select a course');
      return;
    }
    if (!selectedSection) {
      toast.error('Please select a section');
      return;
    }
    if (!selectedSubSection) {
      toast.error('Please select a lecture');
      return;
    }
    setShowQuizCreator(true);
  };
  const handleQuizCreated = () => {
    // Success message is already shown by QuizCreator component
    navigate('/dashboard/instructor/quiz-management');
  };
  const handleClose = () => {
    navigate('/dashboard/instructor/quiz-management');
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading quiz data...</p>
        </div>
      </div>;
  }
  if (showQuizCreator) {
    return <div className="space-y-6">
        {/* Header */}
        <div className="bg-richblack-800 rounded-lg p-6 border border-richblack-700">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => setShowQuizCreator(false)} className="p-2 bg-richblack-700 text-richblack-300 rounded-lg hover:bg-richblack-600 transition-colors">
              <RiArrowLeftLine className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-richblack-5">
                {existingQuiz ? 'Edit Quiz ✏️' : 'Create Advanced Quiz 🚀'}
              </h1>
              <p className="text-richblack-300 mt-1">
                Selected: {courses.find(c => c._id === selectedCourse)?.courseName} → {sections.find(s => s._id === selectedSection)?.sectionName} → {subSections.find(ss => ss._id === selectedSubSection)?.title}
              </p>
            </div>
          </div>
        </div>

        {/* Advanced Quiz Creator */}
        <div className="bg-richblack-800 rounded-lg border border-richblack-700">
          <QuizCreator subSectionId={selectedSubSection} existingQuiz={existingQuiz} onClose={handleClose} onSuccess={handleQuizCreated} />
        </div>
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate('/dashboard/instructor/quiz-management')} className="p-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 transition-colors">
            <RiArrowLeftLine className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Create New Quiz 📝
            </h1>
            <p className="text-slate-400 mt-2">
              Select the location for your quiz, then proceed to advanced quiz creation
            </p>
          </div>
        </div>
      </div>

      {/* Course Selection */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <h2 className="text-xl font-semibold text-white mb-4">📍 Select Quiz Location</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Course *
            </label>
            <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" required>
              <option value="">Select a course</option>
              {courses.map(course => <option key={course._id} value={course._id}>
                  {course.courseName}
                </option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Section *
            </label>
            <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" disabled={!selectedCourse} required>
              <option value="">Select a section</option>
              {sections.map(section => <option key={section._id} value={section._id}>
                  {section.sectionName}
                </option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Lecture *
            </label>
            <select value={selectedSubSection} onChange={e => setSelectedSubSection(e.target.value)} className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" disabled={!selectedSection} required>
              <option value="">Select a lecture</option>
              {subSections.map(subSection => <option key={subSection._id} value={subSection._id}>
                  {subSection.title}
                </option>)}
            </select>
          </div>
        </div>

        {/* Selection Summary */}
        {selectedCourse && selectedSection && selectedSubSection && <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">📋 Quiz Location Summary</h3>
            <div className="space-y-1 text-slate-300">
              <p><span className="text-purple-400">Course:</span> {courses.find(c => c._id === selectedCourse)?.courseName}</p>
              <p><span className="text-purple-400">Section:</span> {sections.find(s => s._id === selectedSection)?.sectionName}</p>
              <p><span className="text-purple-400">Lecture:</span> {subSections.find(ss => ss._id === selectedSubSection)?.title}</p>
            </div>
          </div>}
      </div>

      {/* Features Preview */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <h2 className="text-xl font-semibold text-white mb-4">🚀 Advanced Quiz Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
            <h3 className="font-semibold text-blue-400 mb-2">📝 Multiple Question Types</h3>
            <p className="text-sm text-slate-300">Multiple Choice, Single Answer, Short Answer, Match the Following, Code Solving</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-green-500/20 rounded-lg">
            <h3 className="font-semibold text-green-400 mb-2">⏱️ Timer & Validation</h3>
            <p className="text-sm text-slate-300">Customizable time limits, real-time validation, auto-save</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg">
            <h3 className="font-semibold text-orange-400 mb-2">💻 Code Challenges</h3>
            <p className="text-sm text-slate-300">Programming questions with test cases, multiple languages</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
            <h3 className="font-semibold text-purple-400 mb-2">🎯 Smart Keywords</h3>
            <p className="text-sm text-slate-300">Tag-based keyword system for short answer questions</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg">
            <h3 className="font-semibold text-cyan-400 mb-2">🔗 Match Questions</h3>
            <p className="text-sm text-slate-300">Interactive matching questions with drag-and-drop</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg">
            <h3 className="font-semibold text-yellow-400 mb-2">📊 Advanced Scoring</h3>
            <p className="text-sm text-slate-300">Custom marks per question, partial scoring, detailed analytics</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button onClick={() => navigate('/dashboard/instructor/quiz-management')} className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors">
          Cancel
        </button>
        <button onClick={handleProceedToQuizCreation} disabled={!selectedCourse || !selectedSection || !selectedSubSection} className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
          Proceed to Advanced Quiz Creator 🚀
        </button>
      </div>
    </div>;
};
export default InstructorCreateQuiz;
