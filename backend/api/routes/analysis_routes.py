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
from agents.commander.commander_agent import CommanderAgent
from data.building.building_processor import BuildingDataProcessor

# Import database client
from db.database import Database

# Get logger
logger = logging.getLogger("eaio.api.routes.analysis")

# Initialize agents, processors and DB connection
data_analysis_agent = DataAnalysisAgent()
building_processor = BuildingDataProcessor()
commander_agent = CommanderAgent()  # Initialize Commander Agent
db = Database()  # Initialize database connection

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

class ForecastRequest(BaseModel):
    building_id: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    metric: Optional[str] = "electricity"
    target_column: Optional[str] = None
    input_window: int = 24*7  # One week of hourly data by default
    forecast_horizon: int = 24  # 24 hours by default
    use_deep_learning: bool = True
    
class AnomalyDetectionRequest(BaseModel):
    building_id: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    metric: Optional[str] = "electricity"
    target_column: Optional[str] = None
    seq_length: int = 24  # 24 hours sequence length by default
    anomaly_threshold: float = 0.95  # 95th percentile by default

# Create router
router = APIRouter(prefix="/analysis", tags=["analysis"])

def get_building_data(building_id: str, metric: str, start_date: Optional[str], end_date: Optional[str]) -> pd.DataFrame:
    """Helper function to get building data for analysis from PostgreSQL database."""
    try:
        logger.info(f"Fetching {metric} data for building {building_id} from database")
        
        # Get consumption data from PostgreSQL
        consumption_data = db.get_building_consumption(
            building_id=building_id,
            meter_type=metric,
            start_date=start_date,
            end_date=end_date
        )
        
        if not consumption_data:
            # Try fallback to CSV files if no data in database
            logger.warning(f"No {metric} data found in database for building {building_id}, trying CSV files")
            return get_building_data_from_csv(building_id, metric, start_date, end_date)
        
        # Convert to DataFrame
        df = pd.DataFrame(consumption_data)
        
        # Rename consumption column if needed
        if 'value' in df.columns:
            df.rename(columns={'value': 'consumption'}, inplace=True)
        elif metric in df.columns:
            df.rename(columns={metric: 'consumption'}, inplace=True)
        
        # Ensure timestamp is datetime
        if 'timestamp' in df.columns and not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        logger.info(f"Successfully retrieved {len(df)} rows of {metric} data for building {building_id} from database")
        return df
    
    except Exception as e:
        logger.error(f"Error fetching data from PostgreSQL: {str(e)}")
        # Try fallback to CSV files
        logger.warning(f"Falling back to CSV files due to database error")
        return get_building_data_from_csv(building_id, metric, start_date, end_date)

def get_building_data_from_csv(building_id: str, metric: str, start_date: Optional[str], end_date: Optional[str]) -> pd.DataFrame:
    """Fallback function to get building data from CSV files."""
    try:
        # Get the absolute path to the project root
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        # Construct path to meter data file
        meter_file = os.path.join(project_root, "data", "meters", "cleaned", f"{metric}_cleaned.csv")
        
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
        logger.error(f"Error loading building data from CSV: {str(e)}")
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

