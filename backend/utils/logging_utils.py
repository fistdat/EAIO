"""
Logging utilities for the Energy AI Optimizer.
"""
import logging
import os
import sys
from datetime import datetime
from typing import Dict, Optional

# Configure basic logging format
LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# Define log levels
LOG_LEVELS = {
    "debug": logging.DEBUG,
    "info": logging.INFO,
    "warning": logging.WARNING,
    "error": logging.ERROR,
    "critical": logging.CRITICAL
}

# Mapping of logger names to loggers
loggers: Dict[str, logging.Logger] = {}

def setup_logging(
    log_level: str = "info",
    log_dir: Optional[str] = None,
    console_output: bool = True
) -> None:
    """
    Set up logging configuration.
    
    Args:
        log_level: Log level (debug, info, warning, error, critical)
        log_dir: Directory to store log files
        console_output: Whether to output logs to console
    """
    # Convert log level string to logging level
    level = LOG_LEVELS.get(log_level.lower(), logging.INFO)
    
    # Set up root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    
    # Clear existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create formatters
    formatter = logging.Formatter(LOG_FORMAT, DATE_FORMAT)
    
    # Add console handler if requested
    if console_output:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)
    
    # Add file handler if log directory is provided
    if log_dir:
        # Create log directory if it doesn't exist
        os.makedirs(log_dir, exist_ok=True)
        
        # Create log filename based on current date
        date_str = datetime.now().strftime("%Y%m%d")
        log_file = os.path.join(log_dir, f"eaio_{date_str}.log")
        
        # Add file handler
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)
    
    logging.info(f"Logging initialized at level: {log_level}")

def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the specified name.
    
    Args:
        name: Logger name
        
    Returns:
        logging.Logger: Logger instance
    """
    if name in loggers:
        return loggers[name]
    
    logger = logging.getLogger(name)
    loggers[name] = logger
    
    return logger

def log_agent_activity(
    logger: logging.Logger,
    agent_name: str,
    action: str,
    details: Optional[Dict] = None,
    level: str = "info"
) -> None:
    """
    Log agent activity with structured details.
    
    Args:
        logger: Logger instance
        agent_name: Name of the agent
        action: Action being performed
        details: Additional details
        level: Log level
    """
    log_method = getattr(logger, level.lower())
    
    # Create log message
    message = f"Agent {agent_name} performed {action}"
    
    # Add details if provided
    if details:
        import json
        detail_str = json.dumps(details)
        message += f" | Details: {detail_str}"
    
    # Log the message
    log_method(message)

# Initialize logging with default settings
setup_logging(
    log_level=os.environ.get("EAIO_LOG_LEVEL", "info"),
    log_dir=os.environ.get("EAIO_LOG_DIR"),
    console_output=True
) 