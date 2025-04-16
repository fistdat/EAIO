import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import ConsumptionChart from '../components/dashboard/ConsumptionChart';
import AnomalyDetection from '../components/dashboard/AnomalyDetection';
import RecommendationList from '../components/dashboard/RecommendationList';
import DashboardStats from '../components/dashboard/DashboardStats';
import BuildingSelector from '../components/common/BuildingSelector';
import DateRangePicker from '../components/common/DateRangePicker';
import { getBuildingList, getBuildingById, getBuildingConsumptionData } from '../services/api/buildingApi';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { RefreshCw, Building, Calendar as CalendarIcon, TrendingUp, TrendingDown, AlertTriangle, Info, Droplet, Zap, Wind } from 'lucide-react';

// Define interfaces
interface Building {
  id: string; 
  name: string;
  location: string;
  type: string;
  area: number;
  floors: number;
  occupancy: number;
  constructionYear: number;
}

interface ConsumptionData {
  timestamp: string;
  electricity: number;
  water: number;
  gas: number;
}

interface Anomaly {
  id: string;
  timestamp: string;
  type: string;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  metric: string;
  value: number;
  expectedValue: number;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  potentialSavings: number;
  implementationCost: string;
  paybackPeriod: string;
  priority: 'Low' | 'Medium' | 'High';
  category: string;
}

