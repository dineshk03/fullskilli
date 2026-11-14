import { toast } from "react-hot-toast";
import { apiConnector } from "../apiConnector";
import { adminEndpoints, teamMembersEndpoints } from "../apis";

const {
  GET_ADMIN_TEAM_MEMBERS_API,
  CREATE_TEAM_MEMBER_API,
  UPDATE_TEAM_MEMBER_API,
  DELETE_TEAM_MEMBER_API,
} = adminEndpoints;

const { GET_PUBLIC_TEAM_MEMBERS_API } = teamMembersEndpoints;

export const getPublicTeamMembers = async () => {
  try {
    const response = await apiConnector("GET", GET_PUBLIC_TEAM_MEMBERS_API);

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not fetch team members");
    }

    return response.data.data || [];
  } catch (error) {
    console.error("GET_PUBLIC_TEAM_MEMBERS_API ERROR:", error);
    throw error;
  }
};

export const getAdminTeamMembers = async (token) => {
  try {
    const response = await apiConnector("GET", GET_ADMIN_TEAM_MEMBERS_API, null, {
      Authorization: `Bearer ${token}`,
    });

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not fetch team members");
    }

    return response.data.data || [];
  } catch (error) {
    console.error("GET_ADMIN_TEAM_MEMBERS_API ERROR:", error);
    toast.error(error.response?.data?.message || error.message);
    throw error;
  }
};

export const createTeamMember = async (payload, token) => {
  const toastId = toast.loading("Creating team member...");
  try {
    const response = await apiConnector("POST", CREATE_TEAM_MEMBER_API, payload, {
      Authorization: `Bearer ${token}`,
    });

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not create team member");
    }

    toast.success("Team member created");
    return response.data.data;
  } catch (error) {
    console.error("CREATE_TEAM_MEMBER_API ERROR:", error);
    toast.error(error.response?.data?.message || error.message);
    throw error;
  } finally {
    toast.dismiss(toastId);
  }
};

export const updateTeamMember = async (memberId, payload, token) => {
  const toastId = toast.loading("Updating team member...");
  try {
    const url = UPDATE_TEAM_MEMBER_API.replace(":memberId", memberId);
    const response = await apiConnector("PUT", url, payload, {
      Authorization: `Bearer ${token}`,
    });

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not update team member");
    }

    toast.success("Team member updated");
    return response.data.data;
  } catch (error) {
    console.error("UPDATE_TEAM_MEMBER_API ERROR:", error);
    toast.error(error.response?.data?.message || error.message);
    throw error;
  } finally {
    toast.dismiss(toastId);
  }
};

export const deleteTeamMember = async (memberId, token) => {
  const toastId = toast.loading("Deleting team member...");
  try {
    const url = DELETE_TEAM_MEMBER_API.replace(":memberId", memberId);
    const response = await apiConnector("DELETE", url, undefined, {
      Authorization: `Bearer ${token}`,
    });

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not delete team member");
    }

    toast.success("Team member deleted");
    return true;
  } catch (error) {
    console.error("DELETE_TEAM_MEMBER_API ERROR:", error);
    toast.error(error.response?.data?.message || error.message);
    throw error;
  } finally {
    toast.dismiss(toastId);
  }
};
