#!/usr/bin/env python3
"""
Script to import water data from CSV to PostgreSQL with improved transaction handling.
"""
import os
import pandas as pd
import psycopg
import sys

def main():
    print('Starting water data import with improved transaction handling')
    
    # Path to water data file
    water_file = '/app/data/meters/cleaned/water_cleaned.csv'
    print(f'Looking for water data file at: {water_file}')
    
    # Check if file exists
    if not os.path.exists(water_file):
        print(f'Error: Water data file not found at {water_file}')
        return
    
    # Read the CSV file
    try:
        df = pd.read_csv(water_file)
        print(f'Loaded water data with {len(df)} records')
    except Exception as e:
        print(f'Error reading water data file: {str(e)}')
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
    limit = 1000  # Limit for testing
    
    # Process data row by row
    for idx, (_, row) in enumerate(df.iterrows()):
        if idx >= limit:
            break
            
        if idx % 100 == 0:
            print(f'Processing row {idx} of {min(limit, total_rows)}')
        
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
                        query = '''
                        INSERT INTO energy_data (time, building_id, water, source)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (building_id, time) 
                        DO UPDATE SET 
                            water = EXCLUDED.water,
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
            cursor.execute('SELECT COUNT(*) FROM energy_data WHERE water IS NOT NULL')
            water_count = cursor.fetchone()[0]
            
            print(f'Migration complete. Water data points migrated: {migrated_count}')
            print(f'Total water data points in database: {water_count}')
        conn.close()
    except Exception as e:
        print(f'Error checking final count: {str(e)}')

if __name__ == "__main__":
    main()
