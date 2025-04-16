"""
Commander API routes for Energy AI Optimizer.
This module defines endpoints for the orchestration and coordination of the multi-agent system.
"""
from fastapi import APIRouter, HTTPException, Path, Query, Body
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging
import json
import uuid
import os
import pandas as pd
from pydantic import BaseModel

# Import agents
from agents.commander.commander_agent import CommanderAgent
from agents.data_analysis.data_analysis_agent import DataAnalysisAgent
from agents.recommendation.recommendation_agent import RecommendationAgent
from agents.forecasting.forecasting_agent import ForecastingAgent
from agents.memory.memory_agent import MemoryAgent
from agents.evaluator.evaluator_agent import EvaluatorAgent
from agents.adapter.adapter_agent import AdapterAgent

from data.building.building_processor import BuildingDataProcessor

# Get logger
logger = logging.getLogger("eaio.api.commander")

# Initialize the Commander Agent
commander_agent = CommanderAgent()

# Initialize building processor
building_processor = BuildingDataProcessor()

# Create router
router = APIRouter(prefix="/commander", tags=["commander"])

# Pydantic models
class WorkflowRequest(BaseModel):
    workflow_type: str
    building_id: str
    user_id: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None

class QueryRequest(BaseModel):
    query: str
    building_id: Optional[str] = None
    user_role: str = "facility_manager"
    parameters: Optional[Dict[str, Any]] = None

# Storage for workflow statuses (in-memory for demo purposes)
WORKFLOW_STATUSES = {}

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

# Helper function to prepare building data for agent use
def prepare_building_data(building_id: str, metrics: List[str] = ["electricity"]) -> Dict[str, Any]:
    """Prepare building data for use with agents."""
    building_data = {}
    
    try:
        # Get recent data (last 30 days) for each metric
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        for metric in metrics:
            df = get_building_data(
                building_id=building_id,
                metric=metric,
                start_date=start_date.isoformat(),
                end_date=end_date.isoformat()
            )
            
            if not df.empty:
                consumption_values = df["consumption"].tolist()
                timestamps = df["timestamp"].dt.isoformat().tolist()
                
                building_data[metric] = {
                    "data": [
                        {"timestamp": timestamp, "value": value}
                        for timestamp, value in zip(timestamps, consumption_values)
                    ],
                    "period": {
                        "start": timestamps[0] if timestamps else None,
                        "end": timestamps[-1] if timestamps else None
                    },
                    "statistics": {
                        "mean": float(df["consumption"].mean()) if not df.empty else None,
                        "min": float(df["consumption"].min()) if not df.empty else None,
                        "max": float(df["consumption"].max()) if not df.empty else None
                    }
                }
        
        # Add empty data for missing metrics
        for metric in metrics:
            if metric not in building_data:
                building_data[metric] = {"data": [], "error": f"No data available for {metric}"}
        
    except Exception as e:
        logger.error(f"Error preparing building data: {str(e)}")
        building_data["error"] = str(e)
    
    return building_data

