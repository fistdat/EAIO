"""
Analysis router for the API Gateway.
Provides endpoints for analyzing building energy consumption data.
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, List, Optional, Any
from datetime import datetime
import httpx
import logging

from ..api_models import AnalysisRequest
from ..api_responses import DataResponse

# Set up logger
logger = logging.getLogger("eaio.gateway.analysis")

# Create router
router = APIRouter(prefix="/analysis", tags=["Analysis"])

# Define base URL for analysis service
ANALYSIS_SERVICE_URL = "http://localhost:8001/api/v1/analysis"

@router.post("/", response_model=DataResponse)
async def proxy_analysis_request(request: AnalysisRequest = Body(...)):
    """
    Analyze building energy consumption data.
    
    This endpoint forwards the analysis request to the Analysis service
    and returns the results.
    """
    try:
        logger.info(f"Forwarding analysis request: {request.analysis_type}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                ANALYSIS_SERVICE_URL,
                json=request.dict(),
                timeout=60.0  # Analysis may take time for complex requests
            )
            
            if response.status_code != 200:
                logger.error(f"Analysis service error: {response.status_code}, {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Analysis service error: {response.text}"
                )
            
            # Create a standardized response
            analysis_data = response.json()
            
            return DataResponse(
                success=True,
                message=f"Analysis completed: {request.analysis_type}",
                data=analysis_data
            )
            
    except httpx.RequestError as exc:
        logger.error(f"Error communicating with analysis service: {str(exc)}")
        raise HTTPException(
            status_code=503,
            detail=f"Analysis service communication error: {str(exc)}"
        )
    except Exception as exc:
        logger.error(f"Unexpected error in analysis request: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(exc)}"
        )

@router.get("/anomalies/{building_id}", response_model=DataResponse)
async def get_anomalies(
    building_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    metric: str = "electricity"
):
    """
    Get anomalies in building energy consumption.
    
    This endpoint forwards the request to the Analysis service and returns
    detected anomalies for the specified building.
    """
    try:
        logger.info(f"Requesting anomalies for building: {building_id}")
        
        # Construct query parameters
        params = {
            "start_date": start_date,
            "end_date": end_date,
            "metric": metric
        }
        
        # Filter out None values
        params = {k: v for k, v in params.items() if v is not None}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{ANALYSIS_SERVICE_URL}/anomalies/{building_id}",
                params=params,
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.error(f"Analysis service error: {response.status_code}, {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Analysis service error: {response.text}"
                )
            
            # Create a standardized response
            anomalies_data = response.json()
            
            return DataResponse(
                success=True,
                message=f"Anomalies retrieved for building {building_id}",
                data=anomalies_data
            )
            
    except httpx.RequestError as exc:
        logger.error(f"Error communicating with analysis service: {str(exc)}")
        raise HTTPException(
            status_code=503,
            detail=f"Analysis service communication error: {str(exc)}"
        )
    except Exception as exc:
        logger.error(f"Unexpected error in anomalies request: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(exc)}"
        )

@router.get("/patterns/{building_id}", response_model=DataResponse)
async def get_consumption_patterns(
    building_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    metric: str = "electricity"
):
    """
    Get consumption patterns for a building.
    
    This endpoint forwards the request to the Analysis service and returns
    consumption patterns for the specified building.
    """
    try:
        logger.info(f"Requesting consumption patterns for building: {building_id}")
        
        # Construct query parameters
        params = {
            "start_date": start_date,
            "end_date": end_date,
            "metric": metric
        }
        
        # Filter out None values
        params = {k: v for k, v in params.items() if v is not None}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{ANALYSIS_SERVICE_URL}/patterns/{building_id}",
                params=params,
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.error(f"Analysis service error: {response.status_code}, {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Analysis service error: {response.text}"
                )
            
            # Create a standardized response
            patterns_data = response.json()
            
            return DataResponse(
                success=True,
                message=f"Consumption patterns retrieved for building {building_id}",
                data=patterns_data
            )
            
    except httpx.RequestError as exc:
        logger.error(f"Error communicating with analysis service: {str(exc)}")
        raise HTTPException(
            status_code=503,
            detail=f"Analysis service communication error: {str(exc)}"
        )
    except Exception as exc:
        logger.error(f"Unexpected error in patterns request: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(exc)}"
        ) 