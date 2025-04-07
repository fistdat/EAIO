// Building API functions for the Energy AI Optimizer frontend
// Import from the main API client

import { apiClient, getApiPath } from '../api';

// Định nghĩa interface cho đối tượng building từ API
interface BuildingApiResponse {
  id?: string;
  name?: string;
  type?: string;
  location?: any;
  area?: number;
  size?: number;
  floors?: number;
  year_built?: number;
  available_meters?: string[];
  primary_use?: string;
  occupancy_hours?: string;
  [key: string]: any; // Cho phép các trường khác
}

// Generate mock building data
const generateMockBuildings = () => {
  return [
    {
      id: "bldg-001",
      name: "Office Tower Alpha",
      type: "office",
      location: {
        city: "Boston",
        state: "MA",
        country: "USA",
        latitude: 42.3601,
        longitude: -71.0589
      },
      size: 25000,
      floors: 15,
      built_year: 2010,
      energy_sources: ["electricity", "natural_gas"],
      primary_use: "commercial",
      occupancy_hours: "Mon-Fri, 8:00-18:00"
    },
    {
      id: "bldg-002",
      name: "Medical Center Beta",
      type: "healthcare",
      location: {
        city: "San Francisco",
        state: "CA",
        country: "USA",
        latitude: 37.7749,
        longitude: -122.4194
      },
      size: 42000,
      floors: 8,
      built_year: 2015,
      energy_sources: ["electricity", "natural_gas", "solar"],
      primary_use: "healthcare",
      occupancy_hours: "24/7"
    },
    {
      id: "bldg-003",
      name: "Residential Heights",
      type: "residential",
      location: {
        city: "Chicago",
        state: "IL",
        country: "USA",
        latitude: 41.8781,
        longitude: -87.6298
      },
      size: 18000,
      floors: 12,
      built_year: 2018,
      energy_sources: ["electricity"],
      primary_use: "residential",
      occupancy_hours: "24/7"
    },
    {
      id: "bldg-004",
      name: "Education Campus",
      type: "education",
      location: {
        city: "Austin",
        state: "TX",
        country: "USA",
        latitude: 30.2672,
        longitude: -97.7431
      },
      size: 35000,
      floors: 4,
      built_year: 2008,
      energy_sources: ["electricity", "natural_gas", "solar"],
      primary_use: "education",
      occupancy_hours: "Mon-Fri, 7:00-22:00"
    },
    {
      id: "bldg-005",
      name: "Retail Plaza",
      type: "retail",
      location: {
        city: "Seattle",
        state: "WA",
        country: "USA",
        latitude: 47.6062,
        longitude: -122.3321
      },
      size: 15000,
      floors: 2,
      built_year: 2012,
      energy_sources: ["electricity"],
      primary_use: "commercial",
      occupancy_hours: "Mon-Sun, 10:00-21:00"
    }
  ];
};

