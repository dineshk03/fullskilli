import { apiConnector } from "../apiConnector";

// ================= EMAIL LOGS (MAIL REPORT) =================
export const getEmailLogs = async (token, {
  status,
  email,
  limit,
  dateFrom,
  dateTo
} = {}) => {
  try {
    if (!token) {
      throw new Error("No authentication token found");
    }
    const params = {};
    if (status) params.status = status;
    if (email) params.email = email;
    if (limit) params.limit = limit;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    const response = await apiConnector("GET", "/api/v1/admin/email-logs", null, {
      Authorization: `Bearer ${token}`
    }, params);
    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Failed to fetch email logs");
    }
    const logs = response?.data?.data ?? [];
    const stats = response?.data?.stats ?? null;
    const pagination = response?.data?.pagination ?? null;
    return {
      logs,
      stats,
      pagination
    };
  } catch (error) {
    console.error("Error fetching email logs:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return {
      logs: [],
      stats: null,
      pagination: null
    };
  }
};
