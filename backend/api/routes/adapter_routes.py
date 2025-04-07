"""
Adapter API routes for Energy AI Optimizer.
This module defines endpoints for external data source connections.
"""
from fastapi import APIRouter, HTTPException, Path, Query, Body
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging
import random

# Get logger
logger = logging.getLogger("eaio.api.adapter")

# Create router
router = APIRouter(prefix="/adapter", tags=["adapter"])

@router.get("/sources", response_model=Dict[str, Any])
async def get_data_sources():
    """Get list of available data sources."""
    try:
        # Mock data sources
        sources = [
            {
                "id": "bdg2",
                "name": "Building Data Genome 2",
                "type": "building_data",
                "description": "Collection of non-residential building datasets for energy data analysis",
                "connection_status": "active"
            },
            {
                "id": "openweather",
                "name": "OpenWeatherMap",
                "type": "weather_data",
                "description": "Weather data API providing current, forecast and historical weather data",
                "connection_status": "active"
            },
            {
                "id": "bms_connector",
                "name": "Building Management System Connector",
                "type": "building_automation",
                "description": "Integration with building management systems for real-time data",
                "connection_status": "inactive"
            }
        ]
        
        return {"items": sources, "total": len(sources)}
    
    except Exception as e:
        logger.error(f"Error retrieving data sources: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/source/{source_id}", response_model=Dict[str, Any])
async def get_data_source(
    source_id: str = Path(..., description="Data source identifier")
):
    """Get details of a specific data source."""
    try:
        # Mock data sources detail
        sources = {
            "bdg2": {
                "id": "bdg2",
                "name": "Building Data Genome 2",
                "type": "building_data",
                "description": "Collection of non-residential building datasets for energy data analysis",
                "connection_status": "active",
                "metadata": {
                    "version": "2.0",
                    "buildings": 1636,
                    "data_points": ["electricity", "water", "steam", "hotwater", "chilledwater", "gas"],
                    "time_range": {
                        "start": "2016-01-01",
                        "end": "2017-12-31"
                    }
                }
            },
            "openweather": {
                "id": "openweather",
                "name": "OpenWeatherMap",
                "type": "weather_data",
                "description": "Weather data API providing current, forecast and historical weather data",
                "connection_status": "active",
                "metadata": {
                    "api_version": "2.5",
                    "parameters": ["temperature", "humidity", "pressure", "wind", "precipitation"],
                    "update_frequency": "hourly",
                    "locations_supported": "global"
                }
            },
            "bms_connector": {
                "id": "bms_connector",
                "name": "Building Management System Connector",
                "type": "building_automation",
                "description": "Integration with building management systems for real-time data",
                "connection_status": "inactive",
                "metadata": {
                    "supported_systems": ["Siemens Desigo", "Johnson Controls Metasys", "Honeywell EBI"],
                    "protocols": ["BACnet", "Modbus", "OPC UA"],
                    "data_frequency": "real-time"
                }
            }
        }
        
        if source_id not in sources:
            raise HTTPException(status_code=404, detail=f"Data source not found: {source_id}")
        
        return sources[source_id]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving data source {source_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/connect", response_model=Dict[str, Any])
async def connect_data_source(
    request: Dict[str, Any] = Body(...)
):
    """Connect to an external data source."""
    try:
        # Validate request
        required_fields = ["source_id", "credentials"]
        for field in required_fields:
            if field not in request:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Mock successful connection
        return {
            "source_id": request["source_id"],
            "connection_status": "active",
            "connected_at": datetime.now().isoformat(),
            "token": "mock-connection-token-" + str(random.randint(10000, 99999)),
            "expires_at": (datetime.now() + timedelta(hours=24)).isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error connecting to data source: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/disconnect/{source_id}", response_model=Dict[str, Any])
async def disconnect_data_source(
    source_id: str = Path(..., description="Data source identifier")
):
    """Disconnect from an external data source."""
    try:
        # Mock successful disconnection
        return {
            "source_id": source_id,
            "connection_status": "inactive",
            "disconnected_at": datetime.now().isoformat(),
            "message": f"Successfully disconnected from {source_id}"
        }
    
    except Exception as e:
        logger.error(f"Error disconnecting from data source {source_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/metrics", response_model=Dict[str, Any])
async def get_adapter_metrics():
    """Get metrics about adapter performance and usage."""
    try:
        # Mock metrics data
        current_time = datetime.now()
        
        return {
            "request_metrics": {
                "total_requests": 1245,
                "successful_requests": 1198,
                "failed_requests": 47,
                "success_rate": 96.2
            },
            "source_metrics": {
                "bdg2": {
                    "requests": 734,
                    "data_volume": "156.2 MB",
                    "avg_response_time": 210
                },
                "openweather": {
                    "requests": 511,
                    "data_volume": "24.8 MB",
                    "avg_response_time": 320
                }
            },
            "performance": {
                "cache_hit_rate": 78.5,
                "avg_request_time": 245,
                "peak_requests_per_minute": 24
            },
            "timestamp": current_time.isoformat(),
            "last_reset": (current_time - timedelta(days=30)).isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error retrieving adapter metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/fetch-data", response_model=Dict[str, Any])
async def fetch_external_data(
    request: Dict[str, Any] = Body(...)
):
    """Fetch data from an external source."""
    try:
        # Validate request
        required_fields = ["source_id", "data_type"]
        for field in required_fields:
            if field not in request:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Mock fetch response based on source and data type
        source_id = request["source_id"]
        data_type = request["data_type"]
        
        if source_id == "bdg2" and data_type == "electricity":
            # Mock electricity consumption data
            return {
                "source_id": source_id,
                "data_type": data_type,
                "timestamp": datetime.now().isoformat(),
                "data": [
                    {"building_id": "1", "timestamp": "2023-06-01T00:00:00", "value": 125.6},
                    {"building_id": "1", "timestamp": "2023-06-01T01:00:00", "value": 118.2},
                    {"building_id": "1", "timestamp": "2023-06-01T02:00:00", "value": 112.9}
                ]
            }
        elif source_id == "openweather" and data_type == "temperature":
            # Mock temperature data
            return {
                "source_id": source_id,
                "data_type": data_type,
                "timestamp": datetime.now().isoformat(),
                "data": [
                    {"location": "New York", "timestamp": "2023-06-01T00:00:00", "value": 22.5},
                    {"location": "New York", "timestamp": "2023-06-01T01:00:00", "value": 21.8},
                    {"location": "New York", "timestamp": "2023-06-01T02:00:00", "value": 21.2}
                ]
            }
        else:
            # Generic mock response
            return {
                "source_id": source_id,
                "data_type": data_type,
                "timestamp": datetime.now().isoformat(),
                "message": f"Mock data fetched for {source_id}/{data_type}",
                "data": []
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching external data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}") 