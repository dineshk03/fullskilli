import { toast } from "react-hot-toast";
import { apiConnector } from "../apiConnector";
import { batchEndpoints } from "../apis";

const {
    CREATE_BATCH_API,
    GET_ALL_BATCHES_API,
    UPDATE_BATCH_API,
    DELETE_BATCH_API,
} = batchEndpoints;

export const createBatch = async (data, token) => {
    let result = null;
    try {
        const response = await apiConnector("POST", CREATE_BATCH_API, data, {
            Authorization: `Bearer ${token}`,
        });
        console.log("CREATE_BATCH_API RESPONSE............", response);

        if (!response.data.success) {
            throw new Error(response.data.message);
        }
        result = response.data.data;
        toast.success("Batch Created Successfully");
    } catch (error) {
        console.log("CREATE_BATCH_API ERROR............", error);
        toast.error(error.response?.data?.message || "Could not create batch");
    }
    return result;
};

export const getAllBatches = async (token) => {
    let result = [];
    try {
        const response = await apiConnector("GET", GET_ALL_BATCHES_API, null, {
            Authorization: `Bearer ${token}`,
        });
        console.log("GET_ALL_BATCHES_API RESPONSE............", response);

        if (!response.data.success) {
            throw new Error(response.data.message);
        }
        result = response.data.data;
    } catch (error) {
        console.log("GET_ALL_BATCHES_API ERROR............", error);
        toast.error(error.message);
    }
    return result;
};

export const updateBatch = async (batchId, data, token) => {
    let result = null;
    try {
        const response = await apiConnector("PUT", `${UPDATE_BATCH_API}/${batchId}`, data, {
            Authorization: `Bearer ${token}`,
        });
        console.log("UPDATE_BATCH_API RESPONSE............", response);

        if (!response.data.success) {
            throw new Error(response.data.message);
        }
        result = response.data.data;
        toast.success("Batch Updated Successfully");
    } catch (error) {
        console.log("UPDATE_BATCH_API ERROR............", error);
        toast.error(error.response?.data?.message || "Could not update batch");
    }
    return result;
};

export const deleteBatch = async (batchId, token) => {
    let result = false;
    try {
        const response = await apiConnector("DELETE", `${DELETE_BATCH_API}/${batchId}`, null, {
            Authorization: `Bearer ${token}`,
        });
        console.log("DELETE_BATCH_API RESPONSE............", response);

        if (!response.data.success) {
            throw new Error(response.data.message);
        }
        result = true;
        toast.success("Batch Deleted Successfully");
    } catch (error) {
        console.log("DELETE_BATCH_API ERROR............", error);
        toast.error(error.response?.data?.message || "Could not delete batch");
    }
    return result;
};
