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
import random

# Import database client
from db.db_client import resample_energy_data

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

# Thêm import để truy cập PostgreSQL trực tiếp
from db.postgres_client import execute_query

@router.get("/db-test", response_model=Dict[str, Any])
async def test_postgres_connection():
    """Kiểm tra kết nối trực tiếp với PostgreSQL và hiển thị dữ liệu."""
    try:
        # Thử thực thi truy vấn đếm số lượng tòa nhà
        count_result = execute_query("SELECT COUNT(*) as total FROM buildings")
        
        # Lấy 10 tòa nhà đầu tiên để kiểm tra
        buildings_result = execute_query("SELECT id, name, location, type FROM buildings LIMIT 10")
        
        # Trả về kết quả
        return {
            "status": "success",
            "connection": "PostgreSQL connection successful",
            "buildings_count": count_result[0]["total"] if count_result else 0,
            "buildings_sample": buildings_result
        }
    except Exception as e:
        logger.error(f"Error connecting to PostgreSQL: {str(e)}")
        return {
            "status": "error",
            "message": f"Could not connect to PostgreSQL: {str(e)}"
        }

# Database access functions using direct file access
def get_buildings_from_db() -> List[Dict[str, Any]]:
    """Get all buildings from the database."""
    try:
        print("Loading buildings from PostgreSQL")
        
        # Truy vấn dữ liệu từ PostgreSQL
        try:
            query = """
            SELECT 
                id, name, location, type, size as area, floors, built_year, 
                energy_sources, primary_use, occupancy_hours,
                metadata
            FROM buildings
            ORDER BY name
            """
            buildings_data = execute_query(query)
            
            if buildings_data:
                print(f"Loaded {len(buildings_data)} buildings from PostgreSQL")
                # Standardize the buildings data to ensure consistent schema
                buildings = []
                for building in buildings_data:
                    # Process energy_sources which might be stored as an array
                    energy_sources = building.get("energy_sources", [])
                    if energy_sources and isinstance(energy_sources, str):
                        # If stored as a string that looks like an array
                        if energy_sources.startswith('{') and energy_sources.endswith('}'):
                            energy_sources = energy_sources.strip('{}').split(',')
                    
                    # Ensure all required fields have values
                    formatted_building = {
                        "id": building.get("id", ""),
                        "name": building.get("name", "") or f"Building {building.get('id', '')}",
                        "location": building.get("location", ""),
                        "type": building.get("type", ""),
                        "area": building.get("area", 0),
                        "floors": building.get("floors", None),
                        "year_built": building.get("built_year", None),
                        "available_meters": energy_sources if isinstance(energy_sources, list) else [energy_sources] if energy_sources else [],
                        "primary_use": building.get("primary_use", ""),
                        "occupancy_hours": building.get("occupancy_hours", "")
                    }
                    buildings.append(formatted_building)
                
                return buildings
            else:
                print("No buildings found in PostgreSQL, checking metadata file")
                
        except Exception as e:
            print(f"Error retrieving buildings from PostgreSQL: {str(e)}")
            logger.error(f"Error retrieving buildings from PostgreSQL: {str(e)}")
        
        # Fallback to metadata file if PostgreSQL query fails
        print("Falling back to metadata file")
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
        # Truy vấn từ PostgreSQL
        query = """
        SELECT 
            id, name, location, type, size as area, floors, built_year, 
            energy_sources, primary_use, occupancy_hours,
            metadata
        FROM buildings
        WHERE id = %(building_id)s
        """
        params = {"building_id": building_id}
        result = execute_query(query, params)
        
        if result and len(result) > 0:
            building = result[0]
            
            # Process energy_sources which might be stored as an array
            energy_sources = building.get("energy_sources", [])
            if energy_sources and isinstance(energy_sources, str):
                # If stored as a string that looks like an array
                if energy_sources.startswith('{') and energy_sources.endswith('}'):
                    energy_sources = energy_sources.strip('{}').split(',')
            
            # Ensure all required fields have values
            return {
                "id": building.get("id", ""),
                "name": building.get("name", "") or f"Building {building.get('id', '')}",
                "location": building.get("location", ""),
                "type": building.get("type", ""),
                "area": building.get("area", 0),
                "floors": building.get("floors", None),
                "year_built": building.get("built_year", None),
                "available_meters": energy_sources if isinstance(energy_sources, list) else [energy_sources] if energy_sources else [],
                "primary_use": building.get("primary_use", ""),
                "occupancy_hours": building.get("occupancy_hours", "")
            }
            
        # Fallback to searching in all buildings if not found
        logger.info(f"Building {building_id} not found in PostgreSQL, checking all buildings")
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
    """Get energy consumption data for a building."""
    try:
        # Validate interval
        valid_intervals = ["hourly", "daily", "weekly", "monthly"]
        if interval not in valid_intervals:
            return {"error": f"Invalid interval: {interval}. Valid options are: {', '.join(valid_intervals)}"}
        
        try:
            # Sử dụng hàm resample_energy_data từ db_client (hỗ trợ cả PostgreSQL và MongoDB)
            resampled_data = resample_energy_data(building_id, interval)
            
            # Nếu nhận được dữ liệu từ database
            if resampled_data:
                logger.info(f"Got resampled data for building {building_id} with {len(resampled_data)} records")
                
                # Chuyển đổi dữ liệu đã được resample thành định dạng phản hồi
                data = []
                for row in resampled_data:
                    # Lấy giá trị phù hợp với loại meter
                    value = None
                    
                    # Trường hợp PostgreSQL (continuous aggregates)
                    if f"avg_{meter_type}" in row:
                        value = row[f"avg_{meter_type}"]
                    # Trường hợp trường trực tiếp (electricity, water, gas, etc.)
                    elif meter_type in row:
                        value = row[meter_type]
                    
                    # Kiểm tra và xử lý giá trị null/NaN
                    if value is None or value == "" or (isinstance(value, str) and value.lower() == "null") or (isinstance(value, str) and value.lower().startswith("unknown")):
                        value = None
                    elif isinstance(value, str):
                        try:
                            value = float(value)
                        except (ValueError, TypeError):
                            value = None
                    elif isinstance(value, (int, float)) and (pd.isna(value) or np.isinf(value)):
                        value = None
                    
                    # Lấy timestamp từ dữ liệu
                    timestamp = row.get("time") or row.get("bucket") or row.get("timestamp")
                    
                    # Thêm vào kết quả
                    if timestamp:
                        # Chuyển timestamp thành chuỗi ISO nếu là datetime object
                        if isinstance(timestamp, datetime):
                            timestamp = timestamp.isoformat()
                            
                        data.append({
                            "timestamp": timestamp,
                            "value": value
                        })
                
                # Lọc theo ngày nếu có
                if start_date or end_date:
                    filtered_data = []
                    for item in data:
                        ts = item["timestamp"]
                        include = True
                        
                        if start_date and ts < start_date:
                            include = False
                        if end_date and ts > end_date:
                            include = False
                        
                        if include:
                            filtered_data.append(item)
                    
                    data = filtered_data
            else:
                # Nếu không có dữ liệu từ database, dùng mẫu cũ
                logger.warning(f"No data from database for building {building_id}, falling back to sample data")
                
                # Load dữ liệu từ files local (giữ lại mã cũ)
                meter_data = load_meter_data_direct(meter_type)
                if meter_data is None or building_id not in meter_data.columns:
                    return {
                        "building_id": building_id,
                        "meter_type": meter_type,
                        "data": [],
                        "error": f"No data available for building {building_id}"
                    }
                
                result_df = meter_data.reset_index()
                
                # Lọc dữ liệu theo ngày nếu có
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
                elif interval == "weekly":
                    result_df = result_df.set_index("timestamp").resample("W").mean().reset_index()
                elif interval == "monthly":
                    result_df = result_df.set_index("timestamp").resample("M").mean().reset_index()
                
                # Format data for response
                data = []
                for _, row in result_df.iterrows():
                    value = row[building_id]
                    # Kiểm tra nhiều loại giá trị null/không hợp lệ
                    if pd.isna(value) or np.isinf(value) or value == "" or (isinstance(value, str) and (value.lower() == "null" or value.lower().startswith("unknown"))):
                        value = None
                    else:
                        try:
                            value = float(value)
                        except (ValueError, TypeError):
                            value = None
                        
                    data.append({
                        "timestamp": row["timestamp"].isoformat(),
                        "value": value
                    })
            
            return {
                "building_id": building_id,
                "meter_type": meter_type,
                "data": data,
                "interval": interval,
                "data_points": len(data)
            }
        except Exception as inner_e:
            logger.error(f"Error in resampling data: {str(inner_e)}")
            import traceback
            traceback.print_exc()
            
            # Fallback to sample data
            return {
                "building_id": building_id,
                "meter_type": meter_type,
                "data": [],
                "error": f"Error processing data: {str(inner_e)}"
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
async def get_building_consumption(
    building_id: str,
    metric: str = Query("electricity", description="Loại dữ liệu tiêu thụ (electricity, water, gas, etc.)"),
    interval: str = Query("daily", description="Khoảng thời gian (hourly, daily, monthly)"),
    start_date: Optional[str] = Query(None, description="Ngày bắt đầu (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Ngày kết thúc (YYYY-MM-DD)")
):
    """Lấy dữ liệu tiêu thụ năng lượng cho một tòa nhà cụ thể."""
    try:
        logger.info(f"Lấy dữ liệu tiêu thụ {metric} cho tòa nhà {building_id} với interval {interval}")
        
        # Kiểm tra tòa nhà có tồn tại không
        building_query = "SELECT id FROM buildings WHERE id = %(building_id)s"
        building_result = execute_query(building_query, {"building_id": building_id})
        
        if not building_result:
            logger.warning(f"Không tìm thấy tòa nhà với ID {building_id}")
            return {"status": "error", "message": f"Building not found with ID {building_id}", "data": []}
        
        # Tạo timestamp từ tham số
        current_date = datetime.now()
        
        if start_date:
            try:
                start_timestamp = datetime.strptime(start_date, "%Y-%m-%d")
            except ValueError:
                logger.warning(f"Invalid start_date format: {start_date}")
                start_timestamp = current_date - timedelta(days=30)
        else:
            start_timestamp = current_date - timedelta(days=30)
            
        if end_date:
            try:
                end_timestamp = datetime.strptime(end_date, "%Y-%m-%d")
            except ValueError:
                logger.warning(f"Invalid end_date format: {end_date}")
                end_timestamp = current_date
        else:
            end_timestamp = current_date
        
        # Chuẩn bị SQL query dựa trên loại metric và interval
        time_bucket = ""
        if interval == "hourly":
            time_bucket = "1 hour"
        elif interval == "daily":
            time_bucket = "1 day"
        elif interval == "monthly":
            time_bucket = "1 month"
        else:
            time_bucket = "1 day"  # Default là daily
        
        # Truy vấn dữ liệu từ bảng energy_data hoặc continuous aggregates
        data = []
        
        # Thử truy vấn từ continuous aggregates (nếu có)
        if interval == "hourly":
            table_name = "energy_hourly"
        elif interval == "daily":
            table_name = "energy_daily"
        elif interval == "monthly":
            table_name = "energy_monthly"
        else:
            table_name = "energy_daily"
        
        # Kiểm tra bảng continuous aggregate có tồn tại không
        table_check_query = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = %(table_name)s)"
        table_exists = execute_query(table_check_query, {"table_name": table_name})
        
        if table_exists and table_exists[0].get("exists", False):
            # Sử dụng continuous aggregate
            query = f"""
            SELECT bucket as timestamp, avg_{metric} as value
            FROM {table_name}
            WHERE building_id = %(building_id)s
              AND bucket >= %(start_date)s
              AND bucket <= %(end_date)s
            ORDER BY bucket
            """
            params = {
                "building_id": building_id,
                "start_date": start_timestamp,
                "end_date": end_timestamp
            }
            
            result = execute_query(query, params)
            logger.info(f"Queried {len(result) if result else 0} records from {table_name}")
            
            if result:
                for row in result:
                    value = row.get("value")
                    timestamp = row.get("timestamp")
                    
                    # Xử lý giá trị null/NaN
                    if value is None or (isinstance(value, float) and (pd.isna(value) or np.isinf(value))):
                        value = None
                    
                    if timestamp:
                        # Chuyển timestamp thành chuỗi ISO nếu là datetime object
                        if isinstance(timestamp, datetime):
                            timestamp = timestamp.isoformat()
                        
                        data.append({
                            "timestamp": timestamp,
                            "value": value
                        })
        
        # Nếu không có dữ liệu từ continuous aggregates, thử truy vấn trực tiếp từ bảng energy_data
        if not data:
            # Kiểm tra bảng energy_data có tồn tại không
            table_check_query = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'energy_data')"
            table_exists = execute_query(table_check_query)
            
            if table_exists and table_exists[0].get("exists", False):
                # Truy vấn trực tiếp từ bảng energy_data với time_bucket
                query = f"""
                SELECT time_bucket(%(time_bucket)s, time) as timestamp, 
                       avg({metric}) as value
                FROM energy_data
                WHERE building_id = %(building_id)s
                  AND time >= %(start_date)s
                  AND time <= %(end_date)s
                  AND {metric} IS NOT NULL
                GROUP BY timestamp
                ORDER BY timestamp
                """
                params = {
                    "building_id": building_id,
                    "start_date": start_timestamp,
                    "end_date": end_timestamp,
                    "time_bucket": time_bucket
                }
                
                result = execute_query(query, params)
                logger.info(f"Queried {len(result) if result else 0} records from energy_data")
                
                if result:
                    for row in result:
                        value = row.get("value")
                        timestamp = row.get("timestamp")
                        
                        # Xử lý giá trị null/NaN
                        if value is None or (isinstance(value, float) and (pd.isna(value) or np.isinf(value))):
                            value = None
                        
                        if timestamp:
                            # Chuyển timestamp thành chuỗi ISO nếu là datetime object
                            if isinstance(timestamp, datetime):
                                timestamp = timestamp.isoformat()
                            
                            data.append({
                                "timestamp": timestamp,
                                "value": value
                            })
        
        # Nếu vẫn không có dữ liệu, sử dụng dữ liệu mẫu làm fallback
        if not data:
            logger.warning(f"Không tìm thấy dữ liệu cho tòa nhà {building_id}, sử dụng mock data")
            data = generate_mock_consumption_data(interval, start_timestamp, end_timestamp)
        
        return {
            "status": "success",
            "building_id": building_id,
            "metric": metric,
            "interval": interval,
            "data": data
        }
    except Exception as e:
        logger.error(f"Error getting {metric} consumption for building {building_id}: {str(e)}")
        return {
            "status": "error",
            "message": f"Error retrieving consumption data: {str(e)}",
            "data": []
        }

