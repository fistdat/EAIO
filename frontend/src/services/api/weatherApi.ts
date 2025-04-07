// Weather API functions for the Energy AI Optimizer frontend
// Import from the main API client

import { apiClient, getApiPath } from '../api';

// Define the Weather API functions
const weatherApi = {
  // Get weather data for a location
  getWeather: async (location: string) => {
    try {
      const response = await apiClient.get(`/api/weather/${location}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching weather for ${location}:`, error);
      throw error;
    }
  },

  // Get weather impact analysis
  getWeatherImpact: async (buildingId: string) => {
    try {
      const response = await apiClient.get(`/api/weather/impact/${buildingId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching weather impact for building ${buildingId}:`, error);
      throw error;
    }
  },
};

export default weatherApi; 