// Forecast API service for the Energy AI Optimizer frontend
import axios from 'axios';
import { apiConfig, createMockDelay, formatApiPath } from '../../utils/apiConfig';
import { addDays, addHours, format, parseISO, startOfDay } from 'date-fns';

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

// Forecast data interfaces
export interface ForecastDataPoint {
  timestamp: string;
  value: number;
  lowerBound?: number;
  upperBound?: number;
}

export interface ForecastResult {
  buildingId: string;
  metric: 'electricity' | 'water' | 'gas' | 'steam' | 'hotwater' | 'chilledwater';
  interval: 'hourly' | 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  data: ForecastDataPoint[];
  accuracy: {
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
    mae: number; // Mean Absolute Error
  };
  influencingFactors: {
    name: string;
    impact: number; // -1 to 1 scale
  }[];
}

// Generate mock forecast data for development
export const generateMockForecast = (
  buildingId: string,
  metric: ForecastResult['metric'],
  startDate: string,
  days: number = 7,
  interval: ForecastResult['interval'] = 'hourly'
): ForecastResult => {
  // Parse the start date
  const start = parseISO(startDate);
  const end = addDays(start, days);
  
  // Define base values and patterns for different metrics
  const baseValues: { [key in ForecastResult['metric']]: number } = {
    electricity: 120, // kWh
    water: 4500,      // liters
    gas: 25,          // cubic meters
    steam: 150,       // kg
    hotwater: 300,    // liters
    chilledwater: 200 // liters
  };
  
  // Define daily variations (weekend vs weekday)
  const dailyPatterns: { [key in ForecastResult['metric']]: { weekday: number, weekend: number } } = {
    electricity: { weekday: 1.0, weekend: 0.6 },
    water: { weekday: 1.0, weekend: 0.7 },
    gas: { weekday: 1.0, weekend: 0.8 },
    steam: { weekday: 1.0, weekend: 0.5 },
    hotwater: { weekday: 1.0, weekend: 0.9 },
    chilledwater: { weekday: 1.0, weekend: 0.4 }
  };
  
  // Define hourly patterns (24 hours) for each metric
  const hourlyPatterns: { [key in ForecastResult['metric']]: number[] } = {
    electricity: [
      0.4, 0.35, 0.3, 0.3, 0.35, 0.5, // 0-5
      0.6, 0.8, 1.0, 1.1, 1.2, 1.3,   // 6-11
      1.2, 1.3, 1.2, 1.1, 1.0, 0.9,   // 12-17
      0.8, 0.7, 0.6, 0.5, 0.45, 0.4   // 18-23
    ],
    water: [
      0.2, 0.15, 0.1, 0.1, 0.2, 0.5,  // 0-5
      0.8, 1.2, 1.0, 0.9, 0.8, 0.9,   // 6-11
      1.0, 0.9, 0.8, 0.7, 0.8, 0.9,   // 12-17
      1.1, 1.0, 0.8, 0.6, 0.4, 0.3    // 18-23
    ],
    gas: [
      0.3, 0.3, 0.3, 0.3, 0.4, 0.6,   // 0-5
      0.8, 1.0, 1.1, 1.0, 0.9, 1.0,   // 6-11
      1.2, 1.0, 0.9, 0.8, 0.9, 1.1,   // 12-17
      1.2, 1.0, 0.8, 0.6, 0.4, 0.3    // 18-23
    ],
    steam: [
      0.2, 0.2, 0.2, 0.2, 0.3, 0.5,   // 0-5
      0.7, 1.0, 1.2, 1.1, 1.0, 0.9,   // 6-11
      0.8, 0.7, 0.6, 0.6, 0.7, 0.8,   // 12-17
      0.9, 0.8, 0.6, 0.5, 0.3, 0.2    // 18-23
    ],
    hotwater: [
      0.3, 0.2, 0.1, 0.1, 0.3, 0.6,   // 0-5
      1.2, 1.5, 1.3, 1.0, 0.8, 0.7,   // 6-11
      0.8, 0.7, 0.6, 0.7, 0.8, 1.0,   // 12-17
      1.3, 1.2, 1.0, 0.8, 0.6, 0.4    // 18-23
    ],
    chilledwater: [
      0.2, 0.2, 0.2, 0.2, 0.2, 0.3,   // 0-5
      0.5, 0.8, 1.0, 1.2, 1.4, 1.5,   // 6-11
      1.6, 1.7, 1.6, 1.5, 1.3, 1.0,   // 12-17
      0.8, 0.6, 0.5, 0.4, 0.3, 0.3    // 18-23
    ]
  };
  
  const data: ForecastDataPoint[] = [];
  let currentDate = startOfDay(start);
  const baseValue = baseValues[metric];
  const noise = 0.1; // 10% random variation
  
  // Generate data based on interval
  if (interval === 'hourly') {
    for (let day = 0; day < days; day++) {
      const isWeekend = [0, 6].includes(currentDate.getDay()); // 0 = Sunday, 6 = Saturday
      const dailyPattern = isWeekend ? dailyPatterns[metric].weekend : dailyPatterns[metric].weekday;
      
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = addHours(currentDate, hour).toISOString();
        const hourlyPattern = hourlyPatterns[metric][hour];
        const baseConsumption = baseValue * dailyPattern * hourlyPattern;
        
        // Add some randomness to make it more realistic
        const randomFactor = 1 + (Math.random() * noise * 2 - noise);
        const value = Math.round(baseConsumption * randomFactor * 100) / 100;
        
        // Calculate uncertainty bounds (wider for future dates)
        const dayFactor = 1 + (day * 0.03); // Increase uncertainty by 3% per day
        const lowerBound = Math.round(value * (1 - 0.1 * dayFactor) * 100) / 100;
        const upperBound = Math.round(value * (1 + 0.1 * dayFactor) * 100) / 100;
        
        data.push({
          timestamp,
          value,
          lowerBound,
          upperBound
        });
      }
      
      currentDate = addDays(currentDate, 1);
    }
  } else if (interval === 'daily') {
    for (let day = 0; day < days; day++) {
      const isWeekend = [0, 6].includes(currentDate.getDay());
      const dailyPattern = isWeekend ? dailyPatterns[metric].weekend : dailyPatterns[metric].weekday;
      
      const timestamp = currentDate.toISOString();
      
      // Calculate daily value (24h sum with daily pattern)
      let dailySum = 0;
      for (let hour = 0; hour < 24; hour++) {
        const hourlyPattern = hourlyPatterns[metric][hour];
        dailySum += baseValue * dailyPattern * hourlyPattern;
      }
      
      // Add some randomness
      const randomFactor = 1 + (Math.random() * noise * 2 - noise);
      const value = Math.round(dailySum * randomFactor * 100) / 100;
      
      // Calculate uncertainty bounds
      const dayFactor = 1 + (day * 0.05); // 5% increase in uncertainty per day
      const lowerBound = Math.round(value * (1 - 0.08 * dayFactor) * 100) / 100;
      const upperBound = Math.round(value * (1 + 0.08 * dayFactor) * 100) / 100;
      
      data.push({
        timestamp,
        value,
        lowerBound,
        upperBound
      });
      
      currentDate = addDays(currentDate, 1);
    }
  } else if (interval === 'weekly') {
    // We'll generate data for multiple weeks
    for (let week = 0; week < Math.ceil(days / 7); week++) {
      const timestamp = currentDate.toISOString();
      
      // Calculate weekly value (sum of 7 days with appropriate patterns)
      let weeklySum = 0;
      for (let weekday = 0; weekday < 7; weekday++) {
        const isWeekend = [0, 6].includes((currentDate.getDay() + weekday) % 7);
        const dailyPattern = isWeekend ? dailyPatterns[metric].weekend : dailyPatterns[metric].weekday;
        
        for (let hour = 0; hour < 24; hour++) {
          const hourlyPattern = hourlyPatterns[metric][hour];
          weeklySum += baseValue * dailyPattern * hourlyPattern;
        }
      }
      
      // Add some randomness
      const randomFactor = 1 + (Math.random() * noise * 2 - noise);
      const value = Math.round(weeklySum * randomFactor * 100) / 100;
      
      // Calculate uncertainty bounds
      const weekFactor = 1 + (week * 0.1); // 10% increase in uncertainty per week
      const lowerBound = Math.round(value * (1 - 0.12 * weekFactor) * 100) / 100;
      const upperBound = Math.round(value * (1 + 0.12 * weekFactor) * 100) / 100;
      
      data.push({
        timestamp,
        value,
        lowerBound,
        upperBound
      });
      
      currentDate = addDays(currentDate, 7);
    }
  } else if (interval === 'monthly') {
    // Approximate month as 30 days
    for (let month = 0; month < Math.ceil(days / 30); month++) {
      const timestamp = currentDate.toISOString();
      
      // Approximate a month's consumption
      // (based on a typical month distribution of weekdays/weekends)
      const weekdayCount = 22; // Typical weekdays in a month
      const weekendCount = 8;  // Typical weekend days in a month
      
      let monthlySum = 0;
      
      // Weekdays
      for (let i = 0; i < weekdayCount; i++) {
        for (let hour = 0; hour < 24; hour++) {
          monthlySum += baseValue * dailyPatterns[metric].weekday * hourlyPatterns[metric][hour];
        }
      }
      
      // Weekends
      for (let i = 0; i < weekendCount; i++) {
        for (let hour = 0; hour < 24; hour++) {
          monthlySum += baseValue * dailyPatterns[metric].weekend * hourlyPatterns[metric][hour];
        }
      }
      
      // Add some randomness
      const randomFactor = 1 + (Math.random() * noise * 2 - noise);
      const value = Math.round(monthlySum * randomFactor * 100) / 100;
      
      // Calculate uncertainty bounds
      const monthFactor = 1 + (month * 0.15); // 15% increase in uncertainty per month
      const lowerBound = Math.round(value * (1 - 0.15 * monthFactor) * 100) / 100;
      const upperBound = Math.round(value * (1 + 0.15 * monthFactor) * 100) / 100;
      
      data.push({
        timestamp,
        value,
        lowerBound,
        upperBound
      });
      
      // Move to next month (approximated as 30 days)
      currentDate = addDays(currentDate, 30);
    }
  }
  
  // Generate mock accuracy metrics (should decrease for longer-term forecasts)
  const mape = Math.round((5 + Math.random() * 3 + days * 0.5) * 10) / 10; // 5-8% + 0.5% per day
  const rmse = Math.round((baseValue * 0.05 + days * baseValue * 0.01) * 100) / 100;
  const mae = Math.round((baseValue * 0.04 + days * baseValue * 0.008) * 100) / 100;
  
  // Generate mock influencing factors
  const influencingFactors: ForecastResult['influencingFactors'] = [];
  
  // Different influence factors for different metrics
  if (metric === 'electricity') {
    influencingFactors.push(
      { name: 'Temperature', impact: Math.round((0.6 + Math.random() * 0.3) * 100) / 100 },
      { name: 'Occupancy', impact: Math.round((0.5 + Math.random() * 0.3) * 100) / 100 },
      { name: 'Time of Day', impact: Math.round((0.8 + Math.random() * 0.2) * 100) / 100 },
      { name: 'Day of Week', impact: Math.round((0.4 + Math.random() * 0.3) * 100) / 100 }
    );
  } else if (metric === 'water') {
    influencingFactors.push(
      { name: 'Occupancy', impact: Math.round((0.7 + Math.random() * 0.2) * 100) / 100 },
      { name: 'Time of Day', impact: Math.round((0.6 + Math.random() * 0.3) * 100) / 100 },
      { name: 'Day of Week', impact: Math.round((0.5 + Math.random() * 0.2) * 100) / 100 }
    );
  } else if (metric === 'gas') {
    influencingFactors.push(
      { name: 'Temperature', impact: Math.round((0.8 + Math.random() * 0.2) * 100) / 100 },
      { name: 'Occupancy', impact: Math.round((0.3 + Math.random() * 0.3) * 100) / 100 },
      { name: 'Time of Day', impact: Math.round((0.5 + Math.random() * 0.3) * 100) / 100 },
      { name: 'Day of Week', impact: Math.round((0.4 + Math.random() * 0.2) * 100) / 100 }
    );
  } else {
    // Default factors for other metrics
    influencingFactors.push(
      { name: 'Temperature', impact: Math.round((0.5 + Math.random() * 0.3) * 100) / 100 },
      { name: 'Occupancy', impact: Math.round((0.4 + Math.random() * 0.3) * 100) / 100 },
      { name: 'Time of Day', impact: Math.round((0.6 + Math.random() * 0.3) * 100) / 100 }
    );
  }
  
  return {
    buildingId,
    metric,
    interval,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    data,
    accuracy: {
      mape,
      rmse,
      mae
    },
    influencingFactors
  };
};

