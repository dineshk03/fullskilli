import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getStudentQuizPerformance } from "../../../services/operations/quizReportsAPI";
import { generateCourseMarksheetPDF } from "../../../utils/generateMarksheetPDF";
import { toast } from "react-hot-toast";

export default function CourseMarksheet() {
  const { courseId } = useParams();
  const { user } = useSelector((state) => state.profile);
  const { token } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [courseName, setCourseName] = useState("Course");

  useEffect(() => {
    const fetchCourseMarksheet = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user?._id || !token) {
          setError("Authentication required");
          return;
        }

        const response = await getStudentQuizPerformance({
          token,
          studentId: user._id,
          courseId
        });

        if (response?.performance) {
          const coursePerformance = response.performance.filter(p => {
            const pCourseId = Array.isArray(p?.course) && p.course.length > 0
              ? p.course[0]?._id
              : p?.course?._id;
            return pCourseId === courseId;
          });

          if (coursePerformance.length === 0) {
            setError("No quiz data found for this course");
            setLoading(false);
            return;
          }

          const firstPerformance = coursePerformance[0];
          const name = Array.isArray(firstPerformance?.course) && firstPerformance.course.length > 0
            ? firstPerformance.course[0]?.courseName
            : firstPerformance?.course?.courseName;
          setCourseName(name || "Course");

          setCourseData({
            performance: coursePerformance,
            courseName: name
          });
        } else {
          setError("Failed to load course marksheet data");
        }
      } catch (err) {
        console.error("Error fetching course marksheet:", err);
        setError("Failed to load course marksheet");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseMarksheet();
    }
  }, [courseId, user?._id, token]);

  const handleDownloadMarksheet = () => {
    try {
      const studentName = user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.email || "Student";

      generateCourseMarksheetPDF(courseData, courseName, studentName, user?.email || "");
      toast.success("Course marksheet downloaded successfully!");
    } catch (error) {
      console.error("Error downloading marksheet:", error);
      toast.error("Failed to generate marksheet");
    }
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    return 'F';
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-green-400 bg-green-500/20';
      case 'B+':
      case 'B':
        return 'text-blue-400 bg-blue-500/20';
      case 'C+':
      case 'C':
        return 'text-yellow-400 bg-yellow-500/20';
      default:
        return 'text-red-400 bg-red-500/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f0f1e] p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[#2a2a2a] animate-spin border-t-green-400" />
            <div className="absolute inset-2 rounded-full border-2 border-[#1a1a1a] animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">📋</div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Loading course marksheet...</h3>
          <p className="text-[#888]">Compiling your grades</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f0f1e] p-8">
        <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-6 rounded-lg max-w-2xl mx-auto">
          <h3 className="font-bold mb-2">Error Loading Marksheet</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f0f1e] p-8">
        <div className="text-center text-[#888]">No data available</div>
      </div>
    );
  }

  const performance = courseData.performance || [];
  const totalQuizzes = performance.length;
  const passedQuizzes = performance.filter(p => p.result?.passed).length;
  const failedQuizzes = totalQuizzes - passedQuizzes;
  const avgScore = performance.length > 0
    ? performance.reduce((sum, p) => sum + (p.result?.percentage || 0), 0) / performance.length
    : 0;
  const grade = getGrade(avgScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f0f1e] p-4 md:p-8">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <div className="mb-8 relative z-10">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg shadow-green-500/30">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-green-300 via-green-400 to-green-500 bg-clip-text text-transparent">
                {courseName}
              </h1>
              <p className="text-sm text-[#888] mt-1">Course Marksheet - Quiz-wise Performance</p>
            </div>
          </div>
          <button
            onClick={handleDownloadMarksheet}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200 transform hover:scale-105"
          >
            📄 Download Marksheet
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 relative z-10">
        {/* Total Quizzes */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-green-500/40 transition-all duration-300 transform hover:-translate-y-3">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-3">Total Quizzes</p>
            <p className="text-5xl font-black text-green-400">{totalQuizzes}</p>
            <div className="h-2 w-16 rounded-full bg-gradient-to-r from-green-400 to-green-500 mt-4 group-hover:w-24 transition-all duration-300 shadow-lg shadow-green-500/50" />
          </div>
        </div>

        {/* Passed */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 transform hover:-translate-y-3">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-3">Passed</p>
            <p className="text-5xl font-black text-blue-400">{passedQuizzes}</p>
            <div className="h-2 w-16 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 mt-4 group-hover:w-24 transition-all duration-300 shadow-lg shadow-blue-500/50" />
          </div>
        </div>

        {/* Failed */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-red-500/40 transition-all duration-300 transform hover:-translate-y-3">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-3">Failed</p>
            <p className="text-5xl font-black text-red-400">{failedQuizzes}</p>
            <div className="h-2 w-16 rounded-full bg-gradient-to-r from-red-400 to-red-500 mt-4 group-hover:w-24 transition-all duration-300 shadow-lg shadow-red-500/50" />
          </div>
        </div>

        {/* Grade */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-yellow-500/40 transition-all duration-300 transform hover:-translate-y-3">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-3">Grade</p>
            <p className="text-5xl font-black text-yellow-400">{grade}</p>
            <p className="text-sm text-[#aaa] mt-2">{avgScore.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Marksheet Table */}
      <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl relative z-10 mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10">
          <h2 className="text-lg font-bold text-white mb-6">Quiz Marksheet</h2>

          {performance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#3a3a3a]">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#888]">#</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#888]">Quiz Name</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#888]">Score</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#888]">Percentage</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#888]">Grade</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#888]">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#888]">Attempts</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#888]">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((p, idx) => {
                    const quizTitle = Array.isArray(p?.quiz) && p.quiz.length > 0 ? p.quiz[0]?.title : (p?.quiz?.title || `Quiz ${idx + 1}`);
                    const percentage = p?.result?.percentage || 0;
                    const quizGrade = getGrade(percentage);

                    return (
                      <tr key={idx} className="border-b border-[#2a2a2a] hover:bg-[#1f1f1f]/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-[#aaa] font-medium">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm text-white font-medium">{quizTitle}</td>
                        <td className="px-4 py-3 text-sm text-center text-[#aaa]">
                          {p?.result?.score || 0}/{p?.result?.totalMarks || 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-center font-bold text-green-400">
                          {percentage.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getGradeColor(quizGrade)}`}>
                            {quizGrade}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            p?.result?.passed
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {p?.result?.passed ? '✓ Pass' : '✗ Fail'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-[#aaa]">{p?.result?.attempts || 0}</td>
                        <td className="px-4 py-3 text-sm text-center text-[#aaa]">
                          {p?.result?.completedAt ? new Date(p.result.completedAt).toLocaleDateString('en-IN') : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-[#666]">
              <p>No quiz data available for this course</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl">
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-white mb-4">Performance Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#aaa]">Total Quizzes:</span>
                <span className="text-white font-bold">{totalQuizzes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#aaa]">Passed:</span>
                <span className="text-green-400 font-bold">{passedQuizzes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#aaa]">Failed:</span>
                <span className="text-red-400 font-bold">{failedQuizzes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#aaa]">Pass Rate:</span>
                <span className="text-blue-400 font-bold">
                  {totalQuizzes > 0 ? ((passedQuizzes / totalQuizzes) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-[#2a2a2a]">
                <span className="text-[#aaa]">Average Score:</span>
                <span className="text-yellow-400 font-bold text-lg">{avgScore.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#aaa]">Overall Grade:</span>
                <span className={`font-bold text-lg ${getGradeColor(grade)}`}>
                  {grade}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl">
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-white mb-4">Grade Scale</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#aaa]">A+ (Excellent)</span>
                <span className="text-green-400 font-bold">90-100%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#aaa]">A (Very Good)</span>
                <span className="text-green-400 font-bold">80-89%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#aaa]">B+ (Good)</span>
                <span className="text-blue-400 font-bold">70-79%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#aaa]">B (Satisfactory)</span>
                <span className="text-blue-400 font-bold">60-69%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#aaa]">C+ (Average)</span>
                <span className="text-yellow-400 font-bold">50-59%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#aaa]">C (Below Average)</span>
                <span className="text-yellow-400 font-bold">40-49%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#aaa]">F (Fail)</span>
                <span className="text-red-400 font-bold">Below 40%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
