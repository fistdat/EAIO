import React, { useState, useEffect } from 'react';
import { buildingApi, analysisApi } from '../../services/api/exports';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#9370DB', '#20B2AA'];

interface SummaryMetrics {
  total_buildings: number;
  total_energy_consumption: number;
  total_water_consumption: number;
  total_gas_consumption: number;
  total_cost: number;
  carbon_emissions: number;
  energy_savings_mtd: number;
  energy_savings_ytd: number;
}

interface BuildingType {
  type: string;
  count: number;
  energy_consumption: number;
}

interface MonthlyCost {
  month: string;
  electricity: number;
  water: number;
  gas: number;
  total: number;
}

interface EfficiencyTrend {
  month: string;
  value: number;
  target: number;
  previous_year: number;
}

const ExecutiveDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics | null>(null);
  const [buildingTypes, setBuildingTypes] = useState<BuildingType[]>([]);
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([]);
  const [efficiencyTrend, setEfficiencyTrend] = useState<EfficiencyTrend[]>([]);
  const [savingsOpportunities, setSavingsOpportunities] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'year'>('month');
  
  useEffect(() => {
    fetchDashboardData();
  }, [timeframe]);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch executive summary
      const summaryPromise = buildingApi.getPortfolioSummary()
        .catch(err => {
          console.error('Lỗi khi lấy tổng quan danh mục:', err);
          return null;
        });
      
      // Fetch building type distribution
      const buildingTypesPromise = buildingApi.getBuildingTypeDistribution()
        .catch(err => {
          console.error('Lỗi khi lấy phân bố loại tòa nhà:', err);
          return { types: [] };
        });
      
      // Fetch monthly cost data
      const costsPromise = analysisApi.getPortfolioCosts(timeframe)
        .catch(err => {
          console.error('Lỗi khi lấy chi phí danh mục:', err);
          return { costs: [] };
        });
      
      // Fetch efficiency trend
      const efficiencyPromise = analysisApi.getPortfolioEfficiencyTrend(timeframe)
        .catch(err => {
          console.error('Lỗi khi lấy xu hướng hiệu suất:', err);
          return { trend: [] };
        });
      
      // Fetch savings opportunities
      const savingsPromise = analysisApi.getPortfolioSavingsOpportunities()
        .catch(err => {
          console.error('Lỗi khi lấy cơ hội tiết kiệm:', err);
          return { opportunities: [] };
        });
      
      // Wait for all promises to resolve
      const [summary, types, costs, efficiency, savings] = await Promise.all([
        summaryPromise,
        buildingTypesPromise,
        costsPromise,
        efficiencyPromise,
        savingsPromise
      ]);
      
      // Update state
      if (summary) {
        setSummaryMetrics(summary);
      }
      
      setBuildingTypes(types.types || []);
      setMonthlyCosts(costs.costs || []);
      setEfficiencyTrend(efficiency.trend || []);
      setSavingsOpportunities(savings.opportunities || []);
      
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lấy dữ liệu tổng quan');
      console.error('Lỗi trong fetchDashboardData:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format large numbers
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };
  
  // Calculate percentage change
  const calculatePercentChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };
  
  // Format as percentage
  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };
  
  if (loading) {
    return <div className="text-center py-10">Đang tải dữ liệu tổng quan...</div>;
  }
  
  if (error) {
    return <div className="text-red-500 text-center py-10">Lỗi: {error}</div>;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan Dành cho Điều hành</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tổng quan hiệu suất năng lượng toàn bộ danh mục tòa nhà
        </p>
      </div>
      
      {/* Time frame selector */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setTimeframe('month')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              timeframe === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Tháng
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('quarter')}
            className={`px-4 py-2 text-sm font-medium ${
              timeframe === 'quarter'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border-t border-b border-gray-300 hover:bg-gray-50'
            }`}
          >
            Quý
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('year')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              timeframe === 'year'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Năm
          </button>
        </div>
      </div>
      
      {/* Summary metrics */}
      {summaryMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tổng số tòa nhà</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(summaryMetrics.total_buildings)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tổng năng lượng</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(summaryMetrics.total_energy_consumption)} kWh</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tổng chi phí</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summaryMetrics.total_cost)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Khí thải carbon</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(summaryMetrics.carbon_emissions)} kg</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tiết kiệm trong tháng</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summaryMetrics.energy_savings_mtd)}
                  <span className="text-sm font-medium text-green-600 ml-2">
                    {formatPercent(calculatePercentChange(summaryMetrics.energy_savings_mtd, 0))}
                  </span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tiết kiệm trong năm</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summaryMetrics.energy_savings_ytd)}
                  <span className="text-sm font-medium text-green-600 ml-2">
                    {formatPercent(calculatePercentChange(summaryMetrics.energy_savings_ytd, 0))}
                  </span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Hiệu suất năng lượng</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                  <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">0</span>
                  <span className="text-xs text-gray-500">Mục tiêu: 85%</span>
                  <span className="text-xs text-gray-500">100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Building Type Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Phân bố Loại tòa nhà</h2>
          {buildingTypes.length > 0 ? (
            <div className="flex">
              <div style={{ width: '50%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={buildingTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="type"
                      label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {buildingTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend layout="vertical" verticalAlign="middle" align="right" />
                    <Tooltip formatter={(value, name) => [`${value} tòa nhà`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '50%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={buildingTypes}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="type" type="category" tick={{ fontSize: 12 }} width={100} />
                    <Tooltip formatter={(value) => [`${value.toLocaleString()} kWh`, 'Tiêu thụ']} />
                    <Bar dataKey="energy_consumption" fill="#82ca9d" name="Tiêu thụ năng lượng" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              <p>Không có dữ liệu phân bố loại tòa nhà</p>
            </div>
          )}
        </div>
        
        {/* Monthly Costs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Chi phí theo {timeframe === 'month' ? 'Tháng' : timeframe === 'quarter' ? 'Quý' : 'Năm'}</h2>
          {monthlyCosts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={monthlyCosts}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                <Legend />
                <Bar dataKey="electricity" stackId="a" fill="#8884d8" name="Điện" />
                <Bar dataKey="water" stackId="a" fill="#82ca9d" name="Nước" />
                <Bar dataKey="gas" stackId="a" fill="#ffc658" name="Gas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>Không có dữ liệu chi phí</p>
            </div>
          )}
        </div>
        
        {/* Efficiency Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Xu hướng Hiệu suất</h2>
          {efficiencyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={efficiencyTrend}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, '']} />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#8884d8" name="Hiệu suất" />
                <Line type="monotone" dataKey="target" stroke="#82ca9d" name="Mục tiêu" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="previous_year" stroke="#ffc658" name="Năm trước" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <p>Không có dữ liệu xu hướng hiệu suất</p>
            </div>
          )}
        </div>
        
        {/* Savings Opportunities */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cơ hội Tiết kiệm</h2>
          {savingsOpportunities.length > 0 ? (
            <div className="overflow-y-auto max-h-[300px]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiết kiệm tiềm năng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tòa nhà</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROI</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {savingsOpportunities.map((opportunity, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {opportunity.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(opportunity.potential_savings)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {opportunity.building_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          opportunity.roi > 30 ? 'bg-green-100 text-green-800' : 
                          opportunity.roi > 15 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {opportunity.roi}%
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Không có dữ liệu cơ hội tiết kiệm</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;