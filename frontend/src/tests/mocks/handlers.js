import { rest } from 'msw'

// Định nghĩa API base URL từ biến môi trường hoặc default value
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'

// Sample data
const buildings = [
  {
    id: 1,
    name: "Office Building A",
    location: "New York",
    type: "Office",
    area: 50000,
    year_built: 2005
  },
  {
    id: 2,
    name: "Office Building B",
    location: "Boston",
    type: "Office",
    area: 45000,
    year_built: 2010
  }
]

const consumptionData = {
  building_id: 1,
  building_name: "Office Building A",
  start_date: "2023-01-01",
  end_date: "2023-01-07",
  interval: "daily",
  type: "electricity",
  unit: "kWh",
  data: [
    { timestamp: "2023-01-01T00:00:00Z", value: 1250.5 },
    { timestamp: "2023-01-02T00:00:00Z", value: 1180.2 },
    { timestamp: "2023-01-03T00:00:00Z", value: 1210.8 },
    { timestamp: "2023-01-04T00:00:00Z", value: 1195.3 },
    { timestamp: "2023-01-05T00:00:00Z", value: 1220.1 },
    { timestamp: "2023-01-06T00:00:00Z", value: 980.7 },
    { timestamp: "2023-01-07T00:00:00Z", value: 950.2 }
  ]
}

const analysisResults = {
  building_id: 1,
  building_name: "Office Building A",
  energy_type: "electricity",
  patterns: {
    daily: {
      peak_hours: ["09:00", "14:00"],
      off_peak_hours: ["22:00", "04:00"],
      average_daily_profile: [100, 110, 105, 90, 115]
    },
    weekly: {
      highest_day: "Tuesday",
      lowest_day: "Sunday",
      weekday_weekend_ratio: 1.8
    },
    seasonal: {
      summer_average: 1400,
      winter_average: 1650,
      seasonal_variation: 17.8
    }
  }
}

const anomalies = {
  building_id: 1,
  building_name: "Office Building A",
  energy_type: "electricity",
  anomalies: [
    {
      timestamp: "2023-01-15T14:00:00Z",
      expected_value: 120.5,
      actual_value: 175.2,
      deviation_percentage: 45.4,
      severity: "high",
      possible_causes: ["Unusual occupancy", "Equipment malfunction"]
    }
  ],
  total_anomalies: 1,
  analysis_period: "2023-01-01 to 2023-01-31"
}

const recommendations = {
  building_id: 1,
  building_name: "Office Building A",
  recommendations: [
    {
      id: "rec-001",
      title: "Adjust HVAC Scheduling",
      description: "Optimize HVAC operation hours to match actual building occupancy patterns",
      implementation_details: "Adjust BMS scheduling to turn on HVAC 30 minutes before occupancy and shut down 30 minutes before building closure.",
      energy_type: "electricity",
      estimated_savings: {
        percentage: 12.5,
        kwh: 45000,
        cost: 5400
      },
      implementation: {
        difficulty: "easy",
        cost: "low",
        timeframe: "immediate"
      },
      priority: "high"
    },
    {
      id: "rec-002",
      title: "Lighting Retrofit",
      description: "Replace T8 fluorescent lights with LED",
      implementation_details: "Upgrade all fluorescent fixtures to LED alternatives with motion sensors in low traffic areas.",
      energy_type: "electricity",
      estimated_savings: {
        percentage: 15.0,
        kwh: 54000,
        cost: 6480
      },
      implementation: {
        difficulty: "medium",
        cost: "high",
        timeframe: "1-3 months"
      },
      priority: "medium"
    }
  ]
}

const forecast = {
  building_id: 1,
  building_name: "Office Building A",
  forecast: {
    type: "electricity",
    unit: "kWh",
    interval: "hourly",
    data: Array.from({ length: 24 }, (_, i) => ({
      timestamp: `2023-04-01T${String(i).padStart(2, '0')}:00:00Z`,
      predicted_value: 70 + Math.random() * 50,
      confidence_lower: 65 + Math.random() * 30,
      confidence_upper: 90 + Math.random() * 30
    }))
  },
  total_predicted_consumption: 35420,
  weather_factors_included: true,
  model_accuracy: {
    mape: 3.8,
    rmse: 12.4
  }
}

