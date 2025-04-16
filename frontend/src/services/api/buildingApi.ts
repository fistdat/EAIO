// Building API service for the Energy AI Optimizer frontend
import axios from 'axios';
import { apiConfig, createMockDelay, formatApiPath } from '../../utils/apiConfig';
import { generateMockBuildings } from '../../utils/mockData';

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

// Building interfaces
export interface Building {
  id: string;
  name: string;
  location: string;
  type: string;
  area: number;
  floors: number;
  occupancy: number;
  constructionYear: number;
}

export interface ConsumptionData {
  timestamp: string;
  electricity: number;
  water: number;
  gas: number;
}

export interface ConsumptionResponse {
  buildingId: string;
  startDate: Date;
  endDate: Date;
  consumption: ConsumptionData[];
}

// Use environment variable to determine if we should use mock data
const USE_MOCK_DATA = apiConfig.useMockData; // Read from central configuration

// Get list of all buildings
export const getBuildingList = async (): Promise<Building[]> => {
  try {
    if (USE_MOCK_DATA) {
      // Use mock data for development
      await new Promise(resolve => setTimeout(resolve, 800));
      return generateMockBuildings(20);
    }
    
    // Fetch real data from backend
    const response = await apiClient.get(getApiPath('/buildings/'));
    
    // Check if response has expected structure (items array)
    const buildings = response.data.items || response.data;
    
    // If no buildings returned, fall back to mock data
    if (!buildings || buildings.length === 0) {
      console.warn('No buildings returned from API, falling back to mock data');
      return generateMockBuildings(10);
    }
    
    // Transform API response to match the Building interface
    return buildings.map((item: any) => ({
      id: item.id || item.building_id,
      name: item.name || item.building_name,
      location: item.location || 'Unknown',
      type: item.type || item.building_type || 'Office',
      area: item.area || item.building_area || item.size || 0,
      floors: item.floors || item.num_floors || 1,
      occupancy: item.occupancy || 0,
      constructionYear: item.construction_year || item.year_built || 2000
    }));
  } catch (error) {
    console.error('Error fetching buildings:', error);
    console.warn('Falling back to mock data due to API error');
    // Fallback to mock data if API fails
    return generateMockBuildings(10);
  }
};

// Get details for a specific building
export const getBuildingById = async (buildingId: string): Promise<Building> => {
  try {
    if (USE_MOCK_DATA) {
      // Use mock data for development
      await new Promise(resolve => setTimeout(resolve, 500));
      const buildings = generateMockBuildings(20);
      const building = buildings.find((b: Building) => b.id === buildingId);
      
      if (!building) {
        throw new Error(`Building with ID ${buildingId} not found`);
      }
      
      return building;
    }
    
    // Fetch real data from backend
    const response = await apiClient.get(getApiPath(`/buildings/${buildingId}`));
    
    // Transform API response to match the Building interface
    const item = response.data;
    return {
      id: item.id || item.building_id,
      name: item.name || item.building_name,
      location: item.location || 'Unknown',
      type: item.type || item.building_type || 'Office',
      area: item.area || item.building_area || item.size || 0,
      floors: item.floors || item.num_floors || 1,
      occupancy: item.occupancy || 0,
      constructionYear: item.construction_year || item.year_built || 2000
    };
  } catch (error) {
    console.error(`Error fetching building with ID ${buildingId}:`, error);
    // If API fails and we were using real data, throw the error
    if (!USE_MOCK_DATA) {
      throw error;
    }
    
    // Otherwise create a mock building with the requested ID
    return {
      id: buildingId,
      name: 'Mock Building',
      location: 'Mock Location, Vietnam',
      type: 'Office',
      area: 5000,
      floors: 10,
      occupancy: 80,
      constructionYear: 2010
    };
  }
};

