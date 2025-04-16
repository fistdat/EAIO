// Weather API service for the Energy AI Optimizer frontend
import axios from 'axios';
import { apiConfig, createMockDelay, formatApiPath } from '../../utils/apiConfig';

// Weather data interfaces
export interface WeatherData {
  timestamp: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  solarRadiation: number;
  location: string;
}

// Use environment variable to determine if we should use mock data
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

// Generate random weather data for testing
const generateMockWeatherData = (
  startDate: Date, 
  endDate: Date, 
  location: string
): WeatherData[] => {
  const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  const weatherData: WeatherData[] = [];
  
  for (let i = 0; i < dayDiff; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Generate hourly data
    for (let hour = 0; hour < 24; hour++) {
      const hourDate = new Date(date);
      hourDate.setHours(hour);
      
      weatherData.push({
        timestamp: hourDate.toISOString(),
        temperature: 20 + Math.random() * 15, // 20-35°C
        humidity: 50 + Math.random() * 40, // 50-90%
        precipitation: Math.random() < 0.7 ? 0 : Math.random() * 10, // 70% chance of no rain
        windSpeed: Math.random() * 10, // 0-10 m/s
        solarRadiation: hour >= 6 && hour <= 18 ? 200 + Math.random() * 600 : 0, // Daylight hours
        location
      });
    }
  }
  
  return weatherData;
};

// Sử dụng trực tiếp từ apiConfig thay vì từ index để tránh circular dependency
const apiClient = axios.create({
  baseURL: apiConfig.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// Helper function để tránh circular dependency 
const getApiPath = (path: string): string => {
  return formatApiPath(path);
};

// Get weather data for a specific location and date range
export const getWeatherData = async (
  location: string,
  startDate: Date,
  endDate: Date
): Promise<WeatherData[]> => {
  try {
    if (USE_MOCK_DATA) {
      // Use mock data for development
      await new Promise(resolve => setTimeout(resolve, 1000));
      return generateMockWeatherData(startDate, endDate, location);
    }
    
    // Fetch real data from PostgreSQL backend
    const response = await apiClient.get(getApiPath('/weather'), {
      params: {
        location,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      }
    });
    
    // Transform API response to match the WeatherData interface
    return response.data.map((item: any) => ({
      timestamp: item.timestamp,
      temperature: item.temperature || 0,
      humidity: item.humidity || 0,
      precipitation: item.precipitation || 0,
      windSpeed: item.wind_speed || 0,
      solarRadiation: item.solar_radiation || 0,
      location: item.location || location
    }));
  } catch (error) {
    console.error(`Error fetching weather data for ${location}:`, error);
    // Fallback to mock data if API fails
    return generateMockWeatherData(startDate, endDate, location);
  }
};

// Get weather forecast for a specific location
export const getWeatherForecast = async (
  location: string,
  days: number = 7
): Promise<WeatherData[]> => {
  try {
    if (USE_MOCK_DATA) {
      // Use mock data for development
      await new Promise(resolve => setTimeout(resolve, 800));
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);
      return generateMockWeatherData(startDate, endDate, location);
    }
    
    // Fetch real data from PostgreSQL backend
    const response = await apiClient.get(getApiPath('/weather/forecast'), {
      params: {
        location,
        days
      }
    });
    
    // Transform API response to match the WeatherData interface
    return response.data.map((item: any) => ({
      timestamp: item.timestamp,
      temperature: item.temperature || 0,
      humidity: item.humidity || 0,
      precipitation: item.precipitation || 0,
      windSpeed: item.wind_speed || 0,
      solarRadiation: item.solar_radiation || 0,
      location: item.location || location
    }));
  } catch (error) {
    console.error(`Error fetching weather forecast for ${location}:`, error);
    // Fallback to mock data if API fails
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    return generateMockWeatherData(startDate, endDate, location);
  }
};

// Default export for compatibility with different import styles
const weatherApi = {
  getWeatherData,
  getWeatherForecast
};

export default weatherApi; 