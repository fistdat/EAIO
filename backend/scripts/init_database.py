#!/usr/bin/env python
"""
Database initialization script for Energy AI Optimizer.
This script executes the SQL in init_db.sql to create all required tables.
"""
import os
import sys
import logging
import psycopg2
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger("db_init")

# Add the parent directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()

def get_connection_params():
    """Get database connection parameters from environment variables."""
    postgres_url = os.getenv('POSTGRES_URL')
    if postgres_url:
        # Parse URL for connection parameters
        import urllib.parse
        result = urllib.parse.urlparse(postgres_url)
        return {
            'dbname': result.path[1:],
            'user': result.username,
            'password': result.password,
            'host': result.hostname,
            'port': result.port or '5432'
        }
    else:
        # Use individual environment variables
        return {
            'dbname': os.getenv('POSTGRES_DB', 'energy-ai-optimizer'),
            'user': os.getenv('POSTGRES_USER', 'eaio'),
            'password': os.getenv('POSTGRES_PASSWORD', 'eaiopassword'),
            'host': os.getenv('POSTGRES_HOST', 'postgres'),
            'port': os.getenv('POSTGRES_PORT', '5432')
        }

def initialize_database():
    """Initialize database with required tables."""
    conn_params = get_connection_params()
    logger.info(f"Connecting to PostgreSQL: {conn_params['host']}:{conn_params['port']}/{conn_params['dbname']}")
    
    try:
        conn = psycopg2.connect(**conn_params)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Get the path to the SQL file
        sql_file_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'db',
            'init_db.sql'
        )
        
        # Read and execute the SQL file
        logger.info(f"Executing SQL from {sql_file_path}")
        with open(sql_file_path, 'r') as f:
            sql = f.read()
            cursor.execute(sql)
        
        # Verify tables were created
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        tables = cursor.fetchall()
        logger.info(f"Tables in database: {', '.join([t[0] for t in tables])}")
        
        # Close connection
        cursor.close()
        conn.close()
        logger.info("Database initialization completed successfully")
        return True
    
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        return False

if __name__ == "__main__":
    initialize_database() 