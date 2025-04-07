"""
Database utility functions for the Energy AI Optimizer.
"""
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from typing import Dict, List, Any, Optional, Tuple, Union

from ..config import config
from .logging_utils import get_logger

# Get logger
logger = get_logger('eaio.utils.db')

def get_engine() -> Engine:
    """
    Create and return a SQLAlchemy engine using the configuration.
    
    Returns:
        Engine: SQLAlchemy engine
    """
    try:
        engine = create_engine(config.DATABASE_URL)
        logger.debug("Database engine created successfully")
        return engine
    except Exception as e:
        logger.error(f"Error creating database engine: {str(e)}")
        raise

def test_connection() -> bool:
    """
    Test database connection.
    
    Returns:
        bool: True if connection is successful, False otherwise
    """
    try:
        engine = get_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            logger.info("Database connection test successful")
            return True
    except SQLAlchemyError as e:
        logger.error(f"Database connection test failed: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error during database connection test: {str(e)}")
        return False

def execute_query(query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Execute a SQL query and return the results.
    
    Args:
        query: SQL query string
        params: Query parameters
        
    Returns:
        List[Dict[str, Any]]: Query results as a list of dictionaries
    """
    try:
        engine = get_engine()
        with engine.connect() as conn:
            result = conn.execute(text(query), params or {})
            # Convert result to list of dictionaries
            return [dict(row) for row in result]
    except SQLAlchemyError as e:
        logger.error(f"Error executing query: {str(e)}")
        logger.debug(f"Query: {query}, Params: {params}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error executing query: {str(e)}")
        raise

def execute_query_to_df(query: str, params: Optional[Dict[str, Any]] = None) -> pd.DataFrame:
    """
    Execute a SQL query and return the results as a pandas DataFrame.
    
    Args:
        query: SQL query string
        params: Query parameters
        
    Returns:
        pd.DataFrame: Query results as a pandas DataFrame
    """
    try:
        engine = get_engine()
        return pd.read_sql_query(text(query), engine, params=params or {})
    except SQLAlchemyError as e:
        logger.error(f"Error executing query to DataFrame: {str(e)}")
        logger.debug(f"Query: {query}, Params: {params}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error executing query to DataFrame: {str(e)}")
        raise

def insert_dataframe(df: pd.DataFrame, table_name: str, if_exists: str = 'append') -> bool:
    """
    Insert a pandas DataFrame into a database table.
    
    Args:
        df: DataFrame to insert
        table_name: Name of the table
        if_exists: How to behave if the table already exists ('fail', 'replace', 'append')
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        engine = get_engine()
        df.to_sql(table_name, engine, if_exists=if_exists, index=False)
        logger.info(f"Successfully inserted {len(df)} rows into {table_name}")
        return True
    except SQLAlchemyError as e:
        logger.error(f"Error inserting DataFrame into {table_name}: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error inserting DataFrame into {table_name}: {str(e)}")
        return False

def get_table_columns(table_name: str) -> List[str]:
    """
    Get column names for a table.
    
    Args:
        table_name: Name of the table
        
    Returns:
        List[str]: List of column names
    """
    try:
        query = f"""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = :table_name
        ORDER BY ordinal_position
        """
        results = execute_query(query, {'table_name': table_name})
        return [row['column_name'] for row in results]
    except Exception as e:
        logger.error(f"Error getting columns for table {table_name}: {str(e)}")
        raise

def batch_insert(
    df: pd.DataFrame, 
    table_name: str, 
    batch_size: int = 1000,
    if_exists: str = 'append'
) -> Tuple[bool, int]:
    """
    Insert a DataFrame into a database table in batches to avoid memory issues.
    
    Args:
        df: DataFrame to insert
        table_name: Name of the table
        batch_size: Number of rows per batch
        if_exists: How to behave if the table already exists
        
    Returns:
        Tuple[bool, int]: Success status and number of rows inserted
    """
    try:
        engine = get_engine()
        total_rows = len(df)
        inserted_rows = 0
        
        # Calculate number of batches
        num_batches = (total_rows + batch_size - 1) // batch_size
        
        for i in range(num_batches):
            start_idx = i * batch_size
            end_idx = min((i + 1) * batch_size, total_rows)
            batch = df.iloc[start_idx:end_idx]
            
            # Use if_exists='replace' only for the first batch
            current_if_exists = if_exists if i == 0 else 'append'
            
            try:
                batch.to_sql(
                    table_name, 
                    engine, 
                    if_exists=current_if_exists, 
                    index=False
                )
                inserted_rows += len(batch)
                logger.debug(f"Batch {i+1}/{num_batches} inserted successfully")
            except Exception as e:
                logger.error(f"Error inserting batch {i+1}/{num_batches}: {str(e)}")
                if batch_size > 100:
                    logger.info(f"Retrying with smaller batch size")
                    # Try with smaller batch size if the batch is big enough
                    return batch_insert(df.iloc[inserted_rows:], table_name, batch_size // 2, 'append')
                else:
                    raise
        
        logger.info(f"Successfully inserted {inserted_rows} rows into {table_name}")
        return True, inserted_rows
    except Exception as e:
        logger.error(f"Error in batch insert: {str(e)}")
        return False, inserted_rows 