@router.post("/workflows", response_model=Dict[str, Any])
async def create_workflow(request: WorkflowRequest):
    """Create and execute a new workflow."""
    try:
        # Generate a new workflow ID
        workflow_id = f"workflow-{str(uuid.uuid4())[:8]}"
        
        # Create workflow record
        workflow = {
            "id": workflow_id,
            "name": get_workflow_name(request.workflow_type),
            "status": "initiated",
            "workflow_type": request.workflow_type,
            "building_id": request.building_id,
            "initiated_by": request.user_id or "anonymous",
            "started_at": datetime.now().isoformat(),
            "completed_at": None,
            "parameters": request.parameters or {},
            "steps": []
        }
        
        # Add workflow to storage
        WORKFLOW_STATUSES[workflow_id] = workflow
        
        # Prepare for execution
        workflow["status"] = "in_progress"
        workflow["steps"].append({
            "name": "initialization",
            "status": "completed",
            "agent": "commander",
            "started_at": datetime.now().isoformat(),
            "completed_at": datetime.now().isoformat(),
            "duration_ms": 500
        })
        
        # Start workflow execution based on type
        try:
            # Initialize the Commander Agent if not already
            if not commander_agent.data_analysis_agent:
                logger.info("Initializing agents for workflow execution")
                commander_agent.initialize_agents()
            
            # Set up appropriate steps based on workflow type
            if request.workflow_type == "energy_analysis":
                # Set up data collection step
                workflow["steps"].append({
                    "name": "data_collection",
                    "status": "in_progress",
                    "agent": "adapter",
                    "started_at": datetime.now().isoformat(),
                    "completed_at": None
                })
                
                # This would typically be asynchronous - we're mocking completion here
                workflow["steps"][-1]["status"] = "completed"
                workflow["steps"][-1]["completed_at"] = datetime.now().isoformat()
                workflow["steps"][-1]["duration_ms"] = 1250
                
                # Add analysis step
                workflow["steps"].append({
                    "name": "analysis",
                    "status": "in_progress",
                    "agent": "data_analysis",
                    "started_at": datetime.now().isoformat(),
                    "completed_at": None
                })
                
                # Get building data
                building_data = prepare_building_data(request.building_id, ["electricity", "gas", "water"])
                
                # Process with data analysis agent
                analysis_results = commander_agent.data_analysis_agent.analyze_consumption_patterns(
                    building_id=request.building_id,
                    df=None,  # Using the prepared data instead
                    energy_type="electricity"
                )
                
                # Update step status
                workflow["steps"][-1]["status"] = "completed"
                workflow["steps"][-1]["completed_at"] = datetime.now().isoformat()
                workflow["steps"][-1]["duration_ms"] = 1580
                
                # Add results to workflow
                workflow["results"] = {
                    "analysis": analysis_results
                }
                
                # Mark workflow as completed
                workflow["status"] = "completed"
                workflow["completed_at"] = datetime.now().isoformat()
                
            elif request.workflow_type == "recommendation_generation":
                # Set up steps: data collection, analysis, recommendations
                # For brevity, we're condensing these
                workflow["steps"].append({
                    "name": "data_collection",
                    "status": "completed",
                    "agent": "adapter",
                    "started_at": datetime.now().isoformat(),
                    "completed_at": datetime.now().isoformat(),
                    "duration_ms": 1200
                })
                
                workflow["steps"].append({
                    "name": "analysis",
                    "status": "completed",
                    "agent": "data_analysis",
                    "started_at": datetime.now().isoformat(),
                    "completed_at": datetime.now().isoformat(),
                    "duration_ms": 1450
                })
                
                workflow["steps"].append({
                    "name": "recommendations",
                    "status": "in_progress",
                    "agent": "recommendation",
                    "started_at": datetime.now().isoformat(),
                    "completed_at": None
                })
                
                # Get building data
                building_data = prepare_building_data(request.building_id, ["electricity"])
                
                # Get recommendations
                recommendations = commander_agent.recommendation_agent.generate_recommendations(
                    building_id=request.building_id,
                    df=None  # Using the prepared data instead
                )
                
                # Update step status
                workflow["steps"][-1]["status"] = "completed"
                workflow["steps"][-1]["completed_at"] = datetime.now().isoformat()
                workflow["steps"][-1]["duration_ms"] = 1800
                
                # Add results to workflow
                workflow["results"] = {
                    "recommendations": recommendations
                }
                
                # Mark workflow as completed
                workflow["status"] = "completed"
                workflow["completed_at"] = datetime.now().isoformat()
                
            elif request.workflow_type == "consumption_forecast":
                # Set up steps: data collection, forecasting
                workflow["steps"].append({
                    "name": "data_collection",
                    "status": "completed",
                    "agent": "adapter",
                    "started_at": datetime.now().isoformat(),
                    "completed_at": datetime.now().isoformat(),
                    "duration_ms": 1350
                })
                
                workflow["steps"].append({
                    "name": "forecasting",
                    "status": "in_progress",
                    "agent": "forecasting",
                    "started_at": datetime.now().isoformat(),
                    "completed_at": None
                })
                
                # Get building data
                building_data = prepare_building_data(request.building_id, ["electricity"])
                
                # Determine forecast parameters
                days = request.parameters.get("days", 7) if request.parameters else 7
                forecast_horizon = "day_ahead" if days <= 1 else "week_ahead" if days <= 7 else "month_ahead"
                
                # Generate forecast guidance
                forecast_guidance = commander_agent.forecasting_agent.provide_forecast_guidance(
                    historical_data=building_data,
                    weather_forecast=None,
                    forecast_horizon=forecast_horizon,
                    building_id=request.building_id
                )
                
                # Update step status
                workflow["steps"][-1]["status"] = "completed"
                workflow["steps"][-1]["completed_at"] = datetime.now().isoformat()
                workflow["steps"][-1]["duration_ms"] = 2100
                
                # Add results to workflow
                workflow["results"] = {
                    "forecast_guidance": forecast_guidance
                }
                
                # Mark workflow as completed
                workflow["status"] = "completed"
                workflow["completed_at"] = datetime.now().isoformat()
                
            else:
                # For other workflow types, mark as unsupported
                workflow["status"] = "failed"
                workflow["error"] = f"Unsupported workflow type: {request.workflow_type}"
                workflow["completed_at"] = datetime.now().isoformat()
                
        except Exception as e:
            # Handle workflow execution error
            logger.error(f"Error executing workflow: {str(e)}")
            workflow["status"] = "failed"
            workflow["error"] = f"Error executing workflow: {str(e)}"
            workflow["completed_at"] = datetime.now().isoformat()
        
        # Return workflow status
        return {
            "workflow_id": workflow_id,
            "status": workflow["status"],
            "message": f"{workflow['name']} workflow {workflow['status']}",
            "workflow": workflow
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/workflows", response_model=Dict[str, Any])
async def get_workflows(
    building_id: Optional[str] = Query(None, description="Filter by building ID"),
    workflow_type: Optional[str] = Query(None, description="Filter by workflow type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(10, description="Maximum number of workflows to return")
):
    """Get list of workflows."""
    try:
        # Get workflows from storage
        workflows = list(WORKFLOW_STATUSES.values())
        
        # Apply filters
        if building_id:
            workflows = [w for w in workflows if w.get("building_id") == building_id]
        if workflow_type:
            workflows = [w for w in workflows if w.get("workflow_type") == workflow_type]
        if status:
            workflows = [w for w in workflows if w.get("status") == status]
        
        # Sort by start date (newest first)
        workflows.sort(key=lambda w: w.get("started_at", ""), reverse=True)
        
        # Apply limit
        workflows = workflows[:limit]
        
        return {
            "items": workflows,
            "total": len(workflows)
        }
    
    except Exception as e:
        logger.error(f"Error retrieving workflows: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/workflows/{workflow_id}", response_model=Dict[str, Any])
async def get_workflow(
    workflow_id: str = Path(..., description="Workflow identifier")
):
    """Get details of a specific workflow."""
    try:
        # Check if workflow exists in storage
        if workflow_id not in WORKFLOW_STATUSES:
            raise HTTPException(status_code=404, detail=f"Workflow not found: {workflow_id}")
        
        return WORKFLOW_STATUSES[workflow_id]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving workflow {workflow_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/workflows/{workflow_id}/cancel", response_model=Dict[str, Any])
async def cancel_workflow(
    workflow_id: str = Path(..., description="Workflow identifier")
):
    """Cancel a running workflow."""
    try:
        # Check if workflow exists in storage
        if workflow_id not in WORKFLOW_STATUSES:
            raise HTTPException(status_code=404, detail=f"Workflow not found: {workflow_id}")
        
        # Check if workflow can be cancelled
        workflow = WORKFLOW_STATUSES[workflow_id]
        if workflow["status"] in ["completed", "failed", "cancelled"]:
            raise HTTPException(status_code=400, detail=f"Cannot cancel workflow with status: {workflow['status']}")
        
        # Update workflow status
        workflow["status"] = "cancelled"
        workflow["completed_at"] = datetime.now().isoformat()
        
        # Update any in-progress steps
        for step in workflow["steps"]:
            if step["status"] == "in_progress":
                step["status"] = "cancelled"
                step["completed_at"] = datetime.now().isoformat()
        
        return {
            "workflow_id": workflow_id,
            "status": "cancelled",
            "message": "Workflow cancelled successfully",
            "cancelled_at": workflow["completed_at"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling workflow {workflow_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/agents", response_model=Dict[str, Any])
async def get_agents_status():
    """Get status of all agents in the system."""
    try:
        # Initialize the CommanderAgent if not already
        if not commander_agent.data_analysis_agent:
            try:
                logger.info("Initializing agents for status check")
                commander_agent.initialize_agents()
            except Exception as e:
                logger.error(f"Error initializing agents: {str(e)}")
                # Continue with partial status
        
        # Prepare agent status
        agents = []
        
        # Determine active agents
        active_agents = []
        if commander_agent.data_analysis_agent:
            active_agents.append("data_analysis")
        if commander_agent.recommendation_agent:
            active_agents.append("recommendation")
        if commander_agent.forecasting_agent:
            active_agents.append("forecasting")
        
        # Add Data Analysis Agent
        agents.append({
                "id": "data_analysis",
                "name": "Data Analysis Agent",
            "status": "active" if "data_analysis" in active_agents else "inactive",
            "uptime": "Varies",
                "last_active": datetime.now().isoformat(),
            "current_tasks": 0,
            "total_tasks_completed": len([w for w in WORKFLOW_STATUSES.values() if any(s.get("agent") == "data_analysis" for s in w.get("steps", []))]),
                "avg_response_time_ms": 1450
        })
        
        # Add Recommendation Agent
        agents.append({
                "id": "recommendation",
                "name": "Recommendation Agent",
            "status": "active" if "recommendation" in active_agents else "inactive",
            "uptime": "Varies",
                "last_active": datetime.now().isoformat(),
            "current_tasks": 0,
            "total_tasks_completed": len([w for w in WORKFLOW_STATUSES.values() if any(s.get("agent") == "recommendation" for s in w.get("steps", []))]),
                "avg_response_time_ms": 980
        })
        
        # Add Forecasting Agent
        agents.append({
                "id": "forecasting",
                "name": "Forecasting Agent",
            "status": "active" if "forecasting" in active_agents else "inactive",
            "uptime": "Varies",
                "last_active": datetime.now().isoformat(),
            "current_tasks": 0,
            "total_tasks_completed": len([w for w in WORKFLOW_STATUSES.values() if any(s.get("agent") == "forecasting" for s in w.get("steps", []))]),
                "avg_response_time_ms": 2300
        })
        
        # Add Commander Agent
        agents.append({
            "id": "commander",
            "name": "Commander Agent",
                "status": "active",
            "uptime": "Varies",
                "last_active": datetime.now().isoformat(),
                "current_tasks": 0,
            "total_tasks_completed": len(WORKFLOW_STATUSES),
            "avg_response_time_ms": 500
        })
        
        # Add other agents (placeholders)
        for agent_id, agent_name in [
            ("adapter", "Adapter Agent"),
            ("memory", "Memory Agent"),
            ("evaluator", "Evaluator Agent")
        ]:
            agents.append({
                "id": agent_id,
                "name": agent_name,
                "status": "active",
                "uptime": "Varies",
                "last_active": datetime.now().isoformat(),
                "current_tasks": 0,
                "total_tasks_completed": len([w for w in WORKFLOW_STATUSES.values() if any(s.get("agent") == agent_id for s in w.get("steps", []))]),
                "avg_response_time_ms": {"adapter": 850, "memory": 320, "evaluator": 1680}.get(agent_id, 1000)
            })
        
        return {
            "agents": agents,
            "total": len(agents),
            "active": len([a for a in agents if a["status"] == "active"]),
            "system_status": "healthy",
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error retrieving agent status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/query", response_model=Dict[str, Any])
async def process_natural_language_query(request: QueryRequest):
    """Process a natural language query using the Commander Agent."""
    try:
        # Initialize agents if needed
        if not commander_agent.data_analysis_agent:
            logger.info("Initializing agents for query processing")
            commander_agent.initialize_agents()
        
        # Get building data if building_id is provided
        building_data = None
        if request.building_id:
            building_data = prepare_building_data(
                building_id=request.building_id,
                metrics=["electricity", "gas", "water"]
            )
        
        # Process query with Commander Agent
        results = commander_agent.route_query(
            query=request.query,
            user_role=request.user_role,
            building_data=building_data,
            weather_data=request.parameters.get("weather_data") if request.parameters else None
        )
        
        # Format response
        response = {
            "query": request.query,
            "timestamp": datetime.now().isoformat(),
            "building_id": request.building_id,
            "user_role": request.user_role,
            "intent": results.get("intent"),
            "results": results
        }
        
        # Add special processing for multi-intent queries
        if results.get("intent") == "multi" and "integrated_response" in results:
            response["response"] = results.get("integrated_response")
        
        return response
    
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/integrate", response_model=Dict[str, Any])
async def integrate_results(
    request: Dict[str, Any] = Body(...)
):
    """Integrate results from multiple agents into a comprehensive report."""
    try:
        # Validate request
        required_fields = ["building_id"]
        for field in required_fields:
            if field not in request:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Initialize the Commander Agent if not already
        if not commander_agent.data_analysis_agent:
            logger.info("Initializing agents for result integration")
            commander_agent.initialize_agents()
        
        # Check what types of results are available
        has_analysis = "analysis_results" in request
        has_recommendations = "recommendation_results" in request
        has_forecast = "forecast_results" in request
        
        # Create agent results dictionary
        agent_results = {
            'analysis_results': request.get('analysis_results', {}),
            'recommendation_results': request.get('recommendation_results', {}),
            'forecast_results': request.get('forecast_results', {})
        }
        
        # Set user role (default to facility manager)
        user_role = request.get('user_role', 'facility_manager')
        
        # Create integrated response using the Commander Agent
        integrated_response = commander_agent.create_integrated_response(agent_results, user_role)
        
        # Return the integrated results
        return {
            "building_id": request["building_id"],
            "timestamp": datetime.now().isoformat(),
            "integrated_report": {
                "summary": integrated_response,
                "has_analysis": has_analysis,
                "has_recommendations": has_recommendations,
                "has_forecast": has_forecast
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error integrating results: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/orchestrate", response_model=Dict[str, Any])
async def orchestrate_agents(
    request: Dict[str, Any] = Body(...)
):
    """
    Orchestrate interactions between multiple agents for a specific task.
    
    This endpoint provides a higher-level interface for multi-agent workflows.
    """
    try:
        logger.info(f"Received orchestration request: {json.dumps(request)}")
        
        # Extract request parameters
        workflow_name = request.get("workflow_name")
        if not workflow_name:
            raise HTTPException(status_code=400, detail="workflow_name is required")
        
        # Get user role
        user_role = request.get("user_role", "facility_manager")
        
        # Get building ID
        building_id = request.get("building_id")
        
        # Extract input data
        input_data = request.get("input_data", {})
        
        # Initialize agents if needed
        if not commander_agent.data_analysis_agent:
            logger.info("Initializing agents for orchestration")
            commander_agent.initialize_agents()
        
        # Start timer
        start_time = datetime.now()
        
        # Call the new orchestrate_agents method
        results = commander_agent.orchestrate_agents(
            workflow_name=workflow_name,
            input_data=input_data,
            user_role=user_role,
            building_id=building_id
        )
        
        # Calculate execution time
        execution_time_ms = (datetime.now() - start_time).total_seconds() * 1000
        
        # Add metadata to response
        response = {
            "status": "success",
            "workflow_name": workflow_name,
            "execution_time_ms": execution_time_ms,
            "timestamp": datetime.now().isoformat(),
            "results": results
        }
        
        logger.info(f"Completed orchestration for {workflow_name}")
        return response
        
    except Exception as e:
        logger.error(f"Error in agent orchestration: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Orchestration error: {str(e)}")

# Helper functions
def get_workflow_name(workflow_type):
    """Get a readable name for a workflow type."""
    workflow_names = {
        "energy_analysis": "Building Energy Analysis",
        "consumption_forecast": "Energy Consumption Forecast",
        "anomaly_detection": "Anomaly Detection Scan",
        "recommendation_generation": "Recommendation Generation",
        "impact_evaluation": "Impact Evaluation"
    }
    return workflow_names.get(workflow_type, f"{workflow_type.replace('_', ' ').title()} Workflow")

def get_estimated_completion_time(workflow_type):
    """Get estimated completion time for a workflow type."""
    # Completion times in minutes
    completion_times = {
        "energy_analysis": 3,
        "consumption_forecast": 5,
        "anomaly_detection": 4,
        "recommendation_generation": 3,
        "impact_evaluation": 6
    }
    minutes = completion_times.get(workflow_type, 5)
    return (datetime.now() + timedelta(minutes=minutes)).isoformat() 