# Energy AI Optimizer API Documentation

## Tổng quan
Energy AI Optimizer API cung cấp các endpoint RESTful để tương tác với hệ thống đa tác tử AI. API được tạo với FastAPI và tuân theo tiêu chuẩn RESTful.

**URL Cơ sở**: `http://localhost:8000`

## Xác thực
Tất cả các request API yêu cầu xác thực bằng Bearer Token. Để lấy token, sử dụng endpoint `/api/auth/token`.

**Headers**:
```
Authorization: Bearer <your_token>
```

## Endpoint

### Xác thực

#### Lấy Token
```
POST /api/auth/token
```

**Request Body**:
```json
{
  "username": "user@example.com",
  "password": "your-password"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### Tòa nhà

#### Lấy danh sách tòa nhà
```
GET /api/buildings
```

**Query Parameters**:
- `page`: Số trang (mặc định: 1)
- `limit`: Số lượng kết quả mỗi trang (mặc định: 10)
- `type`: Lọc theo loại tòa nhà
- `location`: Lọc theo vị trí

**Response**:
```json
{
  "items": [
    {
      "id": 1,
      "name": "Office Building A",
      "location": "New York",
      "type": "Office",
      "area": 50000,
      "year_built": 2005
    },
    ...
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

#### Lấy thông tin tòa nhà
```
GET /api/buildings/{building_id}
```

**Path Parameters**:
- `building_id`: ID của tòa nhà

**Response**:
```json
{
  "id": 1,
  "name": "Office Building A",
  "location": "New York",
  "type": "Office",
  "area": 50000,
  "year_built": 2005,
  "floors": 12,
  "occupancy": 1200,
  "operation_hours": "8:00-18:00",
  "systems": [
    {
      "type": "HVAC",
      "details": "Central system with chillers"
    },
    {
      "type": "Lighting",
      "details": "LED with motion sensors"
    }
  ]
}
```

#### Lấy dữ liệu tiêu thụ năng lượng
```
GET /api/buildings/{building_id}/consumption
```

**Path Parameters**:
- `building_id`: ID của tòa nhà

**Query Parameters**:
- `start_date`: Ngày bắt đầu (YYYY-MM-DD)
- `end_date`: Ngày kết thúc (YYYY-MM-DD)
- `interval`: Khoảng thời gian (hourly, daily, weekly, monthly)
- `type`: Loại năng lượng (electricity, gas, water, etc.)

**Response**:
```json
{
  "building_id": 1,
  "building_name": "Office Building A",
  "start_date": "2023-01-01",
  "end_date": "2023-01-07",
  "interval": "daily",
  "type": "electricity",
  "unit": "kWh",
  "data": [
    {
      "timestamp": "2023-01-01T00:00:00Z",
      "value": 1250.5
    },
    {
      "timestamp": "2023-01-02T00:00:00Z",
      "value": 1180.2
    },
    ...
  ]
}
```

### Phân tích

#### Phân tích mẫu tiêu thụ
```
POST /api/analysis/patterns
```

**Request Body**:
```json
{
  "building_id": 1,
  "start_date": "2023-01-01",
  "end_date": "2023-03-31",
  "energy_type": "electricity",
  "interval": "daily",
  "analysis_types": ["daily", "weekly", "seasonal"]
}
```

**Response**:
```json
{
  "building_id": 1,
  "building_name": "Office Building A",
  "energy_type": "electricity",
  "patterns": {
    "daily": {
      "peak_hours": ["09:00", "14:00"],
      "off_peak_hours": ["22:00", "04:00"],
      "average_daily_profile": [...]
    },
    "weekly": {
      "highest_day": "Tuesday",
      "lowest_day": "Sunday",
      "weekday_weekend_ratio": 1.8
    },
    "seasonal": {
      "summer_average": 1400,
      "winter_average": 1650,
      "seasonal_variation": 17.8
    }
  }
}
```

#### Phát hiện bất thường
```
POST /api/analysis/anomalies
```

**Request Body**:
```json
{
  "building_id": 1,
  "start_date": "2023-01-01",
  "end_date": "2023-03-31",
  "energy_type": "electricity",
  "sensitivity": "medium"
}
```

**Response**:
```json
{
  "building_id": 1,
  "building_name": "Office Building A",
  "energy_type": "electricity",
  "anomalies": [
    {
      "timestamp": "2023-01-15T14:00:00Z",
      "expected_value": 120.5,
      "actual_value": 175.2,
      "deviation_percentage": 45.4,
      "severity": "high",
      "possible_causes": [
        "Unusual occupancy",
        "Equipment malfunction"
      ]
    },
    ...
  ],
  "total_anomalies": 5,
  "analysis_period": "2023-01-01 to 2023-03-31"
}
```

#### Tương quan thời tiết
```
POST /api/weather/correlation
```

**Request Body**:
```json
{
  "building_id": 1,
  "start_date": "2023-01-01",
  "end_date": "2023-03-31",
  "energy_type": "electricity"
}
```

**Response**:
```json
{
  "building_id": 1,
  "building_name": "Office Building A",
  "correlation": {
    "temperature": {
      "correlation_coefficient": 0.82,
      "impact": "high",
      "description": "Strong positive correlation with outdoor temperature"
    },
    "humidity": {
      "correlation_coefficient": 0.35,
      "impact": "medium",
      "description": "Moderate correlation with humidity"
    },
    "heating_degree_days": {
      "correlation_coefficient": 0.76,
      "impact": "high",
      "description": "Strong correlation with heating degree days"
    }
  },
  "sensitivity": {
    "per_degree_celsius": 2.5,
    "unit": "kWh"
  }
}
```

### Khuyến nghị

#### Tạo khuyến nghị
```
POST /api/recommendations
```

**Request Body**:
```json
{
  "building_id": 1,
  "analysis_id": "a1b2c3d4",
  "user_role": "facility_manager",
  "energy_types": ["electricity", "gas"],
  "budget_constraint": "medium",
  "implementation_timeframe": "short"
}
```

**Response**:
```json
{
  "building_id": 1,
  "building_name": "Office Building A",
  "recommendations": [
    {
      "id": "rec-001",
      "title": "Adjust HVAC Scheduling",
      "description": "Optimize HVAC operation hours to match actual building occupancy patterns",
      "implementation_details": "Adjust BMS scheduling to turn on HVAC 30 minutes before occupancy and shut down 30 minutes before building closure.",
      "energy_type": "electricity",
      "estimated_savings": {
        "percentage": 12.5,
        "kwh": 45000,
        "cost": 5400
      },
      "implementation": {
        "difficulty": "easy",
        "cost": "low",
        "timeframe": "immediate"
      },
      "priority": "high"
    },
    ...
  ]
}
```

#### Lấy trạng thái triển khai
```
GET /api/recommendations/{recommendation_id}/status
```

**Path Parameters**:
- `recommendation_id`: ID của khuyến nghị

**Response**:
```json
{
  "recommendation_id": "rec-001",
  "title": "Adjust HVAC Scheduling",
  "status": "in_progress",
  "implementation_started": "2023-04-10T09:00:00Z",
  "estimated_completion": "2023-04-17T17:00:00Z",
  "progress_percentage": 60,
  "notes": "Initial adjustments completed for floors 1-8, remaining floors scheduled for next week"
}
```

### Dự báo

#### Tạo dự báo
```
POST /api/forecasting
```

**Request Body**:
```json
{
  "building_id": 1,
  "energy_type": "electricity",
  "start_date": "2023-04-01",
  "end_date": "2023-04-30",
  "forecast_type": "hourly",
  "include_weather": true,
  "weather_scenario": "typical"
}
```

**Response**:
```json
{
  "building_id": 1,
  "building_name": "Office Building A",
  "forecast": {
    "type": "electricity",
    "unit": "kWh",
    "interval": "hourly",
    "data": [
      {
        "timestamp": "2023-04-01T00:00:00Z",
        "predicted_value": 78.5,
        "confidence_lower": 72.3,
        "confidence_upper": 84.2
      },
      ...
    ]
  },
  "total_predicted_consumption": 35420,
  "weather_factors_included": true,
  "model_accuracy": {
    "mape": 3.8,
    "rmse": 12.4
  }
}
```

#### Phân tích kịch bản
```
POST /api/forecasting/scenarios
```

**Request Body**:
```json
{
  "building_id": 1,
  "energy_type": "electricity",
  "base_forecast_id": "f1e2d3c4",
  "scenarios": [
    {
      "name": "Hot Summer",
      "temperature_adjustment": 5,
      "humidity_adjustment": 10
    },
    {
      "name": "Extended Hours",
      "occupancy_hours_extension": 2
    }
  ]
}
```

**Response**:
```json
{
  "building_id": 1,
  "building_name": "Office Building A",
  "base_forecast": {
    "id": "f1e2d3c4",
    "total_consumption": 35420
  },
  "scenarios": [
    {
      "name": "Hot Summer",
      "total_consumption": 42504,
      "change_percentage": 20,
      "details": {
        "peak_load_change": 25,
        "daily_distribution": [...]
      }
    },
    {
      "name": "Extended Hours",
      "total_consumption": 38962,
      "change_percentage": 10,
      "details": {
        "peak_load_change": 5,
        "daily_distribution": [...]
      }
    }
  ]
}
```

### Bộ nhớ

#### Lưu phân tích
```
POST /api/memory
```

**Request Body**:
```json
{
  "type": "analysis",
  "building_id": 1,
  "user_id": "u1s2e3r4",
  "content": {
    "analysis_type": "consumption_patterns",
    "energy_type": "electricity",
    "period": "2023-Q1",
    "results": {...}
  },
  "tags": ["quarterly-review", "electricity"]
}
```

**Response**:
```json
{
  "id": "m1e2m3o4",
  "type": "analysis",
  "building_id": 1,
  "user_id": "u1s2e3r4",
  "created_at": "2023-04-12T15:30:45Z",
  "tags": ["quarterly-review", "electricity"],
  "summary": "Q1 2023 electricity consumption pattern analysis for Building 1"
}
```

#### Lấy dữ liệu phân tích
```
GET /api/memory/{memory_id}
```

**Path Parameters**:
- `memory_id`: ID của bản ghi bộ nhớ

**Response**:
```json
{
  "id": "m1e2m3o4",
  "type": "analysis",
  "building_id": 1,
  "building_name": "Office Building A",
  "user_id": "u1s2e3r4",
  "created_at": "2023-04-12T15:30:45Z",
  "tags": ["quarterly-review", "electricity"],
  "content": {
    "analysis_type": "consumption_patterns",
    "energy_type": "electricity",
    "period": "2023-Q1",
    "results": {...}
  }
}
```

### Đánh giá

#### Đánh giá khuyến nghị
```
POST /api/evaluator/recommendations
```

**Request Body**:
```json
{
  "building_id": 1,
  "recommendation_id": "rec-001",
  "implementation_date": "2023-04-01",
  "evaluation_period": 30
}
```

**Response**:
```json
{
  "recommendation_id": "rec-001",
  "title": "Adjust HVAC Scheduling",
  "evaluation": {
    "pre_implementation": {
      "avg_daily_consumption": 1250,
      "baseline_period": "2023-03-01 to 2023-03-31"
    },
    "post_implementation": {
      "avg_daily_consumption": 1075,
      "evaluation_period": "2023-04-01 to 2023-04-30"
    },
    "savings": {
      "absolute": 175,
      "percentage": 14,
      "normalized_for_weather": 13.2,
      "cost_savings": 21,
      "co2_reduction": 15.8
    },
    "roi": {
      "implementation_cost": 500,
      "annual_savings": 6300,
      "payback_period_months": 1
    }
  }
}
```

#### Đánh giá dự báo
```
POST /api/evaluator/forecasts
```

**Request Body**:
```json
{
  "forecast_id": "f1e2d3c4",
  "actual_data_period": "2023-04-01 to 2023-04-30"
}
```

**Response**:
```json
{
  "forecast_id": "f1e2d3c4",
  "building_id": 1,
  "building_name": "Office Building A",
  "energy_type": "electricity",
  "accuracy_metrics": {
    "mape": 3.8,
    "rmse": 12.4,
    "mae": 9.2,
    "r_squared": 0.92
  },
  "forecast_total": 35420,
  "actual_total": 36105,
  "variance_percentage": 1.9,
  "period_evaluation": {
    "most_accurate_day": "2023-04-15",
    "least_accurate_day": "2023-04-22",
    "accuracy_by_day_type": {
      "weekday": 4.1,
      "weekend": 2.8
    },
    "accuracy_by_time": {
      "morning": 3.2,
      "afternoon": 4.5,
      "evening": 3.6,
      "night": 2.9
    }
  }
}
```

### Commander

#### Gửi truy vấn
```
POST /api/commander
```

**Request Body**:
```json
{
  "query": "What are the top 3 factors affecting energy consumption in Building A?",
  "building_id": 1,
  "user_role": "energy_analyst",
  "conversation_id": "c1o2n3v4",
  "include_context": true
}
```

**Response**:
```json
{
  "conversation_id": "c1o2n3v4",
  "query": "What are the top 3 factors affecting energy consumption in Building A?",
  "response": {
    "answer": "Based on analysis of Building A's data, the top 3 factors affecting energy consumption are:\n\n1. Outdoor temperature (correlation coefficient: 0.82)\n2. Occupancy levels (correlation coefficient: 0.75)\n3. HVAC operation hours (correlation coefficient: 0.68)",
    "sources": [
      {
        "type": "analysis",
        "id": "a1b2c3d4",
        "timestamp": "2023-03-15T10:30:00Z"
      },
      {
        "type": "weather_correlation",
        "id": "w1e2a3t4",
        "timestamp": "2023-03-10T14:15:00Z"
      }
    ],
    "confidence": 0.92,
    "follow_up_questions": [
      "How can we optimize HVAC operation hours?",
      "What is the impact of reducing occupancy by 10%?",
      "How does Building A compare to similar buildings in terms of temperature sensitivity?"
    ]
  },
  "agents_involved": ["DataAnalysisAgent", "RecommendationAgent"]
}
```

## Mã lỗi
API sử dụng mã HTTP tiêu chuẩn:

| Code | Description |
|------|-------------|
| 200  | Success |
| 201  | Created |
| 400  | Bad Request |
| 401  | Unauthorized |
| 403  | Forbidden |
| 404  | Not Found |
| 500  | Internal Server Error |

## Giới hạn tốc độ
API giới hạn số lượng request là 100 request/phút cho mỗi token.

## Phiên bản
Phiên bản hiện tại của API: v1

## Hỗ trợ
Nếu bạn cần hỗ trợ, vui lòng liên hệ api-support@energyaioptimizer.com. 