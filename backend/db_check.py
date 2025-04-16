"""
Script to check PostgreSQL connection and database structure.
This script tests the connection to PostgreSQL and verifies the database structure.
"""
import os
import sys
import logging
import json
from pprint import pprint

# Thiết lập logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("eaio.db_check")

# Thêm thư mục gốc vào PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Đặt biến môi trường DB_TYPE 
os.environ["DB_TYPE"] = "postgres"

# Import các module
try:
    from db.postgres_client import execute_query, get_connection, close_postgres_pool
except ImportError as e:
    logger.error(f"Error importing database modules: {str(e)}")
    raise

def check_postgres_connection():
    """Kiểm tra kết nối PostgreSQL."""
    logger.info("Checking PostgreSQL connection")
    
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT version();")
                version = cur.fetchone()
                logger.info(f"Connected to PostgreSQL: {version}")
                return True, version
    except Exception as e:
        logger.error(f"PostgreSQL connection failed: {str(e)}")
        return False, str(e)

def check_tables():
    """Kiểm tra các bảng đã tồn tại trong database."""
    logger.info("Checking database tables")
    
    try:
        query = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
        """
        
        tables = execute_query(query)
        
        if tables:
            table_names = [table['table_name'] for table in tables]
            logger.info(f"Found {len(table_names)} tables: {', '.join(table_names)}")
            return True, table_names
        else:
            logger.warning("No tables found in database")
            return False, "No tables found"
    except Exception as e:
        logger.error(f"Error checking tables: {str(e)}")
        return False, str(e)

def check_buildings_structure():
    """Kiểm tra cấu trúc bảng buildings."""
    logger.info("Checking buildings table structure")
    
    try:
        query = """
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'buildings'
        ORDER BY ordinal_position;
        """
        
        columns = execute_query(query)
        
        if columns:
            logger.info(f"Buildings table has {len(columns)} columns")
            for col in columns:
                logger.info(f"  - {col['column_name']} ({col['data_type']}, nullable: {col['is_nullable']})")
            return True, columns
        else:
            logger.warning("Buildings table not found or has no columns")
            return False, "Buildings table not found"
    except Exception as e:
        logger.error(f"Error checking buildings structure: {str(e)}")
        return False, str(e)

def check_hypertables():
    """Kiểm tra các hypertable của TimescaleDB."""
    logger.info("Checking TimescaleDB hypertables")
    
    try:
        query = """
        SELECT table_name, created, chunk_time_interval
        FROM timescaledb_information.hypertables;
        """
        
        hypertables = execute_query(query)
        
        if hypertables:
            logger.info(f"Found {len(hypertables)} hypertables")
            for ht in hypertables:
                logger.info(f"  - {ht['table_name']} (chunk interval: {ht['chunk_time_interval']})")
            return True, hypertables
        else:
            logger.warning("No hypertables found")
            return False, "No hypertables found"
    except Exception as e:
        logger.error(f"Error checking hypertables: {str(e)}")
        return False, str(e)

def check_continuous_aggregates():
    """Kiểm tra continuous aggregates của TimescaleDB."""
    logger.info("Checking TimescaleDB continuous aggregates")
    
    try:
        query = """
        SELECT view_name, materialization_hypertable_name, 
               refresh_lag, refresh_interval
        FROM timescaledb_information.continuous_aggregates;
        """
        
        aggregates = execute_query(query)
        
        if aggregates:
            logger.info(f"Found {len(aggregates)} continuous aggregates")
            for agg in aggregates:
                logger.info(f"  - {agg['view_name']} (refresh interval: {agg['refresh_interval']})")
            return True, aggregates
        else:
            logger.warning("No continuous aggregates found")
            return False, "No continuous aggregates found"
    except Exception as e:
        logger.error(f"Error checking continuous aggregates: {str(e)}")
        return False, str(e)

def check_buildings_count():
    """Kiểm tra số lượng tòa nhà trong database."""
    logger.info("Checking buildings count")
    
    try:
        query = "SELECT COUNT(*) as count FROM buildings;"
        result = execute_query(query)
        
        if result and len(result) > 0:
            count = result[0]['count']
            logger.info(f"Found {count} buildings in database")
            return True, count
        else:
            logger.warning("Could not get buildings count")
            return False, "Count query failed"
    except Exception as e:
        logger.error(f"Error checking buildings count: {str(e)}")
        return False, str(e)

def check_energy_data_count():
    """Kiểm tra số lượng dữ liệu năng lượng trong database."""
    logger.info("Checking energy data count")
    
    try:
        query = "SELECT COUNT(*) as count FROM energy_data;"
        result = execute_query(query)
        
        if result and len(result) > 0:
            count = result[0]['count']
            logger.info(f"Found {count} energy data records in database")
            return True, count
        else:
            logger.warning("Could not get energy data count")
            return False, "Count query failed"
    except Exception as e:
        logger.error(f"Error checking energy data count: {str(e)}")
        return False, str(e)

def run_all_checks():
    """Chạy tất cả các kiểm tra."""
    logger.info("Running all database checks")
    
    results = {}
    
    # Kiểm tra kết nối
    success, connection_info = check_postgres_connection()
    results["connection"] = {
        "success": success,
        "info": connection_info
    }
    
    if not success:
        logger.error("PostgreSQL connection failed, aborting further checks")
        return results
    
    # Kiểm tra danh sách bảng
    success, tables_info = check_tables()
    results["tables"] = {
        "success": success,
        "info": tables_info
    }
    
    # Kiểm tra cấu trúc bảng buildings
    success, structure_info = check_buildings_structure()
    results["buildings_structure"] = {
        "success": success,
        "info": structure_info
    }
    
    # Kiểm tra hypertables
    success, hypertables_info = check_hypertables()
    results["hypertables"] = {
        "success": success,
        "info": hypertables_info
    }
    
    # Kiểm tra continuous aggregates
    success, aggregates_info = check_continuous_aggregates()
    results["continuous_aggregates"] = {
        "success": success,
        "info": aggregates_info
    }
    
    # Kiểm tra số lượng tòa nhà
    success, buildings_count = check_buildings_count()
    results["buildings_count"] = {
        "success": success,
        "count": buildings_count
    }
    
    # Kiểm tra số lượng dữ liệu năng lượng
    success, energy_count = check_energy_data_count()
    results["energy_data_count"] = {
        "success": success,
        "count": energy_count
    }
    
    # Đóng kết nối
    close_postgres_pool()
    
    return results

if __name__ == "__main__":
    print("\n==== PostgreSQL Database Check ====\n")
    
    # Hiển thị thông tin kết nối
    postgres_url = os.getenv("POSTGRES_URL", "Not set")
    print(f"POSTGRES_URL: {postgres_url[:20]}..." if len(postgres_url) > 20 else postgres_url)
    
    # Chạy tất cả các kiểm tra
    results = run_all_checks()
    
    # Hiển thị tóm tắt
    print("\n==== Check Results Summary ====\n")
    
    for check_name, check_result in results.items():
        success = check_result.get("success", False)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {check_name}")
    
    # Hiển thị chi tiết kết quả
    print("\n==== Detailed Results ====\n")
    
    print(json.dumps(results, indent=2, default=str)) 