import React, { ReactElement } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface Anomaly {
  id: number;
  title: string;
  description: string;
  timeDetected: string;
  severity: 'Low' | 'Medium' | 'High';
}

interface AnomalyCardProps {
  anomalies: Anomaly[];
}

const AnomalyCard: React.FC<AnomalyCardProps> = ({ anomalies }) => {
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getSeverityIcon = (severity: string): ReactElement => {
    switch (severity) {
      case 'High':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'Medium':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'Low':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };
  
  if (!anomalies || anomalies.length === 0) {
    return (
      <div className="card p-4 text-center">
        <p className="text-gray-500">Không có dữ liệu bất thường</p>
      </div>
    );
  }
  
  return (
    <div className="card p-4">
      <h2 className="text-xl font-semibold mb-4">Dữ liệu bất thường</h2>
      <div className="space-y-4">
        {anomalies.map((anomaly) => {
          const { id, title, description, timeDetected, severity } = anomaly;
          // Format time as "X hours/days ago"
          const timeAgo = formatDistanceToNow(new Date(timeDetected), { addSuffix: true });
          
          return (
            <div key={id} className="border-b pb-4 last:border-0 last:pb-0 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${getSeverityColor(severity)}`}>
                    {getSeverityIcon(severity)}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                    <p className="mt-1 text-gray-600">{description}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(severity)}`}>
                        {severity} Severity
                      </span>
                      <span className="text-xs text-gray-500">Detected {timeAgo}</span>
                    </div>
                  </div>
                </div>
                
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-4 flex justify-end space-x-2">
                <button className="btn bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">
                  Bỏ qua
                </button>
                <button className="btn btn-primary">
                  Kiểm tra
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnomalyCard; 