const weatherData = {
  location: "New York",
  data: [
    {
      date: "2023-01-01",
      temperature: 5.2,
      humidity: 65,
      conditions: "cloudy"
    },
    {
      date: "2023-01-02",
      temperature: 4.8,
      humidity: 70,
      conditions: "rain"
    }
  ]
}

// Token response cho authentication
const tokenResponse = {
  access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  token_type: "bearer",
  expires_in: 3600
}

// Mock handlers sử dụng MSW
export const handlers = [
  // Authentication
  rest.post(`${API_URL}/api/auth/token`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(tokenResponse)
    )
  }),

  // Buildings
  rest.get(`${API_URL}/api/buildings`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        items: buildings,
        total: buildings.length,
        page: 1,
        limit: 10
      })
    )
  }),

  rest.get(`${API_URL}/api/buildings/:id`, (req, res, ctx) => {
    const { id } = req.params
    const building = buildings.find(b => b.id === parseInt(id))
    
    if (!building) {
      return res(
        ctx.status(404),
        ctx.json({ detail: "Building not found" })
      )
    }
    
    return res(
      ctx.status(200),
      ctx.json(building)
    )
  }),

  rest.post(`${API_URL}/api/buildings`, (req, res, ctx) => {
    const newBuilding = {
      id: buildings.length + 1,
      ...req.body
    }
    
    return res(
      ctx.status(201),
      ctx.json(newBuilding)
    )
  }),

  rest.patch(`${API_URL}/api/buildings/:id`, (req, res, ctx) => {
    const { id } = req.params
    const buildingIndex = buildings.findIndex(b => b.id === parseInt(id))
    
    if (buildingIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ detail: "Building not found" })
      )
    }
    
    const updatedBuilding = {
      ...buildings[buildingIndex],
      ...req.body
    }
    
    return res(
      ctx.status(200),
      ctx.json(updatedBuilding)
    )
  }),

  rest.delete(`${API_URL}/api/buildings/:id`, (req, res, ctx) => {
    const { id } = req.params
    const building = buildings.find(b => b.id === parseInt(id))
    
    if (!building) {
      return res(
        ctx.status(404),
        ctx.json({ detail: "Building not found" })
      )
    }
    
    return res(
      ctx.status(204)
    )
  }),

  // Consumption data
  rest.get(`${API_URL}/api/buildings/:id/consumption`, (req, res, ctx) => {
    const { id } = req.params
    const building = buildings.find(b => b.id === parseInt(id))
    
    if (!building) {
      return res(
        ctx.status(404),
        ctx.json({ detail: "Building not found" })
      )
    }
    
    return res(
      ctx.status(200),
      ctx.json(consumptionData)
    )
  }),

  // Analysis
  rest.post(`${API_URL}/api/analysis/patterns`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(analysisResults)
    )
  }),

  rest.post(`${API_URL}/api/analysis/anomalies`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(anomalies)
    )
  }),

  // Recommendations
  rest.post(`${API_URL}/api/recommendations`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(recommendations)
    )
  }),

  // Forecasting
  rest.post(`${API_URL}/api/forecasting`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(forecast)
    )
  }),

  // Weather
  rest.get(`${API_URL}/api/weather`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(weatherData)
    )
  }),

  // Commander (natural language interface)
  rest.post(`${API_URL}/api/commander`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        conversation_id: "c1o2n3v4",
        query: req.body.query,
        response: {
          answer: "Based on the data analysis, Building A shows a high correlation between outdoor temperature and energy consumption (correlation coefficient: 0.82). Adjusting HVAC scheduling could lead to approximately 12.5% energy savings.",
          sources: [
            {
              type: "analysis",
              id: "a1b2c3d4",
              timestamp: "2023-03-15T10:30:00Z"
            }
          ],
          confidence: 0.92,
          follow_up_questions: [
            "How can we optimize HVAC scheduling?",
            "What is the expected ROI for this adjustment?"
          ]
        },
        agents_involved: ["DataAnalysisAgent", "RecommendationAgent"]
      })
    )
  })
] 