// Cập nhật getForecast để gọi API thực
export const getForecast = async (
  buildingId: string,
  metric: ForecastResult['metric'],
  startDate: string,
  days: number = 7,
  interval: ForecastResult['interval'] = 'hourly'
): Promise<ForecastResult> => {
  try {
    console.log(`Fetching forecast data from API for building ${buildingId}...`);
    
    // Construct the API URL
    const url = getApiPath(`/api/forecast/${buildingId}/${metric}`);
    
    // Make the API call
    const response = await apiClient.get(url, {
      params: {
        start_date: startDate,
        days: days,
        interval: interval
      }
    });
    
    // Check if we got a valid response
    if (response.status === 200 && response.data) {
      console.log('Forecast data received from API');
      
      // Transform the response data if needed to match ForecastResult interface
      const forecastResult: ForecastResult = {
        buildingId: response.data.buildingId,
        metric: response.data.metric,
        interval: response.data.interval,
        startDate: response.data.startDate,
        endDate: response.data.endDate,
        data: response.data.data.map((point: any) => ({
          timestamp: point.timestamp,
          value: point.value,
          lowerBound: point.lowerBound,
          upperBound: point.upperBound
        })),
        accuracy: {
          mape: response.data.accuracy.mape,
          rmse: response.data.accuracy.rmse,
          mae: response.data.accuracy.mae
        },
        influencingFactors: response.data.influencingFactors
      };
      
      return forecastResult;
    } else {
      console.warn('Invalid response from forecast API, falling back to mock data');
      throw new Error('Invalid API response');
    }
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    console.log('Falling back to mock data...');
    
    // Fallback to mock data if the API call fails
    await createMockDelay(500);
    return generateMockForecast(buildingId, metric, startDate, days, interval);
  }
};

