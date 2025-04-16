"""
Forecast router for the API Gateway.
Provides endpoints for forecasting building energy consumption.
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, List, Optional, Any
from datetime import datetime
import httpx
import logging

from ..api_models import ForecastRequest
from ..api_responses import DataResponse

# Set up logger
logger = logging.getLogger("eaio.gateway.forecast")

# Create router
router = APIRouter(prefix="/forecasts", tags=["Forecasting"])

# Define base URL for forecasting service
FORECAST_SERVICE_URL = "http://localhost:8002/api/v1/forecasts"

@router.post("/", response_model=DataResponse)
async def proxy_forecast_request(request: ForecastRequest = Body(...)):
    """
    Generate energy consumption forecast.
    
    This endpoint forwards the forecast request to the Forecasting service
    and returns the forecast results.
    """
    try:
        logger.info(f"Forwarding forecast request for horizon: {request.horizon}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                FORECAST_SERVICE_URL,
                json=request.dict(),
                timeout=60.0  # Forecasting may take time for complex models
            )
            
            if response.status_code != 200:
                logger.error(f"Forecast service error: {response.status_code}, {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Forecast service error: {response.text}"
                )
            
            # Create a standardized response
            forecast_data = response.json()
            
            return DataResponse(
                success=True,
                message=f"Forecast generated for {request.horizon} horizon",
                data=forecast_data
            )
            
    except httpx.RequestError as exc:
        logger.error(f"Error communicating with forecast service: {str(exc)}")
        raise HTTPException(
            status_code=503,
            detail=f"Forecast service communication error: {str(exc)}"
        )
    except Exception as exc:
        logger.error(f"Unexpected error in forecast request: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(exc)}"
        )

@router.get("/{building_id}", response_model=DataResponse)
async def get_building_forecast(
    building_id: str,
    horizon: str = "week",
    start_date: Optional[str] = None,
    include_weather: bool = False
):
    """
    Get forecast for a specific building.
    
    This endpoint forwards the request to the Forecasting service and returns
    energy consumption forecasts for the specified building.
    """
    try:
        logger.info(f"Requesting forecast for building: {building_id}, horizon: {horizon}")
        
        # Construct query parameters
        params = {
            "horizon": horizon,
            "start_date": start_date,
            "include_weather": str(include_weather).lower()
        }
        
        # Filter out None values
        params = {k: v for k, v in params.items() if v is not None}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{FORECAST_SERVICE_URL}/{building_id}",
                params=params,
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.error(f"Forecast service error: {response.status_code}, {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Forecast service error: {response.text}"
                )
            
            # Create a standardized response
            forecast_data = response.json()
            
            return DataResponse(
                success=True,
                message=f"Forecast retrieved for building {building_id}",
                data=forecast_data
            )
            
    except httpx.RequestError as exc:
        logger.error(f"Error communicating with forecast service: {str(exc)}")
        raise HTTPException(
            status_code=503,
            detail=f"Forecast service communication error: {str(exc)}"
        )
    except Exception as exc:
        logger.error(f"Unexpected error in forecast request: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(exc)}"
        )

@router.post("/evaluate", response_model=DataResponse)
async def evaluate_forecast_accuracy(request: Dict[str, Any] = Body(...)):
    """
    Evaluate forecast accuracy against actual data.
    
    This endpoint forwards the request to the Forecasting service to evaluate
    the accuracy of previous forecasts.
    """
    try:
        logger.info("Forwarding forecast evaluation request")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{FORECAST_SERVICE_URL}/evaluate",
                json=request,
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.error(f"Forecast service error: {response.status_code}, {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Forecast service error: {response.text}"
                )
            
            # Create a standardized response
            evaluation_data = response.json()
            
            return DataResponse(
                success=True,
                message="Forecast evaluation completed",
                data=evaluation_data
            )
            
    except httpx.RequestError as exc:
        logger.error(f"Error communicating with forecast service: {str(exc)}")
        raise HTTPException(
            status_code=503,
            detail=f"Forecast service communication error: {str(exc)}"
        )
    except Exception as exc:
        logger.error(f"Unexpected error in forecast evaluation: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(exc)}"
        ) 