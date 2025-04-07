import os
from dotenv import load_dotenv
from typing import Dict, Any, Optional

# Load environment variables
load_dotenv()

# Environment configuration
IS_DOCKER = os.getenv('IS_DOCKER', 'false').lower() == 'true'

# Database configuration
DB_CONFIG = {
    'user': os.getenv('POSTGRES_USER', 'eaio_user'),
    'password': os.getenv('POSTGRES_PASSWORD', 'eaio_password'),
    'host': 'postgres' if IS_DOCKER else 'localhost',
    'port': os.getenv('POSTGRES_PORT', '5432'),
    'database': os.getenv('POSTGRES_DB', 'eaio_db'),
}

# Database URL
DATABASE_URL = f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"

# OpenAI API configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')

# Weather API configuration
WEATHER_API_KEY = os.getenv('WEATHER_API_KEY', '')
WEATHER_API_URL = os.getenv('WEATHER_API_URL', 'https://api.openweathermap.org/data/2.5')

# Logging configuration
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_FILE = os.getenv('LOG_FILE', 'logs/eaio.log')

# Application settings
APP_PORT = int(os.getenv('APP_PORT', '8000'))
APP_HOST = os.getenv('APP_HOST', '0.0.0.0')
DEBUG_MODE = os.getenv('DEBUG_MODE', 'false').lower() == 'true'

# API settings
API_PREFIX = os.getenv('API_PREFIX', '/api/v1')
CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')

# Agent configuration
AGENT_CONFIG = {
    'data_analysis': {
        'enabled': os.getenv('ENABLE_DATA_ANALYSIS_AGENT', 'true').lower() == 'true',
        'model': os.getenv('DATA_ANALYSIS_MODEL', OPENAI_MODEL),
    },
    'recommendation': {
        'enabled': os.getenv('ENABLE_RECOMMENDATION_AGENT', 'true').lower() == 'true',
        'model': os.getenv('RECOMMENDATION_MODEL', OPENAI_MODEL),
    },
    'forecasting': {
        'enabled': os.getenv('ENABLE_FORECASTING_AGENT', 'true').lower() == 'true',
        'model': os.getenv('FORECASTING_MODEL', OPENAI_MODEL),
    },
    'commander': {
        'enabled': os.getenv('ENABLE_COMMANDER_AGENT', 'true').lower() == 'true',
        'model': os.getenv('COMMANDER_MODEL', OPENAI_MODEL),
    },
}

# Vector database configuration
VECTOR_DB_TYPE = os.getenv('VECTOR_DB_TYPE', 'pinecone')
VECTOR_DB_CONFIG: Dict[str, Any] = {
    'api_key': os.getenv('VECTOR_DB_API_KEY', ''),
    'environment': os.getenv('VECTOR_DB_ENV', ''),
    'index_name': os.getenv('VECTOR_DB_INDEX', 'eaio-index'),
}

# System paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
MODEL_DIR = os.path.join(BASE_DIR, 'models')

# Data paths
BUILDING_DATA_PATH = os.path.join(DATA_DIR, 'building')
WEATHER_DATA_PATH = os.path.join(DATA_DIR, 'weather')
METADATA_PATH = os.path.join(DATA_DIR, 'metadata')

# Cache settings
CACHE_ENABLED = os.getenv('CACHE_ENABLED', 'true').lower() == 'true'
CACHE_TYPE = os.getenv('CACHE_TYPE', 'redis')
CACHE_URL = os.getenv('CACHE_URL', 'redis://localhost:6379/0')

# Feature engineering settings
FEATURE_ENGINEERING_CONFIG = {
    'temporal_features': os.getenv('ENABLE_TEMPORAL_FEATURES', 'true').lower() == 'true',
    'rolling_averages': os.getenv('ENABLE_ROLLING_AVERAGES', 'true').lower() == 'true',
    'window_size': int(os.getenv('ROLLING_WINDOW_SIZE', '24')),
}

def get_db_connection_params() -> Dict[str, str]:
    """Return database connection parameters as a dictionary."""
    return {
        'dbname': DB_CONFIG['database'],
        'user': DB_CONFIG['user'],
        'password': DB_CONFIG['password'],
        'host': DB_CONFIG['host'],
        'port': DB_CONFIG['port'],
    }

def get_agent_config(agent_name: str) -> Optional[Dict[str, Any]]:
    """Get configuration for a specific agent."""
    return AGENT_CONFIG.get(agent_name) 