// Main Dashboard Component
const Dashboard: React.FC = () => {
  // State hooks
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [loadingBuildings, setLoadingBuildings] = useState<boolean>(true);
  const [loadingConsumption, setLoadingConsumption] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  });
  
  const [consumptionData, setConsumptionData] = useState<ConsumptionData[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Add new state for tracking consumption trends 
  const [consumptionTrends, setConsumptionTrends] = useState<{
    electricity: { value: number; trend: 'up' | 'down' | 'stable' };
    water: { value: number; trend: 'up' | 'down' | 'stable' };
    gas: { value: number; trend: 'up' | 'down' | 'stable' };
  }>({
    electricity: { value: 0, trend: 'stable' },
    water: { value: 0, trend: 'stable' },
    gas: { value: 0, trend: 'stable' },
  });
  
  // Add state for total savings
  const [totalSavings, setTotalSavings] = useState({
    amount: 0,
    percentage: 0,
    trend: 'up' as 'up' | 'down'
  });

  // Fetch building list
  const fetchBuildingList = useCallback(async () => {
    setLoadingBuildings(true);
    setError(null);
    setFilterStatus('Loading building list...');
    
    try {
      const data = await getBuildingList();
      setBuildings(data);
      setFilterStatus(`Loaded ${data.length} buildings. Use filters to find specific buildings.`);
      
      // If this is initial load and we have buildings, select the first one
      if (data.length > 0 && !selectedBuilding) {
        await fetchBuildingById(data[0].id);
      }
    } catch (err) {
      setError('Failed to fetch building list. Please try again later.');
      setFilterStatus('Error loading buildings.');
      console.error('Error fetching building list:', err);
    } finally {
      setLoadingBuildings(false);
    }
  }, [selectedBuilding]);

  // Fetch building by ID
  const fetchBuildingById = useCallback(async (buildingId: string) => {
    setError(null);

    try {
      const data = await getBuildingById(buildingId);
      setSelectedBuilding(data);
      
      // After selecting a building, fetch its consumption data
      await fetchConsumptionData(buildingId, dateRange);
    } catch (err) {
      setError('Failed to fetch building details. Please try again later.');
      console.error('Error fetching building details:', err);
    }
  }, [dateRange]);

  // Enhanced fetch consumption data with trend calculation
  const fetchConsumptionData = useCallback(async (buildingId: string, range: { start: Date; end: Date }) => {
    setLoadingConsumption(true);
    setError(null);
    
    try {
      const data = await getBuildingConsumptionData(buildingId, range.start, range.end);
      setConsumptionData(data.consumption);
      
      // Calculate consumption trends
      calculateConsumptionTrends(data.consumption);
      
      // Calculate total savings (in a real app, this would come from the API)
      const mockSavings = {
        amount: Math.floor(Math.random() * 10000) + 5000, // Random value between 5000-15000
        percentage: Math.floor(Math.random() * 15) + 5, // Random value between 5-20%
        trend: Math.random() > 0.3 ? 'up' as 'up' : 'down' as 'down' // More likely to be 'up'
      };
      setTotalSavings(mockSavings);
      
      // Mock anomalies and recommendations based on consumption data
      generateMockAnomalies(data.consumption);
      generateMockRecommendations();
    } catch (err) {
      setError('Failed to fetch consumption data. Please try again later.');
      console.error('Error fetching consumption data:', err);
    } finally {
      setLoadingConsumption(false);
    }
  }, []);

  // Calculate consumption trends by comparing first half and second half of data period
  const calculateConsumptionTrends = (consumption: ConsumptionData[]) => {
    if (consumption.length < 4) {
      setConsumptionTrends({
        electricity: { value: 0, trend: 'stable' },
        water: { value: 0, trend: 'stable' },
        gas: { value: 0, trend: 'stable' },
      });
      return;
    }
    
    const midpoint = Math.floor(consumption.length / 2);
    const firstHalf = consumption.slice(0, midpoint);
    const secondHalf = consumption.slice(midpoint);
    
    // Calculate average for each half
    const calculateAverage = (data: ConsumptionData[], metric: 'electricity' | 'water' | 'gas') => {
      return data.reduce((sum, item) => sum + item[metric], 0) / data.length;
    };
    
    // Calculate percentage change
    const calculateTrend = (first: number, second: number): { value: number; trend: 'up' | 'down' | 'stable' } => {
      const change = ((second - first) / first) * 100;
      const trend: 'up' | 'down' | 'stable' = change > 2 ? 'up' : change < -2 ? 'down' : 'stable';
      return { value: Math.abs(Math.round(change)), trend };
    };
    
    const electricityTrend = calculateTrend(
      calculateAverage(firstHalf, 'electricity'),
      calculateAverage(secondHalf, 'electricity')
    );
    
    const waterTrend = calculateTrend(
      calculateAverage(firstHalf, 'water'),
      calculateAverage(secondHalf, 'water')
    );
    
    const gasTrend = calculateTrend(
      calculateAverage(firstHalf, 'gas'),
      calculateAverage(secondHalf, 'gas')
    );
    
    setConsumptionTrends({
      electricity: electricityTrend,
      water: waterTrend,
      gas: gasTrend,
    });
  };

  // Generate mock anomalies for demonstration
  const generateMockAnomalies = (consumption: ConsumptionData[]) => {
    if (consumption.length === 0) {
      setAnomalies([]);
      return;
    }
    
    // Create 3 random anomalies for demo purposes
    const mockAnomalies: Anomaly[] = [
      {
        id: '1',
        timestamp: consumption[Math.floor(consumption.length * 0.8)].timestamp,
        type: 'Spike',
        severity: 'High',
        description: 'Unusual electricity consumption spike detected',
        metric: 'Electricity',
        value: 45.2,
        expectedValue: 32.7,
      },
      {
        id: '2',
        timestamp: consumption[Math.floor(consumption.length * 0.5)].timestamp,
        type: 'Continuous',
        severity: 'Medium',
        description: 'Sustained higher than normal water usage detected',
        metric: 'Water',
        value: 12.8,
        expectedValue: 9.4,
      },
      {
        id: '3',
        timestamp: consumption[Math.floor(consumption.length * 0.3)].timestamp,
        type: 'Pattern Change',
        severity: 'Low',
        description: 'Unusual gas consumption pattern detected on weekend',
        metric: 'Gas',
        value: 8.3,
        expectedValue: 5.1,
      },
    ];
    
    setAnomalies(mockAnomalies);
  };

  // Generate mock recommendations for demonstration
  const generateMockRecommendations = () => {
    const mockRecommendations: Recommendation[] = [
      {
        id: '1',
        title: 'Optimize HVAC Schedule',
        description: 'Adjust HVAC operating hours to match actual building occupancy patterns.',
        potentialSavings: 12500,
        implementationCost: 'Low',
        paybackPeriod: '3-6 months',
        priority: 'High',
        category: 'Operational',
      },
      {
        id: '2',
        title: 'Install LED Lighting',
        description: 'Replace conventional lighting with energy-efficient LED fixtures in common areas.',
        potentialSavings: 8700,
        implementationCost: 'Medium',
        paybackPeriod: '12-18 months',
        priority: 'Medium',
        category: 'Equipment',
      },
      {
        id: '3',
        title: 'Fix Water Leaks',
        description: 'Repair identified water leaks in the plumbing system.',
        potentialSavings: 4300,
        implementationCost: 'Low',
        paybackPeriod: '1-3 months',
        priority: 'High',
        category: 'Maintenance',
      },
      {
        id: '4',
        title: 'Install Occupancy Sensors',
        description: 'Add motion sensors to control lighting in low-traffic areas.',
        potentialSavings: 5200,
        implementationCost: 'Medium',
        paybackPeriod: '12-15 months',
        priority: 'Medium',
        category: 'Equipment',
      },
      {
        id: '5',
        title: 'Calibrate Building Sensors',
        description: 'Recalibrate temperature and humidity sensors for more accurate readings.',
        potentialSavings: 3100,
        implementationCost: 'Low',
        paybackPeriod: '2-4 months',
        priority: 'Medium',
        category: 'Maintenance',
      },
    ];
    
    setRecommendations(mockRecommendations);
  };

  // Initial load
  useEffect(() => {
    fetchBuildingList();
  }, [fetchBuildingList]);

  // Handle building selection change
  const handleBuildingChange = (building: any) => {
    fetchBuildingById(building.id);
  };

  // Handle date range change
  const handleDateRangeChange = (range: { start: Date; end: Date }) => {
    setDateRange(range);
    if (selectedBuilding) {
      fetchConsumptionData(selectedBuilding.id, range);
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    if (selectedBuilding) {
      fetchConsumptionData(selectedBuilding.id, dateRange);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header section with building selector and date range */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Energy Dashboard</h1>
          <p className="text-gray-500">Monitor and optimize energy consumption across your buildings</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <BuildingSelector 
            buildings={buildings} 
            selectedBuilding={selectedBuilding}
            onBuildingChange={handleBuildingChange} 
            isLoading={loadingBuildings}
          />
          
          <DateRangePicker 
            value={dateRange}
            onChange={handleDateRangeChange}
            disabled={!selectedBuilding || loadingConsumption}
          />
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={loadingConsumption || !selectedBuilding}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Building overview */}
      {selectedBuilding && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                <CardTitle>{selectedBuilding.name}</CardTitle>
              </div>
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary">
                {selectedBuilding.type}
              </div>
            </div>
            <CardDescription>
              {selectedBuilding.location} • {selectedBuilding.area.toLocaleString()} m² • Built in {selectedBuilding.constructionYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Electricity trend */}
              <div className="flex items-center p-3 bg-indigo-50 rounded-lg">
                <div className="mr-3 p-2 bg-indigo-100 rounded-full">
                  <Zap className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Electricity</p>
                  <div className="flex items-center gap-1">
                    <p className="text-xl font-semibold">{consumptionTrends.electricity.value}%</p>
                    {consumptionTrends.electricity.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    ) : consumptionTrends.electricity.trend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    ) : (
                      <Info className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="text-sm">
                      {consumptionTrends.electricity.trend === 'up' ? 'Increase' : 
                       consumptionTrends.electricity.trend === 'down' ? 'Reduction' : 'Stable'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Water trend */}
              <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                <div className="mr-3 p-2 bg-blue-100 rounded-full">
                  <Droplet className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Water</p>
                  <div className="flex items-center gap-1">
                    <p className="text-xl font-semibold">{consumptionTrends.water.value}%</p>
                    {consumptionTrends.water.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    ) : consumptionTrends.water.trend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    ) : (
                      <Info className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="text-sm">
                      {consumptionTrends.water.trend === 'up' ? 'Increase' : 
                       consumptionTrends.water.trend === 'down' ? 'Reduction' : 'Stable'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Gas trend */}
              <div className="flex items-center p-3 bg-amber-50 rounded-lg">
                <div className="mr-3 p-2 bg-amber-100 rounded-full">
                  <Wind className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Gas</p>
                  <div className="flex items-center gap-1">
                    <p className="text-xl font-semibold">{consumptionTrends.gas.value}%</p>
                    {consumptionTrends.gas.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    ) : consumptionTrends.gas.trend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    ) : (
                      <Info className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="text-sm">
                      {consumptionTrends.gas.trend === 'up' ? 'Increase' : 
                       consumptionTrends.gas.trend === 'down' ? 'Reduction' : 'Stable'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <div className="w-full p-3 bg-green-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-full">
                  <TrendingDown className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Energy Savings</p>
                  <p className="text-xl font-semibold">${totalSavings.amount.toLocaleString()} ({totalSavings.percentage}%)</p>
                </div>
              </div>
              <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${totalSavings.trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {totalSavings.trend === 'up' ? 'Improved' : 'Declined'} from last period
              </div>
            </div>
          </CardFooter>
        </Card>
      )}
      
      {/* Main content */}
      <Tabs defaultValue="consumption" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="consumption">Consumption</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies {anomalies.length > 0 && `(${anomalies.length})`}</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations {recommendations.length > 0 && `(${recommendations.length})`}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="consumption">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardContent className="pt-6">
                <ConsumptionChart data={consumptionData} isLoading={loadingConsumption} />
              </CardContent>
            </Card>
            
            {selectedBuilding && (
              <Card>
                <CardContent className="pt-6">
                  <DashboardStats 
                    building={selectedBuilding}
                    consumptionData={consumptionData}
                    isLoading={loadingConsumption}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="anomalies">
          <Card>
            <CardContent className="pt-6">
              <AnomalyDetection 
                anomalies={anomalies}
                isLoading={loadingConsumption}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recommendations">
          <Card>
            <CardContent className="pt-6">
              <RecommendationList 
                recommendations={recommendations}
                isLoading={loadingConsumption}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard; 