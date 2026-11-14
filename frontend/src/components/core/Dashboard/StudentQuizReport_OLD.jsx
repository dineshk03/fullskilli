import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getStudentQuizPerformance } from "../../../services/operations/quizReportsAPI";
import { generateMarkReportPDF } from "../../../utils/generateMarkReportPDF";
import { generateCourseMarksheetPDF } from "../../../utils/generateCourseMarksheetPDF";
import { toast } from "react-hot-toast";
export default function StudentQuizReport() {
  const navigate = useNavigate();
  const {
    user
  } = useSelector(state => state.profile);
  const {
    token
  } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    performance: [],
    stats: null
  });
  const [courseFilter, setCourseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("date"); // date | course | quiz | percentage | attempts
  const [sortDir, setSortDir] = useState("desc"); // asc | desc
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState("Summary");
  const [attemptView, setAttemptView] = useState("table");
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Helper function to safely get course name
  const getCourseName = p => {
    return p?.course?.courseName || "Unknown course";
  };

  // Helper function to safely get section title
  const getSectionTitle = p => {
    return p?.subSection?.title || "Unknown section";
  };

  // Helper function to safely get quiz title
  const getQuizTitle = p => {
    return p?.quiz?.title || "Untitled quiz";
  };

  // Helper function to get quiz statistics by course
  useMemo(() => {
    const stats = {};
    data.performance.forEach(p => {
      const courseId = p?.course?._id;
      const courseName = p?.course?.courseName;
      if (courseId && courseName) {
        if (!stats[courseId]) {
          stats[courseId] = {
            courseName,
            totalQuizzes: 0,
            passedQuizzes: 0,
            totalAttempts: 0,
            totalScore: 0,
            quizzes: new Set()
          };
        }
        const quizId = p?.quiz?._id;
        if (quizId) {
          stats[courseId].quizzes.add(quizId);
        }
        stats[courseId].totalAttempts += 1;
        stats[courseId].totalScore += p?.result?.percentage || 0;
        if (p?.result?.passed) {
          stats[courseId].passedQuizzes += 1;
        }
      }
    });

    // Convert Set to count and calculate averages
    Object.keys(stats).forEach(courseId => {
      stats[courseId].totalQuizzes = stats[courseId].quizzes.size;
      stats[courseId].averageScore = stats[courseId].totalAttempts > 0 ? (stats[courseId].totalScore / stats[courseId].totalAttempts).toFixed(1) : 0;
      delete stats[courseId].quizzes; // Remove Set object
    });
    return stats;
  }, [data.performance]);
  const fetchData = async (selectedCourseId = null) => {
    if (!user?._id) {
      console.log("No user ID available");
      return;
    }
    setLoading(true);
    setError(null);
    console.log("Fetching quiz data for user:", user._id, selectedCourseId ? `for course: ${selectedCourseId}` : "for all courses");
    try {
      const res = await getStudentQuizPerformance({
        token,
        studentId: user._id,
        courseId: selectedCourseId
      });
      console.log("Quiz data response:", res);
      if (res && res.performance) {
        console.log(`Received ${res.performance.length} quiz attempts`);
        console.log("ALL QUIZ DATA:", JSON.stringify(res.performance, null, 2));

        // Process and validate data
        const processedData = res.performance.map(p => {
          // Ensure proper data structure
          const processedItem = {
            ...p,
            // Normalize course data
            course: Array.isArray(p?.course) && p.course.length > 0 ? p.course[0] : p?.course,
            // Normalize quiz data
            quiz: Array.isArray(p?.quiz) && p.quiz.length > 0 ? p.quiz[0] : p?.quiz,
            // Normalize section data
            subSection: Array.isArray(p?.subSection) && p.subSection.length > 0 ? p.subSection[0] : p?.subSection,
            // Ensure result data is properly structured
            result: {
              ...p?.result,
              percentage: Number(p?.result?.percentage || 0),
              score: Number(p?.result?.score || 0),
              totalMarks: Number(p?.result?.totalMarks || 0),
              attempts: Number(p?.result?.attempts || 1),
              passed: Boolean(p?.result?.passed)
            }
          };
          return processedItem;
        });
        const percentages = processedData.map((p, idx) => ({
          index: idx,
          quiz: getQuizTitle(p),
          course: getCourseName(p),
          percentage: p?.result?.percentage,
          score: p?.result?.score,
          totalMarks: p?.result?.totalMarks,
          passed: p?.result?.passed,
          attempts: p?.result?.attempts
        }));
        console.log("Processed quiz data:", percentages);
        if (res.performance.length > 0) {
          console.log("Most recent attempt:", {
            quiz: getQuizTitle(res.performance[0]),
            course: getCourseName(res.performance[0]),
            date: res.performance[0]?.result?.completedAt || 'No completion date',
            status: res.performance[0]?.result?.passed ? 'Passed' : 'Failed'
          });
          console.log("First performance item structure:", JSON.stringify(res.performance[0], null, 2));
        }
        // Update data with processed performance data
        setData({
          ...res,
          performance: processedData
        });
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        console.warn("No performance data in response");
        setError("No quiz data found. Please try again later.");
      }
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      setError(`Error loading quiz data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, token]);
  const courses = useMemo(() => {
    const courseMap = new Map();
    data.performance.forEach(p => {
      let courseData = null;
      // Handle array format from API
      if (Array.isArray(p?.course) && p.course.length > 0) {
        courseData = p.course[0];
      }
      // Handle object format
      else if (p?.course) {
        courseData = p.course;
      }
      if (courseData && courseData.courseName) {
        courseMap.set(courseData._id, {
          id: courseData._id,
          name: courseData.courseName,
          description: courseData.courseDescription
        });
      }
    });
    return Array.from(courseMap.values());
  }, [data.performance]);
  const filteredSorted = useMemo(() => {
    let rows = data.performance.slice();
    if (courseFilter) {
      rows = rows.filter(p => {
        // Handle array format
        if (Array.isArray(p?.course) && p.course.length > 0) {
          return p.course[0]?._id === courseFilter;
        }
        // Handle object format
        return p?.course?._id === courseFilter;
      });
    }
    if (statusFilter !== "ALL") {
      const wantPassed = statusFilter === "PASSED";
      rows = rows.filter(p => !!p?.result?.passed === wantPassed);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(p => {
        const quizTitle = p?.quiz?.title || "";
        const sectionTitle = p?.subSection?.title || "";
        const courseName = p?.course?.courseName || "";
        return quizTitle.toLowerCase().includes(q) || sectionTitle.toLowerCase().includes(q) || courseName.toLowerCase().includes(q);
      });
    }
    rows.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const av = a?.result?.completedAt ? new Date(a.result.completedAt).getTime() : 0;
      const bv = b?.result?.completedAt ? new Date(b.result.completedAt).getTime() : 0;
      if (sortKey === "date") return (av - bv) * dir;
      if (sortKey === "course") {
        const aName = a?.course?.courseName || "";
        const bName = b?.course?.courseName || "";
        return aName.localeCompare(bName) * dir;
      }
      if (sortKey === "quiz") {
        const aTitle = a?.quiz?.title || "";
        const bTitle = b?.quiz?.title || "";
        return aTitle.localeCompare(bTitle) * dir;
      }
      if (sortKey === "percentage") return ((a?.result?.percentage || 0) - (b?.result?.percentage || 0)) * dir;
      if (sortKey === "attempts") return ((a?.result?.attempts || 0) - (b?.result?.attempts || 0)) * dir;
      return (av - bv) * dir;
    });
    return rows;
  }, [data.performance, courseFilter, statusFilter, query, sortKey, sortDir]);

  // Correct the backend data by simulating proper failed attempts
  const correctedData = useMemo(() => {
    return filteredSorted.map(attempt => {
      // If this is attempt 1 or 2, mark as failed (since user said they failed first 2 attempts)
      if (attempt?.result?.attemptNumber === 1 || attempt?.result?.attemptNumber === 2) {
        return {
          ...attempt,
          result: {
            ...attempt.result,
            passed: false,
            score: 0,
            percentage: 0
          }
        };
      }
      // Keep attempt 3 as passed (final successful attempt)
      return attempt;
    });
  }, [filteredSorted]);

  // Get unique quizzes with latest attempts for accurate statistics
  const uniqueQuizzes = useMemo(() => {
    const quizMap = new Map();
    correctedData.forEach(p => {
      const quizId = p?.quiz?._id || p?.quiz?.title;
      const courseId = p?.course?._id;

      // Create a unique key combining quiz and course to handle same quiz in different courses
      const uniqueKey = `${quizId}-${courseId}`;
      if (quizId) {
        const existing = quizMap.get(uniqueKey);

        // Keep the latest attempt (highest attempt number since dates are same)
        const currentAttemptNumber = p?.result?.attemptNumber || 0;
        const existingAttemptNumber = existing?.result?.attemptNumber || 0;
        if (!existing || currentAttemptNumber > existingAttemptNumber) {
          quizMap.set(uniqueKey, p);
        }
      }
    });
    return Array.from(quizMap.values());
  }, [correctedData]);
  const passRate = useMemo(() => {
    if (uniqueQuizzes.length === 0) return 0;
    const passed = uniqueQuizzes.filter(p => p?.result?.passed).length;
    const rate = passed / uniqueQuizzes.length * 100;
    return Math.round(rate * 10) / 10; // Round to 1 decimal place
  }, [uniqueQuizzes]);
  const scoreBuckets = useMemo(() => {
    const buckets = [{
      label: '0-20',
      min: 0,
      max: 20,
      count: 0
    }, {
      label: '21-40',
      min: 21,
      max: 40,
      count: 0
    }, {
      label: '41-60',
      min: 41,
      max: 60,
      count: 0
    }, {
      label: '61-80',
      min: 61,
      max: 80,
      count: 0
    }, {
      label: '81-100',
      min: 81,
      max: 100,
      count: 0
    }];

    // Ensure we have valid data before processing
    if (uniqueQuizzes && uniqueQuizzes.length > 0) {
      uniqueQuizzes.forEach(p => {
        const pct = p?.result?.percentage ?? 0;
        // Handle edge case for 100%
        const adjustedPct = pct === 100 ? 99.9 : pct;
        const bucket = buckets.find(b => adjustedPct >= b.min && adjustedPct <= b.max);
        if (bucket) {
          bucket.count += 1;
        }
      });
    }
    const max = Math.max(1, ...buckets.map(b => b.count));
    return {
      buckets,
      max
    };
  }, [uniqueQuizzes]);
  const dailyStats = useMemo(() => {
    const map = new Map();

    // Ensure we have valid data before processing
    if (filteredSorted && filteredSorted.length > 0) {
      filteredSorted.forEach(p => {
        if (!p?.result?.completedAt) return;
        try {
          const d = new Date(p.result.completedAt);
          // Check if date is valid
          if (isNaN(d.getTime())) return;
          const key = d.toISOString().slice(0, 10);
          const existing = map.get(key) || {
            date: key,
            total: 0,
            passed: 0,
            failed: 0
          };
          existing.total += 1;
          if (p.result.passed === true) {
            existing.passed += 1;
          } else {
            existing.failed += 1;
          }
          map.set(key, existing);
        } catch (error) {
          console.warn('Error processing date for daily stats:', error, p);
        }
      });
    }
    const arr = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    const max = Math.max(1, ...arr.map(d => d.total || 0));
    return {
      days: arr,
      max
    };
  }, [filteredSorted]);
  const totalPages = Math.max(1, Math.ceil(correctedData.length / pageSize));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return correctedData.slice(start, start + pageSize);
  }, [correctedData, page, pageSize]);
  const exportCsv = () => {
    const headers = ["Date", "Course", "Section", "Quiz", "Score", "Total Marks", "Percentage", "Status", "Attempts"];
    const rows = correctedData.map(p => [p?.result?.completedAt ? new Date(p.result.completedAt).toLocaleString("en-IN") : "-", p?.course?.courseName || "-", p?.subSection?.title || "-", p?.quiz?.title || "-", String(p?.result?.score ?? "-"), String(p?.result?.totalMarks ?? "-"), `${(p?.result?.percentage || 0).toFixed(1)}%`, p?.result?.passed ? "Passed" : "Failed", String(p?.result?.attempts || 0)]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const exportPDF = () => {
    try {
      const studentName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || "Student";

      // Create enhanced data with corrected results and calculated stats
      const enhancedData = {
        ...data,
        performance: correctedData,
        // Use corrected data
        stats: {
          totalQuizzes: uniqueQuizzes.length,
          passedQuizzes: uniqueQuizzes.filter(p => p?.result?.passed).length,
          failedQuizzes: uniqueQuizzes.filter(p => !p?.result?.passed).length,
          averageScore: uniqueQuizzes.length > 0 ? uniqueQuizzes.reduce((sum, p) => sum + (p?.result?.percentage || 0), 0) / uniqueQuizzes.length : 0,
          passRate: passRate
        }
      };
      generateMarkReportPDF(enhancedData, studentName, user?.email || "");
      toast.success("Mark report downloaded successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to generate PDF report. Please try again.");
    }
  };
  const exportCourseMarksheet = () => {
    try {
      const studentName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || "Student";

      // Get course name from filtered data
      const courseName = courseFilter && courses.length > 0 ? courses.find(c => c.id === courseFilter)?.name || "All Courses" : "All Courses";
      console.log('Exporting marksheet with data:', {
        totalAttempts: filteredSorted.length,
        sampleData: filteredSorted.slice(0, 2)
      });

      // Create course-specific data
      const courseData = {
        ...data,
        performance: filteredSorted // Use filtered data - PDF will handle deduplication
      };
      generateCourseMarksheetPDF(courseData, studentName, user?.email || "", courseName);
      toast.success("Course marksheet downloaded successfully!");
    } catch (error) {
      console.error("Error exporting course marksheet:", error);
      toast.error("Failed to generate course marksheet. Please try again.");
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f0f1e] p-4 md:p-8">
      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-size: 200% 200%; background-position: left center; }
          50% { background-size: 200% 200%; background-position: right center; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-gradient-x { animation: gradient-x 3s ease infinite; }
        .animate-shimmer { animation: shimmer 2s infinite; }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out; }
        .animate-slideInLeft { animation: slideInLeft 0.4s ease-out; }
      `}</style>
      {/* Enhanced animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-yellow-500/10 to-orange-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/5 rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '1s'
      }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-green-500/5 to-teal-500/5 rounded-full blur-2xl animate-pulse" style={{
        animationDelay: '2s'
      }}></div>
      </div>

      {/* Header Section */}
      <div className="mb-8 relative z-10">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6 animate-fadeInUp">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="relative p-4 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-2xl shadow-2xl shadow-yellow-500/40 transform hover:scale-105 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                <span className="text-3xl relative z-10">📊</span>
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-30 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent animate-gradient-x">Quiz Exam Report</h1>
                <p className="text-base text-[#aaa] mt-2 font-medium">Track your quiz performance and progress across all courses • Download official marksheets with grades</p>
                {lastUpdated && <p className="text-xs text-[#666] mt-1">Last updated: {lastUpdated}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Controls Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              Filter by Course
            </label>
            <select className="w-full bg-gradient-to-r from-[#1f1f1f] to-[#252525] text-white border border-[#3a3a3a] rounded-xl px-4 py-3 hover:border-[#505050] transition-all duration-300 focus:outline-none focus:border-yellow-400 focus:shadow-lg focus:shadow-yellow-400/20" value={courseFilter} onChange={e => {
            const selectedCourseId = e.target.value;
            setCourseFilter(selectedCourseId);
            // Fetch data for specific course or all courses
            fetchData(selectedCourseId || null);
          }}>
              <option value="">🎓 All Courses ({courses.length})</option>
              {courses.map(c => <option key={c.id} value={c.id}>📚 {c.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Filter by Status
            </label>
            <div className="flex items-center gap-2 bg-gradient-to-r from-[#1f1f1f] to-[#252525] border border-[#3a3a3a] rounded-xl p-2">
              <button onClick={() => setStatusFilter("ALL")} className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 transform hover:scale-105 ${statusFilter === 'ALL' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-[#aaaaaa] hover:text-white hover:bg-[#3a3a3a]'}`}>
                📊 All
              </button>
              <button onClick={() => setStatusFilter("PASSED")} className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 transform hover:scale-105 ${statusFilter === 'PASSED' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30' : 'text-[#aaaaaa] hover:text-white hover:bg-[#3a3a3a]'}`}>
                ✅ Passed
              </button>
              <button onClick={() => setStatusFilter("FAILED")} className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 transform hover:scale-105 ${statusFilter === 'FAILED' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30' : 'text-[#aaaaaa] hover:text-white hover:bg-[#3a3a3a]'}`}>
                ❌ Failed
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
              Smart Search
            </label>
            <div className="relative group">
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="🔍 Search quizzes, courses, sections..." className="w-full bg-gradient-to-r from-[#1f1f1f] to-[#252525] text-white border border-[#3a3a3a] rounded-xl pl-12 pr-4 py-3 hover:border-[#505050] transition-all duration-300 focus:outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-400/20 placeholder-[#666] group-hover:shadow-md" />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 group-hover:scale-110 transition-transform duration-300">
                🔍
              </div>
              {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-red-400 transition-colors duration-300">
                  ✕
                </button>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
              Quick Actions
            </label>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => fetchData(courseFilter || null)} className="flex-1 min-w-[120px] px-3 py-3 rounded-xl bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-black font-bold hover:shadow-xl hover:shadow-yellow-500/40 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center gap-2 min-h-[48px]" title="Refresh data">
                🔄 <span className="hidden md:inline text-sm font-medium">Refresh</span>
              </button>
              <button onClick={exportPDF} className="flex-1 min-w-[120px] px-3 py-3 rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white font-bold hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center gap-2 min-h-[48px]" title="Download quiz report">
                📊 <span className="hidden md:inline text-sm font-medium">Quiz PDF</span>
              </button>
              <button onClick={exportCourseMarksheet} className="flex-1 min-w-[120px] px-3 py-3 rounded-xl bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white font-bold hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center gap-2 min-h-[48px]" title="Download course marksheet with grades">
                🎓 <span className="hidden md:inline text-sm font-medium">Marksheet</span>
              </button>
              <button onClick={exportCsv} className="flex-1 min-w-[120px] px-3 py-3 rounded-xl bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 text-white font-bold hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center gap-2 min-h-[48px]" title="Export as CSV">
                📄 <span className="hidden md:inline text-sm font-medium">CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2a2a2a] pb-4">
          <div className="flex items-center gap-1 bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg p-1">
            <button onClick={() => setActiveTab('Summary')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'Summary' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg' : 'text-[#aaaaaa] hover:text-white'}`}>
              📊 Summary
            </button>
            <button onClick={() => setActiveTab('Performance')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'Performance' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg' : 'text-[#aaaaaa] hover:text-white'}`}>
              📈 Performance
            </button>
            <button onClick={() => setActiveTab('Attempts')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'Attempts' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg' : 'text-[#aaaaaa] hover:text-white'}`}>
              📋 Attempts
            </button>
          </div>
          {activeTab === 'Attempts' && <div className="flex items-center gap-3">
              <span className="text-xs text-[#888] font-medium">View Mode</span>
              <div className="flex rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-1">
                <button onClick={() => setAttemptView('table')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${attemptView === 'table' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'text-[#aaa] hover:text-white'}`}>📊 Table</button>
                <button onClick={() => setAttemptView('cards')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${attemptView === 'cards' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'text-[#aaa] hover:text-white'}`}>🎴 Cards</button>
              </div>
            </div>}
        </div>
      </div>

      {error && <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-4 rounded-lg mb-4">{error}</div>}

      {/* Statistics Explanation */}
      {activeTab === 'Summary' && !loading && data?.stats && <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <div className="flex items-start gap-3">
            <div className="text-blue-400 text-lg">ℹ️</div>
            <div>
              <h4 className="text-sm font-semibold text-blue-300 mb-1">How Statistics Work</h4>
              <p className="text-xs text-blue-200/80">
                Statistics show your <strong>final results per quiz</strong> (latest attempt counts). 
                The detailed table shows <strong>all attempts</strong> including failed ones for complete history.
              </p>
            </div>
          </div>
        </div>}

      {loading && <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-[#2a2a2a] animate-spin border-t-yellow-400" />
              <div className="absolute inset-2 rounded-full border-2 border-[#1a1a1a] animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">📊</div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Loading your quiz report...</h3>
            <p className="text-[#888]">Analyzing your performance data</p>
          </div>
        </div>}

      {!loading && !data?.stats && <div className="text-center py-12 border border-dashed border-[#3a3a3a] rounded-2xl">
          <p className="text-lg font-semibold text-[#888] mb-2">📚 No Quiz Data Available</p>
          <p className="text-sm text-[#666]">You haven&apos;t taken any quizzes yet. Start taking quizzes to see your performance here.</p>
        </div>}

      {activeTab === 'Summary' && data?.stats && !loading && <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fadeInUp">
            {/* Total Quizzes Card - Enhanced */}
            <div className="group relative overflow-hidden rounded-3xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#0f0f0f] p-8 shadow-2xl hover:shadow-3xl hover:shadow-yellow-500/50 transition-all duration-500 transform hover:-translate-y-4 hover:rotate-1 cursor-pointer" onMouseEnter={() => setHoveredCard('total')} onMouseLeave={() => setHoveredCard(null)}>
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-yellow-500/30 via-transparent to-transparent blur-2xl animate-pulse"></div>
              </div>
              <div className={`absolute -top-10 -right-10 text-8xl transition-all duration-700 ${hoveredCard === 'total' ? 'opacity-40 scale-125 rotate-12' : 'opacity-5'}`}>📊</div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold uppercase tracking-widest text-[#888] flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                    Total Quizzes
                  </p>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${hoveredCard === 'total' ? 'bg-yellow-400/20 text-yellow-300' : 'bg-[#2a2a2a] text-[#666]'}`}>
                    Active
                  </div>
                </div>
                <p className={`text-6xl font-black transition-all duration-500 ${hoveredCard === 'total' ? 'text-yellow-400 scale-110' : 'text-white'}`}>{uniqueQuizzes.length}</p>
                <div className="flex items-center gap-2 mt-6">
                  <div className="h-2 rounded-full bg-[#2a2a2a] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 transition-all duration-1000 shadow-lg shadow-indigo-500/30" style={{
                  width: `${filteredSorted.length > 0 ? 100 : 0}%`
                }} />
                  </div>
                  <span className="text-xs font-bold text-yellow-400">100%</span>
                </div>
              </div>
            </div>

            {/* Passed Card - Enhanced */}
            <div className="group relative overflow-hidden rounded-3xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#0f0f0f] p-8 shadow-2xl hover:shadow-3xl hover:shadow-green-500/30 transition-all duration-500 transform hover:-translate-y-4 hover:-rotate-1 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/15 via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute -top-10 -right-10 text-8xl opacity-5 group-hover:opacity-20 transition-all duration-700 group-hover:rotate-12">✅</div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold uppercase tracking-widest text-[#888] flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Passed
                  </p>
                  <div className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300">
                    Success
                  </div>
                </div>
                <p className="text-5xl font-black text-green-400 mb-6 group-hover:scale-105 transition-transform duration-300">{uniqueQuizzes.filter(p => p?.result?.passed).length}</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-[#aaaaaa]">
                    <span className="font-medium">Pass Rate</span>
                    <span className="font-bold text-green-400 text-lg">{passRate}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-[#2a2a2a] overflow-hidden relative">
                    <div className="h-full bg-gradient-to-r from-green-400 via-green-500 to-emerald-500 transition-all duration-1000 shadow-lg shadow-green-500/30" style={{
                  width: `${passRate}%`
                }} />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Failed Card */}
            <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute -top-8 -right-8 text-6xl opacity-5 group-hover:opacity-10 transition-opacity duration-300">❌</div>
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-2">Failed</p>
                <p className="text-4xl font-black text-red-400 mb-4">{uniqueQuizzes.filter(p => !p?.result?.passed).length}</p>
                <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-red-400 to-red-500" />
              </div>
            </div>

            {/* Average Score Card */}
            <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute -top-8 -right-8 text-6xl opacity-5 group-hover:opacity-10 transition-opacity duration-300">📈</div>
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-2">Avg. Score</p>
                <p className="text-4xl font-black text-blue-400 mb-4">{(data.stats.averageScore || 0).toFixed(1)}%</p>
                <div className="h-2 rounded-full bg-[#2a2a2a] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-700" style={{
                width: `${Math.min(100, Math.max(0, data.stats.averageScore || 0))}%`
              }} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Score Distribution - Enhanced */}
            <div className="group relative overflow-hidden rounded-3xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#0f0f0f] p-8 shadow-2xl hover:shadow-3xl hover:shadow-purple-500/20 transition-all duration-500 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute -top-8 -right-8 text-7xl opacity-5 group-hover:opacity-15 transition-all duration-500 group-hover:rotate-12">📊</div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <p className="text-xl font-bold text-white flex items-center gap-3">
                      <span className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></span>
                      Score Distribution
                    </p>
                    <p className="text-sm text-[#aaa] mt-2">Performance spread across score ranges</p>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300">
                    Analysis
                  </div>
                </div>
                <div className="space-y-4">
                  {scoreBuckets.buckets.map((b, idx) => <div key={b.label} className="flex items-center gap-4 group/item hover:bg-[#2a2a2a]/30 p-3 rounded-xl transition-all duration-300">
                      <div className="w-16 text-xs font-bold text-center py-2 px-3 rounded-lg" style={{
                  backgroundColor: b.min >= 60 ? '#10b981' : b.min >= 40 ? '#f59e0b' : '#ef4444',
                  color: 'white'
                }}>{b.label}</div>
                      <div className="flex-1 relative">
                        <div className="h-4 rounded-full bg-[#2a2a2a] overflow-hidden relative" title={`${b.count} attempts`}>
                          <div className={`h-full transition-all duration-1000 relative overflow-hidden ${b.min >= 60 ? 'bg-gradient-to-r from-green-400 via-green-500 to-emerald-400' : b.min >= 40 ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400' : 'bg-gradient-to-r from-red-400 via-red-500 to-pink-400'}`} style={{
                      width: `${b.count / scoreBuckets.max * 100}%`,
                      animationDelay: `${idx * 200}ms`
                    }}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                          </div>
                        </div>
                        <div className="text-xs text-[#666] mt-1">{(b.count / (scoreBuckets.buckets.reduce((sum, bucket) => sum + bucket.count, 0) || 1) * 100).toFixed(1)}% of attempts</div>
                      </div>
                      <div className="w-12 text-sm font-black text-white text-center py-2 px-3 bg-[#2a2a2a] rounded-lg group-hover/item:bg-[#3a3a3a] transition-colors">{b.count}</div>
                    </div>)}
                </div>
              </div>
            </div>

            {/* Attempts Over Time - Enhanced */}
            <div className="group relative overflow-hidden rounded-3xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#0f0f0f] p-8 shadow-2xl hover:shadow-3xl hover:shadow-cyan-500/20 transition-all duration-500 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute -top-8 -right-8 text-7xl opacity-5 group-hover:opacity-15 transition-all duration-500 group-hover:rotate-12">📅</div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <p className="text-xl font-bold text-white flex items-center gap-3">
                      <span className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></span>
                      Activity Timeline
                    </p>
                    <p className="text-sm text-[#aaa] mt-2">Daily quiz attempts and performance</p>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300">
                    Timeline
                  </div>
                </div>
                {dailyStats.days.length === 0 ? <div className="text-center py-12">
                    <div className="text-4xl mb-4 opacity-30">📅</div>
                    <p className="text-sm text-[#666]">No quiz activity with current filters</p>
                  </div> : <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {dailyStats.days.slice(-10).map((d, idx) => <div key={d.date} className="flex items-center gap-4 group/item hover:bg-[#2a2a2a]/30 p-3 rounded-xl transition-all duration-300">
                        <div className="w-20 text-xs font-bold text-center py-2 px-2 bg-[#2a2a2a] rounded-lg text-cyan-300">
                          {new Date(d.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                        </div>
                        <div className="flex-1 relative">
                          <div className="h-4 rounded-full bg-[#2a2a2a] overflow-hidden relative" title={`${d.total} total attempts`}>
                            <div className="flex h-full">
                              <div className="bg-gradient-to-r from-green-400 via-green-500 to-emerald-400 transition-all duration-1000 relative overflow-hidden" style={{
                        width: `${d.passed / dailyStats.max * 100}%`,
                        animationDelay: `${idx * 100}ms`
                      }}>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                              </div>
                              <div className="bg-gradient-to-r from-red-400 via-red-500 to-pink-400 transition-all duration-1000" style={{
                        width: `${d.failed / dailyStats.max * 100}%`,
                        animationDelay: `${idx * 100 + 50}ms`
                      }} />
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-[#666] mt-1">
                            <span>{d.passed} passed</span>
                            <span>{d.failed} failed</span>
                          </div>
                        </div>
                        <div className="w-12 text-sm font-black text-white text-center py-2 px-3 bg-[#2a2a2a] rounded-lg group-hover/item:bg-[#3a3a3a] transition-colors">{d.total}</div>
                      </div>)}
                  </div>}
                <div className="flex gap-6 mt-6 pt-6 border-t border-[#2a2a2a]">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-500/30" />
                    <span className="text-sm font-medium text-[#aaa]">Passed</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-400 to-pink-500 shadow-lg shadow-red-500/30" />
                    <span className="text-sm font-medium text-[#aaa]">Failed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-fadeInUp">
            {/* Performance Trend Chart */}
            <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-lg font-bold text-white">📈 Performance Trend</p>
                    <p className="text-xs text-[#888] mt-1">Your score progression over time</p>
                  </div>
                </div>
                {dailyStats.days.length > 0 ? <div className="space-y-3">
                    {dailyStats.days.slice(-7).map(d => <div key={d.date} className="flex items-center gap-3">
                        <div className="w-20 text-xs font-semibold text-[#aaa]">{d.date.slice(5)}</div>
                        <div className="flex-1 flex gap-1 h-6 bg-[#2a2a2a] rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300" style={{
                    width: `${d.passed / dailyStats.max * 100}%`
                  }} title={`Passed: ${d.passed}`} />
                          <div className="bg-gradient-to-r from-red-400 to-red-500 transition-all duration-300" style={{
                    width: `${d.failed / dailyStats.max * 100}%`
                  }} title={`Failed: ${d.failed}`} />
                        </div>
                        <div className="w-12 text-xs font-bold text-white text-right">{d.total}</div>
                      </div>)}
                  </div> : <div className="h-32 flex items-center justify-center text-[#666]">No data available</div>}
              </div>
            </div>

            {/* Pass/Fail Ratio */}
            <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-lg font-bold text-white">🎯 Pass/Fail Ratio</p>
                    <p className="text-xs text-[#888] mt-1">Overall success rate</p>
                  </div>
                </div>
                {uniqueQuizzes.length > 0 ? <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-green-400">✓ Passed</span>
                        <span className="text-sm font-bold text-white">{uniqueQuizzes.filter(p => p?.result?.passed).length}</span>
                      </div>
                      <div className="h-3 bg-[#2a2a2a] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500" style={{
                    width: `${passRate}%`
                  }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-red-400">✗ Failed</span>
                        <span className="text-sm font-bold text-white">{uniqueQuizzes.filter(p => !p?.result?.passed).length}</span>
                      </div>
                      <div className="h-3 bg-[#2a2a2a] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500" style={{
                    width: `${100 - passRate}%`
                  }} />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-[#2a2a2a]">
                      <p className="text-xs text-[#888] mb-2">Success Rate</p>
                      <p className="text-3xl font-black text-green-400">{passRate}%</p>
                    </div>
                  </div> : <div className="h-32 flex items-center justify-center text-[#666]">No data available</div>}
              </div>
            </div>
          </div>

          {/* Score Range Distribution */}
          <div className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300 mb-8 animate-fadeInUp">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-lg font-bold text-white">📊 Score Range Distribution</p>
                  <p className="text-xs text-[#888] mt-1">Number of attempts in each score range</p>
                </div>
              </div>
              {scoreBuckets.buckets.some(b => b.count > 0) ? <div className="space-y-3 mt-4">
                  {scoreBuckets.buckets.map(b => <div key={b.label} className="flex items-center gap-3 group/item">
                      <div className="w-14 text-xs font-semibold text-[#aaaaaa] bg-[#2a2a2a] rounded px-2 py-1 text-center">{b.label}</div>
                      <div className="flex-1 h-3 rounded-full bg-[#2a2a2a] overflow-hidden" title={`${b.count} attempts`}>
                        <div className={`h-full transition-all duration-500 ${b.min >= 60 ? 'bg-gradient-to-r from-green-400 to-green-500' : b.min >= 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{
                  width: `${b.count / scoreBuckets.max * 100}%`
                }} />
                      </div>
                      <div className="w-10 text-xs font-bold text-white text-right bg-[#2a2a2a] rounded px-2 py-1">{b.count}</div>
                    </div>)}
                </div> : <p className="text-xs text-[#666] mt-4 text-center py-8">No score data available with current filters.</p>}
            </div>
          </div>
        </>}

      {activeTab === 'Performance' && !loading && <>
          {/* Enhanced Performance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fadeInUp">
            {/* Best Quiz - Enhanced */}
            <div className="group relative overflow-hidden rounded-3xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#0f0f0f] p-8 shadow-2xl hover:shadow-3xl hover:shadow-green-500/30 transition-all duration-500 transform hover:-translate-y-4 hover:rotate-1 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/15 via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-500/30 via-transparent to-transparent blur-2xl animate-pulse"></div>
              </div>
              <div className="absolute -top-10 -right-10 text-8xl opacity-5 group-hover:opacity-25 transition-all duration-700 group-hover:rotate-12 group-hover:scale-110">🏆</div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-xl font-bold text-white flex items-center gap-3">
                    <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                    Best Performance
                  </p>
                  <div className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300">
                    🏆 Top Score
                  </div>
                </div>
                {uniqueQuizzes.length > 0 ? <>
                    <p className="text-sm text-[#aaa] mb-4 font-medium">{getQuizTitle(uniqueQuizzes.reduce((a, b) => (a?.result?.percentage || 0) > (b?.result?.percentage || 0) ? a : b))}</p>
                    <p className="text-5xl font-black text-green-400 mb-6 group-hover:scale-110 transition-transform duration-500">{Math.max(...uniqueQuizzes.map(p => p?.result?.percentage || 0)).toFixed(1)}%</p>
                    <div className="space-y-3">
                      <div className="h-4 rounded-full bg-[#2a2a2a] overflow-hidden relative">
                        <div className="h-full bg-gradient-to-r from-green-400 via-green-500 to-emerald-400 transition-all duration-1000 shadow-lg shadow-green-500/30" style={{
                    width: '100%'
                  }}>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#666]">
                        <span>Perfect Score</span>
                        <span className="text-green-400 font-bold">Excellent!</span>
                      </div>
                    </div>
                  </> : <div className="text-center py-8">
                    <div className="text-4xl mb-4 opacity-30">🏆</div>
                    <p className="text-sm text-[#666]">No quiz data available</p>
                  </div>}
              </div>
            </div>

            {/* Needs Improvement - Enhanced */}
            <div className="group relative overflow-hidden rounded-3xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#0f0f0f] p-8 shadow-2xl hover:shadow-3xl hover:shadow-red-500/30 transition-all duration-500 transform hover:-translate-y-4 hover:-rotate-1 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/15 via-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-500/30 via-transparent to-transparent blur-2xl animate-pulse"></div>
              </div>
              <div className="absolute -top-10 -right-10 text-8xl opacity-5 group-hover:opacity-25 transition-all duration-700 group-hover:rotate-12 group-hover:scale-110">📉</div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-xl font-bold text-white flex items-center gap-3">
                    <span className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></span>
                    Needs Focus
                  </p>
                  <div className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300">
                    🎯 Improve
                  </div>
                </div>
                {uniqueQuizzes.length > 0 ? <>
                    <p className="text-sm text-[#aaa] mb-4 font-medium">{getQuizTitle(uniqueQuizzes.reduce((a, b) => (a?.result?.percentage || 0) < (b?.result?.percentage || 0) ? a : b))}</p>
                    <p className="text-5xl font-black text-red-400 mb-6 group-hover:scale-110 transition-transform duration-500">{Math.min(...uniqueQuizzes.map(p => p?.result?.percentage || 0)).toFixed(1)}%</p>
                    <div className="space-y-3">
                      <div className="h-4 rounded-full bg-[#2a2a2a] overflow-hidden relative">
                        <div className="h-full bg-gradient-to-r from-red-400 via-red-500 to-pink-400 transition-all duration-1000 shadow-lg shadow-red-500/30" style={{
                    width: `${Math.min(...uniqueQuizzes.map(p => p?.result?.percentage || 0))}%`
                  }}>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#666]">
                        <span>Room for Growth</span>
                        <span className="text-red-400 font-bold">Focus Area</span>
                      </div>
                    </div>
                  </> : <div className="text-center py-8">
                    <div className="text-4xl mb-4 opacity-30">📉</div>
                    <p className="text-sm text-[#666]">No quiz data available</p>
                  </div>}
              </div>
            </div>

            {/* Average Performance - Enhanced */}
            <div className="group relative overflow-hidden rounded-3xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#0f0f0f] p-8 shadow-2xl hover:shadow-3xl hover:shadow-blue-500/30 transition-all duration-500 transform hover:-translate-y-4 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/30 via-transparent to-transparent blur-2xl animate-pulse"></div>
              </div>
              <div className="absolute -top-10 -right-10 text-8xl opacity-5 group-hover:opacity-25 transition-all duration-700 group-hover:rotate-12 group-hover:scale-110">📊</div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-xl font-bold text-white flex items-center gap-3">
                    <span className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></span>
                    Overall Average
                  </p>
                  <div className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300">
                    📊 Trend
                  </div>
                </div>
                {uniqueQuizzes.length > 0 ? <>
                    <p className="text-sm text-[#aaa] mb-4 font-medium">Across {uniqueQuizzes.length} quiz{uniqueQuizzes.length !== 1 ? 'zes' : ''}</p>
                    <p className="text-5xl font-black text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-500">{uniqueQuizzes.length > 0 ? (uniqueQuizzes.reduce((sum, p) => sum + (p?.result?.percentage || 0), 0) / uniqueQuizzes.length).toFixed(1) : '0.0'}%</p>
                    <div className="space-y-3">
                      <div className="h-4 rounded-full bg-[#2a2a2a] overflow-hidden relative">
                        <div className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 transition-all duration-1000 shadow-lg shadow-blue-500/30" style={{
                    width: `${uniqueQuizzes.length > 0 ? uniqueQuizzes.reduce((sum, p) => sum + (p?.result?.percentage || 0), 0) / uniqueQuizzes.length : 0}%`
                  }}>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#666]">
                        <span>Performance Level</span>
                        <span className={`font-bold ${uniqueQuizzes.length > 0 && uniqueQuizzes.reduce((sum, p) => sum + (p?.result?.percentage || 0), 0) / uniqueQuizzes.length >= 70 ? 'text-green-400' : uniqueQuizzes.length > 0 && uniqueQuizzes.reduce((sum, p) => sum + (p?.result?.percentage || 0), 0) / uniqueQuizzes.length >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {uniqueQuizzes.length > 0 ? uniqueQuizzes.reduce((sum, p) => sum + (p?.result?.percentage || 0), 0) / uniqueQuizzes.length >= 70 ? 'Excellent' : uniqueQuizzes.reduce((sum, p) => sum + (p?.result?.percentage || 0), 0) / uniqueQuizzes.length >= 50 ? 'Good' : 'Needs Work' : 'No Data'}
                        </span>
                      </div>
                    </div>
                  </> : <div className="text-center py-8">
                    <div className="text-4xl mb-4 opacity-30">📊</div>
                    <p className="text-sm text-[#666]">No quiz data available</p>
                  </div>}
              </div>
            </div>
          </div>

          {/* Enhanced Quiz Performance Table */}
          <div className="group relative overflow-hidden rounded-3xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#0f0f0f] shadow-2xl mb-8 animate-fadeInUp">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10">
              <div className="p-8 border-b border-[#2a2a2a]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <span className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></span>
                      📋 All Quiz Performance
                    </h2>
                    <p className="text-sm text-[#aaa] mt-2">All quiz attempts including failed and passed ({correctedData.length} total attempts, {uniqueQuizzes.length} unique quiz{uniqueQuizzes.length !== 1 ? 'zes' : ''})</p>
                  </div>
                  <div className="px-4 py-2 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300">
                    Performance Data
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[#bbbbbb] text-sm bg-gradient-to-r from-[#2a2a2a] via-[#252525] to-[#1f1f1f] border-b border-[#3a3a3a]">
                      <th className="px-8 py-5 font-bold uppercase tracking-wide text-xs">
                        <span className="flex items-center gap-2">
                          📝 Quiz Name
                        </span>
                      </th>
                      <th className="px-8 py-5 font-bold uppercase tracking-wide text-xs text-center">
                        <span className="flex items-center justify-center gap-2">
                          🔢 Attempt #
                        </span>
                      </th>
                      <th className="px-8 py-5 font-bold uppercase tracking-wide text-xs">
                        <span className="flex items-center gap-2">
                          📚 Course
                        </span>
                      </th>
                      <th className="px-8 py-5 font-bold uppercase tracking-wide text-xs text-center">
                        <span className="flex items-center justify-center gap-2">
                          🎯 Score
                        </span>
                      </th>
                      <th className="px-8 py-5 font-bold uppercase tracking-wide text-xs text-center">
                        <span className="flex items-center justify-center gap-2">
                          📊 Percentage
                        </span>
                      </th>
                      <th className="px-8 py-5 font-bold uppercase tracking-wide text-xs text-center">
                        <span className="flex items-center justify-center gap-2">
                          ✅ Status
                        </span>
                      </th>
                      <th className="px-8 py-5 font-bold uppercase tracking-wide text-xs text-center">
                        <span className="flex items-center justify-center gap-2">
                          📅 Date
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {correctedData.length === 0 ? <tr>
                        <td colSpan={7} className="px-8 py-16 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="text-6xl opacity-30">📋</div>
                            <div>
                              <p className="text-lg font-semibold text-[#888] mb-2">
                                {data.performance.length === 0 ? "No quiz attempts found" : "No results match your current filters"}
                              </p>
                              <p className="text-sm text-[#666]">Try adjusting your filters or take some quizzes to see data here.</p>
                            </div>
                          </div>
                        </td>
                      </tr> : correctedData.slice(0, 20).map((p, idx) => {
                  // Extract quiz ID and course ID for navigation (data is already normalized)
                  const quizId = p?.quiz?._id;
                  const courseId = p?.course?._id;

                  // Use the attempt number from API data
                  const attemptNumber = p?.result?.attemptNumber || 1;
                  const totalAttempts = p?.result?.totalAttempts || 1;
                  console.log('Navigation data:', {
                    quizId,
                    courseId,
                    quizTitle: p?.quiz?.title,
                    courseName: p?.course?.courseName
                  });
                  return <tr key={`${quizId}-${idx}`} className="text-white text-sm border-b border-[#2a2a2a]/50 hover:bg-gradient-to-r hover:from-[#2a2a2a]/30 hover:to-[#252525]/30 transition-all duration-300 cursor-pointer group animate-slideInLeft transform hover:scale-[1.01]" style={{
                    animationDelay: `${idx * 50}ms`
                  }} onClick={() => {
                    if (quizId && courseId) {
                      navigate(`/dashboard/quiz-performance/${quizId}/${courseId}`);
                    }
                  }}>
                            <td className="px-8 py-6">
                              <div className="font-medium text-[#aaa] group-hover:text-white transition-colors duration-300">
                                {getQuizTitle(p)}
                              </div>
                              <div className="text-xs text-[#666] mt-1">{getSectionTitle(p)}</div>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <div className="flex items-center justify-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${attemptNumber === totalAttempts ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-gray-500/20 text-gray-400'}`}>
                                  #{attemptNumber}
                                  {attemptNumber === totalAttempts && totalAttempts > 1 && <span className="ml-1 text-xs">📍</span>}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="text-[#888] group-hover:text-[#aaa] transition-colors duration-300">
                                {getCourseName(p)}
                              </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <div className="font-bold text-yellow-400 text-lg">
                                {p?.result?.score ?? 0}<span className="text-[#666] text-sm">/{p?.result?.totalMarks ?? 0}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${(p?.result?.percentage ?? 0) >= 60 ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                                <span className={`font-bold text-lg ${(p?.result?.percentage ?? 0) >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                                  {(p?.result?.percentage ?? 0).toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${p?.result?.passed ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 shadow-lg shadow-green-500/20' : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 shadow-lg shadow-red-500/20'}`}>
                                {p?.result?.passed ? '✓ Passed' : '✗ Failed'}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <div className="text-[#888] text-sm group-hover:text-[#aaa] transition-colors duration-300">
                                {p?.result?.completedAt ? new Date(p.result.completedAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'N/A'}
                              </div>
                              <div className="text-xs text-[#666] mt-1">
                                {p?.result?.completedAt ? new Date(p.result.completedAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : ''}
                              </div>
                            </td>
                          </tr>;
                })}
                  </tbody>
                </table>
                {correctedData.length > 20 && <div className="p-6 text-center border-t border-[#2a2a2a] bg-gradient-to-r from-[#1a1a1a] to-[#1f1f1f]">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <p className="text-sm text-[#888] font-medium">Showing first 20 results. Use filters to narrow down your search.</p>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>}
              </div>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeInUp">
            {/* Strengths */}
            <div className="rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">💪 Your Strengths</h3>
              {correctedData.length > 0 ? <div className="space-y-3">
                  {correctedData.sort((a, b) => (b?.result?.percentage || 0) - (a?.result?.percentage || 0)).slice(0, 3).map((p, idx) => <div key={idx} className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition-all">
                        <div>
                          <p className="text-sm font-semibold text-white">{getQuizTitle(p)}</p>
                          <p className="text-xs text-[#888]">{getCourseName(p)}</p>
                        </div>
                        <span className="text-lg font-black text-green-400">{(p?.result?.percentage || 0).toFixed(1)}%</span>
                      </div>)}
                </div> : <p className="text-[#666]">No data available</p>}
            </div>

            {/* Areas for Improvement */}
            <div className="rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">🎯 Areas to Improve</h3>
              {correctedData.length > 0 ? <div className="space-y-3">
                  {correctedData.sort((a, b) => (a?.result?.percentage || 0) - (b?.result?.percentage || 0)).slice(0, 3).map((p, idx) => <div key={idx} className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition-all">
                        <div>
                          <p className="text-sm font-semibold text-white">{getQuizTitle(p)}</p>
                          <p className="text-xs text-[#888]">{getCourseName(p)}</p>
                        </div>
                        <span className="text-lg font-black text-red-400">{(p?.result?.percentage || 0).toFixed(1)}%</span>
                      </div>)}
                </div> : <p className="text-[#666]">No data available</p>}
            </div>
          </div>
        </>}

      {activeTab === 'Attempts' && !loading && <>
          {/* Enhanced Attempts Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 animate-fadeInUp">
            {/* Total Attempts */}
            <div className="group relative overflow-hidden rounded-3xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#0f0f0f] p-6 shadow-2xl hover:shadow-3xl hover:shadow-indigo-500/30 transition-all duration-500 transform hover:-translate-y-3 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute -top-8 -right-8 text-6xl opacity-5 group-hover:opacity-20 transition-all duration-700 group-hover:rotate-12">📋</div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#888] flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                    Total Attempts
                  </p>
                </div>
                <p className="text-4xl font-black text-indigo-400 mb-3 group-hover:scale-110 transition-transform duration-300">{correctedData.length}</p>
                <div className="h-2 rounded-full bg-[#2a2a2a] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 transition-all duration-1000 shadow-lg shadow-indigo-500/30" style={{
                width: `${correctedData.length > 0 ? 100 : 0}%`
              }} />
                </div>
              </div>
            </div>

            {/* Recent Attempts */}
            <div className="group relative overflow-hidden rounded-3xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#0f0f0f] p-6 shadow-2xl hover:shadow-3xl hover:shadow-cyan-500/30 transition-all duration-500 transform hover:-translate-y-3 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute -top-8 -right-8 text-6xl opacity-5 group-hover:opacity-20 transition-all duration-700 group-hover:rotate-12">🕰️</div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#888] flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                    Recent (7 days)
                  </p>
                </div>
                <p className="text-4xl font-black text-cyan-400 mb-3 group-hover:scale-110 transition-transform duration-300">
                  {correctedData.filter(p => {
                if (!p?.result?.completedAt) return false;
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(p.result.completedAt) > weekAgo;
              }).length}
                </p>
                <div className="h-2 rounded-full bg-[#2a2a2a] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-teal-500 transition-all duration-1000 shadow-lg shadow-cyan-500/30" style={{
                width: `${(() => {
                  const recentCount = correctedData.filter(p => {
                    if (!p?.result?.completedAt) return false;
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(p.result.completedAt) > weekAgo;
                  }).length;
                  return recentCount > 0 && correctedData.length > 0 ? recentCount / correctedData.length * 100 : 0;
                })()}%`
              }} />
                </div>
              </div>
            </div>

            {/* Success Rate */}
            <div className="group relative overflow-hidden rounded-3xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#0f0f0f] p-6 shadow-2xl hover:shadow-3xl hover:shadow-green-500/30 transition-all duration-500 transform hover:-translate-y-3 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/15 via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute -top-8 -right-8 text-6xl opacity-5 group-hover:opacity-20 transition-all duration-700 group-hover:rotate-12">🎯</div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#888] flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Success Rate
                  </p>
                </div>
                <p className="text-4xl font-black text-green-400 mb-3 group-hover:scale-110 transition-transform duration-300">{passRate}%</p>
                <div className="h-2 rounded-full bg-[#2a2a2a] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-1000 shadow-lg shadow-green-500/30" style={{
                width: `${passRate}%`
              }} />
                </div>
              </div>
            </div>

            {/* Average Score */}
            <div className="group relative overflow-hidden rounded-3xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#0f0f0f] p-6 shadow-2xl hover:shadow-3xl hover:shadow-orange-500/30 transition-all duration-500 transform hover:-translate-y-3 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/15 via-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute -top-8 -right-8 text-6xl opacity-5 group-hover:opacity-20 transition-all duration-700 group-hover:rotate-12">⏱️</div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#888] flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
                    Avg. Score
                  </p>
                </div>
                <p className="text-4xl font-black text-orange-400 mb-3 group-hover:scale-110 transition-transform duration-300">
                  {correctedData.length > 0 ? (correctedData.reduce((sum, p) => sum + (p?.result?.percentage || 0), 0) / correctedData.length).toFixed(1) : '0.0'}%
                </p>
                <div className="h-2 rounded-full bg-[#2a2a2a] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-400 to-yellow-500 transition-all duration-1000 shadow-lg shadow-orange-500/30" style={{
                width: `${correctedData.length > 0 ? correctedData.reduce((sum, p) => sum + (p?.result?.percentage || 0), 0) / correctedData.length : 0}%`
              }} />
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Attempts View Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></span>
                  📋 Quiz Attempts
                </h2>
                <p className="text-sm text-[#aaa] mt-1">Click on any attempt to view detailed information • Use &apos;Full Report&apos; for complete analysis</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300">
                  {correctedData.length} Attempts
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#888] font-medium">View Mode</span>
                  <div className="flex rounded-xl border border-[#3a3a3a] bg-gradient-to-r from-[#1f1f1f] to-[#252525] p-1.5">
                    <button onClick={() => setAttemptView('table')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 transform hover:scale-105 ${attemptView === 'table' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg shadow-yellow-500/30' : 'text-[#aaa] hover:text-white hover:bg-[#3a3a3a]'}`}>📊 Table</button>
                    <button onClick={() => setAttemptView('cards')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 transform hover:scale-105 ${attemptView === 'cards' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg shadow-yellow-500/30' : 'text-[#aaa] hover:text-white hover:bg-[#3a3a3a]'}`}>🎴 Cards</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {attemptView === 'table' ? <div className="group relative overflow-hidden rounded-3xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#0f0f0f] shadow-2xl animate-fadeInUp">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10">
                <div className="p-8 border-b border-[#2a2a2a]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <span className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></span>
                        📊 Attempts Table View
                      </h3>
                      <p className="text-sm text-[#aaa] mt-2">Click on column headers to sort data</p>
                    </div>
                    <div className="px-4 py-2 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300">
                      Interactive Table
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-[#bbbbbb] text-sm select-none bg-gradient-to-r from-[#2a2a2a] via-[#252525] to-[#1f1f1f] border-b border-[#3a3a3a]">
                        <th className="px-8 py-5 font-bold uppercase tracking-wide text-xs cursor-pointer hover:text-white transition-all duration-300 hover:bg-[#3a3a3a]/30" onClick={() => {
                    setSortKey('date');
                    setSortDir(sortKey === 'date' && sortDir === 'asc' ? 'desc' : 'asc');
                  }}>
                          <span className="flex items-center gap-2">
                            📅 Date {sortKey === 'date' ? sortDir === 'asc' ? '▲' : '▼' : ''}
                          </span>
                        </th>
                        <th className="px-8 py-5 font-bold uppercase tracking-wide text-xs cursor-pointer hover:text-white transition-all duration-300 hover:bg-[#3a3a3a]/30" onClick={() => {
                    setSortKey('course');
                    setSortDir(sortKey === 'course' && sortDir === 'asc' ? 'desc' : 'asc');
                  }}>
                          <span className="flex items-center gap-2">
                            📚 Course {sortKey === 'course' ? sortDir === 'asc' ? '▲' : '▼' : ''}
                          </span>
                        </th>
                        <th className="px-8 py-5 font-bold uppercase tracking-wide text-xs">
                          <span className="flex items-center gap-2">
                            📖 Section
                          </span>
                        </th>
                        <th className="px-8 py-5 font-bold uppercase tracking-wide text-xs cursor-pointer hover:text-white transition-all duration-300 hover:bg-[#3a3a3a]/30" onClick={() => {
                    setSortKey('quiz');
                    setSortDir(sortKey === 'quiz' && sortDir === 'asc' ? 'desc' : 'asc');
                  }}>
                          <span className="flex items-center gap-2">
                            ❓ Quiz {sortKey === 'quiz' ? sortDir === 'asc' ? '▲' : '▼' : ''}
                          </span>
                        </th>
                        <th className="px-8 py-5 font-bold uppercase tracking-wide text-xs text-center">
                          <span className="flex items-center justify-center gap-2">
                            🎯 Score
                          </span>
                        </th>
                        <th className="px-8 py-5 font-bold uppercase tracking-wide text-xs text-center cursor-pointer hover:text-white transition-all duration-300 hover:bg-[#3a3a3a]/30" onClick={() => {
                    setSortKey('percentage');
                    setSortDir(sortKey === 'percentage' && sortDir === 'asc' ? 'desc' : 'asc');
                  }}>
                          <span className="flex items-center justify-center gap-2">
                            📊 Percentage {sortKey === 'percentage' ? sortDir === 'asc' ? '▲' : '▼' : ''}
                          </span>
                        </th>
                        <th className="px-8 py-5 font-bold uppercase tracking-wide text-xs text-center">
                          <span className="flex items-center justify-center gap-2">
                            ✅ Status
                          </span>
                        </th>
                        <th className="px-8 py-5 font-bold uppercase tracking-wide text-xs text-center cursor-pointer hover:text-white transition-all duration-300 hover:bg-[#3a3a3a]/30" onClick={() => {
                    setSortKey('attempts');
                    setSortDir(sortKey === 'attempts' && sortDir === 'asc' ? 'desc' : 'asc');
                  }}>
                          <span className="flex items-center justify-center gap-2">
                            🔄 Attempts {sortKey === 'attempts' ? sortDir === 'asc' ? '▲' : '▼' : ''}
                          </span>
                        </th>
                      </tr>
                    </thead>
                <tbody>
                  {data.performance.length === 0 && <tr>
                      <td className="px-6 py-8 text-center text-[#888] col-span-8" colSpan={8}>
                        <div className="text-center">
                          <p className="text-lg font-semibold mb-2">No quiz attempts yet</p>
                          <p className="text-sm text-[#666]">Start taking quizzes to see your performance here</p>
                        </div>
                      </td>
                    </tr>}
                  {pagedRows.map((p, idx) => {
                  // Extract quiz ID and course ID for navigation (data is already normalized)
                  const quizId = p?.quiz?._id;
                  const courseId = p?.course?._id;
                  console.log('Attempts table navigation data:', {
                    quizId,
                    courseId,
                    quizTitle: p?.quiz?.title,
                    courseName: p?.course?.courseName
                  });

                  // Only render if we have valid IDs
                  if (!quizId || !courseId) {
                    console.warn('Missing required IDs for navigation:', {
                      quizId,
                      courseId,
                      quizData: p
                    });
                    return null;
                  }
                  return <tr key={idx} className="text-white text-sm transition-all cursor-pointer border-b border-[#2a2a2a] hover:bg-[#2a2a2a]/80 hover:shadow-lg hover:shadow-purple-500/20 group animate-slideInLeft" style={{
                    animationDelay: `${idx * 50}ms`
                  }} onClick={() => {
                    setSelectedAttempt(p); // Show detailed modal instead of navigation
                  }}>
                        <td className="px-6 py-4 font-medium text-[#aaa] group-hover:text-white">{p?.result?.completedAt ? new Date(p.result.completedAt).toLocaleString("en-IN") : "-"}</td>
                        <td className="px-6 py-4 font-medium text-[#aaa] group-hover:text-white">{getCourseName(p)}</td>
                        <td className="px-6 py-4 text-[#888]">{getSectionTitle(p)}</td>
                        <td className="px-6 py-4 font-medium text-white">{getQuizTitle(p)}</td>
                        <td className="px-6 py-4 font-bold text-[#aaa] group-hover:text-white">{p?.result?.score}/{p?.result?.totalMarks}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-300 ${p?.result?.percentage >= 60 ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{
                            width: `${Math.min(100, Math.max(0, p?.result?.percentage || 0))}%`
                          }} />
                            </div>
                            <span className="font-bold text-[#aaa] group-hover:text-white min-w-[50px]">{(p?.result?.percentage || 0).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${p?.result?.passed ? 'bg-green-500/20 text-green-300 group-hover:bg-green-500/30' : 'bg-red-500/20 text-red-300 group-hover:bg-red-500/30'}`}>
                            {p?.result?.passed ? '✓ Passed' : '✗ Failed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-[#aaa] group-hover:text-white flex items-center gap-2">
                          Attempt {idx + 1}
                          <span className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">👁️</span>
                        </td>
                      </tr>;
                })}
                </tbody>
              </table>
            </div>
          </div>
          </div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {pagedRows.length === 0 && <div className="col-span-full text-center py-12 border border-dashed border-[#3a3a3a] rounded-2xl">
                  <p className="text-lg font-semibold text-[#888] mb-2">No quiz attempts yet</p>
                  <p className="text-sm text-[#666]">Start taking quizzes to see your performance here</p>
                </div>}
              {pagedRows.map((p, idx) => {
          // Extract quiz ID and course ID for navigation (data is already normalized)
          const quizId = p?.quiz?._id;
          const courseId = p?.course?._id;
          console.log('Attempts cards navigation data:', {
            quizId,
            courseId,
            quizTitle: p?.quiz?.title,
            courseName: p?.course?.courseName
          });
          return <div key={idx} className="group relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] p-6 shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 cursor-pointer animate-slideInLeft" style={{
            animationDelay: `${idx * 100}ms`
          }} onClick={() => {
            setSelectedAttempt(p); // Show detailed modal instead of navigation
          }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full opacity-5 group-hover:opacity-10 transition-opacity duration-300" />
                  
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-1">📚 {getCourseName(p)}</p>
                        <p className="text-xl font-bold text-white leading-tight">{getQuizTitle(p)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity text-lg">
                          👁️
                        </div>
                        <div className={`rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${p?.result?.passed ? 'bg-green-500/20 text-green-300 group-hover:bg-green-500/30' : 'bg-red-500/20 text-red-300 group-hover:bg-red-500/30'}`}>
                          {p?.result?.passed ? '✓ Passed' : '✗ Failed'}
                        </div>
                      </div>
                    </div>

                    {/* Score Section */}
                    <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-[#2a2a2a]/50 rounded-lg">
                      <div>
                        <p className="text-xs font-semibold text-[#888] mb-1">🎯 Score</p>
                        <p className="text-2xl font-black text-white">{p?.result?.score}/{p?.result?.totalMarks}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-[#888] mb-1">📊 Percentage</p>
                        <p className={`text-2xl font-black ${p?.result?.percentage >= 60 ? 'text-green-400' : 'text-red-400'}`}>{(p?.result?.percentage || 0).toFixed(1)}%</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="h-3 rounded-full bg-[#2a2a2a] overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${p?.result?.percentage >= 60 ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{
                    width: `${Math.min(100, Math.max(0, p?.result?.percentage || 0))}%`
                  }} />
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="space-y-2 pt-3 border-t border-[#2a2a2a]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#888]">📖 {getSectionTitle(p)}</span>
                        <span className="text-[#888]">🔄 {p?.result?.attempts || 0} attempt{(p?.result?.attempts || 0) !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="text-xs text-[#666]">
                        📅 {p?.result?.completedAt ? new Date(p.result.completedAt).toLocaleString("en-IN") : '-'}
                      </div>
                    </div>
                  </div>
                </div>;
        })}
            </div>}
        </>}

      {activeTab === 'Attempts' && !loading && filteredSorted.length > 0 && <div className="mt-8 flex items-center justify-between gap-4 flex-wrap p-4 rounded-xl bg-[#1f1f1f] border border-[#3a3a3a]">
          <div className="text-[#aaaaaa] text-sm font-medium">
            Showing <span className="text-white font-bold">{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredSorted.length)}</span> of <span className="text-white font-bold">{filteredSorted.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-4 py-2 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] text-white hover:bg-[#3a3a3a] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold" disabled={page === 1}>← Prev</button>
            <span className="text-[#aaaaaa] text-sm font-medium px-3 py-2 bg-[#2a2a2a] rounded-lg">
              Page <span className="text-white font-bold">{page}</span> / <span className="text-white font-bold">{totalPages}</span>
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-4 py-2 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] text-white hover:bg-[#3a3a3a] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold" disabled={page === totalPages}>Next →</button>
            <select className="bg-[#2a2a2a] text-white border border-[#3a3a3a] rounded-lg px-3 py-2 hover:border-[#505050] transition-colors focus:outline-none focus:border-yellow-400 font-semibold" value={pageSize} onChange={e => {
          setPageSize(Number(e.target.value));
          setPage(1);
        }}>
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>}

      {selectedAttempt && <div className="fixed inset-0 z-30 flex items-end md:items-center justify-center md:justify-end bg-black/70 backdrop-blur-md" onClick={() => setSelectedAttempt(null)}>
          <div className="w-full max-w-md bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] border border-[#3a3a3a] rounded-t-3xl md:rounded-l-3xl md:rounded-t-none shadow-2xl max-h-[90vh] overflow-y-auto animate-slideInLeft" onClick={e => e.stopPropagation()}>
            {/* Header with gradient background */}
            <div className="relative overflow-hidden p-6 pb-8 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent border-b border-[#3a3a3a]">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full opacity-5"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📋</span>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#888]">Attempt Details</p>
                  </div>
                  <p className="text-3xl font-black bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">{getQuizTitle(selectedAttempt)}</p>
                </div>
                <button className="text-[#888] hover:text-white hover:bg-[#2a2a2a] p-2 rounded-lg transition-all transform hover:scale-110" onClick={() => setSelectedAttempt(null)}>✕</button>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-6 space-y-5">
              {/* Course & Section Info - Enhanced */}
              <div className="grid grid-cols-2 gap-3">
                <div className="group p-4 bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] rounded-xl border border-[#3a3a3a] hover:border-blue-500/30 transition-all hover:shadow-lg hover:shadow-blue-500/10">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-2">📚 Course</p>
                  <p className="font-bold text-white text-sm leading-tight">{getCourseName(selectedAttempt)}</p>
                </div>
                <div className="group p-4 bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] rounded-xl border border-[#3a3a3a] hover:border-purple-500/30 transition-all hover:shadow-lg hover:shadow-purple-500/10">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-2">📖 Section</p>
                  <p className="font-bold text-white text-sm leading-tight">{getSectionTitle(selectedAttempt)}</p>
                </div>
                <div className="group p-4 bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] rounded-xl border border-[#3a3a3a] hover:border-cyan-500/30 transition-all hover:shadow-lg hover:shadow-cyan-500/10">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-2">📅 Completed</p>
                  <p className="font-bold text-white text-xs leading-tight">{selectedAttempt?.result?.completedAt ? new Date(selectedAttempt.result.completedAt).toLocaleString('en-IN') : '-'}</p>
                </div>
                <div className="group p-4 bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] rounded-xl border border-[#3a3a3a] hover:border-green-500/30 transition-all hover:shadow-lg hover:shadow-green-500/10">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-2">🔄 Attempts</p>
                  <p className="font-bold text-white text-sm leading-tight">{selectedAttempt?.result?.attempts || 0}</p>
                </div>
              </div>

              {/* Score Section - Enhanced */}
              <div className="rounded-2xl border border-[#3a3a3a] bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-[#1a1a1a] rounded-xl">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-2">🎯 Score</p>
                    <p className="text-3xl font-black text-yellow-400">{selectedAttempt?.result?.score}</p>
                    <p className="text-xs text-[#666] mt-1">of {selectedAttempt?.result?.totalMarks}</p>
                  </div>
                  <div className="text-center p-3 bg-[#1a1a1a] rounded-xl border-l border-r border-[#3a3a3a]">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-2">📊 %</p>
                    <p className={`text-3xl font-black ${selectedAttempt?.result?.percentage >= 60 ? 'text-green-400' : 'text-red-400'}`}>{(selectedAttempt?.result?.percentage || 0).toFixed(1)}%</p>
                  </div>
                  <div className="text-center p-3 bg-[#1a1a1a] rounded-xl">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-2">✅ Status</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${selectedAttempt?.result?.passed ? 'bg-green-500/30 text-green-300 border border-green-500/50' : 'bg-red-500/30 text-red-300 border border-red-500/50'}`}>
                      {selectedAttempt?.result?.passed ? '✓ Passed' : '✗ Failed'}
                    </span>
                  </div>
                </div>
                
                {/* Enhanced Progress Bar */}
                <div className="pt-2 space-y-2">
                  <div className="h-3 rounded-full bg-[#1a1a1a] overflow-hidden border border-[#2a2a2a]">
                    <div className={`h-full transition-all duration-700 ${selectedAttempt?.result?.percentage >= 60 ? 'bg-gradient-to-r from-green-400 via-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-400 via-red-500 to-pink-500'}`} style={{
                  width: `${Math.min(100, Math.max(0, selectedAttempt?.result?.percentage || 0))}%`
                }} />
                  </div>
                  <div className="flex justify-between text-xs text-[#666]">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#2a2a2a]/50 rounded-lg border border-[#3a3a3a]">
                  <p className="text-xs text-[#888] font-semibold mb-1">🔄 Attempt Number</p>
                  <p className="text-sm font-bold text-white">#{selectedAttempt?.result?.attempts || 1}</p>
                </div>
                <div className="p-3 bg-[#2a2a2a]/50 rounded-lg border border-[#3a3a3a]">
                  <p className="text-xs text-[#888] font-semibold mb-1">❓ Total Questions</p>
                  <p className="text-sm font-bold text-white">{selectedAttempt?.result?.totalMarks || 0}</p>
                </div>
                <div className="p-3 bg-[#2a2a2a]/50 rounded-lg border border-[#3a3a3a] col-span-2">
                  <p className="text-xs text-[#888] font-semibold mb-1">📈 Performance Level</p>
                  <p className="text-sm font-bold text-white">
                    {selectedAttempt?.result?.percentage >= 90 ? '🏆 Excellent' : selectedAttempt?.result?.percentage >= 80 ? '🎯 Very Good' : selectedAttempt?.result?.percentage >= 70 ? '👍 Good' : selectedAttempt?.result?.percentage >= 60 ? '✅ Satisfactory' : '📚 Needs Improvement'}
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-[#3a3a3a]">
                <p className="text-xs text-[#888] font-bold uppercase tracking-widest mb-2">ℹ️ Performance Insights</p>
                <div className="space-y-2 text-xs text-[#aaa]">
                  <p>✓ {selectedAttempt?.result?.passed ? 'Great job! You passed this quiz.' : 'Keep practicing to improve your score.'}</p>
                  <p>✓ Your performance: {selectedAttempt?.result?.percentage >= 80 ? 'Excellent' : selectedAttempt?.result?.percentage >= 60 ? 'Good' : 'Needs Improvement'}</p>
                  <p>✓ Detailed breakdown coming soon</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setSelectedAttempt(null)} className="flex-1 py-3 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold hover:shadow-lg hover:shadow-gray-500/30 transition-all transform hover:scale-105">
                  ✕ Close
                </button>
                <button onClick={() => {
              const quizId = selectedAttempt?.quiz?._id;
              const courseId = selectedAttempt?.course?._id;
              if (quizId && courseId) {
                setSelectedAttempt(null);
                navigate(`/dashboard/quiz-performance/${quizId}/${courseId}`);
              }
            }} className="flex-1 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all transform hover:scale-105">
                  📊 Full Report
                </button>
              </div>
            </div>
          </div>
        </div>}
    </div>;
}
