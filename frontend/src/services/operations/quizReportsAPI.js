import { apiConnector } from "../apiConnector";
import { quizReportsEndpoints } from "../apis";
import { toast } from "react-hot-toast";

const {
  GET_STUDENT_QUIZ_PERFORMANCE_API,
  GET_QUIZ_REPORTS_API,
  GET_QUIZ_ANALYTICS_API,
  GET_QUIZ_LEADERBOARD_API,
  EXPORT_QUIZ_REPORTS_API,
} = quizReportsEndpoints;

// Function to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export const getStudentQuizPerformance = async ({ token, studentId, courseId }) => {
  try {
    // Input validation
    if (!token) throw new Error("Authentication token is required");
    if (!studentId || !isValidObjectId(studentId)) {
      throw new Error("Valid student ID is required");
    }

    // Build the URL with courseId if provided
    let url = GET_STUDENT_QUIZ_PERFORMANCE_API.replace(":studentId", studentId);
    
    // Add courseId to query params if provided and valid
    if (courseId) {
      if (!isValidObjectId(courseId)) {
        console.error('Invalid courseId format:', courseId);
        throw new Error("Invalid course ID format. Please provide a valid course ID.");
      }
      url += `?courseId=${courseId}`;
      console.log('Fetching quiz performance with course filter:', { studentId, courseId });
    } else {
      console.log('Fetching all quiz performance data for student:', studentId);
    }

    // Make the API call
    const res = await apiConnector("GET", url, null, { 
      Authorization: `Bearer ${token}` 
    });

    // Handle API response
    if (!res?.data?.success) {
      const errorMsg = res?.data?.message || "Failed to fetch quiz performance data";
      console.error('API Error:', { status: res?.status, message: errorMsg });
      throw new Error(errorMsg);
    }

    console.log('Successfully fetched quiz performance data');
    return res.data.data;
  } catch (e) {
    console.error("GET_STUDENT_QUIZ_PERFORMANCE_API ERROR:", {
      message: e.message,
      studentId,
      courseId,
      error: e.response?.data || 'No response data'
    });
    
    // Show user-friendly error message
    const errorMessage = e.response?.data?.message || e.message || "An error occurred while fetching quiz performance";
    toast.error(errorMessage);
    
    return null;
  }
};

// Admin helpers (not used in student page yet)
export const getQuizReports = async ({ token, params = {} }) => {
  try {
    if (!token) throw new Error("Authentication token missing");
    const qs = new URLSearchParams(params).toString();
    const url = GET_QUIZ_REPORTS_API + (qs ? `?${qs}` : "");
    const res = await apiConnector("GET", url, null, { Authorization: `Bearer ${token}` });
    if (!res?.data?.success) throw new Error(res?.data?.message || "Failed to fetch reports");
    return res.data.data;
  } catch (e) {
    console.error("GET_QUIZ_REPORTS_API ERROR", e);
    toast.error(e.message);
    return null;
  }
};

export const getQuizAnalytics = async ({ token, params = {} }) => {
  try {
    if (!token) throw new Error("Authentication token missing");
    const qs = new URLSearchParams(params).toString();
    const url = GET_QUIZ_ANALYTICS_API + (qs ? `?${qs}` : "");
    const res = await apiConnector("GET", url, null, { Authorization: `Bearer ${token}` });
    if (!res?.data?.success) throw new Error(res?.data?.message || "Failed to fetch analytics");
    return res.data.data;
  } catch (e) {
    console.error("GET_QUIZ_ANALYTICS_API ERROR", e);
    toast.error(e.message);
    return null;
  }
};

export const getQuizLeaderboard = async ({ token, params = {} }) => {
  try {
    if (!token) throw new Error("Authentication token missing");
    const qs = new URLSearchParams(params).toString();
    const url = GET_QUIZ_LEADERBOARD_API + (qs ? `?${qs}` : "");
    const res = await apiConnector("GET", url, null, { Authorization: `Bearer ${token}` });
    if (!res?.data?.success) throw new Error(res?.data?.message || "Failed to fetch leaderboard");
    return res.data.data;
  } catch (e) {
    console.error("GET_QUIZ_LEADERBOARD_API ERROR", e);
    toast.error(e.message);
    return null;
  }
};

