// Forecasting API functions for the Energy AI Optimizer frontend
// Import from the main API client

import { apiClient, getApiPath } from '../api';

// Define the Forecasting API functions
const forecastApi = {
  // Get energy consumption forecast for a building
  getForecast: async (
    buildingId: string, 
    days: number = 7,
    metric: string = 'electricity'
  ) => {
    try {
      const params = new URLSearchParams();
      params.append('days', days.toString());
      params.append('consumption_type', metric);

      const response = await apiClient.get(
        `/api/forecasting/building/${buildingId}`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching forecast for building ${buildingId}:`, error);
      throw error;
    }
  },
  
  // Get forecast scenarios for a building
  getScenarios: async (
    buildingId: string,
    days: number = 7,
    metric: string = 'electricity'
  ) => {
    try {
      const params = new URLSearchParams();
      params.append('days', days.toString());
      params.append('consumption_type', metric);

      const response = await apiClient.get(
        `/api/forecasting/scenarios/${buildingId}`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching scenarios for building ${buildingId}:`, error);
      throw error;
    }
  },
};

export default forecastApi; 