"""
Common interface for database operations.
This file provides a consistent interface for database operations regardless of the underlying database.
"""

import os
import sys
import logging
import traceback
from typing import Dict, List, Any, Optional, Union

# Get configuration from environment variables
DB_TYPE = os.getenv("DB_TYPE", "postgres")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("eaio.db")

# Add backend directory to PATH
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
    logger.info(f"Added {backend_dir} to sys.path")

# Check for path availability
logger.info(f"Python path: {sys.path}")
logger.info(f"Current directory: {os.getcwd()}")

# Import database modules
# We now only support PostgreSQL
try:
    # Try to import psycopg first since it's a dependency
    try:
        import psycopg
        logger.info("Successfully imported psycopg")
    except ImportError as e:
        logger.error(f"Failed to import psycopg: {str(e)}")
        logger.warning("Using dummy database functions. Some features may not work properly.")

    # Import from postgres_client
    from db.postgres_client import (
        get_postgres_pool,
        insert_record as pg_insert_record,
        update_record as pg_update_record,
        get_record as pg_get_record,
        get_records as pg_get_records,
        execute_query as pg_execute_query,
        close_postgres_pool
    )
    logger.info("Successfully imported PostgreSQL client module")
except ImportError as e:
    error_msg = f"PostgreSQL client module not found: {str(e)}"
    logger.error(error_msg)
    logger.warning("Using dummy database functions. Some features may not work properly.")
    
    # Define dummy functions for testing purposes
    def pg_insert_record(*args, **kwargs):
        logger.error("PostgreSQL client not available")
        return False
        
    def pg_update_record(*args, **kwargs):
        logger.error("PostgreSQL client not available")
        return False
        
    def pg_get_record(*args, **kwargs):
        logger.error("PostgreSQL client not available")
        return None
        
    def pg_get_records(*args, **kwargs):
        logger.error("PostgreSQL client not available")
        return []
        
    def pg_execute_query(*args, **kwargs):
        logger.error("PostgreSQL client not available")
        return []
        
    def close_postgres_pool():
        pass

# Map functions to common interface
insert_record = pg_insert_record
update_record = pg_update_record
get_record = pg_get_record
get_records = pg_get_records
execute_query = pg_execute_query
close_connection = close_postgres_pool

# Functions to handle database-specific operations

def resample_energy_data(building_id: str, interval: str) -> List[Dict[str, Any]]:
    """
    Resample energy data for a building based on the specified interval.
    Optimized for both MongoDB and PostgreSQL backends.
    
    Args:
        building_id: Building ID
        interval: Time interval ('hourly', 'daily', 'weekly', 'monthly')
        
    Returns:
        List[Dict[str, Any]]: Resampled energy data
    """
    # PostgreSQL implementation (using TimescaleDB continuous aggregates)
    logger.info(f"Resampling energy data for building {building_id} with interval {interval} using PostgreSQL")
    
    table_name = None
    limit = 100
    
    # Determine which continuous aggregate view to use
    if interval == 'hourly':
        table_name = 'energy_hourly'
        limit = 168  # 7 days of hourly data
    elif interval == 'daily':
        table_name = 'energy_daily'
        limit = 90   # 3 months of daily data
    elif interval == 'weekly':
        table_name = 'energy_weekly'
        limit = 52   # 1 year of weekly data
    elif interval == 'monthly':
        table_name = 'energy_monthly'
        limit = 24   # 2 years of monthly data
    else:
        raise ValueError(f"Invalid interval: {interval}. Must be 'hourly', 'daily', 'weekly', or 'monthly'")
    
    # Execute query with COALESCE để xử lý giá trị NULL
    query = f"""
    SELECT 
        bucket as time,
        building_id,
        COALESCE(avg_electricity, 0) as electricity,
        COALESCE(avg_water, 0) as water, 
        COALESCE(avg_gas, 0) as gas,
        COALESCE(avg_steam, 0) as steam,
        COALESCE(avg_hotwater, 0) as hotwater,
        COALESCE(avg_chilledwater, 0) as chilledwater,
        COALESCE(max_electricity, 0) as max_electricity,
        COALESCE(min_electricity, 0) as min_electricity,
        sample_count
    FROM {table_name}
    WHERE building_id = %(building_id)s
    ORDER BY bucket DESC
    LIMIT {limit}
    """
    
    params = {"building_id": building_id}
    try:
        result = pg_execute_query(query, params)
        
        # Transform result to be in a format compatible with the existing format
        for row in result:
            # Convert time to string if needed
            if 'time' in row and row['time'] is not None:
                row['time'] = row['time'].isoformat()
                
        return result
    except Exception as e:
        logger.error(f"Error resampling energy data: {str(e)}")
        return []
    
    return [] 