import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { RiArrowLeftLine, RiBarChartLine, RiUserLine, RiFileTextLine } from 'react-icons/ri';
import { BASE_URL } from '../../../config/api';
const InstructorQuizAnalytics = () => {
  const {
    quizId
  } = useParams();
  const navigate = useNavigate();
  const {
    token
  } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const fetchQuizAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch quiz details
      const quizResponse = await fetch(`${BASE_URL}/api/v1/quiz/${quizId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const quizData = await quizResponse.json();
      if (quizData.success) {
        setQuiz(quizData.data);
      }

      // Fetch quiz results/attempts
      const resultsResponse = await fetch(`${BASE_URL}/api/v1/quiz/results/${quizId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const resultsData = await resultsResponse.json();
      if (resultsData.success) {
        const attemptsList = resultsData.data || [];
        setAttempts(attemptsList);

        // Calculate analytics
        if (attemptsList.length > 0) {
          const totalAttempts = attemptsList.length;
          const passedAttempts = attemptsList.filter(attempt => attempt.passed).length;
          const averageScore = attemptsList.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0) / totalAttempts;
          const highestScore = Math.max(...attemptsList.map(attempt => attempt.percentage || 0));
          const lowestScore = Math.min(...attemptsList.map(attempt => attempt.percentage || 0));
          setAnalytics({
            totalAttempts,
            passedAttempts,
            failedAttempts: totalAttempts - passedAttempts,
            passRate: passedAttempts / totalAttempts * 100,
            averageScore,
            highestScore,
            lowestScore
          });
        } else {
          setAnalytics({
            totalAttempts: 0,
            passedAttempts: 0,
            failedAttempts: 0,
            passRate: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching quiz analytics:', error);
      toast.error('Failed to load quiz analytics');
    } finally {
      setLoading(false);
    }
  }, [quizId, token]);
  useEffect(() => {
    if (quizId && token) {
      fetchQuizAnalytics();
    }
  }, [fetchQuizAnalytics, quizId, token]);
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading quiz analytics...</p>
        </div>
      </div>;
  }
  if (!quiz) {
    return <div className="text-center py-12">
        <p className="text-slate-400">Quiz not found</p>
        <button onClick={() => navigate('/dashboard/instructor/quiz-management')} className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
          Back to Quiz Management
        </button>
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Quiz Analytics 📊
            </h1>
            <p className="text-slate-400 mt-2">
              Performance insights for &quot;{quiz.title}&quot;
            </p>
          </div>
        </div>
      </div>

      {/* Quiz Info */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <h2 className="text-xl font-semibold text-white mb-4">Quiz Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <RiFileTextLine className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Questions</p>
                <p className="text-2xl font-bold text-white">{quiz.questions?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 text-green-400 flex items-center justify-center">⏱️</div>
              <div>
                <p className="text-sm text-slate-400">Time Limit</p>
                <p className="text-2xl font-bold text-white">{Math.floor((quiz.timeLimit || 0) / 60)}m</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 text-orange-400 flex items-center justify-center">🎯</div>
              <div>
                <p className="text-sm text-slate-400">Total Marks</p>
                <p className="text-2xl font-bold text-white">{quiz.questions?.reduce((sum, q) => sum + (q.marks || 0), 0) || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 text-purple-400 flex items-center justify-center">📈</div>
              <div>
                <p className="text-sm text-slate-400">Status</p>
                <p className="text-lg font-bold text-white">{quiz.status || 'Draft'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <RiBarChartLine className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Attempts</p>
                <p className="text-3xl font-bold text-white">{analytics.totalAttempts}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <div className="w-8 h-8 text-green-400 flex items-center justify-center text-xl">✅</div>
              </div>
              <div>
                <p className="text-sm text-slate-400">Passed</p>
                <p className="text-3xl font-bold text-white">{analytics.passedAttempts}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <div className="w-8 h-8 text-red-400 flex items-center justify-center text-xl">❌</div>
              </div>
              <div>
                <p className="text-sm text-slate-400">Failed</p>
                <p className="text-3xl font-bold text-white">{analytics.failedAttempts}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <div className="w-8 h-8 text-purple-400 flex items-center justify-center text-xl">📊</div>
              </div>
              <div>
                <p className="text-sm text-slate-400">Pass Rate</p>
                <p className="text-3xl font-bold text-white">{analytics.passRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>}

      {/* Score Statistics */}
      {analytics && analytics.totalAttempts > 0 && <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h2 className="text-xl font-semibold text-white mb-4">Score Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Average Score</p>
              <p className="text-4xl font-bold text-blue-400">{analytics.averageScore.toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Highest Score</p>
              <p className="text-4xl font-bold text-green-400">{analytics.highestScore}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Lowest Score</p>
              <p className="text-4xl font-bold text-red-400">{analytics.lowestScore}%</p>
            </div>
          </div>
        </div>}

      {/* Recent Attempts */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Attempts</h2>
        {attempts.length > 0 ? <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400">Student</th>
                  <th className="text-left py-3 px-4 text-slate-400">Score</th>
                  <th className="text-left py-3 px-4 text-slate-400">Percentage</th>
                  <th className="text-left py-3 px-4 text-slate-400">Status</th>
                  <th className="text-left py-3 px-4 text-slate-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {attempts.slice(0, 10).map((attempt, index) => <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="py-3 px-4 text-white">
                      {attempt.student?.firstName} {attempt.student?.lastName}
                    </td>
                    <td className="py-3 px-4 text-white">
                      {attempt.score}/{attempt.totalMarks}
                    </td>
                    <td className="py-3 px-4 text-white">{attempt.percentage}%</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${attempt.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {attempt.passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(attempt.completedAt).toLocaleDateString()}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div> : <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 text-slate-400">
              <RiUserLine className="w-full h-full" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Attempts Yet</h3>
            <p className="text-slate-400">
              Students haven&apos;t taken this quiz yet
            </p>
          </div>}
      </div>
    </div>;
};
export default InstructorQuizAnalytics;
