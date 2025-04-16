import React, { useState, useEffect } from 'react';
import BuildingSelector from '../../components/common/BuildingSelector';
import EnhancedConsumptionChart from '../../components/dashboard/charts/EnhancedConsumptionChart';
import { buildingApi, analysisApi, forecastApi, weatherApi } from '../../services/api/exports';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Building {
  id: string; 
  name: string;
  location: string;
  type: string;
  size?: number;
  floors?: number;
  built_year?: number;
  energy_sources?: string[];
  primary_use?: string;
  occupancy_hours?: string;
}

interface AnomalyData {
  id: number;
  timestamp: string;
  metric_type: string;
  actual_value: number;
  expected_value: number;
  deviation_percentage: number;
  severity: string;
  status: string;
  notes?: string;
}

const EnergyAnalystDashboard: React.FC = () => {
  // State hooks cho dữ liệu
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [consumptionData, setConsumptionData] = useState<any>({});
  const [forecastData, setForecastData] = useState<any>({});
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherImpactData, setWeatherImpactData] = useState<any>(null);
  const [showPreviousPeriod, setShowPreviousPeriod] = useState<boolean>(false);
  const [showForecast, setShowForecast] = useState<boolean>(false);
  const [efficiencyMetrics, setEfficiencyMetrics] = useState<any>(null);
  
  // Fetch buildings on component mount
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setLoading(true);
        const data = await buildingApi.getBuildings();
        if (data && Array.isArray(data)) {
          const formattedBuildings: Building[] = data.map(building => ({
            ...building,
            location: typeof building.location === 'object' && building.location !== null ? 
              ((building.location as any)?.city ? `${(building.location as any).city}, ${(building.location as any).country || ''}` : '') : 
              String(building.location || '')
          }));
          
          setBuildings(formattedBuildings);
          if (formattedBuildings.length > 0) {
            setSelectedBuilding(formattedBuildings[0]);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Không thể lấy dữ liệu tòa nhà');
        console.error('Lỗi khi lấy dữ liệu tòa nhà:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildings();
  }, []);

  // Fetch building-specific data when selected building changes
  useEffect(() => {
    if (selectedBuilding) {
      fetchBuildingData(selectedBuilding.id, timeRange);
    }
  }, [selectedBuilding, timeRange]);

  // Hàm lấy khoảng thời gian dựa trên timeRange
  const getDateRange = (range: 'day' | 'week' | 'month' | 'year') => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch(range) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  // Function to fetch all data for a specific building
  const fetchBuildingData = async (buildingId: string, range: 'day' | 'week' | 'month' | 'year') => {
    setLoading(true);
    setError(null);

    try {
      const dateRange = getDateRange(range);
      
      // Fetch consumption data for electricity, water, gas
      const metrics = ['electricity', 'water', 'gas'];
      const consumptionPromises = metrics.map(metric => 
        buildingApi.getBuildingConsumption(buildingId, metric, new Date(dateRange.start), new Date(dateRange.end))
          .catch(err => {
            console.error(`Lỗi khi lấy dữ liệu tiêu thụ ${metric}:`, err);
            return { data: [] };
          })
      );
      
      // Fetch forecast data
      const forecastPromises = metrics.map(metric => 
        forecastApi.getForecast(buildingId, metric as any, new Date().toISOString().split('T')[0], 7)
          .catch(err => {
            console.error(`Lỗi khi lấy dự báo ${metric}:`, err);
            return { data: [] };
          })
      );
      
      // Fetch anomalies
      const anomaliesPromise = analysisApi.getDetailedAnomalies(
        buildingId,
        dateRange.start,
        dateRange.end
      )
        .catch(err => {
          console.error('Lỗi khi lấy chi tiết bất thường:', err);
          return { anomalies: [] };
        });
      
      // Fetch weather data
      const weatherPromise = weatherApi.getWeatherData(
        buildingId, 
        new Date(dateRange.start), 
        new Date(dateRange.end)
      )
        .catch(err => {
          console.error('Lỗi khi lấy dữ liệu thời tiết:', err);
          return [];
        });
      
      // Fetch weather impact - xử lý tạm thời nếu không có API này
      const weatherImpactPromise = Promise.resolve({
        temperature_impact: 0.65,
        humidity_impact: 0.25,
        seasonality: 0.4
      }).catch((err: any) => {
        console.error('Lỗi khi lấy tác động thời tiết:', err);
        return null;
      });
      
      // Fetch efficiency metrics
      const efficiencyPromise = analysisApi.getEfficiencyMetrics(buildingId)
        .catch(err => {
          console.error('Lỗi khi lấy số liệu hiệu suất:', err);
          return null;
        });

      // Wait for all promises to resolve
      const [
        electricityData, 
        waterData, 
        gasData, 
        electricityForecast, 
        waterForecast, 
        gasForecast, 
        anomaliesData, 
        weatherResult, 
        impactData,
        efficiencyData
      ] = await Promise.all([
        ...consumptionPromises, 
        ...forecastPromises, 
        anomaliesPromise, 
        weatherPromise, 
        weatherImpactPromise,
        efficiencyPromise
      ]);

      // Update state with fetched data
      setConsumptionData({
        electricity: electricityData,
        water: waterData,
        gas: gasData
      });
      
      setForecastData({
        electricity: electricityForecast,
        water: waterForecast,
        gas: gasForecast
      });
      
      setAnomalies(anomaliesData.anomalies || []);
      setWeatherData(weatherResult);
      setWeatherImpactData(impactData);
      setEfficiencyMetrics(efficiencyData);
      
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lấy dữ liệu tòa nhà');
      console.error('Lỗi trong fetchBuildingData:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Chuyển đổi dữ liệu thời tiết cho biểu đồ
  const prepareWeatherChart = () => {
    if (!weatherData || !weatherData.data || weatherData.data.length === 0) {
      return [];
    }
    
    return weatherData.data.map((item: any) => ({
      date: new Date(item.date).toLocaleDateString('vi-VN'),
      temperature: item.temperature,
      humidity: item.humidity * 100, // Chuyển đổi từ tỷ lệ thành phần trăm
      precipitation: item.precipitation * 10 // Scale để dễ nhìn trên biểu đồ
    }));
  };
  
  // Chuyển đổi dữ liệu hiệu suất cho biểu đồ
  const prepareEfficiencyChart = () => {
    if (!efficiencyMetrics || !efficiencyMetrics.monthly_efficiency) {
      return [];
    }
    
    return efficiencyMetrics.monthly_efficiency.map((item: any) => ({
      month: item.month,
      efficiency: item.value,
      benchmark: item.benchmark || 0
    }));
  };

  // Loading state
  if (loading && !selectedBuilding) {
    return <div className="text-center py-10">Đang tải dữ liệu tòa nhà...</div>;
  }

  // Error state
  if (error && !selectedBuilding) {
    return <div className="text-red-500 text-center py-10">Lỗi: {error}</div>;
  }

  // If no buildings are available
  if (buildings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Không tìm thấy dữ liệu tòa nhà</h2>
        <p className="text-gray-600 max-w-md">
          Không có dữ liệu tòa nhà trong cơ sở dữ liệu. 
          Vui lòng kiểm tra kết nối đến cơ sở dữ liệu hoặc thêm dữ liệu tòa nhà vào hệ thống.
        </p>
      </div>
    );
  }
  
  // Prepare weather chart data
  const weatherChartData = prepareWeatherChart();
  
  // Prepare efficiency chart data
  const efficiencyChartData = prepareEfficiencyChart();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phân tích Năng lượng</h1>
          <p className="mt-1 text-sm text-gray-500">
            Phân tích chi tiết và hiệu suất năng lượng theo thời gian
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
      
      {loading && (
        <div className="text-center py-4">Đang tải dữ liệu tòa nhà...</div>
      )}
      
      {error && (
        <div className="text-red-500 text-center py-4">Lỗi: {error}</div>
      )}
      
      {/* Controls cho biểu đồ */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Tiêu thụ Năng lượng Chi tiết</h2>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-md overflow-hidden border border-gray-300">
              <button
                onClick={() => setTimeRange('day')}
                className={`px-3 py-1 ${timeRange === 'day' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Ngày
              </button>
              <button
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1 ${timeRange === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Tuần
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1 ${timeRange === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Tháng
              </button>
              <button
                onClick={() => setTimeRange('year')}
                className={`px-3 py-1 ${timeRange === 'year' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Năm
              </button>
            </div>
            
            <div className="flex gap-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showPreviousPeriod}
                  onChange={(e) => setShowPreviousPeriod(e.target.checked)}
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                So sánh với kỳ trước
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showForecast}
                  onChange={(e) => setShowForecast(e.target.checked)}
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Hiện dự báo
              </label>
            </div>
          </div>
        </div>
        
        <EnhancedConsumptionChart 
          electricityData={consumptionData.electricity?.data || []}
          waterData={consumptionData.water?.data || []}
          gasData={consumptionData.gas?.data || []}
          forecastData={showForecast ? forecastData.electricity?.data : []}
          previousPeriodData={showPreviousPeriod ? [] : []}
          showPreviousPeriod={showPreviousPeriod}
          showForecast={showForecast}
          dateRange={timeRange}
        />
      </div>
      
      {/* Weather Impact Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tác động Thời tiết</h2>
          
          <div className="mb-4">
            <h3 className="text-md font-medium text-gray-800">Tóm tắt</h3>
            <div className="mt-2 text-gray-700">
              {weatherImpactData ? (
                <div className="space-y-2">
                  <p>Tác động đến tiêu thụ điện: <span className="font-medium">{weatherImpactData.electricity_impact.toFixed(2)}%</span></p>
                  <p>Hệ số tương quan: <span className="font-medium">{weatherImpactData.correlation_coefficient.toFixed(2)}</span></p>
                  <p>Yếu tố ảnh hưởng chính: <span className="font-medium">{weatherImpactData.primary_factor || 'Nhiệt độ'}</span></p>
                </div>
              ) : (
                <p>Không có dữ liệu tác động thời tiết</p>
              )}
            </div>
          </div>
          
          {weatherChartData.length > 0 && (
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-2">Dữ liệu Thời tiết</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weatherChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="temp" orientation="left" label={{ value: '°C', position: 'insideLeft' }} />
                  <YAxis yAxisId="humid" orientation="right" label={{ value: '%', position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="temp" type="monotone" dataKey="temperature" name="Nhiệt độ" stroke="#ff7300" />
                  <Line yAxisId="humid" type="monotone" dataKey="humidity" name="Độ ẩm" stroke="#387908" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hiệu suất Năng lượng</h2>
          
          {efficiencyMetrics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Điểm Hiệu suất Năng lượng</p>
                  <p className="text-2xl font-bold text-gray-900">{efficiencyMetrics.energy_performance_score}</p>
                  <p className="text-xs text-gray-600">
                    {efficiencyMetrics.energy_performance_score >= 75 ? 'Tuyệt vời' : 
                     efficiencyMetrics.energy_performance_score >= 50 ? 'Tốt' : 'Cần cải thiện'}
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Tiêu thụ trên đơn vị diện tích</p>
                  <p className="text-2xl font-bold text-gray-900">{efficiencyMetrics.energy_per_area.toFixed(1)}</p>
                  <p className="text-xs text-gray-600">kWh/m²</p>
                </div>
              </div>
              
              {efficiencyChartData.length > 0 && (
                <div>
                  <h3 className="text-md font-medium text-gray-800 mb-2">Hiệu suất theo tháng</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={efficiencyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="efficiency" name="Hiệu suất" stroke="#8884d8" />
                      <Line type="monotone" dataKey="benchmark" name="Chuẩn ngành" stroke="#82ca9d" strokeDasharray="3 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>Không có dữ liệu hiệu suất năng lượng</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Anomaly Details Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết Bất thường</h2>
        
        {anomalies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị thực</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị dự đoán</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Độ lệch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mức độ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {anomalies.map((anomaly) => (
                  <tr key={anomaly.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(anomaly.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {anomaly.metric_type === 'electricity' ? 'Điện' : 
                       anomaly.metric_type === 'water' ? 'Nước' : 
                       anomaly.metric_type === 'gas' ? 'Gas' : anomaly.metric_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {anomaly.actual_value.toLocaleString()} 
                      {anomaly.metric_type === 'electricity' ? 'kWh' : 
                       anomaly.metric_type === 'water' || anomaly.metric_type === 'gas' ? 'm³' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {anomaly.expected_value.toLocaleString()} 
                      {anomaly.metric_type === 'electricity' ? 'kWh' : 
                       anomaly.metric_type === 'water' || anomaly.metric_type === 'gas' ? 'm³' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        anomaly.deviation_percentage > 20 ? 'bg-red-100 text-red-800' : 
                        anomaly.deviation_percentage > 10 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {anomaly.deviation_percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        anomaly.severity === 'high' ? 'bg-red-100 text-red-800' : 
                        anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {anomaly.severity === 'high' ? 'Cao' : 
                         anomaly.severity === 'medium' ? 'Trung bình' : 'Thấp'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        anomaly.status === 'open' ? 'bg-red-100 text-red-800' : 
                        anomaly.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {anomaly.status === 'open' ? 'Mở' : 
                         anomaly.status === 'investigating' ? 'Đang xem xét' : 
                         anomaly.status === 'resolved' ? 'Đã giải quyết' : anomaly.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Không phát hiện bất thường trong khoảng thời gian đã chọn</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnergyAnalystDashboard; 