import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { getStudentQuizPerformance } from "../../../services/operations/quizReportsAPI";
import { generateQuizPerformancePDF } from "../../../utils/generateQuizPerformancePDF";
import { toast } from "react-hot-toast";
export default function QuizPerformanceReport() {
  const {
    quizId,
    courseId
  } = useParams();
  const [searchParams] = useSearchParams();
  const attemptNumber = searchParams.get('attempt');
  const navigate = useNavigate();
  const {
    user
  } = useSelector(state => state.profile);
  const {
    token
  } = useSelector(state => state.auth);

  // Test message to verify component is rendering
  useEffect(() => {
    console.log('QuizPerformanceReport mounted with:', {
      quizId,
      courseId
    });
  }, [quizId, courseId]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [quizTitle, setQuizTitle] = useState("Quiz");
  const [courseName, setCourseName] = useState("Course");
  useEffect(() => {
    const fetchQuizPerformance = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate required parameters
        if (!user?._id || !token) {
          const errorMsg = "Authentication required - User not logged in";
          console.error(errorMsg);
          setError(errorMsg);
          setLoading(false);
          return;
        }
        if (!quizId || !courseId) {
          const errorMsg = `Missing required parameters - quizId: ${quizId}, courseId: ${courseId}`;
          console.error(errorMsg);
          setError("Invalid quiz or course reference");
          setLoading(false);
          return;
        }
        console.log('Fetching quiz performance with params:', {
          studentId: user._id,
          courseId,
          quizId
        });

        // Fetch student's quiz performance for the specific course
        const response = await getStudentQuizPerformance({
          token,
          studentId: user._id,
          courseId: courseId
        });
        console.log('API Response:', response);
        if (!response) {
          throw new Error("No response from server");
        }
        if (response.error) {
          throw new Error(response.message || "Failed to fetch quiz performance");
        }

        // If response is an array, find the specific attempt
        const performanceData = Array.isArray(response) ? response : response.performance || [];
        console.log('Performance data array:', performanceData);
        console.log('Looking for quizId:', quizId);
        console.log('Number of attempts found:', performanceData.length);

        // Find ALL attempts for this quiz ID (not just one)
        const quizAttempts = performanceData.filter(p => {
          // Handle both array and object formats
          let pQuizId;
          if (Array.isArray(p.quiz) && p.quiz.length > 0) {
            pQuizId = p.quiz[0]?._id?.toString();
          } else if (p.quiz?._id) {
            pQuizId = p.quiz._id.toString();
          } else if (typeof p.quiz === 'string') {
            pQuizId = p.quiz;
          }
          const searchQuizId = quizId?.toString();
          console.log('Comparing quiz IDs:', {
            pQuizId,
            searchQuizId,
            match: pQuizId === searchQuizId
          });
          return pQuizId === searchQuizId;
        });
        console.log('Found quiz attempts:', quizAttempts.length);
        if (quizAttempts.length === 0) {
          const errorMsg = `Quiz attempts not found. Total attempts found: ${performanceData.length}`;
          console.error(errorMsg, {
            performanceData
          });
          setError("Quiz attempts not found. It may have been deleted or you don't have permission to view it.");
          setLoading(false);
          return;
        }
        console.log('Found quiz attempts:', JSON.stringify(quizAttempts, null, 2));

        // Use the first attempt for quiz/course info
        const firstAttempt = quizAttempts[0];

        // Extract quiz and course information from first attempt
        const qTitle = Array.isArray(firstAttempt?.quiz) && firstAttempt.quiz.length > 0 ? firstAttempt.quiz[0]?.title : firstAttempt?.quiz?.title;
        const cName = Array.isArray(firstAttempt?.course) && firstAttempt.course.length > 0 ? firstAttempt.course[0]?.courseName : firstAttempt?.course?.courseName;
        setQuizTitle(qTitle || "Quiz");
        setCourseName(cName || "Course");

        // Format attempts data - filter for specific attempt if provided
        let attemptsToProcess = quizAttempts;
        if (attemptNumber) {
          console.log('Filtering for specific attempt number:', attemptNumber);
          attemptsToProcess = quizAttempts.filter(attempt => attempt.result?.attemptNumber?.toString() === attemptNumber.toString());
          console.log('Found specific attempt:', attemptsToProcess.length > 0);
        }
        const formattedAttempts = attemptsToProcess.map((attempt, index) => {
          console.log(`Processing attempt ${attempt.result?.attemptNumber || index + 1}:`, {
            score: attempt.result?.score,
            percentage: attempt.result?.percentage,
            passed: attempt.result?.passed,
            attemptNumber: attempt.result?.attemptNumber
          });
          return {
            score: attempt.result?.score ?? attempt.score ?? 0,
            totalMarks: attempt.result?.totalMarks ?? attempt.totalMarks ?? 0,
            percentage: attempt.result?.percentage ?? attempt.percentage ?? 0,
            passed: attempt.result?.passed ?? attempt.passed ?? false,
            attempts: attempt.result?.attempts ?? attempt.attempts ?? 1,
            attemptNumber: attempt.result?.attemptNumber ?? index + 1,
            completedAt: attempt.result?.completedAt ?? attempt.completedAt,
            timeTaken: attempt.result?.timeTaken ?? attempt.timeTaken
          };
        });
        console.log('Formatted attempts for display:', formattedAttempts);
        setQuizData({
          attempts: formattedAttempts,
          title: qTitle,
          course: cName
        });
      } catch (err) {
        console.error("Error fetching quiz performance:", err);
        setError("Failed to load quiz performance");
      } finally {
        setLoading(false);
      }
    };
    if (quizId && courseId) {
      fetchQuizPerformance();
    }
  }, [quizId, courseId, user._id, token, attemptNumber]);
  const handleDownloadPDF = () => {
    try {
      const studentName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || "Student";
      generateQuizPerformancePDF(quizData, quizTitle, courseName, studentName, user?.email || "");
      toast.success("Quiz report downloaded successfully!");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to generate PDF report");
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f0f1e] p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[#2a2a2a] animate-spin border-t-purple-400" />
            <div className="absolute inset-2 rounded-full border-2 border-[#1a1a1a] animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">📝</div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Loading quiz performance...</h3>
          <p className="text-[#888]">Analyzing your attempts</p>
        </div>
      </div>;
  }
  if (error) {
    return <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f0f1e] p-8">
        <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-6 rounded-lg max-w-2xl mx-auto">
          <h3 className="font-bold mb-2">Error Loading Report</h3>
          <p>{error}</p>
        </div>
      </div>;
  }
  if (!quizData) {
    return <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f0f1e] p-8">
        <div className="text-center text-[#888]">No data available</div>
      </div>;
  }
  const attempts = quizData.attempts || [];
  const totalAttempts = attempts.length;
  const passedAttempts = attempts.filter(a => a.passed).length;
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.percentage || 0)) : 0;
  const avgScore = attempts.length > 0 ? (attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length).toFixed(1) : 0;
  const latestAttempt = attempts.length > 0 ? attempts[0] : null;
  return <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f0f1e] p-4 md:p-8">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '1s'
      }}></div>
      </div>

      {/* Navigation Bar */}
      <div className="mb-6 relative z-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => navigate('/dashboard')} className="text-[#888] hover:text-purple-400 transition-colors flex items-center gap-1">
              🏠 Dashboard
            </button>
            <span className="text-[#666]">›</span>
            <button onClick={() => navigate('/dashboard/quiz-report')} className="text-[#888] hover:text-purple-400 transition-colors flex items-center gap-1">
              📊 Quiz Report
            </button>
            <span className="text-[#666]">›</span>
            <span className="text-purple-400 font-medium">Performance Details</span>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-colors flex items-center gap-2">
              ← Back
            </button>
            <button onClick={() => navigate('/dashboard/quiz-report')} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all flex items-center gap-2">
              📋 All Reports
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8 relative z-10">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30">
              <span className="text-2xl">📝</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-300 via-purple-400 to-purple-500 bg-clip-text text-transparent">
                {quizTitle}
              </h1>
              <p className="text-sm text-[#888] mt-1">
                {courseName} • Quiz Performance Report
                {attemptNumber && <span className="ml-2 px-2 py-1 bg-purple-500/20 text-purple-300 rounded-md text-xs font-medium">Attempt #{attemptNumber}</span>}
              </p>
            </div>
          </div>
          <button onClick={handleDownloadPDF} className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200 transform hover:scale-105">
            📄 Download PDF
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 relative z-10">
        {/* Total Attempts */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 transform hover:-translate-y-3">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-3">Total Attempts</p>
            <p className="text-5xl font-black text-purple-400">{totalAttempts}</p>
            <div className="h-2 w-16 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 mt-4 group-hover:w-24 transition-all duration-300 shadow-lg shadow-purple-500/50" />
          </div>
        </div>

        {/* Passed */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-2">Passed</p>
            <p className="text-4xl font-black text-green-400 mb-4">{passedAttempts}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#aaaaaa]">
                <span className="font-medium">Success Rate</span>
                <span className="font-bold text-green-400">
                  {totalAttempts > 0 ? (passedAttempts / totalAttempts * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#2a2a2a] overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-700" style={{
                width: `${totalAttempts > 0 ? passedAttempts / totalAttempts * 100 : 0}%`
              }} />
              </div>
            </div>
          </div>
        </div>

        {/* Best Score */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-2">Best Score</p>
            <p className="text-4xl font-black text-yellow-400 mb-4">{bestScore.toFixed(1)}%</p>
            <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500" />
          </div>
        </div>

        {/* Average Score */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-2">Avg. Score</p>
            <p className="text-4xl font-black text-blue-400 mb-4">{avgScore}%</p>
            <div className="h-2 rounded-full bg-[#2a2a2a] overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-700" style={{
              width: `${Math.min(100, Math.max(0, avgScore))}%`
            }} />
            </div>
          </div>
        </div>
      </div>

      {/* Attempt History */}
      <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl relative z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10">
          <h2 className="text-lg font-bold text-white mb-6">Attempt History</h2>

          {attempts.length > 0 ? <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#3a3a3a]">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#888]">Attempt</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#888]">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#888]">Percentage</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#888]">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#888]">Time Taken</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#888]">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt, idx) => <tr key={idx} className="border-b border-[#2a2a2a] hover:bg-[#1f1f1f]/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-[#aaa] font-medium">#{idx + 1}</td>
                      <td className="px-4 py-3 text-sm text-white">
                        {attempt.score}/{attempt.totalMarks}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-purple-400">
                        {attempt.percentage.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${attempt.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {attempt.passed ? '✓ Passed' : '✗ Failed'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#aaa]">
                        {attempt.timeTaken ? `${Math.round(attempt.timeTaken / 60)}m` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#aaa]">
                        {attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString('en-IN') : '-'}
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div> : <div className="text-center py-8 text-[#666]">
              <p>No attempt data available</p>
            </div>}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {/* Latest Attempt */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl">
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-white mb-4">Latest Attempt</h3>
            {latestAttempt ? <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#888]">Score:</span>
                  <span className="text-xl font-bold text-purple-400">
                    {latestAttempt.score}/{latestAttempt.totalMarks}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#888]">Percentage:</span>
                    <span className="text-xl font-bold text-purple-400">
                      {latestAttempt.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-[#2a2a2a] overflow-hidden">
                    <div className={`h-full transition-all duration-700 ${latestAttempt.passed ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{
                  width: `${Math.min(100, Math.max(0, latestAttempt.percentage))}%`
                }} />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#888]">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${latestAttempt.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {latestAttempt.passed ? '✓ Passed' : '✗ Failed'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#888]">Date:</span>
                  <span className="text-white">
                    {latestAttempt.completedAt ? new Date(latestAttempt.completedAt).toLocaleDateString('en-IN') : '-'}
                  </span>
                </div>
              </div> : <p className="text-[#666]">No attempts yet</p>}
          </div>
        </div>

        {/* Recommendation */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl">
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-white mb-4">Recommendation</h3>
            <p className="text-[#aaa] leading-relaxed">
              {passedAttempts > 0 ? "✓ Great job! You have successfully passed this quiz. Keep up the excellent work!" : totalAttempts >= 3 ? "Consider reviewing the course material and attempting again to improve your score." : totalAttempts > 0 ? "You have attempted this quiz. Review the material and try again to improve your performance." : "You have not attempted this quiz yet. Start now to test your knowledge!"}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="mt-12 pt-8 border-t border-[#3a3a3a] relative z-10">
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => navigate('/dashboard/quiz-report')} className="px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-xl transition-colors flex items-center gap-2 font-medium">
            📊 View All Quizzes
          </button>
          <button onClick={() => navigate(`/dashboard/course-performance/${courseId}`)} className="px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-xl transition-colors flex items-center gap-2 font-medium">
            📚 Course Report
          </button>
        </div>
      </div>
    </div>;
}
