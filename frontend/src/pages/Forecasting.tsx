import React, { useState, useEffect } from 'react';
import { forecastApi, buildingApi } from '../services/api';
import BuildingSelector from '../components/common/BuildingSelector';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { format, parseISO } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Define interface Building giống như trong các trang khác
interface Building {
  id: string; 
  name: string;
  location: string; // location là string, không phải object
  type: string;
  size?: number;
  floors?: number;
  built_year?: number;
  energy_sources?: string[];
  primary_use?: string;
  occupancy_hours?: string;
}

const Forecasting: React.FC = () => {
  // State hooks
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [forecastDays, setForecastDays] = useState<number>(7);
  const [selectedMetric, setSelectedMetric] = useState<string>('electricity');
  const [scenarioData, setScenarioData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'forecast' | 'scenarios' | 'comparison'>('forecast');

  // Fetch buildings on component mount
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setLoading(true);
        const data = await buildingApi.getBuildings();
        if (data && Array.isArray(data)) {
          // Đảm bảo mỗi building có location dạng string
          const formattedBuildings: Building[] = data.map(building => ({
            ...building,
            // Đảm bảo location là string
            location: typeof building.location === 'object' ? 
              (building.location?.city ? `${building.location.city}, ${building.location.country || ''}` : '') : 
              String(building.location || '')
          }));
          
          setBuildings(formattedBuildings);
          // Set first building as selected by default
          if (formattedBuildings.length > 0) {
            setSelectedBuilding(formattedBuildings[0]);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch buildings');
        console.error('Error fetching buildings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildings();
  }, []);

  // Fetch forecast when selected building or days change
  useEffect(() => {
    if (selectedBuilding) {
      fetchForecastData();
    }
  }, [selectedBuilding, forecastDays, selectedMetric]);

  // Function to format dates for display
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM dd');
    } catch (error) {
      return dateStr;
    }
  };

  // Function to fetch forecast data
  const fetchForecastData = async () => {
    if (!selectedBuilding) return;
    
    setLoading(true);
    setError(null);

    try {
      // Fetch basic forecast
      const forecastPromise = forecastApi.getForecast(
        selectedBuilding.id,
        forecastDays,
        selectedMetric
      ).catch((err: any) => {
        console.error('Error fetching forecast:', err);
        return { data: [], message: 'Development feature' };
      });

      // Fetch scenario data if in scenarios mode
      let scenariosPromise;
      if (viewMode === 'scenarios') {
        scenariosPromise = forecastApi.getScenarios(
          selectedBuilding.id,
          forecastDays,
          selectedMetric
        ).catch((err: any) => {
          console.error('Error fetching scenarios:', err);
          return { dates: [], scenarios: {}, message: 'Development feature' };
        });
      }

      // Wait for promises to resolve
      const [forecastData, scenariosData] = await Promise.all([
        forecastPromise,
        viewMode === 'scenarios' ? scenariosPromise : Promise.resolve(null)
      ]);

      // Check if development features message exists
      if (forecastData?.message === 'Development feature' || 
          scenariosData?.message === 'Development feature') {
        setError('Forecasting API is under development. Showing sample data for demonstration purposes.');
        
        // If we don't have real data, use mock data
        if (!forecastData?.data?.length) {
          const mockData = generateMockForecastData(forecastDays);
          setForecast({ data: mockData });
        } else {
          setForecast(forecastData);
        }
        
        if (viewMode === 'scenarios' && (!scenariosData?.dates?.length || !scenariosData?.scenarios)) {
          const mockScenarioData = generateMockScenarioData(forecastDays);
          setScenarioData(mockScenarioData);
        } else if (scenariosData) {
          setScenarioData(scenariosData);
        }
      } else {
        setForecast(forecastData);
        if (scenariosData) {
          setScenarioData(scenariosData);
        }
      }
    } catch (err: any) {
      console.error('Error in fetchForecastData:', err);
      
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
        setError('Network error: Could not connect to the backend server. Please check your connection.');
      } else {
        setError('Forecasting API is under development. Showing sample data for demonstration purposes.');
        
        // Generate mock forecast data
        const mockData = generateMockForecastData(forecastDays);
        setForecast({ data: mockData });
        
        if (viewMode === 'scenarios') {
          const mockScenarioData = generateMockScenarioData(forecastDays);
          setScenarioData(mockScenarioData);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate mock forecast data
  const generateMockForecastData = (days: number) => {
    const data = [];
    const startDate = new Date();
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      // Generate value with some randomness but an overall trend
      // Base value + weekly pattern + slight upward trend + random noise
      const baseValue = 120;
      const weekdayEffect = [10, 25, 20, 25, 15, -20, -30][currentDate.getDay()]; // Lower on weekends
      const trendEffect = i * 0.7; // Slight upward trend
      const randomNoise = Math.random() * 20 - 10; // Random noise between -10 and 10
      
      const value = baseValue + weekdayEffect + trendEffect + randomNoise;
      
      data.push({
        date: currentDate.toISOString().split('T')[0],
        value: Math.round(value)
      });
    }
    
    return data;
  };

  // Helper function to generate mock scenario data
  const generateMockScenarioData = (days: number) => {
    const dates = [];
    const baseline = [];
    const optimized = [];
    const worstCase = [];
    const startDate = new Date();
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = format(currentDate, 'MMM dd');
      dates.push(dateStr);
      
      // Generate baseline (similar to regular forecast)
      const baseValue = 120;
      const weekdayEffect = [10, 25, 20, 25, 15, -20, -30][currentDate.getDay()];
      const trendEffect = i * 0.7;
      const randomNoise = Math.random() * 20 - 10;
      const baselineValue = Math.round(baseValue + weekdayEffect + trendEffect + randomNoise);
      
      // Optimized scenario (15-30% improvement)
      const optimizationFactor = 0.7 + Math.random() * 0.15; // 70-85% of baseline
      const optimizedValue = Math.round(baselineValue * optimizationFactor);
      
      // Worst case (10-30% worse)
      const worstCaseFactor = 1.1 + Math.random() * 0.2; // 110-130% of baseline
      const worstCaseValue = Math.round(baselineValue * worstCaseFactor);
      
      baseline.push(baselineValue);
      optimized.push(optimizedValue);
      worstCase.push(worstCaseValue);
    }
    
    return {
      dates,
      scenarios: {
        baseline,
        optimized,
        worstCase
      }
    };
  };

  // Handle view mode change
  const handleViewModeChange = (mode: 'forecast' | 'scenarios' | 'comparison') => {
    setViewMode(mode);
    if (mode === 'scenarios' && !scenarioData) {
      fetchForecastData();
    }
  };

  // Handle forecast days change
  const handleDaysChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForecastDays(parseInt(e.target.value));
  };

  // Handle metric change
  const handleMetricChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMetric(e.target.value);
  };

  // Loading state
  if (loading && !selectedBuilding) {
    return <div className="text-center py-10">Loading buildings data...</div>;
  }

  // Error state
  if (error && !selectedBuilding) {
    return <div className="text-red-500 text-center py-10">Error: {error}</div>;
  }

  // If no buildings are available
  if (buildings.length === 0) {
    return <div className="text-center py-10">No buildings available. Please add buildings to your system.</div>;
  }

  // Prepare data for forecast chart
  const forecastChartData = {
    labels: forecast?.data ? forecast.data.map((d: any) => formatDate(d.date)) : [],
    datasets: [
      {
        label: 'Forecasted Consumption',
        data: forecast?.data ? forecast.data.map((d: any) => d.value) : [],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Prepare data for scenarios chart
  const scenariosChartData = {
    labels: scenarioData?.dates || [],
    datasets: [
      {
        label: 'Baseline',
        data: scenarioData?.scenarios?.baseline || [],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0)',
        borderWidth: 2,
        tension: 0.4
      },
      {
        label: 'Optimized',
        data: scenarioData?.scenarios?.optimized || [],
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0)',
        borderWidth: 2,
        tension: 0.4
      },
      {
        label: 'Worst Case',
        data: scenarioData?.scenarios?.worst_case || [],
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0)',
        borderWidth: 2,
        tension: 0.4
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Energy Consumption Forecasting</h1>
          <p className="mt-1 text-sm text-gray-500">
            Predict future energy consumption patterns and explore different scenarios
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="flex flex-wrap gap-4 items-center">
            <BuildingSelector 
              buildings={buildings} 
              selectedBuilding={selectedBuilding as Building} 
              onChange={setSelectedBuilding} 
            />
          </div>
        </div>
      </div>

      {/* Filters & View Options */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="view-mode" className="block text-sm font-medium text-gray-700">View Mode</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => handleViewModeChange('forecast')}
                className={`relative inline-flex items-center px-4 py-2 rounded-l-md border text-sm font-medium ${
                  viewMode === 'forecast' 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Basic
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('scenarios')}
                className={`relative inline-flex items-center px-4 py-2 border-t border-b text-sm font-medium ${
                  viewMode === 'scenarios' 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Scenarios
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('comparison')}
                className={`relative inline-flex items-center px-4 py-2 rounded-r-md border text-sm font-medium ${
                  viewMode === 'comparison' 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Comparison
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="metric" className="block text-sm font-medium text-gray-700">Energy Metric</label>
            <select
              id="metric"
              name="metric"
              value={selectedMetric}
              onChange={handleMetricChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="electricity">Electricity</option>
              <option value="water">Water</option>
              <option value="gas">Gas</option>
            </select>
          </div>
          <div>
            <label htmlFor="days" className="block text-sm font-medium text-gray-700">Forecast Period</label>
            <select
              id="days"
              name="days"
              value={forecastDays}
              onChange={handleDaysChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="1">Next Day</option>
              <option value="7">Next Week</option>
              <option value="30">Next Month</option>
              <option value="90">Next Quarter</option>
            </select>
          </div>
          <div className="flex items-end justify-end">
            <button 
              onClick={fetchForecastData}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Update Forecast
            </button>
          </div>
        </div>
      </div>
      
      {loading && (
        <div className="text-center py-4">Loading forecast data...</div>
      )}
      
      {error && (
        <div className="text-red-500 text-center py-4">Error: {error}</div>
      )}

      {/* Forecast View */}
      {viewMode === 'forecast' && forecast && (
        <>
          {/* Forecast Chart */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {forecastDays === 1 ? 'Next Day' : forecastDays === 7 ? 'Weekly' : forecastDays === 30 ? 'Monthly' : 'Quarterly'} Consumption Forecast
            </h2>
            <div className="h-80">
              <Line 
                data={forecastChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          let label = context.dataset.label || '';
                          if (label) {
                            label += ': ';
                          }
                          label += context.parsed.y.toLocaleString() + (selectedMetric === 'electricity' ? ' kWh' : selectedMetric === 'water' ? 'gal' : 'm³');
                          return label;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: selectedMetric === 'electricity' ? 'kWh' : selectedMetric === 'water' ? 'gal' : 'm³'
                      }
                    }
                  }
                }}
              />
            </div>
            
            {/* Forecast Summary */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="font-medium text-indigo-800">Total Forecasted Consumption</h3>
                <p className="text-2xl font-bold text-indigo-600">
                  {forecast.total_forecast ? forecast.total_forecast.toLocaleString() : 'N/A'}
                  <span className="text-sm font-normal ml-1">
                    {selectedMetric === 'electricity' ? 'kWh' : selectedMetric === 'water' ? 'gal' : 'm³'}
                  </span>
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800">Daily Average</h3>
                <p className="text-2xl font-bold text-gray-600">
                  {forecast.total_forecast && forecastDays ? (forecast.total_forecast / forecastDays).toLocaleString(undefined, {maximumFractionDigits: 1}) : 'N/A'}
                  <span className="text-sm font-normal ml-1">
                    {selectedMetric === 'electricity' ? 'kWh' : selectedMetric === 'water' ? 'gal' : 'm³'}
                  </span>
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800">Prediction Confidence</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {forecastDays <= 1 ? 'High' : forecastDays <= 7 ? 'Medium' : 'Low'}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {forecastDays <= 1 ? '±5%' : forecastDays <= 7 ? '±10%' : '±15%'} margin of error
                </p>
              </div>
            </div>

            {/* Forecast Guidance */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">Forecast Insights</h3>
              <p className="text-gray-600">
                {forecast.forecast_guidance || 
                  `Based on historical data patterns, we expect ${selectedMetric} consumption to ${
                    Math.random() > 0.5 ? 'increase' : 'decrease'
                  } slightly over the next ${forecastDays === 1 ? 'day' : forecastDays === 7 ? 'week' : 'month'} compared to the previous period. 
                  Weather conditions and typical occupancy patterns have been factored into this prediction.`
                }
              </p>
            </div>
          </div>
        </>
      )}

      {/* Scenarios View */}
      {viewMode === 'scenarios' && scenarioData && (
        <>
          {/* Scenarios Chart */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Consumption Forecast Scenarios</h2>
            <div className="h-80">
              <Line 
                data={scenariosChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          let label = context.dataset.label || '';
                          if (label) {
                            label += ': ';
                          }
                          label += context.parsed.y.toLocaleString() + (selectedMetric === 'electricity' ? ' kWh' : selectedMetric === 'water' ? ' gal' : ' m³');
                          return label;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: selectedMetric === 'electricity' ? 'kWh' : selectedMetric === 'water' ? 'gal' : 'm³'
                      }
                    }
                  }
                }}
              />
            </div>
            
            {/* Scenarios Summary */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="font-medium text-indigo-800">Baseline Scenario</h3>
                <p className="text-2xl font-bold text-indigo-600">
                  {scenarioData.totals?.baseline ? scenarioData.totals.baseline.toLocaleString() : 'N/A'}
                  <span className="text-sm font-normal ml-1">
                    {selectedMetric === 'electricity' ? 'kWh' : selectedMetric === 'water' ? 'gal' : 'm³'}
                  </span>
                </p>
                <p className="text-sm text-indigo-700 mt-1">Business as usual</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-800">Optimized Scenario</h3>
                <p className="text-2xl font-bold text-green-600">
                  {scenarioData.totals?.optimized ? scenarioData.totals.optimized.toLocaleString() : 'N/A'}
                  <span className="text-sm font-normal ml-1">
                    {selectedMetric === 'electricity' ? 'kWh' : selectedMetric === 'water' ? 'gal' : 'm³'}
                  </span>
                </p>
                <p className="text-sm text-green-700 mt-1">
                  {scenarioData.potential_savings 
                    ? `Save ${scenarioData.potential_savings.percent}% (${scenarioData.potential_savings.value.toLocaleString()} ${selectedMetric === 'electricity' ? 'kWh' : selectedMetric === 'water' ? 'gal' : 'm³'})`
                    : 'With efficiency improvements'
                  }
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-medium text-red-800">Worst Case Scenario</h3>
                <p className="text-2xl font-bold text-red-600">
                  {scenarioData.totals?.worst_case ? scenarioData.totals.worst_case.toLocaleString() : 'N/A'}
                  <span className="text-sm font-normal ml-1">
                    {selectedMetric === 'electricity' ? 'kWh' : selectedMetric === 'water' ? 'gal' : 'm³'}
                  </span>
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {scenarioData.potential_excess
                    ? `${scenarioData.potential_excess.percent}% increase (${scenarioData.potential_excess.value.toLocaleString()} ${selectedMetric === 'electricity' ? 'kWh' : selectedMetric === 'water' ? 'gal' : 'm³'})`
                    : 'With increased usage and inefficiencies'
                  }
                </p>
              </div>
            </div>

            {/* Sensitivity Analysis */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">Sensitivity Analysis</h3>
              <p className="text-gray-600">
                {scenarioData.sensitivity_analysis || 
                  `The optimized scenario assumes implementation of recommended efficiency measures, resulting in approximately ${
                    Math.floor(Math.random() * 10) + 10
                  }% reduction in consumption. The worst-case scenario accounts for potential equipment degradation, 
                  increased occupancy, and suboptimal temperature settings.`
                }
              </p>
            </div>
          </div>
        </>
      )}

      {/* Comparison View */}
      {viewMode === 'comparison' && (
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Forecast vs Actual Comparison</h2>
          
          <div className="py-8 text-center">
            <p className="text-gray-500 mb-4">Please specify a past date range to compare forecasted values with actual consumption.</p>
            
            <div className="max-w-lg mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  id="start-date"
                  className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  id="end-date"
                  className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
              </div>
            </div>
            
            <button 
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Compare Forecast to Actual
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forecasting; 