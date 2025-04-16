import { addDays, addHours, format, startOfDay, subYears } from 'date-fns';

/**
 * Generates mock forecast data for demonstration purposes
 * @param days Number of days to forecast
 * @returns Mock forecast data
 */
export const generateMockForecastData = (days: number) => {
  const data = [];
  const now = new Date();
  const startDate = startOfDay(now);
  
  // Generate hourly data for the specified number of days
  for (let day = 0; day < days; day++) {
    const currentDate = addDays(startDate, day);
    
    // Create hourly values for this day with a daily pattern
    for (let hour = 0; hour < 24; hour++) {
      const timestamp = addHours(currentDate, hour);
      
      // Create a realistic daily usage pattern with morning and afternoon peaks
      let value = 0;
      if (hour >= 8 && hour <= 10) {
        // Morning peak
        value = 75 + Math.random() * 25;
      } else if (hour >= 13 && hour <= 16) {
        // Afternoon peak
        value = 85 + Math.random() * 15;
      } else if (hour >= 6 && hour <= 19) {
        // Working hours
        value = 50 + Math.random() * 30;
      } else {
        // Night/early morning
        value = 20 + Math.random() * 15;
      }
      
      // Add random variation
      const randomFactor = 0.9 + Math.random() * 0.2;
      value = value * randomFactor;
      
      // Add weekend variation (lower usage on weekends)
      const dayOfWeek = timestamp.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        value = value * 0.6;
      }
      
      data.push({
        timestamp: format(timestamp, "yyyy-MM-dd'T'HH:mm:ss"),
        value: Math.round(value * 10) / 10
      });
    }
  }
  
  return data;
};

/**
 * Generates mock scenario data for comparison
 * @param days Number of days to forecast
 * @returns Mock scenario data
 */
export const generateMockScenarioData = (days: number) => {
  const dates = [];
  const baseData = generateMockForecastData(days);
  const timestamps = baseData.map(item => item.timestamp);
  
  // Generate dates for the x-axis
  for (let i = 0; i < days; i++) {
    const date = addDays(new Date(), i);
    dates.push(format(date, 'yyyy-MM-dd'));
  }
  
  // Create three different scenarios
  return {
    dates: timestamps,
    scenarios: {
      baseline: {
        name: 'Baseline',
        values: baseData.map(item => item.value),
        color: '#4338ca'
      },
      efficiency: {
        name: 'Energy Efficiency Upgrades',
        values: baseData.map(item => item.value * 0.85), // 15% reduction
        color: '#16a34a'
      },
      equipment: {
        name: 'New Equipment Schedule',
        values: baseData.map(item => {
          const date = new Date(item.timestamp);
          const hour = date.getHours();
          
          // More aggressive night setback
          if (hour >= 20 || hour <= 5) {
            return item.value * 0.7;
          }
          
          // Smoother daytime usage
          return item.value * 0.9;
        }),
        color: '#ea580c'
      }
    }
  };
};

/**
 * Generates a list of mock building data
 * @param count Number of buildings to generate
 * @returns Array of mock building objects
 */
export const generateMockBuildings = (count: number) => {
  const buildingTypes = ['Office', 'Retail', 'Industrial', 'Residential', 'Mixed Use', 'Healthcare', 'Education', 'Warehouse', 'Hotel'];
  const locationPrefixes = ['Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Can Tho', 'Hai Phong', 'Nha Trang', 'Hue', 'Vinh', 'Quy Nhon'];
  const locationSuffixes = ['District', 'Center', 'Downtown', 'Business Park', 'Industrial Zone', 'Tech Park'];
  const namePrefix = ['Central', 'Golden', 'Emerald', 'Pacific', 'Eastern', 'Western', 'Diamond', 'Azure', 'Evergreen', 'Horizon'];
  const nameSuffix = ['Tower', 'Plaza', 'Building', 'Center', 'Square', 'Place', 'Complex', 'Hub', 'Heights'];
  
  return Array.from({ length: count }, (_, index) => {
    const id = `BLDG${(index + 1).toString().padStart(3, '0')}`;
    const typeIndex = Math.floor(Math.random() * buildingTypes.length);
    const locationPrefixIndex = Math.floor(Math.random() * locationPrefixes.length);
    const locationSuffixIndex = Math.floor(Math.random() * locationSuffixes.length);
    const namePrefixIndex = Math.floor(Math.random() * namePrefix.length);
    const nameSuffixIndex = Math.floor(Math.random() * nameSuffix.length);
    
    // Generate a sensible floor count based on building type
    let floorCount = 1;
    switch (buildingTypes[typeIndex]) {
      case 'Office':
      case 'Residential':
        floorCount = 5 + Math.floor(Math.random() * 30); // 5-35 floors
        break;
      case 'Retail':
        floorCount = 1 + Math.floor(Math.random() * 4); // 1-5 floors
        break;
      case 'Industrial':
      case 'Warehouse':
        floorCount = 1 + Math.floor(Math.random() * 2); // 1-3 floors
        break;
      default:
        floorCount = 2 + Math.floor(Math.random() * 8); // 2-10 floors
    }
    
    // Generate a construction year (between 1980 and 5 years ago)
    const currentYear = new Date().getFullYear();
    const constructionYear = 1980 + Math.floor(Math.random() * (currentYear - 1985));
    
    // Generate a realistic area based on building type and floors
    let baseAreaPerFloor = 0;
    switch (buildingTypes[typeIndex]) {
      case 'Office':
        baseAreaPerFloor = 500 + Math.floor(Math.random() * 1500); // 500-2000m² per floor
        break;
      case 'Retail':
        baseAreaPerFloor = 1000 + Math.floor(Math.random() * 4000); // 1000-5000m² per floor
        break;
      case 'Industrial':
      case 'Warehouse':
        baseAreaPerFloor = 2000 + Math.floor(Math.random() * 8000); // 2000-10000m² per floor
        break;
      case 'Residential':
        baseAreaPerFloor = 400 + Math.floor(Math.random() * 600); // 400-1000m² per floor
        break;
      default:
        baseAreaPerFloor = 600 + Math.floor(Math.random() * 1400); // 600-2000m² per floor
    }
    
    const totalArea = baseAreaPerFloor * floorCount;
    
    // Generate occupancy percentage based on building type and age
    const ageInYears = currentYear - constructionYear;
    let baseOccupancy = 85; // Start with 85% base occupancy
    
    // Newer buildings tend to have higher occupancy
    if (ageInYears < 5) {
      baseOccupancy += 10; // Up to 95% for new buildings
    } else if (ageInYears > 20) {
      baseOccupancy -= 15; // Down to 70% for older buildings
    }
    
    // Add some randomness
    const occupancy = Math.max(50, Math.min(98, baseOccupancy + (Math.random() * 20 - 10)));
    
    return {
      id,
      name: `${namePrefix[namePrefixIndex]} ${nameSuffix[nameSuffixIndex]}`,
      location: `${locationPrefixes[locationPrefixIndex]}, ${locationSuffixes[locationSuffixIndex]}`,
      type: buildingTypes[typeIndex],
      area: Math.round(totalArea),
      floors: floorCount,
      occupancy: Math.round(occupancy),
      constructionYear
    };
  });
};

