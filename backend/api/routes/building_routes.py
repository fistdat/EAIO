"""
Building data API routes for Energy AI Optimizer.
This module defines endpoints for retrieving building information and consumption data.
"""
from fastapi import APIRouter, HTTPException, Path, Query, Depends, Body
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from pydantic import BaseModel
import pandas as pd
import os
import json
import logging
import sys
import numpy as np

# Import the processor class, but we'll manually handle data loading
from data.building.building_processor import BuildingDataProcessor

# Get logger
logger = logging.getLogger("eaio.api.routes.building")

# Create router
router = APIRouter(prefix="/buildings", tags=["buildings"])

# Function to load metadata directly
def load_metadata_direct():
    try:
        metadata_file = "/app/data/metadata/metadata.csv"
        if os.path.exists(metadata_file):
            print(f"Loading metadata from {metadata_file}")
            metadata = pd.read_csv(metadata_file)
            print(f"Loaded metadata with shape {metadata.shape}")
            return metadata
        else:
            print(f"Metadata file not found: {metadata_file}")
            return pd.DataFrame()
    except Exception as e:
        print(f"Error loading metadata: {str(e)}")
        return pd.DataFrame()

# Function to load meter data directly
def load_meter_data_direct(meter_type: str):
    try:
        meter_file = f"/app/data/meters/cleaned/{meter_type}_cleaned.csv"
        print(f"Loading {meter_type} data from {meter_file}")
        
        if not os.path.exists(meter_file):
            print(f"Meter data file not found: {meter_file}")
            return pd.DataFrame()
        
        try:
            # First check the file structure by reading just the header
            headers = pd.read_csv(meter_file, nrows=0).columns.tolist()
            print(f"File headers: {headers}")
            
            # Check if timestamp column exists or a suitable alternative
            date_column = "timestamp"
            if "timestamp" not in headers and "date" in headers:
                date_column = "date"
            
            # Load data with proper date parsing for the identified date column
            meter_data = pd.read_csv(meter_file, parse_dates=[date_column])
            
            # Standardize column name
            if date_column != "timestamp":
                meter_data.rename(columns={date_column: "timestamp"}, inplace=True)
            
            # Ensure building_id column exists
            if "building_id" not in meter_data.columns:
                # Try to find an alternative column
                building_id_alternatives = ["buildingid", "building", "id", "identifier"]
                for alt in building_id_alternatives:
                    if alt in meter_data.columns:
                        meter_data.rename(columns={alt: "building_id"}, inplace=True)
                        break
                
                # If no suitable column found, create a dummy one
                if "building_id" not in meter_data.columns:
                    print(f"No building_id column found in {meter_type} data")
                    meter_data["building_id"] = "unknown"
            
            print(f"Loaded {meter_type} data with shape {meter_data.shape}")
            return meter_data
        except Exception as e:
            print(f"Error parsing {meter_type} data: {str(e)}")
            return pd.DataFrame()
    except Exception as e:
        print(f"Error loading {meter_type} data: {str(e)}")
        return pd.DataFrame()

# Initialize building data processor (but we'll use our direct loading functions)
building_processor = BuildingDataProcessor()

