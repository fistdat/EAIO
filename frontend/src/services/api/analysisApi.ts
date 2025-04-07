// Analysis API functions for the Energy AI Optimizer frontend
// Import from the main API client

import { apiClient, getApiPath } from '../api';

// Define the Analysis API functions
const analysisApi = {
  // Analyze building data with custom parameters
  analyzeBuilding: async (
    buildingId: string, 
    analysisType: string = 'consumption_patterns', 
    metric: string = 'electricity',
    startDate?: string, 
    endDate?: string
  ) => {
    try {
      const requestData = {
        building_id: buildingId,
        analysis_type: analysisType,
        metric: metric,
        start_date: startDate,
        end_date: endDate
      };

      const response = await apiClient.post('/api/analysis/', requestData);
      return response.data;
    } catch (error) {
      console.error(`Error analyzing building data for ${buildingId}:`, error);
      throw error;
    }
  },

  // Get anomalies for a building
  getAnomalies: async (
    buildingId: string, 
    metric: string = 'electricity',
    startDate?: string, 
    endDate?: string
  ) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('metric', metric);

      const response = await apiClient.get(
        `/api/analysis/anomalies/${buildingId}`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching anomalies for building ${buildingId}:`, error);
      throw error;
    }
  },

  // Get energy patterns for a building
  getPatterns: async (
    buildingId: string,
    metric: string = 'electricity',
    startDate?: string,
    endDate?: string
  ) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('metric', metric);

      const response = await apiClient.get(
        `/api/analysis/patterns/${buildingId}`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching patterns for building ${buildingId}:`, error);
      throw error;
    }
  },

  // Get weather correlation for a building
  getWeatherCorrelation: async (
    buildingId: string,
    metric: string = 'electricity',
    startDate?: string,
    endDate?: string
  ) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('metric', metric);

      const response = await apiClient.get(
        `/api/analysis/weather-correlation/${buildingId}`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching weather correlation for building ${buildingId}:`, error);
      throw error;
    }
  },
};

export default analysisApi; 