import { renderHook, act } from '@testing-library/react-hooks'
import useRoleBasedView from '../../hooks/useRoleBasedView'
import { UserRoleContext } from '../../context/UserRoleContext'
import React from 'react'

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {}
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString()
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    removeItem: jest.fn(key => {
      delete store[key]
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('useRoleBasedView Hook', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
    jest.clearAllMocks()
  })

  test('should return facility manager role as default', () => {
    const wrapper = ({ children }) => (
      <UserRoleContext.Provider value={{ userRole: 'facility_manager', setUserRole: jest.fn() }}>
        {children}
      </UserRoleContext.Provider>
    )

    const { result } = renderHook(() => useRoleBasedView(), { wrapper })

    expect(result.current.userRole).toBe('facility_manager')
    expect(result.current.isDataDetailed).toBe(false)
    expect(result.current.showFinancialMetrics).toBe(false)
    expect(result.current.preferredChartType).toBe('line')
  })

  test('should return energy analyst role settings', () => {
    const wrapper = ({ children }) => (
      <UserRoleContext.Provider value={{ userRole: 'energy_analyst', setUserRole: jest.fn() }}>
        {children}
      </UserRoleContext.Provider>
    )

    const { result } = renderHook(() => useRoleBasedView(), { wrapper })

    expect(result.current.userRole).toBe('energy_analyst')
    expect(result.current.isDataDetailed).toBe(true)
    expect(result.current.timeResolution).toBe('hourly')
    expect(result.current.showTechnicalMetrics).toBe(true)
  })

  test('should return executive role settings', () => {
    const wrapper = ({ children }) => (
      <UserRoleContext.Provider value={{ userRole: 'executive', setUserRole: jest.fn() }}>
        {children}
      </UserRoleContext.Provider>
    )

    const { result } = renderHook(() => useRoleBasedView(), { wrapper })

    expect(result.current.userRole).toBe('executive')
    expect(result.current.timeResolution).toBe('monthly')
    expect(result.current.showFinancialMetrics).toBe(true)
    expect(result.current.showTechnicalMetrics).toBe(false)
  })

  test('should allow changing time resolution', () => {
    const setUserRoleMock = jest.fn()
    const wrapper = ({ children }) => (
      <UserRoleContext.Provider value={{ userRole: 'facility_manager', setUserRole: setUserRoleMock }}>
        {children}
      </UserRoleContext.Provider>
    )

    const { result } = renderHook(() => useRoleBasedView(), { wrapper })

    act(() => {
      result.current.setTimeResolution('daily')
    })

    expect(result.current.timeResolution).toBe('daily')
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('timeResolution', 'daily')
  })

  test('should allow toggling chart view', () => {
    const wrapper = ({ children }) => (
      <UserRoleContext.Provider value={{ userRole: 'facility_manager', setUserRole: jest.fn() }}>
        {children}
      </UserRoleContext.Provider>
    )

    const { result } = renderHook(() => useRoleBasedView(), { wrapper })
    
    expect(result.current.preferredChartType).toBe('line')

    act(() => {
      result.current.toggleChartType()
    })

    expect(result.current.preferredChartType).toBe('bar')
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('preferredChartType', 'bar')
    
    act(() => {
      result.current.toggleChartType()
    })
    
    expect(result.current.preferredChartType).toBe('line')
  })

  test('should allow toggling financial metrics', () => {
    const wrapper = ({ children }) => (
      <UserRoleContext.Provider value={{ userRole: 'facility_manager', setUserRole: jest.fn() }}>
        {children}
      </UserRoleContext.Provider>
    )

    const { result } = renderHook(() => useRoleBasedView(), { wrapper })
    
    expect(result.current.showFinancialMetrics).toBe(false)

    act(() => {
      result.current.toggleFinancialMetrics()
    })

    expect(result.current.showFinancialMetrics).toBe(true)
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('showFinancialMetrics', 'true')
  })

  test('should load preferences from localStorage', () => {
    mockLocalStorage.setItem('timeResolution', 'weekly')
    mockLocalStorage.setItem('preferredChartType', 'bar')
    mockLocalStorage.setItem('showFinancialMetrics', 'true')
    
    const wrapper = ({ children }) => (
      <UserRoleContext.Provider value={{ userRole: 'facility_manager', setUserRole: jest.fn() }}>
        {children}
      </UserRoleContext.Provider>
    )

    const { result } = renderHook(() => useRoleBasedView(), { wrapper })
    
    expect(result.current.timeResolution).toBe('weekly')
    expect(result.current.preferredChartType).toBe('bar')
    expect(result.current.showFinancialMetrics).toBe(true)
  })

  test('should reset to role defaults', () => {
    mockLocalStorage.setItem('timeResolution', 'weekly')
    mockLocalStorage.setItem('preferredChartType', 'bar')
    mockLocalStorage.setItem('showFinancialMetrics', 'true')
    
    const wrapper = ({ children }) => (
      <UserRoleContext.Provider value={{ userRole: 'facility_manager', setUserRole: jest.fn() }}>
        {children}
      </UserRoleContext.Provider>
    )

    const { result } = renderHook(() => useRoleBasedView(), { wrapper })
    
    act(() => {
      result.current.resetToDefaults()
    })
    
    expect(result.current.timeResolution).toBe('daily')
    expect(result.current.preferredChartType).toBe('line')
    expect(result.current.showFinancialMetrics).toBe(false)
    
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('timeResolution')
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('preferredChartType')
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('showFinancialMetrics')
  })
}) 