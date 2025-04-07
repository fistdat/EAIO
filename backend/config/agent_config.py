"""
Agent configuration module for Energy AI Optimizer.
Provides configuration values for agent initialization and operation.
"""
import os
from typing import Dict, Any, Optional
import json
import logging
from pathlib import Path

# Set up logging
logger = logging.getLogger("eaio.config")

# Default configuration
DEFAULT_CONFIG = {
    "model": "gpt-4o-mini",
    "temperature": 0.2,
    "max_tokens": 1000,
    "api_key": None,  # Should be set from environment
    "storage_path": "storage/agents",
    "memory_retention_days": 30,
    "enable_logging": True,
    "logging_level": "INFO",
    "request_timeout": 60,
    "default_agent_settings": {
        "DataAnalysisAgent": {
            "sensitivity_default": "medium",
            "analysis_formats": ["summary", "detailed", "technical"]
        },
        "RecommendationAgent": {
            "rec_formats": ["executive", "technical", "operational"],
            "include_implementation_steps": True,
            "include_roi_estimates": True
        },
        "ForecastingAgent": {
            "forecast_horizons": ["day_ahead", "week_ahead", "month_ahead"],
            "include_confidence_intervals": True,
            "default_forecast_horizon": "day_ahead"
        },
        "CommanderAgent": {
            "auto_route_queries": True,
            "max_steps_per_query": 5,
            "store_conversation_history": True
        },
        "MemoryAgent": {
            "storage_format": "json",
            "compression": False,
            "backup_frequency_days": 7
        },
        "EvaluatorAgent": {
            "metric_formats": ["percentage", "absolute", "normalized"],
            "default_metric_format": "percentage"
        },
        "AdapterAgent": {
            "retry_attempts": 3,
            "connection_timeout": 30,
            "use_mock_data_when_unavailable": True
        }
    }
}

# Agent configuration cache
_config_cache: Optional[Dict[str, Any]] = None

def get_agent_config() -> Dict[str, Any]:
    """
    Get the agent configuration.
    
    Loads configuration from environment variables and config file,
    with fallbacks to defaults.
    
    Returns:
        Dict[str, Any]: The configuration dictionary
    """
    global _config_cache
    
    # Return cached config if available
    if _config_cache is not None:
        return _config_cache
    
    # Start with default config
    config = DEFAULT_CONFIG.copy()
    
    # Load from config file if available
    config_path = os.environ.get("EAIO_CONFIG_PATH", "config/agent_config.json")
    try:
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                file_config = json.load(f)
                # Merge with defaults (deep merge would be better for nested dicts)
                _deep_update(config, file_config)
                logger.info(f"Loaded agent configuration from {config_path}")
    except Exception as e:
        logger.warning(f"Error loading configuration from {config_path}: {str(e)}")
    
    # Override with environment variables
    env_prefix = "EAIO_"
    for key, value in os.environ.items():
        if key.startswith(env_prefix):
            config_key = key[len(env_prefix):].lower()
            
            # Handle nested keys with double underscore
            if "__" in config_key:
                parts = config_key.split("__")
                if len(parts) == 2 and parts[0] in config:
                    if isinstance(config[parts[0]], dict):
                        config[parts[0]][parts[1]] = _convert_env_value(value)
            else:
                config[config_key] = _convert_env_value(value)
    
    # Always get API key from environment if available
    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key:
        config["api_key"] = api_key
    else:
        logger.warning("OPENAI_API_KEY not found in environment variables")
    
    # Ensure storage directory exists
    if "storage_path" in config:
        storage_path = Path(config["storage_path"])
        storage_path.mkdir(parents=True, exist_ok=True)
    
    # Cache the config
    _config_cache = config
    
    return config

def get_agent_specific_config(agent_name: str) -> Dict[str, Any]:
    """
    Get configuration specific to a particular agent.
    
    Args:
        agent_name (str): Name of the agent (e.g., "DataAnalysisAgent")
        
    Returns:
        Dict[str, Any]: Agent-specific configuration
    """
    config = get_agent_config()
    agent_settings = {}
    
    # Get default settings for this agent type
    if (agent_name in config.get("default_agent_settings", {})):
        agent_settings.update(config["default_agent_settings"][agent_name])
    
    # Add any agent-specific overrides
    agent_key = f"agent_{agent_name.lower()}"
    if agent_key in config:
        agent_settings.update(config[agent_key])
    
    # Add general settings applicable to all agents
    general_settings = {
        "model": config.get("model"),
        "temperature": config.get("temperature"),
        "max_tokens": config.get("max_tokens"),
        "api_key": config.get("api_key"),
        "request_timeout": config.get("request_timeout")
    }
    
    # Combine with agent-specific settings (agent settings take precedence)
    combined_settings = {**general_settings, **agent_settings}
    
    return combined_settings

def reset_config_cache():
    """
    Reset the configuration cache.
    This will force the next call to get_agent_config to reload.
    """
    global _config_cache
    _config_cache = None

def _convert_env_value(value: str) -> Any:
    """
    Convert environment variable string to appropriate type.
    
    Args:
        value (str): String value from environment variable
        
    Returns:
        Any: Converted value (bool, int, float, or string)
    """
    # Convert to boolean if matching
    if value.lower() in ("true", "yes", "1"):
        return True
    if value.lower() in ("false", "no", "0"):
        return False
    
    # Try to convert to integer
    try:
        return int(value)
    except ValueError:
        pass
    
    # Try to convert to float
    try:
        return float(value)
    except ValueError:
        pass
    
    # Return as string
    return value

def _deep_update(target: Dict[str, Any], source: Dict[str, Any]) -> None:
    """
    Deep update a nested dictionary.
    
    Args:
        target (Dict[str, Any]): Target dictionary to update
        source (Dict[str, Any]): Source dictionary with updates
    """
    for key, value in source.items():
        if key in target and isinstance(target[key], dict) and isinstance(value, dict):
            _deep_update(target[key], value)
        else:
            target[key] = value 