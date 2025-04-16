// Custom interface definitions
interface ApiRequest {
  method: string;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: any) => void;
}

import { testBuildingApi } from '../../utils/testApi';

/**
 * API endpoint to test the building API and get status of buildings
 */
export default async function handler(
  req: ApiRequest,
  res: ApiResponse
) {
  // Only handle GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Call the utility function to test the API
    const result = await testBuildingApi();
    
    // Return results
    return res.status(result.status === 'success' ? 200 : 404).json(result);
  } catch (error) {
    console.error('Error in test-building-api endpoint:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error checking building API'
    });
  }
} 