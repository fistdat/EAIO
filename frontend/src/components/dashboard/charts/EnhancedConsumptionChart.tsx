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
  Area,
  ComposedChart,
  Bar
} from 'recharts';

interface ConsumptionDataPoint {
  timestamp: string;
  value: number;
}

export interface EnhancedConsumptionChartProps {
  electricityData: ConsumptionDataPoint[];
  waterData: ConsumptionDataPoint[];
  gasData: ConsumptionDataPoint[];
  forecastData?: ConsumptionDataPoint[];
  previousPeriodData?: ConsumptionDataPoint[];
  showPreviousPeriod?: boolean;
  showForecast?: boolean;
  dateRange?: string;
}

const EnhancedConsumptionChart: React.FC<EnhancedConsumptionChartProps> = ({
  electricityData,
  waterData,
  gasData,
  forecastData = [],
  previousPeriodData = [],
  showPreviousPeriod = false,
  showForecast = false,
  dateRange = 'weekly'
}) => {
  const [activeMetric, setActiveMetric] = useState<'electricity' | 'water' | 'gas'>('electricity');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');

  // Chuẩn bị dữ liệu cho biểu đồ
  const prepareChartData = () => {
    const getMetricData = () => {
      switch(activeMetric) {
        case 'electricity':
          return electricityData;
        case 'water':
          return waterData;
        case 'gas':
          return gasData;
        default:
          return electricityData;
      }
    };

    const currentData = getMetricData();
    
    // Tạo mảng dữ liệu với timestamp được định dạng lại
    const formattedData = currentData.map((item) => {
      const date = new Date(item.timestamp);
      const formattedDate = new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
      
      return {
        timestamp: formattedDate,
        value: item.value,
        date: date, // Lưu trữ đối tượng Date để sắp xếp
      };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Nếu hiển thị dữ liệu kỳ trước
    if (showPreviousPeriod && previousPeriodData.length > 0) {
      const formattedPreviousData = previousPeriodData.map((item) => {
        const date = new Date(item.timestamp);
        const formattedDate = new Intl.DateTimeFormat('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
        
        return {
          timestamp: formattedDate,
          previousValue: item.value,
          date: date,
        };
      }).sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Kết hợp dữ liệu hiện tại và dữ liệu kỳ trước
      return formattedData.map((current, index) => {
        const previousIndex = Math.min(index, formattedPreviousData.length - 1);
        return {
          ...current,
          previousValue: formattedPreviousData[previousIndex]?.previousValue || 0,
        };
      });
    }
    
    // Nếu hiển thị dữ liệu dự báo
    if (showForecast && forecastData.length > 0) {
      const formattedForecastData = forecastData.map((item) => {
        const date = new Date(item.timestamp);
        const formattedDate = new Intl.DateTimeFormat('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
        
        return {
          timestamp: formattedDate,
          forecastValue: item.value,
          date: date,
        };
      }).sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Tìm mốc thời gian cuối cùng trong dữ liệu hiện tại
      const lastActualDate = formattedData.length > 0 
        ? formattedData[formattedData.length - 1].date.getTime() 
        : 0;
      
      // Chỉ lấy dữ liệu dự báo cho tương lai
      const futureForecastData = formattedForecastData.filter(item => 
        item.date.getTime() > lastActualDate
      );
      
      // Kết hợp dữ liệu hiện tại và dữ liệu dự báo
      return [...formattedData, ...futureForecastData.map(forecast => ({
        timestamp: forecast.timestamp,
        forecastValue: forecast.forecastValue,
        value: null, // Không có giá trị thực tế cho tương lai
        date: forecast.date,
      }))];
    }
    
    return formattedData;
  };

  const chartData = prepareChartData();
  
  // Xác định đơn vị dựa trên loại dữ liệu
  const getMetricUnit = () => {
    switch(activeMetric) {
      case 'electricity':
        return 'kWh';
      case 'water':
        return 'm³';
      case 'gas':
        return 'm³';
      default:
        return 'kWh';
    }
  };
  
  // Định dạng số liệu trong Tooltip
  const formatValue = (value: number) => {
    return value.toLocaleString('vi-VN');
  };
  
  // Tùy chỉnh Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-md">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name === 'value' && `Thực tế: ${formatValue(entry.value)} ${getMetricUnit()}`}
              {entry.name === 'previousValue' && `Kỳ trước: ${formatValue(entry.value)} ${getMetricUnit()}`}
              {entry.name === 'forecastValue' && `Dự báo: ${formatValue(entry.value)} ${getMetricUnit()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Chọn loại biểu đồ dựa trên chartType
  const renderChart = () => {
    switch(chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" 
                tick={{ fontSize: 12 }} 
                interval="preserveStartEnd"
                tickFormatter={(value) => value.split(',')[0]}
              />
              <YAxis 
                tickFormatter={(value) => `${value}`}
                label={{ value: getMetricUnit(), angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="value" name="Tiêu thụ" fill="#8884d8" />
              {showPreviousPeriod && <Bar dataKey="previousValue" name="Kỳ trước" fill="#82ca9d" />}
              {showForecast && <Bar dataKey="forecastValue" name="Dự báo" fill="#ffc658" />}
            </ComposedChart>
          </ResponsiveContainer>
        );
        
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" 
                tick={{ fontSize: 12 }} 
                interval="preserveStartEnd"
                tickFormatter={(value) => value.split(',')[0]}
              />
              <YAxis 
                tickFormatter={(value) => `${value}`}
                label={{ value: getMetricUnit(), angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <Area type="monotone" dataKey="value" name="Tiêu thụ" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              {showPreviousPeriod && <Area type="monotone" dataKey="previousValue" name="Kỳ trước" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />}
              {showForecast && <Area type="monotone" dataKey="forecastValue" name="Dự báo" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} />}
            </ComposedChart>
          </ResponsiveContainer>
        );
        
      default: // line
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" 
                tick={{ fontSize: 12 }} 
                interval="preserveStartEnd"
                tickFormatter={(value) => value.split(',')[0]}
              />
              <YAxis 
                tickFormatter={(value) => `${value}`}
                label={{ value: getMetricUnit(), angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <Line 
                type="monotone" 
                dataKey="value" 
                name="Tiêu thụ" 
                stroke="#8884d8" 
                activeDot={{ r: 6 }} 
                strokeWidth={2}
                connectNulls
              />
              {showPreviousPeriod && (
                <Line 
                  type="monotone" 
                  dataKey="previousValue" 
                  name="Kỳ trước" 
                  stroke="#82ca9d" 
                  strokeDasharray="3 3"
                  strokeWidth={2}
                  connectNulls
                />
              )}
              {showForecast && (
                <Line 
                  type="monotone" 
                  dataKey="forecastValue" 
                  name="Dự báo" 
                  stroke="#ffc658" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  connectNulls
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center">
        <div className="space-x-2 mb-2 md:mb-0">
          <button
            onClick={() => setActiveMetric('electricity')}
            className={`px-3 py-1 rounded-md ${
              activeMetric === 'electricity' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Điện
          </button>
          <button
            onClick={() => setActiveMetric('water')}
            className={`px-3 py-1 rounded-md ${
              activeMetric === 'water' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Nước
          </button>
          <button
            onClick={() => setActiveMetric('gas')}
            className={`px-3 py-1 rounded-md ${
              activeMetric === 'gas' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Gas
          </button>
        </div>
        
        <div className="space-x-2">
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 rounded-md ${
              chartType === 'line' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Đường
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 rounded-md ${
              chartType === 'bar' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cột
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`px-3 py-1 rounded-md ${
              chartType === 'area' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Vùng
          </button>
        </div>
      </div>
      
      {renderChart()}
    </div>
  );
};

export default EnhancedConsumptionChart; 