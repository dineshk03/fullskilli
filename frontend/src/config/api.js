/**
 * API Configuration
 */

/**
 * Get base URL from environment variable or use dynamic detection
 * @returns {string} - The base URL for API calls
 */
export const getBaseUrl = () => {
  // For Vite, use import.meta.env
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_REACT_APP_BASE_URL) {
    return import.meta.env.VITE_REACT_APP_BASE_URL.replace(/\/?api\/v1\/?$/, "");
  }
  
  return typeof window !== 'undefined' ? window.location.origin : '';
};

// Get base URL from environment variable or use default
export const BASE_URL = getBaseUrl();

// API endpoints
export const API_ENDPOINTS = {
  VIDEO_STREAM: (videoId) => `${BASE_URL}/api/v1/video/stream/${videoId}`,
  VIDEO_INFO: (videoId) => `${BASE_URL}/api/v1/video/info/${videoId}`,
  VIDEO_MANIFEST: (videoId) => `${BASE_URL}/api/v1/video/manifest/${videoId}`,
  CHUNKED_UPLOAD_INIT: `${BASE_URL}/api/v1/chunked-upload/initialize`,
  CHUNKED_UPLOAD_CHUNK: `${BASE_URL}/api/v1/chunked-upload/chunk`,
  CHUNKED_UPLOAD_COMPLETE: `${BASE_URL}/api/v1/chunked-upload/complete`,
  CHUNKED_UPLOAD_PROGRESS: (videoId) => `${BASE_URL}/api/v1/chunked-upload/progress/${videoId}`
};

export default {
  BASE_URL,
  API_ENDPOINTS,
  getBaseUrl
};

export const PHP_BASE_URL = (import.meta.env.VITE_LARAVEL_BASE_URL || import.meta.env.VITE_PHP_SITE_URL || '').replace(/\/$/, '');