/**
 * Generates mock time series forecast data
 */
export const generateMockTimeSeriesForecast = (
  buildingId: string,
  metric: string,
  startDate: string,
  horizon: number,
  includeWeather: boolean,
  includeCalendar: boolean,
  modelType: string
) => {
  // Generate timestamps
  const timestamps = [];
  const startTimestamp = new Date(startDate);
  for (let i = 0; i < horizon; i++) {
    timestamps.push(format(addHours(startTimestamp, i), "yyyy-MM-dd'T'HH:mm:ss"));
  }
  
  // Generate forecast values with daily patterns
  const forecast = timestamps.map(ts => {
    const date = new Date(ts);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Base value depends on time of day
    let baseValue;
    if (hour >= 8 && hour <= 17) {
      // Business hours
      baseValue = isWeekend ? 40 + Math.random() * 20 : 70 + Math.random() * 30;
    } else if (hour >= 6 && hour <= 22) {
      // Extended day hours
      baseValue = isWeekend ? 30 + Math.random() * 15 : 50 + Math.random() * 20;
    } else {
      // Night hours
      baseValue = isWeekend ? 15 + Math.random() * 10 : 20 + Math.random() * 15;
    }
    
    return Math.round(baseValue * 10) / 10;
  });
  
  // Generate upper and lower confidence bounds
  const upperBound = forecast.map(val => Math.round((val * 1.15) * 10) / 10);
  const lowerBound = forecast.map(val => Math.round((val * 0.85) * 10) / 10);
  
  // Generate actual historical values (slightly different from forecast)
  const actual = forecast.slice(0, Math.floor(horizon / 4)).map(val => {
    const randomFactor = 0.9 + Math.random() * 0.2;
    return Math.round((val * randomFactor) * 10) / 10;
  });
  
  // Add null values for the future part of actual data
  const actualComplete = [
    ...actual,
    ...Array(horizon - actual.length).fill(null)
  ];
  
  // Create chart data
  const chartData = {
    timestamps,
    datasets: [
      {
        label: 'Actual',
        data: actualComplete,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.4,
        fill: false
      },
      {
        label: 'Forecast',
        data: forecast,
        borderColor: '#ea580c',
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.4,
        fill: false
      },
      {
        label: 'Upper Bound',
        data: upperBound,
        borderColor: 'rgba(234, 88, 12, 0.3)',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderWidth: 1,
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 0,
        fill: false
      },
      {
        label: 'Lower Bound',
        data: lowerBound,
        borderColor: 'rgba(234, 88, 12, 0.3)',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderWidth: 1,
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 0,
        fill: '+1'
      }
    ]
  };
  
  return {
    chart_data: chartData,
    results: {
      model: modelType,
      peak_point: {
        value: Math.max(...forecast),
        time: format(new Date(timestamps[forecast.indexOf(Math.max(...forecast))]), 'MMM dd HH:mm')
      },
      average: Math.round(forecast.reduce((sum, val) => sum + val, 0) / horizon * 10) / 10,
      trend_description: 'Consistent daily patterns with peaks during business hours',
      reliability_score: 87,
      variable_importance: [
        { name: 'Hour of Day', importance: 0.35 },
        { name: 'Day of Week', importance: 0.25 },
        { name: 'Temperature', importance: 0.20 },
        { name: 'Previous Consumption', importance: 0.15 },
        { name: 'Occupancy', importance: 0.05 }
      ],
      savings_potential: {
        percentage: 12,
        value: Math.round(forecast.reduce((sum, val) => sum + val, 0) * 0.12 * 10) / 10
      },
      recommendations: [
        {
          title: 'Optimize HVAC Schedules',
          description: 'Adjust HVAC operation to match occupancy patterns',
          priority: 'high',
          impact: 8,
          implementation_time: 'Short-term'
        },
        {
          title: 'Reduce Standby Power',
          description: 'Implement power management for equipment during off hours',
          priority: 'medium',
          impact: 4,
          implementation_time: 'Immediate'
        },
        {
          title: 'Lighting Controls Upgrade',
          description: 'Install motion sensors and dimming capabilities',
          priority: 'low',
          impact: 3,
          implementation_time: 'Medium-term'
        }
      ]
    }
  };
};