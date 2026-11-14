import { apiConnector } from "../apiConnector";
import { toast } from "react-hot-toast";
import { BASE_URL } from "../apis";

// Remove the local BASE_URL definition since we imported it

// Bulk Deactivate Users
export async function bulkDeactivateUsers(userIds, token) {
    const toastId = toast.loading("Deactivating users...");

    try {
        const response = await apiConnector(
            "POST",
            `${BASE_URL}/admin/users/bulk-deactivate`,
            { userIds },
            {
                Authorization: `Bearer ${token}`,
            }
        );

        console.log("BULK_DEACTIVATE_USERS_API_RESPONSE:", response);

        if (!response.data.success) {
            throw new Error(response.data.message);
        }

        toast.success(response.data.message, { id: toastId });

        // Show detailed results
        const { summary } = response.data.data;
        if (summary.failed > 0) {
            toast.error(`${summary.failed} user(s) failed to deactivate`);
        }
        if (summary.alreadyInactive > 0) {
            toast.info(`${summary.alreadyInactive} user(s) were already inactive`);
        }

        return response.data;
    } catch (error) {
        console.log("BULK_DEACTIVATE_USERS_API_ERROR:", error);
        toast.error(error.response?.data?.message || error.message, { id: toastId });
        throw error;
    }
}

// Bulk Activate Users
export async function bulkActivateUsers(userIds, token) {
    const toastId = toast.loading("Activating users...");

    try {
        const response = await apiConnector(
            "POST",
            `${BASE_URL}/admin/users/bulk-activate`,
            { userIds },
            {
                Authorization: `Bearer ${token}`,
            }
        );

        console.log("BULK_ACTIVATE_USERS_API_RESPONSE:", response);

        if (!response.data.success) {
            throw new Error(response.data.message);
        }

        toast.success(response.data.message, { id: toastId });

        // Show detailed results
        const { summary } = response.data.data;
        if (summary.failed > 0) {
            toast.error(`${summary.failed} user(s) failed to activate`);
        }
        if (summary.alreadyActive > 0) {
            toast.info(`${summary.alreadyActive} user(s) were already active`);
        }

        return response.data;
    } catch (error) {
        console.log("BULK_ACTIVATE_USERS_API_ERROR:", error);
        toast.error(error.response?.data?.message || error.message, { id: toastId });
        throw error;
    }
}

// Bulk Delete Users
export async function bulkDeleteUsers(userIds, permanent = false, token) {
    const toastId = toast.loading(
        permanent ? "Permanently deleting users..." : "Moving users to recycle bin..."
    );

    try {
        const response = await apiConnector(
            "POST",
            `${BASE_URL}/admin/users/bulk-delete`,
            { userIds, permanent },
            {
                Authorization: `Bearer ${token}`,
            }
        );

        console.log("BULK_DELETE_USERS_API_RESPONSE:", response);

        if (!response.data.success) {
            throw new Error(response.data.message);
        }

        toast.success(response.data.message, { id: toastId });

        // Show detailed results
        const { summary } = response.data.data;
        if (summary.failed > 0) {
            toast.error(`${summary.failed} user(s) failed to delete`);
        }
        if (summary.protected > 0) {
            toast.warning(`${summary.protected} user(s) were protected from deletion`);
        }

        return response.data;
    } catch (error) {
        console.log("BULK_DELETE_USERS_API_ERROR:", error);
        toast.error(error.response?.data?.message || error.message, { id: toastId });
        throw error;
    }
}

// Bulk Restore Users
export async function bulkRestoreUsers(userIds, token) {
    const toastId = toast.loading("Restoring users...");

    try {
        const response = await apiConnector(
            "POST",
            `${BASE_URL}/admin/users/bulk-restore`,
            { userIds },
            {
                Authorization: `Bearer ${token}`,
            }
        );

        console.log("BULK_RESTORE_USERS_API_RESPONSE:", response);

        if (!response.data.success) {
            throw new Error(response.data.message);
        }

        toast.success(response.data.message, { id: toastId });

        // Show detailed results
        const { summary } = response.data.data;
        if (summary.failed > 0) {
            toast.error(`${summary.failed} user(s) failed to restore`);
        }

        return response.data;
    } catch (error) {
        console.log("BULK_RESTORE_USERS_API_ERROR:", error);
        toast.error(error.response?.data?.message || error.message, { id: toastId });
        throw error;
    }
}
