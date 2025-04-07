"""
Recommendation API routes for Energy AI Optimizer.
This module defines endpoints for retrieving energy optimization recommendations.
"""
from fastapi import APIRouter, HTTPException, Path, Query, Body
from typing import Dict, List, Optional, Any
from datetime import datetime
from pydantic import BaseModel
import logging
import uuid
import pandas as pd
import os

# Import the Recommendation Agent
from agents.recommendation.recommendation_agent import RecommendationAgent
from data.building.building_processor import BuildingDataProcessor

# Get logger
logger = logging.getLogger("eaio.api.routes.recommendation")

# Initialize agents and processors
recommendation_agent = RecommendationAgent()
building_processor = BuildingDataProcessor()

# Create router
router = APIRouter(prefix="/recommendations", tags=["recommendations"])

# Pydantic models
class RecommendationBase(BaseModel):
    building_id: str
    type: str
    title: str
    description: str
    potential_savings: float
    implementation_cost: str
    payback_period: str
    priority: str

class RecommendationResponse(RecommendationBase):
    id: str
    created_at: str
    updated_at: Optional[str] = None

class GenerateRecommendationsRequest(BaseModel):
    building_id: str
    energy_type: Optional[str] = "electricity"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    analysis_data: Optional[Dict[str, Any]] = None

# Helper function to get building data
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
        result_df["building_id"] = building_id
        
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

# Sample database of recommendations (In a real system, this would be a database)
recommendations_db = {}

@router.get("/", response_model=Dict[str, Any])
async def get_recommendations(
    building_id: Optional[str] = Query(None, description="Filter by building ID"),
    rec_type: Optional[str] = Query(None, description="Filter by recommendation type")
):
    """Get list of energy optimization recommendations."""
    try:
        # Get recommendations from database (mock for now)
        recommendations = list(recommendations_db.values())
        
        # If database is empty, create some initial recommendations
        if not recommendations:
            # Generate some sample recommendations
            for i in range(1, 4):
                rec_id = f"rec-{str(uuid.uuid4())[:8]}"
                recommendations_db[rec_id] = {
                    "id": rec_id,
                    "building_id": str(i),
                    "type": ["hvac", "lighting", "envelope"][i-1],
                    "title": ["Optimize HVAC Schedule", "LED Lighting Upgrade", "Improve Building Insulation"][i-1],
                    "description": [
                        "Adjust HVAC operating hours to match actual building occupancy patterns",
                        "Replace existing fluorescent lighting with LED fixtures",
                        "Add insulation to reduce thermal losses through the building envelope"
                    ][i-1],
                    "potential_savings": [1520.50, 3200.75, 5100.25][i-1],
                    "implementation_cost": ["Low", "Medium", "High"][i-1],
                    "payback_period": ["< 6 months", "1-2 years", "3-5 years"][i-1],
                    "priority": ["High", "Medium", "Low"][i-1],
                    "created_at": datetime.now().isoformat(),
                    "updated_at": None
                }
            
            recommendations = list(recommendations_db.values())
        
        # Apply filters
        if building_id:
            recommendations = [r for r in recommendations if r["building_id"] == building_id]
        if rec_type:
            recommendations = [r for r in recommendations if r["type"] == rec_type]
        
        return {"items": recommendations, "total": len(recommendations)}
    
    except Exception as e:
        logger.error(f"Error retrieving recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{recommendation_id}", response_model=RecommendationResponse)
