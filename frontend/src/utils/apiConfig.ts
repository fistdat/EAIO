// API Configuration for Energy AI Optimizer
// This file contains configuration options for API services

// API environment configuration
interface ApiConfig {
  useMockData: boolean;
  apiBaseUrl: string;
  apiVersion: string;
  mockDelay: {
    min: number;
    max: number;
  };
  fallbackToMockOnError: boolean;
}

// Get configuration from environment variables or use defaults
export const apiConfig: ApiConfig = {
  // Use mock data for development (override with REACT_APP_USE_MOCK_DATA)
  useMockData: process.env.REACT_APP_USE_MOCK_DATA === 'true',
  
  // API base URL (override with REACT_APP_API_BASE_URL)
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api',
  
  // API version (override with REACT_APP_API_VERSION)
  apiVersion: process.env.REACT_APP_API_VERSION || 'v1',
  
  // Always fallback to mock data when API error occurs - better user experience
  fallbackToMockOnError: true,
  
  // Mock response delay range in milliseconds
  mockDelay: {
    min: 300,
    max: 1200
  }
};

// Helper function to get a random mock delay
export const getMockDelay = (): number => {
  const { min, max } = apiConfig.mockDelay;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper function to create a mock delay promise
export const createMockDelay = (customDelay?: number): Promise<void> => {
  const delay = customDelay ?? getMockDelay();
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Helper function to get the current API data mode (mock or real)
export const isMockDataMode = (): boolean => {
  return apiConfig.useMockData;
};

// Helper function to check if should fallback to mock on error
export const shouldFallbackOnError = (): boolean => {
  return apiConfig.fallbackToMockOnError;
};

// Helper function to format API path
export const formatApiPath = (path: string): string => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `/${apiConfig.apiVersion}/${cleanPath}`;
};

// Log API configuration on initialization (hidden in production)
if (process.env.NODE_ENV !== 'production') {
  console.info('API Configuration:', {
    useMockData: apiConfig.useMockData,
    apiBaseUrl: apiConfig.apiBaseUrl,
    apiVersion: apiConfig.apiVersion,
    fallbackToMockOnError: apiConfig.fallbackToMockOnError
  });
}
