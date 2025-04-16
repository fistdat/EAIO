"""
Data import script for importing CSV data into PostgreSQL database.
This script provides functionality to import EAIO data from CSV files to PostgreSQL.
"""
import os
import sys
import logging
import pandas as pd
import numpy as np
import datetime
import json
from tqdm import tqdm
from typing import Dict, List, Any, Optional, Union

# Thiết lập logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("logs/import.log")
    ]
)
logger = logging.getLogger("eaio.db.import")

# Thêm thư mục gốc vào PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import PostgreSQL client
try:
    from db.postgres_client import (
        execute_query, 
        execute_many, 
        execute_transaction,
        get_connection
    )
except ImportError as e:
    logger.error(f"Error importing database modules: {str(e)}")
    raise

def import_buildings_from_csv(db, csv_file):
    """Import buildings from a CSV file."""
    try:
        # Load data from CSV file
        df = load_from_csv(csv_file)
        if df.empty:
            logger.error(f"No data found in CSV file: {csv_file}")
            return
            
        # Count of buildings to import
        building_count = len(df)
        logger.info(f"Found {building_count} buildings in CSV")
        
        # Prepare buildings for import - convert to list of dictionaries
        buildings = []
        
        for _, row in df.iterrows():
            # Create metadata field as JSON string
            metadata = json.dumps(row.to_dict())
            
            # Create building object
            building = {
                "id": str(row.get("building_id", "")),
                "name": str(row.get("building_name", f"Building {row.get('building_id', '')}")),
                "location": str(row.get("city", "")),
                "type": str(row.get("primary_use", "")),
                "size": float(row.get("gross_floor_area", 0)) if pd.notna(row.get("gross_floor_area", 0)) else 0,
                "floors": int(row.get("floors", 0)) if pd.notna(row.get("floors", 0)) else 0,
                "built_year": int(row.get("year_built", 0)) if pd.notna(row.get("year_built", 0)) else 0,
                "energy_sources": ['electricity'],  # Default as array not string
                "primary_use": str(row.get("primary_use", "")),
                "occupancy_hours": str(row.get("occupancy_hours", "")),
                "metadata": metadata
            }
            buildings.append(building)
        
        # Import buildings
        db.import_buildings(buildings)
        logger.info(f"Successfully imported {len(buildings)} buildings.")
        
    except Exception as e:
        logger.error(f"Error importing buildings from CSV: {e}")

def import_energy_data_from_csv(meter_type: str, csv_path: str = None, batch_size: int = 1000):
    """
    Import energy consumption data from CSV file to PostgreSQL.
    
    Args:
        meter_type: Type of meter data (electricity, gas, etc.)
        csv_path: Path to CSV file containing energy data
        batch_size: Number of records to insert in one batch
    """
    # Default CSV path if not provided
    if csv_path is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        csv_path = os.path.join(base_dir, 'data', 'meters', 'cleaned', f"{meter_type}_cleaned.csv")
    
    logger.info(f"Starting {meter_type} data import from CSV: {csv_path}")
    
    if not os.path.exists(csv_path):
        logger.error(f"CSV file not found: {csv_path}")
        return
    
    try:
        # Create temporary table for faster bulk loading
        create_temp_table_query = f"""
        CREATE TEMP TABLE tmp_energy_data (
            time TIMESTAMPTZ,
            building_id TEXT,
            value NUMERIC
        )
        """
        
        # Read CSV in chunks to handle large files
        chunksize = batch_size
        total_imported = 0
        
        with pd.read_csv(csv_path, chunksize=chunksize) as reader:
            # Create temporary table
            execute_query(create_temp_table_query)
            
            for chunk in reader:
                # Process chunk
                if 'timestamp' not in chunk.columns or 'building_id' not in chunk.columns:
                    logger.error(f"CSV missing required columns: {chunk.columns}")
                    continue
                
                # Convert timestamp to proper format
                chunk['timestamp'] = pd.to_datetime(chunk['timestamp'])
                
                # Prepare data for insertion
                records = []
                for _, row in chunk.iterrows():
                    if pd.isna(row['value']):
                        continue
                        
                    record = {
                        "time": row['timestamp'],
                        "building_id": str(row['building_id']),
                        "value": float(row['value'])
                    }
                    records.append(record)
                
                if not records:
                    continue
                
                # Insert to temporary table
                insert_temp_query = """
                INSERT INTO tmp_energy_data (time, building_id, value)
                VALUES (%(time)s, %(building_id)s, %(value)s)
                """
                execute_many(insert_temp_query, records)
                
                # Now insert from temp table to main table with proper meter type
                insert_query = f"""
                INSERT INTO energy_data (time, building_id, {meter_type}, source)
                SELECT time, building_id, value, 'imported'
                FROM tmp_energy_data
                ON CONFLICT (time, building_id) 
                DO UPDATE SET
                    {meter_type} = EXCLUDED.{meter_type}
                """
                execute_query(insert_query)
                
                # Clear temporary table for next batch
                execute_query("DELETE FROM tmp_energy_data")
                
                total_imported += len(records)
                logger.info(f"Imported {len(records)} {meter_type} records (total: {total_imported})")
        
        logger.info(f"Successfully completed import of {total_imported} {meter_type} records")
        
    except Exception as e:
        logger.error(f"Error during {meter_type} data import: {str(e)}")

