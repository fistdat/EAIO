import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import analysisApi from './analysisApi';
import forecastApi from './forecastApi';
import recommendationApi from './recommendationApi';
import buildingApi from './buildingApi';
import weatherApi from './weatherApi';

// Define API base URL from environment variables
// In browser environment, use the window location's origin or localhost
const isRunningInBrowser = typeof window !== 'undefined';
const API_BASE_URL = isRunningInBrowser 
  ? (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : window.location.origin)
  : process.env.REACT_APP_API_URL || 'http://backend:8000';

console.log('Using API base URL:', API_BASE_URL);

const API_VERSION = 'v1'; // Default API version
const USE_API_VERSION = true; // Flag to determine if we should use API versioning

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Helper function to format API paths with proper versioning
export const getApiPath = (path: string) => {
  // If path already includes /api/ prefix, don't add it again
  const hasApiPrefix = path.startsWith('/api/');
  
  // Check if we should use versioning and if the path doesn't already include version
  if (USE_API_VERSION && !path.includes(`/api/${API_VERSION}/`)) {
    // If path has api prefix but not version, insert version after /api/
    if (hasApiPrefix) {
      return path.replace('/api/', `/api/${API_VERSION}/`);
    }
    // Otherwise add both api prefix and version
    return `/api/${API_VERSION}${path.startsWith('/') ? path : '/' + path}`;
  }
  
  // If no versioning required or already has version, just ensure it has /api/ prefix
  return hasApiPrefix ? path : `/api${path.startsWith('/') ? path : '/' + path}`;
};

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // If URL doesn't already have /api/ prefix, format the URL
    if (config.url && !config.url.startsWith('/api/')) {
      config.url = getApiPath(config.url);
    }
    
    console.log(`Making request to: ${config.baseURL}${config.url}`);
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Helper function to create mock data based on the API endpoint
const createMockData = (url: string | undefined) => {
  console.log('Creating mock data for:', url);
  
  if (url?.includes('/analysis/patterns/')) {
    return { 
      message: 'Development feature',
      hourly_patterns: generateMockHourlyPatterns(),
      weekly_patterns: generateMockWeeklyPatterns(),
      seasonal_patterns: generateMockSeasonalPatterns()
    };
  }
  
  if (url?.includes('/analysis/anomalies/')) {
    return { 
      message: 'Development feature',
      anomalies: generateMockAnomalies() 
    };
  }
  
  if (url?.includes('/analysis/weather-correlation/')) {
    return { 
      message: 'Development feature',
      correlations: generateMockWeatherCorrelation() 
    };
  }
  
  if (url?.includes('/forecasting/building/')) {
    return { 
      message: 'Development feature',
      data: generateMockForecastData()
    };
  }
  
  if (url?.includes('/forecasting/scenarios/')) {
    return { 
      message: 'Development feature',
      dates: generateMockDates(),
      scenarios: generateMockScenarios()
    };
  }
  
  // Default mock data
  return {
    message: 'Development feature - mock data',
    data: []
  };
};

// Generate mock hourly patterns
function generateMockHourlyPatterns() {
  const data: Record<string, number> = {};
  for (let hour = 0; hour < 24; hour++) {
    // Create a typical office building pattern with:
    // - Low consumption at night (0-5)
    // - Increasing in morning (6-9)
    // - High during workday (9-17)
    // - Decreasing in evening (17-22)
    // - Low overnight (22-24)
    let value;
    if (hour >= 0 && hour < 6) {
      value = 20 + Math.random() * 10;
    } else if (hour >= 6 && hour < 9) {
      value = 30 + (hour - 6) * 20 + Math.random() * 15;
    } else if (hour >= 9 && hour < 17) {
      value = 80 + Math.random() * 20;
    } else if (hour >= 17 && hour < 22) {
      value = 80 - (hour - 17) * 12 + Math.random() * 10;
    } else {
      value = 20 + Math.random() * 10;
    }
    data[`${hour}:00`] = Math.round(value);
  }
  return data;
}

// Generate mock weekly patterns
function generateMockWeeklyPatterns() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const data: Record<string, number> = {};
  
  // Create realistic weekly pattern with:
  // - Higher usage on weekdays
  // - Lower usage on weekends
  days.forEach((day, index) => {
    if (index < 5) { // Weekdays
      data[day] = Math.round(75 + Math.random() * 25);
    } else { // Weekend
      data[day] = Math.round(30 + Math.random() * 20);
    }
  });
  
  return data;
}

