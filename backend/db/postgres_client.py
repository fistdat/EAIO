"""
PostgreSQL client module for EAIO system.
This module provides connection and query functions for PostgreSQL database.
"""
import os
import psycopg
from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row
from contextlib import contextmanager
import logging
from typing import Dict, List, Any, Optional, Generator, Union

# Cấu hình logging
logger = logging.getLogger("eaio.db.postgres")

# Biến global cho connection pool
_pg_pool = None

def get_postgres_pool() -> ConnectionPool:
    """
    Lấy hoặc tạo connection pool cho PostgreSQL.
    
    Returns:
        ConnectionPool: Pool kết nối PostgreSQL
    """
    global _pg_pool
    
    if _pg_pool is None:
        # Lấy connection string từ biến môi trường
        postgres_url = os.getenv("POSTGRES_URL", "postgresql://eaio:eaiopassword@postgres:5432/energy-ai-optimizer")
        
        logger.info(f"Connecting to PostgreSQL at {postgres_url}")
        
        try:
            # Tạo connection pool với các thông số tối ưu
            _pg_pool = ConnectionPool(
                postgres_url,
                min_size=5,
                max_size=20,
                kwargs={"row_factory": dict_row}
            )
            
            # Kiểm tra kết nối
            with _pg_pool.connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT version();")
                    version = cur.fetchone()
                    logger.info(f"Connected to PostgreSQL: {version}")
                    
            logger.info("PostgreSQL connection pool initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize PostgreSQL connection pool: {str(e)}")
            raise
    
    return _pg_pool

@contextmanager
def get_connection():
    """
    Context manager để lấy và trả kết nối từ pool.
    
    Yields:
        Connection: Kết nối PostgreSQL
    """
    pool = get_postgres_pool()
    
    # Lấy kết nối từ pool
    conn = pool.getconn()
    
    try:
        # Trả kết nối cho người sử dụng
        yield conn
    finally:
        # Đảm bảo kết nối được trả về pool
        pool.putconn(conn)

def execute_query(query: str, params: Optional[Union[tuple, dict]] = None) -> List[Dict[str, Any]]:
    """
    Thực thi truy vấn và trả về kết quả dưới dạng danh sách dict.
    
    Args:
        query: SQL query string
        params: Parameters for the query
        
    Returns:
        List[Dict[str, Any]]: Query results
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute(query, params)
                
                # Nếu là SELECT, trả về kết quả
                if cur.description:
                    return cur.fetchall()
                
                # Nếu là INSERT, UPDATE, DELETE, trả về số hàng bị ảnh hưởng
                return [{"affected_rows": cur.rowcount}]
            except Exception as e:
                conn.rollback()
                logger.error(f"Query execution error: {str(e)}")
                logger.error(f"Query: {query}")
                logger.error(f"Params: {params}")
                raise

def execute_many(query: str, params_list: List[Union[tuple, dict]]) -> Dict[str, int]:
    """
    Thực thi một truy vấn nhiều lần với danh sách các tham số.
    
    Args:
        query: SQL query string
        params_list: List of parameter sets
        
    Returns:
        Dict[str, int]: Result with affected rows count
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            try:
                cur.executemany(query, params_list)
                conn.commit()
                return {"affected_rows": cur.rowcount}
            except Exception as e:
                conn.rollback()
                logger.error(f"Query execution error: {str(e)}")
                logger.error(f"Query: {query}")
                logger.error(f"Params: {params_list}")
                raise

def execute_transaction(queries: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Thực thi nhiều truy vấn trong một transaction.
    
    Args:
        queries: List of dictionaries, each with 'query' and optional 'params' keys
        
    Returns:
        Dict[str, Any]: Result summary
    """
    with get_connection() as conn:
        # Bắt đầu transaction
        conn.autocommit = False
        
        try:
            results = []
            
            with conn.cursor() as cur:
                for query_dict in queries:
                    query = query_dict['query']
                    params = query_dict.get('params')
                    
                    cur.execute(query, params)
                    
                    # Nếu là SELECT, lưu kết quả
                    if cur.description:
                        results.append(cur.fetchall())
            
            # Commit transaction
            conn.commit()
            return {"success": True, "results": results}
        
        except Exception as e:
            # Rollback nếu có lỗi
            conn.rollback()
            logger.error(f"Transaction execution error: {str(e)}")
            raise
        finally:
            # Đặt lại autocommit
            conn.autocommit = True

def close_postgres_pool():
    """Đóng connection pool khi ứng dụng kết thúc."""
    global _pg_pool
    if _pg_pool is not None:
        _pg_pool.close()
        _pg_pool = None
        logger.info("PostgreSQL connection pool closed")

# Các hàm tiện ích

def insert_record(table: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Chèn một bản ghi vào bảng và trả về ID.
    
    Args:
        table: Table name
        data: Dictionary of column names and values
        
    Returns:
        Dict[str, Any]: Result with inserted ID
    """
    columns = ", ".join(data.keys())
    placeholders = ", ".join([f"%({k})s" for k in data.keys()])
    
    query = f"""
    INSERT INTO {table} ({columns})
    VALUES ({placeholders})
    RETURNING *
    """
    
    result = execute_query(query, data)
    return result[0] if result else {}

def update_record(table: str, data: Dict[str, Any], condition: str, condition_params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Cập nhật bản ghi trong bảng.
    
    Args:
        table: Table name
        data: Dictionary of column names and values to update
        condition: WHERE condition (use %s or %(name)s placeholders)
        condition_params: Parameters for the condition
        
    Returns:
        Dict[str, Any]: Result with affected rows
    """
    # Kết hợp tham số
    all_params = {}
    if condition_params:
        all_params.update(condition_params)
    
    # Tạo phần SET của truy vấn
    set_parts = []
    for key, value in data.items():
        param_name = f"set_{key}"
        set_parts.append(f"{key} = %({param_name})s")
        all_params[param_name] = value
    
    set_clause = ", ".join(set_parts)
    
    query = f"""
    UPDATE {table}
    SET {set_clause}
    WHERE {condition}
    RETURNING *
    """
    
    result = execute_query(query, all_params)
    return result[0] if result else {}

def get_record(table: str, condition: str, params: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """
    Lấy một bản ghi từ bảng.
    
    Args:
        table: Table name
        condition: WHERE condition (use %s or %(name)s placeholders)
        params: Parameters for the condition
        
    Returns:
        Optional[Dict[str, Any]]: Record or None if not found
    """
    query = f"""
    SELECT * FROM {table}
    WHERE {condition}
    LIMIT 1
    """
    
    result = execute_query(query, params)
    return result[0] if result else None

def get_records(table: str, condition: Optional[str] = None, params: Optional[Dict[str, Any]] = None, 
                order_by: Optional[str] = None, limit: Optional[int] = None, 
                offset: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Lấy nhiều bản ghi từ bảng.
    
    Args:
        table: Table name
        condition: Optional WHERE condition
        params: Parameters for the condition
        order_by: Optional ORDER BY clause
        limit: Optional LIMIT
        offset: Optional OFFSET
        
    Returns:
        List[Dict[str, Any]]: List of records
    """
    query = f"SELECT * FROM {table}"
    
    if condition:
        query += f" WHERE {condition}"
    
    if order_by:
        query += f" ORDER BY {order_by}"
    
    if limit is not None:
        query += f" LIMIT {limit}"
    
    if offset is not None:
        query += f" OFFSET {offset}"
    
    return execute_query(query, params) 