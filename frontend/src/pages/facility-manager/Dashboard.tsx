import React, { useState, useEffect } from 'react';
import ConsumptionChart from '../../components/dashboard/charts/ConsumptionChart';
import EnergyUsageCard from '../../components/dashboard/EnergyUsageCard';
import AnomalyCard from '../../components/dashboard/AnomalyCard';
import RecommendationCard from '../../components/dashboard/RecommendationCard';
import BuildingSelector from '../../components/common/BuildingSelector';
import { buildingApi, analysisApi, recommendationApi } from '../../services/api/exports';

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

const FacilityManagerDashboard: React.FC = () => {
  // State hooks for data
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [consumptionData, setConsumptionData] = useState<any>({});
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>({});

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
      fetchBuildingData(selectedBuilding.id);
    }
  }, [selectedBuilding]);

  // Function to fetch all data for a specific building
  const fetchBuildingData = async (buildingId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch consumption data for electricity, water, gas
      const metrics = ['electricity', 'water', 'gas'];
      const consumptionPromises = metrics.map(metric => 
        buildingApi.getBuildingConsumption(buildingId, metric)
          .catch(err => {
            console.error(`Lỗi khi lấy dữ liệu tiêu thụ ${metric}:`, err);
            return { data: [] };
          })
      );
      
      // Fetch recommendations
      const recommendationsPromise = recommendationApi.getBuildingRecommendations(buildingId)
        .catch(err => {
          console.error('Lỗi khi lấy khuyến nghị:', err);
          return { items: [] };
        });
      
      // Fetch anomalies
      const anomaliesPromise = analysisApi.getAnomalies(
        buildingId,
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      )
        .catch(err => {
          console.error('Lỗi khi lấy bất thường:', err);
          return { anomalies: [] };
        });
        
      // Fetch maintenance alerts - specific for facility managers
      const maintenanceAlertsPromise = buildingApi.getBuildingMaintenanceAlerts(buildingId)
        .catch(err => {
          console.error('Lỗi khi lấy cảnh báo bảo trì:', err);
          return { alerts: [] };
        });
        
      // Fetch operational status - specific for facility managers
      const systemStatusPromise = buildingApi.getBuildingSystemStatus(buildingId)
        .catch(err => {
          console.error('Lỗi khi lấy trạng thái hệ thống:', err);
          return { 
            hvac: { status: 'unknown', efficiency: 0 },
            lighting: { status: 'unknown', efficiency: 0 },
            water: { status: 'unknown', efficiency: 0 }
          };
        });

      // Wait for all promises to resolve
      const [electricityData, waterData, gasData, recommendationsData, anomaliesData, maintenanceData, statusData] = 
        await Promise.all([
          ...consumptionPromises, 
          recommendationsPromise, 
          anomaliesPromise,
          maintenanceAlertsPromise,
          systemStatusPromise
        ]);

      // Update state with fetched data
      setConsumptionData({
        electricity: electricityData,
        water: waterData,
        gas: gasData
      });
      
      setRecommendations(recommendationsData.items || []);
      setAnomalies(anomaliesData.anomalies || []);
      setMaintenanceAlerts(maintenanceData.alerts || []);
      setSystemStatus(statusData || {});
      
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lấy dữ liệu tòa nhà');
      console.error('Lỗi trong fetchBuildingData:', err);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for energy usage cards
  const getLatestConsumptionValue = (metric: string) => {
    if (!consumptionData[metric] || !consumptionData[metric].data || consumptionData[metric].data.length === 0) {
      return { value: 0, change: 0 };
    }
    
    const data = consumptionData[metric].data;
    const latestValue = data[data.length - 1]?.value || 0;
    const previousValue = data.length > 1 ? data[data.length - 2]?.value : latestValue;
    const change = previousValue === 0 ? 0 : ((latestValue - previousValue) / previousValue) * 100;
    
    return { value: latestValue, change };
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

  // Get consumption data for cards
  const electricityData = getLatestConsumptionValue('electricity');
  const waterData = getLatestConsumptionValue('water');
  const gasData = getLatestConsumptionValue('gas');

  // Format recommendations for display
  const formattedRecommendations = recommendations.map(rec => ({
    id: rec.id,
    title: rec.title,
    description: rec.description,
    impact: rec.priority,
    savings: `${rec.potential_savings.toLocaleString()} kWh`,
    difficultyLevel: rec.implementation_cost
  })).slice(0, 3); // Limit to top 3 recommendations for facility managers

  // Format anomalies for display
  const formattedAnomalies = anomalies.map((anomaly, index) => ({
    id: index,
    title: `Phát hiện bất thường: ${anomaly.timestamp}`,
    description: `Giá trị tiêu thụ ${anomaly.actual_value} kWh (Dự đoán: ${anomaly.expected_value} kWh)`,
    timeDetected: anomaly.timestamp,
    severity: anomaly.severity
  }));
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Cơ sở vật chất</h1>
          <p className="mt-1 text-sm text-gray-500">
            Giám sát và tối ưu hóa tiêu thụ năng lượng, theo dõi trạng thái vận hành của thiết bị
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
      
      {/* Operational Status - Specific for facility managers */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái vận hành</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`rounded-lg p-4 ${systemStatus.hvac?.status === 'normal' ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${systemStatus.hvac?.status === 'normal' ? 'text-green-500' : 'text-yellow-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="ml-4">
                  <h3 className="text-md font-medium">Hệ thống HVAC</h3>
                  <p className={`${systemStatus.hvac?.status === 'normal' ? 'text-green-700' : 'text-yellow-700'}`}>
                    {systemStatus.hvac?.status === 'normal' ? 'Đang hoạt động bình thường' : 'Cần kiểm tra'}
                  </p>
                  <p className="text-sm text-gray-600">Hiệu suất: {systemStatus.hvac?.efficiency || 0}%</p>
                </div>
              </div>
            </div>
            
            <div className={`rounded-lg p-4 ${systemStatus.lighting?.status === 'normal' ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${systemStatus.lighting?.status === 'normal' ? 'text-green-500' : 'text-yellow-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div className="ml-4">
                  <h3 className="text-md font-medium">Hệ thống Chiếu sáng</h3>
                  <p className={`${systemStatus.lighting?.status === 'normal' ? 'text-green-700' : 'text-yellow-700'}`}>
                    {systemStatus.lighting?.status === 'normal' ? 'Đang hoạt động bình thường' : 'Cần kiểm tra'}
                  </p>
                  <p className="text-sm text-gray-600">Hiệu suất: {systemStatus.lighting?.efficiency || 0}%</p>
                </div>
              </div>
            </div>
            
            <div className={`rounded-lg p-4 ${systemStatus.water?.status === 'normal' ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${systemStatus.water?.status === 'normal' ? 'text-green-500' : 'text-yellow-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <div className="ml-4">
                  <h3 className="text-md font-medium">Hệ thống Nước</h3>
                  <p className={`${systemStatus.water?.status === 'normal' ? 'text-green-700' : 'text-yellow-700'}`}>
                    {systemStatus.water?.status === 'normal' ? 'Đang hoạt động bình thường' : 'Cần kiểm tra'}
                  </p>
                  <p className="text-sm text-gray-600">Hiệu suất: {systemStatus.water?.efficiency || 0}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Maintenance Alerts - Specific for facility managers */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cảnh báo bảo trì</h2>
          {maintenanceAlerts.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {maintenanceAlerts.map((alert, index) => (
                <div key={index} className={`py-4 ${alert.priority === 'high' ? 'bg-red-50' : alert.priority === 'medium' ? 'bg-yellow-50' : 'bg-blue-50'}`}>
                  <div className="flex items-start">
                    <div className={`rounded-full p-2 mr-4 ${
                      alert.priority === 'high' ? 'bg-red-100 text-red-600' : 
                      alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">{alert.title}</h3>
                      <p className="text-gray-700">{alert.description}</p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Báo cáo ngày: {new Date(alert.reported_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Không có cảnh báo bảo trì nào tại thời điểm này.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Energy Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EnergyUsageCard 
          title="Điện" 
          currentUsage={electricityData.value} 
          unit="kWh" 
          change={electricityData.change} 
          period="so với trước đó"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <EnergyUsageCard 
          title="Nước" 
          currentUsage={waterData.value} 
          unit="m³" 
          change={waterData.change} 
          period="so với trước đó"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          }
        />
        <EnergyUsageCard 
          title="Gas" 
          currentUsage={gasData.value} 
          unit="m³" 
          change={gasData.change} 
          period="so với trước đó"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          }
        />
      </div>
      
      {/* Consumption Chart */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tiêu thụ Năng lượng theo Thời gian</h2>
          <ConsumptionChart 
            data={
              (consumptionData.electricity?.data || []).map((item: any, index: number) => ({
                timestamp: item.timestamp || new Date().toISOString(),
                electricity: item.value || 0,
                water: (consumptionData.water?.data && consumptionData.water.data[index]?.value) || 0,
                gas: (consumptionData.gas?.data && consumptionData.gas.data[index]?.value) || 0
              }))
            }
          />
        </div>
      </div>
      
      {/* Anomalies and Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnomalyCard anomalies={formattedAnomalies.slice(0, 3)} /> {/* Show only top 3 anomalies */}
        <RecommendationCard recommendations={formattedRecommendations} />
      </div>
    </div>
  );
};

export default FacilityManagerDashboard; 