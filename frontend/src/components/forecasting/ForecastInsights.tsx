import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { InfoIcon } from 'lucide-react';

interface ForecastInsightsProps {
  insights: string;
  modelType?: string;
  className?: string;
}

const ForecastInsights: React.FC<ForecastInsightsProps> = ({
  insights,
  modelType = '',
  className = '',
}) => {
  // Default insights based on model type
  const getDefaultInsights = () => {
    switch(modelType.toLowerCase()) {
      case 'tft':
        return `Our Temporal Fusion Transformer model has analyzed historical patterns, weather data, and calendar effects to generate this forecast. The model identifies key temporal dependencies across multiple horizons while accounting for uncertainty through quantile predictions. The uncertainty range widens in future periods to reflect increasing prediction difficulty.`;
      case 'prophet':
        return `The Prophet forecast model has been applied to generate this prediction. Prophet excels at capturing seasonality patterns, holiday effects, and trend changes. It provides a decomposable view of the forecast, with confidence intervals that reflect forecast uncertainty.`;
      case 'simple':
        return `This forecast is generated using a simple statistical model based on historical patterns and basic seasonality. It provides a reasonable baseline for short-term forecasting with moderate uncertainty ranges.`;
      case 'very_simple':
        return `This basic forecast uses simple averaging and daily patterns to generate predictions. It serves as a baseline reference but may not capture complex patterns or external influencing factors.`;
      default:
        return insights;
    }
  };
  
  // Use provided insights if available, otherwise use default for the model type
  const displayInsights = insights || getDefaultInsights();
  
  // Model-specific additional information
  const getModelInfo = () => {
    switch(modelType.toLowerCase()) {
      case 'tft':
        return (
          <div className="mt-3 border-t pt-3 border-gray-100">
            <p className="text-sm text-gray-600 font-medium">Key TFT Model Benefits:</p>
            <ul className="text-sm text-gray-600 mt-1 space-y-1 pl-5 list-disc">
              <li>Automatically identifies and extracts important temporal patterns</li>
              <li>Quantifies prediction uncertainty based on data reliability</li>
              <li>Adapts to different seasonal and cyclical patterns</li>
              <li>Considers weather and calendar data for accurate predictions</li>
            </ul>
          </div>
        );
      case 'prophet':
        return (
          <div className="mt-3 border-t pt-3 border-gray-100">
            <p className="text-sm text-gray-600 font-medium">Key Prophet Model Features:</p>
            <ul className="text-sm text-gray-600 mt-1 space-y-1 pl-5 list-disc">
              <li>Decomposable forecast with trend, seasonality, and holiday components</li>
              <li>Handles missing data and outliers well</li>
              <li>Automatically detects changepoints in the trend</li>
              <li>Provides confidence intervals for uncertainty estimation</li>
            </ul>
          </div>
        );
      case 'simple':
        return (
          <div className="mt-3 border-t pt-3 border-gray-100">
            <p className="text-sm text-gray-600 font-medium">Simple Model Characteristics:</p>
            <ul className="text-sm text-gray-600 mt-1 space-y-1 pl-5 list-disc">
              <li>Captures daily and weekly seasonal patterns</li>
              <li>Uses recent history to generate forecast values</li>
              <li>Simple uncertainty bounds based on historical variance</li>
              <li>Good for short-term forecasting in stable conditions</li>
            </ul>
          </div>
        );
      case 'very_simple':
        return (
          <div className="mt-3 border-t pt-3 border-gray-100">
            <p className="text-sm text-gray-600 font-medium">Baseline Model Information:</p>
            <ul className="text-sm text-gray-600 mt-1 space-y-1 pl-5 list-disc">
              <li>Uses simple day/night patterns</li>
              <li>Limited to basic time-of-day effects</li>
              <li>Provides wide uncertainty bounds</li>
              <li>Best used as a fallback when other models fail</li>
            </ul>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-0">
        <CardTitle className="text-lg font-medium">Forecast Insights</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex">
          <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-gray-700 leading-relaxed">
              {displayInsights}
            </p>
            {getModelInfo()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastInsights; 