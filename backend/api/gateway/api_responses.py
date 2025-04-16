"""
API Gateway response models for the Energy AI Optimizer.
Defines standardized response models for all API endpoints.
"""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any, Generic, TypeVar, Union
from pydantic import BaseModel, Field, validator
from pydantic.generics import GenericModel

T = TypeVar('T')

class ErrorSeverity(str, Enum):
    """Severity levels for API errors."""
    CRITICAL = "critical"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"

class ErrorDetail(BaseModel):
    """
    Detailed information about an error occurrence.
    
    Provides standardized error details for troubleshooting API issues.
    """
    code: str = Field(
        ..., 
        description="Unique error code for this specific error",
        example="DATA_NOT_FOUND"
    )
    message: str = Field(
        ..., 
        description="Human-readable error message",
        example="Requested building data not found for the specified period"
    )
    severity: ErrorSeverity = Field(
        ErrorSeverity.ERROR,
        description="Severity level of the error",
        example="error"
    )
    field: Optional[str] = Field(
        None,
        description="Field that caused the error, if applicable",
        example="building_id"
    )
    details: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional error details for debugging",
        example={"suggested_building_ids": ["building-123", "building-456"]}
    )

class BaseResponse(BaseModel):
    """
    Base response model for all API responses.
    
    This model serves as the foundation for all API responses, providing
    consistent fields across all endpoints including success status,
    timestamps, and error details when needed.
    """
    success: bool = Field(
        ..., 
        description="Whether the request was successful",
        example=True
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="UTC timestamp when the response was generated",
        example="2023-05-15T14:30:00Z"
    )
    message: Optional[str] = Field(
        None,
        description="Optional human-readable message about the response",
        example="Data retrieved successfully"
    )
    error: Optional[ErrorDetail] = Field(
        None,
        description="Error details if the request failed",
        example=None
    )

class DataResponse(BaseResponse, GenericModel, Generic[T]):
    """
    Generic data response model for endpoints that return data.
    
    This model extends the base response with a data field that can contain
    any type of data. The generic type T allows for strong typing of the
    data field based on the specific endpoint implementation.
    """
    data: Optional[T] = Field(
        None,
        description="Response data payload",
        example={"consumption": [{"date": "2023-01-01", "value": 150.2}]}
    )

class PaginationMetadata(BaseModel):
    """
    Metadata for paginated responses.
    
    Provides information about the current page, total items, and links
    to navigate between pages of results.
    """
    page: int = Field(
        ..., 
        description="Current page number",
        example=1,
        ge=1
    )
    page_size: int = Field(
        ..., 
        description="Number of items per page",
        example=20,
        ge=1
    )
    total_items: int = Field(
        ..., 
        description="Total number of items across all pages",
        example=157,
        ge=0
    )
    total_pages: int = Field(
        ..., 
        description="Total number of pages",
        example=8,
        ge=0
    )
    links: Dict[str, Optional[str]] = Field(
        ...,
        description="Navigation links for pagination",
        example={
            "self": "/api/v1/buildings?page=1&page_size=20",
            "next": "/api/v1/buildings?page=2&page_size=20",
            "prev": None,
            "first": "/api/v1/buildings?page=1&page_size=20",
            "last": "/api/v1/buildings?page=8&page_size=20"
        }
    )

class PaginatedResponse(DataResponse, Generic[T]):
    """
    Response model for paginated data.
    
    Extends the data response with pagination metadata to help clients
    navigate through large datasets effectively.
    """
    pagination: PaginationMetadata = Field(
        ...,
        description="Pagination metadata"
    )