// Generate mock seasonal patterns
function generateMockSeasonalPatterns() {
  return {
    Winter: Math.round(90 + Math.random() * 20),
    Spring: Math.round(70 + Math.random() * 15),
    Summer: Math.round(85 + Math.random() * 25),
    Fall: Math.round(75 + Math.random() * 15)
  };
}

// Generate mock anomalies
function generateMockAnomalies() {
  const anomalies = [];
  const now = new Date();
  
  // Generate 3 random anomalies in the past month
  for (let i = 0; i < 3; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    
    anomalies.push({
      id: `anom-${i}`,
      timestamp: date.toISOString(),
      expected_value: Math.round(75 + Math.random() * 15),
      actual_value: Math.round(110 + Math.random() * 40),
      deviation_percentage: Math.round(30 + Math.random() * 25),
      severity: i === 0 ? 'High' : i === 1 ? 'Medium' : 'Low'
    });
  }
  
  return anomalies;
}

// Generate mock weather correlation
function generateMockWeatherCorrelation() {
  return {
    temperature: {
      correlation: (0.65 + Math.random() * 0.2).toFixed(2),
      values: [
        { temperature: 0, consumption: Math.round(90 + Math.random() * 20) },
        { temperature: 10, consumption: Math.round(80 + Math.random() * 15) },
        { temperature: 20, consumption: Math.round(70 + Math.random() * 10) },
        { temperature: 30, consumption: Math.round(90 + Math.random() * 25) }
      ]
    },
    humidity: {
      correlation: (0.3 + Math.random() * 0.3).toFixed(2)
    },
    cloud_cover: {
      correlation: (0.15 + Math.random() * 0.25).toFixed(2)
    }
  };
}

// Generate mock forecast data
function generateMockForecastData() {
  const data = [];
  const now = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    
    // Generate realistic values with weekday/weekend pattern
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseValue = isWeekend ? 50 : 85;
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(baseValue + (Math.random() * 20 - 10))
    });
  }
  
  return data;
}

// Generate mock dates for scenarios
function generateMockDates() {
  const dates = [];
  const now = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  
  return dates;
}

// Generate mock scenarios
function generateMockScenarios() {
  const baseline = [];
  const optimized = [];
  const worstCase = [];
  
  for (let i = 0; i < 7; i++) {
    const baseValue = 75 + Math.random() * 25;
    baseline.push(Math.round(baseValue));
    optimized.push(Math.round(baseValue * (0.7 + Math.random() * 0.1)));
    worstCase.push(Math.round(baseValue * (1.1 + Math.random() * 0.2)));
  }
  
  return {
    baseline,
    optimized,
    worstCase
  };
}

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`Received response from: ${response.config.url}`, { status: response.status });
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with non-2xx status
      console.error('Response error:', error.response.status, error.response.data);
      
      // Handle 404 Not Found - could indicate API endpoint isn't implemented yet
      if (error.response.status === 404) {
        console.warn('API endpoint not found. This feature might be under development.');
        
        // For demo purposes, return mock data for endpoints under development
        const url = error.config?.url || '';
        if (url.includes('/analysis/') || url.includes('/forecasting/') || url.includes('/reports/')) {
          console.log('Returning mock data for development endpoint:', url);
          return Promise.resolve({ data: createMockData(url) });
        }
      }
      
      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        // Redirect to login or refresh token logic
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error - no response received:', error.request);
      
      // For demo purposes, return mock data in case of network errors
      const url = error.config?.url || '';
      if (url.includes('/api/')) {
        console.log('Network error - returning mock data for:', url);
        return Promise.resolve({ data: createMockData(url) });
      }
      
      error.message = 'Network error: Could not connect to the backend server. Please check your connection.';
    } else {
      // Error in setting up the request
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Export all API modules
export {
  analysisApi,
  buildingApi,
  forecastApi,
  recommendationApi,
  weatherApi
};

// Export default object for backwards compatibility
export default {
  building: buildingApi,
  analysis: analysisApi,
  recommendation: recommendationApi,
  forecasting: forecastApi,
  weather: weatherApi,
}; 