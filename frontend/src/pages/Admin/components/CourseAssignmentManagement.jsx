import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { FaUsers, FaBookOpen, FaPlus, FaSearch, FaUserGraduate, FaChartBar } from 'react-icons/fa';
import { MdAssignment } from 'react-icons/md';
import toast from 'react-hot-toast';
import { assignCourseToStudent, assignCoursesBulk, getAllUsers, getAllCourses } from '../../../services/operations/adminAPI';
import { createBatch, getAllBatches, updateBatch as updateBatchApi, deleteBatch as deleteBatchApi } from '../../../services/operations/batchAPI';
const CourseAssignmentManagement = () => {
  const {
    token
  } = useSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState('single');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchStudent, setSearchStudent] = useState('');
  const [searchCourse, setSearchCourse] = useState('');

  // Single assignment state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);

  // Bulk assignment state
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [bulkSelectedCourses, setBulkSelectedCourses] = useState([]);
  const [assignmentType, setAssignmentType] = useState('one_course_many_students');

  // Batch management state
  const [showBatchPanel, setShowBatchPanel] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [batchDescription, setBatchDescription] = useState('');
  const [batches, setBatches] = useState([]);
  const [editingBatch, setEditingBatch] = useState(null);
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Batch assignment state
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [batchSelectedCourses, setBatchSelectedCourses] = useState([]);

  // Fetch data on component mount

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching users, courses, and batches...');
      const [usersResponse, coursesResponse, batchesResponse] = await Promise.all([getAllUsers(token), getAllCourses(token), getAllBatches(token)]);
      console.log('Users response:', usersResponse);
      console.log('Courses response:', coursesResponse);
      console.log('Batches response:', batchesResponse);

      // Filter only students
      const studentUsers = usersResponse.filter(user => user.accountType === 'Student' && user.active);
      console.log('Filtered students:', studentUsers);
      setStudents(studentUsers);

      // Set batches
      setBatches(batchesResponse || []);

      // Extract courses array from response object
      const coursesArray = coursesResponse.courses || coursesResponse;
      console.log('Courses array:', coursesArray);
      setCourses(coursesArray);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to load data');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [token]);

  // Filter functions
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const filteredStudents = students.filter(student => `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchStudent.toLowerCase()) || student.email.toLowerCase().includes(searchStudent.toLowerCase()));
  const filteredCourses = courses.filter(course => course.courseName.toLowerCase().includes(searchCourse.toLowerCase()));

  // Single assignment handlers
  const handleSingleAssignment = async () => {
    if (!selectedStudent || selectedCourses.length === 0) {
      toast.error('Please select a student and at least one course');
      return;
    }
    try {
      setLoading(true);
      const requestData = {
        studentId: selectedStudent._id,
        courseIds: selectedCourses.map(course => course._id)
      };
      console.log('Sending single assignment request:', requestData);
      const response = await assignCourseToStudent(requestData, token);
      if (response.success) {
        toast.success(`Successfully assigned ${response.data.summary.successful} course(s) to ${selectedStudent.firstName} ${selectedStudent.lastName}`);
        // Reset form
        setSelectedStudent(null);
        setSelectedCourses([]);
      }
    } catch (error) {
      console.error('Error in single assignment:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || error.message || 'Failed to assign courses');
    } finally {
      setLoading(false);
    }
  };

  // Bulk assignment handlers
  const handleBulkAssignment = async () => {
    if (selectedStudents.length === 0 || bulkSelectedCourses.length === 0) {
      toast.error('Please select students and courses');
      return;
    }
    try {
      setLoading(true);
      const response = await assignCoursesBulk({
        studentIds: selectedStudents.map(student => student._id),
        courseIds: bulkSelectedCourses.map(course => course._id),
        assignmentType
      }, token);
      if (response.success) {
        toast.success(`Bulk assignment completed: ${response.successCount} successful, ${response.errorCount} failed`);
        // Reset form
        setSelectedStudents([]);
        setBulkSelectedCourses([]);
      }
    } catch (error) {
      console.error('Error in bulk assignment:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || error.message || 'Failed to assign courses');
    } finally {
      setLoading(false);
    }
  };
  const handleBatchAssignment = async () => {
    if (selectedBatches.length === 0 || batchSelectedCourses.length === 0) {
      toast.error('Please select batches and courses');
      return;
    }
    try {
      setLoading(true);

      // Get all students from selected batches
      const studentsInBatches = students.filter(student => {
        if (!student?.batches) return false;
        const batchArray = Array.isArray(student.batches) ? student.batches : [];
        return batchArray.some(b => {
          if (!b) return false;
          const batchId = typeof b === 'string' ? b : b._id ? b._id.toString() : b.toString();
          return selectedBatches.includes(batchId);
        });
      });
      if (studentsInBatches.length === 0) {
        toast.error('No students found in selected batches');
        return;
      }
      const response = await assignCoursesBulk({
        studentIds: studentsInBatches.map(student => student._id),
        courseIds: batchSelectedCourses.map(course => course._id),
        assignmentType: 'many_courses_many_students'
      }, token);
      if (response.success) {
        toast.success(`Batch assignment completed: ${response.data.summary.successful} successful assignments to ${studentsInBatches.length} students across ${selectedBatches.length} batch(es)`);
        // Reset form
        setSelectedBatches([]);
        setBatchSelectedCourses([]);
      }
    } catch (error) {
      console.error('Error in batch assignment:', error);
      // toast.error(error.message || 'Failed to assign courses to batches');
    } finally {
      setLoading(false);
    }
  };
  const toggleStudentSelection = student => {
    if (activeTab === 'single') {
      setSelectedStudent(student);
    } else {
      setSelectedStudents(prev => {
        const isSelected = prev.find(s => s._id === student._id);
        if (isSelected) {
          return prev.filter(s => s._id !== student._id);
        } else {
          return [...prev, student];
        }
      });
    }
  };
  const handleBatchCreation = async () => {
    if (!batchName.trim()) {
      toast.error('Please enter a batch name');
      return;
    }
    try {
      setLoading(true);
      const result = await createBatch({
        name: batchName,
        description: batchDescription
      }, token);
      if (result) {
        await fetchData();
        setBatchName('');
        setBatchDescription('');
        setShowBatchPanel(false);
      }
    } catch (error) {
      console.error("Error creating batch:", error);
    } finally {
      setLoading(false);
    }
  };
  const openBatchModal = batch => {
    setEditingBatch(batch ? {
      ...batch
    } : null);
    setShowBatchModal(true);
  };
  const closeBatchModal = () => {
    setShowBatchModal(false);
    setEditingBatch(null);
  };
  const handleBatchUpdate = async () => {
    if (!editingBatch?.name?.trim()) {
      toast.error('Batch name is required');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        name: editingBatch.name,
        description: editingBatch.description,
        active: editingBatch.active
      };
      await updateBatchApi(editingBatch._id, payload, token);
      toast.success('Batch updated successfully');
      closeBatchModal();
      await fetchData();
    } catch (error) {
      console.error('Error updating batch:', error);
      toast.error(error.response?.data?.message || 'Failed to update batch');
    } finally {
      setLoading(false);
    }
  };
  const handleBatchDelete = async () => {
    if (!editingBatch?._id) return;
    if (!window.confirm(`Delete batch "${editingBatch.name}"? This cannot be undone.`)) {
      return;
    }
    try {
      setLoading(true);
      const success = await deleteBatchApi(editingBatch._id, token);
      if (success) {
        toast.success('Batch deleted successfully');
        closeBatchModal();
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast.error(error.response?.data?.message || 'Failed to delete batch');
    } finally {
      setLoading(false);
    }
  };

  // toggleStudentForGroup and removeFromGroup removed as students are assigned via User Management

  const toggleCourseSelection = course => {
    if (activeTab === 'single') {
      setSelectedCourses(prev => {
        const isSelected = prev.find(c => c._id === course._id);
        if (isSelected) {
          return prev.filter(c => c._id !== course._id);
        } else {
          return [...prev, course];
        }
      });
    } else if (activeTab === 'bulk') {
      setBulkSelectedCourses(prev => {
        const isSelected = prev.find(c => c._id === course._id);
        if (isSelected) {
          return prev.filter(c => c._id !== course._id);
        } else {
          return [...prev, course];
        }
      });
    } else if (activeTab === 'batch') {
      setBatchSelectedCourses(prev => {
        const isSelected = prev.find(c => c._id === course._id);
        if (isSelected) {
          return prev.filter(c => c._id !== course._id);
        } else {
          return [...prev, course];
        }
      });
    }
  };
  const toggleBatchSelection = batchId => {
    setSelectedBatches(prev => {
      const isSelected = prev.includes(batchId);
      if (isSelected) {
        return prev.filter(b => b !== batchId);
      } else {
        return [...prev, batchId];
      }
    });
  };

  // Show loading spinner during initial load
  if (initialLoading) {
    return <div className="flex items-center justify-center py-20">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                    <div className="mt-4 text-white text-center">Loading Course Assignment Management...</div>
                </div>
            </div>;
  }

  // Show error state
  if (error) {
    return <div className="min-h-screen bg-gradient-to-br from-richblack-900 via-richblack-800 to-richblack-900 p-6">
                <div className="flex items-center justify-center py-20">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
                        <h2 className="text-xl font-bold text-red-400 mb-4">Error Loading Data</h2>
                        <p className="text-red-300 mb-4">{error}</p>
                        <button onClick={fetchData} className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                            Retry
                        </button>
                    </div>
                </div>
            </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-richblack-900 via-richblack-800 to-richblack-900 p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                        <MdAssignment className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Course Assignment Management</h1>
                        <p className="text-richblack-300">Assign courses to students individually or in bulk</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-300 text-sm font-medium">Total Students</p>
                                <p className="text-2xl font-bold text-white">{students.length}</p>
                            </div>
                            <FaUserGraduate className="w-8 h-8 text-blue-400" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-300 text-sm font-medium">Available Courses</p>
                                <p className="text-2xl font-bold text-white">{courses.length}</p>
                            </div>
                            <FaBookOpen className="w-8 h-8 text-green-400" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-300 text-sm font-medium">Assignment Mode</p>
                                <p className="text-lg font-bold text-white">
                                    {activeTab === 'single' ? 'Single' : activeTab === 'bulk' ? 'Bulk' : 'Batch'}
                                </p>
                            </div>
                            <MdAssignment className="w-8 h-8 text-purple-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-8 bg-richblack-800/50 backdrop-blur-sm rounded-2xl p-2 border border-richblack-700">
                <button onClick={() => setActiveTab('single')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${activeTab === 'single' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' : 'text-richblack-300 hover:text-white hover:bg-richblack-700/50'}`}>
                    <FaUsers className="w-4 h-4" />
                    Single Assignment
                </button>
                <button onClick={() => setActiveTab('bulk')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${activeTab === 'bulk' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' : 'text-richblack-300 hover:text-white hover:bg-richblack-700/50'}`}>
                    <FaChartBar className="w-4 h-4" />
                    Bulk Assignment
                </button>
                <button onClick={() => setActiveTab('batch')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${activeTab === 'batch' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' : 'text-richblack-300 hover:text-white hover:bg-richblack-700/50'}`}>
                    <FaUsers className="w-4 h-4" />
                    Batch Assignment
                </button>
            </div>

            {/* Batch Creation Panel */}
            {showBatchPanel && <div className="mb-8 bg-gradient-to-r from-orange-500/10 to-red-600/10 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FaPlus className="w-5 h-5 text-orange-400" />
                            Create New Batch
                        </h2>
                        <button onClick={() => {
          setShowBatchPanel(false);
          setBatchName('');
          setBatchDescription('');
        }} className="text-richblack-400 hover:text-white transition-colors">
                            ✕
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-orange-300 mb-2">
                                Batch Name
                            </label>
                            <input type="text" placeholder="Enter batch name (e.g. Class of 2024)" value={batchName} onChange={e => setBatchName(e.target.value)} className="w-full px-4 py-3 bg-richblack-700 border border-richblack-600 rounded-xl text-white placeholder-richblack-400 focus:outline-none focus:border-orange-500 transition-colors" />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-orange-300 mb-2">
                                Description (Optional)
                            </label>
                            <input type="text" placeholder="Short description" value={batchDescription} onChange={e => setBatchDescription(e.target.value)} className="w-full px-4 py-3 bg-richblack-700 border border-richblack-600 rounded-xl text-white placeholder-richblack-400 focus:outline-none focus:border-orange-500 transition-colors" />
                        </div>
                        <div>
                            <button onClick={handleBatchCreation} disabled={loading || !batchName.trim()} className="whitespace-nowrap px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg">
                                {loading ? 'Creating...' : 'Create Batch'}
                            </button>
                        </div>
                    </div>
                </div>}

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Students/Groups Section */}
                <div className="bg-richblack-800/50 backdrop-blur-sm border border-richblack-700 rounded-2xl p-6">
                    {activeTab === 'batch' ?
        // Batches Selection for Batch Assignment
        <>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FaUsers className="w-5 h-5 text-orange-400" />
                                    Select Batches
                                </h2>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setShowBatchPanel(!showBatchPanel)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-300">
                                        <FaPlus className="w-3 h-3" />
                                        Create Batch
                                    </button>
                                    <div className="text-sm text-richblack-300">
                                        {selectedBatches.length} batch(es) selected
                                    </div>
                                </div>
                            </div>

                            {/* Batches List */}
                            <div className="space-y-3">
                                {batches.length === 0 ? <div className="text-center py-8">
                                        <FaUsers className="w-12 h-12 text-richblack-500 mx-auto mb-4" />
                                        <p className="text-richblack-400 mb-4">No batches created yet</p>
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => setShowBatchPanel(true)} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-300">
                                                Create First Batch
                                            </button>
                                            <button onClick={fetchData} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300">
                                                Refresh Data
                                            </button>
                                        </div>
                                    </div> : batches.map(batch => {
              const isSelected = selectedBatches.includes(batch._id);
              const studentCount = batch.studentCount !== undefined ? batch.studentCount : students.filter(s => s.batches && s.batches.includes(batch._id)).length;
              return <div key={batch._id} className={`p-4 rounded-xl border transition-all duration-300 ${isSelected ? 'bg-orange-500/20 border-orange-500/50 shadow-lg' : 'bg-richblack-700/50 border-richblack-600 hover:bg-richblack-700 hover:border-richblack-500'}`}>
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1" onClick={() => toggleBatchSelection(batch._id)}>
                                                        <h3 className="font-medium text-white flex items-center gap-2">
                                                            <FaUsers className="w-4 h-4 text-orange-400" />
                                                            {batch.name}
                                                        </h3>
                                                        <p className="text-sm text-richblack-300 mt-1">
                                                            {batch.description && <span className="mr-2">{batch.description} •</span>}
                                                            {studentCount} student(s)
                                                        </p>
                                                        {!batch.active && <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                                                                Inactive
                                                            </span>}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-orange-500 border-orange-500' : 'border-richblack-400'}`}>
                                                            {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                        </div>
                                                        <button onClick={e => {
                      e.stopPropagation();
                      openBatchModal(batch);
                    }} className="px-3 py-1 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition">
                                                            Edit
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>;
            })}
                            </div>
                        </> :
        // Students Selection for Single/Bulk Assignment
        <>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FaUsers className="w-5 h-5 text-blue-400" />
                                    Select Students
                                </h2>
                                <div className="text-sm text-richblack-300">
                                    {activeTab === 'single' ? selectedStudent ? '1 selected' : 'Select one student' : `${selectedStudents.length} selected`}
                                </div>
                            </div>

                            {/* Search Students */}
                            <div className="relative mb-4">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-richblack-400 w-4 h-4" />
                                <input type="text" placeholder="Search students by name or email..." value={searchStudent} onChange={e => setSearchStudent(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-richblack-700 border border-richblack-600 rounded-xl text-white placeholder-richblack-400 focus:outline-none focus:border-blue-500 transition-colors" />
                            </div>

                            {/* Students List */}
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {filteredStudents.map(student => {
              const isSelected = activeTab === 'single' ? selectedStudent?._id === student._id : selectedStudents.find(s => s._id === student._id);
              return <div key={student._id} className={`p-4 rounded-xl border transition-all duration-300 ${isSelected ? 'bg-blue-500/20 border-blue-500/50 shadow-lg' : 'bg-richblack-700/50 border-richblack-600 hover:bg-richblack-700 hover:border-richblack-500'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1" onClick={() => toggleStudentSelection(student)} style={{
                    cursor: 'pointer'
                  }}>
                                                    <div className="flex items-center gap-3">
                                                        <div>
                                                            <h3 className="font-medium text-white">
                                                                {student.firstName} {student.lastName}
                                                            </h3>
                                                            <p className="text-sm text-richblack-300">{student.email}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-richblack-400'}`}>
                                                        {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>;
            })}
                            </div>
                        </>}
                </div>

                {/* Courses Section */}
                <div className="bg-richblack-800/50 backdrop-blur-sm border border-richblack-700 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FaBookOpen className="w-5 h-5 text-green-400" />
                            Select Courses
                        </h2>
                        <div className="text-sm text-richblack-300">
                            {activeTab === 'single' ? `${selectedCourses.length} selected` : activeTab === 'bulk' ? `${bulkSelectedCourses.length} selected` : `${batchSelectedCourses.length} selected`}
                        </div>
                    </div>

                    {/* Search Courses */}
                    <div className="relative mb-4">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-richblack-400 w-4 h-4" />
                        <input type="text" placeholder="Search courses..." value={searchCourse} onChange={e => setSearchCourse(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-richblack-700 border border-richblack-600 rounded-xl text-white placeholder-richblack-400 focus:outline-none focus:border-green-500 transition-colors" />
                    </div>

                    {/* Bulk Assignment Type */}
                    {activeTab === 'bulk' && <div className="mb-4">
                            <label className="block text-sm font-medium text-richblack-300 mb-2">
                                Assignment Type
                            </label>
                            <select value={assignmentType} onChange={e => setAssignmentType(e.target.value)} className="w-full px-4 py-3 bg-richblack-700 border border-richblack-600 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors">
                                <option value="one_course_many_students">One Course → Many Students</option>
                                <option value="many_courses_many_students">Many Courses → Many Students</option>
                            </select>
                        </div>}

                    {/* Courses List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredCourses.map(course => {
            const isSelected = activeTab === 'single' ? selectedCourses.find(c => c._id === course._id) : activeTab === 'bulk' ? bulkSelectedCourses.find(c => c._id === course._id) : batchSelectedCourses.find(c => c._id === course._id);
            return <div key={course._id} onClick={() => toggleCourseSelection(course)} className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${isSelected ? 'bg-green-500/20 border-green-500/50 shadow-lg' : 'bg-richblack-700/50 border-richblack-600 hover:bg-richblack-700 hover:border-richblack-500'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-white line-clamp-1">
                                                {course.courseName}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                <p className="text-sm text-richblack-300">
                                                    {course.courseType || 'Paid'}
                                                </p>
                                                {course.price && <p className="text-sm text-green-400 font-medium">
                                                        ₹{course.price}
                                                    </p>}
                                            </div>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-green-500 border-green-500' : 'border-richblack-400'}`}>
                                            {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                    </div>
                                </div>;
          })}
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <div className="mt-8 flex justify-center">
                <button onClick={activeTab === 'single' ? handleSingleAssignment : activeTab === 'bulk' ? handleBulkAssignment : handleBatchAssignment} disabled={loading || (activeTab === 'single' ? !selectedStudent || selectedCourses.length === 0 : activeTab === 'bulk' ? selectedStudents.length === 0 || bulkSelectedCourses.length === 0 : selectedBatches.length === 0 || batchSelectedCourses.length === 0)} className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaPlus className="w-5 h-5" />}
                    {loading ? 'Assigning...' : activeTab === 'single' ? 'Assign Course' : activeTab === 'bulk' ? 'Assign Courses' : 'Assign Courses to Batches'}
                </button>
            </div>
            {showBatchModal && editingBatch && <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg bg-richblack-800 border border-richblack-700 rounded-2xl p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-white">Edit Batch</h3>
                            <button onClick={closeBatchModal} className="text-richblack-400 hover:text-white transition">✕</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-richblack-300 mb-2">Batch Name</label>
                                <input type="text" value={editingBatch.name || ''} onChange={e => setEditingBatch(prev => ({
              ...prev,
              name: e.target.value
            }))} className="w-full px-4 py-3 bg-richblack-700 border border-richblack-600 rounded-xl text-white focus:outline-none focus:border-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-richblack-300 mb-2">Description</label>
                                <textarea value={editingBatch.description || ''} onChange={e => setEditingBatch(prev => ({
              ...prev,
              description: e.target.value
            }))} rows={3} className="w-full px-4 py-3 bg-richblack-700 border border-richblack-600 rounded-xl text-white focus:outline-none focus:border-orange-500" />
                            </div>
                            <label className="flex items-center gap-2 text-sm text-richblack-200">
                                <input type="checkbox" checked={!!editingBatch.active} onChange={e => setEditingBatch(prev => ({
              ...prev,
              active: e.target.checked
            }))} className="w-4 h-4 text-orange-500 bg-richblack-700 border-richblack-600 rounded focus:ring-orange-500" />
                                Active batch
                            </label>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
                            <button onClick={handleBatchDelete} className="px-4 py-2 text-sm font-medium text-red-300 border border-red-500/40 rounded-xl hover:bg-red-500/10 transition">
                                Delete Batch
                            </button>
                            <div className="flex gap-3">
                                <button onClick={closeBatchModal} className="px-4 py-2 text-sm font-medium text-richblack-200 border border-richblack-600 rounded-xl hover:bg-richblack-700/70 transition">
                                    Cancel
                                </button>
                                <button onClick={handleBatchUpdate} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-600 rounded-xl hover:from-orange-600 hover:to-red-700 transition">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>}
        </div>;
};
export default CourseAssignmentManagement;