class ErrorResponse(BaseResponse):
    """
    Enhanced error response model.
    
    Provides detailed error information for troubleshooting API issues
    with standardized fields that help clients handle errors systematically.
    This model is used when a request fails due to client error or server error.
    """
    success: bool = Field(
        False,
        description="Always false for error responses",
        example=False
    )
    error: ErrorDetail = Field(
        ...,
        description="Detailed error information"
    )
    trace_id: Optional[str] = Field(
        None,
        description="Unique identifier for tracking this error",
        example="e7a3a8b2-8c4e-4b9a-b1f5-12a67e4d85a1"
    )
    documentation_url: Optional[str] = Field(
        None,
        description="URL to documentation about this error",
        example="https://docs.energyaioptimizer.com/errors/DATA_NOT_FOUND"
    )

# Pre-defined error responses for common error cases
NOT_FOUND_ERROR = ErrorResponse(
    success=False,
    message="Resource not found",
    error=ErrorDetail(
        code="RESOURCE_NOT_FOUND",
        message="The requested resource could not be found",
        severity=ErrorSeverity.ERROR
    )
)

VALIDATION_ERROR = ErrorResponse(
    success=False,
    message="Validation error",
    error=ErrorDetail(
        code="VALIDATION_ERROR",
        message="The request data failed validation",
        severity=ErrorSeverity.ERROR
    )
)

UNAUTHORIZED_ERROR = ErrorResponse(
    success=False,
    message="Authentication required",
    error=ErrorDetail(
        code="UNAUTHORIZED",
        message="Authentication is required to access this resource",
        severity=ErrorSeverity.ERROR
    )
)

FORBIDDEN_ERROR = ErrorResponse(
    success=False,
    message="Access forbidden",
    error=ErrorDetail(
        code="FORBIDDEN",
        message="You do not have permission to access this resource",
        severity=ErrorSeverity.ERROR
    )
)

INTERNAL_SERVER_ERROR = ErrorResponse(
    success=False,
    message="Internal server error",
    error=ErrorDetail(
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred on the server",
        severity=ErrorSeverity.CRITICAL
    )
)

