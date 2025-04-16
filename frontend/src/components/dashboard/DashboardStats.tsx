import React from 'react';

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

interface DashboardStatsProps {
  building: Building;
  consumptionData: ConsumptionData[];
  isLoading?: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  building,
  consumptionData,
  isLoading = false
}) => {
  // Calculate summary statistics
  const calculateStats = () => {
    if (!consumptionData || consumptionData.length === 0) {
      return {
        electricity: { total: 0, avg: 0, max: 0 },
        water: { total: 0, avg: 0, max: 0 },
        gas: { total: 0, avg: 0, max: 0 }
      };
    }

    const stats = {
      electricity: {
        total: 0,
        avg: 0,
        max: 0
      },
      water: {
        total: 0,
        avg: 0,
        max: 0
      },
      gas: {
        total: 0,
        avg: 0,
        max: 0
      }
    };

    // Calculate totals and find max values
    consumptionData.forEach(data => {
      stats.electricity.total += data.electricity;
      stats.water.total += data.water;
      stats.gas.total += data.gas;

      stats.electricity.max = Math.max(stats.electricity.max, data.electricity);
      stats.water.max = Math.max(stats.water.max, data.water);
      stats.gas.max = Math.max(stats.gas.max, data.gas);
    });

    // Calculate averages
    const count = consumptionData.length;
    stats.electricity.avg = stats.electricity.total / count;
    stats.water.avg = stats.water.total / count;
    stats.gas.avg = stats.gas.total / count;

    return stats;
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="p-4 bg-white rounded-lg border shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Building Info</h3>
        <div className="mt-2 text-lg font-semibold">{building.name}</div>
        <div className="mt-1 text-xs text-gray-500">
          {building.type} • {building.area} m² • {building.floors} floors
        </div>
      </div>
      
      <div className="p-4 bg-white rounded-lg border shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Electricity</h3>
        <div className="mt-2 text-lg font-semibold">{stats.electricity.total.toFixed(1)} kWh</div>
        <div className="mt-1 text-xs text-gray-500">
          Avg: {stats.electricity.avg.toFixed(1)} kWh • Max: {stats.electricity.max.toFixed(1)} kWh
        </div>
      </div>
      
      <div className="p-4 bg-white rounded-lg border shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Water</h3>
        <div className="mt-2 text-lg font-semibold">{stats.water.total.toFixed(1)} m³</div>
        <div className="mt-1 text-xs text-gray-500">
          Avg: {stats.water.avg.toFixed(1)} m³ • Max: {stats.water.max.toFixed(1)} m³
        </div>
      </div>
      
      <div className="p-4 bg-white rounded-lg border shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Gas</h3>
        <div className="mt-2 text-lg font-semibold">{stats.gas.total.toFixed(1)} m³</div>
        <div className="mt-1 text-xs text-gray-500">
          Avg: {stats.gas.avg.toFixed(1)} m³ • Max: {stats.gas.max.toFixed(1)} m³
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
