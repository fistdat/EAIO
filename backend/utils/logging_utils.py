import logging
import os
import sys
from pathlib import Path
from typing import Optional

# Use absolute import instead of relative import
from config import config

# Ensure logs directory exists
logs_dir = Path(os.path.dirname(config.LOG_FILE))
logs_dir.mkdir(parents=True, exist_ok=True)

def setup_logger(name: str, level: Optional[str] = None) -> logging.Logger:
    """
    Set up a logger with specified name and level.
    
    Args:
        name: The name of the logger
        level: The log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        
    Returns:
        logging.Logger: Configured logger instance
    """
    # Get log level from config if not specified
    if level is None:
        level = config.LOG_LEVEL
    
    # Map string level to logging constants
    log_level = getattr(logging, level.upper(), logging.INFO)
    
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(log_level)
    
    # Clear existing handlers if any
    if logger.handlers:
        logger.handlers.clear()
    
    # Create formatters
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s'
    )
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(console_formatter)
    
    # Create file handler
    file_handler = logging.FileHandler(config.LOG_FILE)
    file_handler.setLevel(log_level)
    file_handler.setFormatter(file_formatter)
    
    # Add handlers to logger
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    return logger

# Create application logger
app_logger = setup_logger('eaio')

# Create agent loggers
data_analysis_logger = setup_logger('eaio.agent.data_analysis')
recommendation_logger = setup_logger('eaio.agent.recommendation')
forecasting_logger = setup_logger('eaio.agent.forecasting')
commander_logger = setup_logger('eaio.agent.commander')

# Create data loggers
building_data_logger = setup_logger('eaio.data.building')
weather_data_logger = setup_logger('eaio.data.weather')
metadata_logger = setup_logger('eaio.data.metadata')

# Create API logger
api_logger = setup_logger('eaio.api')

def get_logger(name: str) -> logging.Logger:
    """
    Get a logger by name.
    
    Args:
        name: The name of the logger
        
    Returns:
        logging.Logger: Logger instance
    """
    return logging.getLogger(name) 