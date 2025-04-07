import React, { useState, useEffect } from 'react';
import ConsumptionChart from '../components/dashboard/charts/ConsumptionChart';
import EnergyUsageCard from '../components/dashboard/EnergyUsageCard';
import AnomalyCard from '../components/dashboard/AnomalyCard';
import RecommendationCard from '../components/dashboard/RecommendationCard';
import WeatherImpactCard from '../components/dashboard/WeatherImpactCard';
import BuildingSelector from '../components/common/BuildingSelector';
import { buildingApi, analysisApi, recommendationApi, weatherApi } from '../services/api';

// Định nghĩa interface Building để đảm bảo đúng kiểu dữ liệu
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

const Dashboard: React.FC = () => {
  // State hooks for data
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [consumptionData, setConsumptionData] = useState<any>({});
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [weatherImpact, setWeatherImpact] = useState<any>(null);

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
            console.error(`Error fetching ${metric} consumption:`, err);
            return { data: [] }; // Return empty data on error
          })
      );
      
      // Fetch recommendations
      const recommendationsPromise = recommendationApi.getBuildingRecommendations(buildingId)
        .catch(err => {
          console.error('Error fetching recommendations:', err);
          return { items: [] }; // Return empty data on error
        });
      
      // Fetch anomalies
      const anomaliesPromise = analysisApi.getAnomalies(buildingId)
        .catch(err => {
          console.error('Error fetching anomalies:', err);
          return { anomalies: [] }; // Return empty data on error
        });
      
      // Fetch weather impact
      const weatherImpactPromise = weatherApi.getWeatherImpact(buildingId)
        .catch(err => {
          console.error('Error fetching weather impact:', err);
          return null; // Return null on error
        });

      // Wait for all promises to resolve
      const [electricityData, waterData, gasData, recommendationsData, anomaliesData, weatherImpactData] = 
        await Promise.all([
          ...consumptionPromises, 
          recommendationsPromise, 
          anomaliesPromise, 
          weatherImpactPromise
        ]);

      // Update state with fetched data
      setConsumptionData({
        electricity: electricityData,
        water: waterData,
        gas: gasData
      });
      
      setRecommendations(recommendationsData.items || []);
      setAnomalies(anomaliesData.anomalies || []);
      setWeatherImpact(weatherImpactData);
      
    } catch (err: any) {
      setError(err.message || 'Error fetching building data');
      console.error('Error in fetchBuildingData:', err);
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
    
    // Calculate change compared to previous value
    const previousValue = data.length > 1 ? data[data.length - 2]?.value : latestValue;
    const change = previousValue === 0 ? 0 : ((latestValue - previousValue) / previousValue) * 100;
    
    return { value: latestValue, change };
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

  // Get consumption data for cards
  const electricityData = getLatestConsumptionValue('electricity');
  const waterData = getLatestConsumptionValue('water');
  const gasData = getLatestConsumptionValue('gas');

  // Format recommendations for display
  const formattedRecommendations = recommendations.map(rec => ({
    id: rec.id,
    title: rec.title,
    description: rec.description,
    impact: rec.priority, // Map priority to impact
    savings: `${rec.potential_savings.toLocaleString()} kWh`,
    difficultyLevel: rec.implementation_cost // Map implementation cost to difficulty
  }));

  // Format anomalies for display
  const formattedAnomalies = anomalies.map((anomaly, index) => ({
    id: index,
    title: `Anomaly Detected: ${anomaly.timestamp}`,
    description: `Consumption value ${anomaly.actual_value} kWh (Expected: ${anomaly.expected_value} kWh)`,
    timeDetected: anomaly.timestamp,
    severity: anomaly.severity
  }));
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Energy Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and optimize energy consumption across your buildings
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <BuildingSelector 
            buildings={buildings} 
            selectedBuilding={selectedBuilding as Building} 
            onChange={setSelectedBuilding} 
          />
        </div>
      </div>
      
      {loading && (
        <div className="text-center py-4">Loading building data...</div>
      )}
      
      {error && (
        <div className="text-red-500 text-center py-4">Error: {error}</div>
      )}
      
      {/* Energy Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EnergyUsageCard 
          title="Electricity" 
          currentUsage={electricityData.value} 
          unit="kWh" 
          change={electricityData.change} 
          period="vs previous"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <EnergyUsageCard 
          title="Water" 
          currentUsage={waterData.value} 
          unit="gallons" 
          change={waterData.change} 
          period="vs previous"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M20 12a8 8 0 01-8 8m8-8a8 8 0 00-8-8m8 8H4" />
            </svg>
          }
        />
        <EnergyUsageCard 
          title="Gas" 
          currentUsage={gasData.value} 
          unit="therms" 
          change={gasData.change} 
          period="vs previous"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
          }
        />
      </div>
      
      {/* Consumption Chart */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Energy Consumption Trends</h2>
        <div className="h-80">
          <ConsumptionChart 
            data={consumptionData.electricity?.data || []} 
            loading={loading}
          />
        </div>
      </div>
      
      {/* Recommendations and Anomalies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Top Recommendations</h2>
          {formattedRecommendations.length > 0 ? (
            formattedRecommendations.map(recommendation => (
            <RecommendationCard key={recommendation.id} recommendation={recommendation} />
            ))
          ) : (
            <p className="text-gray-500">No recommendations available</p>
          )}
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Detected Anomalies</h2>
          {formattedAnomalies.length > 0 ? (
            formattedAnomalies.map(anomaly => (
            <AnomalyCard key={anomaly.id} anomaly={anomaly} />
            ))
          ) : (
            <p className="text-gray-500">No anomalies detected</p>
          )}
          
          <WeatherImpactCard 
            temperature={weatherImpact?.temperature || 72}
            humidity={weatherImpact?.humidity || 45}
            description={weatherImpact?.description || "Weather impact data not available"}
            impact={weatherImpact?.impact || "Unknown"}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 