// Get consumption data for a specific building in a date range
export const getBuildingConsumptionData = async (
  buildingId: string, 
  startDate: Date, 
  endDate: Date
): Promise<ConsumptionResponse> => {
  try {
    if (USE_MOCK_DATA) {
      // Use mock data for development
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Generate mock consumption data
      const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
      const consumptionData: ConsumptionData[] = [];
      
      for (let i = 0; i < dayDiff; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        consumptionData.push({
          timestamp: date.toISOString(),
          electricity: 20 + Math.random() * 15, // Random values between 20-35
          water: 5 + Math.random() * 5, // Random values between 5-10
          gas: 2 + Math.random() * 4 // Random values between 2-6
        });
      }
      
      return {
        buildingId,
        startDate,
        endDate,
        consumption: consumptionData
      };
    }
    
    // Fetch electricity, water, and gas consumption data
    const electricityPromise = apiClient.get(getApiPath(`/buildings/${buildingId}/consumption`), {
      params: {
        metric: 'electricity',
        interval: 'daily',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      }
    });
    
    const waterPromise = apiClient.get(getApiPath(`/buildings/${buildingId}/consumption`), {
      params: {
        metric: 'water',
        interval: 'daily',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      }
    });
    
    const gasPromise = apiClient.get(getApiPath(`/buildings/${buildingId}/consumption`), {
      params: {
        metric: 'gas',
        interval: 'daily',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      }
    });
    
    // Wait for all requests to complete
    const [electricityResponse, waterResponse, gasResponse] = await Promise.all([
      electricityPromise, waterPromise, gasPromise
    ]);
    
    // Get data from responses and log some debugging info
    const electricityData = electricityResponse.data.data || [];
    const waterData = waterResponse.data.data || [];
    const gasData = gasResponse.data.data || [];
    
    console.log(`Received data - Electricity: ${electricityData.length} points, Water: ${waterData.length} points, Gas: ${gasData.length} points`);
    
    // If no data points were returned for all metrics, use mock data
    if (electricityData.length === 0 && waterData.length === 0 && gasData.length === 0) {
      console.warn(`No consumption data returned for building ${buildingId}, falling back to mock data`);
      
      // Call the mock data generation logic
      return await getBuildingConsumptionData(buildingId, startDate, endDate);
    }
    
    // Create a map of timestamp to consumption data
    const consumptionMap = new Map<string, ConsumptionData>();
    
    // Process electricity data
    electricityData.forEach((item: any) => {
      const timestamp = item.timestamp;
      if (!consumptionMap.has(timestamp)) {
        consumptionMap.set(timestamp, {
          timestamp,
          electricity: 0,
          water: 0,
          gas: 0
        });
      }
      consumptionMap.get(timestamp)!.electricity = item.value || 0;
    });
    
    // Process water data
    waterData.forEach((item: any) => {
      const timestamp = item.timestamp;
      if (!consumptionMap.has(timestamp)) {
        consumptionMap.set(timestamp, {
          timestamp,
          electricity: 0,
          water: 0,
          gas: 0
        });
      }
      consumptionMap.get(timestamp)!.water = item.value || 0;
    });
    
    // Process gas data
    gasData.forEach((item: any) => {
      const timestamp = item.timestamp;
      if (!consumptionMap.has(timestamp)) {
        consumptionMap.set(timestamp, {
          timestamp,
          electricity: 0,
          water: 0,
          gas: 0
        });
      }
      consumptionMap.get(timestamp)!.gas = item.value || 0;
    });
    
    // Convert map to array and sort by timestamp
    const consumptionData = Array.from(consumptionMap.values())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    return {
      buildingId,
      startDate,
      endDate,
      consumption: consumptionData
    };
  } catch (error) {
    console.error(`Error fetching consumption data for building ${buildingId}:`, error);
    
    // If API fails, fallback to mock data
    const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    const consumptionData: ConsumptionData[] = [];
    
    for (let i = 0; i < dayDiff; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      consumptionData.push({
        timestamp: date.toISOString(),
        electricity: 20 + Math.random() * 15,
        water: 5 + Math.random() * 5,
        gas: 2 + Math.random() * 4
      });
    }
    
    return {
      buildingId,
      startDate,
      endDate,
      consumption: consumptionData
    };
  }
};

// Alias for getBuildingList for compatibility with codebase references
export const getBuildings = getBuildingList;

// Alias for getBuildingConsumptionData for compatibility with codebase references
export const getBuildingConsumption = async (
  buildingId: string,
  metric: string,
  startDate?: Date,
  endDate?: Date
) => {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();
  
  const result = await getBuildingConsumptionData(buildingId, start, end);
  
  // Filter by metric if specified
  if (metric) {
    return {
      data: result.consumption.map(item => ({
        timestamp: item.timestamp,
        value: item[metric as keyof typeof item] || 0
      }))
    };
  }
  
  return result;
};

