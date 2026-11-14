import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { getAllStudentQuizPerformance } from '../../../services/operations/quizReportsAPI';
import { getAllCourses, fetchCourseCategories } from '../../../services/operations/courseDetailsAPI';
import { generateStudentReportPDF } from '../../../utils/generateStudentReportPDF';
const StudentDetailsAnalysis = () => {
  const {
    user
  } = useSelector(state => state.profile);
  const {
    token
  } = useSelector(state => state.auth);

  // State management
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('list'); // list, details, report

  // Fetch data on component mount

  const fetchStudentsData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllStudentQuizPerformance(token, {
        courseId: selectedCourse !== 'all' ? selectedCourse : null
      });
      if (response?.success) {
        // Process and group student data
        const processedStudents = processStudentData(response.data);
        setStudents(processedStudents);
      } else {
        toast.error('No student data received from server');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch student data');
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, token]);
  useEffect(() => {
    fetchStudentsData();
    fetchCoursesData();
    fetchCategoriesData();
  }, [fetchStudentsData]);
  const fetchCoursesData = async () => {
    try {
      const coursesData = await getAllCourses();
      setCourses(coursesData || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };
  const fetchCategoriesData = async () => {
    try {
      const categoriesData = await fetchCourseCategories();
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
  const processStudentData = rawData => {
    if (!rawData || !Array.isArray(rawData)) {
      return [];
    }
    const studentMap = new Map();
    rawData.forEach(record => {
      const studentId = record.userId;

      // Since backend now groups by student, each record should be unique per student
      const student = {
        id: studentId,
        name: record.studentName || 'Anonymous Student',
        email: record.email || 'No email',
        totalAttempts: record.totalAttempts || 0,
        passedAttempts: record.passedAttempts || 0,
        failedAttempts: record.failedAttempts || 0,
        averageScore: record.averageScore || 0,
        highestScore: record.highestScore || 0,
        lowestScore: record.lowestScore || 0,
        courses: record.courses || [],
        courseNames: record.courseNames || [],
        quizzes: [],
        lastActivity: record.lastAttempt,
        performanceLevel: 'Average',
        totalQuizzes: 0,
        completionRate: 0
      };

      // Process individual quiz results if they exist
      if (record.quizResults && Array.isArray(record.quizResults)) {
        student.totalQuizzes = record.quizResults.length;
        record.quizResults.forEach((quizResult, quizIndex) => {
          // Find the course name for this quiz result
          const courseIndex = Math.floor(quizIndex / (record.quizResults.length / record.courseNames.length)) || 0;
          const courseName = record.courseNames[courseIndex] || 'Unknown Course';
          student.quizzes.push({
            courseId: record.courses[courseIndex],
            courseName: courseName,
            quizId: quizResult.quiz,
            quizTitle: 'Quiz',
            // We might need to enhance this with quiz lookup
            attempts: 1,
            passed: quizResult.passed ? 1 : 0,
            failed: quizResult.passed ? 0 : 1,
            averageScore: quizResult.percentage,
            lastAttempt: quizResult.completedAt
          });
        });
      }
      studentMap.set(studentId, student);
    });

    // Calculate final metrics
    return Array.from(studentMap.values()).map(student => {
      // Calculate performance level
      if (student.averageScore >= 90) student.performanceLevel = 'Excellent';else if (student.averageScore >= 80) student.performanceLevel = 'Good';else if (student.averageScore >= 70) student.performanceLevel = 'Average';else if (student.averageScore >= 60) student.performanceLevel = 'Below Average';else student.performanceLevel = 'Poor';
      return student;
    });
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
      } else {
        organized['uncategorized'].courses.push(course);
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

  // Filter and sort students
  const filteredAndSortedStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === 'all' || student.courses && student.courses.some(courseId => courseId && courseId.toString() === selectedCourse.toString());
    return matchesSearch && matchesCourse;
  }).sort((a, b) => {
    let aValue, bValue;
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'score':
        aValue = a.averageScore;
        bValue = b.averageScore;
        break;
      case 'attempts':
        aValue = a.totalAttempts;
        bValue = b.totalAttempts;
        break;
      case 'completion':
        aValue = a.completionRate;
        bValue = b.completionRate;
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  const generateStudentReport = async student => {
    try {
      const adminName = user?.firstName + ' ' + user?.lastName || 'Administrator';
      await generateStudentReportPDF(student, adminName);
      toast.success(`📊 Report generated successfully for ${student.name}!`);
    } catch (error) {
      console.error('Error generating student report:', error);
      toast.error(`Failed to generate report for ${student.name}`);
    }
  };
  const getPerformanceColor = level => {
    const colors = {
      'Excellent': 'text-green-400 bg-green-500/20',
      'Good': 'text-blue-400 bg-blue-500/20',
      'Average': 'text-yellow-400 bg-yellow-500/20',
      'Below Average': 'text-orange-400 bg-orange-500/20',
      'Poor': 'text-red-400 bg-red-500/20'
    };
    return colors[level] || colors['Average'];
  };
  return <div className="p-6">
      <div className="max-w-7xl mx-auto">

        {/* Controls */}
        <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a] mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-[#888] mb-2">Search Students</label>
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by name or email..." className="w-full px-4 py-3 bg-[#2a2a2a] text-white rounded-xl border border-[#3a3a3a] focus:border-blue-500 focus:outline-none" />
            </div>

            {/* Course Filter */}
            <div>
              <label className="block text-sm font-medium text-[#888] mb-2">Filter by Course</label>
              <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="w-full px-4 py-3 bg-[#2a2a2a] text-white rounded-xl border border-[#3a3a3a] focus:border-blue-500 focus:outline-none">
                <option value="all">📚 All Courses</option>
                
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

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-[#888] mb-2">Sort By</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full px-4 py-3 bg-[#2a2a2a] text-white rounded-xl border border-[#3a3a3a] focus:border-blue-500 focus:outline-none">
                <option value="name">Name</option>
                <option value="score">Average Score</option>
                <option value="attempts">Total Attempts</option>
                <option value="completion">Completion Rate</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-[#888] mb-2">Order</label>
              <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="w-full px-4 py-3 bg-[#2a2a2a] text-white rounded-xl border border-[#3a3a3a] focus:border-blue-500 focus:outline-none">
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              <button onClick={fetchStudentsData} className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-medium">
                🔄 Refresh Data
              </button>
              <span className="text-[#888] text-sm">
                Showing {filteredAndSortedStudents.length} of {students.length} students
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-[#2a2a2a] text-[#888] hover:text-white'}`}>
                📋 List View
              </button>
              <button onClick={() => setViewMode('cards')} className={`px-4 py-2 rounded-xl transition-all ${viewMode === 'cards' ? 'bg-blue-500 text-white' : 'bg-[#2a2a2a] text-[#888] hover:text-white'}`}>
                🎴 Card View
              </button>
            </div>
          </div>
        </div>


        {/* Loading State */}
        {loading && <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#888]">Loading student data...</p>
          </div>}

        {/* Students List/Cards */}
        {!loading && <>
            {/* Show all students if filtering results in empty array */}
            {filteredAndSortedStudents.length === 0 && students.length > 0 && <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4 mb-4">
                <h4 className="text-yellow-400 font-bold mb-2">⚠️ No students match current filters</h4>
                <p className="text-white text-sm">Showing all students instead:</p>
                <button onClick={() => {
            setSearchTerm('');
            setSelectedCourse('all');
          }} className="mt-2 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors">
                  Clear Filters
                </button>
              </div>}
            
            {viewMode === 'list' ? (/* Table View */
        <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl border border-[#3a3a3a] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#2a2a2a] border-b border-[#3a3a3a]">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Student</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Performance</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Attempts</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Completion</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Last Activity</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3a3a3a]">
                      {(filteredAndSortedStudents.length > 0 ? filteredAndSortedStudents : students).map(student => <tr key={student.id} className="hover:bg-[#2a2a2a]/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-white font-medium">{student.name}</p>
                                <p className="text-[#888] text-sm">{student.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-bold">{student.averageScore.toFixed(1)}%</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(student.performanceLevel)}`}>
                                {student.performanceLevel}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p className="text-white">{student.totalAttempts} total</p>
                              <p className="text-green-400">{student.passedAttempts} passed</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-[#2a2a2a] rounded-full h-2">
                                <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{
                          width: `${student.completionRate}%`
                        }}></div>
                              </div>
                              <span className="text-white text-sm font-medium w-12">
                                {student.completionRate.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[#888] text-sm">
                              {student.lastActivity ? new Date(student.lastActivity).toLocaleDateString() : 'N/A'}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => setSelectedStudent(student)} className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                                👁️ View Details
                              </button>
                              <button onClick={() => generateStudentReport(student)} className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm">
                                📊 Report
                              </button>
                            </div>
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>
              </div>) : (/* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(filteredAndSortedStudents.length > 0 ? filteredAndSortedStudents : students).map(student => <div key={student.id} className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl p-6 border border-[#3a3a3a] hover:border-blue-500/50 transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">{student.name}</h3>
                        <p className="text-[#888] text-sm">{student.email}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getPerformanceColor(student.performanceLevel)}`}>
                          {student.performanceLevel}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between">
                        <span className="text-[#888] text-sm">Average Score</span>
                        <span className="text-white font-bold">{student.averageScore.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#888] text-sm">Total Attempts</span>
                        <span className="text-white font-bold">{student.totalAttempts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#888] text-sm">Success Rate</span>
                        <span className="text-green-400 font-bold">{student.completionRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#888] text-sm">Courses</span>
                        <span className="text-blue-400 font-bold">{student.courses.length}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => setSelectedStudent(student)} className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium text-sm">
                        👁️ View Details
                      </button>
                      <button onClick={() => generateStudentReport(student)} className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-medium text-sm">
                        📊 Report
                      </button>
                    </div>
                  </div>)}
              </div>)}
          </>}

        {/* Student Details Modal */}
        {selectedStudent && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#1f1f1f] via-[#1a1a1a] to-[#151515] rounded-3xl border border-[#3a3a3a] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-[#3a3a3a]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedStudent.name}</h2>
                      <p className="text-[#888]">{selectedStudent.email}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${getPerformanceColor(selectedStudent.performanceLevel)}`}>
                        {selectedStudent.performanceLevel}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedStudent(null)} className="p-2 text-[#888] hover:text-white transition-colors">
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Performance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-[#2a2a2a] rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-400">{selectedStudent.averageScore.toFixed(1)}%</p>
                    <p className="text-[#888] text-sm">Average Score</p>
                  </div>
                  <div className="bg-[#2a2a2a] rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">{selectedStudent.totalAttempts}</p>
                    <p className="text-[#888] text-sm">Total Attempts</p>
                  </div>
                  <div className="bg-[#2a2a2a] rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-400">{selectedStudent.completionRate.toFixed(1)}%</p>
                    <p className="text-[#888] text-sm">Success Rate</p>
                  </div>
                  <div className="bg-[#2a2a2a] rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-400">{selectedStudent.courses.length}</p>
                    <p className="text-[#888] text-sm">Courses</p>
                  </div>
                </div>

                {/* Quiz Details */}
                <div className="bg-[#2a2a2a] rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Quiz Performance Details</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedStudent.quizzes.map((quiz, index) => <div key={index} className="bg-[#1a1a1a] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium">{quiz.quizTitle || 'Quiz'}</h4>
                          <span className="text-[#888] text-sm">{quiz.courseName}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-[#888]">Attempts</p>
                            <p className="text-white font-medium">{quiz.attempts}</p>
                          </div>
                          <div>
                            <p className="text-[#888]">Passed</p>
                            <p className="text-green-400 font-medium">{quiz.passed}</p>
                          </div>
                          <div>
                            <p className="text-[#888]">Avg Score</p>
                            <p className="text-blue-400 font-medium">{quiz.averageScore?.toFixed(1) || 0}%</p>
                          </div>
                        </div>
                      </div>)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-6">
                  <button onClick={() => generateStudentReport(selectedStudent)} className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-medium">
                    📊 Generate Detailed Report
                  </button>
                  <button onClick={() => setSelectedStudent(null)} className="px-6 py-3 bg-[#2a2a2a] text-white rounded-xl hover:bg-[#3a3a3a] transition-colors">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>}

        {/* Empty State */}
        {!loading && filteredAndSortedStudents.length === 0 && <div className="text-center py-16">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Students Found</h3>
            <p className="text-[#888] mb-4">
              {searchTerm || selectedCourse !== 'all' ? 'Try adjusting your search or filter criteria.' : 'No student data available. Students need to take quizzes first.'}
            </p>
          </div>}
      </div>
    </div>;
};
export default StudentDetailsAnalysis;