@router.get("/metadata-test", response_model=Dict[str, Any])
async def test_metadata_file():
    """Test route to directly read metadata file."""
    results = {}
    
    # Check if environment variable is set
    try:
        env_data_path = os.environ.get('EAIO_DATA_PATH')
        results["env_data_path"] = env_data_path
    except Exception as e:
        results["env_data_path_error"] = str(e)
    
    # Try direct file access
    try:
        direct_path = "/app/data/metadata/metadata.csv"
        results["direct_path"] = direct_path
        results["direct_path_exists"] = os.path.exists(direct_path)
        if results["direct_path_exists"]:
            results["direct_path_size"] = os.path.getsize(direct_path)
            # Try to read the first few rows
            try:
                df = pd.read_csv(direct_path, nrows=3)
                results["direct_path_columns"] = df.columns.tolist()
                results["direct_path_rows"] = len(df)
            except Exception as e:
                results["direct_path_read_error"] = str(e)
    except Exception as e:
        results["direct_path_error"] = str(e)

    # Try the processor's get_buildings method
    try:
        metadata = load_metadata_direct()
        results["metadata_loaded"] = not metadata.empty
        if not metadata.empty:
            results["metadata_shape"] = f"{metadata.shape[0]} rows, {metadata.shape[1]} columns"
            results["metadata_columns"] = metadata.columns.tolist()[:10]  # First 10 columns only
            
            # Sample a single row (safely convert to JSON-compatible format)
            if len(metadata) > 0:
                sample_row = metadata.iloc[0].copy()
                # Replace NaN and infinity values with None
                for k, v in sample_row.items():
                    if pd.isna(v) or (isinstance(v, float) and (v == float('inf') or v == float('-inf'))):
                        sample_row[k] = None
                results["sample_row"] = {k: v for k, v in sample_row.items()}
    except Exception as e:
        results["metadata_load_error"] = str(e)
    
    # Try listing metadata directory
    try:
        metadata_dir = "/app/data/metadata"
        if os.path.exists(metadata_dir):
            results["metadata_dir_exists"] = True
            results["metadata_dir_contents"] = os.listdir(metadata_dir)
        else:
            results["metadata_dir_exists"] = False
    except Exception as e:
        results["metadata_dir_error"] = str(e)
    
    return results

# Pydantic models for request/response validation
class BuildingBase(BaseModel):
    name: str
    location: str
    type: str
    area: float
    year_built: Optional[int] = None

class BuildingCreate(BuildingBase):
    pass

class BuildingUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    type: Optional[str] = None
    area: Optional[float] = None
    year_built: Optional[int] = None
    renovation_year: Optional[int] = None

class BuildingResponse(BuildingBase):
    id: str
    
    class Config:
        orm_mode = True

# Explicitly expose these functions at module level for patching in tests
# The patching in tests uses api.routes.building_routes as the path
if "api.routes.building_routes" not in sys.modules:
    sys.modules["api.routes.building_routes"] = sys.modules[__name__]

# Database access functions using direct file access
def get_buildings_from_db() -> List[Dict[str, Any]]:
    """Get all buildings from the database."""
    try:
        print("Loading buildings from metadata file")
        metadata = load_metadata_direct()
        if metadata.empty:
            print("Metadata is empty, using mock building data")
            logger.warning("Metadata is empty, using mock building data")
            return [
                {
                    "id": "1",
                    "name": "Office Building A",
                    "location": "New York",
                    "type": "office",
                    "area": 10000.0,
                    "year_built": 2005,
                    "available_meters": ["electricity", "gas"]
                },
                {
                    "id": "2",
                    "name": "Shopping Mall B",
                    "location": "Los Angeles",
                    "type": "retail",
                    "area": 25000.0,
                    "year_built": 2010,
                    "available_meters": ["electricity", "water", "chilledwater"]
                }
            ]
        
        # Convert metadata to list of buildings
        print(f"Processing {len(metadata)} buildings from metadata")
        buildings = []
        for idx, row in metadata.iterrows():
            # Skip rows without a building_id
            building_id = str(row.get("building_id", ""))
            if not building_id:
                continue
                
            # Get available meter types
            available_meters = []
            for meter_type in ["electricity", "gas", "water", "steam", "hotwater", "chilledwater", "solar", "irrigation"]:
                if pd.notna(row.get(meter_type, None)) and row.get(meter_type, "") == "Yes":
                    available_meters.append(meter_type)
            
            # Safely handle values
            try:
                area = float(row.get("sqm", 0)) if pd.notna(row.get("sqm", 0)) else 0
            except (ValueError, TypeError):
                area = 0
                
            try:
                year_built = int(float(row.get("yearbuilt", 0))) if pd.notna(row.get("yearbuilt", 0)) else None
            except (ValueError, TypeError):
                year_built = None
            
            # Handle NaN and empty strings
            building_name = str(row.get("building_name", "")) if pd.notna(row.get("building_name", "")) else f"Building {building_id}"
            location = str(row.get("city", "")) if pd.notna(row.get("city", "")) else ""
            building_type = str(row.get("primaryspaceusage", "")) if pd.notna(row.get("primaryspaceusage", "")) else ""
            
            # Create building object
            building = {
                "id": building_id,
                "name": building_name or f"Building {building_id}",
                "location": location,
                "type": building_type,
                "area": area,
                "year_built": year_built,
                "available_meters": available_meters
            }
            buildings.append(building)
            
            # Print some debug info for the first few buildings
            if idx < 2:
                print(f"Added building {building_id}: {building_name}")
        
        print(f"Returning {len(buildings)} buildings")
        return buildings
    except Exception as e:
        print(f"Error retrieving buildings: {str(e)}")
        logger.error(f"Error retrieving buildings: {str(e)}")
        # Return mock data as fallback
        return [
            {
                "id": "1",
                "name": "Office Building A (Fallback)",
                "location": "New York",
                "type": "office",
                "area": 10000.0,
                "year_built": 2005,
                "available_meters": ["electricity", "gas"]
            },
            {
                "id": "2",
                "name": "Shopping Mall B (Fallback)",
                "location": "Los Angeles",
                "type": "retail",
                "area": 25000.0,
                "year_built": 2010,
                "available_meters": ["electricity", "water", "chilledwater"]
            }
        ]

