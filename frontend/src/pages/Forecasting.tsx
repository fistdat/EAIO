import React, { useState, useEffect } from 'react';
import { buildingApi } from '../services/api/exports';
import BuildingSelector from '../components/common/BuildingSelector';
import { ForecastContainer } from '../components/forecasting';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Label } from '../components/ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Loader2 } from 'lucide-react';

// Define interface Building
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

const METRIC_OPTIONS = [
  { value: 'electricity', label: 'Electricity' },
  { value: 'gas', label: 'Gas' },
  { value: 'water', label: 'Water' },
  { value: 'steam', label: 'Steam' },
  { value: 'hotwater', label: 'Hot Water' },
  { value: 'chilledwater', label: 'Chilled Water' },
];

const FORECAST_PERIOD_OPTIONS = [
  { value: '7', label: '7 Days' },
  { value: '14', label: '14 Days' },
  { value: '30', label: '30 Days' },
];

const MODEL_TYPE_OPTIONS = [
  { value: 'tft', label: 'Temporal Fusion Transformer (TFT)' },
  { value: 'prophet', label: 'Prophet' },
  { value: 'simple', label: 'Simple Statistical Model' },
  { value: 'very_simple', label: 'Very Simple Baseline' },
];

const Forecasting: React.FC = () => {
  // State hooks
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'electricity' | 'water' | 'gas' | 'steam' | 'hotwater' | 'chilledwater'>('electricity');
  const [forecastDays, setForecastDays] = useState<number>(14);
  const [selectedModel, setSelectedModel] = useState<string>('tft');
  const [includeWeather, setIncludeWeather] = useState<boolean>(true);
  const [includeCalendar, setIncludeCalendar] = useState<boolean>(true);
  
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
        setError(err.message || 'Failed to fetch buildings');
        console.error('Error fetching buildings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildings();
  }, []);

  // Handle building selection change
  const handleBuildingChange = (building: Building) => {
    setSelectedBuilding(building);
  };

  // Handle metric selection change
  const handleMetricChange = (value: string) => {
    setSelectedMetric(value as 'electricity' | 'water' | 'gas' | 'steam' | 'hotwater' | 'chilledwater');
  };

  // Handle forecast period change
  const handleForecastPeriodChange = (value: string) => {
    setForecastDays(parseInt(value));
  };

  // Handle model selection change
  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    // Reset weather/calendar features based on model capabilities (optional)
    if (value === 'very_simple') {
      setIncludeWeather(false);
      setIncludeCalendar(false);
    } else {
      setIncludeWeather(true);
      setIncludeCalendar(true);
    }
  };
  
  const handleWeatherChange = (value: string) => {
    setIncludeWeather(value === 'true');
  };
  
  const handleCalendarChange = (value: string) => {
    setIncludeCalendar(value === 'true');
  };

  if (loading && !selectedBuilding) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Energy Consumption Forecasting</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="building-select">Building</Label>
              <BuildingSelector 
                buildings={buildings} 
                selectedBuilding={selectedBuilding}
                onBuildingChange={handleBuildingChange}
                id="building-select"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="metric-select">Energy Metric</Label>
              <Select 
                value={selectedMetric} 
                onValueChange={handleMetricChange}
              >
                <SelectTrigger id="metric-select">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {METRIC_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="period-select">Forecast Period</Label>
              <Select 
                value={forecastDays.toString()} 
                onValueChange={handleForecastPeriodChange}
              >
                <SelectTrigger id="period-select">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {FORECAST_PERIOD_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="model-select">Forecasting Model</Label>
              <Select 
                value={selectedModel} 
                onValueChange={handleModelChange}
              >
                <SelectTrigger id="model-select">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_TYPE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 mt-4">
              <Label htmlFor="weather-select">Include Weather Data</Label>
              <Select 
                value={includeWeather ? 'true' : 'false'} 
                onValueChange={handleWeatherChange}
                disabled={selectedModel === 'very_simple'}
              >
                <SelectTrigger id="weather-select">
                  <SelectValue placeholder="Weather data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 mt-4">
              <Label htmlFor="calendar-select">Include Calendar Features</Label>
              <Select 
                value={includeCalendar ? 'true' : 'false'} 
                onValueChange={handleCalendarChange}
                disabled={selectedModel === 'very_simple'}
              >
                <SelectTrigger id="calendar-select">
                  <SelectValue placeholder="Calendar features" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {selectedBuilding && (
        <ForecastContainer 
          buildingId={selectedBuilding.id}
          metric={selectedMetric}
          days={forecastDays}
          modelType={selectedModel}
          includeWeather={includeWeather}
          includeCalendar={includeCalendar}
        />
      )}
    </div>
  );
};

export default Forecasting; 
