"""
Data analysis API routes for Energy AI Optimizer.
"""
from fastapi import APIRouter, HTTPException, Path, Query, Body
from typing import Dict, List, Optional, Any
from datetime import datetime
from pydantic import BaseModel
import logging
import os
import pandas as pd

# Import the Data Analysis Agent
from agents.data_analysis.data_analysis_agent import DataAnalysisAgent
from data.building.building_processor import BuildingDataProcessor

# Get logger
logger = logging.getLogger("eaio.api.routes.analysis")

# Initialize agents and processors
data_analysis_agent = DataAnalysisAgent()
building_processor = BuildingDataProcessor()

# Pydantic models
class AnalysisRequest(BaseModel):
    building_id: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    metric: Optional[str] = "electricity"
    analysis_type: Optional[str] = "consumption_patterns"

class AnalysisResponse(BaseModel):
    building_id: str
    analysis_type: str
    timestamp: str
    results: Dict[str, Any]

# Create router
router = APIRouter(prefix="/analysis", tags=["analysis"])

def get_building_data(building_id: str, metric: str, start_date: Optional[str], end_date: Optional[str]) -> pd.DataFrame:
    """Helper function to get building data for analysis."""
    try:
        # Load meter data for the specified metric
        meter_file = f"/app/data/meters/cleaned/{metric}_cleaned.csv"
        if not os.path.exists(meter_file):
            logger.warning(f"Meter data file not found: {meter_file}")
            return pd.DataFrame()
        
        # Load data
        df = pd.read_csv(meter_file, parse_dates=["timestamp"])
        
        # Check if building_id exists in the columns
        if building_id not in df.columns:
            logger.warning(f"Building ID {building_id} not found in {metric} data")
            return pd.DataFrame()
        
        # Create a dataframe with timestamp and building data
        result_df = df[["timestamp", building_id]].copy()
        result_df.rename(columns={building_id: "consumption"}, inplace=True)
        
        # Filter by date range if provided
        if start_date:
            start_dt = pd.to_datetime(start_date)
            result_df = result_df[result_df["timestamp"] >= start_dt]
        
        if end_date:
            end_dt = pd.to_datetime(end_date)
            result_df = result_df[result_df["timestamp"] <= end_dt]
        
        return result_df
    except Exception as e:
        logger.error(f"Error loading building data: {str(e)}")
        return pd.DataFrame()

@router.post("/", response_model=AnalysisResponse)
async def analyze_building_data(request: AnalysisRequest):
    """Perform analysis on building energy data."""
    try:
        # Load building data
        df = get_building_data(
            building_id=request.building_id,
            metric=request.metric,
            start_date=request.start_date,
            end_date=request.end_date
        )
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for building {request.building_id} with metric {request.metric}")
        
        # Perform analysis based on analysis_type
        analysis_results = {}
        
        if request.analysis_type == "consumption_patterns":
            analysis_results = data_analysis_agent.analyze_consumption_patterns(
                building_id=request.building_id,
                df=df,
                start_date=request.start_date,
                end_date=request.end_date,
                energy_type=request.metric
            )
        elif request.analysis_type == "anomalies":
            analysis_results = data_analysis_agent.detect_anomalies(
                building_id=request.building_id,
                df=df,
                start_date=request.start_date,
                end_date=request.end_date,
                energy_type=request.metric
            )
        elif request.analysis_type == "weather_correlation":
            # For weather correlation, we would need weather data as well
            # For now, we'll use a simplified version without actual weather data
            analysis_results = data_analysis_agent.correlate_with_weather(
                building_id=request.building_id,
                df=df,
                start_date=request.start_date,
                end_date=request.end_date,
                energy_type=request.metric
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported analysis type: {request.analysis_type}")
        
        return {
            "building_id": request.building_id,
            "analysis_type": request.analysis_type,
            "timestamp": datetime.now().isoformat(),
            "results": analysis_results
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error performing analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/anomalies/{building_id}", response_model=Dict[str, Any])
async def get_anomalies(
    building_id: str = Path(..., description="Building identifier"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    metric: str = Query("electricity", description="Energy metric to analyze")
):
    """Get anomalies in building energy consumption."""
    try:
        # Load building data
        df = get_building_data(
            building_id=building_id,
            metric=metric,
            start_date=start_date,
            end_date=end_date
        )
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for building {building_id} with metric {metric}")
        
        # Detect anomalies using the DataAnalysisAgent
        anomalies = data_analysis_agent.detect_anomalies(
            building_id=building_id,
            df=df,
            start_date=start_date,
            end_date=end_date,
            energy_type=metric,
            sensitivity="medium"
        )
        
        return {
            "building_id": building_id,
            "metric": metric,
            "period": {
                "start": start_date or df["timestamp"].min().isoformat(),
                "end": end_date or df["timestamp"].max().isoformat()
            },
            "anomalies": anomalies
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error retrieving anomalies: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/patterns/{building_id}", response_model=Dict[str, Any])
async def get_consumption_patterns(
    building_id: str = Path(..., description="Building identifier"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    metric: str = Query("electricity", description="Energy metric to analyze")
):
    """Get consumption patterns for a building."""
    try:
        # Load building data
        df = get_building_data(
            building_id=building_id,
            metric=metric,
            start_date=start_date,
            end_date=end_date
        )
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for building {building_id} with metric {metric}")
        
        # Analyze consumption patterns using the DataAnalysisAgent
        patterns = data_analysis_agent.analyze_consumption_patterns(
            building_id=building_id,
            df=df,
            start_date=start_date,
            end_date=end_date,
            energy_type=metric
        )
        
        return {
            "building_id": building_id,
            "metric": metric,
            "period": {
                "start": start_date or df["timestamp"].min().isoformat(),
                "end": end_date or df["timestamp"].max().isoformat()
            },
            "patterns": patterns
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error retrieving consumption patterns: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/weather-correlation/{building_id}", response_model=Dict[str, Any])
async def get_weather_correlation(
    building_id: str = Path(..., description="Building identifier"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    metric: str = Query("electricity", description="Energy metric to analyze")
):
    """Get correlation between weather and energy consumption."""
    try:
        # Load building data
        df = get_building_data(
            building_id=building_id,
            metric=metric,
            start_date=start_date,
            end_date=end_date
        )
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for building {building_id} with metric {metric}")
        
        # Correlate with weather using the DataAnalysisAgent
        # Note: For a proper implementation, we would need to load actual weather data
        correlations = data_analysis_agent.correlate_with_weather(
            building_id=building_id,
            df=df,
            start_date=start_date,
            end_date=end_date,
            energy_type=metric
        )
        
        return {
            "building_id": building_id,
            "metric": metric,
            "period": {
                "start": start_date or df["timestamp"].min().isoformat(),
                "end": end_date or df["timestamp"].max().isoformat()
            },
            "correlations": correlations
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error retrieving weather correlation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}") 