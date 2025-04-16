"""
Configuration settings for the Energy AI Optimizer.
"""
import os
from typing import Dict, Any, Optional
import json
from pathlib import Path
import logging

# Try to load dotenv if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

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

class Config:
    """Configuration class for the Energy AI Optimizer."""
    
    def __init__(self, config_file: Optional[str] = None):
        """
        Initialize configuration settings.
        
        Args:
            config_file: Path to configuration file (optional)
        """
        # Base paths
        self.BASE_DIR = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.CONFIG_DIR = self.BASE_DIR / "config"
        self.DATA_DIR = self.BASE_DIR / "data"
        self.LOGS_DIR = self.BASE_DIR / "logs"
        
        # Create directories if they don't exist
        self.LOGS_DIR.mkdir(parents=True, exist_ok=True)
        
        # Log settings
        self.LOG_LEVEL = os.environ.get("EAIO_LOG_LEVEL", "INFO")
        self.LOG_FILE = str(self.LOGS_DIR / "eaio.log")
        
        # API settings
        self.HOST = os.environ.get("EAIO_HOST", "0.0.0.0")
        self.PORT = int(os.environ.get("EAIO_PORT", "8000"))
        
        # OpenAI settings
        self.OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
        self.OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
        self.OPENAI_TEMPERATURE = float(os.environ.get("OPENAI_TEMPERATURE", "0.7"))
        
        # Memory settings
        self.MEMORY_DIR = str(self.BASE_DIR / "memory_storage")
        
        # Load configuration from file if provided
        if config_file:
            self.load_config(config_file)
        else:
            # Try to load default config
            default_config = self.CONFIG_DIR / "eaio_config.json"
            if default_config.exists():
                self.load_config(str(default_config))
    
    def load_config(self, config_file: str) -> None:
        """
        Load configuration from a file.
        
        Args:
            config_file: Path to configuration file
        """
        try:
            with open(config_file, 'r') as f:
                config_data = json.load(f)
            
            # Update configuration attributes
            for key, value in config_data.items():
                setattr(self, key, value)
            
            print(f"Loaded configuration from {config_file}")
        
        except Exception as e:
            print(f"Error loading configuration: {str(e)}")
    
    def get_llm_config(self) -> Dict[str, Any]:
        """
        Get LLM configuration for agents.
        
        Returns:
            Dict[str, Any]: LLM configuration
        """
        return {
            "model": self.OPENAI_MODEL,
            "api_key": self.OPENAI_API_KEY,
            "temperature": self.OPENAI_TEMPERATURE
        }
    
    def get_agent_config(self, agent_type: str) -> Dict[str, Any]:
        """
        Get configuration for a specific agent type.
        
        Args:
            agent_type: Type of agent (data_analysis, recommendation, etc.)
            
        Returns:
            Dict[str, Any]: Agent configuration
        """
        # Default configuration
        default_config = {
            "model": self.OPENAI_MODEL,
            "api_key": self.OPENAI_API_KEY,
            "temperature": self.OPENAI_TEMPERATURE,
            "max_tokens": 2000
        }
        
        # Agent-specific configurations
        agent_configs = {
            "data_analysis": {
                "temperature": 0.3,
                "max_tokens": 4000
            },
            "recommendation": {
                "temperature": 0.7,
                "max_tokens": 2000
            },
            "forecasting": {
                "temperature": 0.5,
                "max_tokens": 2000
            },
            "commander": {
                "temperature": 0.7,
                "max_tokens": 4000
            },
            "memory": {
                "temperature": 0.3,
                "max_tokens": 2000,
                "memory_dir": self.MEMORY_DIR
            },
            "evaluator": {
                "temperature": 0.3,
                "max_tokens": 2000
            },
            "adapter": {
                "temperature": 0.3,
                "max_tokens": 1000,
                "config_path": str(self.CONFIG_DIR / "external_apis.json")
            }
        }
        
        # Get agent-specific config
        agent_config = agent_configs.get(agent_type.lower(), {})
        
        # Merge with default config
        config = {**default_config, **agent_config}
        
        return config

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