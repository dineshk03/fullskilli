import { apiConnector } from "./apiConnector";
import { planEndpoints, skilliEndpoints, lmsEndpoints } from "./apis";
import { toast } from "react-hot-toast";
const {
  GET_PLAN_PURCHASE_API,
  UPDATE_PLAN_USAGE_API,
  VALIDATE_ACTIVATION_CODE_API,
  CHECK_FEATURE_ACCESS_API
} = planEndpoints;
const {
  INITIALIZE_SKILL_TEST_API,
  COMPLETE_SKILL_TEST_API,
  GET_SKILL_TEST_STATS_API
} = skilliEndpoints;
const {
  VALIDATE_ACTIVATION_FOR_LMS_API,
  GET_LMS_ACCESS_URL_API,
  VALIDATE_LMS_TOKEN_API,
  REDIRECT_TO_LMS_API,
  GET_LMS_ACCESS_HISTORY_API,
  CHECK_COURSE_ACCESS_API,
  GET_LMS_ENROLLMENT_STATUS_API
} = lmsEndpoints;

// Plan Management Services
export const getPlanPurchase = async pid => {
  const toastId = toast.loading("Fetching plan details...");
  try {
    if (!GET_PLAN_PURCHASE_API) throw new Error('Plan service is not configured');
    // External API doesn't require authentication token
    const response = await apiConnector("POST", GET_PLAN_PURCHASE_API, {
      pid
    });
    if (!response.data) {
      throw new Error("No plan data received");
    }
    toast.success("Plan details fetched successfully");
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to fetch plan details");
    throw error;
  } finally {
    toast.dismiss(toastId);
  }
};
export const updatePlanUsage = async (pid, coursesUsage = 0, internshipUsage = 0) => {
  const toastId = toast.loading("Updating plan usage...");
  try {
    // External API doesn't require authentication token
    if (!UPDATE_PLAN_USAGE_API) throw new Error('Plan service is not configured');
    const response = await apiConnector("POST", UPDATE_PLAN_USAGE_API, {
      pid,
      courses_usage: coursesUsage,
      internship_usage: internshipUsage
    });
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    toast.success("Plan usage updated successfully");
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to update plan usage");
    throw error;
  } finally {
    toast.dismiss(toastId);
  }
};
export const validateActivationCode = async (pid, activationCode, token = null) => {
  const toastId = toast.loading("Validating activation code...");
  try {
    const response = await apiConnector("POST", VALIDATE_ACTIVATION_CODE_API, {
      pid,
      activation_code: activationCode
    }, {
      Authorization: `Bearer ${token}`
    });
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    toast.success("Activation code is valid");
    return response.data.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Invalid activation code");
    throw error;
  } finally {
    toast.dismiss(toastId);
  }
};
export const getActivePlans = async (pid, token = null) => {
  const toastId = toast.loading("Fetching active plans...");
  try {
    // Use the same plan purchase API to get all plans
    const planData = await getPlanPurchase(pid, token);

    // Filter active plans from the response
    const activePlans = planData.plans ? planData.plans.filter(plan => plan.status === 'ACTIVE') : [];
    toast.success("Active plans fetched successfully");
    return {
      active_plans: activePlans,
      total_plans: planData.plans ? planData.plans.length : 0
    };
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to fetch active plans");
    throw error;
  } finally {
    toast.dismiss(toastId);
  }
};
export const checkFeatureAccess = async (pid, feature, token = null) => {
  const response = await apiConnector("POST", CHECK_FEATURE_ACCESS_API, {
    pid,
    feature
  }, {
    Authorization: `Bearer ${token}`
  });
  if (!response.data.success) {
    throw new Error(response.data.message);
  }
  return response.data.data;
};

// Skilli Integration Services
export const initializeSkillTest = async (pid, skillTestId, token = null) => {
  const toastId = toast.loading("Initializing skill test...");
  try {
    const response = await apiConnector("POST", INITIALIZE_SKILL_TEST_API, {
      pid,
      skill_test_id: skillTestId
    }, {
      Authorization: `Bearer ${token}`
    });
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    toast.success("Skill test initialized successfully");
    return response.data.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to initialize skill test");
    throw error;
  } finally {
    toast.dismiss(toastId);
  }
};
export const completeSkillTest = async (pid, verificationId, skillTestId, score, results = null, token = null) => {
  const toastId = toast.loading("Completing skill test...");
  try {
    const response = await apiConnector("POST", COMPLETE_SKILL_TEST_API, {
      pid,
      verification_id: verificationId,
      skill_test_id: skillTestId,
      score,
      results
    }, {
      Authorization: `Bearer ${token}`
    });
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    toast.success("Skill test completed successfully");
    return response.data.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to complete skill test");
    throw error;
  } finally {
    toast.dismiss(toastId);
  }
};
export const getSkillTestStats = async (pid, token = null) => {
  const toastId = toast.loading("Fetching skill test statistics...");
  try {
    const response = await apiConnector("POST", GET_SKILL_TEST_STATS_API, {
      pid
    }, {
      Authorization: `Bearer ${token}`
    });
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    toast.success("Skill test statistics fetched successfully");
    return response.data.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to fetch skill test statistics");
    throw error;
  } finally {
    toast.dismiss(toastId);
  }
};

