import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ChartTooltipContext, ScaleTickContext } from 'chart.js';
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
        
        chartInstance.current = new Chart(ctx as any, { // @ts-ignore // @ts-ignore
          type: 'line',
          data: {
            labels: chartLabels,
            datasets: [
              {
                label: 'Consumption',
                data: chartData,
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.1,
                fill: true,
                pointRadius: 2,
                pointHoverRadius: 4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Time',
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'kWh',
                },
                beginAtZero: true,
              },
            },
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                mode: 'index',
                intersect: false,
              },
            },
            interaction: {
              mode: 'nearest',
              axis: 'x',
              intersect: false
            }
          }
        }) as Chart; // Explicitly cast to non-generic Chart
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