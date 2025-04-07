import React, { ReactNode } from 'react';

interface EnergyUsageCardProps {
  title: string;
  currentUsage: number;
  unit: string;
  change: number;
  period: string;
  icon: ReactNode;
}

const EnergyUsageCard: React.FC<EnergyUsageCardProps> = ({
  title,
  currentUsage,
  unit,
  change,
  period,
  icon,
}) => {
  const isPositiveChange = change < 0;
  const formattedChange = Math.abs(change).toFixed(1);
  
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <div className="p-2 rounded-full bg-primary-100 text-primary-600">
          {icon}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-baseline">
          <span className="text-2xl font-bold text-gray-900">{currentUsage.toLocaleString()}</span>
          <span className="ml-1 text-gray-500">{unit}</span>
        </div>
        
        <div className="flex items-center">
          <div className={`flex items-center ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
            <span className="inline-flex items-center mr-1">
              {isPositiveChange ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              )}
            </span>
            <span className="font-medium">{formattedChange}%</span>
          </div>
          <span className="ml-1 text-sm text-gray-500">{period}</span>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              currentUsage > 300 ? 'bg-red-500' : 
              currentUsage > 250 ? 'bg-yellow-500' : 
              'bg-green-500'
            }`} 
            style={{ width: `${Math.min(100, (currentUsage / 400) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">0 {unit}</span>
          <span className="text-xs text-gray-500">400 {unit}</span>
        </div>
      </div>
    </div>
  );
};

export default EnergyUsageCard; 