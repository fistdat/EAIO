import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

/**
 * API endpoint to test the building API and get status of buildings
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only handle GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Call the backend API directly
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await axios.get(`${apiUrl}/api/buildings/`);
    
    const data = response.data;
    
    if (data.total > 0) {
      return res.status(200).json({
        status: 'success',
        message: `Found ${data.total} buildings in the system.`,
        buildings: data.items
      });
    } else {
      return res.status(404).json({
        status: 'error',
        message: 'No buildings available. Please add buildings to your system.',
        buildings: []
      });
    }
  } catch (error) {
    console.error('Error in test-building-api endpoint:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to connect to the building API. Please check that the backend is running.'
    });
  }
} 