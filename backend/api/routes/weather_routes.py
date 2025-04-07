"""
Weather API routes for Energy AI Optimizer.
This module defines endpoints for retrieving weather data.
"""
from fastapi import APIRouter, HTTPException, Path, Query
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging
import random

# Get logger
logger = logging.getLogger("eaio.api.weather")

# Create router
router = APIRouter(prefix="/weather", tags=["weather"])

@router.get("/historical/{location}", response_model=Dict[str, Any])
async def get_historical_weather(
    location: str = Path(..., description="Location identifier or coordinates"),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)")
):
    """Retrieve historical weather data for a location and date range."""
    try:
        # Parse dates
        try:
            start = datetime.fromisoformat(start_date)
            end = datetime.fromisoformat(end_date)
        except ValueError:
            try:
                start = datetime.strptime(start_date, "%Y-%m-%d")
                end = datetime.strptime(end_date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(
                    status_code=400, 
                    detail="Invalid date format. Use ISO format (YYYY-MM-DD)"
                )
        
        # Calculate number of days
        num_days = (end - start).days + 1
        if num_days < 1:
            raise HTTPException(status_code=400, detail="End date must be after start date")
        if num_days > 365:
            raise HTTPException(status_code=400, detail="Date range cannot exceed 365 days")
        
        # Generate mock weather data
        weather_data = []
        current_date = start
        
        # Set random seed for consistent results based on location
        location_seed = sum(ord(c) for c in location)
        random.seed(location_seed + hash(start_date))
        
        # Base values for different locations
        base_temp = 20.0  # Base temperature in Celsius
        base_humidity = 60.0  # Base humidity %
        base_wind_speed = 5.0  # Base wind speed in m/s
        base_precipitation = 0.0  # Base precipitation in mm
        base_solar = 5000.0  # Base solar radiation in Wh/m²
        
        # Modify base values based on location (mock different climate zones)
        if "north" in location.lower():
            base_temp -= 5.0
            base_humidity += 10.0
            base_precipitation += 2.0
            base_solar -= 1000.0
        elif "south" in location.lower():
            base_temp += 5.0
            base_humidity -= 10.0
            base_solar += 1000.0
        elif "desert" in location.lower():
            base_temp += 10.0
            base_humidity -= 30.0
            base_precipitation -= 0.5
            base_solar += 2000.0
        elif "tropical" in location.lower():
            base_temp += 8.0
            base_humidity += 20.0
            base_precipitation += 5.0
        
        for _ in range(num_days):
            # Generate daily weather variations
            day_of_year = current_date.timetuple().tm_yday
            season_factor = abs(math.sin(math.pi * day_of_year / 365))
            
            # Temperature varies by season
            temp_variation = 10.0 * season_factor
            if current_date.month in [12, 1, 2]:  # Winter
                temp = base_temp - temp_variation
            elif current_date.month in [6, 7, 8]:  # Summer
                temp = base_temp + temp_variation
            else:  # Spring/Fall
                temp = base_temp + (temp_variation * 0.5 * (random.random() - 0.5))
                
            # Add daily random variation
            temp += random.uniform(-3.0, 3.0)
            
            # Humidity inverse to temperature in most climates
            humidity = base_humidity + (random.uniform(-10.0, 10.0))
            humidity = max(10.0, min(100.0, humidity))
            
            # Wind speed with some random variation
            wind_speed = base_wind_speed + random.uniform(-2.0, 4.0)
            wind_speed = max(0.0, wind_speed)
            
            # Precipitation (higher chance in high humidity)
            precip_chance = humidity / 100.0
            precipitation = base_precipitation if random.random() < precip_chance else 0.0
            if precipitation > 0:
                precipitation += random.uniform(0.0, 10.0)
            
            # Solar radiation (higher in summer, lower in winter)
            solar_radiation = base_solar * season_factor
            if precipitation > 0:
                solar_radiation *= (0.3 + (random.random() * 0.3))  # Cloudy day
            
            # Add to weather data
            weather_data.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "temperature": {
                    "avg": round(temp, 1),
                    "min": round(temp - random.uniform(2.0, 5.0), 1),
                    "max": round(temp + random.uniform(2.0, 5.0), 1),
                    "unit": "C"
                },
                "humidity": {
                    "avg": round(humidity, 1),
                    "unit": "%"
                },
                "wind_speed": {
                    "avg": round(wind_speed, 1),
                    "unit": "m/s"
                },
                "precipitation": {
                    "value": round(precipitation, 1),
                    "unit": "mm"
                },
                "solar_radiation": {
                    "value": round(solar_radiation, 0),
                    "unit": "Wh/m²"
                }
            })
            
            # Next day
            current_date += timedelta(days=1)
        
        return {
            "location": location,
            "period": {
                "start": start_date,
                "end": end_date
            },
            "data": weather_data
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving historical weather data for {location}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/forecast/{location}", response_model=Dict[str, Any])
async def get_weather_forecast(
    location: str = Path(..., description="Location identifier or coordinates"),
    days: int = Query(7, description="Number of days to forecast (1-14)")
):
    """Retrieve weather forecast for a location."""
    try:
        if days < 1 or days > 14:
            raise HTTPException(status_code=400, detail="Days parameter must be between 1 and 14")
        
        # Generate start and end dates
        start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=days-1)
        
        # Set random seed for consistent results based on location
        location_seed = sum(ord(c) for c in location)
        random.seed(location_seed + int(datetime.now().strftime("%Y%m%d")))
        
        # Base values for different locations
        base_temp = 20.0  # Base temperature in Celsius
        base_humidity = 60.0  # Base humidity %
        base_wind_speed = 5.0  # Base wind speed in m/s
        base_precipitation = 0.0  # Base precipitation in mm
        
        # Modify base values based on location (mock different climate zones)
        if "north" in location.lower():
            base_temp -= 5.0
            base_humidity += 10.0
            base_precipitation += 0.3
        elif "south" in location.lower():
            base_temp += 5.0
            base_humidity -= 10.0
        elif "desert" in location.lower():
            base_temp += 10.0
            base_humidity -= 30.0
            base_precipitation -= 0.1
        elif "tropical" in location.lower():
            base_temp += 8.0
            base_humidity += 20.0
            base_precipitation += 0.5
        
        # Generate forecast data
        forecast_data = []
        current_date = start_date
        
        for _ in range(days):
            # Generate daily weather forecast
            day_of_year = current_date.timetuple().tm_yday
            season_factor = abs(math.sin(math.pi * day_of_year / 365))
            
            # Temperature varies by season
            temp_variation = 10.0 * season_factor
            if current_date.month in [12, 1, 2]:  # Winter
                temp = base_temp - temp_variation
            elif current_date.month in [6, 7, 8]:  # Summer
                temp = base_temp + temp_variation
            else:  # Spring/Fall
                temp = base_temp + (temp_variation * 0.5 * (random.random() - 0.5))
                
            # Add daily random variation
            temp += random.uniform(-3.0, 3.0)
            
            # Humidity inverse to temperature in most climates
            humidity = base_humidity + (random.uniform(-10.0, 10.0))
            humidity = max(10.0, min(100.0, humidity))
            
            # Wind speed with some random variation
            wind_speed = base_wind_speed + random.uniform(-2.0, 4.0)
            wind_speed = max(0.0, wind_speed)
            
            # Precipitation (higher chance in high humidity)
            precip_chance = humidity / 100.0
            precipitation = base_precipitation if random.random() < precip_chance else 0.0
            if precipitation > 0:
                precipitation += random.uniform(0.0, 5.0)
            
            # Weather condition based on precipitation and temperature
            if precipitation > 2.0:
                condition = "Rainy"
            elif precipitation > 0.0:
                condition = "Light Rain"
            elif humidity > 80:
                condition = "Cloudy"
            elif humidity > 60:
                condition = "Partly Cloudy"
            else:
                condition = "Sunny"
            
            # Add to forecast data
            forecast_data.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "temperature": {
                    "avg": round(temp, 1),
                    "min": round(temp - random.uniform(2.0, 5.0), 1),
                    "max": round(temp + random.uniform(2.0, 5.0), 1),
                    "unit": "C"
                },
                "humidity": {
                    "avg": round(humidity, 1),
                    "unit": "%"
                },
                "wind_speed": {
                    "avg": round(wind_speed, 1),
                    "unit": "m/s"
                },
                "precipitation": {
                    "value": round(precipitation, 1),
                    "unit": "mm"
                },
                "condition": condition,
                "forecast_confidence": round(max(0.5, min(0.95, 0.95 - (_ * 0.05))), 2)  # Decreases with days ahead
            })
            
            # Next day
            current_date += timedelta(days=1)
        
        return {
            "location": location,
            "period": {
                "start": start_date.strftime("%Y-%m-%d"),
                "end": end_date.strftime("%Y-%m-%d")
            },
            "data": forecast_data,
            "source": "Weather Mock Service",
            "last_updated": datetime.now().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving weather forecast for {location}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/current/{location}", response_model=Dict[str, Any])
async def get_current_weather(
    location: str = Path(..., description="Location identifier or coordinates")
):
    """Retrieve current weather data for a location."""
    try:
        # Set random seed for consistent results based on location and current day
        location_seed = sum(ord(c) for c in location)
        today = datetime.now().strftime("%Y%m%d")
        current_hour = datetime.now().hour
        random.seed(location_seed + int(today) + current_hour)
        
        # Base values for different locations
        base_temp = 20.0  # Base temperature in Celsius
        base_humidity = 60.0  # Base humidity %
        base_wind_speed = 5.0  # Base wind speed in m/s
        base_precipitation = 0.0  # Base precipitation in mm
        
        # Modify base values based on location (mock different climate zones)
        if "north" in location.lower():
            base_temp -= 5.0
            base_humidity += 10.0
        elif "south" in location.lower():
            base_temp += 5.0
            base_humidity -= 10.0
        elif "desert" in location.lower():
            base_temp += 10.0
            base_humidity -= 30.0
        elif "tropical" in location.lower():
            base_temp += 8.0
            base_humidity += 20.0
            base_precipitation += 0.5
        
        # Generate current weather
        now = datetime.now()
        day_of_year = now.timetuple().tm_yday
        hour_of_day = now.hour
        
        # Season factor
        season_factor = abs(math.sin(math.pi * day_of_year / 365))
        
        # Hour factor (temperature peaks in afternoon)
        hour_factor = abs(math.sin(math.pi * (hour_of_day - 4) / 24))
        
        # Temperature varies by season and time of day
        temp_variation_season = 10.0 * season_factor
        temp_variation_hour = 5.0 * hour_factor
        
        if now.month in [12, 1, 2]:  # Winter
            temp = base_temp - temp_variation_season + temp_variation_hour
        elif now.month in [6, 7, 8]:  # Summer
            temp = base_temp + temp_variation_season + temp_variation_hour
        else:  # Spring/Fall
            temp = base_temp + (temp_variation_season * 0.5) + temp_variation_hour
        
        # Add random variation
        temp += random.uniform(-2.0, 2.0)
        
        # Humidity inverse to temperature
        humidity = base_humidity - (temp_variation_hour * 3) + random.uniform(-10.0, 10.0)
        humidity = max(10.0, min(100.0, humidity))
        
        # Wind speed with some random variation
        wind_speed = base_wind_speed + random.uniform(-2.0, 4.0)
        wind_speed = max(0.0, wind_speed)
        wind_direction = random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"])
        
        # Precipitation (higher chance in high humidity)
        precip_chance = humidity / 100.0
        precipitation = base_precipitation if random.random() < precip_chance else 0.0
        if precipitation > 0:
            precipitation += random.uniform(0.0, 2.0)
        
        # Weather condition
        if precipitation > 2.0:
            condition = "Rainy"
        elif precipitation > 0.0:
            condition = "Light Rain"
        elif humidity > 80:
            condition = "Cloudy"
        elif humidity > 60:
            condition = "Partly Cloudy"
        else:
            condition = "Sunny"
        
        # Build response
        return {
            "location": location,
            "timestamp": now.isoformat(),
            "temperature": {
                "value": round(temp, 1),
                "feels_like": round(temp * (1 + 0.1 * humidity/100) - (0.1 * wind_speed), 1),
                "unit": "C"
            },
            "humidity": {
                "value": round(humidity, 1),
                "unit": "%"
            },
            "wind": {
                "speed": round(wind_speed, 1),
                "direction": wind_direction,
                "unit": "m/s"
            },
            "precipitation": {
                "value": round(precipitation, 1),
                "unit": "mm"
            },
            "condition": condition,
            "pressure": {
                "value": round(1013.25 + random.uniform(-10.0, 10.0), 2),
                "unit": "hPa"
            },
            "visibility": {
                "value": round((100 - humidity/2) * (10/100), 1),
                "unit": "km"
            },
            "source": "Weather Mock Service",
            "last_updated": now.isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error retrieving current weather for {location}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Import missing math module at the beginning
import math 