import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from '../ui/Tabs';
import { Zap, Droplet, Wind } from 'lucide-react';

interface ConsumptionData {
  timestamp: string;
  electricity: number;
  water: number;
  gas: number;
}

interface ConsumptionChartProps {
  data: ConsumptionData[];
  isLoading?: boolean;
}

const ConsumptionChart: React.FC<ConsumptionChartProps> = ({ data, isLoading = false }) => {
  const [activeMeter, setActiveMeter] = useState<'electricity' | 'water' | 'gas'>('electricity');
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-72 bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-72 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No consumption data available</p>
      </div>
    );
  }
  
  // Process data for chart
  const chartData = data.map(item => ({
    date: item.timestamp,
    formattedDate: format(new Date(item.timestamp), 'MMM dd'),
    electricity: item.electricity,
    water: item.water,
    gas: item.gas
  }));
  
  // Calculate stats for the metric
  const calculateStats = () => {
    if (data.length === 0) return { avg: 0, min: 0, max: 0, total: 0 };
    
    const values = data.map(item => item[activeMeter]);
    const total = values.reduce((sum, val) => sum + val, 0);
    const avg = total / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { avg, min, max, total };
  };
  
  const stats = calculateStats();
  
  // Get color for active meter
  const getMeterColor = () => {
    switch (activeMeter) {
      case 'electricity': return '#4F46E5'; // Indigo
      case 'water': return '#0EA5E9'; // Sky blue
      case 'gas': return '#F59E0B'; // Amber
      default: return '#4F46E5';
    }
  };
  
  // Get units for active meter
  const getMeterUnit = () => {
    switch (activeMeter) {
      case 'electricity': return 'kWh';
      case 'water': return 'm³';
      case 'gas': return 'm³';
      default: return 'units';
    }
  };
  
  // Get the appropriate icon
  const getMeterIcon = () => {
    switch (activeMeter) {
      case 'electricity': return <Zap className="h-5 w-5 mr-2" />;
      case 'water': return <Droplet className="h-5 w-5 mr-2" />;
      case 'gas': return <Wind className="h-5 w-5 mr-2" />;
      default: return <Zap className="h-5 w-5 mr-2" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Energy Consumption</h3>
        <Tabs 
          value={activeMeter}
          onValueChange={(value) => setActiveMeter(value as 'electricity' | 'water' | 'gas')}
          className="w-auto"
        >
          <TabsList>
            <TabsTrigger value="electricity" className="flex items-center">
              <Zap className="h-4 w-4 mr-1" /> Electricity
            </TabsTrigger>
            <TabsTrigger value="water" className="flex items-center">
              <Droplet className="h-4 w-4 mr-1" /> Water
            </TabsTrigger>
            <TabsTrigger value="gas" className="flex items-center">
              <Wind className="h-4 w-4 mr-1" /> Gas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Stats summary */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-white p-3 rounded-lg border shadow-sm">
          <p className="text-sm text-gray-500">Average</p>
          <p className="text-xl font-semibold">{stats.avg.toFixed(1)} {getMeterUnit()}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border shadow-sm">
          <p className="text-sm text-gray-500">Minimum</p>
          <p className="text-xl font-semibold">{stats.min.toFixed(1)} {getMeterUnit()}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border shadow-sm">
          <p className="text-sm text-gray-500">Maximum</p>
          <p className="text-xl font-semibold">{stats.max.toFixed(1)} {getMeterUnit()}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border shadow-sm">
          <p className="text-sm text-gray-500">Total Consumption</p>
          <p className="text-xl font-semibold">{stats.total.toFixed(1)} {getMeterUnit()}</p>
        </div>
      </div>
      
      {/* Main chart */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 15 }}
            >
              <defs>
                <linearGradient id={`color${activeMeter}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={getMeterColor()} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={getMeterColor()} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={(value) => `${value} ${getMeterUnit()}`}
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <Tooltip 
                formatter={(value) => [`${value} ${getMeterUnit()}`, `${activeMeter.charAt(0).toUpperCase() + activeMeter.slice(1)}`]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey={activeMeter} 
                name={activeMeter.charAt(0).toUpperCase() + activeMeter.slice(1)} 
                stroke={getMeterColor()} 
                fillOpacity={1}
                fill={`url(#color${activeMeter})`} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Consumption insight */}
      <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center">
        {getMeterIcon()}
        <div>
          <p className="font-medium">
            {activeMeter === 'electricity' ? 'Electricity consumption is 12% lower than last month' :
             activeMeter === 'water' ? 'Water usage has increased by 5% compared to last week' :
             'Gas consumption shows seasonal patterns - higher in winter months'}
          </p>
          <p className="text-sm text-gray-500">
            {activeMeter === 'electricity' ? 'Continue optimizing HVAC schedules for better results' :
             activeMeter === 'water' ? 'Consider investigating for potential leaks or usage changes' :
             'Expected behavior based on heating requirements'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConsumptionChart;