// Get portfolio summary for executive dashboard
export const getPortfolioSummary = async () => {
  try {
    if (apiConfig.useMockData) {
      await createMockDelay();
      
      // Generate mock portfolio summary
      const buildings = await getBuildingList();
      
      return {
        totalBuildings: buildings.length,
        totalArea: buildings.reduce((sum, b) => sum + b.area, 0),
        energyScore: Math.round(65 + Math.random() * 20),
        monthlyCost: Math.round(50000 + Math.random() * 20000),
        yearToDateSavings: Math.round(120000 + Math.random() * 50000),
        activeAlerts: Math.round(Math.random() * 10),
        recentChanges: {
          energyUse: Math.round((Math.random() * 10 - 5) * 10) / 10,
          cost: Math.round((Math.random() * 8 - 3) * 10) / 10
        }
      };
    }
    
    // Fetch real data
    const response = await apiClient.get(getApiPath('/buildings/portfolio/summary'));
    return response.data;
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    return null;
  }
};

// Get building type distribution for portfolio analytics
export const getBuildingTypeDistribution = async () => {
  try {
    if (apiConfig.useMockData) {
      await createMockDelay();
      
      // Generate mock building type distribution
      const buildingTypes = [
        { type: 'Office', count: 12, area: 120000 },
        { type: 'Retail', count: 8, area: 60000 },
        { type: 'Healthcare', count: 5, area: 80000 },
        { type: 'Education', count: 7, area: 95000 },
        { type: 'Industrial', count: 3, area: 70000 }
      ];
      
      return { types: buildingTypes };
    }
    
    // Fetch real data
    const response = await apiClient.get(getApiPath('/buildings/types/distribution'));
      return response.data;
    } catch (error) {
    console.error('Error fetching building type distribution:', error);
    return { types: [] };
  }
};

// Get maintenance alerts for facility managers
export const getBuildingMaintenanceAlerts = async (buildingId: string) => {
  try {
    if (apiConfig.useMockData) {
      await createMockDelay();
      
      // Generate mock maintenance alerts
      const alertTypes = [
        'Filter Replacement Due',
        'Equipment Inspection Required',
        'Calibration Needed',
        'Scheduled Maintenance',
        'Performance Degradation Detected'
      ];
      
      const systemTypes = [
        'HVAC', 'Lighting', 'Water', 'Electrical', 'Fire Safety'
      ];
      
      const priorities = ['low', 'medium', 'high', 'critical'];
      
      const alertCount = Math.floor(Math.random() * 8) + 1;
      const alerts = Array.from({ length: alertCount }, (_, i) => ({
        id: `alert-${buildingId}-${i}`,
        buildingId,
        type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        system: systemTypes[Math.floor(Math.random() * systemTypes.length)],
        description: `Maintenance alert for building ${buildingId}`,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        dueDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      }));
      
      return { alerts };
    }
    
    // Fetch real data
    const response = await apiClient.get(getApiPath(`/buildings/${buildingId}/maintenance/alerts`));
    return response.data;
  } catch (error) {
    console.error('Error fetching maintenance alerts:', error);
    return { alerts: [] };
  }
};

// Get building system status for facility managers
export const getBuildingSystemStatus = async (buildingId: string) => {
  try {
    if (apiConfig.useMockData) {
      await createMockDelay();
      
      // Generate mock system status
      return {
        hvac: {
          status: ['operational', 'needs_attention', 'critical'][Math.floor(Math.random() * 3)],
          efficiency: Math.round(70 + Math.random() * 25),
          lastMaintenance: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
          nextMaintenance: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
        },
        lighting: {
          status: ['operational', 'needs_attention', 'critical'][Math.floor(Math.random() * 3)],
          efficiency: Math.round(70 + Math.random() * 25),
          lastMaintenance: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
          nextMaintenance: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
        },
        water: {
          status: ['operational', 'needs_attention', 'critical'][Math.floor(Math.random() * 3)],
          efficiency: Math.round(70 + Math.random() * 25),
          lastMaintenance: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
          nextMaintenance: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
        }
      };
    }
    
    // Fetch real data
    const response = await apiClient.get(getApiPath(`/buildings/${buildingId}/systems/status`));
    return response.data;
  } catch (error) {
    console.error('Error fetching building system status:', error);
    return {
      hvac: { status: 'unknown', efficiency: 0 },
      lighting: { status: 'unknown', efficiency: 0 },
      water: { status: 'unknown', efficiency: 0 }
    };
  }
};

// Default export
const buildingApi = {
  getBuildingList,
  getBuildingById,
  getBuildingConsumptionData,
  getBuildings,
  getBuildingConsumption,
  getPortfolioSummary,
  getBuildingTypeDistribution,
  getBuildingMaintenanceAlerts,
  getBuildingSystemStatus
};

export default buildingApi;