# Authentication response models for future implementation
class TokenResponse(BaseResponse):
    """
    Token response model for authentication endpoints.
    
    Used when issuing access tokens for authenticated API access.
    This model will be extended in the future authentication implementation.
    """
    access_token: str = Field(
        ...,
        description="JWT access token for authenticated requests",
        example="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    )
    token_type: str = Field(
        "bearer",
        description="Type of the issued token",
        example="bearer"
    )
    expires_in: int = Field(
        ...,
        description="Token expiration time in seconds",
        example=3600
    )
    refresh_token: Optional[str] = Field(
        None,
        description="Optional refresh token for obtaining a new access token",
        example="def502003f2e8d75..."
    )

class ApiKeyResponse(BaseResponse):
    """
    API key response model for API key management endpoints.
    
    Used when generating or retrieving API keys for authenticated access.
    This model will be part of the future authentication implementation.
    """
    api_key: str = Field(
        ...,
        description="Generated API key for authenticated requests",
        example="eaio_sk_12345abcdef..."
    )
    name: str = Field(
        ...,
        description="Name of the API key",
        example="Production Frontend"
    )
    created_at: datetime = Field(
        ...,
        description="UTC timestamp when the API key was created",
        example="2023-05-15T14:30:00Z"
    )
    expires_at: datetime = Field(
        ...,
        description="UTC timestamp when the API key will expire",
        example="2023-08-15T14:30:00Z"
    )
    permissions: List[str] = Field(
        ...,
        description="List of permissions granted to this API key",
        example=["read:data", "read:analysis"]
    )

# Energy Consumption Data Models
class ConsumptionDataPoint(BaseModel):
    """
    Model for a single energy consumption data point.
    """
    timestamp: str = Field(
        ...,
        description="ISO timestamp for the data point",
        example="2023-01-01T00:00:00Z"
    )
    value: float = Field(
        ...,
        description="Energy consumption value",
        example=150.2
    )
    unit: str = Field(
        "kWh",
        description="Unit of measurement",
        example="kWh"
    )

class TimeSeriesData(BaseModel):
    """
    Model for a time series of consumption data.
    """
    name: str = Field(
        ...,
        description="Name of the time series",
        example="Electricity Consumption"
    )
    series: List[ConsumptionDataPoint] = Field(
        ...,
        description="List of data points in the time series"
    )
    unit: str = Field(
        "kWh",
        description="Unit of measurement",
        example="kWh"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional metadata for the time series",
        example={"source": "BDG2 Dataset", "building_id": "building-123"}
    )

# Analysis Response Models
class ConsumptionPatternData(BaseModel):
    """
    Model for energy consumption pattern analysis results.
    """
    overall_statistics: Dict[str, Any] = Field(
        ...,
        description="Overall statistics about the consumption data",
        example={
            "average_daily": 120.5,
            "peak_load": 180.2,
            "total_consumption": 3742.5,
            "variance": 45.8
        }
    )
    time_patterns: Dict[str, Any] = Field(
        ...,
        description="Patterns based on time periods",
        example={
            "daily": [{"hour": 8, "value": 45.2}, {"hour": 9, "value": 78.5}],
            "weekly": [{"day": "Monday", "value": 145.7}, {"day": "Tuesday", "value": 132.3}],
            "monthly": [{"month": "January", "value": 4567.8}, {"month": "February", "value": 3982.1}]
        }
    )
    trends: Dict[str, Any] = Field(
        ...,
        description="Identified trends in the data",
        example={
            "upward_trend": True,
            "growth_rate": 0.05,
            "seasonal_patterns": True
        }
    )
    time_series: TimeSeriesData = Field(
        ...,
        description="Consumption time series data with patterns highlighted"
    )

class AnomalyData(BaseModel):
    """
    Model for energy consumption anomaly detection results.
    """
    anomalies: List[Dict[str, Any]] = Field(
        ...,
        description="List of detected anomalies",
        example=[
            {
                "timestamp": "2023-01-15T08:00:00Z",
                "value": 250.3,
                "expected_value": 150.0,
                "deviation_percentage": 66.8,
                "severity": "high"
            }
        ]
    )
    summary: Dict[str, Any] = Field(
        ...,
        description="Summary of anomaly detection results",
        example={
            "total_anomalies": 3,
            "high_severity": 1,
            "medium_severity": 2,
            "low_severity": 0,
            "potential_savings": 350.2
        }
    )
    time_series: TimeSeriesData = Field(
        ...,
        description="Consumption time series data with anomalies highlighted"
    )

class WeatherCorrelationData(BaseModel):
    """
    Model for energy consumption and weather correlation results.
    """
    correlations: Dict[str, float] = Field(
        ...,
        description="Correlation coefficients between energy consumption and weather variables",
        example={
            "temperature": 0.85,
            "humidity": 0.42,
            "wind_speed": 0.16,
            "precipitation": -0.05
        }
    )
    regression_models: Dict[str, Dict[str, Any]] = Field(
        ...,
        description="Regression models for predicting consumption from weather",
        example={
            "temperature_model": {
                "r_squared": 0.72,
                "coefficients": {"intercept": 100.2, "temperature": 5.3},
                "significance": 0.001
            }
        }
    )
    consumption_series: TimeSeriesData = Field(
        ...,
        description="Energy consumption time series"
    )
    weather_series: Dict[str, TimeSeriesData] = Field(
        ...,
        description="Weather variable time series"
    )

class BuildingComparisonData(BaseModel):
    """
    Model for comparing energy consumption across multiple buildings.
    """
    buildings: List[Dict[str, Any]] = Field(
        ...,
        description="Information about each building in the comparison",
        example=[
            {
                "building_id": "building-123",
                "name": "Office Building A",
                "total_consumption": 45678.9,
                "normalized_consumption": 120.5,
                "floor_area": 3500.0
            }
        ]
    )
    comparative_metrics: Dict[str, Dict[str, Any]] = Field(
        ...,
        description="Metrics for comparing buildings",
        example={
            "consumption_per_sqm": {
                "min": 80.5,
                "max": 150.3,
                "average": 105.7,
                "median": 100.2
            },
            "efficiency_ranking": [
                {"building_id": "building-456", "rank": 1, "score": 85.3},
                {"building_id": "building-123", "rank": 2, "score": 92.7}
            ]
        }
    )
    time_series: Dict[str, TimeSeriesData] = Field(
        ...,
        description="Consumption time series for each building"
    )

# Forecast Response Models
class ForecastDataPoint(BaseModel):
    """
    Model for a single forecasted data point.
    """
    timestamp: str = Field(
        ...,
        description="ISO timestamp for the forecast point",
        example="2023-02-01T00:00:00Z"
    )
    value: float = Field(
        ...,
        description="Forecasted value",
        example=145.8
    )
    lower_bound: Optional[float] = Field(
        None,
        description="Lower bound of the confidence interval",
        example=130.2
    )
    upper_bound: Optional[float] = Field(
        None,
        description="Upper bound of the confidence interval",
        example=160.5
    )
    confidence_level: Optional[float] = Field(
        None,
        description="Confidence level for the interval",
        example=0.95
    )

class ForecastSeriesData(BaseModel):
    """
    Model for a time series of forecast data.
    """
    name: str = Field(
        ...,
        description="Name of the forecast series",
        example="Electricity Consumption Forecast"
    )
    series: List[ForecastDataPoint] = Field(
        ...,
        description="List of forecast data points"
    )
    unit: str = Field(
        "kWh",
        description="Unit of measurement",
        example="kWh"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional metadata for the forecast",
        example={"model": "ARIMA", "seasonality": "daily"}
    )

class ForecastData(BaseModel):
    """
    Model for energy consumption forecast results.
    """
    forecast: ForecastSeriesData = Field(
        ...,
        description="Forecasted energy consumption time series"
    )
    historical: Optional[TimeSeriesData] = Field(
        None,
        description="Historical energy consumption time series used for the forecast"
    )
    model_info: Dict[str, Any] = Field(
        ...,
        description="Information about the forecasting model used",
        example={
            "model_type": "ARIMA",
            "parameters": {"p": 1, "d": 1, "q": 1},
            "accuracy_metrics": {
                "mape": 5.2,
                "rmse": 12.5,
                "mae": 10.3
            }
        }
    )
    insights: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Insights derived from the forecast",
        example=[
            {
                "type": "peak_load",
                "description": "Peak load expected on Feb 15 at 2pm",
                "value": 200.5,
                "timestamp": "2023-02-15T14:00:00Z"
            }
        ]
    )
    weather_factors: Optional[Dict[str, Any]] = Field(
        None,
        description="Weather factors influencing the forecast",
        example={
            "included": True,
            "temperature_forecast": {"min": 5.0, "max": 15.0, "avg": 10.2},
            "impact_factor": 0.72
        }
    )

