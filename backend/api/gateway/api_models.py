"""
API Gateway request/response models for the Energy AI Optimizer.
Defines standardized request and response models for all API endpoints.
"""

from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, validator
from enum import Enum

# Define enums for better documentation and type validation
class MetricType(str, Enum):
    """Type of energy consumption metrics that can be analyzed."""
    ELECTRICITY = "electricity"
    WATER = "water"
    GAS = "gas"
    STEAM = "steam"
    HOTWATER = "hotwater"
    CHILLEDWATER = "chilledwater"

class AnalysisType(str, Enum):
    """Type of analysis that can be performed on building energy data."""
    CONSUMPTION_PATTERNS = "consumption_patterns"
    ANOMALIES = "anomalies"
    WEATHER_CORRELATION = "weather_correlation"
    BENCHMARK = "benchmark"
    PEAK_LOAD = "peak_load"
    BASELINE = "baseline"
    BUILDING_COMPARISON = "building_comparison"

class ForecastHorizon(str, Enum):
    """Time horizons for energy consumption forecasting."""
    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"

class UserRole(str, Enum):
    """User roles for personalized recommendations and insights."""
    FACILITY_MANAGER = "facility_manager"
    ENERGY_ANALYST = "energy_analyst"
    EXECUTIVE = "executive"

class Interval(str, Enum):
    """Time intervals for data aggregation."""
    HOUR = "hour"
    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    YEAR = "year"

