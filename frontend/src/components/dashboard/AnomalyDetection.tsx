import React from 'react';

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

interface AnomalyDetectionProps {
  anomalies: Anomaly[];
  isLoading?: boolean;
}

const AnomalyDetection: React.FC<AnomalyDetectionProps> = ({ anomalies, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!anomalies || anomalies.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
        <p className="text-gray-500">No anomalies detected in the selected period</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Detected Anomalies</h3>
      <div className="space-y-3">
        {anomalies.map((anomaly) => (
          <div 
            key={anomaly.id} 
            className="p-4 border rounded-md shadow-sm bg-white"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{anomaly.type} in {anomaly.metric}</h4>
              <span 
                className={`px-2 py-1 text-xs rounded-full ${
                  anomaly.severity === 'High' ? 'bg-red-100 text-red-800' :
                  anomaly.severity === 'Medium' ? 'bg-amber-100 text-amber-800' :
                  'bg-blue-100 text-blue-800'
                }`}
              >
                {anomaly.severity}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{anomaly.description}</p>
            <div className="text-xs text-gray-500">
              <span>{new Date(anomaly.timestamp).toLocaleString()}</span>
              <span className="ml-4">
                Actual: <span className="font-medium">{anomaly.value.toFixed(1)}</span>, 
                Expected: <span className="font-medium">{anomaly.expectedValue.toFixed(1)}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnomalyDetection;