// Define the Building API functions
const buildingApi = {
  // Get all buildings
  getBuildings: async () => {
    try {
      // Thử gọi API v1 trước
      const response = await apiClient.get('/api/v1/buildings/');
      
      // Kiểm tra dữ liệu nhận về
      console.log('Buildings data from API:', response.data);
      
      // Nếu response.data là một object có thuộc tính là array thì lấy từ đó
      let buildings = null;
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          buildings = response.data;
        } else if (Array.isArray(response.data.buildings)) {
          buildings = response.data.buildings;
        } else if (Array.isArray(response.data.data)) {
          buildings = response.data.data;
        }
      }
      
      // Kiểm tra nếu không có dữ liệu
      if (!buildings || buildings.length === 0) {
        console.log('Không tìm thấy dữ liệu tòa nhà từ API, trả về dữ liệu giả');
        return generateMockBuildings();
      }
      
      // Chuẩn hóa dữ liệu từ API
      const formattedBuildings = buildings.map((building: BuildingApiResponse) => {
        // Định dạng location thành string
        let locationStr = '';
        if (typeof building.location === 'object' && building.location) {
          const loc = building.location;
          const parts = [];
          if (loc.city) parts.push(loc.city);
          if (loc.state) parts.push(loc.state);
          if (loc.country) parts.push(loc.country);
          locationStr = parts.join(', ');
        } else if (typeof building.location === 'string') {
          locationStr = building.location;
        }
        
        // Đảm bảo cấu trúc dữ liệu phù hợp với frontend
        return {
          id: building.id || '',
          name: building.name || '',
          type: building.type || '',
          location: locationStr,
          size: building.area || building.size || 0,
          floors: building.floors || null,
          built_year: building.year_built || null,
          energy_sources: building.available_meters || [],
          primary_use: building.primary_use || '',
          occupancy_hours: building.occupancy_hours || ''
        };
      });
      
      return formattedBuildings;
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu tòa nhà:', error);
      console.log('Trả về dữ liệu giả do lỗi');
      return generateMockBuildings();
    }
  },

  // Get a specific building
  getBuilding: async (buildingId: string) => {
    try {
      // Thử gọi API v1 trước
      const response = await apiClient.get(`/api/v1/buildings/${buildingId}`);
      
      // Chuẩn hóa dữ liệu từ API
      const building: BuildingApiResponse = response.data;
      
      // Định dạng location thành string
      let locationStr = '';
      if (typeof building.location === 'object' && building.location) {
        const loc = building.location;
        const parts = [];
        if (loc.city) parts.push(loc.city);
        if (loc.state) parts.push(loc.state);
        if (loc.country) parts.push(loc.country);
        locationStr = parts.join(', ');
      } else if (typeof building.location === 'string') {
        locationStr = building.location;
      }
      
      return {
        id: building.id || '',
        name: building.name || '',
        type: building.type || '',
        location: locationStr,
        size: building.area || building.size || 0,
        floors: building.floors || null,
        built_year: building.year_built || null,
        energy_sources: building.available_meters || [],
        primary_use: building.primary_use || '',
        occupancy_hours: building.occupancy_hours || ''
      };
    } catch (error) {
      console.error(`Lỗi khi lấy thông tin tòa nhà ${buildingId}:`, error);
      
      // Trả về dữ liệu giả cho tòa nhà có ID tương ứng
      const mockBuildings = generateMockBuildings();
      const mockBuilding = mockBuildings.find(b => b.id === buildingId);
      
      // Nếu ID khớp với một trong các dữ liệu giả, trả về dữ liệu đó, nếu không trả về dữ liệu giả đầu tiên
      return mockBuilding || mockBuildings[0];
    }
  },

  // Get building consumption data
  getBuildingConsumption: async (
    buildingId: string,
    metric = 'electricity',
    startDate?: string,
    endDate?: string,
    interval: string = 'daily'
  ) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('metric', metric);
      params.append('interval', interval);

      const response = await apiClient.get(
        `/api/buildings/${buildingId}/consumption`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching consumption data for building ${buildingId}:`, error);
      
      // Generate mock consumption data
      return generateMockConsumptionData(buildingId, metric, startDate, endDate, interval);
    }
  },
};

// Generate mock consumption data for a building
function generateMockConsumptionData(
  buildingId: string, 
  metric: string, 
  startDate?: string, 
  endDate?: string, 
  interval: string = 'daily'
) {
  // Set default date range if not provided
  const end = endDate ? new Date(endDate) : new Date();
  let start;
  
  if (startDate) {
    start = new Date(startDate);
  } else {
    // Default: last 30 days
    start = new Date();
    start.setDate(start.getDate() - 30);
  }
  
  const data = [];
  const currentDate = new Date(start);
  
  // Generate data points based on interval
  while (currentDate <= end) {
    let value;
    
    // Different patterns for different metrics
    switch (metric) {
      case 'electricity':
        // Weekday/weekend pattern
        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
        value = isWeekend ? 
          Math.round(50 + Math.random() * 20) : 
          Math.round(80 + Math.random() * 30);
        break;
        
      case 'water':
        value = Math.round(40 + Math.random() * 25);
        break;
        
      case 'gas':
        // Higher in winter months (assuming Northern Hemisphere)
        const month = currentDate.getMonth();
        const isWinter = month <= 1 || month >= 10; // Nov-Feb
        value = isWinter ?
          Math.round(70 + Math.random() * 40) :
          Math.round(30 + Math.random() * 20);
        break;
        
      default:
        value = Math.round(50 + Math.random() * 50);
    }
    
    data.push({
      timestamp: currentDate.toISOString(),
      value: value,
      unit: metric === 'electricity' ? 'kWh' : metric === 'water' ? 'gal' : 'm³',
      building_id: buildingId,
      metric: metric
    });
    
    // Increment date based on interval
    if (interval === 'hourly') {
      currentDate.setHours(currentDate.getHours() + 1);
    } else if (interval === 'weekly') {
      currentDate.setDate(currentDate.getDate() + 7);
    } else if (interval === 'monthly') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else {
      // Default: daily
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  return {
    building_id: buildingId,
    metric: metric,
    interval: interval,
    unit: metric === 'electricity' ? 'kWh' : metric === 'water' ? 'gal' : 'm³',
    data: data
  };
}

export default buildingApi; 