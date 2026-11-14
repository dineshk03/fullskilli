import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { getAdminQuizAnalytics, getAllStudentQuizPerformance } from '../../../services/operations/quizReportsAPI';
import { getAllCourses, fetchCourseCategories } from '../../../services/operations/courseDetailsAPI';
import { generateAdminQuizReportPDF } from '../../../utils/generateAdminQuizReportPDF';
import StudentDetailsAnalysis from './StudentDetailsAnalysis';
const AdminQuizAnalytics = () => {
  const {
    user
  } = useSelector(state => state.profile);
  const {
    token
  } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [studentPerformanceData, setStudentPerformanceData] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedQuiz, setSelectedQuiz] = useState('all');
  const [viewMode, setViewMode] = useState('overview'); // overview, students, quizzes, insights
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);

  // Fetch courses and categories for dropdown
  const fetchCoursesAndCategories = async () => {
    try {
      setCoursesLoading(true);
      console.log('🔄 Fetching courses and categories for dropdown...');

      // Fetch both courses and categories in parallel
      const [coursesData, categoriesData] = await Promise.all([getAllCourses(), fetchCourseCategories()]);
      console.log('📚 Courses fetched:', coursesData);
      console.log('📂 Categories fetched:', categoriesData);
      if (coursesData && Array.isArray(coursesData)) {
        setCourses(coursesData);
      } else {
        console.log('⚠️ No courses data or invalid format');
        setCourses([]);
      }
      if (categoriesData && Array.isArray(categoriesData)) {
        setCategories(categoriesData);
      } else {
        console.log('⚠️ No categories data or invalid format');
        setCategories([]);
      }
    } catch (error) {
      console.error('❌ Error fetching courses and categories:', error);
      toast.error('Failed to load courses and categories');
      setCourses([]);
      setCategories([]);
    } finally {
      setCoursesLoading(false);
    }
  };

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching analytics data...', {
        timeRange: selectedTimeRange,
        courseId: selectedCourse !== 'all' ? selectedCourse : null,
        quizId: selectedQuiz !== 'all' ? selectedQuiz : null,
        token: token ? 'Present' : 'Missing',
        userType: user?.accountType
      });

      // Check if user has admin access
      if (!user || user.accountType !== 'Admin') {
        console.error('❌ User is not admin:', user);
        toast.error('Admin access required for analytics');
        return;
      }
      if (!token) {
        console.error('❌ No authentication token');
        toast.error('Authentication required');
        return;
      }
      const [analyticsResponse, performanceResponse] = await Promise.all([getAdminQuizAnalytics(token, {
        timeRange: selectedTimeRange,
        courseId: selectedCourse !== 'all' ? selectedCourse : null,
        quizId: selectedQuiz !== 'all' ? selectedQuiz : null
      }), getAllStudentQuizPerformance(token, {
        courseId: selectedCourse !== 'all' ? selectedCourse : null
      })]);
      console.log('📊 Analytics Response:', analyticsResponse);
      console.log('👥 Performance Response:', performanceResponse);
      if (analyticsResponse?.success) {
        console.log('✅ Setting analytics data:', analyticsResponse.data);
        setAnalyticsData(analyticsResponse.data);
      } else {
        console.log('❌ Analytics response failed:', analyticsResponse);
        // Set default data structure if no data
        setAnalyticsData({
          summary: {
            totalAttempts: 0,
            uniqueStudents: 0,
            passedAttempts: 0,
            failedAttempts: 0,
            passRate: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0
          },
          scoreDistribution: [],
          dailyTrends: [],
          quizPerformance: [],
          studentInsights: {
            topPerformers: [],
            strugglingStudents: [],
            all: []
          }
        });
      }
      if (performanceResponse?.success) {
        console.log('✅ Setting performance data:', performanceResponse.data);
        setStudentPerformanceData(performanceResponse.data);
      } else {
        console.log('❌ Performance response failed:', performanceResponse);
        setStudentPerformanceData([]);
      }
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      toast.error(`Failed to load analytics data: ${error.message}`);

      // Set default data structure on error
      setAnalyticsData({
        summary: {
          totalAttempts: 0,
          uniqueStudents: 0,
          passedAttempts: 0,
          failedAttempts: 0,
          passRate: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0
        },
        scoreDistribution: [],
        dailyTrends: [],
        quizPerformance: [],
        studentInsights: {
          topPerformers: [],
          strugglingStudents: [],
          all: []
        }
      });
      setStudentPerformanceData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, selectedQuiz, selectedTimeRange, token, user]);
  useEffect(() => {
    console.log('🔄 useEffect triggered - fetching analytics data...');
    fetchAnalyticsData();
  }, [selectedTimeRange, selectedCourse, selectedQuiz, token, fetchAnalyticsData]);
  useEffect(() => {
    console.log('🔄 Component mounted - fetching courses and categories...');
    fetchCoursesAndCategories();
  }, []);

  // Generate individual reports
  const generateOverviewReport = () => {
    if (!analyticsData) {
      toast.error('No data available for report generation');
      return;
    }
    try {
      const filters = {
        timeRange: selectedTimeRange,
        courseId: selectedCourse !== 'all' ? selectedCourse : null,
        quizId: selectedQuiz !== 'all' ? selectedQuiz : null
      };
      generateAdminQuizReportPDF(analyticsData, filters, user?.firstName + ' ' + user?.lastName || 'Administrator', 'overview');
      toast.success('Overview report generated successfully!');
    } catch (error) {
      console.error('Error generating overview report:', error);
      toast.error('Failed to generate overview report');
    }
  };
  const generateStudentReport = () => {
    if (!studentPerformanceData || studentPerformanceData.length === 0) {
      toast.error('No student data available for report generation');
      return;
    }
    try {
      const filters = {
        timeRange: selectedTimeRange,
        courseId: selectedCourse !== 'all' ? selectedCourse : null,
        quizId: selectedQuiz !== 'all' ? selectedQuiz : null
      };
      const studentReportData = {
        ...analyticsData,
        studentInsights: {
          ...analyticsData?.studentInsights,
          all: studentPerformanceData
        }
      };
      generateAdminQuizReportPDF(studentReportData, filters, user?.firstName + ' ' + user?.lastName || 'Administrator', 'student-performance');
      toast.success('Student performance report generated successfully!');
    } catch (error) {
      console.error('Error generating student report:', error);
      toast.error('Failed to generate student report');
    }
  };
  const generateQuizReport = () => {
    if (!analyticsData?.quizPerformance || analyticsData.quizPerformance.length === 0) {
      toast.error('No quiz data available for report generation');
      return;
    }
    try {
      const filters = {
        timeRange: selectedTimeRange,
        courseId: selectedCourse !== 'all' ? selectedCourse : null,
        quizId: selectedQuiz !== 'all' ? selectedQuiz : null
      };
      generateAdminQuizReportPDF(analyticsData, filters, user?.firstName + ' ' + user?.lastName || 'Administrator', 'quiz-analysis');
      toast.success('Quiz analysis report generated successfully!');
    } catch (error) {
      console.error('Error generating quiz report:', error);
      toast.error('Failed to generate quiz report');
    }
  };
  const generateInsightsReport = () => {
    if (!analyticsData || !processedInsights) {
      toast.error('No insights data available for report generation');
      return;
    }
    try {
      const filters = {
        timeRange: selectedTimeRange,
        courseId: selectedCourse !== 'all' ? selectedCourse : null,
        quizId: selectedQuiz !== 'all' ? selectedQuiz : null
      };
      const insightsReportData = {
        ...analyticsData,
        processedInsights: processedInsights
      };
      generateAdminQuizReportPDF(insightsReportData, filters, user?.firstName + ' ' + user?.lastName || 'Administrator', 'insights');
      toast.success('Insights report generated successfully!');
    } catch (error) {
      console.error('Error generating insights report:', error);
      toast.error('Failed to generate insights report');
    }
  };

  // Generate course-wise analysis report
  const generateCourseWiseReport = () => {
    if (!analyticsData || !courses.length) {
      toast.error('No course data available for report generation');
      return;
    }
    try {
      const filters = {
        timeRange: selectedTimeRange,
        analysisType: 'course-wise'
      };
      const courseWiseData = {
        ...analyticsData,
        courses: courses,
        coursesByCategory: coursesByCategory
      };
      generateAdminQuizReportPDF(courseWiseData, filters, user?.firstName + ' ' + user?.lastName || 'Administrator', 'course-wise');
      toast.success('Course-wise analysis report generated successfully!');
    } catch (error) {
      console.error('Error generating course-wise report:', error);
      toast.error('Failed to generate course-wise report');
    }
  };

  // Generate lecture-wise analysis report
  const generateLectureWiseReport = () => {
    if (!analyticsData) {
      toast.error('No lecture data available for report generation');
      return;
    }
    try {
      const filters = {
        timeRange: selectedTimeRange,
        courseId: selectedCourse !== 'all' ? selectedCourse : null,
        analysisType: 'lecture-wise'
      };
      const lectureWiseData = {
        ...analyticsData,
        courses: courses,
        selectedCourseData: selectedCourse !== 'all' ? courses.find(c => c._id === selectedCourse) : null
      };
      generateAdminQuizReportPDF(lectureWiseData, filters, user?.firstName + ' ' + user?.lastName || 'Administrator', 'lecture-wise');
      toast.success('Lecture-wise analysis report generated successfully!');
    } catch (error) {
      console.error('Error generating lecture-wise report:', error);
      toast.error('Failed to generate lecture-wise report');
    }
  };

  // Generate individual quiz analysis report
  const generateQuizWiseReport = () => {
    if (!analyticsData?.quizPerformance || analyticsData.quizPerformance.length === 0) {
      toast.error('No individual quiz data available for report generation');
      return;
    }
    try {
      const filters = {
        timeRange: selectedTimeRange,
        courseId: selectedCourse !== 'all' ? selectedCourse : null,
        quizId: selectedQuiz !== 'all' ? selectedQuiz : null,
        analysisType: 'quiz-wise'
      };
      const quizWiseData = {
        ...analyticsData,
        selectedQuizData: selectedQuiz !== 'all' ? analyticsData.quizPerformance.find(q => q._id === selectedQuiz) : null
      };
      generateAdminQuizReportPDF(quizWiseData, filters, user?.firstName + ' ' + user?.lastName || 'Administrator', 'quiz-wise');
      toast.success('Quiz-wise analysis report generated successfully!');
    } catch (error) {
      console.error('Error generating quiz-wise report:', error);
      toast.error('Failed to generate quiz-wise report');
    }
  };

  // Organize courses by categories
  const coursesByCategory = useMemo(() => {
    if (!courses.length || !categories.length) return {};
    const organized = {};

    // Initialize categories
    categories.forEach(category => {
      organized[category._id] = {
        name: category.name,
        courses: []
      };
    });

    // Add uncategorized section
    organized['uncategorized'] = {
      name: 'Uncategorized',
      courses: []
    };

    // Organize courses by category
    courses.forEach(course => {
      console.log('🔍 Processing course:', course.courseName, 'Category:', course.category);

      // Handle different category reference formats
      let categoryId = null;
      if (course.category) {
        if (typeof course.category === 'object' && course.category._id) {
          categoryId = course.category._id;
        } else if (typeof course.category === 'string') {
          categoryId = course.category;
        }
      }
      if (categoryId && organized[categoryId]) {
        organized[categoryId].courses.push(course);
        console.log('✅ Added to category:', organized[categoryId].name);
      } else {
        organized['uncategorized'].courses.push(course);
        console.log('⚠️ Added to uncategorized');
      }
    });

    // Remove empty categories
    Object.keys(organized).forEach(key => {
      if (organized[key].courses.length === 0) {
        delete organized[key];
      }
    });
    return organized;
  }, [courses, categories]);

  // Process data for insights
  const processedInsights = useMemo(() => {
    if (!analyticsData || !studentPerformanceData.length) return null;
    const insights = {
      totalStudents: new Set(studentPerformanceData.map(s => s.userId)).size,
      totalQuizzes: analyticsData.summary?.totalAttempts || 0,
      averageScore: analyticsData.summary?.averageScore || 0,
      passRate: analyticsData.summary?.passRate || 0,
      // Performance trends
      topPerformers: studentPerformanceData.filter(s => s.result?.percentage >= 90).slice(0, 10),
      strugglingStudents: studentPerformanceData.filter(s => s.result?.percentage < 60).slice(0, 10),
      // Quiz difficulty analysis
      difficultQuizzes: studentPerformanceData.reduce((acc, curr) => {
        const quizId = curr.quiz?._id || curr.quiz?.id;
        if (!quizId) return acc;
        if (!acc[quizId]) {
          acc[quizId] = {
            quiz: curr.quiz,
            attempts: 0,
            totalScore: 0,
            passCount: 0
          };
        }
        acc[quizId].attempts++;
        acc[quizId].totalScore += curr.result?.percentage || 0;
        if (curr.result?.passed) acc[quizId].passCount++;
        return acc;
      }, {}),
      // Time-based insights
      dailyTrends: analyticsData.dailyTrends || [],
      scoreDistribution: analyticsData.scoreDistribution || []
    };

    // Calculate quiz difficulty scores
    insights.quizDifficultyRanking = Object.values(insights.difficultQuizzes).map(quiz => ({
      ...quiz,
      averageScore: quiz.attempts > 0 ? quiz.totalScore / quiz.attempts : 0,
      passRate: quiz.attempts > 0 ? quiz.passCount / quiz.attempts * 100 : 0,
      difficultyScore: quiz.attempts > 0 ? 100 - quiz.totalScore / quiz.attempts : 0
    })).sort((a, b) => b.difficultyScore - a.difficultyScore).slice(0, 10);
    return insights;
  }, [analyticsData, studentPerformanceData]);
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f0f1e] p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-[#2a2a2a] animate-spin border-t-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Loading Analytics...</h3>
            <p className="text-[#888]">Processing quiz data and insights</p>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f0f1e] p-4 md:p-8">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '1s'
      }}></div>
      </div>

      {/* Header */}
      <div className="mb-8 relative z-10 overflow-visible">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6 overflow-visible">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-300 via-blue-400 to-blue-500 bg-clip-text text-transparent">
                Quiz Analytics Dashboard
              </h1>
              <p className="text-sm text-[#888] mt-1">Comprehensive insights and performance analytics</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 overflow-visible">
            <button onClick={fetchAnalyticsData} disabled={loading} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50">
              {loading ? '🔄 Loading...' : '🔄 Refresh Data'}
            </button>
            
            <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all">
              ⚙️ Settings
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap bg-[#1a1a2e]/50 backdrop-blur-sm rounded-2xl p-4 border border-[#3a3a3a]">
          {/* Time Range Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#888]">Time Range:</label>
            <select value={selectedTimeRange} onChange={e => setSelectedTimeRange(e.target.value)} className="px-3 py-2 bg-[#2a2a2a] text-white rounded-lg border border-[#3a3a3a] focus:border-blue-500 focus:outline-none">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
            </select>
          </div>

          {/* Course Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#888]">Course:</label>
            <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} disabled={coursesLoading} className="px-3 py-2 bg-[#2a2a2a] text-white rounded-lg border border-[#3a3a3a] focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]">
              <option value="all">
                {coursesLoading ? 'Loading courses...' : '📚 All Courses'}
              </option>
              
              {Object.keys(coursesByCategory).length > 0 ? Object.entries(coursesByCategory).map(([categoryId, categoryData]) => <optgroup key={categoryId} label={`📂 ${categoryData.name} (${categoryData.courses.length} courses)`}>
                    {categoryData.courses.map(course => <option key={course._id} value={course._id}>
                        📖 {course.courseName}
                      </option>)}
                  </optgroup>) :
            // Fallback to simple list if categories aren't loaded
            courses.map(course => <option key={course._id} value={course._id}>
                    📖 {course.courseName}
                  </option>)}
            </select>
          </div>

          {/* Quiz Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#888]">Quiz:</label>
            <select value={selectedQuiz} onChange={e => setSelectedQuiz(e.target.value)} className="px-3 py-2 bg-[#2a2a2a] text-white rounded-lg border border-[#3a3a3a] focus:border-blue-500 focus:outline-none min-w-[180px]">
              <option value="all">📝 All Quizzes</option>
              {analyticsData?.quizPerformance?.map((quiz, index) => {
              // Create a meaningful quiz title
              let displayTitle = quiz.quizTitle;
              if (!displayTitle || displayTitle === 'Quiz') {
                displayTitle = `Quiz ${index + 1}`;
              }
              return <option key={quiz._id || index} value={quiz._id || index}>
                    🎯 {displayTitle}
                  </option>;
            })}
            </select>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-1 ml-auto">
            {[{
            key: 'overview',
            label: 'Overview',
            icon: '📊'
          }, {
            key: 'students',
            label: 'Students',
            icon: '👥'
          }, {
            key: 'quizzes',
            label: 'Quizzes',
            icon: '📝'
          }, {
            key: 'insights',
            label: 'Insights',
            icon: '💡'
          }, {
            key: 'detailed',
            label: 'Detailed Analysis',
            icon: '🔍'
          }].map(mode => <button key={mode.key} onClick={() => setViewMode(mode.key)} className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === mode.key ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'bg-[#2a2a2a] text-[#888] hover:text-white hover:bg-[#3a3a3a]'}`}>
                <span>{mode.icon}</span>
                <span className="hidden sm:inline">{mode.label}</span>
              </button>)}
          </div>
        </div>
      </div>


      {/* No Data Message */}
      {!loading && (!analyticsData || analyticsData?.summary?.totalAttempts === 0 && studentPerformanceData?.length === 0) && <div className="text-center py-16 relative z-10">
          <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-8 border border-[#3a3a3a] max-w-md mx-auto">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Quiz Data Available</h3>
            <p className="text-[#888] mb-4">
              There are no quiz attempts in the selected time range. 
              {selectedCourse !== 'all' && ' Try selecting "All Courses" or a different course.'}
            </p>
            <div className="text-sm text-[#666] bg-[#2a2a2a] rounded-lg p-3">
              <p><strong>Possible reasons:</strong></p>
              <ul className="text-left mt-2 space-y-1">
                <li>• No students have taken quizzes yet</li>
                <li>• Selected time range is too narrow</li>
                <li>• Course filter is too restrictive</li>
                <li>• Quizzes haven&apos;t been created yet</li>
              </ul>
            </div>
          </div>
        </div>}

      {/* Overview Dashboard */}
      {viewMode === 'overview' && analyticsData && (analyticsData?.summary?.totalAttempts > 0 || studentPerformanceData?.length > 0) && <div className="space-y-8 relative z-10">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Students */}
            <div className="group relative overflow-hidden rounded-3xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#888]">Total Students</p>
                    <p className="text-3xl font-black text-blue-400">{processedInsights?.totalStudents || 0}</p>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500 shadow-lg shadow-blue-500/50" />
              </div>
            </div>

            {/* Total Quiz Attempts */}
            <div className="group relative overflow-hidden rounded-3xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#888]">Quiz Attempts</p>
                    <p className="text-3xl font-black text-green-400">{analyticsData?.summary?.totalAttempts || 0}</p>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-green-400 to-green-500 shadow-lg shadow-green-500/50" />
              </div>
            </div>

            {/* Average Score */}
            <div className="group relative overflow-hidden rounded-3xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl shadow-lg">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#888]">Average Score</p>
                    <p className="text-3xl font-black text-yellow-400">{analyticsData?.summary?.averageScore?.toFixed(1) || 0}%</p>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-lg shadow-yellow-500/50" />
              </div>
            </div>

            {/* Pass Rate */}
            <div className="group relative overflow-hidden rounded-3xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl shadow-lg">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#888]">Pass Rate</p>
                    <p className="text-3xl font-black text-purple-400">{analyticsData?.summary?.passRate?.toFixed(1) || 0}%</p>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-purple-400 to-purple-500 shadow-lg shadow-purple-500/50" />
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Score Distribution Chart */}
            <div className="group relative overflow-hidden rounded-3xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span>📊</span>
                  Score Distribution
                </h3>
                
                {analyticsData?.scoreDistribution?.length > 0 ? <div className="space-y-4">
                    {analyticsData.scoreDistribution.map((bucket, index) => {
                const ranges = ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'];
                const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
                const total = analyticsData.scoreDistribution.reduce((sum, b) => sum + b.count, 0);
                const percentage = total > 0 ? bucket.count / total * 100 : 0;
                return <div key={index} className="flex items-center gap-4">
                          <div className="w-20 text-sm text-[#888]">{ranges[index]}</div>
                          <div className="flex-1 bg-[#2a2a2a] rounded-full h-3 overflow-hidden">
                            <div className={`h-full ${colors[index]} transition-all duration-1000 ease-out`} style={{
                      width: `${percentage}%`
                    }} />
                          </div>
                          <div className="w-16 text-sm text-white text-right">{bucket.count}</div>
                          <div className="w-12 text-xs text-[#888] text-right">{percentage.toFixed(1)}%</div>
                        </div>;
              })}
                  </div> : <div className="text-center text-[#888] py-8">
                    <p>No score distribution data available</p>
                  </div>}
              </div>
            </div>

            {/* Daily Trends Chart */}
            <div className="group relative overflow-hidden rounded-3xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span>📈</span>
                  Daily Activity Trends
                </h3>
                
                {analyticsData?.dailyTrends?.length > 0 ? <div className="space-y-3 max-h-64 overflow-y-auto">
                    {analyticsData.dailyTrends.slice(-7).map((day, index) => {
                const maxAttempts = Math.max(...analyticsData.dailyTrends.map(d => d.attempts));
                const attemptPercentage = maxAttempts > 0 ? day.attempts / maxAttempts * 100 : 0;
                const passPercentage = day.attempts > 0 ? day.passed / day.attempts * 100 : 0;
                return <div key={index} className="bg-[#2a2a2a]/50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white">{new Date(day._id).toLocaleDateString()}</span>
                            <span className="text-xs text-[#888]">{day.attempts} attempts</span>
                          </div>
                          
                          <div className="space-y-2">
                            {/* Total Attempts Bar */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#888] w-16">Total</span>
                              <div className="flex-1 bg-[#1a1a1a] rounded-full h-2">
                                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-1000" style={{
                          width: `${attemptPercentage}%`
                        }} />
                              </div>
                              <span className="text-xs text-blue-400 w-8">{day.attempts}</span>
                            </div>
                            
                            {/* Pass Rate Bar */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#888] w-16">Passed</span>
                              <div className="flex-1 bg-[#1a1a1a] rounded-full h-2">
                                <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-1000" style={{
                          width: `${passPercentage}%`
                        }} />
                              </div>
                              <span className="text-xs text-green-400 w-8">{day.passed}</span>
                            </div>
                          </div>
                        </div>;
              })}
                  </div> : <div className="text-center text-[#888] py-8">
                    <p>No daily trend data available</p>
                  </div>}
              </div>
            </div>
          </div>

          {/* Course Performance Overview */}
          <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span>🎓</span>
              Course Performance Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(coursesByCategory).map(([categoryId, categoryData]) => <div key={categoryId} className="bg-[#2a2a2a] rounded-2xl p-5 border border-[#3a3a3a]">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span>📂</span>
                    {categoryData.name}
                  </h4>
                  <div className="space-y-3">
                    {categoryData.courses.slice(0, 3).map(course => {
                // Debug: Check data structure
                console.log('🔍 Course:', course.courseName, 'ID:', course._id);
                console.log('📊 Student Performance Data:', studentPerformanceData);
                console.log('📋 Sample student:', studentPerformanceData?.[0]);

                // Try multiple approaches to match course data
                let courseStudents = [];
                let courseAttempts = 0;
                let courseAvgScore = 0;
                if (studentPerformanceData && studentPerformanceData.length > 0) {
                  // Approach 1: Check if courses array exists
                  courseStudents = studentPerformanceData.filter(student => {
                    if (student.courses && Array.isArray(student.courses)) {
                      return student.courses.some(courseId => courseId && courseId.toString() === course._id.toString());
                    }
                    return false;
                  });

                  // Approach 2: Check courseId field directly
                  if (courseStudents.length === 0) {
                    courseStudents = studentPerformanceData.filter(student => student.courseId && student.courseId.toString() === course._id.toString());
                  }

                  // Approach 3: Check courseNames array
                  if (courseStudents.length === 0) {
                    courseStudents = studentPerformanceData.filter(student => student.courseNames && student.courseNames.includes(course.courseName));
                  }
                  console.log('🎯 Found students for course:', courseStudents.length);
                  courseAttempts = courseStudents.reduce((total, student) => total + (student.totalAttempts || 0), 0);
                  courseAvgScore = courseStudents.length > 0 ? courseStudents.reduce((acc, student) => acc + (student.averageScore || 0), 0) / courseStudents.length : 0;
                }
                console.log('📈 Final results - Attempts:', courseAttempts, 'Avg Score:', courseAvgScore);
                return <div key={course._id} className="bg-[#1a1a1a] rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white truncate">
                              {course.courseName}
                            </span>
                            <span className="text-xs text-[#888]">{courseAttempts} attempts</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-[#2a2a2a] rounded-full h-2">
                              <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{
                        width: `${courseAvgScore}%`
                      }}></div>
                            </div>
                            <span className="text-xs text-blue-400 font-medium w-12 text-right">
                              {courseAvgScore.toFixed(1)}%
                            </span>
                          </div>
                        </div>;
              })}
                    {categoryData.courses.length > 3 && <div className="text-center">
                        <span className="text-xs text-[#888]">
                          +{categoryData.courses.length - 3} more courses
                        </span>
                      </div>}
                  </div>
                </div>)}
            </div>
          </div>

          {/* Quiz Performance Summary */}
          <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span>📝</span>
              Quiz Performance Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analyticsData?.quizPerformance?.slice(0, 8).map((quiz, index) => {
            const difficultyColor = quiz.averageScore >= 80 ? 'green' : quiz.averageScore >= 60 ? 'yellow' : 'red';
            const difficultyLabel = quiz.averageScore >= 80 ? 'Easy' : quiz.averageScore >= 60 ? 'Medium' : 'Hard';
            return <div key={quiz._id || index} className="bg-[#2a2a2a] rounded-xl p-4 border border-[#3a3a3a] hover:border-opacity-60 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-white truncate">
                        {quiz.quizTitle || `Quiz ${index + 1}`}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColor === 'green' ? 'bg-green-500/20 text-green-400' : difficultyColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                        {difficultyLabel}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#888]">Attempts:</span>
                        <span className="text-white font-medium">{quiz.totalAttempts || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#888]">Pass Rate:</span>
                        <span className="text-white font-medium">
                          {(quiz.passedAttempts / quiz.totalAttempts * 100 || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#888]">Avg Score:</span>
                        <span className="text-white font-medium">{(quiz.averageScore || 0).toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="bg-[#1a1a1a] rounded-full h-2">
                        <div className={`h-2 rounded-full ${difficultyColor === 'green' ? 'bg-gradient-to-r from-green-400 to-green-600' : difficultyColor === 'yellow' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gradient-to-r from-red-400 to-red-600'}`} style={{
                    width: `${quiz.averageScore || 0}%`
                  }}></div>
                      </div>
                    </div>
                  </div>;
          })}
            </div>
          </div>

          {/* Lecture-wise Performance Analysis */}
          <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span>📚</span>
              Lecture-wise Performance Analysis
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performing Lectures */}
              <div className="bg-[#2a2a2a] rounded-2xl p-5">
                <h4 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                  <span>🏆</span>
                  Top Performing Lectures
                </h4>
                <div className="space-y-3">
                  {analyticsData?.quizPerformance?.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0)).slice(0, 5).map((quiz, index) => <div key={quiz._id || index} className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-xl">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">
                          {quiz.quizTitle || `Quiz ${index + 1}`}
                        </p>
                        <p className="text-[#888] text-xs">
                          {quiz.totalAttempts} attempts • {(quiz.passedAttempts / quiz.totalAttempts * 100 || 0).toFixed(1)}% pass rate
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">{(quiz.averageScore || 0).toFixed(1)}%</p>
                      </div>
                    </div>)}
                </div>
              </div>

              {/* Challenging Lectures */}
              <div className="bg-[#2a2a2a] rounded-2xl p-5">
                <h4 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                  <span>⚠️</span>
                  Challenging Lectures
                </h4>
                <div className="space-y-3">
                  {analyticsData?.quizPerformance?.sort((a, b) => (a.averageScore || 0) - (b.averageScore || 0)).slice(0, 5).map((quiz, index) => <div key={quiz._id || index} className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-xl">
                      <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">
                          {quiz.quizTitle || `Quiz ${index + 1}`}
                        </p>
                        <p className="text-[#888] text-xs">
                          {quiz.totalAttempts} attempts • {(quiz.passedAttempts / quiz.totalAttempts * 100 || 0).toFixed(1)}% pass rate
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-red-400 font-bold">{(quiz.averageScore || 0).toFixed(1)}%</p>
                      </div>
                    </div>)}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Trends & Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Metrics */}
            <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>📊</span>
                Performance Metrics
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-xl">
                  <span className="text-[#888] text-sm">Highest Score</span>
                  <span className="text-green-400 font-bold">{analyticsData?.summary?.highestScore || 0}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-xl">
                  <span className="text-[#888] text-sm">Lowest Score</span>
                  <span className="text-red-400 font-bold">{analyticsData?.summary?.lowestScore || 0}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-xl">
                  <span className="text-[#888] text-sm">Unique Students</span>
                  <span className="text-blue-400 font-bold">{analyticsData?.summary?.uniqueStudents || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-xl">
                  <span className="text-[#888] text-sm">Total Quizzes</span>
                  <span className="text-purple-400 font-bold">{analyticsData?.quizPerformance?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>⚡</span>
                Quick Stats
              </h4>
              <div className="space-y-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl border border-blue-500/30">
                  <p className="text-2xl font-bold text-blue-400">{(analyticsData?.summary?.passedAttempts / analyticsData?.summary?.totalAttempts * 100 || 0).toFixed(1)}%</p>
                  <p className="text-xs text-[#888]">Success Rate</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl border border-green-500/30">
                  <p className="text-2xl font-bold text-green-400">{analyticsData?.summary?.passedAttempts || 0}</p>
                  <p className="text-xs text-[#888]">Passed Attempts</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl border border-red-500/30">
                  <p className="text-2xl font-bold text-red-400">{analyticsData?.summary?.failedAttempts || 0}</p>
                  <p className="text-xs text-[#888]">Failed Attempts</p>
                </div>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>📅</span>
                Activity Summary
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-[#2a2a2a] rounded-xl">
                  <p className="text-sm text-[#888]">Most Active Day</p>
                  <p className="text-white font-medium">
                    {analyticsData?.dailyTrends?.reduce((max, day) => day.attempts > (max?.attempts || 0) ? day : max, null)?._id ? new Date(analyticsData.dailyTrends.reduce((max, day) => day.attempts > (max?.attempts || 0) ? day : max, null)._id).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-[#2a2a2a] rounded-xl">
                  <p className="text-sm text-[#888]">Peak Attempts</p>
                  <p className="text-white font-medium">
                    {Math.max(...(analyticsData?.dailyTrends?.map(d => d.attempts) || [0]))} attempts
                  </p>
                </div>
                <div className="p-3 bg-[#2a2a2a] rounded-xl">
                  <p className="text-sm text-[#888]">Active Days</p>
                  <p className="text-white font-medium">
                    {analyticsData?.dailyTrends?.filter(d => d.attempts > 0).length || 0} days
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>}

      {/* Students Tab */}
      {viewMode === 'students' && <div className="space-y-8 relative z-10">
          {/* Tab Header with Export Button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Student Performance Analysis</h2>
              <p className="text-[#888] text-sm">Detailed insights into student quiz performance</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowStudentDetails(true)} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2">
                👥 Student Details Analysis
              </button>
              <button onClick={generateStudentReport} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2">
                📊 Export Student Report
              </button>
            </div>
          </div>

          {/* Student Performance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Performers */}
            <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
              <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                <span>🏆</span>
                Top Performers
              </h3>
              <div className="space-y-3">
                {/* Debug info */}
                {import.meta.env.MODE === 'development' && <div className="bg-gray-800 p-2 rounded text-xs text-yellow-400">
                    <div>Student Performance Data Length: {studentPerformanceData?.length || 0}</div>
                    <div>Processed Insights: {processedInsights ? 'Yes' : 'No'}</div>
                    <div>Top Performers: {processedInsights?.topPerformers?.length || 0}</div>
                  </div>}
                {studentPerformanceData?.filter(s => s.averageScore >= 90).slice(0, 5).map((student, index) => <div key={student.userId || index} className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-white font-medium">{student.studentName || 'Anonymous'}</p>
                        <p className="text-xs text-[#888]">{student.email || 'No email'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">{student.averageScore?.toFixed(1) || 0}%</p>
                      <p className="text-xs text-[#888]">{student.totalAttempts || 0} attempts</p>
                    </div>
                  </div>)}
                {(!studentPerformanceData || studentPerformanceData.filter(s => s.averageScore >= 90).length === 0) && <p className="text-[#888] text-center py-4">No top performers data available</p>}
              </div>
            </div>

            {/* Struggling Students */}
            <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
              <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                <span>⚠️</span>
                Need Attention
              </h3>
              <div className="space-y-3">
                {studentPerformanceData?.filter(s => s.averageScore < 60).slice(0, 5).map((student, index) => <div key={student.userId || index} className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        !
                      </div>
                      <div>
                        <p className="text-white font-medium">{student.studentName || 'Anonymous'}</p>
                        <p className="text-xs text-[#888]">{student.email || 'No email'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 font-bold">{student.averageScore?.toFixed(1) || 0}%</p>
                      <p className="text-xs text-[#888]">{student.totalAttempts || 0} attempts</p>
                    </div>
                  </div>)}
                {(!studentPerformanceData || studentPerformanceData.filter(s => s.averageScore < 60).length === 0) && <p className="text-[#888] text-center py-4">No struggling students data available</p>}
              </div>
            </div>

            {/* Performance Distribution */}
            <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a] hover:border-blue-500/50 transition-all group">
              <h3 className="text-xl font-bold text-blue-400 mb-6 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Performance Levels
              </h3>
              <div className="space-y-4">
                {[{
              level: 'Excellent',
              color: 'bg-gradient-to-r from-green-400 to-green-600',
              textColor: 'text-green-400',
              bgColor: 'bg-green-500/10',
              borderColor: 'border-green-500/30',
              icon: '🏆',
              count: studentPerformanceData?.filter(s => s.averageScore >= 90).length || 0,
              range: '90-100%'
            }, {
              level: 'Good',
              color: 'bg-gradient-to-r from-blue-400 to-blue-600',
              textColor: 'text-blue-400',
              bgColor: 'bg-blue-500/10',
              borderColor: 'border-blue-500/30',
              icon: '👍',
              count: studentPerformanceData?.filter(s => s.averageScore >= 75 && s.averageScore < 90).length || 0,
              range: '75-89%'
            }, {
              level: 'Average',
              color: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
              textColor: 'text-yellow-400',
              bgColor: 'bg-yellow-500/10',
              borderColor: 'border-yellow-500/30',
              icon: '📈',
              count: studentPerformanceData?.filter(s => s.averageScore >= 60 && s.averageScore < 75).length || 0,
              range: '60-74%'
            }, {
              level: 'Poor',
              color: 'bg-gradient-to-r from-red-400 to-red-600',
              textColor: 'text-red-400',
              bgColor: 'bg-red-500/10',
              borderColor: 'border-red-500/30',
              icon: '⚠️',
              count: studentPerformanceData?.filter(s => s.averageScore < 60).length || 0,
              range: '0-59%'
            }].map((item, index) => {
              const totalStudents = studentPerformanceData?.length || 1;
              const percentage = totalStudents > 0 ? item.count / totalStudents * 100 : 0;
              return <div key={index} className={`relative overflow-hidden rounded-xl p-4 border ${item.borderColor} ${item.bgColor} hover:scale-105 transition-all duration-300 group/item`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{item.icon}</div>
                          <div>
                            <h4 className={`font-bold text-lg ${item.textColor}`}>{item.level}</h4>
                            <p className="text-xs text-[#888]">{item.range}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-black ${item.textColor}`}>{item.count}</div>
                          <div className="text-xs text-[#888]">{percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-[#2a2a2a] rounded-full h-2 overflow-hidden">
                        <div className={`h-full ${item.color} transition-all duration-1000 ease-out rounded-full`} style={{
                    width: `${percentage}%`
                  }} />
                      </div>
                      
                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>;
            })}
              </div>
              
              {/* Summary Stats */}
              <div className="mt-6 pt-4 border-t border-[#3a3a3a]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#888]">Total Students:</span>
                  <span className="text-white font-bold">{studentPerformanceData?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Student Table */}
          <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a] hover:border-blue-500/30 transition-all group">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <span className="text-xl">👥</span>
                </div>
                All Students Performance
              </h3>
              <div className="text-sm text-[#888]">
                Click any row for detailed view
              </div>
            </div>
            
            {studentPerformanceData?.length > 0 ? <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gradient-to-r from-blue-500 to-purple-600">
                      <th className="text-left py-4 px-6 text-blue-400 font-bold uppercase tracking-wider">Student</th>
                      <th className="text-center py-4 px-4 text-blue-400 font-bold uppercase tracking-wider">Attempts</th>
                      <th className="text-center py-4 px-4 text-blue-400 font-bold uppercase tracking-wider">Passed</th>
                      <th className="text-center py-4 px-4 text-blue-400 font-bold uppercase tracking-wider">Avg Score</th>
                      <th className="text-center py-4 px-4 text-blue-400 font-bold uppercase tracking-wider">Best Score</th>
                      <th className="text-center py-4 px-4 text-blue-400 font-bold uppercase tracking-wider">Performance</th>
                      <th className="text-center py-4 px-4 text-blue-400 font-bold uppercase tracking-wider">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentPerformanceData.map((student, index) => <tr key={student.userId || index} onClick={() => setSelectedStudentDetail(student)} className="border-b border-[#2a2a2a] hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all duration-300 cursor-pointer group/row hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {(student.studentName || 'A').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-semibold group-hover/row:text-blue-300 transition-colors">
                                {student.studentName || 'Anonymous'}
                              </p>
                              <p className="text-xs text-[#888] group-hover/row:text-[#aaa] transition-colors">
                                {student.email || 'No email'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="text-center py-4 px-4">
                          <div className="bg-[#2a2a2a] rounded-lg px-3 py-1 inline-block">
                            <span className="text-white font-bold">{student.totalAttempts || 0}</span>
                          </div>
                        </td>
                        <td className="text-center py-4 px-4">
                          <div className="bg-green-500/20 rounded-lg px-3 py-1 inline-block">
                            <span className="text-green-400 font-bold">{student.passedAttempts || 0}</span>
                          </div>
                        </td>
                        <td className="text-center py-4 px-4">
                          <div className={`rounded-lg px-3 py-1 inline-block ${(student.averageScore || 0) >= 80 ? 'bg-green-500/20' : (student.averageScore || 0) >= 60 ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                            <span className={`font-bold ${(student.averageScore || 0) >= 80 ? 'text-green-400' : (student.averageScore || 0) >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {student.averageScore?.toFixed(1) || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="text-center py-4 px-4">
                          <div className="bg-blue-500/20 rounded-lg px-3 py-1 inline-block">
                            <span className="text-blue-400 font-bold">{student.highestScore || 0}%</span>
                          </div>
                        </td>
                        <td className="text-center py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${(student.averageScore || 0) >= 90 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : (student.averageScore || 0) >= 75 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : (student.averageScore || 0) >= 60 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                            {(student.averageScore || 0) >= 90 ? 'Excellent' : (student.averageScore || 0) >= 75 ? 'Good' : (student.averageScore || 0) >= 60 ? 'Average' : 'Poor'}
                          </span>
                        </td>
                        <td className="text-center py-4 px-4">
                          <div className="text-[#888] text-xs">
                            {student.lastAttempt ? new Date(student.lastAttempt).toLocaleDateString() : 'Never'}
                          </div>
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div> : <div className="text-center text-[#888] py-12">
                <div className="text-6xl mb-4 opacity-30">👥</div>
                <p className="text-lg font-semibold mb-2">No Student Performance Data</p>
                <p className="text-sm">Student performance data will appear here once quiz attempts are made.</p>
              </div>}
          </div>
        </div>}

      {/* Quizzes Tab */}
      {viewMode === 'quizzes' && <div className="space-y-8 relative z-10">
          {/* Tab Header with Export Button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Quiz Performance Analysis</h2>
              <p className="text-[#888] text-sm">Comprehensive quiz difficulty and performance metrics</p>
            </div>
            <button onClick={generateQuizReport} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2">
              📝 Export Quiz Report
            </button>
          </div>

          {/* Quiz Performance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Quizzes */}
            <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl">
                  <span className="text-2xl">📝</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#888]">Total Quizzes</p>
                  <p className="text-3xl font-black text-purple-400">{analyticsData?.quizPerformance?.length || 0}</p>
                </div>
              </div>
            </div>

            {/* Most Difficult */}
            <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-red-400 to-red-600 rounded-xl">
                  <span className="text-2xl">🔥</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#888]">Most Difficult</p>
                  <p className="text-lg font-black text-red-400">
                    {processedInsights?.quizDifficultyRanking?.[0]?.averageScore?.toFixed(1) || 0}%
                  </p>
                </div>
              </div>
            </div>

            {/* Easiest Quiz */}
            <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#888]">Easiest Quiz</p>
                  <p className="text-lg font-black text-green-400">
                    {processedInsights?.quizDifficultyRanking?.slice(-1)[0]?.averageScore?.toFixed(1) || 0}%
                  </p>
                </div>
              </div>
            </div>

            {/* Average Attempts */}
            <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
                  <span className="text-2xl">🔄</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#888]">Avg Attempts</p>
                  <p className="text-3xl font-black text-blue-400">
                    {analyticsData?.summary?.averageAttempts?.toFixed(1) || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quiz Difficulty Ranking */}
          <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span>🎯</span>
              Quiz Difficulty Analysis
            </h3>
            
            {processedInsights?.quizDifficultyRanking?.length > 0 ? <div className="space-y-4">
                {processedInsights.quizDifficultyRanking.map((quiz, index) => <div key={quiz._id || index} className="bg-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${index < 3 ? 'bg-red-500' : index < 6 ? 'bg-yellow-500' : 'bg-green-500'}`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{quiz.quizTitle || `Quiz ${index + 1}`}</h4>
                          <p className="text-xs text-[#888]">{quiz.totalAttempts} attempts by {quiz.uniqueStudents} students</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${quiz.averageScore >= 80 ? 'text-green-400' : quiz.averageScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {quiz.averageScore?.toFixed(1)}%
                        </p>
                        <p className="text-xs text-[#888]">avg score</p>
                      </div>
                    </div>
                    
                    {/* Progress bars */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#888] w-16">Pass Rate</span>
                        <div className="flex-1 bg-[#1a1a1a] rounded-full h-2">
                          <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-1000" style={{
                    width: `${quiz.passRate || 0}%`
                  }} />
                        </div>
                        <span className="text-xs text-green-400 w-12">{quiz.passRate?.toFixed(1)}%</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#888] w-16">Difficulty</span>
                        <div className="flex-1 bg-[#1a1a1a] rounded-full h-2">
                          <div className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-1000" style={{
                    width: `${quiz.difficultyScore || 0}%`
                  }} />
                        </div>
                        <span className="text-xs text-red-400 w-12">{quiz.difficultyScore?.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>)}
              </div> : <div className="text-center text-[#888] py-8">
                <p>No quiz performance data available</p>
              </div>}
          </div>

          {/* Quiz Performance Table */}
          <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span>📊</span>
              Detailed Quiz Analytics
            </h3>
            
            {analyticsData?.quizPerformance?.length > 0 ? <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#3a3a3a]">
                      <th className="text-left py-3 px-4 text-[#888] font-medium">Quiz</th>
                      <th className="text-center py-3 px-4 text-[#888] font-medium">Attempts</th>
                      <th className="text-center py-3 px-4 text-[#888] font-medium">Students</th>
                      <th className="text-center py-3 px-4 text-[#888] font-medium">Pass Rate</th>
                      <th className="text-center py-3 px-4 text-[#888] font-medium">Avg Score</th>
                      <th className="text-center py-3 px-4 text-[#888] font-medium">Best Score</th>
                      <th className="text-center py-3 px-4 text-[#888] font-medium">Difficulty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.quizPerformance.map((quiz, index) => <tr key={quiz._id || index} className="border-b border-[#2a2a2a] hover:bg-[#2a2a2a]/50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="text-white font-medium">{quiz.quizTitle || `Quiz ${index + 1}`}</p>
                        </td>
                        <td className="text-center py-3 px-4 text-white">{quiz.totalAttempts || 0}</td>
                        <td className="text-center py-3 px-4 text-blue-400">{quiz.uniqueStudents || 0}</td>
                        <td className="text-center py-3 px-4">
                          <span className={`font-bold ${(quiz.passRate || 0) >= 80 ? 'text-green-400' : (quiz.passRate || 0) >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {quiz.passRate?.toFixed(1) || 0}%
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`font-bold ${(quiz.averageScore || 0) >= 80 ? 'text-green-400' : (quiz.averageScore || 0) >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {quiz.averageScore?.toFixed(1) || 0}%
                          </span>
                        </td>
                        <td className="text-center py-3 px-4 text-purple-400 font-bold">{quiz.highestScore || 0}%</td>
                        <td className="text-center py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${(quiz.difficultyScore || 0) >= 70 ? 'bg-red-500/20 text-red-400' : (quiz.difficultyScore || 0) >= 40 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                            {(quiz.difficultyScore || 0) >= 70 ? 'Hard' : (quiz.difficultyScore || 0) >= 40 ? 'Medium' : 'Easy'}
                          </span>
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div> : <div className="text-center text-[#888] py-8">
                <p>No quiz data available</p>
              </div>}
          </div>
        </div>}

      {/* Insights Tab */}
      {viewMode === 'insights' && <div className="space-y-8 relative z-10">
          {/* Tab Header with Export Button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">AI-Powered Insights & Recommendations</h2>
              <p className="text-[#888] text-sm">Smart analytics and actionable recommendations for improvement</p>
            </div>
            <button onClick={generateInsightsReport} className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:shadow-lg hover:shadow-yellow-500/30 transition-all flex items-center gap-2">
              💡 Export Insights Report
            </button>
          </div>

          {/* Key Insights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Performance Trend */}
            <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
                  <span className="text-2xl">📈</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-400">Performance Trend</h3>
                  <p className="text-xs text-[#888]">Overall learning progress</p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-white text-sm">
                  {analyticsData?.summary?.passRate >= 70 ? "📊 Strong performance across the platform with good pass rates." : analyticsData?.summary?.passRate >= 50 ? "⚠️ Moderate performance. Some students need additional support." : "🚨 Low pass rates indicate need for curriculum review."}
                </p>
                <div className="bg-[#2a2a2a] rounded-lg p-3">
                  <p className="text-xs text-[#888] mb-1">Current Pass Rate</p>
                  <p className="text-2xl font-bold text-blue-400">{analyticsData?.summary?.passRate?.toFixed(1) || 0}%</p>
                </div>
              </div>
            </div>

            {/* Student Engagement */}
            <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-400">Student Engagement</h3>
                  <p className="text-xs text-[#888]">Participation analysis</p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-white text-sm">
                  {analyticsData?.summary?.averageAttempts >= 2 ? "✅ Students are actively retaking quizzes to improve scores." : "💡 Consider encouraging quiz retakes for better learning outcomes."}
                </p>
                <div className="bg-[#2a2a2a] rounded-lg p-3">
                  <p className="text-xs text-[#888] mb-1">Avg Attempts per Quiz</p>
                  <p className="text-2xl font-bold text-green-400">{analyticsData?.summary?.averageAttempts?.toFixed(1) || 0}</p>
                </div>
              </div>
            </div>

            {/* Content Difficulty */}
            <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-purple-400">Content Difficulty</h3>
                  <p className="text-xs text-[#888]">Quiz complexity analysis</p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-white text-sm">
                  {analyticsData?.summary?.averageScore >= 75 ? "🎓 Quizzes are well-balanced for current skill level." : analyticsData?.summary?.averageScore >= 60 ? "⚖️ Consider adjusting difficulty or providing more practice." : "📚 Content may be too challenging - review prerequisites."}
                </p>
                <div className="bg-[#2a2a2a] rounded-lg p-3">
                  <p className="text-xs text-[#888] mb-1">Average Score</p>
                  <p className="text-2xl font-bold text-purple-400">{analyticsData?.summary?.averageScore?.toFixed(1) || 0}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations Section */}
          <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span>💡</span>
              AI-Powered Recommendations
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* For Instructors */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
                  <span>👨‍🏫</span>
                  For Instructors
                </h4>
                <div className="space-y-3">
                  {[{
                condition: analyticsData?.summary?.passRate < 60,
                icon: "📚",
                text: "Review quiz content - low pass rates suggest material may be too difficult",
                priority: "high"
              }, {
                condition: processedInsights?.strugglingStudents?.length > 0,
                icon: "🎯",
                text: `${processedInsights?.strugglingStudents?.length || 0} students need additional support and intervention`,
                priority: "high"
              }, {
                condition: analyticsData?.summary?.averageAttempts < 1.5,
                icon: "🔄",
                text: "Encourage students to retake quizzes for better learning outcomes",
                priority: "medium"
              }, {
                condition: true,
                icon: "📊",
                text: "Create targeted practice materials for low-performing quiz topics",
                priority: "medium"
              }].filter(rec => rec.condition).map((recommendation, index) => <div key={index} className={`p-4 rounded-xl border-l-4 ${recommendation.priority === 'high' ? 'bg-red-500/10 border-red-500' : 'bg-yellow-500/10 border-yellow-500'}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{recommendation.icon}</span>
                        <div>
                          <p className="text-white text-sm">{recommendation.text}</p>
                          <p className={`text-xs mt-1 ${recommendation.priority === 'high' ? 'text-red-400' : 'text-yellow-400'}`}>
                            {recommendation.priority === 'high' ? 'High Priority' : 'Medium Priority'}
                          </p>
                        </div>
                      </div>
                    </div>)}
                </div>
              </div>

              {/* For Students */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
                  <span>🎓</span>
                  For Students
                </h4>
                <div className="space-y-3">
                  {[{
                condition: analyticsData?.summary?.averageScore < 70,
                icon: "📖",
                text: "Review course materials before attempting quizzes",
                priority: "high"
              }, {
                condition: analyticsData?.summary?.averageAttempts < 2,
                icon: "🔁",
                text: "Take advantage of multiple attempts to improve your understanding",
                priority: "medium"
              }, {
                condition: true,
                icon: "⏰",
                text: "Practice time management - review quiz time limits before starting",
                priority: "medium"
              }, {
                condition: processedInsights?.topPerformers?.length > 0,
                icon: "🏆",
                text: "Learn from top performers - consider forming study groups",
                priority: "low"
              }].filter(rec => rec.condition).map((recommendation, index) => <div key={index} className={`p-4 rounded-xl border-l-4 ${recommendation.priority === 'high' ? 'bg-red-500/10 border-red-500' : recommendation.priority === 'medium' ? 'bg-yellow-500/10 border-yellow-500' : 'bg-blue-500/10 border-blue-500'}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{recommendation.icon}</span>
                        <div>
                          <p className="text-white text-sm">{recommendation.text}</p>
                          <p className={`text-xs mt-1 ${recommendation.priority === 'high' ? 'text-red-400' : recommendation.priority === 'medium' ? 'text-yellow-400' : 'text-blue-400'}`}>
                            {recommendation.priority === 'high' ? 'High Priority' : recommendation.priority === 'medium' ? 'Medium Priority' : 'Low Priority'}
                          </p>
                        </div>
                      </div>
                    </div>)}
                </div>
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span>✅</span>
              Immediate Action Items
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[{
            title: "Review Struggling Students",
            description: `${processedInsights?.strugglingStudents?.length || 0} students need immediate attention`,
            action: "Contact & Support",
            urgency: "high",
            icon: "🚨"
          }, {
            title: "Analyze Difficult Quizzes",
            description: `${processedInsights?.quizDifficultyRanking?.filter(q => q.averageScore < 60).length || 0} quizzes have low pass rates`,
            action: "Review Content",
            urgency: "medium",
            icon: "📝"
          }, {
            title: "Celebrate Top Performers",
            description: `${processedInsights?.topPerformers?.length || 0} students showing excellent progress`,
            action: "Recognition",
            urgency: "low",
            icon: "🏆"
          }].map((item, index) => <div key={index} className={`p-4 rounded-xl border ${item.urgency === 'high' ? 'border-red-500 bg-red-500/5' : item.urgency === 'medium' ? 'border-yellow-500 bg-yellow-500/5' : 'border-green-500 bg-green-500/5'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{item.icon}</span>
                    <h4 className={`font-semibold ${item.urgency === 'high' ? 'text-red-400' : item.urgency === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-white text-sm mb-3">{item.description}</p>
                  <button className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${item.urgency === 'high' ? 'bg-red-500 hover:bg-red-600 text-white' : item.urgency === 'medium' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
                    {item.action}
                  </button>
                </div>)}
            </div>
          </div>
        </div>}

      {/* Detailed Analysis Tab */}
      {viewMode === 'detailed' && <div className="space-y-8 relative z-10">
          {/* Tab Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Detailed Analysis Reports</h2>
            <p className="text-[#888] text-lg">Generate comprehensive reports for granular insights</p>
          </div>

          {/* Report Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Course-wise Analysis */}
            <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-8 border border-[#3a3a3a] hover:border-blue-500/50 transition-all group">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🎓</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Course-wise Analysis</h3>
                <p className="text-[#888] mb-6 leading-relaxed">
                  Detailed performance breakdown for each course, including category-wise distribution, 
                  enrollment statistics, and comparative analysis across all courses.
                </p>
                <button onClick={generateCourseWiseReport} className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-blue-500/30">
                  📊 Generate Course Report
                </button>
              </div>
            </div>

            {/* Lecture-wise Analysis */}
            <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-8 border border-[#3a3a3a] hover:border-green-500/50 transition-all group">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">📚</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Lecture-wise Analysis</h3>
                <p className="text-[#888] mb-6 leading-relaxed">
                  In-depth analysis of quiz performance for each lecture/section, including 
                  completion rates, difficulty assessment, and student engagement metrics.
                </p>
                <button onClick={generateLectureWiseReport} className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-semibold flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-green-500/30">
                  📚 Generate Lecture Report
                </button>
              </div>
            </div>

            {/* Quiz-wise Analysis */}
            <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-8 border border-[#3a3a3a] hover:border-purple-500/50 transition-all group">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🎯</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Individual Quiz Analysis</h3>
                <p className="text-[#888] mb-6 leading-relaxed">
                  Comprehensive analysis of individual quiz performance, including question-level 
                  insights, attempt patterns, and detailed student response analytics.
                </p>
                <button onClick={generateQuizWiseReport} className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all font-semibold flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-purple-500/30">
                  🎯 Generate Quiz Report
                </button>
              </div>
            </div>
          </div>

          {/* Batch Export Section */}
          <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-8 border border-[#3a3a3a]">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Batch Export</h3>
              <p className="text-[#888] mb-6">Generate all detailed analysis reports at once for comprehensive insights</p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <button onClick={() => {
              generateCourseWiseReport();
              generateLectureWiseReport();
              generateQuizWiseReport();
            }} className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all font-semibold flex items-center gap-3 hover:shadow-lg hover:shadow-yellow-500/30">
                  📦 All Detailed Reports
                  <span className="text-sm bg-yellow-700 px-2 py-1 rounded-full">3 PDFs</span>
                </button>
                
                <button onClick={() => {
              generateOverviewReport();
              generateStudentReport();
              generateQuizReport();
              generateInsightsReport();
              generateCourseWiseReport();
              generateLectureWiseReport();
              generateQuizWiseReport();
            }} className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-semibold flex items-center gap-3 hover:shadow-lg hover:shadow-red-500/30">
                  🚀 Complete Report Suite
                  <span className="text-sm bg-red-700 px-2 py-1 rounded-full">7 PDFs</span>
                </button>
              </div>
            </div>
          </div>

          {/* Current Filters Info */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-500/20">
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span>ℹ️</span>
              Current Filter Settings
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-[#888]">Time Range:</span>
                <span className="text-white ml-2 font-medium">
                  Last {selectedTimeRange} days
                </span>
              </div>
              <div>
                <span className="text-[#888]">Course:</span>
                <span className="text-white ml-2 font-medium">
                  {selectedCourse === 'all' ? 'All Courses' : courses.find(c => c._id === selectedCourse)?.courseName || 'Selected Course'}
                </span>
              </div>
              <div>
                <span className="text-[#888]">Quiz:</span>
                <span className="text-white ml-2 font-medium">
                  {selectedQuiz === 'all' ? 'All Quizzes' : 'Selected Quiz'}
                </span>
              </div>
            </div>
            <p className="text-xs text-[#888] mt-3">
              All generated reports will include data based on these filter settings.
            </p>
          </div>
        </div>}

      {/* Student Details Analysis Modal */}
      {showStudentDetails && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] rounded-3xl border border-[#3a3a3a] w-full h-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#3a3a3a] bg-gradient-to-r from-[#1a1a2e] to-[#16213e] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <span className="text-xl">👥</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Student Details Analysis</h2>
                  <p className="text-[#888] text-sm">Comprehensive individual student performance analysis</p>
                </div>
              </div>
              <button onClick={() => setShowStudentDetails(false)} className="p-3 text-[#888] hover:text-white hover:bg-red-500/20 rounded-xl transition-all text-xl font-bold border border-[#3a3a3a] hover:border-red-500/50">
                ✕ Close
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <StudentDetailsAnalysis />
            </div>
          </div>
        </div>}

      {/* Student Detail Modal */}
      {selectedStudentDetail && <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" style={{
      zIndex: 2147483647,
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
          <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] border border-[#3a3a3a] rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative" style={{
        zIndex: 2147483647,
        position: 'relative'
      }}>
            {/* Modal Header */}
            <div className="p-6 border-b border-[#3a3a3a] bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {(selectedStudentDetail.studentName || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">
                      {selectedStudentDetail.studentName || 'Anonymous Student'}
                    </h3>
                    <p className="text-blue-400">{selectedStudentDetail.email || 'No email provided'}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStudentDetail(null)} className="text-[#888] hover:text-white transition-colors p-2 hover:bg-red-500/20 rounded-xl text-xl font-bold border border-[#3a3a3a] hover:border-red-500/50">
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Performance Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-4 border border-blue-500/30">
                  <div className="text-center">
                    <div className="text-2xl font-black text-blue-400">{selectedStudentDetail.totalAttempts || 0}</div>
                    <div className="text-xs text-blue-300 uppercase tracking-wider">Total Attempts</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-4 border border-green-500/30">
                  <div className="text-center">
                    <div className="text-2xl font-black text-green-400">{selectedStudentDetail.passedAttempts || 0}</div>
                    <div className="text-xs text-green-300 uppercase tracking-wider">Passed</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl p-4 border border-yellow-500/30">
                  <div className="text-center">
                    <div className="text-2xl font-black text-yellow-400">{selectedStudentDetail.averageScore?.toFixed(1) || 0}%</div>
                    <div className="text-xs text-yellow-300 uppercase tracking-wider">Average Score</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-4 border border-purple-500/30">
                  <div className="text-center">
                    <div className="text-2xl font-black text-purple-400">{selectedStudentDetail.highestScore || 0}%</div>
                    <div className="text-xs text-purple-300 uppercase tracking-wider">Best Score</div>
                  </div>
                </div>
              </div>

              {/* Course Enrollment */}
              <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span>📚</span>
                  Enrolled Courses
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedStudentDetail.courseNames?.map((courseName, index) => <div key={index} className="bg-[#1a1a1a] rounded-lg p-3 border border-[#3a3a3a]">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400">📖</span>
                        <span className="text-white font-medium">{courseName}</span>
                      </div>
                    </div>) || <div className="col-span-2 text-center text-[#888] py-4">
                      No course information available
                    </div>}
                </div>
              </div>

              {/* Quiz Results */}
              <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span>🎯</span>
                  Quiz Attempts History
                </h4>
                {selectedStudentDetail.quizResults?.length > 0 ? <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedStudentDetail.quizResults.map((quiz, index) => <div key={index} className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${quiz.passed ? 'bg-green-400' : 'bg-red-400'}`}></span>
                            <span className="text-white font-medium">Quiz Attempt #{index + 1}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`font-bold ${quiz.passed ? 'text-green-400' : 'text-red-400'}`}>
                              {quiz.percentage?.toFixed(1) || 0}%
                            </span>
                            <span className="text-xs text-[#888]">
                              {quiz.completedAt ? new Date(quiz.completedAt).toLocaleDateString() : 'Unknown date'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#888]">
                            Score: {quiz.score || 0}/{quiz.totalMarks || 0}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${quiz.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {quiz.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                      </div>)}
                  </div> : <div className="text-center text-[#888] py-8">
                    <div className="text-4xl mb-2 opacity-30">📝</div>
                    <p>No quiz attempts found</p>
                  </div>}
              </div>

              {/* Performance Insights */}
              <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span>💡</span>
                  Performance Insights
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#888]">Performance Level:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${(selectedStudentDetail.averageScore || 0) >= 90 ? 'bg-green-500/20 text-green-400' : (selectedStudentDetail.averageScore || 0) >= 75 ? 'bg-blue-500/20 text-blue-400' : (selectedStudentDetail.averageScore || 0) >= 60 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                        {(selectedStudentDetail.averageScore || 0) >= 90 ? 'EXCELLENT' : (selectedStudentDetail.averageScore || 0) >= 75 ? 'GOOD' : (selectedStudentDetail.averageScore || 0) >= 60 ? 'AVERAGE' : 'NEEDS IMPROVEMENT'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#888]">Success Rate:</span>
                      <span className="text-white font-bold">
                        {selectedStudentDetail.totalAttempts > 0 ? (selectedStudentDetail.passedAttempts / selectedStudentDetail.totalAttempts * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#888]">Last Activity:</span>
                      <span className="text-white">
                        {selectedStudentDetail.lastAttempt ? new Date(selectedStudentDetail.lastAttempt).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#888]">Total Courses:</span>
                      <span className="text-white font-bold">{selectedStudentDetail.courseNames?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>}
    </div>;
};
export default AdminQuizAnalytics;
