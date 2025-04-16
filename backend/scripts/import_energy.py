#!/usr/bin/env python3
"""
Multi-purpose script to import various energy data types from CSV to PostgreSQL with improved transaction handling.
"""
import os
import pandas as pd
import psycopg
import sys
import argparse

def import_energy_data(energy_type, limit=1000):
    """
    Import energy data for the specified energy type.
    
    Args:
        energy_type (str): Type of energy to import (electricity, water, gas, etc.)
        limit (int): Maximum number of rows to process (for testing)
    """
    print(f'Starting {energy_type} data import with improved transaction handling')
    
    # Path to energy data file
    energy_file = f'/app/data/meters/cleaned/{energy_type}_cleaned.csv'
    print(f'Looking for {energy_type} data file at: {energy_file}')
    
    # Check if file exists
    if not os.path.exists(energy_file):
        print(f'Error: {energy_type} data file not found at {energy_file}')
        return
    
    # Read the CSV file
    try:
        df = pd.read_csv(energy_file)
        print(f'Loaded {energy_type} data with {len(df)} records')
    except Exception as e:
        print(f'Error reading {energy_type} data file: {str(e)}')
        return
    
    # Convert timestamp to datetime
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Get building columns (all columns except timestamp)
    building_columns = [col for col in df.columns if col != 'timestamp']
    print(f'Found {len(building_columns)} building columns in CSV')
    
    # Get buildings from database
    try:
        conn = psycopg.connect('postgresql://eaio:eaiopassword@postgres:5432/energy-ai-optimizer')
        with conn.cursor() as cursor:
            cursor.execute('SELECT id FROM buildings')
            building_ids = [row[0] for row in cursor.fetchall()]
        print(f'Found {len(building_ids)} buildings in database')
        conn.close()
    except Exception as e:
        print(f'Error fetching buildings: {str(e)}')
        return
    
    # Variables for tracking progress
    total_rows = len(df)
    migrated_count = 0
    
    # Process data row by row
    for idx, (_, row) in enumerate(df.iterrows()):
        if limit and idx >= limit:
            break
            
        if idx % 100 == 0:
            print(f'Processing row {idx} of {min(limit if limit else total_rows, total_rows)}')
        
        timestamp = row['timestamp']
        
        # Process each building in the row
        for building_id in building_columns:
            # Skip NaN values
            if pd.isna(row[building_id]):
                continue
            
            # Skip buildings not in database
            if building_id not in building_ids:
                continue
            
            # Import data
            try:
                # Create a new connection for each building to avoid transaction issues
                with psycopg.connect('postgresql://eaio:eaiopassword@postgres:5432/energy-ai-optimizer') as conn:
                    with conn.cursor() as cursor:
                        data = (
                            timestamp,
                            building_id,
                            float(row[building_id]),
                            'csv_migration'
                        )
                        
                        # Use parameterized query
                        query = f'''
                        INSERT INTO energy_data (time, building_id, {energy_type}, source)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (building_id, time) 
                        DO UPDATE SET 
                            {energy_type} = EXCLUDED.{energy_type},
                            source = EXCLUDED.source
                        '''
                        
                        cursor.execute(query, data)
                        migrated_count += 1
            except Exception as e:
                print(f'Error processing building {building_id} at time {timestamp}: {str(e)}')
    
    # Final count
    try:
        conn = psycopg.connect('postgresql://eaio:eaiopassword@postgres:5432/energy-ai-optimizer')
        with conn.cursor() as cursor:
            cursor.execute(f'SELECT COUNT(*) FROM energy_data WHERE {energy_type} IS NOT NULL')
            energy_count = cursor.fetchone()[0]
            
            print(f'Migration complete. {energy_type.capitalize()} data points migrated: {migrated_count}')
            print(f'Total {energy_type} data points in database: {energy_count}')
        conn.close()
    except Exception as e:
        print(f'Error checking final count: {str(e)}')

def main():
    """Main function to parse arguments and run the import."""
    parser = argparse.ArgumentParser(description='Import energy data from CSV to PostgreSQL')
    parser.add_argument('energy_type', choices=['electricity', 'water', 'gas', 'steam', 'hotwater', 'chilledwater', 'irrigation', 'solar'],
                        help='Type of energy data to import')
    parser.add_argument('--limit', type=int, default=1000,
                        help='Maximum number of rows to process (default: 1000, use 0 for all)')
    
    args = parser.parse_args()
    limit = args.limit if args.limit > 0 else None
    
    import_energy_data(args.energy_type, limit)

if __name__ == "__main__":
    main() 