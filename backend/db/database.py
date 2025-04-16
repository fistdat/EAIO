import os
import logging
import psycopg2
from psycopg2.extras import DictCursor
from contextlib import contextmanager
import urllib.parse

class Database:
    """Database connection and operations."""
    
    def __init__(self):
        """Initialize database connection."""
        self.logger = logging.getLogger('eaio.db')
        
        # Thiết lập thông số kết nối từ environment variable POSTGRES_URL nếu có
        postgres_url = os.getenv('POSTGRES_URL')
        if postgres_url:
            # Parse POSTGRES_URL trong trường hợp nó có định dạng postgresql://user:password@host:port/dbname
            self.logger.info(f"Using POSTGRES_URL from environment: {postgres_url.split('@')[1] if '@' in postgres_url else postgres_url}")
            try:
                result = urllib.parse.urlparse(postgres_url)
                self.conn_params = {
                    'dbname': result.path[1:],
                    'user': result.username,
                    'password': result.password,
                    'host': result.hostname,
                    'port': result.port or '5432'
                }
            except Exception as e:
                self.logger.error(f"Failed to parse POSTGRES_URL: {e}")
                # Sử dụng giá trị mặc định nếu không thể phân tích URL
                self.conn_params = {
                    'dbname': os.getenv('POSTGRES_DB', 'energy-ai-optimizer'),
                    'user': os.getenv('POSTGRES_USER', 'eaio'),
                    'password': os.getenv('POSTGRES_PASSWORD', 'eaiopassword'),
                    'host': os.getenv('POSTGRES_HOST', 'postgres'),
                    'port': os.getenv('POSTGRES_PORT', '5432')
                }
        else:
            # Sử dụng các biến môi trường riêng biệt nếu không có POSTGRES_URL
            self.conn_params = {
                'dbname': os.getenv('POSTGRES_DB', 'energy-ai-optimizer'),
                'user': os.getenv('POSTGRES_USER', 'eaio'),
                'password': os.getenv('POSTGRES_PASSWORD', 'eaiopassword'),
                'host': os.getenv('POSTGRES_HOST', 'postgres'),  # Sửa từ localhost thành postgres (tên container)
                'port': os.getenv('POSTGRES_PORT', '5432')
            }
        
        self.logger.info(f"PostgreSQL connection parameters: host={self.conn_params['host']}, port={self.conn_params['port']}, dbname={self.conn_params['dbname']}, user={self.conn_params['user']}")
        self.test_connection()
        
    def test_connection(self):
        """Test database connection."""
        try:
            self.logger.info(f"Attempting connection to PostgreSQL with params: host={self.conn_params['host']}, port={self.conn_params['port']}, dbname={self.conn_params['dbname']}, user={self.conn_params['user']}")
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT version();")
                    version = cursor.fetchone()[0]
                    self.logger.info(f"Successfully connected to PostgreSQL: {version}")
                    
                    # Kiểm tra các bảng trong database
                    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
                    tables = cursor.fetchall()
                    self.logger.info(f"Found {len(tables)} tables in database: {', '.join([t[0] for t in tables])}")
                    
                    # Kiểm tra dữ liệu bảng buildings
                    cursor.execute("SELECT COUNT(*) FROM buildings;")
                    building_count = cursor.fetchone()[0]
                    self.logger.info(f"Found {building_count} records in buildings table")
        except Exception as e:
            import traceback
            self.logger.error(f"Failed to connect to PostgreSQL database: {e}")
            self.logger.error(f"Connection params: {self.conn_params}")
            self.logger.error(traceback.format_exc())
            # Don't raise, allow the system to continue with warnings
    
    @contextmanager
    def get_connection(self):
        """Get a database connection."""
        conn = None
        try:
            conn = psycopg2.connect(**self.conn_params)
            yield conn
        except Exception as e:
            self.logger.error(f"Connection error: {e}")
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                conn.commit()
                conn.close()
                
    def execute_query(self, query, params=None, fetch=True):
        """Execute a query and return results."""
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=DictCursor) as cursor:
                    cursor.execute(query, params)
                    if fetch:
                        return cursor.fetchall()
        except Exception as e:
            self.logger.error(f"Error executing query: {e}")
            raise

    def execute_many(self, query, params_list):
        """Execute a query with many parameter sets."""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.executemany(query, params_list)
                conn.commit()
        except Exception as e:
            self.logger.error(f"Error executing batch query: {e}")
            raise
    
    def get_buildings(self, limit=100, offset=0, filters=None):
        """Get buildings with pagination and filtering."""
        try:
            query = """
            SELECT * FROM buildings
            """
            
            where_clauses = []
            params = {}
            
            if filters:
                # Add filter conditions
                if 'type' in filters and filters['type']:
                    where_clauses.append("type = %(type)s")
                    params['type'] = filters['type']
                    
                if 'location' in filters and filters['location']:
                    where_clauses.append("location = %(location)s")
                    params['location'] = filters['location']
            
            if where_clauses:
                query += " WHERE " + " AND ".join(where_clauses)
            
            query += " ORDER BY name LIMIT %(limit)s OFFSET %(offset)s"
            params['limit'] = limit
            params['offset'] = offset
            
            # Get total count for pagination
            count_query = """
            SELECT COUNT(*) FROM buildings
            """
            if where_clauses:
                count_query += " WHERE " + " AND ".join(where_clauses)
                
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=DictCursor) as cursor:
                    cursor.execute(count_query, params)
                    total = cursor.fetchone()[0]
                    
                    cursor.execute(query, params)
                    buildings = cursor.fetchall()
                    
            return {
                'items': [dict(b) for b in buildings],
                'total': total,
                'limit': limit,
                'offset': offset
            }
            
        except Exception as e:
            self.logger.error(f"Error getting buildings: {e}")
            raise
            
    def get_building_by_id(self, building_id):
        """Get a building by ID."""
        try:
            query = "SELECT * FROM buildings WHERE id = %s"
            result = self.execute_query(query, (building_id,))
            if result:
                return dict(result[0])
            return None
        except Exception as e:
            self.logger.error(f"Error getting building {building_id}: {e}")
            raise
    
    def get_building_consumption(self, building_id, meter_type, start_date=None, end_date=None, interval=None):
        """Get consumption data for a building."""
        try:
            # Implement query logic based on parameters
            query = f"""
            SELECT * FROM {meter_type}_consumption
            WHERE building_id = %s
            """
            params = [building_id]
            
            if start_date:
                query += " AND timestamp >= %s"
                params.append(start_date)
                
            if end_date:
                query += " AND timestamp <= %s"
                params.append(end_date)
                
            query += " ORDER BY timestamp"
            
            result = self.execute_query(query, tuple(params))
            if result:
                return [dict(r) for r in result]
            return []
        except Exception as e:
            self.logger.error(f"Error getting building consumption: {e}")
            raise

    def import_buildings(self, buildings):
        """Import buildings into the database.
        
        Args:
            buildings: List of building dictionaries to import
        """
        try:
            if not buildings:
                self.logger.info("No buildings to import")
                return
                
            self.logger.info(f"Inserting {len(buildings)} buildings into database")
            
            # Create SQL query for batch insertion
            insert_query = """
            INSERT INTO buildings (
                id, name, location, type, size, floors, built_year, 
                energy_sources, primary_use, occupancy_hours, metadata
            ) 
            VALUES (
                %(id)s, %(name)s, %(location)s, %(type)s, %(size)s, %(floors)s, %(built_year)s,
                %(energy_sources)s::TEXT[], %(primary_use)s, %(occupancy_hours)s, %(metadata)s::JSONB
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                location = EXCLUDED.location,
                type = EXCLUDED.type,
                size = EXCLUDED.size,
                floors = EXCLUDED.floors,
                built_year = EXCLUDED.built_year,
                energy_sources = EXCLUDED.energy_sources,
                primary_use = EXCLUDED.primary_use,
                occupancy_hours = EXCLUDED.occupancy_hours,
                metadata = EXCLUDED.metadata,
                updated_at = NOW()
            """
            
            # Execute batch insertion
            self.execute_many(insert_query, buildings)
            self.logger.info(f"Successfully imported {len(buildings)} buildings")
        except Exception as e:
            self.logger.error(f"Database error during building import: {e}")
            raise 