import axios from "axios"
import { toast } from "react-hot-toast"
import { clearAuth } from '../slices/authSlice'

export const axiosInstance = axios.create({
    withCredentials: true,
    headers: {
        'Accept': 'application/json'
    }
});

const normalizeAuthHeader = (authHeader) => {
    if (!authHeader) return null;
    if (typeof authHeader !== 'string') return null;

    let header = authHeader.trim();
    // If caller passed only the token, allow it, but most callers pass 'Bearer <token>'
    if (header.toLowerCase() === 'bearer null' || header.toLowerCase() === 'bearer undefined') return null;
    if (header === 'null' || header === 'undefined') return null;

    // Strip accidental quotes: Bearer "token" or Bearer 'token'
    if (header.toLowerCase().startsWith('bearer ')) {
        const token = header.slice(7).trim();
        if (!token || token === 'null' || token === 'undefined') return null;
        const unquoted = ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'")))
            ? token.slice(1, -1)
            : token;
        if (!unquoted || unquoted === 'null' || unquoted === 'undefined') return null;
        return `Bearer ${unquoted}`;
    }

    return header;
}

// Add response interceptor to handle authentication errors
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        // Check if the error is due to user deactivation
        if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
            const errorData = error.response.data;

            // Token missing/invalid -> force login redirect with friendly message
            if (errorData?.message === 'Token is Missing' || errorData?.message === 'Invalid token format') {
                toast.error('Please login to continue');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 300);
                return Promise.reject(error);
            }
            
            // Handle token expiry
            if (errorData?.reason === 'TOKEN_EXPIRED') {
                toast.error('Your session has expired. Please login again.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1000);
                return Promise.reject(error);
            }
            
            // Handle specific deactivation cases
            if (errorData?.reason === 'USER_DEACTIVATED' || 
                errorData?.reason === 'TOKEN_BLACKLISTED' ||
                errorData?.reason === 'USER_NOT_FOUND') {
                
                console.log('User account deactivated or token blacklisted - forcing logout');
                
                // Show appropriate message
                toast.error(errorData.message || 'Your account has been deactivated. Please contact support.');
                
                // Clear local storage and Redux state
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                
                // Dispatch clearAuth action to Redux store if available
                try {
                    // Get the store instance (this will be set up in the main app)
                    const store = window.__REDUX_STORE__;
                    if (store) {
                        store.dispatch(clearAuth());
                    }
                } catch (reduxError) {
                    console.log('Could not clear Redux state:', reduxError.message);
                }
                
                // Force page reload to ensure complete logout
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            }
        }
        
        return Promise.reject(error);
    }
);

export const apiConnector = (method, url, bodyData, headers, params, config = {}) => {
    // Determine if we're sending FormData (for file uploads)
    const isFormData = bodyData instanceof FormData;
    
    const normalizedAuthorization = normalizeAuthHeader(headers?.Authorization);

    // Set default headers, but don't override Content-Type for FormData
    const defaultHeaders = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(normalizedAuthorization ? { 'Authorization': normalizedAuthorization } : {})
    };

    const finalHeaders = {
        ...defaultHeaders,
        ...headers
    };
    if (normalizedAuthorization) {
        finalHeaders.Authorization = normalizedAuthorization;
    } else {
        delete finalHeaders.Authorization;
    }

    return axiosInstance({
        method: `${method}`,
        url: `${url}`,
        data: bodyData !== undefined && bodyData !== null ? bodyData : undefined,
        headers: finalHeaders,
        params: params ? params : null,
        withCredentials: true,
        ...config  // Spread additional axios config options like responseType
    }).catch(error => {
        // Don't log 401 errors for notification endpoints (they're expected when token expires)
        const isNotificationEndpoint = url.includes('/notification/');
        const is401Error = error.response?.status === 401;
        
        if (!isNotificationEndpoint || !is401Error) {
            console.error('API Error:', {
                url,
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
        }
        throw error;
    });
}
