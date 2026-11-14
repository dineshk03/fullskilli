import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getStudentQuizPerformance } from "../../../services/operations/quizReportsAPI";
import { generateCoursePerformancePDF } from "../../../utils/generateCoursePerformancePDF";
import { toast } from "react-hot-toast";
import { FiClock, FiAward, FiBarChart2, FiDownload, FiArrowRight } from "react-icons/fi";

// Add styles for the component

export default function CoursePerformanceReport() {
  const {
    courseId
  } = useParams();
  const {
    user
  } = useSelector(state => state.profile);
  const {
    token
  } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [courseName, setCourseName] = useState("Course");

  // Animation variants
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: {
      y: 20,
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    hover: {
      y: -5,
      transition: {
        duration: 0.2
      }
    }
  };

  // Helper functions
  const formatTimeTaken = timeValue => {
    if (!timeValue) return '-';

    // If timeValue is an object, try to find timeTaken or timeSpent in it
    if (typeof timeValue === 'object') {
      timeValue = timeValue.timeTaken || timeValue.timeSpent || timeValue.duration;
    }

    // Handle number (seconds)
    const seconds = Number(timeValue);
    if (!isNaN(seconds) && seconds >= 0) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}m ${secs}s`;
    }

    // Handle string time format (MM:SS or HH:MM:SS)
    if (typeof timeValue === 'string' && timeValue.includes(':')) {
      const timeParts = timeValue.split(':');
      if (timeParts.length >= 2) {
        const mins = parseInt(timeParts[timeParts.length - 2], 10) || 0;
        const secs = parseInt(timeParts[timeParts.length - 1], 10) || 0;
        return `${mins}m ${secs}s`;
      }
    }
    return '-';
  };
  const viewAttemptDetails = attemptData => {
    // Pass quiz ID and course ID to identify the specific attempt
    let quizId = attemptData?.quiz;

    // Handle array format from API
    if (Array.isArray(quizId) && quizId.length > 0) {
      quizId = quizId[0]?._id;
    } else if (typeof quizId === 'object' && quizId?._id) {
      quizId = quizId._id;
    }
    if (quizId && courseId) {
      navigate(`/dashboard/quiz-performance/${quizId}/${courseId}`);
    } else {
      toast.error('Unable to view attempt details');
    }
  };
  const formatDate = dateString => {
    if (!dateString) return '-';
    const options = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString('en-IN', options);
  };
  const getStatusBadge = passed => <span className={`px-3 py-1 rounded-full text-xs font-semibold ${passed ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
      {passed ? 'Passed' : 'Failed'}
    </span>;
  useEffect(() => {
    const fetchCoursePerformance = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching course performance data...');
        console.log('User ID:', user?._id);
        console.log('Course ID:', courseId);
        if (!user?._id || !token) {
          setError("Authentication required");
          return;
        }

        // Fetch student's quiz performance - don't pass courseId to avoid validation issues
        // We'll filter on the frontend instead
        const response = await getStudentQuizPerformance({
          token,
          studentId: user._id
        });
        if (response?.performance) {
          // Group performance by course - courseId can be either ObjectId or course name
          const coursePerformance = response.performance.filter(p => {
            const courseObj = Array.isArray(p?.course) && p.course.length > 0 ? p.course[0] : p?.course;

            // Match by _id (MongoDB ObjectId) or courseName (fallback)
            const pCourseId = courseObj?._id;
            const pCourseName = courseObj?.courseName;
            return pCourseId === courseId || pCourseName === courseId;
          });
          if (coursePerformance.length === 0) {
            setError("No quiz data found for this course");
            setLoading(false);
            return;
          }

          // Extract course name
          const firstPerformance = coursePerformance[0];
          const courseObj = Array.isArray(firstPerformance?.course) && firstPerformance.course.length > 0 ? firstPerformance.course[0] : firstPerformance?.course;
          const name = courseObj?.courseName;
          setCourseName(name || "Course");

          // Calculate statistics
          const stats = {
            totalQuizzes: 0,
            passedQuizzes: 0,
            failedQuizzes: 0,
            averageScore: 0
          };

          // Ensure coursePerformance is an array before processing
          const performanceData = Array.isArray(coursePerformance) ? coursePerformance : [];
          if (performanceData.length > 0) {
            stats.totalQuizzes = performanceData.length;
            stats.passedQuizzes = performanceData.filter(p => p?.result?.passed).length;
            stats.failedQuizzes = stats.totalQuizzes - stats.passedQuizzes;
            stats.averageScore = performanceData.reduce((sum, p) => sum + (p?.result?.percentage || 0), 0) / (stats.totalQuizzes || 1);
          }
          console.log('Course performance data received:', coursePerformance);

          // Log the first attempt's structure to find where time taken is stored
          if (coursePerformance.length > 0) {
            console.log('First attempt full structure:', JSON.stringify(coursePerformance[0], null, 2));

            // Check different possible locations for time taken
            const firstAttempt = coursePerformance[0];
            console.log('Checking time taken in different locations:');
            console.log('result.timeTaken:', firstAttempt?.result?.timeTaken);
            console.log('timeTaken:', firstAttempt?.timeTaken);
            console.log('timeSpent:', firstAttempt?.timeSpent);
            console.log('result.timeSpent:', firstAttempt?.result?.timeSpent);
            console.log('quiz.timeTaken:', firstAttempt?.quiz?.[0]?.timeTaken);
          }
          setCourseData({
            performance: coursePerformance,
            quizzes: coursePerformance,
            stats
          });
        } else {
          setError("Failed to load course performance data");
        }
      } catch (err) {
        console.error("Error fetching course performance:", err);
        setError("Failed to load course performance");
      } finally {
        setLoading(false);
      }
    };
    if (courseId) {
      fetchCoursePerformance();
    }
  }, [courseId, user?._id, token]);
  const handleDownloadPDF = () => {
    try {
      const studentName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || "Student";
      generateCoursePerformancePDF(courseData, courseName, studentName, user?.email || "");
      toast.success("Course report downloaded successfully!");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to generate PDF report");
    }
  };
  if (loading) {
    return <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FiBarChart2 className="h-6 w-6 text-blue-400 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-300 text-lg font-medium">Loading your performance data</p>
          <p className="text-gray-500 text-sm">Please wait while we prepare your report</p>
        </div>
      </motion.div>;
  }
  if (error) {
    return <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-red-500/20 max-w-md mx-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Error Loading Data</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="space-y-3">
            <button onClick={() => window.location.reload()} className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Try Again
            </button>
            <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-white transition-colors">
              ← Go back
            </button>
          </div>
        </div>
      </motion.div>;
  }
  if (!courseData) {
    return <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center p-8 max-w-md mx-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Course Data</h3>
          <p className="text-gray-400 mb-6">We couldn&apos;t find any data for this course.</p>
          <div className="space-y-3">
            <button onClick={() => navigate(-1)} className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </motion.div>;
  }
  const stats = courseData.stats || {};
  const {
    performance = []
  } = courseData || {
    performance: []
  };

  // Debug log to check the data
  console.log('Rendering with performance data:', performance);
  return <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '1s'
      }}></div>
      </div>

      {/* Header */}
      <motion.header initial={{
      y: -100,
      opacity: 0
    }} animate={{
      y: 0,
      opacity: 1
    }} transition={{
      duration: 0.6,
      ease: "easeOut"
    }} className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-xl relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <motion.h1 initial={{
              opacity: 0,
              y: -10
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.2
            }} className="text-3xl md:text-4xl font-bold text-white mb-2">
                Course Performance
              </motion.h1>
              <motion.p initial={{
              opacity: 0,
              y: -10
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.3
            }} className="text-blue-100 text-lg">
                {courseName}
              </motion.p>
            </div>
            <motion.button whileHover={{
            scale: 1.03
          }} whileTap={{
            scale: 0.98
          }} onClick={handleDownloadPDF} className="px-6 py-3 rounded-xl bg-white/90 text-blue-700 font-bold hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-blue-500/30 flex items-center gap-2 self-start md:self-auto">
              <FiDownload className="w-5 h-5" />
              Download PDF
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats Grid */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Quizzes */}
            <motion.div variants={itemVariants} whileHover="hover" className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-blue-400/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Quizzes</p>
                  <p className="mt-1 text-3xl font-bold text-blue-400">{stats.totalQuizzes || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <FiBarChart2 className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-700" style={{
                width: '100%'
              }}></div>
              </div>
            </motion.div>

            {/* Passed */}
            <motion.div variants={itemVariants} whileHover="hover" className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-green-400/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Passed</p>
                  <p className="mt-1 text-3xl font-bold text-green-400">{stats.passedQuizzes || 0}</p>
                  <p className="mt-1 text-sm text-gray-400">
                    {stats.totalQuizzes > 0 ? (stats.passedQuizzes / stats.totalQuizzes * 100).toFixed(1) : 0}% success rate
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10">
                  <FiAward className="h-6 w-6 text-green-400" />
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-700" style={{
                width: `${stats.totalQuizzes > 0 ? stats.passedQuizzes / stats.totalQuizzes * 100 : 0}%`
              }}></div>
              </div>
            </motion.div>

            {/* Average Score */}
            <motion.div variants={itemVariants} whileHover="hover" className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-purple-400/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Average Score</p>
                  <p className="mt-1 text-3xl font-bold text-purple-400">{(stats.averageScore || 0).toFixed(1)}%</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <FiBarChart2 className="h-6 w-6 text-purple-400" />
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-700" style={{
                width: `${Math.min(100, Math.max(0, stats.averageScore || 0))}%`
              }}></div>
              </div>
            </motion.div>

            {/* Time Spent */}
            <motion.div variants={itemVariants} whileHover="hover" className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-amber-400/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Avg. Time</p>
                  <p className="mt-1 text-3xl font-bold text-amber-400">
                    {formatTimeTaken(performance.reduce((acc, curr) => {
                    const time = curr.timeSpent || curr.result?.timeSpent || 0;
                    return acc + (Number(time) || 0);
                  }, 0) / Math.max(1, performance.length))}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <FiClock className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Quiz Attempts */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.2
        }} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Quiz Attempts</h2>
              <p className="text-gray-400">Detailed view of all your quiz performances</p>
            </div>

            {performance.length > 0 ? <div className="divide-y divide-white/5">
                {(() => {
              // Group quizzes by name
              const quizGroups = performance.reduce((acc, p) => {
                const quizData = Array.isArray(p.quiz) && p.quiz.length > 0 ? p.quiz[0] : p.quiz || {};
                const subSection = Array.isArray(p.subSection) && p.subSection.length > 0 ? p.subSection[0] : p.subSection || {};
                const quizName = subSection.title || subSection.name || quizData.title || quizData.name || 'Quiz';
                if (!acc[quizName]) {
                  acc[quizName] = [];
                }
                acc[quizName].push({
                  ...p,
                  quizName,
                  completedAt: p.result?.completedAt
                });
                return acc;
              }, {});
              return Object.entries(quizGroups).map(([quizName, attempts]) => <motion.div key={quizName} initial={{
                opacity: 0,
                y: 10
              }} animate={{
                opacity: 1,
                y: 0
              }} transition={{
                duration: 0.3
              }} className="group">
                      <div className="px-6 py-4 bg-gradient-to-r from-blue-500/5 to-transparent border-b border-white/5">
                        <h3 className="text-lg font-semibold text-blue-300">{quizName}</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {attempts.map((attempt, idx) => {
                    const percentage = attempt.result?.percentage || 0;
                    const passed = attempt.result?.passed;
                    const score = attempt.result?.score || 0;
                    const totalMarks = attempt.result?.totalMarks || 0;
                    const timeTaken = formatTimeTaken(attempt.timeSpent || attempt.result?.timeSpent);
                    const date = formatDate(attempt.result?.completedAt);
                    return <motion.div key={`${quizName}_${idx}`} variants={itemVariants} initial="hidden" animate="visible" whileHover="hover" className="bg-white/3 backdrop-blur-sm rounded-xl border border-white/10 p-5 transition-all duration-300 hover:border-blue-400/30 hover:shadow-lg hover:shadow-blue-500/5">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-white">
                                    Attempt {idx + 1}
                                  </h4>
                                  <p className="text-sm text-gray-400 mt-1">{date}</p>
                                </div>
                                {getStatusBadge(passed)}
                              </div>

                              <div className="mt-4 space-y-3">
                                {/* Score */}
                                <div>
                                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                                    <span>Score</span>
                                    <span className="font-medium text-white">
                                      {score}/{totalMarks} ({percentage.toFixed(1)}%)
                                    </span>
                                  </div>
                                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${passed ? 'bg-green-500' : 'bg-red-500'}`} style={{
                              width: `${Math.min(100, percentage)}%`
                            }}></div>
                                  </div>
                                </div>

                                {/* Time Taken */}
                                <div className="flex items-center text-sm text-gray-400">
                                  <FiClock className="mr-2 text-blue-400" />
                                  <span>Time: {timeTaken}</span>
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-white/5">
                                <button onClick={() => viewAttemptDetails(attempt)} className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-2">
                                  View Details <FiArrowRight className="w-4 h-4" />
                                </button>
                              </div>
                            </motion.div>;
                  })}
                      </div>
                    </motion.div>);
            })()}
              </div> : <div className="p-8 text-center">
                <div className="max-w-md mx-auto">
                  <div className="p-4 inline-flex items-center justify-center rounded-full bg-blue-500/10 mb-4">
                    <FiBarChart2 className="h-8 w-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No Quiz Data</h3>
                  <p className="text-gray-400">You haven&apos;t taken any quizzes for this course yet.</p>
                </div>
              </div>}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <motion.footer initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 0.4
    }} className="bg-gray-900/50 border-t border-white/5 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Beeja LMS. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 mt-2 md:mt-0">
              Report generated on {new Date().toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
            </p>
          </div>
        </div>
      </motion.footer>
    </div>;
}