def get_building_by_id(building_id: str) -> Optional[Dict[str, Any]]:
    """Get building by ID from the database."""
    try:
        buildings = get_buildings_from_db()
        for building in buildings:
            if building["id"] == building_id:
                return building
        return None
    except Exception as e:
        logger.error(f"Error retrieving building {building_id}: {str(e)}")
        raise

def get_building_consumption(
    building_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    interval: str = "daily",
    meter_type: str = "electricity"
) -> Dict[str, Any]:
    """Get energy consumption data for a specific building."""
    try:
        print(f"Loading consumption for building: {building_id}, meter: {meter_type}")
        # Get the data
        df = load_meter_data_direct(meter_type)
        
        if df.empty:
            print(f"No data found for meter type: {meter_type}")
            return {
                "building_id": building_id,
                "meter_type": meter_type,
                "data": [],
                "message": f"No data available for {meter_type}"
            }
        
        # Check for the building_id in column names
        if building_id not in df.columns:
            print(f"Building ID {building_id} not found in {meter_type} data")
            available_buildings = list(df.columns)
            if "timestamp" in available_buildings:
                available_buildings.remove("timestamp")
            return {
                "building_id": building_id,
                "meter_type": meter_type,
                "data": [],
                "message": f"Building ID not found in {meter_type} data. Available buildings: {available_buildings[:10]}..."
            }
        
        # Extract timestamp and the specific building column
        result_df = df[["timestamp", building_id]].copy()
        
        # Convert timestamp column to datetime if it's not already
        if not pd.api.types.is_datetime64_any_dtype(result_df["timestamp"]):
            result_df["timestamp"] = pd.to_datetime(result_df["timestamp"])
        
        # Filter by date range if provided
        if start_date:
            start_dt = pd.to_datetime(start_date)
            result_df = result_df[result_df["timestamp"] >= start_dt]
        
        if end_date:
            end_dt = pd.to_datetime(end_date)
            result_df = result_df[result_df["timestamp"] <= end_dt]
        
        # Resample data based on the interval
        if interval == "hourly":
            # Data is already hourly, no need to resample
            pass
        elif interval == "daily":
            result_df = result_df.set_index("timestamp").resample("D").mean().reset_index()
        elif interval == "monthly":
            result_df = result_df.set_index("timestamp").resample("M").mean().reset_index()
        
        # Format data for response
        data = []
        for _, row in result_df.iterrows():
            # Handle NaN values
            value = row[building_id]
            if pd.isna(value) or np.isinf(value):
                value = None
            else:
                value = float(value)
                
            data.append({
                "timestamp": row["timestamp"].isoformat(),
                "value": value
            })
        
        return {
            "building_id": building_id,
            "meter_type": meter_type,
            "data": data
        }
    except Exception as e:
        print(f"Error getting consumption data: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "building_id": building_id,
            "meter_type": meter_type,
            "data": [],
            "error": str(e)
        }