class ForecastEvaluationData(BaseModel):
    """
    Model for evaluating forecast accuracy against actual data.
    """
    overall_accuracy: Dict[str, float] = Field(
        ...,
        description="Overall accuracy metrics",
        example={
            "mape": 5.2,
            "rmse": 12.5,
            "mae": 10.3,
            "r_squared": 0.85
        }
    )
    error_distribution: Dict[str, Any] = Field(
        ...,
        description="Distribution of forecast errors",
        example={
            "mean_error": 5.2,
            "std_deviation": 8.3,
            "histogram": [
                {"bin": "-20 to -10", "count": 5},
                {"bin": "-10 to 0", "count": 45},
                {"bin": "0 to 10", "count": 52},
                {"bin": "10 to 20", "count": 8}
            ]
        }
    )
    time_based_accuracy: Dict[str, Any] = Field(
        ...,
        description="Accuracy metrics broken down by time periods",
        example={
            "daily": [
                {"day": "Monday", "mape": 4.5},
                {"day": "Tuesday", "mape": 5.7}
            ],
            "hourly": [
                {"hour": 9, "mape": 8.2},
                {"hour": 10, "mape": 6.5}
            ]
        }
    )
    comparison: Dict[str, List[Dict[str, Any]]] = Field(
        ...,
        description="Comparison of forecast vs. actual values",
        example={
            "points": [
                {
                    "timestamp": "2023-02-01T00:00:00Z",
                    "forecast": 145.8,
                    "actual": 150.2,
                    "error": -4.4,
                    "percentage_error": -2.9
                }
            ]
        }
    )

