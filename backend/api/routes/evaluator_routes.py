"""
Evaluator API routes for Energy AI Optimizer.
This module defines endpoints for evaluation of energy optimization results.
"""
from fastapi import APIRouter, HTTPException, Path, Query, Body
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging
import random

# Get logger
logger = logging.getLogger("eaio.api.evaluator")

# Create router
router = APIRouter(prefix="/evaluator", tags=["evaluator"])

@router.post("/evaluate-recommendation", response_model=Dict[str, Any])
async def evaluate_recommendation(
    request: Dict[str, Any] = Body(...)
):
    """Evaluate the results of an implemented recommendation."""
    try:
        # Validate request
        required_fields = ["recommendation_id", "building_id"]
        for field in required_fields:
            if field not in request:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Generate mock evaluation results
        baseline_period = {
            "start": "2023-01-01",
            "end": "2023-02-28"
        }
        
        implementation_date = "2023-03-01"
        
        assessment_period = {
            "start": "2023-03-01",
            "end": "2023-04-30"
        }
        
        # Mock consumption reduction percentage
        reduction_percent = round(random.uniform(10.0, 25.0), 1)
        
        # Calculate savings
        daily_savings = round(random.uniform(35.0, 65.0), 2)
        total_days = 61  # March + April
        total_savings = round(daily_savings * total_days, 2)
        
        # Calculate ROI
        implementation_cost = round(random.uniform(1000.0, 3000.0), 2)
        roi = round((total_savings / implementation_cost) * 100, 1)
        
        return {
            "recommendation_id": request["recommendation_id"],
            "building_id": request["building_id"],
            "evaluation_timestamp": datetime.now().isoformat(),
            "baseline_period": baseline_period,
            "implementation_date": implementation_date,
            "assessment_period": assessment_period,
            "results": {
                "energy_impact": {
                    "consumption_reduction_percent": reduction_percent,
                    "daily_average_savings_kwh": daily_savings,
                    "total_savings_kwh": total_savings
                },
                "financial_impact": {
                    "implementation_cost": implementation_cost,
                    "total_cost_savings": round(total_savings * 0.15, 2),  # Assume $0.15 per kWh
                    "roi_percent": roi,
                    "payback_period_months": round(implementation_cost / (total_savings * 0.15 / 2), 1)  # Divide by 2 months
                },
                "environmental_impact": {
                    "co2_reduction_kg": round(total_savings * 0.4, 1)  # Assume 0.4 kg CO2 per kWh
                }
            },
            "confidence_level": "high",
            "factors_considered": [
                "Weather normalization",
                "Occupancy patterns",
                "Operational changes"
            ]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error evaluating recommendation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/recommendation/{recommendation_id}/impact", response_model=Dict[str, Any])
async def get_recommendation_impact(
    recommendation_id: str = Path(..., description="Recommendation identifier"),
    building_id: str = Query(..., description="Building identifier")
):
    """Get the impact of an implemented recommendation."""
    try:
        # Mock recommendation impact data
        impact_data = {
            "recommendation_id": recommendation_id,
            "building_id": building_id,
            "name": "HVAC Schedule Optimization",
            "implementation_date": "2023-03-01",
            "last_evaluated": "2023-05-01T10:15:30Z",
            "impact_metrics": {
                "energy_savings": {
                    "value": 12500.0,
                    "unit": "kWh",
                    "percent": 18.5
                },
                "cost_savings": {
                    "value": 1875.0,
                    "unit": "USD",
                    "percent": 18.5
                },
                "emissions_reduction": {
                    "value": 5000.0,
                    "unit": "kg CO2e",
                    "percent": 18.5
                }
            },
            "performance_vs_expected": {
                "energy_savings": 105.2,  # percent of expected
                "cost_savings": 105.2,
                "payback_period": 95.0    # percent of expected (faster payback)
            },
            "ongoing_monitoring": {
                "status": "performing",
                "alerts": []
            }
        }
        
        return impact_data
    
    except Exception as e:
        logger.error(f"Error getting recommendation impact for {recommendation_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/building/{building_id}/recommendations/impact", response_model=Dict[str, Any])
async def get_building_recommendations_impact(
    building_id: str = Path(..., description="Building identifier"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Get the cumulative impact of all recommendations for a building."""
    try:
        # Set default dates if not provided
        if not start_date:
            start_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
        if not end_date:
            end_date = datetime.now().strftime("%Y-%m-%d")
        
        # Mock recommendations impact data
        recommendations = [
            {
                "id": "rec-001",
                "name": "HVAC Schedule Optimization",
                "implementation_date": "2023-03-01",
                "energy_savings_kwh": 12500.0,
                "cost_savings_usd": 1875.0,
                "emissions_reduction_kgco2e": 5000.0
            },
            {
                "id": "rec-002",
                "name": "LED Lighting Upgrade",
                "implementation_date": "2023-04-15",
                "energy_savings_kwh": 8750.0,
                "cost_savings_usd": 1312.5,
                "emissions_reduction_kgco2e": 3500.0
            },
            {
                "id": "rec-003",
                "name": "Smart Thermostats Installation",
                "implementation_date": "2023-05-20",
                "energy_savings_kwh": 5200.0,
                "cost_savings_usd": 780.0,
                "emissions_reduction_kgco2e": 2080.0
            }
        ]
        
        # Calculate totals
        total_energy_savings = sum(r["energy_savings_kwh"] for r in recommendations)
        total_cost_savings = sum(r["cost_savings_usd"] for r in recommendations)
        total_emissions_reduction = sum(r["emissions_reduction_kgco2e"] for r in recommendations)
        
        return {
            "building_id": building_id,
            "period": {
                "start": start_date,
                "end": end_date
            },
            "recommendations": recommendations,
            "totals": {
                "energy_savings_kwh": total_energy_savings,
                "cost_savings_usd": total_cost_savings,
                "emissions_reduction_kgco2e": total_emissions_reduction,
                "roi_percent": round((total_cost_savings / 7500.0) * 100, 1)  # Assume $7,500 total implementation cost
            },
            "overall_performance": {
                "vs_expected": 103.5,  # percentage of expected results
                "vs_baseline": 22.4    # percentage reduction from baseline
            }
        }
    
    except Exception as e:
        logger.error(f"Error getting recommendations impact for building {building_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/forecast/accuracy", response_model=Dict[str, Any])
async def evaluate_forecast_accuracy(
    request: Dict[str, Any] = Body(...)
):
    """Evaluate the accuracy of a forecast compared to actual data."""
    try:
        # Validate request
        required_fields = ["forecast_id", "building_id"]
        for field in required_fields:
            if field not in request:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Mock forecast evaluation results
        metrics = {
            "mean_absolute_error": round(random.uniform(20.0, 50.0), 2),
            "mean_absolute_percentage_error": round(random.uniform(3.0, 8.0), 2),
            "root_mean_squared_error": round(random.uniform(30.0, 70.0), 2),
            "r_squared": round(random.uniform(0.8, 0.95), 3),
            "bias": round(random.uniform(-5.0, 5.0), 2)
        }
        
        return {
            "forecast_id": request["forecast_id"],
            "building_id": request["building_id"],
            "evaluation_timestamp": datetime.now().isoformat(),
            "period_evaluated": {
                "start": "2023-01-01",
                "end": "2023-01-31"
            },
            "accuracy_metrics": metrics,
            "overall_accuracy_rating": "good",
            "improvement_suggestions": [
                "Include additional weather variables for better correlation",
                "Adjust model to account for holiday effects",
                "Increase training data timespan for seasonal patterns"
            ]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error evaluating forecast accuracy: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/model/performance", response_model=Dict[str, Any])
async def evaluate_model_performance(
    request: Dict[str, Any] = Body(...)
):
    """Evaluate the performance of a prediction model."""
    try:
        # Validate request
        required_fields = ["model_id", "model_type"]
        for field in required_fields:
            if field not in request:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Mock model evaluation results based on model type
        model_type = request["model_type"]
        
        if model_type == "forecasting":
            metrics = {
                "mean_absolute_error": round(random.uniform(20.0, 50.0), 2),
                "mean_absolute_percentage_error": round(random.uniform(3.0, 8.0), 2),
                "root_mean_squared_error": round(random.uniform(30.0, 70.0), 2),
                "r_squared": round(random.uniform(0.8, 0.95), 3)
            }
        elif model_type == "anomaly_detection":
            metrics = {
                "precision": round(random.uniform(0.8, 0.95), 3),
                "recall": round(random.uniform(0.75, 0.9), 3),
                "f1_score": round(random.uniform(0.8, 0.92), 3),
                "false_positive_rate": round(random.uniform(0.05, 0.15), 3)
            }
        else:
            metrics = {
                "accuracy": round(random.uniform(0.8, 0.95), 3),
                "precision": round(random.uniform(0.8, 0.95), 3),
                "recall": round(random.uniform(0.75, 0.9), 3),
                "f1_score": round(random.uniform(0.8, 0.92), 3)
            }
        
        return {
            "model_id": request["model_id"],
            "model_type": model_type,
            "evaluation_timestamp": datetime.now().isoformat(),
            "dataset": {
                "training_size": 8760,  # 1 year of hourly data
                "testing_size": 2190,   # 3 months of hourly data
                "validation_size": 730  # 1 month of hourly data
            },
            "performance_metrics": metrics,
            "overall_rating": "good",
            "strengths": [
                "Strong performance on weekday patterns",
                "Good handling of seasonal variations",
                "Robust to minor weather anomalies"
            ],
            "weaknesses": [
                "Higher error rates during transition seasons",
                "Difficulty predicting holiday anomalies",
                "Performance degradation with extreme weather events"
            ]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error evaluating model performance: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}") 