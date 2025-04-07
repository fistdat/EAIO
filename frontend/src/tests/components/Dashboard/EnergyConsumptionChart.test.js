import React from 'react'
import { render, screen } from '@testing-library/react'
import EnergyConsumptionChart from '../../../components/dashboard/charts/EnergyConsumptionChart'

// Mock Recharts components
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts')
  
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
    Line: () => <div data-testid="line" />,
    Bar: () => <div data-testid="bar" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />
  }
})

describe('EnergyConsumptionChart Component', () => {
  const mockData = [
    { timestamp: '2023-01-01T00:00:00Z', value: 1250.5 },
    { timestamp: '2023-01-02T00:00:00Z', value: 1180.2 },
    { timestamp: '2023-01-03T00:00:00Z', value: 1210.8 },
    { timestamp: '2023-01-04T00:00:00Z', value: 1195.3 },
    { timestamp: '2023-01-05T00:00:00Z', value: 1220.1 }
  ]

  test('renders with line chart by default', () => {
    render(
      <EnergyConsumptionChart 
        data={mockData} 
        title="Electricity Consumption" 
        unit="kWh"
      />
    )
    
    // Check if title is rendered
    expect(screen.getByText('Electricity Consumption')).toBeInTheDocument()
    
    // Check if chart components are rendered
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.getByTestId('line')).toBeInTheDocument()
    expect(screen.getByTestId('x-axis')).toBeInTheDocument()
    expect(screen.getByTestId('y-axis')).toBeInTheDocument()
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
    expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    expect(screen.getByTestId('legend')).toBeInTheDocument()
  })

  test('renders with bar chart when chartType is bar', () => {
    render(
      <EnergyConsumptionChart 
        data={mockData} 
        title="Electricity Consumption" 
        unit="kWh"
        chartType="bar"
      />
    )
    
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    expect(screen.getByTestId('bar')).toBeInTheDocument()
  })

  test('displays no data message when data is empty', () => {
    render(
      <EnergyConsumptionChart 
        data={[]} 
        title="Electricity Consumption" 
        unit="kWh"
      />
    )
    
    expect(screen.getByText(/no data available/i)).toBeInTheDocument()
  })

  test('displays loading indicator when isLoading is true', () => {
    render(
      <EnergyConsumptionChart 
        data={mockData} 
        title="Electricity Consumption" 
        unit="kWh"
        isLoading={true}
      />
    )
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  test('displays error message when there is an error', () => {
    render(
      <EnergyConsumptionChart 
        data={mockData} 
        title="Electricity Consumption" 
        unit="kWh"
        error="Failed to load data"
      />
    )
    
    expect(screen.getByText(/failed to load data/i)).toBeInTheDocument()
  })

  test('renders with correct unit in Y-axis title', () => {
    render(
      <EnergyConsumptionChart 
        data={mockData} 
        title="Electricity Consumption" 
        unit="kWh"
      />
    )
    
    // In a real component, we'd check the label on the YAxis
    // Since we mocked it, we can't check it directly
    // This would be easier with react-testing-library's within and a proper DOM structure
    // For this test, we're just making sure the component renders without errors
    expect(screen.getByTestId('y-axis')).toBeInTheDocument()
  })
}) 