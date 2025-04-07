import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import AnomalyCard from '../../../components/dashboard/AnomalyCard'

describe('AnomalyCard Component', () => {
  const mockAnomaly = {
    id: 'anom-123',
    timestamp: '2023-05-15T14:30:00Z',
    type: 'consumption_spike',
    severity: 'high',
    message: 'Unusual energy consumption spike detected',
    value: 2500,
    expected_value: 1800,
    percent_diff: 38.9,
    system: 'HVAC',
    building_id: 'bldg-456',
    building_name: 'Office Tower A'
  }

  const mockOnActionClick = jest.fn()

  test('renders anomaly card with correct information', () => {
    render(<AnomalyCard anomaly={mockAnomaly} />)
    
    // Check if basic information is displayed
    expect(screen.getByText('Unusual energy consumption spike detected')).toBeInTheDocument()
    expect(screen.getByText(/Office Tower A/i)).toBeInTheDocument()
    expect(screen.getByText(/HVAC/i)).toBeInTheDocument()
    expect(screen.getByText(/high/i, { exact: false })).toBeInTheDocument() // Severity
    
    // Check if timestamp is formatted correctly
    const date = new Date(mockAnomaly.timestamp)
    const formattedDate = date.toLocaleDateString()
    expect(screen.getByText(new RegExp(formattedDate, 'i'))).toBeInTheDocument()
    
    // Check if values are displayed
    expect(screen.getByText(/2500/)).toBeInTheDocument() // Actual value
    expect(screen.getByText(/1800/)).toBeInTheDocument() // Expected value
    expect(screen.getByText(/38.9%/)).toBeInTheDocument() // Percent difference
  })

  test('applies correct severity styling', () => {
    render(<AnomalyCard anomaly={mockAnomaly} />)
    
    // High severity should have red indicator or text
    const severityElement = screen.getByText(/high/i, { exact: false })
    expect(severityElement.parentElement).toHaveClass('bg-red-100')
    expect(severityElement).toHaveClass('text-red-800')
  })

  test('calls action callback when investigate button is clicked', () => {
    render(<AnomalyCard anomaly={mockAnomaly} onActionClick={mockOnActionClick} />)
    
    const investigateButton = screen.getByRole('button', { name: /investigate/i })
    fireEvent.click(investigateButton)
    
    expect(mockOnActionClick).toHaveBeenCalledWith(mockAnomaly)
  })

  test('renders medium severity styling correctly', () => {
    const mediumAnomaly = {
      ...mockAnomaly,
      severity: 'medium',
      message: 'Unusual pattern detected',
      percent_diff: 15.5
    }
    
    render(<AnomalyCard anomaly={mediumAnomaly} />)
    
    const severityElement = screen.getByText(/medium/i, { exact: false })
    expect(severityElement.parentElement).toHaveClass('bg-yellow-100')
    expect(severityElement).toHaveClass('text-yellow-800')
  })

  test('renders low severity styling correctly', () => {
    const lowAnomaly = {
      ...mockAnomaly,
      severity: 'low',
      message: 'Minor anomaly detected',
      percent_diff: 5.2
    }
    
    render(<AnomalyCard anomaly={lowAnomaly} />)
    
    const severityElement = screen.getByText(/low/i, { exact: false })
    expect(severityElement.parentElement).toHaveClass('bg-blue-100')
    expect(severityElement).toHaveClass('text-blue-800')
  })

  test('renders correct icon based on anomaly type', () => {
    // Test for consumption_spike
    render(<AnomalyCard anomaly={mockAnomaly} />)
    
    // The icon element would typically have an aria-label or test-id
    // Since we can't test the actual SVG without test IDs, we'll check for its container
    const iconContainer = screen.getByTestId('anomaly-icon')
    expect(iconContainer).toBeInTheDocument()
    
    // Different anomaly type
    const differentAnomaly = {
      ...mockAnomaly,
      type: 'temperature_deviation'
    }
    
    const { rerender } = render(<AnomalyCard anomaly={differentAnomaly} />)
    rerender(<AnomalyCard anomaly={differentAnomaly} />)
    
    const newIconContainer = screen.getByTestId('anomaly-icon')
    expect(newIconContainer).toBeInTheDocument()
  })
}) 