# Hàm tạo dữ liệu mẫu cho tiêu thụ năng lượng
def generate_mock_consumption_data(interval: str, start_date: datetime, end_date: datetime):
    """Tạo dữ liệu mẫu cho tiêu thụ năng lượng."""
    data = []
    current_date = start_date
    delta = None
    
    if interval == "hourly":
        delta = timedelta(hours=1)
    elif interval == "daily":
        delta = timedelta(days=1)
    elif interval == "monthly":
        # Đơn giản hóa: Cứ 30 ngày là 1 tháng
        delta = timedelta(days=30)
    else:
        delta = timedelta(days=1)  # Default
    
    while current_date <= end_date:
        # Tạo dữ liệu ngẫu nhiên với mẫu thực tế hơn
        # Office building sẽ có mức tiêu thụ thấp vào cuối tuần, cao vào ngày làm việc
        is_weekend = current_date.weekday() >= 5  # 5, 6 là thứ 7, CN
        
        # Mức tiêu thụ cơ bản dựa trên ngày trong tuần
        base_consumption = 50 if is_weekend else 100
        
        # Thêm biến động ngẫu nhiên
        random_factor = random.uniform(0.8, 1.2)
        
        # Giờ trong ngày ảnh hưởng nếu interval là hourly
        hour_factor = 1.0
        if interval == "hourly":
            hour = current_date.hour
            if 0 <= hour < 6:  # Đêm khuya
                hour_factor = 0.5
            elif 7 <= hour < 10:  # Sáng sớm, tăng dần
                hour_factor = 0.7 + (hour - 7) * 0.1
            elif 10 <= hour < 17:  # Giờ làm việc
                hour_factor = 1.0
            elif 17 <= hour < 22:  # Chiều tối, giảm dần
                hour_factor = 0.9 - (hour - 17) * 0.1
            else:  # Đêm
                hour_factor = 0.6
        
        consumption = base_consumption * random_factor * hour_factor
        
        data.append({
            "timestamp": current_date.isoformat(),
            "value": round(consumption, 2)
        })
        
        current_date += delta
    
    return data

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