def create_building(building_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new building in the database."""
    try:
        # Note: This is a placeholder - in a real system, we would add to database
        # For now, return mock data for API compatibility
        building_data["id"] = "3"
        return building_data
    except Exception as e:
        logger.error(f"Error creating building: {str(e)}")
        raise

def update_building(building_id: str, building_data: Dict[str, Any]) -> Dict[str, Any]:
    """Update an existing building in the database."""
    try:
        current_building = get_building_by_id(building_id)
        if current_building:
            current_building.update(building_data)
            current_building["id"] = building_id
            return current_building
        return None
    except Exception as e:
        logger.error(f"Error updating building {building_id}: {str(e)}")
        raise

def delete_building(building_id: str) -> bool:
    """Delete a building from the database."""
    try:
        # Placeholder - in a real system, we would remove from database
        return True
    except Exception as e:
        logger.error(f"Error deleting building {building_id}: {str(e)}")
        raise

@router.get("/", response_model=Dict[str, Any])
async def get_buildings():
    """Get list of all buildings."""
    try:
        buildings = get_buildings_from_db()
        return {"items": buildings, "total": len(buildings)}
    
    except Exception as e:
        logger.error(f"Error retrieving buildings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{building_id}", response_model=Dict[str, Any])
async def get_building(
    building_id: str = Path(..., description="Building identifier")
):
    """Get information about a specific building."""
    try:
        building = get_building_by_id(building_id)
        if not building:
            raise HTTPException(status_code=404, detail=f"Building not found: {building_id}")
        
        return building
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving building {building_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{building_id}/consumption", response_model=Dict[str, Any])
async def get_building_consumption_endpoint(
    building_id: str = Path(..., description="Building identifier"),
    start_date: str = Query(None, description="Start date (ISO format)"),
    end_date: str = Query(None, description="End date (ISO format)"),
    interval: str = Query("daily", description="Data interval (hourly, daily, monthly)"),
    type: str = Query("electricity", description="Energy metric (electricity, gas, water)")
):
    """Get energy consumption data for a building."""
    try:
        # Check if building exists
        building = get_building_by_id(building_id)
        if not building:
            raise HTTPException(status_code=404, detail=f"Building not found: {building_id}")
        
        try:
            # Get consumption data
            consumption_data = get_building_consumption(
                building_id=building_id,
                start_date=start_date,
                end_date=end_date,
                interval=interval,
                meter_type=type
            )
            
            if "error" in consumption_data:
                return {"building_id": building_id, "error": consumption_data["error"]}
            
            # For large datasets, limit the number of data points returned
            if "data" in consumption_data and len(consumption_data["data"]) > 1000:
                consumption_data["data"] = consumption_data["data"][:1000]
                consumption_data["note"] = "Response limited to 1000 data points. Use date filters for more specific data."
            
            return consumption_data
        except Exception as e:
            logger.error(f"Error processing consumption data: {str(e)}")
            return {
                "building_id": building_id,
                "meter_type": type,
                "error": f"Error processing consumption data: {str(e)}",
                "data": [],
                "data_points": 0
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving consumption data for building {building_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/", response_model=Dict[str, Any], status_code=201)
async def create_building_endpoint(
    building: BuildingCreate = Body(...)
):
    """Create a new building."""
    try:
        building_data = building.dict()
        created_building = create_building(building_data)
        return created_building
    
    except Exception as e:
        logger.error(f"Error creating building: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.put("/{building_id}", response_model=Dict[str, Any])
async def update_building_endpoint(
    building_id: str = Path(..., description="Building identifier"),
    building_update: BuildingUpdate = Body(...)
):
    """Update an existing building."""
    try:
        # Get existing building
        existing_building = get_building_by_id(building_id)
        if not existing_building:
            raise HTTPException(status_code=404, detail=f"Building not found: {building_id}")
        
        # Update building
        update_data = {k: v for k, v in building_update.dict().items() if v is not None}
        updated_building = update_building(building_id, update_data)
        
        return updated_building
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating building {building_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.delete("/{building_id}", status_code=204)
async def delete_building_endpoint(
    building_id: str = Path(..., description="Building identifier")
):
    """Delete a building."""
    try:
        # Check if building exists
        existing_building = get_building_by_id(building_id)
        if not existing_building:
            raise HTTPException(status_code=404, detail=f"Building not found: {building_id}")
        
        # Delete building
        delete_building(building_id)
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting building {building_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}") 