# Recommendation Response Models
class RecommendationItem(BaseModel):
    """
    Model for a single energy optimization recommendation.
    """
    id: str = Field(
        ...,
        description="Unique identifier for the recommendation",
        example="rec-123456"
    )
    title: str = Field(
        ...,
        description="Title of the recommendation",
        example="Adjust HVAC Operating Hours"
    )
    description: str = Field(
        ...,
        description="Detailed description of the recommendation",
        example="Reduce HVAC operating hours by 1 hour in the morning and evening to save energy during low occupancy periods."
    )
    category: str = Field(
        ...,
        description="Category of the recommendation",
        example="HVAC Optimization"
    )
    impact: Dict[str, Any] = Field(
        ...,
        description="Impact of implementing the recommendation",
        example={
            "energy_savings": 1250.5,
            "cost_savings": 187.58,
            "co2_reduction": 625.25,
            "payback_period": 0.0,  # Immediate payback
            "impact_level": "medium"
        }
    )
    implementation: Dict[str, Any] = Field(
        ...,
        description="Implementation details for the recommendation",
        example={
            "difficulty": "easy",
            "estimated_time": "1 day",
            "required_resources": ["Building Management System Access"],
            "steps": [
                "Access BMS scheduler",
                "Adjust morning start time from 6:00 AM to 7:00 AM",
                "Adjust evening end time from 8:00 PM to 7:00 PM"
            ]
        }
    )
    evidence: Optional[Dict[str, Any]] = Field(
        None,
        description="Evidence supporting the recommendation",
        example={
            "analysis_type": "consumption_patterns",
            "supporting_data": {
                "occupancy_hours": {"start": "8:00 AM", "end": "6:00 PM"},
                "current_hvac_hours": {"start": "6:00 AM", "end": "8:00 PM"},
                "low_occupancy_consumption": 45.2
            }
        }
    )
    status: Optional[str] = Field(
        "pending",
        description="Status of the recommendation implementation",
        example="pending"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the recommendation was created",
        example="2023-05-15T14:30:00Z"
    )

class RecommendationsData(BaseModel):
    """
    Model for energy optimization recommendations results.
    """
    recommendations: List[RecommendationItem] = Field(
        ...,
        description="List of energy optimization recommendations"
    )
    summary: Dict[str, Any] = Field(
        ...,
        description="Summary of all recommendations",
        example={
            "total_recommendations": 5,
            "total_potential_savings": 4520.75,
            "total_cost_savings": 678.11,
            "total_co2_reduction": 2260.38,
            "by_category": {
                "HVAC Optimization": 2,
                "Lighting Efficiency": 1,
                "Equipment Scheduling": 2
            },
            "by_impact": {
                "high": 1,
                "medium": 3,
                "low": 1
            },
            "by_difficulty": {
                "easy": 2,
                "medium": 2,
                "difficult": 1
            }
        }
    )
    user_role_adaptations: Optional[Dict[str, Any]] = Field(
        None,
        description="Role-specific adaptations applied to the recommendations",
        example={
            "user_role": "facility_manager",
            "focus_areas": ["Operational Adjustments", "Maintenance"],
            "detail_level": "technical",
            "priority_basis": "implementation_ease"
        }
    )
    supporting_analysis: Optional[Dict[str, Any]] = Field(
        None,
        description="Analysis results that support these recommendations",
        example={
            "analysis_types": ["consumption_patterns", "anomalies"],
            "analysis_period": {
                "start_date": "2023-01-01",
                "end_date": "2023-01-31"
            }
        }
    )
