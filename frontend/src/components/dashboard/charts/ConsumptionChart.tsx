import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { format, parseISO } from 'date-fns';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

// Define the props interface
interface ConsumptionChartProps {
  data: any[];
  loading?: boolean;
}

// Format date string for display
const formatDateLabel = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), 'MMM dd');
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateStr;
  }
};

const ConsumptionChart: React.FC<ConsumptionChartProps> = ({ data, loading = false }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  useEffect(() => {
    if (chartRef.current && data.length > 0) {
      // Destroy previous chart instance
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      
      const ctx = chartRef.current.getContext('2d');
      
      if (ctx) {
        // Process data for the chart
        const chartLabels = data.map(item => formatDateLabel(item.timestamp));
        const chartData = data.map(item => item.value !== null ? item.value : 0);
        
        // Calculate max and min values for y-axis scale
        const maxValue = Math.max(...chartData) * 1.1; // 10% buffer above max
        const minValue = Math.max(0, Math.min(...chartData.filter(v => v > 0)) * 0.9); // 10% buffer below min, but not below 0
        
        // Find anomalies (could be enhanced with real anomaly data)
        const anomalies = [];
        // For demonstration, let's consider a point an anomaly if it's 30% higher than previous point
        for (let i = 1; i < chartData.length; i++) {
          if (chartData[i] > chartData[i-1] * 1.3) {
            anomalies.push({
              index: i,
              value: chartData[i]
            });
          }
        }
        
        // Create chart annotations for anomalies
        const annotations: any = {};
        anomalies.forEach((anomaly, index) => {
          annotations[`anomaly${index}`] = {
            type: 'point',
            xValue: chartLabels[anomaly.index],
            yValue: anomaly.value,
            backgroundColor: 'rgba(255, 99, 132, 0.8)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            radius: 6
          };
        });
        
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: chartLabels,
            datasets: [
              {
                label: 'Electricity (kWh)',
                data: chartData,
                borderColor: 'rgba(56, 128, 255, 1)',
                backgroundColor: 'rgba(56, 128, 255, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 4,
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  usePointStyle: true,
                  boxWidth: 6,
                  font: {
                    size: 12,
                  }
                }
              },
              tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#1F2937',
                bodyColor: '#4B5563',
                borderColor: 'rgba(209, 213, 219, 1)',
                borderWidth: 1,
                padding: 12,
                boxPadding: 6,
                usePointStyle: true,
                callbacks: {
                  label: function(context) {
                    return `${context.dataset.label}: ${context.parsed.y} kWh`;
                  }
                }
              },
              annotation: {
                annotations: annotations
              }
            },
            scales: {
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  maxRotation: 0,
                  autoSkip: true,
                  maxTicksLimit: 7
                }
              },
              y: {
                beginAtZero: data.every(item => item.value >= 0),
                min: data.length > 0 ? minValue : undefined,
                max: data.length > 0 ? maxValue : undefined,
                grid: {
                  display: true
                },
                ticks: {
                  callback: function(value) {
                    return value + ' kWh';
                  }
                }
              }
            }
          }
        });
      }
    }
    
    // Cleanup
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No consumption data available</p>
      </div>
    );
  }
  
  return (
    <canvas ref={chartRef} />
  );
};

export default ConsumptionChart; 