export const exportQuizReports = async ({ token, format = 'pdf', filters = {} }) => {
  try {
    if (!token) throw new Error("Authentication token is required");

    const res = await apiConnector("POST", EXPORT_QUIZ_REPORTS_API, {
      format,
      filters
    }, {
      Authorization: `Bearer ${token}`
    });

    if (!res?.data?.success) {
      throw new Error(res?.data?.message || "Failed to export quiz reports");
    }

    return res.data;
  } catch (error) {
    console.error("Export Quiz Reports Error:", error);
    toast.error(error.message || "Failed to export quiz reports");
    throw error;
  }
};

// Admin-specific API functions
export const getAllStudentQuizPerformance = async (token, filters = {}) => {
  try {
    if (!token) throw new Error("Authentication token is required");

    const queryParams = new URLSearchParams();
    if (filters.courseId) queryParams.append('courseId', filters.courseId);
    if (filters.timeRange) queryParams.append('timeRange', filters.timeRange);
    if (filters.studentId) queryParams.append('studentId', filters.studentId);
    
    // Add cache-busting parameter
    queryParams.append('_t', Date.now().toString());
    
    const url = `/api/v1/quiz-reports/admin/all-students?${queryParams.toString()}`;

    console.log('🌐 Making API call to:', url);

    const res = await apiConnector("GET", url, null, {
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache'
    });

    if (!res?.data?.success) {
      throw new Error(res?.data?.message || "Failed to fetch student performance data");
    }

    return res.data;
  } catch (error) {
    console.error("Get All Student Performance Error:", error);
    toast.error(error.message || "Failed to fetch student performance data");
    throw error;
  }
};

export const getAdminQuizAnalytics = async (token, filters = {}) => {
  try {
    if (!token) throw new Error("Authentication token is required");

    const queryParams = new URLSearchParams();
    if (filters.timeRange) queryParams.append('timeRange', filters.timeRange);
    if (filters.courseId) queryParams.append('courseId', filters.courseId);
    if (filters.quizId) queryParams.append('quizId', filters.quizId);
    
    // Add cache-busting parameter
    queryParams.append('_t', Date.now().toString());
    
    const url = `/api/v1/quiz-reports/admin/analytics?${queryParams.toString()}`;

    console.log('🌐 Making API call to:', url);

    const res = await apiConnector("GET", url, null, {
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache'
    });

    if (!res?.data?.success) {
      throw new Error(res?.data?.message || "Failed to fetch analytics data");
    }

    return res.data;
  } catch (error) {
    console.error("Get Admin Analytics Error:", error);
    toast.error(error.message || "Failed to fetch analytics data");
    throw error;
  }
};

export const getQuizInsights = async (token, quizId) => {
  try {
    if (!token) throw new Error("Authentication token is required");
    if (!quizId) throw new Error("Quiz ID is required");

    const res = await apiConnector("GET", `/api/v1/quiz-reports/admin/quiz-insights/${quizId}`, null, {
      Authorization: `Bearer ${token}`
    });

    if (!res?.data?.success) {
      throw new Error(res?.data?.message || "Failed to fetch quiz insights");
    }

    return res.data;
  } catch (error) {
    console.error("Get Quiz Insights Error:", error);
    toast.error(error.message || "Failed to fetch quiz insights");
    throw error;
  }
};

export const getStudentComparison = async (token, studentIds) => {
  try {
    if (!token) throw new Error("Authentication token is required");
    if (!studentIds || !Array.isArray(studentIds)) throw new Error("Student IDs array is required");

    const res = await apiConnector("POST", `/api/v1/quiz-reports/admin/student-comparison`, {
      studentIds
    }, {
      Authorization: `Bearer ${token}`
    });

    if (!res?.data?.success) {
      throw new Error(res?.data?.message || "Failed to fetch student comparison data");
    }

    return res.data;
  } catch (error) {
    console.error("Get Student Comparison Error:", error);
    toast.error(error.message || "Failed to fetch student comparison data");
    throw error;
  }
};

export const generateAdminReport = async (token, reportType, filters = {}) => {
  try {
    if (!token) throw new Error("Authentication token is required");
    if (!reportType) throw new Error("Report type is required");

    const res = await apiConnector("POST", `/api/v1/quiz-reports/admin/generate-report`, {
      reportType,
      filters
    }, {
      Authorization: `Bearer ${token}`
    });

    if (!res?.data?.success) {
      throw new Error(res?.data?.message || "Failed to generate admin report");
    }

    return res.data;
  } catch (error) {
    console.error("Generate Admin Report Error:", error);
    toast.error(error.message || "Failed to generate admin report");
    throw error;
  }
};
