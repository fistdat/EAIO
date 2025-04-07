import axios from 'axios'
import {
  getBuildings,
  getBuilding,
  getBuildingConsumption,
  createBuilding,
  updateBuilding,
  deleteBuilding
} from '../../../services/api/buildingService'

// Mock axios
jest.mock('axios')

describe('Building Service', () => {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000'
  
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  describe('getBuildings', () => {
    test('should fetch buildings successfully', async () => {
      const buildings = [
        { id: '1', name: 'Building 1', location: 'New York' },
        { id: '2', name: 'Building 2', location: 'Boston' }
      ]
      
      axios.get.mockResolvedValueOnce({ data: buildings })
      
      const result = await getBuildings()
      
      expect(axios.get).toHaveBeenCalledWith(`${baseUrl}/api/buildings`)
      expect(result).toEqual(buildings)
    })
    
    test('should handle error', async () => {
      const errorMessage = 'Network Error'
      axios.get.mockRejectedValueOnce(new Error(errorMessage))
      
      await expect(getBuildings()).rejects.toThrow(errorMessage)
    })
  })
  
  describe('getBuilding', () => {
    test('should fetch a single building successfully', async () => {
      const building = { id: '1', name: 'Building 1', location: 'New York' }
      
      axios.get.mockResolvedValueOnce({ data: building })
      
      const result = await getBuilding('1')
      
      expect(axios.get).toHaveBeenCalledWith(`${baseUrl}a/api/buildings/1`)
      expect(result).toEqual(building)
    })
    
    test('should handle error', async () => {
      const errorMessage = 'Building not found'
      axios.get.mockRejectedValueOnce(new Error(errorMessage))
      
      await expect(getBuilding('999')).rejects.toThrow(errorMessage)
    })
  })
  
  describe('getBuildingConsumption', () => {
    test('should fetch building consumption data successfully', async () => {
      const consumption = {
        electricity: [
          { timestamp: '2023-01-01T00:00:00Z', value: 1250.5 },
          { timestamp: '2023-01-02T00:00:00Z', value: 1180.2 }
        ]
      }
      
      axios.get.mockResolvedValueOnce({ data: consumption })
      
      const result = await getBuildingConsumption('1')
      
      expect(axios.get).toHaveBeenCalledWith(`${baseUrl}/api/buildings/1/consumption`)
      expect(result).toEqual(consumption)
    })
    
    test('should accept and pass timeframe parameters', async () => {
      const consumption = { electricity: [] }
      const params = { start_date: '2023-01-01', end_date: '2023-01-31', metric: 'electricity' }
      
      axios.get.mockResolvedValueOnce({ data: consumption })
      
      const result = await getBuildingConsumption('1', params)
      
      expect(axios.get).toHaveBeenCalledWith(`${baseUrl}/api/buildings/1/consumption`, { params })
      expect(result).toEqual(consumption)
    })
    
    test('should handle error', async () => {
      const errorMessage = 'Failed to fetch consumption data'
      axios.get.mockRejectedValueOnce(new Error(errorMessage))
      
      await expect(getBuildingConsumption('1')).rejects.toThrow(errorMessage)
    })
  })
  
  describe('createBuilding', () => {
    test('should create a building successfully', async () => {
      const newBuilding = { name: 'New Building', location: 'Chicago', size: 5000 }
      const createdBuilding = { id: '3', ...newBuilding }
      
      axios.post.mockResolvedValueOnce({ data: createdBuilding })
      
      const result = await createBuilding(newBuilding)
      
      expect(axios.post).toHaveBeenCalledWith(`${baseUrl}/api/buildings`, newBuilding)
      expect(result).toEqual(createdBuilding)
    })
    
    test('should handle validation error', async () => {
      const invalidBuilding = { location: 'Chicago' } // Missing required name
      const errorMessage = 'Validation Error: name is required'
      
      axios.post.mockRejectedValueOnce({ 
        response: { 
          status: 422, 
          data: { detail: errorMessage } 
        } 
      })
      
      await expect(createBuilding(invalidBuilding)).rejects.toThrow(errorMessage)
    })
  })
  
  describe('updateBuilding', () => {
    test('should update a building successfully', async () => {
      const buildingId = '1'
      const updateData = { name: 'Updated Building Name' }
      const updatedBuilding = { 
        id: buildingId, 
        name: 'Updated Building Name', 
        location: 'New York' 
      }
      
      axios.patch.mockResolvedValueOnce({ data: updatedBuilding })
      
      const result = await updateBuilding(buildingId, updateData)
      
      expect(axios.patch).toHaveBeenCalledWith(`${baseUrl}/api/buildings/${buildingId}`, updateData)
      expect(result).toEqual(updatedBuilding)
    })
    
    test('should handle building not found', async () => {
      const buildingId = '999'
      const updateData = { name: 'Updated Building Name' }
      const errorMessage = 'Building not found'
      
      axios.patch.mockRejectedValueOnce({ 
        response: { 
          status: 404, 
          data: { detail: errorMessage } 
        } 
      })
      
      await expect(updateBuilding(buildingId, updateData)).rejects.toThrow(errorMessage)
    })
  })
  
  describe('deleteBuilding', () => {
    test('should delete a building successfully', async () => {
      const buildingId = '1'
      
      axios.delete.mockResolvedValueOnce({ status: 204 })
      
      await deleteBuilding(buildingId)
      
      expect(axios.delete).toHaveBeenCalledWith(`${baseUrl}/api/buildings/${buildingId}`)
    })
    
    test('should handle building not found', async () => {
      const buildingId = '999'
      const errorMessage = 'Building not found'
      
      axios.delete.mockRejectedValueOnce({ 
        response: { 
          status: 404, 
          data: { detail: errorMessage } 
        } 
      })
      
      await expect(deleteBuilding(buildingId)).rejects.toThrow(errorMessage)
    })
  })
}) 