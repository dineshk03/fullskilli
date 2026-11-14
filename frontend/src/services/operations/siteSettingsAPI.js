import { toast } from "react-hot-toast";
import { apiConnector } from "../apiConnector";
import { adminEndpoints, siteSettingsEndpoints } from "../apis";

const { GET_PUBLIC_SITE_SETTINGS_API } = siteSettingsEndpoints;
const { GET_ADMIN_SITE_SETTINGS_API, UPDATE_ADMIN_SITE_SETTINGS_API } = adminEndpoints;

export const getPublicSiteSettings = async () => {
  const response = await apiConnector("GET", GET_PUBLIC_SITE_SETTINGS_API);

  if (!response?.data?.success) {
    throw new Error(response?.data?.message || "Could not fetch site settings");
  }

  return response.data.data;
};

export const getAdminSiteSettings = async (token) => {
  const response = await apiConnector("GET", GET_ADMIN_SITE_SETTINGS_API, null, {
    Authorization: `Bearer ${token}`,
  });

  if (!response?.data?.success) {
    throw new Error(response?.data?.message || "Could not fetch site settings");
  }

  return response.data.data;
};

export const updateAdminSiteSettings = async (payload, token) => {
  const toastId = toast.loading("Saving settings...");
  try {
    const response = await apiConnector("PUT", UPDATE_ADMIN_SITE_SETTINGS_API, payload, {
      Authorization: `Bearer ${token}`,
    });

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not update site settings");
    }

    toast.success("Settings updated");
    return response.data.data;
  } catch (error) {
    toast.error(error.response?.data?.message || error.message);
    throw error;
  } finally {
    toast.dismiss(toastId);
  }
};
