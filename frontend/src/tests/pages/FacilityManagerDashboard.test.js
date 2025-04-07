import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import FacilityManagerDashboard from '../../pages/FacilityManagerDashboard'
import * as buildingService from '../../services/api/buildingService'
import * as analysisService from '../../services/api/analysisService'

// Mock the API services
jest.mock('../../services/api/buildingService')
jest.mock('../../services/api/analysisService')

// Mock the components that are used in the dashboard
jest.mock('../../components/dashboard/BuildingSelector', () => {
  return function DummyBuildingSelector({ onBuildingChange }) {
    return (
      <div data-testid="building-selector">
        <button onClick={() => onBuildingChange({ id: 'building-1', name: 'Test Building' })}>
          Select Building
        </button>
      </div>
    )
  }
})

jest.mock('../../components/dashboard/charts/EnergyConsumptionChart', () => {
  return function DummyEnergyConsumptionChart({ title }) {
    return <div data-testid="energy-consumption-chart">{title}</div>
  }
})

jest.mock('../../components/dashboard/AnomalyList', () => {
  return function DummyAnomalyList() {
    return <div data-testid="anomaly-list">Anomaly List</div>
  }
})

jest.mock('../../components/dashboard/RecommendationList', () => {
  return function DummyRecommendationList() {
    return <div data-testid="recommendation-list">Recommendation List</div>
  }
})

describe('FacilityManagerDashboard Component', () => {
  let queryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    // Mock the API responses
    buildingService.getBuildings.mockResolvedValue([
      { id: 'building-1', name: 'Office Tower A' },
      { id: 'building-2', name: 'Office Tower B' }
    ])
    
    buildingService.getBuildingConsumption.mockResolvedValue({
      electricity: [
        { timestamp: '2023-01-01T00:00:00Z', value: 1250.5 },
        { timestamp: '2023-01-02T00:00:00Z', value: 1180.2 }
      ]
    })
    
    analysisService.detectAnomalies.mockResolvedValue([
      {
        id: 'anom-1',
        timestamp: '2023-01-02T14:30:00Z',
        type: 'consumption_spike',
        severity: 'high',
        message: 'Unusual energy consumption spike detected'
      }
    ])
    
    analysisService.getRecommendations.mockResolvedValue([
      {
        id: 'rec-1',
        title: 'Adjust HVAC schedule',
        description: 'Reduce operating hours during weekends',
        priority: 'high',
        estimated_savings: 1500,
        implementation_difficulty: 'low'
      }
    ])
  })

  test('renders dashboard with all components', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <FacilityManagerDashboard />
      </QueryClientProvider>
    )
    
    // Check if the main components are rendered
    expect(screen.getByTestId('building-selector')).toBeInTheDocument()
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Facility Manager Dashboard/i)).toBeInTheDocument()
    })
    
    expect(screen.getByTestId('energy-consumption-chart')).toBeInTheDocument()
    expect(screen.getByTestId('anomaly-list')).toBeInTheDocument()
    expect(screen.getByTestId('recommendation-list')).toBeInTheDocument()
  })

  test('loads building data when component mounts', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <FacilityManagerDashboard />
      </QueryClientProvider>
    )
    
    await waitFor(() => {
      expect(buildingService.getBuildings).toHaveBeenCalledTimes(1)
    })
  })

  test('calls appropriate services when building is selected', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <FacilityManagerDashboard />
      </QueryClientProvider>
    )
    
    // Find and click the building selector button
    const selectButton = screen.getByText('Select Building')
    selectButton.click()
    
    await waitFor(() => {
      expect(buildingService.getBuildingConsumption).toHaveBeenCalledWith('building-1')
      expect(analysisService.detectAnomalies).toHaveBeenCalled()
      expect(analysisService.getRecommendations).toHaveBeenCalled()
    })
  })

  test('displays loading state while data is being fetched', async () => {
    // Force the API to take longer
    buildingService.getBuildings.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve([{ id: 'building-1', name: 'Office Tower A' }]), 100)
    }))
    
    render(
      <QueryClientProvider client={queryClient}>
        <FacilityManagerDashboard />
      </QueryClientProvider>
    )
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  })

  test('displays error message when API fails', async () => {
    buildingService.getBuildings.mockRejectedValue(new Error('Failed to fetch buildings'))
    
    render(
      <QueryClientProvider client={queryClient}>
        <FacilityManagerDashboard />
      </QueryClientProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByText(/error.*building/i)).toBeInTheDocument()
    })
  })
}) 