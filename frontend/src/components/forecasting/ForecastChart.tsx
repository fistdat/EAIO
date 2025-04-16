import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { ForecastDataPoint } from '../../services/api/forecastApi';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ForecastChartProps {
  data: ForecastDataPoint[];
  title?: string;
  days?: number;
  modelType?: string;
}

const ForecastChart: React.FC<ForecastChartProps> = ({
  data,
  title = 'Electricity Consumption Forecast',
  days = 14,
  modelType = 'tft',
}) => {

  // Add check for valid data array
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center text-gray-500">
            No forecast data available.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format timestamps based on the number of points
  // If we have many points (hourly data), format with time
  // If we have fewer points (daily data), format with date only
  const isHourlyData = data.length > days * 2;
  
  const labels = data.map((point) => 
    isHourlyData 
      ? format(parseISO(point.timestamp), 'MM-dd HH:mm')
      : format(parseISO(point.timestamp), 'MM-dd')
  );

  const dataValues = data.map((point) => point.value);
  const lowerBounds = data.map((point) => point.lowerBound || 0);
  const upperBounds = data.map((point) => point.upperBound || 0);

  // Calculate the fill area between upper and lower bounds
  const fillBetweenBounds = {
    labels,
    datasets: [
      {
        label: 'Uncertainty Range',
        data: upperBounds,
        borderColor: 'transparent',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        pointRadius: 0,
        fill: '+1',
        tension: 0.3,
      },
      {
        label: 'Lower Bound',
        data: lowerBounds,
        borderColor: 'transparent',
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      },
    ]
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Forecast',
        data: dataValues,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        pointRadius: modelType === 'tft' ? 3 : 4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        order: 1,
      },
      {
        label: 'Upper Bound',
        data: upperBounds,
        borderColor: 'rgba(156, 163, 175, 0.5)',
        borderDash: [5, 5],
        borderWidth: 1,
        backgroundColor: 'transparent',
        pointRadius: 0,
        fill: false,
        tension: 0.3,
        order: 2,
      },
      {
        label: 'Lower Bound',
        data: lowerBounds,
        borderColor: 'rgba(156, 163, 175, 0.5)',
        borderDash: [5, 5],
        borderWidth: 1,
        backgroundColor: 'transparent',
        pointRadius: 0,
        fill: false,
        tension: 0.3,
        order: 3,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.1)',
        },
        border: {
          dash: [4, 4],
        },
        ticks: {
          callback: function(value: any) {
            return value + '';
          },
        },
      },
      x: {
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.1)',
        },
        border: {
          dash: [4, 4],
        },
        ticks: {
          maxRotation: isHourlyData ? 45 : 0,
          autoSkip: true,
          maxTicksLimit: isHourlyData ? 24 : 14,
        }
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 6,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          afterTitle: function(context: any) {
            if (modelType === 'tft') {
              return 'Temporal Fusion Transformer Prediction';
            }
            return '';
          },
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2);
            }
            return label;
          },
          footer: function(context: any) {
            if (modelType === 'tft' && context[0].datasetIndex === 0) {
              const prediction = context[0].parsed.y;
              const lowerBound = lowerBounds[context[0].dataIndex];
              const upperBound = upperBounds[context[0].dataIndex];
              const range = upperBound - lowerBound;
              const uncertainty = (range / (2 * prediction) * 100).toFixed(1);
              
              return `Prediction uncertainty: ±${uncertainty}%`;
            }
            return '';
          }
        }
      },
    },
  };

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <div className="absolute top-3 right-3 flex items-center text-sm text-muted-foreground">
          <span>{data.length > days ? 'Hourly forecast' : `Next ${days} Days`}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <Line data={chartData} options={chartOptions} />
        </div>
        {modelType === 'tft' && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            <p>Shaded area shows uncertainty range from TFT quantile predictions (10%-90%)</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ForecastChart; 