import axios from 'axios';
import { apiConfig, formatApiPath } from '../../utils/apiConfig';

// Get the API base URL from environment variables or use default
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
const API_VERSION = process.env.REACT_APP_API_VERSION || 'v1';

console.log('Using API base URL:', API_BASE_URL);

const USE_API_VERSION = true; // Flag to determine if we should use API versioning

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: apiConfig.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log API requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.params || {});
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log API responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      });
    }
    
    return response;
  },
  (error) => {
    // Global error handling
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error.response ? {
        status: error.response.status,
        data: error.response.data,
        url: error.config.url
      } : error.message);
    }
    
    const { response } = error;
    
    if (response && response.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      // Redirect to login or show notification
    }
    
    return Promise.reject(error);
  }
);

// Helper function to get the correct API path with version
export const getApiPath = (path: string): string => {
  return formatApiPath(path);
};

// Export default API client
export default apiClient; 