// Get scenario forecast with adjustable parameters
export const getScenarioForecast = async (
  buildingId: string,
  metric: ForecastResult['metric'],
  startDate: string,
  days: number = 7,
  interval: ForecastResult['interval'] = 'hourly',
  parameters: {
    occupancyChange?: number; // Percentage change (-100 to 100)
    temperatureSetpoint?: number; // Absolute value in Celsius
    operatingHoursChange?: number; // Percentage change (-100 to 100)
    equipmentEfficiencyImprovement?: number; // Percentage improvement (0 to 100)
  } = {}
): Promise<ForecastResult> => {
  try {
    // Get baseline forecast first
    const baseline = await getForecast(buildingId, metric, startDate, days, interval);
    
    if (apiConfig.useMockData) {
      // For mock data, we'll adjust the baseline forecast based on parameters
      const adjustedData = baseline.data.map(point => {
        let adjustmentFactor = 1.0;
        const pointDate = parseISO(point.timestamp);
        const hour = pointDate.getHours();
        
        // Apply occupancy change
        if (parameters.occupancyChange !== undefined) {
          // More effect during business hours (8am-6pm)
          if (hour >= 8 && hour <= 18) {
            adjustmentFactor += (parameters.occupancyChange / 100) * 0.6;
          } else {
            adjustmentFactor += (parameters.occupancyChange / 100) * 0.2;
          }
        }
        
        // Apply temperature setpoint change (primarily affects HVAC-related metrics)
        if (parameters.temperatureSetpoint !== undefined && 
            (metric === 'electricity' || metric === 'gas' || 
             metric === 'steam' || metric === 'chilledwater')) {
          // Assume baseline is 22°C, each degree of change affects consumption by ~5%
          const baselineTemp = 22;
          const tempChange = parameters.temperatureSetpoint - baselineTemp;
          
          // Effect depends on metric
          let tempImpact = 0;
          if (metric === 'electricity' || metric === 'chilledwater') {
            // Cooling - higher temp means less consumption
            tempImpact = -0.05 * tempChange; 
          } else if (metric === 'gas' || metric === 'steam') {
            // Heating - higher temp means more consumption
            tempImpact = 0.05 * tempChange;
          }
          
          adjustmentFactor += tempImpact;
        }
        
        // Apply operating hours change
        if (parameters.operatingHoursChange !== undefined) {
          // Effect primarily during early morning and evening hours
          if ((hour >= 6 && hour <= 8) || (hour >= 18 && hour <= 22)) {
            adjustmentFactor += (parameters.operatingHoursChange / 100) * 0.8;
          }
        }
        
        // Apply equipment efficiency improvement
        if (parameters.equipmentEfficiencyImprovement !== undefined) {
          // Efficiency improvements directly reduce consumption
          adjustmentFactor -= (parameters.equipmentEfficiencyImprovement / 100) * 0.9;
        }
        
        // Ensure adjustment factor doesn't go below a minimum threshold
        adjustmentFactor = Math.max(0.1, adjustmentFactor);
        
        // Apply the adjustment factor to the value and bounds
        const newValue = Math.round(point.value * adjustmentFactor * 100) / 100;
        
        return {
          ...point,
          value: newValue,
          lowerBound: point.lowerBound 
            ? Math.round(point.lowerBound * adjustmentFactor * 100) / 100 
            : undefined,
          upperBound: point.upperBound 
            ? Math.round(point.upperBound * adjustmentFactor * 100) / 100 
            : undefined
        };
      });
      
      return {
        ...baseline,
        data: adjustedData
      };
    }
    
    // Fetch scenario forecast from PostgreSQL backend
    const response = await apiClient.get(getApiPath('/forecasts/scenario'), {
      params: {
        building_id: buildingId,
        metric,
        start_date: startDate,
        days,
        interval,
        occupancy_change: parameters.occupancyChange,
        temperature_setpoint: parameters.temperatureSetpoint,
        operating_hours_change: parameters.operatingHoursChange,
        equipment_efficiency_improvement: parameters.equipmentEfficiencyImprovement
      }
    });
    
    // Transform API response to match the ForecastResult interface
    return {
      buildingId: response.data.building_id,
      metric: response.data.metric,
      interval: response.data.interval,
      startDate: response.data.start_date,
      endDate: response.data.end_date,
      data: response.data.data.map((item: any) => ({
        timestamp: item.timestamp,
        value: item.value,
        lowerBound: item.lower_bound,
        upperBound: item.upper_bound
      })),
      accuracy: {
        mape: response.data.accuracy.mape,
        rmse: response.data.accuracy.rmse,
        mae: response.data.accuracy.mae
      },
      influencingFactors: response.data.influencing_factors.map((factor: any) => ({
        name: factor.name,
        impact: factor.impact
      }))
    };
  } catch (error) {
    console.error('Error fetching scenario forecast data:', error);
    
    // If API fails, fallback to baseline forecast
    const baseline = await getForecast(buildingId, metric, startDate, days, interval);
    return baseline;
  }
};