async def get_recommendation(
    recommendation_id: str = Path(..., description="Recommendation identifier")
):
    """Get details of a specific recommendation."""
    try:
        if recommendation_id not in recommendations_db:
            raise HTTPException(status_code=404, detail=f"Recommendation not found: {recommendation_id}")
        
        return recommendations_db[recommendation_id]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving recommendation {recommendation_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/building/{building_id}", response_model=Dict[str, Any])
async def get_building_recommendations(
    building_id: str = Path(..., description="Building identifier"),
    rec_type: Optional[str] = Query(None, description="Filter by recommendation type")
):
    """Get recommendations for a specific building."""
    try:
        # Get recommendations from database
        recommendations = [r for r in recommendations_db.values() if r["building_id"] == building_id]
        
        # If no recommendations exist for this building, generate some
        if not recommendations:
            # Try to get building data for analysis
            df = get_building_data(
                building_id=building_id,
                metric="electricity",
                start_date=None,
                end_date=None
            )
            
            # Generate recommendations using the agent
            if not df.empty:
                try:
                    agent_recommendations = recommendation_agent.generate_recommendations(
                        building_id=building_id,
                        df=df,
                        energy_type="electricity"
                    )
                    
                    # Add recommendations to database
                    for rec in agent_recommendations:
                        rec_id = f"rec-{str(uuid.uuid4())[:8]}"
                        recommendations_db[rec_id] = {
                            "id": rec_id,
                            "building_id": building_id,
                            "type": rec.get("type", "general"),
                            "title": rec.get("title", "Energy Optimization Recommendation"),
                            "description": rec.get("description", ""),
                            "potential_savings": rec.get("potential_savings", 0.0),
                            "implementation_cost": rec.get("implementation_cost", "Medium"),
                            "payback_period": rec.get("payback_period", "Unknown"),
                            "priority": rec.get("priority", "Medium"),
                            "created_at": datetime.now().isoformat(),
                            "updated_at": None
                        }
                    
                    # Get updated recommendations
                    recommendations = [r for r in recommendations_db.values() if r["building_id"] == building_id]
                except Exception as agent_error:
                    logger.error(f"Error generating recommendations with agent: {str(agent_error)}")
                    # Generate fallback recommendations
                    for i, rec_type in enumerate(["hvac", "lighting", "controls"]):
                        rec_id = f"rec-{str(uuid.uuid4())[:8]}"
                        recommendations_db[rec_id] = {
                            "id": rec_id,
                            "building_id": building_id,
                            "type": rec_type,
                            "title": f"Optimize {rec_type.capitalize()} Systems",
                            "description": f"Improve energy efficiency of {rec_type} systems based on building analysis",
                            "potential_savings": 1000.0 * (i + 1),
                            "implementation_cost": ["Low", "Medium", "High"][i % 3],
                            "payback_period": ["< 1 year", "1-3 years", "3-5 years"][i % 3],
                            "priority": ["High", "Medium", "Low"][i % 3],
                            "created_at": datetime.now().isoformat(),
                            "updated_at": None
                        }
                    
                    # Get updated recommendations
                    recommendations = [r for r in recommendations_db.values() if r["building_id"] == building_id]
            else:
                # Generate fallback recommendations if no data
                for i, rec_type in enumerate(["hvac", "lighting", "envelope"]):
                    rec_id = f"rec-{str(uuid.uuid4())[:8]}"
                    recommendations_db[rec_id] = {
                        "id": rec_id,
                        "building_id": building_id,
                        "type": rec_type,
                        "title": f"Optimize {rec_type.capitalize()} Systems",
                        "description": f"Improve energy efficiency of {rec_type} systems",
                        "potential_savings": 1000.0 * (i + 1),
                        "implementation_cost": ["Low", "Medium", "High"][i % 3],
                        "payback_period": ["< 1 year", "1-3 years", "3-5 years"][i % 3],
                        "priority": ["High", "Medium", "Low"][i % 3],
                        "created_at": datetime.now().isoformat(),
                        "updated_at": None
                    }
                
                # Get updated recommendations
                recommendations = [r for r in recommendations_db.values() if r["building_id"] == building_id]
        
        # Apply type filter
        if rec_type:
            recommendations = [r for r in recommendations if r["type"] == rec_type]
        
        return {
            "building_id": building_id,
            "items": recommendations,
            "total": len(recommendations),
            "total_savings": sum(r["potential_savings"] for r in recommendations)
        }
    
    except Exception as e:
        logger.error(f"Error retrieving recommendations for building {building_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/generate", response_model=Dict[str, Any])
async def generate_recommendations(
    request: GenerateRecommendationsRequest
):
    """Generate new recommendations based on building data."""
    try:
        building_id = request.building_id
        
        # Get building data for analysis
        df = get_building_data(
            building_id=building_id,
            metric=request.energy_type,
            start_date=request.start_date,
            end_date=request.end_date
        )
        
        if df.empty:
            logger.warning(f"No data found for building {building_id}. Generating generic recommendations.")
            # Generate fallback recommendations
            new_recommendations = []
            for i, rec_type in enumerate(["hvac", "lighting", "controls"]):
                rec_id = f"rec-{str(uuid.uuid4())[:8]}"
                new_rec = {
                    "id": rec_id,
                    "building_id": building_id,
                    "type": rec_type,
                    "title": f"Optimize {rec_type.capitalize()} Systems",
                    "description": f"Improve energy efficiency of {rec_type} systems based on building analysis",
                    "potential_savings": 1000.0 * (i + 1),
                    "implementation_cost": ["Low", "Medium", "High"][i % 3],
                    "payback_period": ["< 1 year", "1-3 years", "3-5 years"][i % 3],
                    "priority": ["High", "Medium", "Low"][i % 3],
                    "created_at": datetime.now().isoformat(),
                    "updated_at": None
                }
                recommendations_db[rec_id] = new_rec
                new_recommendations.append(new_rec)
        else:
            # Generate recommendations using the RecommendationAgent
            try:
                agent_recommendations = recommendation_agent.generate_recommendations(
                    building_id=building_id,
                    df=df,
                    energy_type=request.energy_type,
                    analysis_data=request.analysis_data
                )
                
                # Add recommendations to database
                new_recommendations = []
                for rec in agent_recommendations:
                    rec_id = f"rec-{str(uuid.uuid4())[:8]}"
                    new_rec = {
                        "id": rec_id,
                        "building_id": building_id,
                        "type": rec.get("type", "general"),
                        "title": rec.get("title", "Energy Optimization Recommendation"),
                        "description": rec.get("description", ""),
                        "potential_savings": rec.get("potential_savings", 0.0),
                        "implementation_cost": rec.get("implementation_cost", "Medium"),
                        "payback_period": rec.get("payback_period", "Unknown"),
                        "priority": rec.get("priority", "Medium"),
                        "created_at": datetime.now().isoformat(),
                        "updated_at": None
                    }
                    recommendations_db[rec_id] = new_rec
                    new_recommendations.append(new_rec)
            except Exception as agent_error:
                logger.error(f"Error generating recommendations with agent: {str(agent_error)}")
                # Generate fallback recommendations
                new_recommendations = []
                for i, rec_type in enumerate(["hvac", "lighting", "controls"]):
                    rec_id = f"rec-{str(uuid.uuid4())[:8]}"
                    new_rec = {
                        "id": rec_id,
                        "building_id": building_id,
                        "type": rec_type,
                        "title": f"Optimize {rec_type.capitalize()} Systems",
                        "description": f"Improve energy efficiency of {rec_type} systems based on building analysis",
                        "potential_savings": 1000.0 * (i + 1),
                        "implementation_cost": ["Low", "Medium", "High"][i % 3],
                        "payback_period": ["< 1 year", "1-3 years", "3-5 years"][i % 3],
                        "priority": ["High", "Medium", "Low"][i % 3],
                        "created_at": datetime.now().isoformat(),
                        "updated_at": None
                    }
                    recommendations_db[rec_id] = new_rec
                    new_recommendations.append(new_rec)
        
        return {
            "building_id": building_id,
            "items": new_recommendations,
            "total": len(new_recommendations)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}") 