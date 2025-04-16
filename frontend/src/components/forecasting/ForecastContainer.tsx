import React, { useState, useEffect } from 'react';
import ForecastChart from './ForecastChart';
import ForecastInsights from './ForecastInsights';
import ForecastParameters from './ForecastParameters';
import KeyDrivers from './KeyDrivers';
import ScenarioAnalysis from './ScenarioAnalysis';
import { forecastApi } from '../../services/api/exports';
import { ForecastDataPoint, ForecastResult } from '../../services/api/forecastApi';
import { Loader2 } from 'lucide-react';
import { generateForecastInsights } from '../../utils/forecastUtils';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { Toggle } from '../ui/Toggle';

// Model type options
const MODEL_TYPES = [
  { value: 'tft', label: 'Temporal Fusion Transformer' },
  { value: 'prophet', label: 'Prophet' },
  { value: 'simple', label: 'Simple Forecast' }
];

interface ForecastContainerProps {
  buildingId: string;
  metric?: 'electricity' | 'water' | 'gas' | 'steam' | 'hotwater' | 'chilledwater';
  days?: number;
  className?: string;
  forecastHorizon?: number;
  horizon?: string;
  forecastType?: string;
  modelType?: string;
  includeWeather?: boolean;
  includeCalendar?: boolean;
}

const ForecastContainer: React.FC<ForecastContainerProps> = ({
  buildingId,
  metric = 'electricity',
  days = 14,
  className = '',
  forecastHorizon,
  horizon,
  modelType: initialModelType = 'tft',
  forecastType,
  includeWeather: initialIncludeWeather = true,
  includeCalendar: initialIncludeCalendar = true,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('chart');
  const [modelType, setModelType] = useState<string>(initialModelType);
  const [includeWeather, setIncludeWeather] = useState<boolean>(initialIncludeWeather);
  const [includeCalendar, setIncludeCalendar] = useState<boolean>(initialIncludeCalendar);

  useEffect(() => {
    async function fetchForecastData() {
      try {
        setLoading(true);
        setError(null);
        
        // Get current date for startDate
        const startDate = new Date().toISOString();
        
        // Fetch time series forecast using TFT model
        const forecastData = await forecastApi.getTimeSeriesForecast(
          buildingId,
          metric,
          startDate,
          days * 24, // Convert days to hours for forecast horizon
          includeWeather,
          includeCalendar,
          modelType
        );
        
        setForecast(forecastData);
      } catch (err: any) {
        console.error('Error fetching forecast data:', err);
        setError(err.message || 'Failed to fetch forecast data');
        
        // Fallback to regular forecast if TFT fails
        try {
          // Use the same startDate declaration as above
          const startDate = new Date().toISOString();
          
          const fallbackData = await forecastApi.getForecast(
            buildingId,
            metric,
            startDate,
            days,
            'daily'
          );
          setForecast(fallbackData);
        } catch (fallbackErr: any) {
          console.error('Fallback forecast also failed:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchForecastData();
  }, [buildingId, metric, days, modelType, includeWeather, includeCalendar]);

  // Prepare drivers data for the KeyDrivers component from influencingFactors
  const getDrivers = () => {
    if (!forecast?.influencingFactors) {
      if (modelType === 'tft') {
        return [
          { name: 'Temperature', influence: 45 },
          { name: 'Time of Day', influence: 25 },
          { name: 'Day of Week', influence: 15 },
          { name: 'Recent Consumption', influence: 10 },
          { name: 'Seasonality', influence: 5 },
        ];
      }
      
      return [
        { name: 'Temperature', influence: 67 },
        { name: 'Day of Week', influence: 18 },
        { name: 'Occupancy Patterns', influence: 10 },
        { name: 'Time of Day', influence: 5 },
      ];
    }
    
    return forecast.influencingFactors.map(factor => ({
      name: factor.name,
      influence: Math.round(factor.impact * 100)
    }));
  };

  // Generate insights based on forecasting data
  const getInsights = () => {
    if (!forecast?.data || forecast.data.length === 0) {
      if (modelType === 'tft') {
        return 'Our Temporal Fusion Transformer model has analyzed historical patterns, weather data, and calendar effects to generate this forecast. The model identifies key patterns across multiple time horizons while accounting for uncertainty through quantile predictions.';
      }
      
      return 'Based on historical patterns and weather forecasts, we predict a 12% increase in consumption next week due to expected high temperatures. Consider pre-cooling strategies during off-peak hours to reduce peak demand charges.';
    }
    
    return generateForecastInsights(forecast.data, metric);
  };

  // Generate scenarios for the ScenarioAnalysis component
  const getScenarios = () => {
    // Calculate total consumption from forecast data
    let baseConsumption = 24850; // Default
    
    if (forecast?.data && forecast.data.length > 0) {
      baseConsumption = Math.round(
        forecast.data.reduce((sum, point) => sum + point.value, 0)
      );
    }
    
    return [
      {
        name: 'Baseline Scenario',
        description: 'Predicted consumption',
        consumption: baseConsumption
      },
      {
        name: 'Efficiency Scenario',
        description: 'By implementing suggested optimizations',
        consumption: Math.round(baseConsumption * 0.85),
        reduction: 15
      },
      {
        name: 'Weekday Optimization',
        description: 'By optimizing operating hours',
        consumption: Math.round(baseConsumption * 0.92),
        reduction: 8
      }
    ];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-md bg-red-50 text-red-800">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Forecast Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Model Type</label>
              <select 
                className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
              >
                {MODEL_TYPES.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Include Weather Data</label>
              <Toggle
                enabled={includeWeather}
                onChange={setIncludeWeather}
                label=""
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Include Calendar Features</label>
              <Toggle
                enabled={includeCalendar}
                onChange={setIncludeCalendar}
                label=""
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="default"
                onClick={() => {
                  // Implement refresh logic here
                }}
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : 'Refresh Forecast'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <Alert variant="destructive">{error}</Alert>}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
          <span className="ml-2">Generating forecast...</span>
        </div>
      ) : forecast ? (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Forecast Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="chart">Forecast Chart</TabsTrigger>
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                  <TabsTrigger value="drivers">Key Drivers</TabsTrigger>
                  <TabsTrigger value="scenarios">Scenario Analysis</TabsTrigger>
                </TabsList>
                <TabsContent value="chart">
                  <ForecastChart 
                    data={forecast.data} 
                    title={`${metric.charAt(0).toUpperCase() + metric.slice(1)} Consumption Forecast`}
                    days={days}
                    modelType={modelType}
                  />
                </TabsContent>
                <TabsContent value="insights">
                  <ForecastInsights 
                    insights={getInsights()} 
                    modelType={modelType}
                  />
                </TabsContent>
                <TabsContent value="drivers">
                  <KeyDrivers 
                    drivers={getDrivers()} 
                  />
                </TabsContent>
                <TabsContent value="scenarios">
                  <ScenarioAnalysis 
                    scenarios={getScenarios()} 
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

export default ForecastContainer; 