@router.get("/comprehensive/{building_id}", response_model=Dict[str, Any])
async def get_comprehensive_analysis(
    building_id: str = Path(..., description="Building identifier"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    user_role: str = Query("facility_manager", description="User role (facility_manager, energy_analyst, executive)")
):
    """
    Perform comprehensive energy analysis on a building using multiple agents.
    
    This endpoint coordinates the following analyses:
    1. Historical consumption analysis
    2. Anomaly detection
    3. Consumption forecasting
    4. Optimization recommendations
    """
    try:
        logger.info(f"Starting comprehensive analysis for building {building_id}")
        
        # Load building data
        building_data = get_building_data(
            building_id=building_id,
            metric="electricity",  # Start with electricity, will get other metrics too
            start_date=start_date,
            end_date=end_date
        )
        
        if building_data.empty:
            raise HTTPException(status_code=404, detail=f"No data found for building {building_id}")
        
        # Get additional metrics if available
        additional_metrics = ["water", "gas", "steam", "hotwater", "chilledwater"]
        all_metrics = {"electricity": building_data}
        
        for metric in additional_metrics:
            metric_data = get_building_data(
                building_id=building_id,
                metric=metric,
                start_date=start_date,
                end_date=end_date
            )
            
            if not metric_data.empty:
                all_metrics[metric] = metric_data
        
        # Prepare input data for Commander Agent
        input_data = {
            'historical_data': {
                'building_id': building_id,
                'metrics': all_metrics,
                'start_date': start_date or building_data["timestamp"].min().isoformat(),
                'end_date': end_date or building_data["timestamp"].max().isoformat()
            }
        }
        
        # Get weather data if available
        try:
            weather_data = {}  # Placeholder for actual weather data
            input_data['weather_data'] = weather_data
        except Exception as e:
            logger.warning(f"Could not retrieve weather data: {str(e)}")
        
        # Initialize agents in Commander Agent if not already initialized
        if not commander_agent.data_analysis_agent:
            commander_agent.initialize_agents()
        
        # Run comprehensive analysis workflow
        analysis_results = commander_agent._run_comprehensive_analysis_workflow(
            input_data=input_data,
            user_role=user_role,
            building_id=building_id
        )
        
        # Store the results in memory for future reference
        try:
            commander_agent.store_in_memory(
                memory_type="analysis",
                data=analysis_results,
                metadata={
                    'building_id': building_id,
                    'analysis_type': 'comprehensive',
                    'user_role': user_role,
                    'timestamp': datetime.now().isoformat()
                }
            )
        except Exception as e:
            logger.warning(f"Could not store analysis in memory: {str(e)}")
        
        # Return the comprehensive results
        return {
            "building_id": building_id,
            "analysis_type": "comprehensive",
            "timestamp": datetime.now().isoformat(),
            "period": {
                "start": start_date or building_data["timestamp"].min().isoformat(),
                "end": end_date or building_data["timestamp"].max().isoformat()
            },
            "results": analysis_results
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error performing comprehensive analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/forecast", response_model=Dict[str, Any])
async def forecast_consumption(request: ForecastRequest):
    """
    Forecast future energy consumption using deep learning models.
    """
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
        
        # Use the DataAnalysisAgent to forecast consumption
        forecast_results = data_analysis_agent.predict_consumption(
            building_id=request.building_id,
            df=df,
            target_col=request.target_column,
            start_date=request.start_date,
            end_date=request.end_date,
            input_window=request.input_window,
            forecast_horizon=request.forecast_horizon,
            use_deep_learning=request.use_deep_learning
        )
        
        return {
            "building_id": request.building_id,
            "metric": request.metric,
            "period": {
                "start": df["timestamp"].min().isoformat(),
                "end": df["timestamp"].max().isoformat()
            },
            "forecast_horizon": request.forecast_horizon,
            "forecast_method": "deep_learning" if request.use_deep_learning else "statistical",
            "results": forecast_results
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error forecasting consumption: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/anomalies-dl", response_model=Dict[str, Any])
async def detect_anomalies_dl(request: AnomalyDetectionRequest):
    """
    Detect anomalies using deep learning models.
    """
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
        
        # Use the DataAnalysisAgent to detect anomalies with deep learning
        anomaly_results = data_analysis_agent.detect_anomalies_dl(
            building_id=request.building_id,
            df=df,
            target_col=request.target_column,
            start_date=request.start_date,
            end_date=request.end_date,
            seq_length=request.seq_length,
            anomaly_threshold=request.anomaly_threshold
        )
        
        return {
            "building_id": request.building_id,
            "metric": request.metric,
            "period": {
                "start": df["timestamp"].min().isoformat(),
                "end": df["timestamp"].max().isoformat()
            },
            "detection_method": "deep_learning",
            "results": anomaly_results
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error detecting anomalies with deep learning: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}") 