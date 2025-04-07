import React from 'react';

interface WeatherImpactCardProps {
  temperature: number;
  humidity: number;
  description: string;
  impact: 'Low' | 'Medium' | 'High';
}

const WeatherImpactCard: React.FC<WeatherImpactCardProps> = ({
  temperature,
  humidity,
  description,
  impact
}) => {
  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getWeatherIcon = (temp: number): JSX.Element => {
    if (temp >= 80) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    } else if (temp <= 50) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      );
    }
  };
  
  return (
    <div className="card hover:shadow-md transition-shadow duration-300">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Weather Impact</h3>
      
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-shrink-0">
          {getWeatherIcon(temperature)}
        </div>
        <div>
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-2xl font-bold text-gray-900">{temperature}°F</span>
              <p className="text-sm text-gray-500">Temperature</p>
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-900">{humidity}%</span>
              <p className="text-sm text-gray-500">Humidity</p>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-gray-600 mb-4">{description}</p>
      
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getImpactColor(impact)}`}>
          {impact} Energy Impact
        </span>
        <button className="text-primary-600 hover:text-primary-800 text-sm font-medium">
          View Details
        </button>
      </div>
    </div>
  );
};

export default WeatherImpactCard;