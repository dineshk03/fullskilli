import { useEffect, useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getStudentQuizPerformance } from "../../../services/operations/quizReportsAPI";
import { generateOverallMarksheetPDF } from "../../../utils/generateMarksheetPDF";
import { toast } from "react-hot-toast";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
export default function DynamicMarksheet() {
  const {
    user
  } = useSelector(state => state.profile);
  const {
    token
  } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [sortBy, setSortBy] = useState("courseName");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  useState({
    start: "",
    end: ""
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  useState(false);
  const [chartType, setChartType] = useState("bar");

  // Fetch marksheet data
  const fetchMarksheetData = useCallback(async () => {
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
      console.log("Marksheet API Response:", response);
      console.log("Performance data:", response?.performance);
      console.log("Performance length:", response?.performance?.length);
      if (response?.performance && response.performance.length > 0) {
        const courseMap = new Map();
        response.performance.forEach((p, idx) => {
          console.log(`Processing quiz ${idx}:`, p);

          // The course object is returned as an array from the aggregation pipeline
          const courseObj = Array.isArray(p?.course) && p.course.length > 0 ? p.course[0] : p?.course;
          console.log(`Quiz ${idx} courseObj:`, courseObj);
          if (!courseObj) {
            console.warn(`Quiz ${idx} skipped: no courseObj`, {
              quiz: p
            });
            return; // Skip if no course data
          }

          // Extract course info - prioritize _id, fallback to courseName
          const courseId = courseObj?._id;
          const courseName = courseObj?.courseName || "Unknown Course";
          console.log(`Quiz ${idx} courseId:`, courseId, "courseName:", courseName);

          // Use courseId as the map key (prefer _id, but fallback to courseName if needed)
          const mapKey = courseId || courseName;
          if (!mapKey || mapKey === "Unknown Course") {
            console.warn(`Quiz ${idx} skipped: no valid course identifier`, {
              courseObj,
              courseObjKeys: Object.keys(courseObj || {}),
              quizData: p
            });
            return; // Skip if no course identifier
          }
          if (!courseMap.has(mapKey)) {
            courseMap.set(mapKey, {
              courseId: courseId || courseName,
              // Store the actual ID or name
              actualCourseId: courseId,
              // Store the MongoDB ObjectId separately if available
              courseName: courseName || "Unknown Course",
              quizzes: [],
              totalQuizzes: 0,
              passedQuizzes: 0,
              averageScore: 0,
              lastUpdated: new Date()
            });
          }
          const course = courseMap.get(mapKey);
          course.quizzes.push(p);
          course.totalQuizzes += 1;
          if (p.result?.passed) course.passedQuizzes += 1;
        });
        const coursesList = Array.from(courseMap.values()).map(course => ({
          ...course,
          averageScore: course.quizzes.length > 0 ? course.quizzes.reduce((sum, q) => sum + (q.result?.percentage || 0), 0) / course.quizzes.length : 0
        }));
        console.log("Courses list to set:", coursesList);
        setCourses(coursesList);
        if (coursesList.length > 0) {
          toast.success(`Marksheet updated! (${coursesList.length} courses)`);
        } else {
          console.warn("No courses found after processing");
        }
      } else {
        console.warn("No performance data or empty array");
        setError("No quiz data found");
      }
    } catch (err) {
      console.error("Error fetching marksheet:", err);
      setError("Failed to load marksheet");
    } finally {
      setLoading(false);
    }
  }, [token, user._id]);

  // Initial fetch
  useEffect(() => {
    fetchMarksheetData();
  }, [user._id, token, fetchMarksheetData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchMarksheetData();
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMarksheetData, refreshInterval]);

  // Filtered and sorted data
  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Search filter
    if (searchQuery) {
      result = result.filter(c => c.courseName.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Status filter
    if (filterStatus === "completed") {
      result = result.filter(c => c.passedQuizzes === c.totalQuizzes);
    } else if (filterStatus === "inprogress") {
      result = result.filter(c => c.passedQuizzes < c.totalQuizzes);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "courseName") {
        return a.courseName.localeCompare(b.courseName);
      } else if (sortBy === "score") {
        return b.averageScore - a.averageScore;
      } else if (sortBy === "passed") {
        return b.passedQuizzes - a.passedQuizzes;
      } else if (sortBy === "recent") {
        return new Date(b.lastUpdated) - new Date(a.lastUpdated);
      }
      return 0;
    });
    return result;
  }, [courses, searchQuery, filterStatus, sortBy]);

  // Chart data
  const chartData = useMemo(() => {
    return filteredCourses.map(c => ({
      name: c.courseName.substring(0, 15),
      score: c.averageScore.toFixed(1),
      passed: c.passedQuizzes,
      total: c.totalQuizzes,
      failed: c.totalQuizzes - c.passedQuizzes
    }));
  }, [filteredCourses]);

  // Progress over time (simulated)
  const progressData = useMemo(() => {
    return filteredCourses.map((c, idx) => ({
      name: `Week ${idx + 1}`,
      progress: Math.min(100, c.averageScore * (idx + 1) / 2)
    }));
  }, [filteredCourses]);

  // Statistics
  const stats = useMemo(() => {
    const totalQuizzes = courses.reduce((sum, c) => sum + c.totalQuizzes, 0);
    const totalPassed = courses.reduce((sum, c) => sum + c.passedQuizzes, 0);
    const overallAvg = courses.length > 0 ? courses.reduce((sum, c) => sum + c.averageScore, 0) / courses.length : 0;
    return {
      totalCourses: courses.length,
      totalQuizzes,
      totalPassed,
      totalFailed: totalQuizzes - totalPassed,
      overallAvg,
      passRate: totalQuizzes > 0 ? (totalPassed / totalQuizzes * 100).toFixed(1) : 0
    };
  }, [courses]);
  const getGrade = percentage => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    return 'F';
  };
  const getGradeColor = grade => {
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
  const handleDownloadPDF = () => {
    try {
      const studentName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || "Student";
      generateOverallMarksheetPDF(courses, studentName, user?.email || "", user?._id || "");
      toast.success("Marksheet downloaded!");
    } catch (error) {
      console.error("Error downloading:", error);
      toast.error("Failed to download marksheet");
    }
  };
  const handleExportCSV = () => {
    try {
      const headers = ["Course Name", "Total Quizzes", "Passed", "Failed", "Average Score", "Grade", "Status"];
      const rows = filteredCourses.map(c => [c.courseName, c.totalQuizzes, c.passedQuizzes, c.totalQuizzes - c.passedQuizzes, c.averageScore.toFixed(1), getGrade(c.averageScore), c.passedQuizzes === c.totalQuizzes ? "Completed" : "In Progress"]);
      const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
      const blob = new Blob([csv], {
        type: "text/csv"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `marksheet-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("CSV exported!");
    } catch (error) {
      toast.error("Failed to export CSV");
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f0f1e] p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[#2a2a2a] animate-spin border-t-blue-400" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">📊</div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Loading dynamic marksheet...</h3>
          <p className="text-[#888]">Fetching latest data</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f0f1e] p-4 md:p-8">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '1s'
      }}></div>
      </div>

      {/* Header */}
      <div className="mb-8 relative z-10">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-300 via-blue-400 to-blue-500 bg-clip-text text-transparent">
                Dynamic Marksheet
              </h1>
              <p className="text-sm text-[#888] mt-1">Real-time performance tracking with advanced analytics</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDownloadPDF} className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all text-sm">
              📄 PDF
            </button>
            <button onClick={handleExportCSV} className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all text-sm">
              📊 CSV
            </button>
            <button onClick={fetchMarksheetData} className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all text-sm">
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Auto-refresh Controls */}
      <div className="mb-6 relative z-10 bg-[#1f1f1f] border border-[#3a3a3a] rounded-2xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm text-[#aaa]">Auto-refresh every</span>
            </label>
            <select value={refreshInterval} onChange={e => setRefreshInterval(parseInt(e.target.value))} disabled={!autoRefresh} className="px-3 py-1 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] text-white text-sm disabled:opacity-50">
              <option value="10">10s</option>
              <option value="30">30s</option>
              <option value="60">1m</option>
              <option value="300">5m</option>
            </select>
          </div>
          <div className="text-xs text-[#666]">
            Last updated: {new Date().toLocaleTimeString('en-IN')}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 relative z-10">
        {[{
        label: "Courses",
        value: stats.totalCourses,
        color: "blue"
      }, {
        label: "Total Quizzes",
        value: stats.totalQuizzes,
        color: "purple"
      }, {
        label: "Passed",
        value: stats.totalPassed,
        color: "green"
      }, {
        label: "Failed",
        value: stats.totalFailed,
        color: "red"
      }, {
        label: "Pass Rate",
        value: `${stats.passRate}%`,
        color: "yellow"
      }].map((stat, idx) => <div key={idx} className={`group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2`}>
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-2">{stat.label}</p>
              <p className={`text-4xl font-black ${stat.color === "blue" ? "text-blue-400" : stat.color === "purple" ? "text-purple-400" : stat.color === "green" ? "text-green-400" : stat.color === "red" ? "text-red-400" : "text-yellow-400"}`}>
                {stat.value}
              </p>
            </div>
          </div>)}
      </div>

      {/* Filters and Controls */}
      <div className="mb-6 relative z-10 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input type="text" placeholder="Search courses..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="px-4 py-2 rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] text-white placeholder-[#666] focus:outline-none focus:border-blue-400" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2 rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] text-white focus:outline-none focus:border-blue-400">
          <option value="all">All Courses</option>
          <option value="completed">Completed</option>
          <option value="inprogress">In Progress</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-4 py-2 rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] text-white focus:outline-none focus:border-blue-400">
          <option value="courseName">Sort by Name</option>
          <option value="score">Sort by Score</option>
          <option value="passed">Sort by Passed</option>
          <option value="recent">Sort by Recent</option>
        </select>
        <select value={chartType} onChange={e => setChartType(e.target.value)} className="px-4 py-2 rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] text-white focus:outline-none focus:border-blue-400">
          <option value="bar">Bar Chart</option>
          <option value="line">Line Chart</option>
          <option value="comparison">Comparison</option>
        </select>
      </div>

      {/* Charts */}
      {filteredCourses.length > 0 && <div className="mb-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart */}
          <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">Performance Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === "bar" ? <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{
              backgroundColor: "#2a2a2a",
              border: "1px solid #3a3a3a"
            }} />
                  <Legend />
                  <Bar dataKey="score" fill="#3498db" name="Average Score %" />
                </BarChart> : <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{
              backgroundColor: "#2a2a2a",
              border: "1px solid #3a3a3a"
            }} />
                  <Legend />
                  <Line type="monotone" dataKey="progress" stroke="#2ecc71" name="Progress %" />
                </LineChart>}
            </ResponsiveContainer>
          </div>

          {/* Pass/Fail Distribution */}
          <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">Pass/Fail Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={[{
              name: "Passed",
              value: stats.totalPassed
            }, {
              name: "Failed",
              value: stats.totalFailed
            }]} cx="50%" cy="50%" labelLine={false} label={({
              name,
              value
            }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                  <Cell fill="#2ecc71" />
                  <Cell fill="#e74c3c" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>}

      {/* Marksheet Table */}
      <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl relative z-10">
        <h2 className="text-lg font-bold text-white mb-6">Course Marksheet</h2>

        {filteredCourses.length > 0 ? <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#3a3a3a]">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#888]">Course</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#888]">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#888]">Passed</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#888]">Failed</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#888]">Avg Score</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#888]">Grade</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#888]">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course, idx) => {
              const grade = getGrade(course.averageScore);
              const isCompleted = course.passedQuizzes === course.totalQuizzes;
              return <tr key={idx} onClick={() => navigate(`/dashboard/course-performance/${course.actualCourseId || course.courseId}`)} className="border-b border-[#2a2a2a] hover:bg-[#1f1f1f]/50 transition-colors cursor-pointer">
                      <td className="px-4 py-3 text-sm text-white font-medium hover:text-blue-400 transition-colors">{course.courseName}</td>
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
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {isCompleted ? '✓ Completed' : 'In Progress'}
                        </span>
                      </td>
                    </tr>;
            })}
              </tbody>
            </table>
          </div> : <div className="text-center py-8 text-[#666]">
            <p>No courses match your filters</p>
          </div>}
      </div>
    </div>;
}
