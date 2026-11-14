import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { generateAdminQuizReportPDF } from '../../../utils/generateAdminQuizReportPDF';
import { getAdminQuizAnalytics, getAllStudentQuizPerformance } from '../../../services/operations/quizReportsAPI';
import { getAllCourses, fetchCourseCategories } from '../../../services/operations/courseDetailsAPI';
const ReportsManagement = () => {
  const {
    user
  } = useSelector(state => state.profile);
  const {
    token
  } = useSelector(state => state.auth);

  // State management
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [studentPerformanceData, setStudentPerformanceData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filter states
  const [selectedTimeRange, setSelectedTimeRange] = useState('30');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedQuiz, setSelectedQuiz] = useState('all');

  // UI states
  const [activeTab, setActiveTab] = useState('generator');
  useState([]);
  const [reportHistory, setReportHistory] = useState([]);

  // Report types configuration
  const reportTypes = [{
    id: 'overview',
    title: 'Overview Report',
    description: 'Comprehensive analytics summary with key metrics and trends',
    icon: '📊',
    color: 'blue',
    category: 'Basic'
  }, {
    id: 'student-performance',
    title: 'Student Performance',
    description: 'Detailed analysis of student quiz performance and engagement',
    icon: '👥',
    color: 'green',
    category: 'Basic'
  }, {
    id: 'quiz-analysis',
    title: 'Quiz Analysis',
    description: 'Quiz difficulty assessment and performance metrics',
    icon: '📝',
    color: 'purple',
    category: 'Basic'
  }, {
    id: 'insights',
    title: 'AI Insights',
    description: 'Smart recommendations and actionable insights',
    icon: '💡',
    color: 'yellow',
    category: 'Basic'
  }, {
    id: 'course-wise',
    title: 'Course-wise Analysis',
    description: 'Detailed breakdown by course with category distribution',
    icon: '🎓',
    color: 'indigo',
    category: 'Detailed'
  }, {
    id: 'lecture-wise',
    title: 'Lecture-wise Analysis',
    description: 'Performance analysis for each lecture and section',
    icon: '📚',
    color: 'teal',
    category: 'Detailed'
  }, {
    id: 'quiz-wise',
    title: 'Individual Quiz Analysis',
    description: 'Comprehensive analysis of individual quiz performance',
    icon: '🎯',
    color: 'red',
    category: 'Detailed'
  }];

  // Fetch data on component mount

  const fetchAnalyticsData = useCallback(async () => {
    try {
      const [analyticsResponse, performanceResponse] = await Promise.all([getAdminQuizAnalytics(token, {
        timeRange: selectedTimeRange,
        courseId: selectedCourse !== 'all' ? selectedCourse : null,
        quizId: selectedQuiz !== 'all' ? selectedQuiz : null
      }), getAllStudentQuizPerformance(token, {
        courseId: selectedCourse !== 'all' ? selectedCourse : null
      })]);
      if (analyticsResponse?.success) {
        setAnalyticsData(analyticsResponse.data);
      }
      if (performanceResponse?.success) {
        setStudentPerformanceData(performanceResponse.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics data');
    }
  }, [selectedCourse, selectedQuiz, selectedTimeRange, token]);

  // Generate individual report
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesData, categoriesData] = await Promise.all([getAllCourses(), fetchCourseCategories()]);
      setCourses(coursesData || []);
      setCategories(categoriesData || []);
      await fetchAnalyticsData();
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fetchAnalyticsData]);
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);
  const generateReport = async reportType => {
    if (!analyticsData) {
      toast.error('No data available for report generation');
      return;
    }
    try {
      setLoading(true);
      const filters = {
        timeRange: selectedTimeRange,
        courseId: selectedCourse !== 'all' ? selectedCourse : null,
        quizId: selectedQuiz !== 'all' ? selectedQuiz : null,
        analysisType: reportType
      };
      let reportData = {
        ...analyticsData
      };

      // Enhance data based on report type
      if (reportType === 'student-performance') {
        reportData.studentInsights = {
          ...analyticsData?.studentInsights,
          all: studentPerformanceData
        };
      } else if (reportType === 'course-wise') {
        reportData.courses = courses;
        reportData.categories = categories;
      }
      await generateAdminQuizReportPDF(reportData, filters, user?.firstName + ' ' + user?.lastName || 'Administrator', reportType);

      // Add to report history
      const newReport = {
        id: Date.now(),
        type: reportType,
        title: reportTypes.find(r => r.id === reportType)?.title || reportType,
        generatedAt: new Date(),
        filters: filters,
        status: 'completed'
      };
      setReportHistory(prev => [newReport, ...prev]);
      toast.success(`${newReport.title} generated successfully!`);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Generate batch reports
  const generateBatchReports = async reportIds => {
    setLoading(true);
    try {
      for (const reportId of reportIds) {
        await generateReport(reportId);
        // Small delay between reports
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      toast.success(`Generated ${reportIds.length} reports successfully!`);
    } catch (error) {
      console.error('Error generating batch reports:', error);
      toast.error('Failed to generate batch reports');
    } finally {
      setLoading(false);
    }
  };
  const getColorClasses = color => {
    const colorMap = {
      blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/30',
      green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-500/30',
      purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-500/30',
      yellow: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-yellow-500/30',
      indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-indigo-500/30',
      teal: 'from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-teal-500/30',
      red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/30'
    };
    return colorMap[color] || colorMap.blue;
  };
  return <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                  <span className="text-2xl">📊</span>
                </div>
                Reports Management
              </h1>
              <p className="text-[#888] text-lg">Generate, manage, and download comprehensive analytics reports</p>
            </div>
            
            {loading && <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-400 text-sm">Generating...</span>
              </div>}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-8">
          {[{
          id: 'generator',
          label: 'Report Generator',
          icon: '🔧'
        }, {
          id: 'history',
          label: 'Report History',
          icon: '📋'
        }, {
          id: 'settings',
          label: 'Settings',
          icon: '⚙️'
        }].map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 font-medium ${activeTab === tab.id ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'bg-[#2a2a2a] text-[#888] hover:text-white hover:bg-[#3a3a3a]'}`}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>)}
        </div>

        {/* Report Generator Tab */}
        {activeTab === 'generator' && <div className="space-y-8">
            {/* Filters Section */}
            <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>🎛️</span>
                Report Filters
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Time Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-[#888] mb-2">Time Range</label>
                  <select value={selectedTimeRange} onChange={e => setSelectedTimeRange(e.target.value)} className="w-full px-4 py-3 bg-[#2a2a2a] text-white rounded-xl border border-[#3a3a3a] focus:border-blue-500 focus:outline-none">
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 3 months</option>
                    <option value="365">Last year</option>
                  </select>
                </div>

                {/* Course Filter */}
                <div>
                  <label className="block text-sm font-medium text-[#888] mb-2">Course</label>
                  <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="w-full px-4 py-3 bg-[#2a2a2a] text-white rounded-xl border border-[#3a3a3a] focus:border-blue-500 focus:outline-none">
                    <option value="all">All Courses</option>
                    {courses.map(course => <option key={course._id} value={course._id}>
                        {course.courseName}
                      </option>)}
                  </select>
                </div>

                {/* Quiz Filter */}
                <div>
                  <label className="block text-sm font-medium text-[#888] mb-2">Quiz</label>
                  <select value={selectedQuiz} onChange={e => setSelectedQuiz(e.target.value)} className="w-full px-4 py-3 bg-[#2a2a2a] text-white rounded-xl border border-[#3a3a3a] focus:border-blue-500 focus:outline-none">
                    <option value="all">All Quizzes</option>
                    {analyticsData?.quizPerformance?.map((quiz, index) => <option key={quiz._id || index} value={quiz._id || index}>
                        {quiz.quizTitle || `Quiz ${index + 1}`}
                      </option>)}
                  </select>
                </div>
              </div>

              <button onClick={fetchAnalyticsData} className="mt-4 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-medium">
                🔄 Apply Filters
              </button>
            </div>

            {/* Report Types */}
            <div className="space-y-6">
              {/* Basic Reports */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>📊</span>
                  Basic Reports
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {reportTypes.filter(report => report.category === 'Basic').map(report => <div key={report.id} className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-2xl p-6 border border-[#3a3a3a] hover:border-opacity-60 transition-all group">
                      <div className="text-center">
                        <div className={`w-16 h-16 bg-gradient-to-br ${getColorClasses(report.color).split(' ')[0]} ${getColorClasses(report.color).split(' ')[1]} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                          <span className="text-2xl">{report.icon}</span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">{report.title}</h4>
                        <p className="text-[#888] text-sm mb-4 leading-relaxed">{report.description}</p>
                        <button onClick={() => generateReport(report.id)} disabled={loading} className={`w-full px-4 py-2 bg-gradient-to-r ${getColorClasses(report.color)} text-white rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg`}>
                          Generate PDF
                        </button>
                      </div>
                    </div>)}
                </div>
              </div>

              {/* Detailed Reports */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>🔍</span>
                  Detailed Analysis Reports
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reportTypes.filter(report => report.category === 'Detailed').map(report => <div key={report.id} className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-2xl p-6 border border-[#3a3a3a] hover:border-opacity-60 transition-all group">
                      <div className="text-center">
                        <div className={`w-16 h-16 bg-gradient-to-br ${getColorClasses(report.color).split(' ')[0]} ${getColorClasses(report.color).split(' ')[1]} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                          <span className="text-2xl">{report.icon}</span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">{report.title}</h4>
                        <p className="text-[#888] text-sm mb-4 leading-relaxed">{report.description}</p>
                        <button onClick={() => generateReport(report.id)} disabled={loading} className={`w-full px-4 py-2 bg-gradient-to-r ${getColorClasses(report.color)} text-white rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg`}>
                          Generate PDF
                        </button>
                      </div>
                    </div>)}
                </div>
              </div>

              {/* Batch Generation */}
              <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-8 border border-[#3a3a3a]">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>📦</span>
                  Batch Report Generation
                </h3>
                <p className="text-[#888] mb-6">Generate multiple reports at once for comprehensive analysis</p>
                
                <div className="flex flex-wrap gap-4">
                  <button onClick={() => generateBatchReports(['overview', 'student-performance', 'quiz-analysis', 'insights'])} disabled={loading} className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/30">
                    📊 All Basic Reports
                    <span className="text-sm bg-blue-700 px-2 py-1 rounded-full">4 PDFs</span>
                  </button>
                  
                  <button onClick={() => generateBatchReports(['course-wise', 'lecture-wise', 'quiz-wise'])} disabled={loading} className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all font-semibold flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/30">
                    🔍 All Detailed Reports
                    <span className="text-sm bg-purple-700 px-2 py-1 rounded-full">3 PDFs</span>
                  </button>
                  
                  <button onClick={() => generateBatchReports(reportTypes.map(r => r.id))} disabled={loading} className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-semibold flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-red-500/30">
                    🚀 Complete Report Suite
                    <span className="text-sm bg-red-700 px-2 py-1 rounded-full">7 PDFs</span>
                  </button>
                </div>
              </div>
            </div>
          </div>}

        {/* Report History Tab */}
        {activeTab === 'history' && <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span>📋</span>
                Report Generation History
              </h3>
              
              {reportHistory.length === 0 ? <div className="text-center py-12">
                  <div className="text-6xl mb-4">📄</div>
                  <h4 className="text-xl font-bold text-white mb-2">No Reports Generated Yet</h4>
                  <p className="text-[#888]">Start generating reports to see them here</p>
                </div> : <div className="space-y-4">
                  {reportHistory.map(report => <div key={report.id} className="bg-[#2a2a2a] rounded-xl p-4 border border-[#3a3a3a] flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                          <span className="text-xl">📊</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white">{report.title}</h4>
                          <p className="text-[#888] text-sm">
                            Generated on {report.generatedAt.toLocaleDateString()} at {report.generatedAt.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                          {report.status}
                        </span>
                        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                          Download
                        </button>
                      </div>
                    </div>)}
                </div>}
            </div>
          </div>}

        {/* Settings Tab */}
        {activeTab === 'settings' && <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a]">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span>⚙️</span>
                Report Settings
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Default Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#888] mb-2">Default Time Range</label>
                      <select className="w-full px-4 py-3 bg-[#2a2a2a] text-white rounded-xl border border-[#3a3a3a] focus:border-blue-500 focus:outline-none">
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 3 months</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#888] mb-2">Report Format</label>
                      <select className="w-full px-4 py-3 bg-[#2a2a2a] text-white rounded-xl border border-[#3a3a3a] focus:border-blue-500 focus:outline-none">
                        <option value="pdf">PDF</option>
                        <option value="excel">Excel (Coming Soon)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Notification Settings</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="w-5 h-5 text-blue-500 bg-[#2a2a2a] border-[#3a3a3a] rounded focus:ring-blue-500" defaultChecked />
                      <span className="text-white">Email notifications for report completion</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="w-5 h-5 text-blue-500 bg-[#2a2a2a] border-[#3a3a3a] rounded focus:ring-blue-500" />
                      <span className="text-white">Auto-generate weekly summary reports</span>
                    </label>
                  </div>
                </div>

                <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-medium">
                  Save Settings
                </button>
              </div>
            </div>
          </div>}
      </div>
    </div>;
};
export default ReportsManagement;
