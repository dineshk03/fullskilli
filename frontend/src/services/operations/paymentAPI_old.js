import { toast } from "react-hot-toast";
import { apiConnector } from "../apiconnector";
import { paymentEndpoints } from "../apis";

const {
  PAYMENT_REPORTS_API,
  EXPORT_PAYMENT_REPORTS_API
} = paymentEndpoints;

// Get payment reports for admin
export const getPaymentReports = async (token, params = {}) => {
  const toastId = toast.loading("Loading payment reports...");
  let result = null;
  
  try {
    // Build query string from params
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key]) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await apiConnector(
      "GET",
      `${PAYMENT_REPORTS_API}?${queryParams.toString()}`,
      null,
      {
        Authorization: `Bearer ${token}`,
      }
    );

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not fetch payment reports");
    }

    result = response.data;
    toast.success("Payment reports loaded successfully");
  } catch (error) {
    console.error("GET_PAYMENT_REPORTS_API ERROR:", error);
    toast.error(error?.response?.data?.message || "Failed to fetch payment reports");
  } finally {
    toast.dismiss(toastId);
  }
  
  return result;
};

// Export payment reports as CSV
export const exportPaymentReports = async (token, params = {}) => {
  const toastId = toast.loading("Exporting payment reports...");
  
  try {
    // Build query string from params
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key]) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await fetch(
      `${EXPORT_PAYMENT_REPORTS_API}?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to export payment reports");
    }

    // Get the CSV content
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-reports-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast.success("Payment reports exported successfully");
  } catch (error) {
    console.error("EXPORT_PAYMENT_REPORTS_API ERROR:", error);
    toast.error(error?.message || "Failed to export payment reports");
  } finally {
    toast.dismiss(toastId);
  }
};
