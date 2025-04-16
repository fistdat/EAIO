/**
 * Utility function to test the building API and verify that buildings are available
 */
import axios from 'axios';

interface BuildingApiResponse {
  items: any[];
  total: number;
  error?: string;
}

/**
 * Test the building API to check if buildings are available
 * @returns Object with status, message, and buildings if available
 */
export const testBuildingApi = async (): Promise<{
  status: 'success' | 'error';
  message: string;
  buildings?: any[];
}> => {
  try {
    const response = await axios.get<BuildingApiResponse>(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/buildings/`
    );
    
    if (response.data.total > 0) {
      return {
        status: 'success',
        message: `Found ${response.data.total} buildings in the system.`,
        buildings: response.data.items
      };
    } else {
      return {
        status: 'error',
        message: 'No buildings available. Please add buildings to your system.',
        buildings: []
      };
    }
  } catch (error) {
    console.error('Error testing building API:', error);
    return {
      status: 'error',
      message: 'Failed to connect to the building API. Please check that the backend is running.'
    };
  }
}; 