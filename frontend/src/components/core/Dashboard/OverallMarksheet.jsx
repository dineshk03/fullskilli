import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getStudentQuizPerformance } from "../../../services/operations/quizReportsAPI";
import { generateOverallMarksheetPDF } from "../../../utils/generateMarksheetPDF";
import { toast } from "react-hot-toast";

export default function OverallMarksheet() {
  const { user } = useSelector((state) => state.profile);
  const { token } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [sortBy, setSortBy] = useState("courseName");

  useEffect(() => {
    const fetchMarksheetData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user?._id || !token) {
          setError("Authentication required");
          return;
        }

        const response = await getStudentQuizPerformance({
          token,
          studentId: user._id
        });

        if (response?.performance) {
          // Group by course
          const courseMap = new Map();

          response.performance.forEach(p => {
            const courseId = Array.isArray(p?.course) && p.course.length > 0
              ? p.course[0]?._id
              : p?.course?._id;
            const courseName = Array.isArray(p?.course) && p.course.length > 0
              ? p.course[0]?.courseName
              : p?.course?.courseName;

            if (!courseMap.has(courseId)) {
              courseMap.set(courseId, {
                courseId,
                courseName: courseName || "Unknown Course",
                quizzes: [],
                totalQuizzes: 0,
                passedQuizzes: 0,
                averageScore: 0
              });
            }

            const course = courseMap.get(courseId);
            course.quizzes.push(p);
            course.totalQuizzes += 1;
            if (p.result?.passed) course.passedQuizzes += 1;
          });

          // Calculate averages
          const coursesList = Array.from(courseMap.values()).map(course => ({
            ...course,
            averageScore: course.quizzes.length > 0
              ? course.quizzes.reduce((sum, q) => sum + (q.result?.percentage || 0), 0) / course.quizzes.length
              : 0
          }));

          setCourses(coursesList);
        } else {
          setError("Failed to load marksheet data");
        }
      } catch (err) {
        console.error("Error fetching marksheet:", err);
        setError("Failed to load marksheet");
      } finally {
        setLoading(false);
      }
    };

    fetchMarksheetData();
  }, [user?._id, token]);

  const handleDownloadMarksheet = () => {
    try {
      const studentName = user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.email || "Student";

      generateOverallMarksheetPDF(courses, studentName, user?.email || "", user?._id || "");
      toast.success("Marksheet downloaded successfully!");
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

  const sortedCourses = [...courses].sort((a, b) => {
    if (sortBy === "courseName") {
      return a.courseName.localeCompare(b.courseName);
    } else if (sortBy === "score") {
      return b.averageScore - a.averageScore;
    } else if (sortBy === "passed") {
      return b.passedQuizzes - a.passedQuizzes;
    }
    return 0;
  });

  const totalQuizzes = courses.reduce((sum, c) => sum + c.totalQuizzes, 0);
  const totalPassed = courses.reduce((sum, c) => sum + c.passedQuizzes, 0);
  const overallAvg = courses.length > 0
    ? courses.reduce((sum, c) => sum + c.averageScore, 0) / courses.length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f0f1e] p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[#2a2a2a] animate-spin border-t-blue-400" />
            <div className="absolute inset-2 rounded-full border-2 border-[#1a1a1a] animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">📋</div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Loading marksheet...</h3>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f0f1e] p-4 md:p-8">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <div className="mb-8 relative z-10">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-300 via-blue-400 to-blue-500 bg-clip-text text-transparent">
                Student Marksheet
              </h1>
              <p className="text-sm text-[#888] mt-1">Overall performance across all courses</p>
            </div>
          </div>
          <button
            onClick={handleDownloadMarksheet}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 transform hover:scale-105"
          >
            📄 Download Marksheet
          </button>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 relative z-10">
        {/* Total Courses */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 transform hover:-translate-y-3">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-3">Total Courses</p>
            <p className="text-5xl font-black text-blue-400">{courses.length}</p>
            <div className="h-2 w-16 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 mt-4 group-hover:w-24 transition-all duration-300 shadow-lg shadow-blue-500/50" />
          </div>
        </div>

        {/* Total Quizzes */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 transform hover:-translate-y-3">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-3">Total Quizzes</p>
            <p className="text-5xl font-black text-purple-400">{totalQuizzes}</p>
            <div className="h-2 w-16 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 mt-4 group-hover:w-24 transition-all duration-300 shadow-lg shadow-purple-500/50" />
          </div>
        </div>

        {/* Passed Quizzes */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-green-500/40 transition-all duration-300 transform hover:-translate-y-3">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-3">Passed</p>
            <p className="text-5xl font-black text-green-400">{totalPassed}</p>
            <div className="h-2 w-16 rounded-full bg-gradient-to-r from-green-400 to-green-500 mt-4 group-hover:w-24 transition-all duration-300 shadow-lg shadow-green-500/50" />
          </div>
        </div>

        {/* Overall Grade */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-yellow-500/40 transition-all duration-300 transform hover:-translate-y-3">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-3">Overall Grade</p>
            <p className="text-5xl font-black text-yellow-400">{getGrade(overallAvg)}</p>
            <p className="text-sm text-[#aaa] mt-2">{overallAvg.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Marksheet Table */}
      <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl relative z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Course Marksheet</h2>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] text-white text-sm hover:border-[#505050] transition-colors focus:outline-none focus:border-blue-400"
            >
              <option value="courseName">Sort by Course Name</option>
              <option value="score">Sort by Average Score</option>
              <option value="passed">Sort by Passed Quizzes</option>
            </select>
          </div>

          {sortedCourses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#3a3a3a]">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#888]">Course Name</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#888]">Total Quizzes</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#888]">Passed</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#888]">Failed</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#888]">Average Score</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#888]">Grade</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#888]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCourses.map((course, idx) => {
                    const grade = getGrade(course.averageScore);
                    const isCompleted = course.passedQuizzes === course.totalQuizzes;

                    return (
                      <tr key={idx} className="border-b border-[#2a2a2a] hover:bg-[#1f1f1f]/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-white font-medium">{course.courseName}</td>
                        <td className="px-4 py-3 text-sm text-center text-[#aaa]">{course.totalQuizzes}</td>
                        <td className="px-4 py-3 text-sm text-center font-bold text-green-400">{course.passedQuizzes}</td>
                        <td className="px-4 py-3 text-sm text-center font-bold text-red-400">{course.totalQuizzes - course.passedQuizzes}</td>
                        <td className="px-4 py-3 text-sm text-center font-bold text-blue-400">{course.averageScore.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getGradeColor(grade)}`}>
                            {grade}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            isCompleted
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {isCompleted ? '✓ Completed' : 'In Progress'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-[#666]">
              <p>No course data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Grade Scale */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
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

        <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl">
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-white mb-4">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#aaa]">Courses Enrolled:</span>
                <span className="text-white font-bold">{courses.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#aaa]">Total Quizzes:</span>
                <span className="text-white font-bold">{totalQuizzes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#aaa]">Quizzes Passed:</span>
                <span className="text-green-400 font-bold">{totalPassed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#aaa]">Quizzes Failed:</span>
                <span className="text-red-400 font-bold">{totalQuizzes - totalPassed}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-[#2a2a2a]">
                <span className="text-[#aaa]">Overall Average:</span>
                <span className="text-blue-400 font-bold text-lg">{overallAvg.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#aaa]">Overall Grade:</span>
                <span className={`font-bold text-lg ${getGradeColor(getGrade(overallAvg))}`}>
                  {getGrade(overallAvg)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
