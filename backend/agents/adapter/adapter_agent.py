"""
Adapter Agent implementation for the Energy AI Optimizer.
"""
from typing import Dict, List, Optional, Any, Union
import pandas as pd
import json
import requests
from datetime import datetime, timedelta
import os
import logging

from agents.base_agent import BaseAgent
from utils.logging_utils import get_logger

# Get logger
logger = get_logger('eaio.agent.adapter')

class AdapterAgent(BaseAgent):
    """
    Adapter Agent for interfacing with external systems.
    
    This agent is responsible for:
    - Connecting to building management systems
    - Retrieving weather data from external APIs
    - Interfacing with energy monitoring systems
    - Standardizing data formats for the AI optimizer
    - Handling authentication and API connections
    """
    
    def __init__(
        self,
        name: str = "AdapterAgent",
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: Optional[int] = 1000,
        api_key: Optional[str] = None,
        config_path: str = "config/external_apis.json"
    ):
        """
        Initialize the Adapter Agent.
        
        Args:
            name: Agent name
            model: LLM model to use
            temperature: Sampling temperature for the model
            max_tokens: Maximum number of tokens to generate
            api_key: OpenAI API key
            config_path: Path to configuration file for external APIs
        """
        # Define system message for adapter role
        system_message = """
        You are an Energy Adapter Agent, part of the Energy AI Optimizer system.
        Your primary role is to interface with external systems to collect and
        standardize energy-related data.
        
        Your capabilities include:
        1. Retrieving data from building management systems
        2. Collecting weather data from meteorological services
        3. Connecting with energy monitoring systems
        4. Standardizing data formats for analysis
        5. Handling API authentication and connections
        
        Your role is to ensure smooth data flow between external systems and
        the Energy AI Optimizer, providing clean, standardized data for analysis.
        """
        
        # Call the parent class constructor
        super().__init__(
            name=name,
            system_message=system_message,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=api_key,
        )
        
        # Load external API configurations
        self.config_path = config_path
        self.api_configs = self._load_api_configs()
        
        logger.info(f"Initialized {name} for external system interactions")
    
    def _load_api_configs(self) -> Dict[str, Any]:
        """Load external API configurations from config file."""
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r') as f:
                    return json.load(f)
            else:
                logger.warning(f"Config file not found: {self.config_path}, using defaults")
                return self._get_default_configs()
        except Exception as e:
            logger.error(f"Error loading API configs: {str(e)}")
            return self._get_default_configs()
    
    def _get_default_configs(self) -> Dict[str, Any]:
        """Return default API configurations."""
        return {
            "weather_api": {
                "provider": "openweathermap",
                "base_url": "https://api.openweathermap.org/data/2.5",
                "api_key_env": "OPENWEATHER_API_KEY",
                "default_params": {
                    "units": "metric"
                }
            },
            "building_systems": {
                "default_protocol": "bacnet",
                "connection_timeout": 30,
                "data_refresh_interval": 300
            },
            "energy_monitoring": {
                "default_provider": "generic_rest",
                "base_url": "http://localhost:8000/api",
                "auth_method": "basic",
                "cache_duration": 3600
            }
        }
    
    def fetch_weather_data(
        self,
        location: Dict[str, Any],
        data_type: str = "current",
        days_forecast: int = 5
    ) -> Dict[str, Any]:
        """
        Fetch weather data from configured weather API.
        
        Args:
            location: Location information (lat/lon or city/country)
            data_type: Type of weather data to fetch (current, forecast, historical)
            days_forecast: Number of days for forecast data
            
        Returns:
            Dict[str, Any]: Weather data
        """
        try:
            logger.info(f"Fetching {data_type} weather data for {location}")
            
            # Get weather API configuration
            weather_config = self.api_configs.get("weather_api", {})
            provider = weather_config.get("provider", "openweathermap")
            base_url = weather_config.get("base_url", "https://api.openweathermap.org/data/2.5")
            
            # Get API key from environment variable
            api_key_env = weather_config.get("api_key_env", "OPENWEATHER_API_KEY")
            api_key = os.environ.get(api_key_env)
            
            if not api_key:
                logger.warning(f"Weather API key not found in environment variable: {api_key_env}")
                return self._generate_mock_weather_data(location, data_type, days_forecast)
            
            # Set up API endpoint and parameters based on data type
            if data_type == "current":
                endpoint = "/weather"
                params = {"appid": api_key}
            elif data_type == "forecast":
                endpoint = "/forecast" if days_forecast <= 5 else "/forecast/daily"
                params = {"appid": api_key, "cnt": days_forecast}
            elif data_type == "historical":
                endpoint = "/history/city"
                # Calculate timestamp for historical data (default to yesterday)
                dt = int((datetime.now() - timedelta(days=1)).timestamp())
                params = {"appid": api_key, "dt": dt}
            else:
                logger.warning(f"Unsupported weather data type: {data_type}")
                return {"error": f"Unsupported weather data type: {data_type}"}
            
            # Add location parameters
            if "lat" in location and "lon" in location:
                params["lat"] = location["lat"]
                params["lon"] = location["lon"]
            elif "city" in location:
                params["q"] = location["city"]
                if "country" in location:
                    params["q"] += f",{location['country']}"
            else:
                logger.warning("Invalid location format")
                return {"error": "Invalid location format"}
            
            # Add default parameters
            default_params = weather_config.get("default_params", {})
            params.update(default_params)
            
            # Make API request
            url = f"{base_url}{endpoint}"
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                # Process and standardize weather data
                standardized_data = self._standardize_weather_data(data, provider, data_type)
                logger.info(f"Successfully fetched weather data for {location}")
                return standardized_data
            else:
                logger.warning(f"Weather API error: {response.status_code}, {response.text}")
                return {"error": f"Weather API error: {response.status_code}"}
        
        except Exception as e:
            logger.error(f"Error fetching weather data: {str(e)}")
            return {"error": f"Failed to fetch weather data: {str(e)}"}
    
    def _standardize_weather_data(
        self,
        raw_data: Dict[str, Any],
        provider: str,
        data_type: str
    ) -> Dict[str, Any]:
        """
        Standardize weather data to a common format.
        
        Args:
            raw_data: Raw weather data from API
            provider: Weather data provider name
            data_type: Type of weather data (current, forecast, historical)
            
        Returns:
            Dict[str, Any]: Standardized weather data
        """
        try:
            standardized = {
                "source": provider,
                "type": data_type,
                "timestamp": datetime.now().isoformat(),
                "data": {}
            }
            
            if provider == "openweathermap":
                if data_type == "current":
                    # Process current weather data
                    standardized["data"] = {
                        "location": {
                            "name": raw_data.get("name", "Unknown"),
                            "country": raw_data.get("sys", {}).get("country", ""),
                            "lat": raw_data.get("coord", {}).get("lat"),
                            "lon": raw_data.get("coord", {}).get("lon"),
                        },
                        "weather": {
                            "temp": raw_data.get("main", {}).get("temp"),
                            "feels_like": raw_data.get("main", {}).get("feels_like"),
                            "humidity": raw_data.get("main", {}).get("humidity"),
                            "pressure": raw_data.get("main", {}).get("pressure"),
                            "wind_speed": raw_data.get("wind", {}).get("speed"),
                            "wind_direction": raw_data.get("wind", {}).get("deg"),
                            "clouds": raw_data.get("clouds", {}).get("all"),
                            "description": raw_data.get("weather", [{}])[0].get("description", ""),
                            "icon": raw_data.get("weather", [{}])[0].get("icon", ""),
                        },
                        "sun": {
                            "sunrise": raw_data.get("sys", {}).get("sunrise"),
                            "sunset": raw_data.get("sys", {}).get("sunset"),
                        }
                    }
                elif data_type == "forecast":
                    # Process forecast data
                    standardized["data"] = {
                        "location": {
                            "name": raw_data.get("city", {}).get("name", "Unknown"),
                            "country": raw_data.get("city", {}).get("country", ""),
                            "lat": raw_data.get("city", {}).get("coord", {}).get("lat"),
                            "lon": raw_data.get("city", {}).get("coord", {}).get("lon"),
                        },
                        "forecast": []
                    }
                    
                    for item in raw_data.get("list", []):
                        forecast_item = {
                            "time": item.get("dt"),
                            "temp": item.get("main", {}).get("temp"),
                            "feels_like": item.get("main", {}).get("feels_like"),
                            "humidity": item.get("main", {}).get("humidity"),
                            "pressure": item.get("main", {}).get("pressure"),
                            "wind_speed": item.get("wind", {}).get("speed"),
                            "wind_direction": item.get("wind", {}).get("deg"),
                            "clouds": item.get("clouds", {}).get("all"),
                            "description": item.get("weather", [{}])[0].get("description", ""),
                            "icon": item.get("weather", [{}])[0].get("icon", ""),
                        }
                        standardized["data"]["forecast"].append(forecast_item)
            
            return standardized
        
        except Exception as e:
            logger.error(f"Error standardizing weather data: {str(e)}")
            return {"error": f"Failed to standardize weather data: {str(e)}"}
    
    def _generate_mock_weather_data(
        self,
        location: Dict[str, Any],
        data_type: str,
        days_forecast: int
    ) -> Dict[str, Any]:
        """
        Generate mock weather data for testing or when API is unavailable.
        
        Args:
            location: Location information
            data_type: Type of weather data
            days_forecast: Number of days for forecast
            
        Returns:
            Dict[str, Any]: Mock weather data
        """
        logger.info(f"Generating mock weather data for {location}")
        
        location_name = location.get("city", "Test City")
        country = location.get("country", "TC")
        lat = location.get("lat", 40.7128)
        lon = location.get("lon", -74.0060)
        
        mock_data = {
            "source": "mock_provider",
            "type": data_type,
            "timestamp": datetime.now().isoformat(),
            "data": {
                "location": {
                    "name": location_name,
                    "country": country,
                    "lat": lat,
                    "lon": lon,
                }
            }
        }
        
        if data_type == "current":
            mock_data["data"]["weather"] = {
                "temp": 22.5,
                "feels_like": 23.0,
                "humidity": 65,
                "pressure": 1012,
                "wind_speed": 3.6,
                "wind_direction": 220,
                "clouds": 40,
                "description": "scattered clouds",
                "icon": "03d",
            }
            mock_data["data"]["sun"] = {
                "sunrise": int((datetime.now().replace(hour=6, minute=0, second=0)).timestamp()),
                "sunset": int((datetime.now().replace(hour=18, minute=0, second=0)).timestamp()),
            }
        elif data_type == "forecast":
            mock_data["data"]["forecast"] = []
            base_date = datetime.now()
            
            for i in range(days_forecast):
                forecast_date = base_date + timedelta(days=i)
                forecast_item = {
                    "time": int(forecast_date.timestamp()),
                    "temp": 22.0 + i * 0.5,
                    "feels_like": 22.5 + i * 0.5,
                    "humidity": 65 - i,
                    "pressure": 1012 + i,
                    "wind_speed": 3.6 + i * 0.2,
                    "wind_direction": (220 + i * 10) % 360,
                    "clouds": (40 + i * 5) % 100,
                    "description": "scattered clouds",
                    "icon": "03d",
                }
                mock_data["data"]["forecast"].append(forecast_item)
        
        return mock_data
    
    def fetch_building_data(
        self,
        building_id: str,
        data_points: Optional[List[str]] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch data from building management system.
        
        Args:
            building_id: Building identifier
            data_points: List of specific data points to retrieve (None for all)
            start_time: Start time for historical data (ISO format)
            end_time: End time for historical data (ISO format)
            
        Returns:
            Dict[str, Any]: Building data
        """
        try:
            logger.info(f"Fetching building data for building {building_id}")
            
            # Get building system configuration
            building_config = self.api_configs.get("building_systems", {})
            protocol = building_config.get("default_protocol", "bacnet")
            
            # In a real implementation, this would connect to the actual building system
            # For now, we'll generate mock data
            
            # Set default time range if not specified
            if not start_time:
                start_time = (datetime.now() - timedelta(days=1)).isoformat()
            if not end_time:
                end_time = datetime.now().isoformat()
            
            # Set default data points if not specified
            if not data_points:
                data_points = [
                    "temperature", 
                    "humidity", 
                    "co2", 
                    "electricity_consumption",
                    "hvac_status"
                ]
            
            # Create standardized building data
            building_data = {
                "building_id": building_id,
                "timestamp": datetime.now().isoformat(),
                "time_range": {
                    "start": start_time,
                    "end": end_time
                },
                "protocol": protocol,
                "data_points": {}
            }
            
            # Generate mock data for each data point
            for point in data_points:
                building_data["data_points"][point] = self._generate_mock_building_data(
                    point, start_time, end_time
                )
            
            logger.info(f"Successfully fetched data for building {building_id}")
            return building_data
        
        except Exception as e:
            logger.error(f"Error fetching building data: {str(e)}")
            return {"error": f"Failed to fetch building data: {str(e)}"}
    
    def _generate_mock_building_data(
        self,
        data_point: str,
        start_time: str,
        end_time: str
    ) -> Dict[str, Any]:
        """
        Generate mock building data for testing.
        
        Args:
            data_point: Type of data point to generate
            start_time: Start time in ISO format
            end_time: End time in ISO format
            
        Returns:
            Dict[str, Any]: Mock data for the data point
        """
        try:
            # Parse start and end times
            start_dt = datetime.fromisoformat(start_time)
            end_dt = datetime.fromisoformat(end_time)
            
            # Calculate number of data points (hourly intervals)
            hours_diff = int((end_dt - start_dt).total_seconds() / 3600) + 1
            
            # Generate time points
            time_points = [
                (start_dt + timedelta(hours=i)).isoformat()
                for i in range(hours_diff)
            ]
            
            # Generate values based on data point type
            values = []
            
            if data_point == "temperature":
                # Temperature between 20-25°C with some variation
                base_value = 22.0
                for i in range(hours_diff):
                    hour = (start_dt + timedelta(hours=i)).hour
                    # Daily cycle: cooler at night, warmer during day
                    hour_factor = (hour - 3) % 24  # Coolest at 3am
                    daily_variation = 2.5 * (hour_factor / 12) if hour_factor <= 12 else 2.5 * (24 - hour_factor) / 12
                    random_variation = (i % 5 - 2) * 0.2  # Small random variation
                    values.append(round(base_value + daily_variation + random_variation, 1))
                
            elif data_point == "humidity":
                # Humidity between 40-60%
                base_value = 50
                for i in range(hours_diff):
                    hour = (start_dt + timedelta(hours=i)).hour
                    hour_factor = (hour - 15) % 24  # Lowest at 3pm
                    daily_variation = 5 * (1 - hour_factor / 12) if hour_factor <= 12 else 5 * (hour_factor - 12) / 12
                    random_variation = (i % 5 - 2)  # Small random variation
                    values.append(round(base_value - daily_variation + random_variation))
                
            elif data_point == "co2":
                # CO2 levels between 400-1000 ppm
                base_value = 450
                for i in range(hours_diff):
                    hour = (start_dt + timedelta(hours=i)).hour
                    is_workday = (start_dt + timedelta(hours=i)).weekday() < 5
                    is_work_hours = 8 <= hour <= 17
                    
                    # Higher during work hours on workdays
                    if is_workday and is_work_hours:
                        values.append(round(base_value + 300 + (i % 5 - 2) * 20))
                    else:
                        values.append(round(base_value + (i % 5 - 2) * 10))
                
            elif data_point == "electricity_consumption":
                # Electricity consumption in kWh
                base_value = 50  # Base load
                for i in range(hours_diff):
                    hour = (start_dt + timedelta(hours=i)).hour
                    is_workday = (start_dt + timedelta(hours=i)).weekday() < 5
                    is_work_hours = 8 <= hour <= 17
                    
                    # Higher during work hours on workdays
                    if is_workday and is_work_hours:
                        values.append(round(base_value + 150 + (hour - 8) * 5 if hour <= 12 else base_value + 150 + (17 - hour) * 5))
                    else:
                        values.append(round(base_value + (i % 5 - 2) * 2))
                
            elif data_point == "hvac_status":
                # HVAC status (0 = off, 1 = on)
                for i in range(hours_diff):
                    hour = (start_dt + timedelta(hours=i)).hour
                    is_workday = (start_dt + timedelta(hours=i)).weekday() < 5
                    is_work_hours = 7 <= hour <= 18  # HVAC starts before work hours
                    
                    # On during work hours on workdays
                    if is_workday and is_work_hours:
                        values.append(1)
                    else:
                        values.append(0)
            else:
                # Default random values between 0-100
                for i in range(hours_diff):
                    values.append(round(50 + (i % 10 - 5) * 5))
            
            # Create result
            return {
                "unit": self._get_unit_for_data_point(data_point),
                "timestamps": time_points,
                "values": values
            }
        
        except Exception as e:
            logger.error(f"Error generating mock building data: {str(e)}")
            return {"error": f"Failed to generate mock data: {str(e)}"}
    
    def _get_unit_for_data_point(self, data_point: str) -> str:
        """Return the appropriate unit for a data point."""
        units = {
            "temperature": "°C",
            "humidity": "%",
            "co2": "ppm",
            "electricity_consumption": "kWh",
            "gas_consumption": "m³",
            "water_consumption": "m³",
            "hvac_status": "binary",
            "occupancy": "count",
            "air_quality": "index",
            "pressure": "hPa",
        }
        return units.get(data_point, "unit")
    
    def fetch_energy_monitoring_data(
        self,
        building_id: str,
        metric_type: str = "electricity",
        interval: str = "hourly",
        start_time: Optional[str] = None,
        end_time: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch data from energy monitoring system.
        
        Args:
            building_id: Building identifier
            metric_type: Type of energy metric (electricity, gas, water)
            interval: Data granularity (hourly, daily, monthly)
            start_time: Start time for historical data (ISO format)
            end_time: End time for historical data (ISO format)
            
        Returns:
            Dict[str, Any]: Energy monitoring data
        """
        try:
            logger.info(f"Fetching {metric_type} monitoring data for building {building_id}")
            
            # Get energy monitoring configuration
            monitoring_config = self.api_configs.get("energy_monitoring", {})
            provider = monitoring_config.get("default_provider", "generic_rest")
            
            # Set default time range if not specified
            if not start_time:
                if interval == "hourly":
                    start_time = (datetime.now() - timedelta(days=7)).isoformat()
                elif interval == "daily":
                    start_time = (datetime.now() - timedelta(days=30)).isoformat()
                else:  # monthly
                    start_time = (datetime.now() - timedelta(days=365)).isoformat()
            
            if not end_time:
                end_time = datetime.now().isoformat()
            
            # In a real implementation, this would connect to the actual energy monitoring system
            # For now, we'll generate mock data
            
            # Create standardized energy monitoring data
            monitoring_data = {
                "building_id": building_id,
                "metric_type": metric_type,
                "interval": interval,
                "time_range": {
                    "start": start_time,
                    "end": end_time
                },
                "provider": provider,
                "data": self._generate_mock_energy_data(
                    metric_type, interval, start_time, end_time
                )
            }
            
            logger.info(f"Successfully fetched {metric_type} data for building {building_id}")
            return monitoring_data
        
        except Exception as e:
            logger.error(f"Error fetching energy monitoring data: {str(e)}")
            return {"error": f"Failed to fetch energy monitoring data: {str(e)}"}
    
    def _generate_mock_energy_data(
        self,
        metric_type: str,
        interval: str,
        start_time: str,
        end_time: str
    ) -> Dict[str, Any]:
        """
        Generate mock energy monitoring data for testing.
        
        Args:
            metric_type: Type of energy metric
            interval: Data granularity
            start_time: Start time in ISO format
            end_time: End time in ISO format
            
        Returns:
            Dict[str, Any]: Mock energy data
        """
        try:
            # Parse start and end times
            start_dt = datetime.fromisoformat(start_time)
            end_dt = datetime.fromisoformat(end_time)
            
            # Calculate number of data points based on interval
            if interval == "hourly":
                delta = timedelta(hours=1)
                data_points = int((end_dt - start_dt).total_seconds() / 3600) + 1
            elif interval == "daily":
                delta = timedelta(days=1)
                data_points = int((end_dt - start_dt).total_seconds() / (3600 * 24)) + 1
            else:  # monthly
                # Approximate months
                delta = timedelta(days=30)
                data_points = int((end_dt - start_dt).total_seconds() / (3600 * 24 * 30)) + 1
            
            # Generate time points
            time_points = [
                (start_dt + delta * i).isoformat()
                for i in range(data_points)
            ]
            
            # Generate values based on metric type and interval
            values = []
            
            # Base values for different metrics
            if metric_type == "electricity":
                base_daily = 1200  # kWh per day for a medium-sized building
                unit = "kWh"
            elif metric_type == "gas":
                base_daily = 500  # m³ per day
                unit = "m³"
            elif metric_type == "water":
                base_daily = 30  # m³ per day
                unit = "m³"
            else:
                base_daily = 100  # generic units
                unit = "units"
            
            # Adjust base value for interval
            if interval == "hourly":
                base_value = base_daily / 24
                # Add hourly pattern
                for i in range(data_points):
                    dt = start_dt + timedelta(hours=i)
                    hour = dt.hour
                    is_workday = dt.weekday() < 5
                    
                    # Higher during work hours on workdays
                    hour_factor = 0.4 + 0.6 * (min(hour, 20) / 10) if hour <= 10 else 0.4 + 0.6 * (20 - hour) / 10
                    day_factor = 1.0 if is_workday else 0.6
                    seasonal_factor = 1.0  # Could add seasonal variations
                    
                    value = base_value * hour_factor * day_factor * seasonal_factor
                    # Add some randomness (±5%)
                    value *= (0.95 + 0.1 * (i % 10) / 10)
                    values.append(round(value, 2))
            
            elif interval == "daily":
                base_value = base_daily
                # Add daily pattern
                for i in range(data_points):
                    dt = start_dt + timedelta(days=i)
                    is_workday = dt.weekday() < 5
                    
                    # Higher on workdays
                    day_factor = 1.0 if is_workday else 0.6
                    seasonal_factor = 1.0  # Could add seasonal variations
                    
                    value = base_value * day_factor * seasonal_factor
                    # Add some randomness (±10%)
                    value *= (0.9 + 0.2 * (i % 10) / 10)
                    values.append(round(value, 2))
            
            else:  # monthly
                base_value = base_daily * 30
                # Add monthly pattern
                for i in range(data_points):
                    dt = start_dt + timedelta(days=i*30)
                    month = dt.month
                    
                    # Seasonal variations
                    if metric_type == "electricity":
                        # Higher in summer (AC) and winter (heating)
                        month_factor = 1.0 + 0.2 * abs(6 - month) / 6
                    elif metric_type == "gas":
                        # Higher in winter months
                        month_factor = 1.0 + 0.5 * (1 - (month - 1) / 6) if month <= 7 else 1.0 + 0.5 * ((month - 7) / 6)
                    else:
                        # Water higher in summer
                        month_factor = 1.0 + 0.3 * (month / 6) if month <= 6 else 1.0 + 0.3 * (12 - month) / 6
                    
                    value = base_value * month_factor
                    # Add some randomness (±5%)
                    value *= (0.95 + 0.1 * (i % 10) / 10)
                    values.append(round(value, 2))
            
            # Create result
            return {
                "unit": unit,
                "timestamps": time_points,
                "values": values
            }
        
        except Exception as e:
            logger.error(f"Error generating mock energy data: {str(e)}")
            return {"error": f"Failed to generate mock energy data: {str(e)}"}
    
    def send_control_command(
        self,
        building_id: str,
        system: str,
        command: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Send control command to building system.
        
        Args:
            building_id: Building identifier
            system: Target system (hvac, lighting, etc.)
            command: Command details
            
        Returns:
            Dict[str, Any]: Command result
        """
        try:
            logger.info(f"Sending {system} control command to building {building_id}")
            logger.debug(f"Command details: {json.dumps(command)}")
            
            # In a real implementation, this would send actual commands to building systems
            # For now, we'll simulate a successful command
            
            # Validate system type
            valid_systems = ["hvac", "lighting", "blinds", "security", "energy"]
            if system not in valid_systems:
                return {
                    "status": "error",
                    "message": f"Invalid system type. Valid types are: {', '.join(valid_systems)}"
                }
            
            # Validate command structure
            if not command or not isinstance(command, dict):
                return {
                    "status": "error",
                    "message": "Invalid command format"
                }
            
            # Mock successful response
            return {
                "status": "success",
                "building_id": building_id,
                "system": system,
                "command": command,
                "timestamp": datetime.now().isoformat(),
                "message": f"Command sent to {system} system successfully"
            }
        
        except Exception as e:
            logger.error(f"Error sending control command: {str(e)}")
            return {
                "status": "error",
                "message": f"Failed to send control command: {str(e)}"
            }
    
    def provide_data_source_guidance(
        self,
        building_id: str,
        data_needs: List[str]
    ) -> Dict[str, Any]:
        """
        Provide guidance on data sources for specific data needs.
        
        This method uses the LLM to suggest appropriate data sources and connection
        methods for specific data requirements.
        
        Args:
            building_id: Building identifier
            data_needs: List of data requirements
            
        Returns:
            Dict[str, Any]: Data source guidance
        """
        try:
            logger.info(f"Providing data source guidance for building {building_id}")
            
            # Convert data needs to string for prompt
            data_needs_str = "\n".join([f"- {need}" for need in data_needs])
            
            prompt = f"""
            Provide guidance on data sources and connection methods for these data requirements:
            
            Building ID: {building_id}
            Data needs:
            {data_needs_str}
            
            For each data need, suggest:
            1. The best type of data source or system to connect with
            2. The typical API or protocol used to access this data
            3. Any preprocessing or transformation typically needed
            4. Potential challenges in accessing this data
            5. Alternative sources if primary source is unavailable
            
            Format your response to be detailed yet concise, focusing on practical
            implementation guidance.
            """
            
            # Get guidance from the LLM
            guidance = self.process_message(prompt)
            
            return {
                "building_id": building_id,
                "data_needs": data_needs,
                "timestamp": datetime.now().isoformat(),
                "guidance": guidance
            }
        
        except Exception as e:
            logger.error(f"Error providing data source guidance: {str(e)}")
            return {"error": f"Failed to provide data source guidance: {str(e)}"}
    
    def detect_connection_issues(
        self,
        connection_logs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze connection logs to detect issues with external systems.
        
        This method uses the LLM to analyze connection logs and identify issues.
        
        Args:
            connection_logs: Logs from connection attempts
            
        Returns:
            Dict[str, Any]: Connection issue analysis
        """
        try:
            logger.info("Analyzing connection logs for issues")
            
            # Convert logs to JSON string for prompt
            logs_json = json.dumps(connection_logs, indent=2)
            
            prompt = f"""
            Analyze these connection logs to identify issues with external systems:
            
            {logs_json}
            
            Please identify:
            1. Any error patterns or recurring issues
            2. Systems or endpoints with reliability problems
            3. Authentication or permission issues
            4. Network or timeout problems
            5. Recommendations for resolving identified issues
            
            Focus on actionable insights that would help improve system reliability.
            """
            
            # Get analysis from the LLM
            analysis = self.process_message(prompt)
            
            return {
                "timestamp": datetime.now().isoformat(),
                "systems_analyzed": list(connection_logs.keys()),
                "analysis": analysis
            }
        
        except Exception as e:
            logger.error(f"Error analyzing connection logs: {str(e)}")
            return {"error": f"Failed to analyze connection logs: {str(e)}"}