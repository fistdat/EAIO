/**
 * Utility functions for working with forecasting data
 */
import { format, parseISO } from 'date-fns';
import { ForecastDataPoint } from '../services/api/forecastApi';

/**
 * Formats a timestamp for display
 * @param timestamp ISO timestamp string
 * @param formatString Optional date-fns format string
 * @returns Formatted date string
 */
export const formatTimestamp = (timestamp: string, formatString: string = 'MM-dd'): string => {
  return format(parseISO(timestamp), formatString);
};

/**
 * Formats a number with optional precision and unit
 * @param value The number to format
 * @param precision Number of decimal places
 * @param unit Optional unit to append to the formatted number
 * @returns Formatted number string with unit
 */
export const formatNumber = (value: number, precision: number = 1, unit?: string): string => {
  const formattedNumber = value.toFixed(precision);
  return unit ? `${formattedNumber} ${unit}` : formattedNumber;
};

/**
 * Formats a percentage
 * @param value The percentage value (0-100)
 * @param precision Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, precision: number = 1): string => {
  return `${value.toFixed(precision)}%`;
};

/**
 * Gets appropriate unit for an energy metric
 * @param metric The energy metric
 * @returns The unit for the metric
 */
export const getMetricUnit = (metric: string): string => {
  switch (metric.toLowerCase()) {
    case 'electricity':
      return 'kWh';
    case 'gas':
      return 'm³';
    case 'water':
      return 'L';
    case 'steam':
      return 'kg';
    case 'hotwater':
      return 'L';
    case 'chilledwater':
      return 'L';
    default:
      return '';
  }
};

/**
 * Gets color for chart based on metric
 * @param metric The energy metric
 * @returns The color for the metric charts
 */
export const getMetricColor = (metric: string): string => {
  switch (metric.toLowerCase()) {
    case 'electricity':
      return 'rgb(59, 130, 246)'; // blue
    case 'gas':
      return 'rgb(239, 68, 68)'; // red
    case 'water':
      return 'rgb(6, 182, 212)'; // cyan
    case 'steam':
      return 'rgb(249, 115, 22)'; // orange
    case 'hotwater':
      return 'rgb(217, 70, 70)'; // darker red
    case 'chilledwater':
      return 'rgb(45, 155, 219)'; // lighter blue
    default:
      return 'rgb(107, 114, 128)'; // gray
  }
};

/**
 * Generates mock forecast insights based on data
 * @param data Forecast data points
 * @param metric Energy metric
 * @returns Insights text
 */
export const generateForecastInsights = (data: ForecastDataPoint[], metric: string): string => {
  if (!data || data.length === 0) {
    return 'Insufficient data to generate insights.';
  }
  
  // Calculate percentage difference between first week and second week
  const midPoint = Math.floor(data.length / 2);
  const firstHalfAvg = data.slice(0, midPoint).reduce((sum, point) => sum + point.value, 0) / midPoint;
  const secondHalfAvg = data.slice(midPoint).reduce((sum, point) => sum + point.value, 0) / (data.length - midPoint);
  
  const percentChange = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
  const absoluteChange = Math.abs(percentChange).toFixed(0);
  
  // Find peak consumption
  const peak = data.reduce((max, point) => point.value > max.value ? point : max, data[0]);
  const peakDay = formatTimestamp(peak.timestamp, 'EEEE');
  
  if (percentChange > 5) {
    return `Based on historical patterns and weather forecasts, we predict a ${absoluteChange}% increase in ${metric} consumption next week due to expected high temperatures. Consider pre-cooling strategies during off-peak hours to reduce peak demand charges.`;
  } else if (percentChange < -5) {
    return `Based on historical patterns and weather forecasts, we predict a ${absoluteChange}% decrease in ${metric} consumption next week due to milder temperatures. Consider optimizing equipment schedules to maintain efficiency during lower demand periods.`;
  } else {
    return `Based on historical patterns and weather forecasts, we expect stable ${metric} consumption in the coming period with peak usage on ${peakDay}. Focus on maintaining consistent operation while optimizing for peak usage periods.`;
  }
}; 