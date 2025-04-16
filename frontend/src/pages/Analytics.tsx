import React, { useState, useEffect, useMemo } from 'react';
import { analysisApi, buildingApi } from '../services/api/exports';
import BuildingSelector from '../components/common/BuildingSelector';
import { Bar, Line, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Thêm hàm helper thiếu
// Hàm này chuyển đổi chỉ số thành tên ngày trong tuần
const getDayName = (index: number): string => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[index % 7];
};

// Hàm này chuyển đổi mã metric thành tên hiển thị
const getMetricDisplayName = (metric: string): string => {
  switch (metric) {
    case 'electricity':
      return 'Electricity';
    case 'water':
      return 'Water';
    case 'gas':
      return 'Gas';
    default:
      return 'Energy';
  }
};

// Define interface Building giống như trong Dashboard.tsx
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

// Define component
const Analytics: React.FC = () => {
  // State hooks
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [patterns, setPatterns] = useState<any>(null);
  const [weatherCorrelation, setWeatherCorrelation] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('electricity');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  });

  // Fetch buildings on component mount
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setLoading(true);
        console.log('Fetching building data...');
        const data = await buildingApi.getBuildings();
        console.log('Building data received:', data);
        if (data && Array.isArray(data)) {
          // Đảm bảo mỗi building có location dạng string
          const formattedBuildings: Building[] = data.map(building => ({
            ...building,
            // Đảm bảo location là string
            location: typeof building.location === 'object' && building.location !== null ? 
              ((building.location as any)?.city ? `${(building.location as any).city}, ${(building.location as any).country || ''}` : '') : 
              String(building.location || '')
          }));
          
          setBuildings(formattedBuildings);
          // Set first building as selected by default
          if (formattedBuildings.length > 0) {
            setSelectedBuilding(formattedBuildings[0]);
          }
        }
      } catch (err: any) {
        console.error('Error fetching buildings:', err);
        const errorMessage = err.message || 'Failed to fetch buildings';
        setError(errorMessage);
        // If network error, provide more specific error message
        if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
          setError('Network error: Could not connect to the backend server. Please check your connection.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBuildings();
  }, []);

  // Fetch analysis data when selected building changes
  useEffect(() => {
    if (selectedBuilding) {
      fetchAnalysisData();
    }
  }, [selectedBuilding, selectedMetric, dateRange]);

  // Function to fetch all analysis data for a specific building
  const fetchAnalysisData = async () => {
    if (!selectedBuilding) return;
    
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching analysis data for building:', selectedBuilding.id);
      // Fetch consumption patterns
      const patternsPromise = analysisApi.getPatterns(
        selectedBuilding.id,
        selectedMetric,
        dateRange.start,
        dateRange.end
      ).catch(err => {
        console.error('Error fetching patterns:', err);
        return { hourly_patterns: {}, daily_patterns: {}, seasonal_patterns: {}, message: 'Development feature' };
      });

      // Fetch weather correlation
      const weatherPromise = analysisApi.getWeatherCorrelation(
        selectedBuilding.id,
        selectedMetric,
        dateRange.start,
        dateRange.end
      ).catch(err => {
        console.error('Error fetching weather correlation:', err);
        return { correlations: {}, data: [], message: 'Development feature' };
      });

      // Fetch anomalies
      const anomaliesPromise = analysisApi.getAnomalies(
        selectedBuilding.id,
        dateRange.start,
        dateRange.end
      ).catch(err => {
        console.error('Error fetching anomalies:', err);
        return { anomalies: [], message: 'Development feature' };
      });

      // Wait for all promises to resolve
      const [patternsData, weatherData, anomaliesData] = await Promise.all([
        patternsPromise,
        weatherPromise,
        anomaliesPromise
      ]);

      console.log('Analysis data received:', { patterns: patternsData, weather: weatherData, anomalies: anomaliesData });

      // Check if any of the responses indicate a development feature
      if (patternsData?.message === 'Development feature' || 
          weatherData?.message === 'Development feature' || 
          anomaliesData?.message === 'Development feature') {
        setError('Some analytics features are still under development. Showing sample data for demonstration purposes.');
      }

      // Update state with fetched data
      setPatterns(patternsData);
      setWeatherCorrelation(weatherData);
      setAnomalies(anomaliesData.anomalies || []);
    } catch (err: any) {
      console.error('Error in fetchAnalysisData:', err);
      const errorMessage = err.message || 'Error fetching analysis data';
      setError(errorMessage);
      
      // If network error, provide more specific error message
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
        setError('Network error: Could not connect to the backend server. Please check your connection.');
      } else {
        // For demonstration purposes, set mock data when API fails
        setPatterns({
          hourly_patterns: generateMockHourlyPatterns(),
          daily_patterns: generateMockWeeklyPatterns(),
          seasonal_patterns: {},
          total_consumption: selectedMetric === 'electricity' ? 9500 : selectedMetric === 'water' ? 3800 : 2200,
          avg_daily_consumption: selectedMetric === 'electricity' ? 316.7 : selectedMetric === 'water' ? 126.7 : 73.3
        });
        setWeatherCorrelation({ 
          correlations: { temperature: 0.75 },
          data: generateMockWeatherData(),
          correlation_coefficient: 0.75
        });
        setAnomalies([]);
        setError('The Analytics API is under development. Showing sample data for demonstration purposes.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate mock hourly patterns for demonstration
  const generateMockHourlyPatterns = () => {
    const patterns: Record<string, number> = {};
    for (let hour = 0; hour < 24; hour++) {
      // Create a pattern that peaks during business hours
      let value = 50; // Base load
      
      // Add morning ramp-up
      if (hour >= 7 && hour < 9) {
        value += 30 * (hour - 7) + 20;
      } 
      // Business hours plateau with slight variations
      else if (hour >= 9 && hour < 17) {
        value += 80 + Math.sin((hour - 9) * 0.5) * 15;
      } 
      // Evening ramp-down
      else if (hour >= 17 && hour < 21) {
        value += 80 - 20 * (hour - 17);
      }
      
      patterns[hour] = Math.round(value);
    }
    return patterns;
  };

  // Generate mock weekly patterns for demonstration
  const generateMockWeeklyPatterns = () => {
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const patterns: Record<string, number> = {};
    
    weekdays.forEach((day, index) => {
      // Weekdays have higher consumption than weekends
      if (index < 5) {
        patterns[day] = 85 + Math.round(Math.random() * 15); 
      } else {
        patterns[day] = 40 + Math.round(Math.random() * 20);
      }
    });
    
    return patterns;
  };

  // Generate mock weather data points
  const generateMockWeatherData = () => {
    const data = [];
    const tempMin = selectedMetric === 'gas' ? -5 : 5;
    const tempMax = selectedMetric === 'gas' ? 25 : 40;
    
    for (let i = 0; i < 30; i++) {
      const temp = tempMin + Math.random() * (tempMax - tempMin);
      let consumption;
      
      if (selectedMetric === 'electricity') {
        // Higher at higher temps
        consumption = 50 + temp * 2 + (Math.random() * 30 - 15);
      } else if (selectedMetric === 'gas') {
        // Higher at lower temps
        consumption = 150 - temp * 3 + (Math.random() * 30 - 15);
      } else {
        consumption = 80 + (Math.random() * 40 - 20);
      }
      
      data.push({
        temperature: Math.round(temp),
        consumption: Math.round(consumption)
      });
    }
    
    return data.sort((a, b) => a.temperature - b.temperature);
  };

  // Handle metric change
  const handleMetricChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMetric(e.target.value);
  };

  // Handle date range changes
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  // Define chart data from patterns
  const dailyPatternsData = useMemo(() => {
    if (!patterns?.daily_patterns) return null;
    
    return {
      labels: Object.keys(patterns.daily_patterns).map((_, i: number) => getDayName(i)),
      datasets: [
        {
          label: `Average Daily ${getMetricDisplayName(selectedMetric)} Consumption`,
          data: Object.values(patterns.daily_patterns),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
      ],
    };
  }, [patterns?.daily_patterns, selectedMetric]);
  
  // Define weekly patterns chart data
  const weeklyPatternsData = useMemo((): any | null => {
    if (!patterns?.weekly_patterns) return null;
    
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: `Average Weekly ${getMetricDisplayName(selectedMetric)} Consumption`,
          data: Object.values(patterns.weekly_patterns) as number[],
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
      ],
    };
  }, [patterns?.weekly_patterns, selectedMetric]);
  
  // Define helper functions

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

  // Prepare data for hourly patterns chart
  const hourlyPatternData = {
    labels: patterns?.hourly_patterns ? Object.keys(patterns.hourly_patterns).map(hour => `${hour}:00`) : [],
    datasets: [
      {
        label: 'Average Hourly Consumption',
        data: patterns?.hourly_patterns ? Object.values(patterns.hourly_patterns) : [],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  // Prepare data for daily patterns chart
  const dailyPatternData = {
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    datasets: [
      {
        label: 'Average Daily Consumption',
        data: patterns?.daily_patterns ? 
          ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => 
            patterns.daily_patterns[day] || 0
          ) : 
          Array(7).fill(0),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };

  // Prepare data for weather correlation chart
  const weatherCorrelationData = {
    datasets: [
      {
        label: 'Consumption vs Temperature',
        data: weatherCorrelation?.data ? 
          weatherCorrelation.data.map((d: {temperature: number, consumption: number}) => ({
            x: d.temperature,
            y: d.consumption
          })) : 
          [],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        pointRadius: 5,
        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        showLine: false
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Energy Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Detailed analysis and insights on building energy consumption patterns
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <BuildingSelector 
            buildings={buildings} 
            selectedBuilding={selectedBuilding as Building} 
            onBuildingChange={setSelectedBuilding} 
          />
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <label htmlFor="start" className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              id="start"
              name="start"
              value={dateRange.start}
              onChange={handleDateChange}
              className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            />
          </div>
          <div>
            <label htmlFor="end" className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              id="end"
              name="end"
              value={dateRange.end}
              onChange={handleDateChange}
              className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            />
          </div>
        </div>
      </div>
      
      {loading && (
        <div className="text-center py-4">Loading analysis data...</div>
      )}
      
      {error && (
        <div className="text-red-500 text-center py-4">Error: {error}</div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-2">Total Consumption</h3>
          <p className="text-3xl font-bold text-indigo-600">
            {patterns?.total_consumption ? patterns.total_consumption.toLocaleString() : 'N/A'} 
            <span className="text-sm text-gray-500 ml-1">
              {selectedMetric === 'electricity' ? 'kWh' : selectedMetric === 'water' ? 'gal' : 'm³'}
            </span>
          </p>
          <p className="text-sm text-gray-500 mt-1">During selected period</p>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-2">Average Daily Usage</h3>
          <p className="text-3xl font-bold text-emerald-600">
            {patterns?.avg_daily_consumption ? patterns.avg_daily_consumption.toLocaleString() : 'N/A'}
            <span className="text-sm text-gray-500 ml-1">
              {selectedMetric === 'electricity' ? 'kWh' : selectedMetric === 'water' ? 'gal' : 'm³'}
            </span>
          </p>
          <p className="text-sm text-gray-500 mt-1">Per day average</p>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-2">Anomalies Detected</h3>
          <p className="text-3xl font-bold text-amber-600">
            {anomalies?.length || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Unusual consumption patterns</p>
        </div>
      </div>

      {/* Hourly & Daily Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4">Hourly Consumption Pattern</h3>
          <div className="h-64">
            {patterns?.hourly_patterns ? (
              <Line 
                data={hourlyPatternData}
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
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-gray-500">No hourly pattern data available</p>
              </div>
            )}
          </div>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4">Average Daily Consumption</h3>
          {patterns?.daily_patterns ? (
            <div className="h-80">
              <Bar 
                data={dailyPatternData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context: any) {
                          return `${context.parsed.y.toFixed(2)} ${
                            selectedMetric === 'electricity' ? 'kWh' : selectedMetric === 'water' ? 'gal' : 'm³'
                          }`;
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
          ) : (
            <div className="flex h-64 items-center justify-center">
              <p className="text-gray-500">No daily pattern data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Patterns */}
      <div className="card p-6">
        <h3 className="font-semibold text-lg mb-4">Average Weekly Consumption</h3>
        {patterns?.weekly_patterns ? (
          <div className="h-80">
            <Bar 
              data={weeklyPatternsData as any}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context: any) {
                        return `${context.parsed.y.toFixed(2)} ${
                          selectedMetric === 'electricity' ? 'kWh' : selectedMetric === 'water' ? 'gal' : 'm³'
                        }`;
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
        ) : (
          <div className="flex h-64 items-center justify-center">
            <p className="text-gray-500">No weekly pattern data available</p>
          </div>
        )}
      </div>

      {/* Weather Correlation */}
      <div className="card p-6">
        <h3 className="font-semibold text-lg mb-4">Weather Impact Analysis</h3>
        <div className="h-80">
          {weatherCorrelation?.data && weatherCorrelation.data.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800">Correlation Coefficient</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {weatherCorrelation.correlation_coefficient ? weatherCorrelation.correlation_coefficient.toFixed(2) : 'N/A'}
                  </p>
                  <p className="text-sm text-blue-700">
                    {Math.abs(weatherCorrelation.correlation_coefficient || 0) > 0.7 
                      ? 'Strong correlation' 
                      : Math.abs(weatherCorrelation.correlation_coefficient || 0) > 0.3 
                        ? 'Moderate correlation' 
                        : 'Weak correlation'}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800">Relationship Type</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {(weatherCorrelation.correlation_coefficient || 0) > 0 
                      ? 'Positive' 
                      : (weatherCorrelation.correlation_coefficient || 0) < 0 
                        ? 'Negative' 
                        : 'Neutral'}
                  </p>
                  <p className="text-sm text-blue-700">
                    {(weatherCorrelation.correlation_coefficient || 0) > 0 
                      ? 'Consumption increases with temperature' 
                      : (weatherCorrelation.correlation_coefficient || 0) < 0 
                        ? 'Consumption decreases with temperature' 
                        : 'No clear relationship'}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800">Suggested Action</h4>
                  <p className="text-xl font-bold text-blue-600">
                    {Math.abs(weatherCorrelation.correlation_coefficient || 0) > 0.7 
                      ? 'Optimize for weather impact' 
                      : 'Monitor relationship'}
                  </p>
                  <p className="text-sm text-blue-700">
                    {Math.abs(weatherCorrelation.correlation_coefficient || 0) > 0.7 
                      ? 'Consider weather-responsive controls' 
                      : 'Continue collecting data'}
                  </p>
                </div>
              </div>
              <div className="h-64">
                <Scatter 
                  data={weatherCorrelationData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context: any) {
                            return `Temperature: ${context.parsed.x}°C, Consumption: ${context.parsed.y} ${
                              selectedMetric === 'electricity' ? 'kWh' : selectedMetric === 'water' ? 'gal' : 'm³'
                            }`;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Temperature (°C)'
                        }
                      },
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
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">No weather correlation data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Anomalies List */}
      <div className="card p-6">
        <h3 className="font-semibold text-lg mb-4">Detected Anomalies</h3>
        {anomalies && anomalies.length > 0 ? (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Timestamp</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Expected Value</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actual Value</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Deviation (%)</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {anomalies.map((anomaly, index) => (
                  <tr key={index}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">{anomaly.timestamp}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{anomaly.expected_value ? anomaly.expected_value.toLocaleString() : 'N/A'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{anomaly.actual_value ? anomaly.actual_value.toLocaleString() : 'N/A'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {(anomaly.expected_value && anomaly.actual_value) ? 
                        ((anomaly.actual_value - anomaly.expected_value) / anomaly.expected_value * 100).toFixed(1) + '%' : 
                        'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        anomaly.severity === 'high' ? 'bg-red-100 text-red-800' : 
                        anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {anomaly.severity ? (anomaly.severity.charAt(0).toUpperCase() + anomaly.severity.slice(1)) : 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No anomalies detected in the selected period</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics; 