// LMS Integration Services
export const validateActivationForLMS = async (pid, activationCode, courseId = null, token = null) => {
  const toastId = toast.loading("Validating activation for LMS access...");
  try {
    const response = await apiConnector("POST", VALIDATE_ACTIVATION_FOR_LMS_API, {
      pid,
      activation_code: activationCode,
      course_id: courseId
    }, {
      Authorization: `Bearer ${token}`
    });
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    toast.success("LMS access granted successfully");
    return response.data.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to validate activation for LMS");
    throw error;
  } finally {
    toast.dismiss(toastId);
  }
};
export const getLMSAccessURL = async (pid, activationCode, courseId = null, redirectPath = '/dashboard', token = null) => {
  const toastId = toast.loading("Generating LMS access URL...");
  try {
    const response = await apiConnector("POST", GET_LMS_ACCESS_URL_API, {
      pid,
      activation_code: activationCode,
      course_id: courseId,
      redirect_path: redirectPath
    }, {
      Authorization: `Bearer ${token}`
    });
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    toast.success("LMS access URL generated successfully");
    return response.data.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to generate LMS access URL");
    throw error;
  } finally {
    toast.dismiss(toastId);
  }
};
export const validateLMSToken = async (token, authToken = null) => {
  const response = await apiConnector("POST", VALIDATE_LMS_TOKEN_API, {
    token
  }, {
    Authorization: `Bearer ${authToken}`
  });
  if (!response.data.success) {
    throw new Error(response.data.message);
  }
  return response.data.data;
};
export const redirectToLMS = async (pid, activationCode, courseId = null, redirectPath = '/dashboard', token = null) => {
  const toastId = toast.loading("Redirecting to LMS...");
  try {
    const response = await apiConnector("POST", REDIRECT_TO_LMS_API, {
      pid,
      activation_code: activationCode,
      course_id: courseId,
      redirect_path: redirectPath
    }, {
      Authorization: `Bearer ${token}`
    });
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    toast.success("Redirecting to LMS...");
    return response.data.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to redirect to LMS");
    throw error;
  } finally {
    toast.dismiss(toastId);
  }
};
export const getLMSAccessHistory = async (pid, token = null) => {
  const toastId = toast.loading("Fetching LMS access history...");
  try {
    const response = await apiConnector("POST", GET_LMS_ACCESS_HISTORY_API, {
      pid
    }, {
      Authorization: `Bearer ${token}`
    });
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    toast.success("LMS access history fetched successfully");
    return response.data.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to fetch LMS access history");
    throw error;
  } finally {
    toast.dismiss(toastId);
  }
};
export const checkCourseAccess = async (pid, courseId, token = null) => {
  const response = await apiConnector("POST", CHECK_COURSE_ACCESS_API, {
    pid,
    course_id: courseId
  }, {
    Authorization: `Bearer ${token}`
  });
  if (!response.data.success) {
    throw new Error(response.data.message);
  }
  return response.data.data;
};
export const getLMSEnrollmentStatus = async (pid, token = null) => {
  const toastId = toast.loading("Fetching LMS enrollment status...");
  try {
    const response = await apiConnector("POST", GET_LMS_ENROLLMENT_STATUS_API, {
      pid
    }, {
      Authorization: `Bearer ${token}`
    });
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    toast.success("LMS enrollment status fetched successfully");
    return response.data.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to fetch LMS enrollment status");
    throw error;
  } finally {
    toast.dismiss(toastId);
  }
};

// Utility Functions
export const hasPlanAccess = (plans, feature) => {
  if (!plans || !Array.isArray(plans)) return false;
  return plans.some(plan => plan.status === 'ACTIVE' && plan[feature] && plan[feature].remaining > 0);
};
export const getRemainingUsage = (plans, feature) => {
  if (!plans || !Array.isArray(plans)) return 0;
  return plans.reduce((total, plan) => {
    if (plan.status === 'ACTIVE' && plan[feature]) {
      return total + plan[feature].remaining;
    }
    return total;
  }, 0);
};
export const formatPlanValidity = validity => {
  if (!validity) return 'No validity info';
  if (validity.end === 'Lifetime access') {
    return `Valid from ${validity.start} - Lifetime`;
  }
  return `Valid from ${validity.start} to ${validity.end}`;
};
export const getPlanStatusColor = status => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'expired':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Plan Activation and Usage Management
export const activatePlanForUser = async (pid, activationCode, token = null) => {
  try {
    // First validate the activation code
    const validation = await validateActivationCode(pid, activationCode, token);

    // Then get the updated plan details
    const planDetails = await getPlanPurchase(pid, token);
    return {
      success: true,
      validation,
      planDetails
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
export const consumeCourseAccess = async (pid, token = null) => {
  try {
    // Get current plan details
    const planData = await getPlanPurchase(pid, token);
    const activePlans = planData.plans?.filter(plan => plan.status === 'ACTIVE') || [];
    if (activePlans.length === 0) {
      throw new Error('No active plans found');
    }

    // Find a plan with available course access
    const availablePlan = activePlans.find(plan => plan.courses && plan.courses.remaining > 0);
    if (!availablePlan) {
      throw new Error('No course access available in your plans');
    }

    // Update usage (increment by 1)
    const currentUsage = availablePlan.courses.used || 0;
    const updateResponse = await updatePlanUsage(pid, currentUsage + 1, 0, token);
    return {
      success: true,
      plan: availablePlan,
      updateResponse
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
export const consumeInternshipAccess = async (pid, token = null) => {
  try {
    // Get current plan details
    const planData = await getPlanPurchase(pid, token);
    const activePlans = planData.plans?.filter(plan => plan.status === 'ACTIVE') || [];
    if (activePlans.length === 0) {
      throw new Error('No active plans found');
    }

    // Find a plan with available internship access
    const availablePlan = activePlans.find(plan => plan.virtual_internship && plan.virtual_internship.remaining > 0);
    if (!availablePlan) {
      throw new Error('No internship access available in your plans');
    }

    // Update usage (increment by 1)
    const currentUsage = availablePlan.virtual_internship.used || 0;
    const updateResponse = await updatePlanUsage(pid, 0, currentUsage + 1, token);
    return {
      success: true,
      plan: availablePlan,
      updateResponse
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
