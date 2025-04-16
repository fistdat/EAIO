import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface ForecastParametersProps {
  modelName: string;
  accuracy: string | number;
  weatherSource: string;
  trainingPeriod: string;
  className?: string;
}

const ForecastParameters: React.FC<ForecastParametersProps> = ({
  modelName,
  accuracy,
  weatherSource,
  trainingPeriod,
  className = '',
}) => {
  // Determine if using TFT model to show additional information
  const isTFT = modelName.includes('Transformer');

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Forecast Parameters</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pt-0 pb-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium text-gray-500">Forecast Model</h4>
            <p className="text-base font-medium">{modelName}</p>
            {isTFT && (
              <p className="text-xs text-gray-500 mt-1">Neural network with attention mechanism</p>
            )}
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium text-gray-500">Accuracy (MAPE)</h4>
            <p className="text-base font-medium">
              {typeof accuracy === 'number' ? `${accuracy.toFixed(1)}%` : accuracy}
            </p>
            {isTFT && (
              <p className="text-xs text-gray-500 mt-1">With quantile uncertainty estimates</p>
            )}
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium text-gray-500">Weather Source</h4>
            <p className="text-base font-medium">{weatherSource}</p>
            {isTFT && weatherSource !== 'Not Included' && (
              <p className="text-xs text-gray-500 mt-1">Temperature and humidity variables</p>
            )}
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium text-gray-500">Training Period</h4>
            <p className="text-base font-medium">{trainingPeriod}</p>
            {isTFT && (
              <p className="text-xs text-gray-500 mt-1">With 24-hour encoder context</p>
            )}
          </div>
        </div>
        
        {isTFT && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-500 mb-2">TFT Model Features</h4>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Multi-horizon forecasting with variable selection</li>
              <li>• Attention mechanism for capturing long-term dependencies</li>
              <li>• Temporal context integration (hour, day, month patterns)</li>
              <li>• Uncertainty quantification via quantile forecasts</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ForecastParameters; 