def import_all_data():
    """Import all building and energy data from CSV files."""
    logger.info("Starting import of all data")
    
    # Import buildings first
    import_buildings_from_csv()
    
    # Then import energy data for different meter types
    meter_types = ['electricity', 'gas', 'water', 'steam', 'hotwater', 'chilledwater']
    for meter_type in meter_types:
        import_energy_data_from_csv(meter_type)
    
    logger.info("Completed import of all data")

def load_from_csv(csv_file_path, fields_to_extract=None, include_only=None):
    """Load data from a CSV file into a list of dictionaries."""
    try:
        df = pd.read_csv(csv_file_path)
        
        # Replace NaN with None for proper JSON serialization
        df = df.replace({np.nan: None})
        
        if include_only:
            df = df[df['building_id'].isin(include_only)]
        
        if fields_to_extract:
            df = df[fields_to_extract]
            
        return df
    except Exception as e:
        logging.error(f"Error loading data from {csv_file_path}: {e}")
        return pd.DataFrame()

if __name__ == "__main__":
    # Kiểm tra xem đã đặt biến môi trường cần thiết chưa
    import argparse
    from db.database import Database
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Import data from CSV files to PostgreSQL database')
    parser.add_argument('--buildings-only', action='store_true', help='Import only building metadata')
    parser.add_argument('--csv-file', type=str, help='Path to CSV file with building metadata')
    parser.add_argument('--data-dir', type=str, help='Directory containing electricity, gas, etc. CSV files')
    args = parser.parse_args()
    
    # CSV file paths
    csv_file = args.csv_file
    if not csv_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        csv_file = os.path.join(base_dir, 'data', 'metadata', 'metadata.csv')
    
    # Initialize database connection
    db = Database()
    
    # Import buildings if requested
    if args.buildings_only:
        logger.info(f"Importing buildings from {csv_file}")
        import_buildings_from_csv(db, csv_file)
    else:
        # Import buildings first
        logger.info(f"Importing buildings from {csv_file}")
        import_buildings_from_csv(db, csv_file)
        
        # Then import energy data
        data_dir = args.data_dir
        if not data_dir:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            data_dir = os.path.join(base_dir, 'data')
        
        # Import electricity data if available
        electricity_path = os.path.join(data_dir, 'electricity.csv')
        if os.path.exists(electricity_path):
            logger.info(f"Importing electricity data from {electricity_path}")
            import_energy_data_from_csv('electricity', electricity_path)
        
        # Import other energy sources as needed
        # ... 