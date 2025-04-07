// Recommendation API functions for the Energy AI Optimizer frontend
// Import from the main API client

import { apiClient, getApiPath } from '../api';

// Define the Recommendation API functions
const recommendationApi = {
  // Get all recommendations
  getAllRecommendations: async (buildingId?: string, recType?: string) => {
    try {
      const params = new URLSearchParams();
      if (buildingId) params.append('building_id', buildingId);
      if (recType) params.append('rec_type', recType);

      const response = await apiClient.get('/api/recommendations/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  },

  // Get a specific recommendation
  getRecommendation: async (recommendationId: string) => {
    try {
      const response = await apiClient.get(`/api/recommendations/${recommendationId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching recommendation ${recommendationId}:`, error);
      throw error;
    }
  },
  
  // Get recommendations for a building
  getBuildingRecommendations: async (
    buildingId: string,
    recType?: string
  ) => {
    try {
      const params = new URLSearchParams();
      if (recType) params.append('rec_type', recType);

      const response = await apiClient.get(
        `/api/recommendations/building/${buildingId}`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching recommendations for building ${buildingId}:`, error);
      throw error;
    }
  },

  // Generate new recommendations for a building
  generateRecommendations: async (
    buildingId: string,
    energyType: string = 'electricity',
    startDate?: string,
    endDate?: string,
    analysisData?: any
  ) => {
    try {
      const requestData = {
        building_id: buildingId,
        energy_type: energyType,
        start_date: startDate,
        end_date: endDate,
        analysis_data: analysisData
      };

      const response = await apiClient.post('/api/recommendations/generate', requestData);
      return response.data;
    } catch (error) {
      console.error(`Error generating recommendations for building ${buildingId}:`, error);
      throw error;
    }
  },
};

export default recommendationApi; 