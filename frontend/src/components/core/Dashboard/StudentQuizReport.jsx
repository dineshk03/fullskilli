import { useEffect, useMemo, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getStudentQuizPerformance } from "../../../services/operations/quizReportsAPI";
import { generateMarkReportPDF } from "../../../utils/generateMarkReportPDF";
import { toast } from "react-hot-toast";
export default function StudentQuizReport() {
  const navigate = useNavigate();
  const {
    user
  } = useSelector(state => state.profile);
  const {
    token
  } = useSelector(state => state.auth);

  // State Management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [courseFilter, setCourseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Summary");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Data Processing Functions
  const processedData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    return rawData.map(item => {
      // Handle course data - could be array or object
      let courseData = item.course;
      if (Array.isArray(courseData) && courseData.length > 0) {
        courseData = courseData[0];
      }

      // Handle quiz data - could be array or object  
      let quizData = item.quiz;
      if (Array.isArray(quizData) && quizData.length > 0) {
        quizData = quizData[0];
      }

      // Handle section data - could be array or object
      let sectionData = item.subSection;
      if (Array.isArray(sectionData) && sectionData.length > 0) {
        sectionData = sectionData[0];
      }
      return {
        id: item._id,
        quiz: {
          id: quizData?._id,
          title: quizData?.title || "Untitled Quiz"
        },
        course: {
          id: courseData?._id,
          name: courseData?.courseName || courseData?.name || "Unknown Course"
        },
        section: {
          id: sectionData?._id,
          title: sectionData?.title || "Unknown Section"
        },
        result: {
          score: item.result?.score || 0,
          totalMarks: item.result?.totalMarks || 0,
          percentage: item.result?.percentage || 0,
          passed: item.result?.passed || false,
          completedAt: item.result?.completedAt,
          attemptNumber: item.result?.attemptNumber || 1
        }
      };
    });
  }, [rawData]);

  // Filtered Data
  const filteredData = useMemo(() => {
    let filtered = processedData;

    // Course Filter
    if (courseFilter) {
      filtered = filtered.filter(item => item.course.id === courseFilter);
    }

    // Status Filter
    if (statusFilter !== "ALL") {
      const shouldBePassed = statusFilter === "PASSED";
      filtered = filtered.filter(item => item.result.passed === shouldBePassed);
    }

    // Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => item.quiz.title.toLowerCase().includes(query) || item.course.name.toLowerCase().includes(query) || item.section.title.toLowerCase().includes(query));
    }
    return filtered;
  }, [processedData, courseFilter, statusFilter, searchQuery]);

  // Statistics Calculations
  const statistics = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        totalAttempts: 0,
        uniqueQuizzes: 0,
        passedQuizzes: 0,
        failedQuizzes: 0,
        averageScore: 0,
        passRate: 0,
        recentAttempts: 0,
        bestScore: 0,
        worstScore: 0,
        improvementTrend: 0,
        scoreBuckets: [],
        dailyActivity: [],
        coursePerformance: []
      };
    }

    // Get unique quizzes (latest attempt per quiz)
    const uniqueQuizMap = new Map();
    filteredData.forEach(item => {
      const key = `${item.quiz.id}-${item.course.id}`;
      const existing = uniqueQuizMap.get(key);
      if (!existing || item.result.attemptNumber > existing.result.attemptNumber) {
        uniqueQuizMap.set(key, item);
      }
    });
    const uniqueQuizzes = Array.from(uniqueQuizMap.values());
    const passedQuizzes = uniqueQuizzes.filter(item => item.result.passed);
    const failedQuizzes = uniqueQuizzes.filter(item => !item.result.passed);

    // Recent attempts (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentAttempts = filteredData.filter(item => item.result.completedAt && new Date(item.result.completedAt) > weekAgo);

    // Average score calculation
    const totalScore = uniqueQuizzes.reduce((sum, item) => sum + item.result.percentage, 0);
    const averageScore = uniqueQuizzes.length > 0 ? totalScore / uniqueQuizzes.length : 0;

    // Pass rate calculation
    const passRate = uniqueQuizzes.length > 0 ? passedQuizzes.length / uniqueQuizzes.length * 100 : 0;

    // Best and worst scores
    const scores = uniqueQuizzes.map(item => item.result.percentage);
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const worstScore = scores.length > 0 ? Math.min(...scores) : 0;

    // Score distribution buckets
    const scoreBuckets = [{
      label: '0-20%',
      min: 0,
      max: 20,
      count: 0,
      color: 'from-red-500 to-red-600'
    }, {
      label: '21-40%',
      min: 21,
      max: 40,
      count: 0,
      color: 'from-orange-500 to-orange-600'
    }, {
      label: '41-60%',
      min: 41,
      max: 60,
      count: 0,
      color: 'from-yellow-500 to-yellow-600'
    }, {
      label: '61-80%',
      min: 61,
      max: 80,
      count: 0,
      color: 'from-blue-500 to-blue-600'
    }, {
      label: '81-100%',
      min: 81,
      max: 100,
      count: 0,
      color: 'from-green-500 to-green-600'
    }];
    uniqueQuizzes.forEach(item => {
      const score = item.result.percentage;
      const bucket = scoreBuckets.find(b => score >= b.min && score <= b.max);
      if (bucket) bucket.count++;
    });

    // Daily activity analysis
    const dailyMap = new Map();
    filteredData.forEach(item => {
      if (item.result.completedAt) {
        const date = new Date(item.result.completedAt).toISOString().split('T')[0];
        const existing = dailyMap.get(date) || {
          date,
          total: 0,
          passed: 0,
          failed: 0
        };
        existing.total++;
        if (item.result.passed) existing.passed++;else existing.failed++;
        dailyMap.set(date, existing);
      }
    });
    const dailyActivity = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-14); // Last 14 days

    // Lecture/Section performance analysis (grouped by section/lecture headings)
    const lectureMap = new Map();
    uniqueQuizzes.forEach(item => {
      // Group by section title (lecture heading) - be more flexible with conditions
      if (item.section.id || item.section.title) {
        // Use section ID if available, otherwise use section title as ID
        const lectureId = item.section.id || item.section.title || `section-${Date.now()}`;
        const lectureName = item.section.title || "Unknown Section";
        const existing = lectureMap.get(lectureId) || {
          lectureId,
          lectureName: lectureName,
          courseName: item.course.name || "Unknown Course",
          quizNames: [],
          // Array to store quiz names
          totalQuizzes: 0,
          passedQuizzes: 0,
          totalScore: 0,
          averageScore: 0
        };

        // Add quiz name to the list if not already present
        const quizTitle = item.quiz.title || "Untitled Quiz";
        if (!existing.quizNames.includes(quizTitle)) {
          existing.quizNames.push(quizTitle);
        }
        existing.totalQuizzes++;
        existing.totalScore += item.result.percentage;
        if (item.result.passed) existing.passedQuizzes++;
        lectureMap.set(lectureId, existing);
      } else {
        // Fallback: group by course if no section data
        const courseId = item.course.id || `course-${Date.now()}`;
        const existing = lectureMap.get(courseId) || {
          lectureId: courseId,
          lectureName: item.course.name || "Unknown Course",
          courseName: item.course.name || "Unknown Course",
          quizNames: [],
          totalQuizzes: 0,
          passedQuizzes: 0,
          totalScore: 0,
          averageScore: 0
        };
        const quizTitle = item.quiz.title || "Untitled Quiz";
        if (!existing.quizNames.includes(quizTitle)) {
          existing.quizNames.push(quizTitle);
        }
        existing.totalQuizzes++;
        existing.totalScore += item.result.percentage;
        if (item.result.passed) existing.passedQuizzes++;
        lectureMap.set(courseId, existing);
      }
    });
    const coursePerformance = Array.from(lectureMap.values()).map(lecture => ({
      ...lecture,
      averageScore: lecture.totalQuizzes > 0 ? lecture.totalScore / lecture.totalQuizzes : 0,
      passRate: lecture.totalQuizzes > 0 ? lecture.passedQuizzes / lecture.totalQuizzes * 100 : 0,
      // Create combined display name: "Quiz Name - Lecture Name"
      displayName: lecture.quizNames.length > 0 ? `${lecture.quizNames.join(', ')} - ${lecture.lectureName}` : lecture.lectureName
    }));

    // Improvement trend (compare first half vs second half of attempts)
    const sortedAttempts = [...filteredData].sort((a, b) => new Date(a.result.completedAt || 0) - new Date(b.result.completedAt || 0));
    const midPoint = Math.floor(sortedAttempts.length / 2);
    const firstHalf = sortedAttempts.slice(0, midPoint);
    const secondHalf = sortedAttempts.slice(midPoint);
    const firstHalfAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, item) => sum + item.result.percentage, 0) / firstHalf.length : 0;
    const secondHalfAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, item) => sum + item.result.percentage, 0) / secondHalf.length : 0;
    const improvementTrend = secondHalfAvg - firstHalfAvg;
    return {
      totalAttempts: filteredData.length,
      uniqueQuizzes: uniqueQuizzes.length,
      passedQuizzes: passedQuizzes.length,
      failedQuizzes: failedQuizzes.length,
      averageScore: Math.round(averageScore * 10) / 10,
      passRate: Math.round(passRate * 10) / 10,
      recentAttempts: recentAttempts.length,
      bestScore: Math.round(bestScore * 10) / 10,
      worstScore: Math.round(worstScore * 10) / 10,
      improvementTrend: Math.round(improvementTrend * 10) / 10,
      scoreBuckets,
      dailyActivity,
      coursePerformance
    };
  }, [filteredData]);

  // Available Courses
  const availableCourses = useMemo(() => {
    const courseMap = new Map();
    processedData.forEach(item => {
      // Only add courses that have valid ID and name (not "Unknown Course")
      if (item.course.id && item.course.name && item.course.name !== "Unknown Course") {
        courseMap.set(item.course.id, {
          id: item.course.id,
          name: item.course.name
        });
      }
    });
    const courses = Array.from(courseMap.values());
    return courses;
  }, [processedData]);

  // Data Fetching
  const fetchData = useCallback(async (selectedCourseId = null) => {
    if (!user?._id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getStudentQuizPerformance({
        token,
        studentId: user._id,
        courseId: selectedCourseId
      });
      if (response && response.performance) {
        setRawData(response.performance);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        setError("No quiz data found.");
      }
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      setError(`Error loading quiz data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [token, user._id]);
  useEffect(() => {
    fetchData();
  }, [user._id, token, fetchData]);

  // Export Functions
  const exportPDF = () => {
    try {
      const studentName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || "Student";
      const exportData = {
        performance: filteredData,
        stats: statistics
      };
      generateMarkReportPDF(exportData, studentName, user?.email || "");
      toast.success("Quiz report downloaded successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to generate PDF report.");
    }
  };
  const exportCSV = () => {
    const headers = ["Date", "Course", "Section", "Quiz", "Score", "Total Marks", "Percentage", "Status"];
    const rows = filteredData.map(item => [item.result.completedAt ? new Date(item.result.completedAt).toLocaleDateString() : "-", item.course.name, item.section.title, item.quiz.title, item.result.score, item.result.totalMarks, `${item.result.percentage.toFixed(1)}%`, item.result.passed ? "Passed" : "Failed"]);
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

  // Render Loading State
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f0f1e] p-4 md:p-8">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-[#2a2a2a] animate-spin border-t-yellow-400" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">📊</div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Loading Quiz Report...</h3>
            <p className="text-[#888]">Analyzing your performance data</p>
          </div>
        </div>
      </div>;
  }

  // Render Error State
  if (error) {
    return <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f0f1e] p-4 md:p-8">
        <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-4 rounded-lg mb-4">
          {error}
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f0f1e] p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative p-4 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-2xl shadow-2xl">
            <span className="text-3xl">📊</span>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Quiz Performance Report
            </h1>
            <p className="text-base text-[#aaa] mt-2">Track your quiz performance across all courses</p>
            {lastUpdated && <p className="text-xs text-[#666] mt-1">Last updated: {lastUpdated}</p>}
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Course Filter */}
          <div>
            <label className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wide">
              Filter by Course
            </label>
            <select className="w-full bg-gradient-to-r from-[#1f1f1f] to-[#252525] text-white border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400" value={courseFilter} onChange={e => {
            setCourseFilter(e.target.value);
            fetchData(e.target.value || null);
          }}>
              <option value="">All Courses ({availableCourses.length})</option>
              {availableCourses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wide">
              Filter by Status
            </label>
            <div className="flex gap-2 bg-gradient-to-r from-[#1f1f1f] to-[#252525] border border-[#3a3a3a] rounded-xl p-2">
              <button onClick={() => setStatusFilter("ALL")} className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${statusFilter === 'ALL' ? 'bg-blue-500 text-white' : 'text-[#aaa] hover:text-white'}`}>
                All
              </button>
              <button onClick={() => setStatusFilter("PASSED")} className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${statusFilter === 'PASSED' ? 'bg-green-500 text-white' : 'text-[#aaa] hover:text-white'}`}>
                Passed
              </button>
              <button onClick={() => setStatusFilter("FAILED")} className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${statusFilter === 'FAILED' ? 'bg-red-500 text-white' : 'text-[#aaa] hover:text-white'}`}>
                Failed
              </button>
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wide">
              Search
            </label>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search quizzes, courses..." className="w-full bg-gradient-to-r from-[#1f1f1f] to-[#252525] text-white border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-400" />
          </div>

          {/* Actions */}
          <div>
            <label className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wide">
              Actions
            </label>
            <div className="flex gap-2">
              <button onClick={() => fetchData(courseFilter || null)} className="flex-1 px-3 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold hover:shadow-lg transition-all" title="Refresh data">
                🔄
              </button>
              <button onClick={exportPDF} className="flex-1 px-3 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold hover:shadow-lg transition-all" title="Download PDF">
                📊
              </button>
              <button onClick={exportCSV} className="flex-1 px-3 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:shadow-lg transition-all" title="Export CSV">
                📄
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg p-1 mb-8">
          <button onClick={() => setActiveTab('Summary')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'Summary' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black' : 'text-[#aaa] hover:text-white'}`}>
            📊 Summary
          </button>
          <button onClick={() => setActiveTab('Analytics')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'Analytics' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black' : 'text-[#aaa] hover:text-white'}`}>
            📈 Analytics
          </button>
          <button onClick={() => setActiveTab('Details')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'Details' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black' : 'text-[#aaa] hover:text-white'}`}>
            📋 Details
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'Summary' && <div className="space-y-8">
          {/* Main Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Quizzes */}
            <div className="group bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] border border-[#3a3a3a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#888]">Total Quizzes</h3>
                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">📚</span>
              </div>
              <p className="text-4xl font-black text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">{statistics.uniqueQuizzes}</p>
              <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-1000" style={{
              width: statistics.uniqueQuizzes > 0 ? '100%' : '0%'
            }} />
              </div>
              <div className="text-xs text-[#666] mt-2">Unique quizzes attempted</div>
            </div>

            {/* Passed Quizzes */}
            <div className="group bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] border border-[#3a3a3a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#888]">Passed</h3>
                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">✅</span>
              </div>
              <p className="text-4xl font-black text-green-400 mb-2 group-hover:scale-105 transition-transform duration-300">{statistics.passedQuizzes}</p>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[#888]">Pass Rate</span>
                <span className="text-green-400 font-bold">{statistics.passRate}%</span>
              </div>
              <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-1000" style={{
              width: `${statistics.passRate}%`
            }} />
              </div>
            </div>

            {/* Best Score */}
            <div className="group bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] border border-[#3a3a3a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#888]">Best Score</h3>
                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🏆</span>
              </div>
              <p className="text-4xl font-black text-yellow-400 mb-2 group-hover:scale-105 transition-transform duration-300">{statistics.bestScore}%</p>
              <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-1000" style={{
              width: `${statistics.bestScore}%`
            }} />
              </div>
              <div className="text-xs text-[#666] mt-2">Your highest achievement</div>
            </div>

            {/* Average Score */}
            <div className="group bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] border border-[#3a3a3a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#888]">Average Score</h3>
                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">📈</span>
              </div>
              <p className="text-4xl font-black text-blue-400 mb-2 group-hover:scale-105 transition-transform duration-300">{statistics.averageScore}%</p>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[#666]">Trend</span>
                <span className={`font-bold ${statistics.improvementTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {statistics.improvementTrend >= 0 ? '↗' : '↘'} {Math.abs(statistics.improvementTrend)}%
                </span>
              </div>
              <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-1000" style={{
              width: `${statistics.averageScore}%`
            }} />
              </div>
            </div>
          </div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Score Distribution Chart */}
            <div className="bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] border border-[#3a3a3a] rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-2xl">📊</span> Score Distribution
              </h3>
              <div className="space-y-4">
                {statistics.scoreBuckets.map((bucket, index) => <div key={bucket.label} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white">{bucket.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#888]">{bucket.count} quiz{bucket.count !== 1 ? 'zes' : ''}</span>
                        <span className="text-xs text-[#666]">
                          ({statistics.uniqueQuizzes > 0 ? Math.round(bucket.count / statistics.uniqueQuizzes * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-3 bg-[#2a2a2a] rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${bucket.color} transition-all duration-1000 group-hover:shadow-lg`} style={{
                  width: statistics.uniqueQuizzes > 0 ? `${bucket.count / statistics.uniqueQuizzes * 100}%` : '0%',
                  animationDelay: `${index * 200}ms`
                }} />
                    </div>
                  </div>)}
              </div>
            </div>

            {/* Daily Activity Chart */}
            <div className="bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] border border-[#3a3a3a] rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-2xl">📅</span> Activity Timeline (14 days)
              </h3>
              {statistics.dailyActivity.length > 0 ? <div className="space-y-3">
                  {statistics.dailyActivity.slice(-7).map((day, index) => <div key={day.date} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">
                          {new Date(day.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                        </span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-green-400">✓ {day.passed}</span>
                          <span className="text-red-400">✗ {day.failed}</span>
                          <span className="text-[#888]">Total: {day.total}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                        <div className="flex h-full">
                          <div className="bg-gradient-to-r from-green-400 to-green-500 transition-all duration-1000" style={{
                    width: `${day.total > 0 ? day.passed / day.total * 100 : 0}%`,
                    animationDelay: `${index * 100}ms`
                  }} />
                          <div className="bg-gradient-to-r from-red-400 to-red-500 transition-all duration-1000" style={{
                    width: `${day.total > 0 ? day.failed / day.total * 100 : 0}%`,
                    animationDelay: `${index * 100 + 50}ms`
                  }} />
                        </div>
                      </div>
                    </div>)}
                </div> : <div className="text-center py-8">
                  <div className="text-4xl mb-4 opacity-30">📅</div>
                  <p className="text-sm text-[#666]">No recent activity</p>
                </div>}
            </div>
          </div>

          {/* Course Performance Analysis */}
          {statistics.coursePerformance.length > 0 && <div className="bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] border border-[#3a3a3a] rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-2xl">🎓</span> Course Performance Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
                {statistics.coursePerformance.map((lecture, index) => <div key={lecture.lectureId} className="group bg-[#2a2a2a] rounded-xl p-6 hover:bg-[#3a3a3a] transition-all duration-300">
                    <div className="mb-4">
                      <h4 className="font-semibold text-white mb-2 text-base leading-relaxed break-words" title={lecture.displayName}>
                        {lecture.displayName}
                      </h4>
                      <p className="text-sm text-[#888] break-words" title={lecture.courseName}>
                        📚 {lecture.courseName}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-[#3a3a3a]">
                        <span className="text-[#aaa] font-medium">📊 Total Quizzes</span>
                        <span className="text-white font-bold text-lg">{lecture.totalQuizzes}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-[#3a3a3a]">
                        <span className="text-[#aaa] font-medium">📈 Average Score</span>
                        <span className={`font-bold text-lg ${lecture.averageScore >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                          {lecture.averageScore.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-[#aaa] font-medium">🎯 Pass Rate</span>
                        <span className={`font-bold text-lg ${lecture.passRate >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                          {lecture.passRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden mt-3">
                        <div className={`h-full transition-all duration-1000 ${lecture.averageScore >= 80 ? 'bg-gradient-to-r from-green-400 to-green-500' : lecture.averageScore >= 60 ? 'bg-gradient-to-r from-blue-400 to-blue-500' : lecture.averageScore >= 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{
                  width: `${lecture.averageScore}%`,
                  animationDelay: `${index * 150}ms`
                }} />
                      </div>
                    </div>
                  </div>)}
              </div>
            </div>}

          {/* Performance Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Recent Activity Summary */}
            <div className="bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] border border-[#3a3a3a] rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-xl">🕒</span> Recent Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#888] text-sm">Last 7 days</span>
                  <span className="text-2xl font-bold text-cyan-400">{statistics.recentAttempts}</span>
                </div>
                <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 transition-all duration-1000" style={{
                width: statistics.totalAttempts > 0 ? `${Math.min(100, statistics.recentAttempts / statistics.totalAttempts * 100)}%` : '0%'
              }} />
                </div>
                <div className="text-xs text-[#666]">
                  {statistics.totalAttempts > 0 ? `${Math.round(statistics.recentAttempts / statistics.totalAttempts * 100)}% of total attempts` : 'No attempts yet'}
                </div>
              </div>
            </div>

            {/* Improvement Indicator */}
            <div className="bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] border border-[#3a3a3a] rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-xl">📈</span> Progress Trend
              </h3>
              <div className="text-center">
                <div className={`text-3xl font-black mb-2 ${statistics.improvementTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {statistics.improvementTrend >= 0 ? '↗' : '↘'} {Math.abs(statistics.improvementTrend)}%
                </div>
                <div className="text-sm text-[#888]">
                  {statistics.improvementTrend >= 0 ? 'Improving' : 'Declining'} performance
                </div>
                <div className="text-xs text-[#666] mt-2">
                  Compared to earlier attempts
                </div>
              </div>
            </div>

            {/* Total Attempts */}
            <div className="bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] border border-[#3a3a3a] rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-xl">📋</span> Total Attempts
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#888] text-sm">All attempts</span>
                  <span className="text-2xl font-bold text-purple-400">{statistics.totalAttempts}</span>
                </div>
                <div className="text-xs text-[#666]">
                  Including retakes and practice
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#666]">Unique quizzes</span>
                  <span className="text-white font-medium">{statistics.uniqueQuizzes}</span>
                </div>
              </div>
            </div>
          </div>
        </div>}

      {activeTab === 'Analytics' && <div className="space-y-8">
          {/* Analytics Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">📈 Advanced Analytics</h2>
            <p className="text-[#888]">Deep insights into your quiz performance patterns</p>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Performance Score */}
            <div className="bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] border border-[#3a3a3a] rounded-2xl p-6 shadow-xl">
              <div className="text-center">
                <div className="text-4xl mb-2">🎯</div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#888] mb-2">Performance Score</h3>
                <div className={`text-3xl font-black mb-2 ${statistics.averageScore >= 80 ? 'text-green-400' : statistics.averageScore >= 60 ? 'text-blue-400' : statistics.averageScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {statistics.averageScore > 0 ? statistics.averageScore >= 90 ? 'A+' : statistics.averageScore >= 80 ? 'A' : statistics.averageScore >= 70 ? 'B+' : statistics.averageScore >= 60 ? 'B' : statistics.averageScore >= 50 ? 'C+' : statistics.averageScore >= 40 ? 'C' : 'D' : 'N/A'}
                </div>
                <div className="text-xs text-[#666]">Based on {statistics.averageScore.toFixed(1)}% average</div>
              </div>
            </div>

            {/* Consistency Rating */}
            <div className="bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] border border-[#3a3a3a] rounded-2xl p-6 shadow-xl">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#888] mb-2">Consistency</h3>
                <div className={`text-3xl font-black mb-2 ${statistics.bestScore - statistics.worstScore <= 20 ? 'text-green-400' : statistics.bestScore - statistics.worstScore <= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {statistics.uniqueQuizzes > 1 ? statistics.bestScore - statistics.worstScore <= 20 ? 'High' : statistics.bestScore - statistics.worstScore <= 40 ? 'Medium' : 'Low' : 'N/A'}
                </div>
                <div className="text-xs text-[#666]">
                  {statistics.uniqueQuizzes > 1 ? `${(statistics.bestScore - statistics.worstScore).toFixed(1)}% range` : 'Need more data'}
                </div>
              </div>
            </div>

            {/* Learning Velocity */}
            <div className="bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] border border-[#3a3a3a] rounded-2xl p-6 shadow-xl">
              <div className="text-center">
                <div className="text-4xl mb-2">🚀</div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#888] mb-2">Learning Velocity</h3>
                <div className={`text-3xl font-black mb-2 ${statistics.improvementTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {statistics.improvementTrend >= 10 ? 'Fast' : statistics.improvementTrend >= 0 ? 'Steady' : statistics.improvementTrend >= -10 ? 'Slow' : 'Declining'}
                </div>
                <div className="text-xs text-[#666]">
                  {statistics.improvementTrend >= 0 ? '+' : ''}{statistics.improvementTrend.toFixed(1)}% trend
                </div>
              </div>
            </div>

            {/* Activity Level */}
            <div className="bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] border border-[#3a3a3a] rounded-2xl p-6 shadow-xl">
              <div className="text-center">
                <div className="text-4xl mb-2">⚡</div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#888] mb-2">Activity Level</h3>
                <div className={`text-3xl font-black mb-2 ${statistics.recentAttempts >= 5 ? 'text-green-400' : statistics.recentAttempts >= 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {statistics.recentAttempts >= 5 ? 'High' : statistics.recentAttempts >= 2 ? 'Medium' : 'Low'}
                </div>
                <div className="text-xs text-[#666]">{statistics.recentAttempts} attempts (7 days)</div>
              </div>
            </div>
          </div>

          {/* Detailed Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Performance Trend Over Time */}
            <div className="bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] border border-[#3a3a3a] rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-2xl">📈</span> Performance Trend Analysis
              </h3>
              {filteredData.length >= 3 ? <div className="space-y-4">
                  {filteredData.sort((a, b) => new Date(a.result.completedAt || 0) - new Date(b.result.completedAt || 0)).slice(-10).map((attempt, index) => <div key={attempt.id} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono bg-[#2a2a2a] px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                            <span className="text-sm text-white truncate max-w-[200px]" title={attempt.quiz.title}>
                              {attempt.quiz.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${attempt.result.percentage >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                              {attempt.result.percentage.toFixed(1)}%
                            </span>
                            <span className="text-xs text-[#666]">
                              {attempt.result.completedAt ? new Date(attempt.result.completedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    }) : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${attempt.result.percentage >= 80 ? 'bg-gradient-to-r from-green-400 to-green-500' : attempt.result.percentage >= 60 ? 'bg-gradient-to-r from-blue-400 to-blue-500' : attempt.result.percentage >= 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{
                  width: `${attempt.result.percentage}%`,
                  animationDelay: `${index * 100}ms`
                }} />
                        </div>
                      </div>)}
                </div> : <div className="text-center py-8">
                  <div className="text-4xl mb-4 opacity-30">📈</div>
                  <p className="text-sm text-[#666]">Need at least 3 attempts for trend analysis</p>
                </div>}
            </div>

            {/* Subject/Course Strengths & Weaknesses */}
            <div className="bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] border border-[#3a3a3a] rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-2xl">🎯</span> Strengths & Weaknesses
              </h3>
              {statistics.coursePerformance.length > 0 ? <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                      <span>💪</span> Top Performing Lectures
                    </h4>
                    {statistics.coursePerformance.sort((a, b) => b.averageScore - a.averageScore).slice(0, 3).map(lecture => <div key={lecture.lectureId} className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg mb-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-white block truncate" title={lecture.displayName}>
                              {lecture.displayName}
                            </span>
                            <div className="text-xs text-[#666]">{lecture.totalQuizzes} quiz{lecture.totalQuizzes !== 1 ? 'zes' : ''}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-green-400">{lecture.averageScore.toFixed(1)}%</div>
                            <div className="text-xs text-[#666]">{lecture.passRate.toFixed(0)}% pass rate</div>
                          </div>
                        </div>)}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                      <span>🎯</span> Areas for Improvement
                    </h4>
                    {statistics.coursePerformance.sort((a, b) => a.averageScore - b.averageScore).slice(0, 3).map(lecture => <div key={lecture.lectureId} className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg mb-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-white block truncate" title={lecture.displayName}>
                              {lecture.displayName}
                            </span>
                            <div className="text-xs text-[#666]">{lecture.totalQuizzes} quiz{lecture.totalQuizzes !== 1 ? 'zes' : ''}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-red-400">{lecture.averageScore.toFixed(1)}%</div>
                            <div className="text-xs text-[#666]">{lecture.passRate.toFixed(0)}% pass rate</div>
                          </div>
                        </div>)}
                  </div>
                </div> : <div className="text-center py-8">
                  <div className="text-4xl mb-4 opacity-30">🎯</div>
                  <p className="text-sm text-[#666]">No course data available</p>
                </div>}
            </div>
          </div>

          {/* Advanced Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Study Recommendations */}
            <div className="bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] border border-[#3a3a3a] rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-xl">💡</span> Study Recommendations
              </h3>
              <div className="space-y-3">
                {statistics.averageScore < 60 && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="text-sm font-semibold text-red-400 mb-1">Focus on Fundamentals</div>
                    <div className="text-xs text-[#888]">Your average score is below 60%. Consider reviewing basic concepts.</div>
                  </div>}
                {statistics.improvementTrend < 0 && <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="text-sm font-semibold text-yellow-400 mb-1">Review Study Methods</div>
                    <div className="text-xs text-[#888]">Performance is declining. Try different study techniques.</div>
                  </div>}
                {statistics.recentAttempts < 2 && <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="text-sm font-semibold text-blue-400 mb-1">Increase Practice</div>
                    <div className="text-xs text-[#888]">Low recent activity. Regular practice improves retention.</div>
                  </div>}
                {statistics.averageScore >= 80 && statistics.improvementTrend >= 0 && <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="text-sm font-semibold text-green-400 mb-1">Excellent Progress!</div>
                    <div className="text-xs text-[#888]">Keep up the great work. Consider advanced topics.</div>
                  </div>}
              </div>
            </div>

            {/* Time Analysis */}
            <div className="bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] border border-[#3a3a3a] rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-xl">⏰</span> Time Analysis
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#888]">Total Study Sessions</span>
                  <span className="text-lg font-bold text-white">{statistics.totalAttempts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#888]">Active Days</span>
                  <span className="text-lg font-bold text-cyan-400">{statistics.dailyActivity.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#888]">Avg. per Day</span>
                  <span className="text-lg font-bold text-purple-400">
                    {statistics.dailyActivity.length > 0 ? (statistics.totalAttempts / statistics.dailyActivity.length).toFixed(1) : '0'}
                  </span>
                </div>
                <div className="text-xs text-[#666] mt-3">
                  {statistics.dailyActivity.length > 0 ? `Most recent activity: ${statistics.dailyActivity[statistics.dailyActivity.length - 1]?.date}` : 'No recent activity recorded'}
                </div>
              </div>
            </div>

            {/* Achievement Badges */}
            <div className="bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] border border-[#3a3a3a] rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-xl">🏆</span> Achievements
              </h3>
              <div className="space-y-3">
                {statistics.bestScore >= 90 && <div className="flex items-center gap-3 p-2 bg-yellow-500/10 rounded-lg">
                    <span className="text-2xl">🌟</span>
                    <div>
                      <div className="text-sm font-semibold text-yellow-400">Excellence</div>
                      <div className="text-xs text-[#888]">Scored 90%+ on a quiz</div>
                    </div>
                  </div>}
                {statistics.passRate >= 80 && <div className="flex items-center gap-3 p-2 bg-green-500/10 rounded-lg">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <div className="text-sm font-semibold text-green-400">Consistent</div>
                      <div className="text-xs text-[#888]">80%+ pass rate</div>
                    </div>
                  </div>}
                {statistics.totalAttempts >= 10 && <div className="flex items-center gap-3 p-2 bg-blue-500/10 rounded-lg">
                    <span className="text-2xl">📚</span>
                    <div>
                      <div className="text-sm font-semibold text-blue-400">Dedicated</div>
                      <div className="text-xs text-[#888]">10+ quiz attempts</div>
                    </div>
                  </div>}
                {statistics.improvementTrend >= 15 && <div className="flex items-center gap-3 p-2 bg-purple-500/10 rounded-lg">
                    <span className="text-2xl">🚀</span>
                    <div>
                      <div className="text-sm font-semibold text-purple-400">Rising Star</div>
                      <div className="text-xs text-[#888]">Rapid improvement</div>
                    </div>
                  </div>}
                {statistics.uniqueQuizzes === 0 && <div className="text-center py-4">
                    <div className="text-4xl mb-2 opacity-30">🏆</div>
                    <div className="text-sm text-[#666]">Complete quizzes to earn achievements</div>
                  </div>}
              </div>
            </div>
          </div>
        </div>}

      {activeTab === 'Details' && <div className="space-y-6">
          {/* Details Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Quiz Attempts Details</h2>
              <p className="text-sm text-purple-400 mt-1">💡 Click on any row to view detailed performance report</p>
            </div>
            <div className="text-sm text-[#888]">
              Showing {filteredData.length} of {processedData.length} attempts
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] border border-[#3a3a3a] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-[#2a2a2a] to-[#1f1f1f] border-b border-[#3a3a3a]">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-[#bbb]">Quiz</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-[#bbb]">Course</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wide text-[#bbb]">Score</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wide text-[#bbb]">Percentage</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wide text-[#bbb]">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wide text-[#bbb]">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-4xl mb-4 opacity-30">📋</div>
                        <p className="text-lg font-semibold text-[#888] mb-2">No quiz attempts found</p>
                        <p className="text-sm text-[#666]">Try adjusting your filters or take some quizzes.</p>
                      </td>
                    </tr> : filteredData.map(item => <tr key={item.id} className="border-b border-[#2a2a2a] hover:bg-gradient-to-r hover:from-[#2a2a2a]/50 hover:to-[#3a3a3a]/30 transition-all cursor-pointer group hover:shadow-lg hover:shadow-purple-500/10" onClick={() => {
                setSelectedAttempt(item);
                setShowDetailsModal(true);
              }} title="Click to view detailed quiz performance report">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="font-medium text-white group-hover:text-purple-300 transition-colors">{item.quiz.title}</div>
                              <div className="text-sm text-[#888]">{item.section.title}</div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-purple-400 text-sm">👁️ View Details</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#aaa]">{item.course.name}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-yellow-400">
                            {item.result.score}/{item.result.totalMarks}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-bold ${item.result.percentage >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                            {item.result.percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.result.passed ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                            {item.result.passed ? '✓ Passed' : '✗ Failed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-[#888] text-sm">
                          {item.result.completedAt ? new Date(item.result.completedAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'N/A'}
                        </td>
                      </tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>}

      {/* No Data State */}
      {processedData.length === 0 && !loading && <div className="text-center py-12 border border-dashed border-[#3a3a3a] rounded-2xl">
          <div className="text-6xl mb-4 opacity-30">📚</div>
          <p className="text-lg font-semibold text-[#888] mb-2">No Quiz Data Available</p>
          <p className="text-sm text-[#666]">You haven&apos;t taken any quizzes yet. Start taking quizzes to see your performance here.</p>
        </div>}

      {/* Quiz Attempt Details Modal */}
      {showDetailsModal && selectedAttempt && <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" style={{
      zIndex: 2147483647,
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
          <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] border border-[#3a3a3a] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeInUp relative" style={{
        zIndex: 2147483647,
        position: 'relative'
      }}>
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[#3a3a3a]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{selectedAttempt.quiz.title}</h3>
                  <p className="text-sm text-[#888]">{selectedAttempt.course.name} • {selectedAttempt.section.title}</p>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="text-[#888] hover:text-white transition-colors p-2 hover:bg-[#2a2a2a] rounded-lg">
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              
              {/* Performance Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#2a2a2a] rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{selectedAttempt.result.score}/{selectedAttempt.result.totalMarks}</div>
                  <div className="text-xs text-[#888] mt-1">Score</div>
                </div>
                <div className="bg-[#2a2a2a] rounded-xl p-4 text-center">
                  <div className={`text-2xl font-bold ${selectedAttempt.result.percentage >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedAttempt.result.percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-[#888] mt-1">Percentage</div>
                </div>
                <div className="bg-[#2a2a2a] rounded-xl p-4 text-center">
                  <div className={`text-lg font-bold ${selectedAttempt.result.passed ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedAttempt.result.passed ? '✓ Passed' : '✗ Failed'}
                  </div>
                  <div className="text-xs text-[#888] mt-1">Status</div>
                </div>
                <div className="bg-[#2a2a2a] rounded-xl p-4 text-center">
                  <div className="text-lg font-bold text-blue-400">#{selectedAttempt.result.attemptNumber}</div>
                  <div className="text-xs text-[#888] mt-1">Attempt</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#888]">Performance</span>
                  <span className="text-white font-medium">{selectedAttempt.result.percentage.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${selectedAttempt.result.percentage >= 80 ? 'bg-gradient-to-r from-green-400 to-green-500' : selectedAttempt.result.percentage >= 60 ? 'bg-gradient-to-r from-blue-400 to-blue-500' : selectedAttempt.result.percentage >= 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{
                width: `${selectedAttempt.result.percentage}%`
              }} />
                </div>
              </div>

              {/* Attempt Details */}
              <div className="bg-[#2a2a2a] rounded-xl p-4 space-y-3">
                <h4 className="text-lg font-semibold text-white mb-3">📊 Attempt Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[#888] text-sm">Date Completed</span>
                    <div className="text-white font-medium">
                      {selectedAttempt.result.completedAt ? new Date(selectedAttempt.result.completedAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/A'}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-[#888] text-sm">Total Attempts</span>
                    <div className="text-white font-medium">
                      {(() => {
                    // Count total attempts for this quiz from all data
                    const quizAttempts = processedData.filter(item => item.quiz.id === selectedAttempt.quiz.id && item.course.id === selectedAttempt.course.id);
                    return quizAttempts.length;
                  })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Insights */}
              <div className="bg-[#2a2a2a] rounded-xl p-4">
                <h4 className="text-lg font-semibold text-white mb-3">💡 Performance Insights</h4>
                <div className="space-y-2">
                  {selectedAttempt.result.passed ? <div className="flex items-center gap-2 text-green-400">
                      <span>✅</span>
                      <span className="text-sm">Excellent work! You&apos;ve successfully passed this quiz.</span>
                    </div> : <div className="flex items-center gap-2 text-red-400">
                      <span>❌</span>
                      <span className="text-sm">Keep practicing! Review the material and try again.</span>
                    </div>}
                  
                  {selectedAttempt.result.percentage >= 80 && <div className="flex items-center gap-2 text-blue-400">
                      <span>🌟</span>
                      <span className="text-sm">Outstanding performance! You&apos;ve mastered this topic.</span>
                    </div>}
                  
                  {selectedAttempt.result.percentage < 60 && <div className="flex items-center gap-2 text-yellow-400">
                      <span>📚</span>
                      <span className="text-sm">Consider reviewing the course material before your next attempt.</span>
                    </div>}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#3a3a3a] flex gap-3">
              <button onClick={() => setShowDetailsModal(false)} className="flex-1 px-4 py-3 bg-[#2a2a2a] text-white rounded-xl hover:bg-[#3a3a3a] transition-colors">
                Close
              </button>
              <button onClick={() => {
            if (selectedAttempt.quiz.id && selectedAttempt.course.id) {
              navigate(`/dashboard/quiz-performance/${selectedAttempt.quiz.id}/${selectedAttempt.course.id}?attempt=${selectedAttempt.result.attemptNumber}`);
            }
          }} className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all font-semibold flex items-center justify-center gap-2">
                📊 Full Report
              </button>
            </div>
          </div>
        </div>}
    </div>;
}
