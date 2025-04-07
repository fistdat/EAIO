import React, { useState, useEffect } from 'react';
import { buildingApi, analysisApi, recommendationApi } from '../services/api';
import BuildingSelector from '../components/common/BuildingSelector';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
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

// Define component
const Reports: React.FC = () => {
  // State hooks
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [reportType, setReportType] = useState<string>('monthly');
  const [reportPeriod, setReportPeriod] = useState<string>(new Date().toISOString().substring(0, 7)); // Current month in YYYY-MM format

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

  // Fetch report data when selected building changes
  useEffect(() => {
    if (selectedBuilding) {
      generateReport();
    }
  }, [selectedBuilding, reportType, reportPeriod]);

  // Generate report based on selected options
  const generateReport = async () => {
    if (!selectedBuilding) return;
    
    setLoading(true);
    setError(null);

    try {
      // Calculate date range based on report type and period
      let startDate: string, endDate: string;
      const now = new Date();
      
      if (reportType === 'monthly') {
        // Parse YYYY-MM format
        const [year, month] = reportPeriod.split('-').map(Number);
        startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month
      } else if (reportType === 'quarterly') {
        // Parse YYYY-QN format
        const [year, quarter] = reportPeriod.split('-Q').map(Number);
        const startMonth = (quarter - 1) * 3;
        startDate = new Date(year, startMonth, 1).toISOString().split('T')[0];
        endDate = new Date(year, startMonth + 3, 0).toISOString().split('T')[0]; // Last day of quarter
      } else { // annual
        // Parse YYYY format
        const year = parseInt(reportPeriod);
        startDate = `${year}-01-01`;
        endDate = `${year}-12-31`;
      }

      // Display a message to user about the mock data
      console.log('Using mock data for reports as the backend API endpoint is not yet implemented');
      setError('Report functionality is under development. Using mock data for visualization.');
      
      // Create mock data for the report instead of fetching from API
      const mockElectricityData = generateMockConsumptionData(startDate, endDate, 'electricity');
      const mockWaterData = generateMockConsumptionData(startDate, endDate, 'water');
      const mockGasData = generateMockConsumptionData(startDate, endDate, 'gas');
      
      const mockAnalysisData = {
        building_id: selectedBuilding.id,
        metric: "electricity",
        period: { start: startDate, end: endDate },
        patterns: {
          daily: {
            peak_hours: ["09:00", "18:00"],
            off_peak_hours: ["01:00", "04:00"],
            average_daily_profile: [100, 110, 105, 110, 115]
          },
          weekly: {
            highest_day: "Monday",
            lowest_day: "Sunday",
            weekday_weekend_ratio: 1.4
          },
          seasonal: {
            summer_average: 120,
            winter_average: 140,
            seasonal_variation: 16.7
          }
        }
      };
      
      const mockRecommendations = [
        {
          id: "rec-001",
          building_id: selectedBuilding.id,
          title: "Optimize HVAC Schedule",
          description: "Adjust HVAC schedules to match occupancy patterns",
          potential_savings: 1200,
          implementation_cost: "Low",
          priority: "High"
        },
        {
          id: "rec-002",
          building_id: selectedBuilding.id,
          title: "Lighting Upgrades",
          description: "Replace existing lighting with LED fixtures",
          potential_savings: 800,
          implementation_cost: "Medium",
          priority: "Medium"
        }
      ];
      
      const mockAnomalies = [
        {
          id: "anom-001",
          building_id: selectedBuilding.id,
          timestamp: new Date(startDate).toISOString(),
          metric: "electricity",
          expected_value: 120,
          actual_value: 175,
          deviation_percentage: 45.8,
          severity: "High"
        }
      ];

      // Calculate summary statistics
      const totalElectricity = mockElectricityData.reduce((sum: number, day: any) => sum + (day.value || 0), 0);
      const totalWater = mockWaterData.reduce((sum: number, day: any) => sum + (day.value || 0), 0);
      const totalGas = mockGasData.reduce((sum: number, day: any) => sum + (day.value || 0), 0);
      
      // Create a formatted report object
      const report = {
        period: {
          type: reportType,
          start: startDate,
          end: endDate
        },
        building: {
          id: selectedBuilding.id,
          name: selectedBuilding.name,
          type: selectedBuilding.type,
          size: selectedBuilding.size
        },
        consumption: {
          electricity: {
            total: totalElectricity,
            unit: 'kWh',
            data: mockElectricityData
          },
          water: {
            total: totalWater,
            unit: 'gal',
            data: mockWaterData
          },
          gas: {
            total: totalGas,
            unit: 'm³',
            data: mockGasData
          }
        },
        analysis: mockAnalysisData,
        recommendations: mockRecommendations,
        anomalies: mockAnomalies,
        estimated_savings: calculateEstimatedSavings(mockRecommendations),
        performance_score: calculatePerformanceScore(totalElectricity, selectedBuilding.size || 1000, mockAnomalies.length)
      };

      setReportData(report);
    } catch (err: any) {
      setError(err.message || 'Error generating report');
      console.error('Error in generateReport:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock consumption data
  const generateMockConsumptionData = (startDate: string, endDate: string, metric: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    
    const result = [];
    let date = new Date(start);
    
    for (let i = 0; i < days; i++) {
      // Base value depends on metric
      let baseValue = metric === 'electricity' ? 120 : metric === 'water' ? 50 : 30;
      
      // Add weekly pattern - higher on weekdays
      const dayOfWeek = date.getDay();
      const weekdayFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1.0 + (dayOfWeek / 10);
      
      // Add some randomness
      const randomFactor = 0.8 + Math.random() * 0.4;
      
      const value = Math.round(baseValue * weekdayFactor * randomFactor);
      
      result.push({
        timestamp: new Date(date).toISOString(),
        value
      });
      
      date.setDate(date.getDate() + 1);
    }
    
    return result;
  };

  // Helper function to calculate estimated savings from recommendations
  const calculateEstimatedSavings = (recommendations: any[]) => {
    const totalSavings = recommendations.reduce((sum, rec) => sum + (rec.potential_savings || 0), 0);
    return {
      electricity: totalSavings,
      cost: totalSavings * 0.12 // Assuming $0.12 per kWh
    };
  };

  // Helper function to calculate performance score (0-100)
  const calculatePerformanceScore = (consumption: number, size: number, anomalyCount: number) => {
    if (!consumption || !size) return 0;
    
    // Calculate energy use intensity (EUI)
    const eui = consumption / size; // kWh per square meter
    
    // Base score depends on EUI (lower is better)
    let score = 100 - Math.min(100, (eui / 20) * 100);
    
    // Deduct points for anomalies
    score = Math.max(0, score - (anomalyCount * 5));
    
    return Math.round(score);
  };

  // Handle report type change
  const handleReportTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setReportType(newType);
    
    // Reset period based on new report type
    if (newType === 'monthly') {
      setReportPeriod(new Date().toISOString().substring(0, 7)); // Current month (YYYY-MM)
    } else if (newType === 'quarterly') {
      const now = new Date();
      const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
      setReportPeriod(`${now.getFullYear()}-Q${currentQuarter}`); // Current quarter (YYYY-QN)
    } else if (newType === 'annual') {
      setReportPeriod(new Date().getFullYear().toString()); // Current year (YYYY)
    }
  };

  // Handle period change
  const handlePeriodChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setReportPeriod(e.target.value);
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

  // Format period for display
  const formatPeriodForDisplay = () => {
    if (!reportPeriod) return '';
    
    if (reportType === 'monthly') {
      const [year, month] = reportPeriod.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    } else if (reportType === 'quarterly') {
      const [year, quarter] = reportPeriod.split('-Q');
      return `Q${quarter} ${year}`;
    } else if (reportType === 'annual') {
      return reportPeriod;
    }
    
    return reportPeriod;
  };

  // Prepare data for distribution chart
  const consumptionDistribution = {
    labels: ['Electricity', 'Water', 'Gas'],
    datasets: [
      {
        data: [
          reportData?.consumption.electricity.total || 0,
          reportData?.consumption.water.total || 0,
          reportData?.consumption.gas.total || 0
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Prepare data for daily consumption chart
  const dailyConsumptionData = {
    labels: reportData?.consumption.electricity.data.map((d: any) => {
      const date = new Date(d.timestamp);
      return date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
    }) || [],
    datasets: [
      {
        label: 'Electricity (kWh)',
        data: reportData?.consumption.electricity.data.map((d: any) => d.value) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Energy Consumption Report</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive energy consumption analysis and recommendations
          </p>
        </div>
        <div className="mt-8">
          <BuildingSelector 
            buildings={buildings} 
            selectedBuilding={selectedBuilding as Building} 
            onChange={setSelectedBuilding} 
          />
        </div>
      </div>

      {/* Report Configuration */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="report-type" className="block text-sm font-medium text-gray-700">Report Type</label>
            <select
              id="report-type"
              name="report-type"
              value={reportType}
              onChange={handleReportTypeChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="monthly">Monthly Report</option>
              <option value="quarterly">Quarterly Report</option>
              <option value="annual">Annual Report</option>
            </select>
          </div>
          <div>
            <label htmlFor="report-period" className="block text-sm font-medium text-gray-700">Report Period</label>
            {reportType === 'monthly' && (
              <input
                type="month"
                id="report-period"
                name="report-period"
                value={reportPeriod}
                onChange={handlePeriodChange}
                className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              />
            )}
            {reportType === 'quarterly' && (
              <select
                id="report-period"
                name="report-period"
                value={reportPeriod}
                onChange={handlePeriodChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value={`${new Date().getFullYear()}-Q1`}>Q1 {new Date().getFullYear()}</option>
                <option value={`${new Date().getFullYear()}-Q2`}>Q2 {new Date().getFullYear()}</option>
                <option value={`${new Date().getFullYear()}-Q3`}>Q3 {new Date().getFullYear()}</option>
                <option value={`${new Date().getFullYear()}-Q4`}>Q4 {new Date().getFullYear()}</option>
                <option value={`${new Date().getFullYear()-1}-Q4`}>Q4 {new Date().getFullYear()-1}</option>
              </select>
            )}
            {reportType === 'annual' && (
              <select
                id="report-period"
                name="report-period"
                value={reportPeriod}
                onChange={handlePeriodChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</option>
                <option value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}</option>
                <option value={(new Date().getFullYear() - 2).toString()}>{new Date().getFullYear() - 2}</option>
              </select>
            )}
          </div>
          <div className="flex items-end justify-end">
            <button 
              onClick={generateReport}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>
      
      {loading && (
        <div className="text-center py-4">Loading report data...</div>
      )}
      
      {error && (
        <div className="text-red-500 text-center py-4">Error: {error}</div>
      )}

      {/* Report Header */}
      {reportData && (
        <>
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold leading-7 text-gray-900 sm:text-2xl sm:truncate">
                  {reportData.building.name} - {formatPeriodForDisplay()} Report
                </h2>
                <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                    </svg>
                    Building Type: {reportData.building.type}
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Building Size: {reportData.building.size.toLocaleString()} m²
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Period: {reportData.period.start} to {reportData.period.end}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex-shrink-0 flex md:mt-0 md:ml-4">
                <button
                  type="button"
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          {/* Performance Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6">
              <h3 className="font-semibold text-lg mb-2">Total Electricity</h3>
              <p className="text-3xl font-bold text-indigo-600">
                {reportData.consumption.electricity.total.toLocaleString()} kWh
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Average intensity: {(reportData.consumption.electricity.total / reportData.building.size).toFixed(2)} kWh/m²
              </p>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-lg mb-2">Potential Savings</h3>
              <p className="text-3xl font-bold text-green-600">
                {reportData.estimated_savings.electricity.toLocaleString()} kWh
              </p>
              <p className="text-sm text-green-500 mt-1">
                Approximately ${reportData.estimated_savings.cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </p>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-lg mb-2">Performance Score</h3>
              <div className="flex items-center">
                <p className="text-3xl font-bold text-blue-600">
                  {reportData.performance_score}/100
                </p>
                <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  reportData.performance_score >= 80 ? 'bg-green-100 text-green-800' :
                  reportData.performance_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {reportData.performance_score >= 80 ? 'Excellent' :
                   reportData.performance_score >= 60 ? 'Good' :
                   reportData.performance_score >= 40 ? 'Average' :
                   'Poor'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Based on energy intensity and anomalies
              </p>
            </div>
          </div>

          {/* Consumption Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-semibold text-lg mb-4">Consumption Distribution</h3>
              <div className="h-64">
                <Doughnut 
                  data={consumptionDistribution}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.raw as number;
                            const total = (context.dataset.data as number[]).reduce((a, b) => (a as number) + (b as number), 0);
                            const percentage = Math.round(value / (total as number) * 100);
                            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-lg mb-4">Daily Consumption Trend</h3>
              <div className="h-64">
                <Bar 
                  data={dailyConsumptionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'kWh'
                        }
                      },
                      x: {
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Recommendations Section */}
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-4">Top Recommendations</h3>
            {reportData.recommendations.length > 0 ? (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Recommendation</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Impact</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Potential Savings</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Implementation Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {reportData.recommendations.slice(0, 5).map((rec: any, index: number) => (
                      <tr key={index}>
                        <td className="py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                          <div className="font-medium">{rec.title}</div>
                          <div className="text-gray-500">{rec.description}</div>
                        </td>
                        <td className="px-3 py-4 text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            rec.priority === 'high' ? 'bg-red-100 text-red-800' : 
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-green-100 text-green-800'
                          }`}>
                            {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {rec.potential_savings.toLocaleString()} kWh
                          <div className="text-xs text-green-600">${(rec.potential_savings * 0.12).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        </td>
                        <td className="px-3 py-4 text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            rec.implementation_cost === 'high' ? 'bg-red-100 text-red-800' : 
                            rec.implementation_cost === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-green-100 text-green-800'
                          }`}>
                            {rec.implementation_cost.charAt(0).toUpperCase() + rec.implementation_cost.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No recommendations available for this building</p>
              </div>
            )}
          </div>

          {/* Anomalies Section */}
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-4">Detected Anomalies</h3>
            {reportData.anomalies.length > 0 ? (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Expected Value</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actual Value</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Deviation</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {reportData.anomalies.map((anomaly: any, index: number) => (
                      <tr key={index}>
                        <td className="py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                          {new Date(anomaly.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {anomaly.expected_value.toLocaleString()} kWh
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {anomaly.actual_value.toLocaleString()} kWh
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {((anomaly.actual_value - anomaly.expected_value) / anomaly.expected_value * 100).toFixed(1)}%
                        </td>
                        <td className="px-3 py-4 text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            anomaly.severity === 'high' ? 'bg-red-100 text-red-800' : 
                            anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-green-100 text-green-800'
                          }`}>
                            {anomaly.severity.charAt(0).toUpperCase() + anomaly.severity.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No anomalies detected during this period</p>
              </div>
            )}
          </div>

          {/* Summary Section */}
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-4">Report Summary</h3>
            <p className="text-gray-700 mb-3">
              {selectedBuilding?.name} consumed a total of {reportData.consumption.electricity.total.toLocaleString()} kWh 
              of electricity during {formatPeriodForDisplay()}. The building's performance score is {reportData.performance_score}/100,
              which is considered {
                reportData.performance_score >= 80 ? 'excellent' :
                reportData.performance_score >= 60 ? 'good' :
                reportData.performance_score >= 40 ? 'average' :
                'poor'
              }.
            </p>
            {reportData.anomalies.length > 0 && (
              <p className="text-gray-700 mb-3">
                During this period, {reportData.anomalies.length} anomalies were detected, suggesting opportunities for 
                improving energy management and control systems.
              </p>
            )}
            {reportData.recommendations.length > 0 && (
              <p className="text-gray-700 mb-3">
                Implementing the top recommendations could save approximately {reportData.estimated_savings.electricity.toLocaleString()} kWh (${reportData.estimated_savings.cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})
                annually, which would significantly improve the building's energy performance.
              </p>
            )}
            <div className="mt-4 border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500">
                Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports; 