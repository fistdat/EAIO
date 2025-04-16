"""
Building router for the API Gateway.
Provides endpoints for building management and data retrieval.
"""

from fastapi import APIRouter, Depends, HTTPException, Body, Query
from typing import Dict, List, Optional, Any
from datetime import datetime
import httpx
import logging

from ..api_responses import DataResponse, PaginatedResponse

# Set up logger
logger = logging.getLogger("eaio.gateway.building")

# Create router
router = APIRouter(prefix="/buildings", tags=["Buildings"])

# Define base URL for building service
BUILDING_SERVICE_URL = "http://localhost:8000/api/v1/buildings"

@router.get("/", response_model=PaginatedResponse)
async def list_buildings(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search term for building name or ID"),
    building_type: Optional[str] = Query(None, description="Filter by building type")
):
    """
    List buildings with pagination.
    
    This endpoint forwards the request to the Building service and returns
    a paginated list of buildings.
    """
    try:
        logger.info(f"Requesting building list, page: {page}, size: {page_size}")
        
        # Construct query parameters
        params = {
            "page": page,
            "page_size": page_size
        }
        
        if search:
            params["search"] = search
            
        if building_type:
            params["building_type"] = building_type
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                BUILDING_SERVICE_URL,
                params=params,
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.error(f"Building service error: {response.status_code}, {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Building service error: {response.text}"
                )
            
            # Create a standardized response
            buildings_data = response.json()
            
            return PaginatedResponse(
                success=True,
                message=f"Buildings retrieved",
                data=buildings_data.get("items", []),
                pagination=buildings_data.get("pagination", {})
            )
            
    except httpx.RequestError as exc:
        logger.error(f"Error communicating with building service: {str(exc)}")
        raise HTTPException(
            status_code=503,
            detail=f"Building service communication error: {str(exc)}"
        )
    except Exception as exc:
        logger.error(f"Unexpected error in building list request: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(exc)}"
        )

@router.get("/{building_id}", response_model=DataResponse)
async def get_building_details(building_id: str):
    """
    Get details for a specific building.
    
    This endpoint forwards the request to the Building service and returns
    detailed information about the specified building.
    """
    try:
        logger.info(f"Requesting details for building: {building_id}")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BUILDING_SERVICE_URL}/{building_id}",
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.error(f"Building service error: {response.status_code}, {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Building service error: {response.text}"
                )
            
            # Create a standardized response
            building_data = response.json()
            
            return DataResponse(
                success=True,
                message=f"Building details retrieved for {building_id}",
                data=building_data
            )
            
    except httpx.RequestError as exc:
        logger.error(f"Error communicating with building service: {str(exc)}")
        raise HTTPException(
            status_code=503,
            detail=f"Building service communication error: {str(exc)}"
        )
    except Exception as exc:
        logger.error(f"Unexpected error in building details request: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(exc)}"
        )

@router.get("/{building_id}/consumption", response_model=DataResponse)
async def get_building_consumption(
    building_id: str,
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    metric: str = Query("electricity", description="Energy metric to retrieve"),
    interval: str = Query("day", description="Aggregation interval")
):
    """
    Get consumption data for a specific building.
    
    This endpoint forwards the request to the Building service and returns
    energy consumption data for the specified building.
    """
    try:
        logger.info(f"Requesting consumption data for building: {building_id}, metric: {metric}")
        
        # Construct query parameters
        params = {
            "start_date": start_date,
            "end_date": end_date,
            "metric": metric,
            "interval": interval
        }
        
        # Filter out None values
        params = {k: v for k, v in params.items() if v is not None}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BUILDING_SERVICE_URL}/{building_id}/consumption",
                params=params,
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.error(f"Building service error: {response.status_code}, {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Building service error: {response.text}"
                )
            
            # Create a standardized response
            consumption_data = response.json()
            
            return DataResponse(
                success=True,
                message=f"Consumption data retrieved for building {building_id}",
                data=consumption_data
            )
            
    except httpx.RequestError as exc:
        logger.error(f"Error communicating with building service: {str(exc)}")
        raise HTTPException(
            status_code=503,
            detail=f"Building service communication error: {str(exc)}"
        )
    except Exception as exc:
        logger.error(f"Unexpected error in consumption data request: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(exc)}"
        ) 