export const getTimeSeriesForecast = async (
  buildingId: string,
  metric: ForecastResult['metric'],
  startDate: string,
  forecastHorizon: number = 24,
  includeWeather: boolean = true,
  includeCalendar: boolean = true,
  modelType: string = 'tft'
): Promise<any> => {
  try {
    // Gọi API thực tế
    const response = await apiClient.post(
      getApiPath(`/api/forecasting/time-series-forecast`),
      {
        building_id: buildingId,
        metric,
        start_date: startDate,
        forecast_horizon: forecastHorizon,
        include_weather: includeWeather,
        include_calendar: includeCalendar,
        model_type: modelType
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching time series forecast:', error);
    
    // Fallback to mock data if API fails
    console.warn('Falling back to mock forecast data');
    await createMockDelay();
    return generateMockTimeSeriesForecast(
      buildingId, 
      metric, 
      startDate, 
      forecastHorizon,
      includeWeather,
      includeCalendar,
      modelType
    );
  }
};

// Helper function to provide default influencing factors when not available from API
const getDefaultInfluencingFactors = (modelType: string) => {
  if (modelType === 'tft') {
    return [
      { name: 'Temperature', impact: 0.45 },
      { name: 'Time of Day', impact: 0.25 },
      { name: 'Day of Week', impact: 0.15 },
      { name: 'Recent Consumption', impact: 0.10 },
      { name: 'Seasonality', impact: 0.05 }
    ];
  } else if (modelType === 'prophet') {
    return [
      { name: 'Trend', impact: 0.40 },
      { name: 'Weekly Pattern', impact: 0.30 },
      { name: 'Daily Pattern', impact: 0.20 },
      { name: 'Holidays', impact: 0.10 }
    ];
  } else {
    // Simple model
    return [
      { name: 'Historical Average', impact: 0.60 },
      { name: 'Recent Trend', impact: 0.25 },
      { name: 'Day Type', impact: 0.15 }
    ];
  }
};

export const generateMockTimeSeriesForecast = (
  buildingId: string,
  metric: ForecastResult['metric'],
  startDate: string,
  forecastHorizon: number = 24,
  includeWeather: boolean = true,
  includeCalendar: boolean = true,
  modelType: string = 'tft'
): any => {
  // Determine how data patterns and uncertainty should vary based on model type
  let uncertaintyFactor = 1.0;
  let dataNoiseFactor = 1.0;
  
  switch (modelType) {
    case 'tft':
      uncertaintyFactor = 1.0;
      dataNoiseFactor = 1.0;
      break;
    case 'prophet':
      uncertaintyFactor = 1.2;
      dataNoiseFactor = 1.1;
      break;
    case 'simple':
      uncertaintyFactor = 1.5;
      dataNoiseFactor = 1.3;
      break;
    case 'very_simple':
      uncertaintyFactor = 2.0;
      dataNoiseFactor = 1.5;
      break;
    default:
      uncertaintyFactor = 1.0;
      dataNoiseFactor = 1.0;
  }
  
  // Parse the start date
  const start = parseISO(startDate);
  
  // Define base values for energy metrics
  const baseValues: Record<string, number> = {
    electricity: 120,
    water: 4500,
    gas: 25,
    steam: 150,
    hotwater: 300,
    chilledwater: 200
  };
  
  // Define hourly patterns
  const hourlyPatterns = [
    0.6, 0.55, 0.5, 0.48, 0.52, 0.65, // 0-5
    0.8, 1.1, 1.3, 1.2, 1.15, 1.1, // 6-11
    1.05, 1.1, 1.08, 1.15, 1.25, 1.4, // 12-17
    1.3, 1.2, 1.0, 0.9, 0.8, 0.7 // 18-23
  ];

  // Additional patterns if calendar features are included
  const weekdayFactors = includeCalendar 
    ? [1.0, 1.05, 1.1, 1.0, 1.1, 0.8, 0.6] // Mon-Sun
    : [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
      
  // Base value for the selected metric
  const baseValue = baseValues[metric] || 100;
  
  // Generate the forecast data
  const data = [];
  for (let i = 0; i < forecastHorizon; i++) {
    const timestamp = addHours(start, i).toISOString();
    const hour = addHours(start, i).getHours();
    const dayOfWeek = addHours(start, i).getDay();
    
    // Calculate the base value for this hour
    let value = baseValue * hourlyPatterns[hour];
    
    // Add calendar effects if enabled
    if (includeCalendar) {
      value *= weekdayFactors[dayOfWeek];
    }
    
    // Add weather effects if enabled
    if (includeWeather) {
      // Simulate temperature effect (higher consumption in extreme temperatures)
      const hourTemp = 20 + 10 * Math.sin(Math.PI * hour / 12) + (Math.random() * 5 - 2.5);
      const tempEffect = 1 + 0.005 * Math.abs(hourTemp - 22); // 22°C is baseline
      value *= tempEffect;
    }
    
    // Add noise based on model type
    const noise = (Math.random() * 0.2 - 0.1) * dataNoiseFactor;
    value = value * (1 + noise);
    
    // Calculate prediction intervals based on model type and time horizon
    const timeUncertainty = 1 + (i / forecastHorizon * 0.5); // Uncertainty increases with time
    const intervalWidth = 0.1 * value * uncertaintyFactor * timeUncertainty;
    
    data.push({
      timestamp,
      value: Math.round(value * 100) / 100,
      lowerBound: Math.round((value - intervalWidth) * 100) / 100,
      upperBound: Math.round((value + intervalWidth) * 100) / 100
    });
  }
  
  // Generate influencing factors based on model type and features
  const influencingFactors = getDefaultInfluencingFactors(modelType);
  
  // Adjust factors based on which features are included
  if (!includeWeather) {
    influencingFactors.forEach(factor => {
      if (factor.name === 'Temperature' || factor.name === 'Weather') {
        factor.impact *= 0.2; // Reduce weather impact
      }
    });
  }
  
  if (!includeCalendar) {
    influencingFactors.forEach(factor => {
      if (factor.name === 'Day of Week' || factor.name === 'Time of Day' || factor.name === 'Seasonality') {
        factor.impact *= 0.2; // Reduce calendar impact
      }
    });
  }
  
  // Return the forecast result
  return {
    buildingId,
    metric,
    interval: 'hourly',
    startDate: start.toISOString(),
    endDate: addHours(start, forecastHorizon - 1).toISOString(),
    data,
    model_type: modelType,
    features: {
      weather: includeWeather,
      calendar: includeCalendar
    },
    accuracy: {
      mape: Math.round((8 + Math.random() * 4) * 100) / 100, // 8-12%
      rmse: Math.round((baseValue * 0.1) * 100) / 100,
      mae: Math.round((baseValue * 0.08) * 100) / 100
    },
    influencingFactors
  };
};

// Default export
const forecastApi = {
  getForecast,
  getScenarioForecast,
  getTimeSeriesForecast
};

export default forecastApi; 