class AnomalySensitivity(str, Enum):
    """Sensitivity levels for anomaly detection."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

# Request parameter models
class DateRangeParams(BaseModel):
    """
    Date range parameters for time-based API requests.
    
    Used to specify a time period for data analysis, forecasting, and recommendations.
    """
    start_date: Optional[str] = Field(
        None, 
        description="Start date for the analysis period (ISO format)",
        example="2023-01-01"
    )
    end_date: Optional[str] = Field(
        None, 
        description="End date for the analysis period (ISO format)",
        example="2023-01-31"
    )
    interval: Optional[Interval] = Field(
        None, 
        description="Time interval for data aggregation",
        example="day"
    )

class BuildingParams(BaseModel):
    """
    Building parameters for building-specific API requests.
    
    Used to specify which buildings to analyze or forecast energy consumption for.
    """
    building_id: str = Field(
        ...,
        description="Building identifier to analyze",
        example="building-123"
    )
    metric: Optional[MetricType] = Field(
        MetricType.ELECTRICITY,
        description="Energy consumption metric to analyze",
        example="electricity"
    )

# Base Gateway Request model
class GatewayRequest(BaseModel):
    """
    Base request model for all Gateway API requests.
    
    This model serves as the foundation for all specific request types.
    """
    agent: str = Field(
        ...,
        description="Agent to handle the request",
        example="data_analysis"
    )
    action: str = Field(
        ...,
        description="Action to perform",
        example="analyze_consumption_patterns"
    )
    parameters: Dict[str, Any] = Field(
        ...,
        description="Parameters for the action",
        example={
            "building_id": "building-123",
            "start_date": "2023-01-01",
            "end_date": "2023-01-31",
            "energy_type": "electricity"
        }
    )

# Specific request models
class AnalysisRequest(BaseModel):
    """
    Request model for data analysis endpoints.
    
    Used to request analysis of building energy consumption data.
    """
    building_id: str = Field(
        ...,
        description="Building identifier to analyze",
        example="building-123"
    )
    start_date: Optional[str] = Field(
        None,
        description="Start date for analysis (ISO format)",
        example="2023-01-01"
    )
    end_date: Optional[str] = Field(
        None,
        description="End date for analysis (ISO format)",
        example="2023-01-31"
    )
    metric: Optional[str] = Field(
        "electricity",
        description="Energy consumption metric to analyze",
        example="electricity"
    )
    analysis_type: Optional[str] = Field(
        "consumption_patterns",
        description="Type of analysis to perform",
        example="consumption_patterns"
    )
    sensitivity: Optional[AnomalySensitivity] = Field(
        AnomalySensitivity.MEDIUM,
        description="Sensitivity level for anomaly detection",
        example="medium"
    )
    include_weather: Optional[bool] = Field(
        False,
        description="Whether to include weather data in the analysis",
        example=True
    )
    building_ids_to_compare: Optional[List[str]] = Field(
        None,
        description="List of building IDs to compare (for building_comparison analysis)",
        example=["building-123", "building-456"]
    )

    class Config:
        schema_extra = {
            "example": {
                "building_id": "building-123",
                "start_date": "2023-01-01",
                "end_date": "2023-01-31",
                "metric": "electricity",
                "analysis_type": "consumption_patterns",
                "sensitivity": "medium",
                "include_weather": True
            }
        }

class ForecastRequest(BaseModel):
    """
    Request model for forecasting endpoints.
    
    Used to request forecasts of future building energy consumption.
    """
    building_id: str = Field(
        ...,
        description="Building identifier to forecast",
        example="building-123"
    )
    start_date: Optional[str] = Field(
        None,
        description="Start date for forecast (ISO format)",
        example="2023-02-01"
    )
    end_date: Optional[str] = Field(
        None,
        description="End date for forecast (ISO format)",
        example="2023-02-28"
    )
    consumption_type: Optional[str] = Field(
        "electricity",
        description="Energy consumption metric to forecast",
        example="electricity"
    )
    horizon: str = Field(
        "week",
        description="Time horizon for the forecast",
        example="week"
    )
    interval: Optional[str] = Field(
        "day",
        description="Time interval for forecast data points",
        example="day"
    )
    include_weather: Optional[bool] = Field(
        False,
        description="Whether to include weather data in the forecast",
        example=True
    )
    weather_data: Optional[Dict[str, Any]] = Field(
        None,
        description="Weather forecast data if available",
        example={"temperature": [{"date": "2023-02-01", "value": 20.5}]}
    )
    confidence_level: Optional[float] = Field(
        0.95,
        description="Confidence level for forecast intervals (0.0-1.0)",
        example=0.95,
        ge=0.0,
        le=1.0
    )

    class Config:
        schema_extra = {
            "example": {
                "building_id": "building-123",
                "start_date": "2023-02-01",
                "end_date": "2023-02-28",
                "consumption_type": "electricity",
                "horizon": "week",
                "interval": "day",
                "include_weather": True,
                "confidence_level": 0.95
            }
        }

class RecommendationRequest(BaseModel):
    """
    Request model for recommendation endpoints.
    
    Used to request energy-saving recommendations based on building data analysis.
    """
    building_id: str = Field(
        ...,
        description="Building identifier to generate recommendations for",
        example="building-123"
    )
    user_role: UserRole = Field(
        UserRole.FACILITY_MANAGER,
        description="User role for personalized recommendations",
        example="facility_manager"
    )
    energy_type: Optional[str] = Field(
        "electricity",
        description="Energy type to focus recommendations on",
        example="electricity"
    )
    start_date: Optional[str] = Field(
        None,
        description="Start date for recommendation data (ISO format)",
        example="2023-01-01"
    )
    end_date: Optional[str] = Field(
        None,
        description="End date for recommendation data (ISO format)",
        example="2023-01-31"
    )
    analysis_data: Optional[Dict[str, Any]] = Field(
        None,
        description="Analysis results to base recommendations on (if already computed)",
        example={"anomalies": [{"date": "2023-01-15", "value": 120.5, "expected": 100.0}]}
    )
    max_recommendations: Optional[int] = Field(
        5,
        description="Maximum number of recommendations to return",
        example=5,
        ge=1,
        le=20
    )
    include_roi: Optional[bool] = Field(
        True,
        description="Whether to include ROI calculations with recommendations",
        example=True
    )

    class Config:
        schema_extra = {
            "example": {
                "building_id": "building-123",
                "user_role": "facility_manager",
                "energy_type": "electricity",
                "start_date": "2023-01-01",
                "end_date": "2023-01-31",
                "max_recommendations": 5,
                "include_roi": True
            }
        }

class ApiKeyRequest(BaseModel):
    """
    Request model for API key generation.
    
    This model will be used for the future implementation of API key authentication.
    """
    name: str = Field(
        ...,
        description="Name of the API key for identification",
        example="Production Frontend"
    )
    expires_in_days: Optional[int] = Field(
        90,
        description="Number of days until the API key expires",
        example=90,
        ge=1,
        le=365
    )
    permissions: Optional[List[str]] = Field(
        ["read:data", "read:analysis"],
        description="List of permissions for the API key",
        example=["read:data", "read:analysis"]
    )

    class Config:
        schema_extra = {
            "example": {
                "name": "Production Frontend",
                "expires_in_days": 90,
                "permissions": ["read:data", "read:analysis"]
            }
        }

class LoginRequest(BaseModel):
    """
    Request model for user authentication.
    
    Used to authenticate users and obtain access tokens.
    """
    username: str = Field(
        ...,
        description="Username or email address",
        example="user@example.com"
    )
    password: str = Field(
        ...,
        description="User password",
        example="password123"
    )
    remember_me: Optional[bool] = Field(
        False,
        description="Whether to issue a long-lived token",
        example=False
    )

    class Config:
        schema_extra = {
            "example": {
                "username": "user@example.com",
                "password": "password123",
                "remember_me": False
            }
        }
