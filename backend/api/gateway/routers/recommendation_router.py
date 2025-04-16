"""
Recommendation router for the API Gateway.
Provides endpoints for generating energy optimization recommendations.
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, List, Optional, Any
from datetime import datetime
import httpx
import logging

from ..api_models import RecommendationRequest, UserRole
from ..api_responses import DataResponse

# Set up logger
logger = logging.getLogger("eaio.gateway.recommendation")

# Create router
router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

# Define base URL for recommendation service
RECOMMENDATION_SERVICE_URL = "http://localhost:8003/api/v1/recommendations"

@router.post("/", response_model=DataResponse)
async def proxy_recommendation_request(request: RecommendationRequest = Body(...)):
    """
    Generate energy optimization recommendations.
    
    This endpoint forwards the request to the Recommendation service
    and returns personalized recommendations based on the user role.
    """
    try:
        logger.info(f"Forwarding recommendation request for user role: {request.user_role}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                RECOMMENDATION_SERVICE_URL,
                json=request.dict(),
                timeout=60.0  # Recommendation generation may take time
            )
            
            if response.status_code != 200:
                logger.error(f"Recommendation service error: {response.status_code}, {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Recommendation service error: {response.text}"
                )
            
            # Create a standardized response
            recommendation_data = response.json()
            
            return DataResponse(
                success=True,
                message=f"Recommendations generated for {request.user_role}",
                data=recommendation_data
            )
            
    except httpx.RequestError as exc:
        logger.error(f"Error communicating with recommendation service: {str(exc)}")
        raise HTTPException(
            status_code=503,
            detail=f"Recommendation service communication error: {str(exc)}"
        )
    except Exception as exc:
        logger.error(f"Unexpected error in recommendation request: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(exc)}"
        )

@router.get("/{building_id}", response_model=DataResponse)
async def get_building_recommendations(
    building_id: str,
    user_role: UserRole,
    max_recommendations: int = 5
):
    """
    Get recommendations for a specific building.
    
    This endpoint forwards the request to the Recommendation service and returns
    personalized recommendations for the specified building and user role.
    """
    try:
        logger.info(f"Requesting recommendations for building: {building_id}, role: {user_role}")
        
        # Construct query parameters
        params = {
            "user_role": user_role,
            "max_recommendations": max_recommendations
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{RECOMMENDATION_SERVICE_URL}/{building_id}",
                params=params,
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.error(f"Recommendation service error: {response.status_code}, {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Recommendation service error: {response.text}"
                )
            
            # Create a standardized response
            recommendation_data = response.json()
            
            return DataResponse(
                success=True,
                message=f"Recommendations retrieved for building {building_id}",
                data=recommendation_data
            )
            
    except httpx.RequestError as exc:
        logger.error(f"Error communicating with recommendation service: {str(exc)}")
        raise HTTPException(
            status_code=503,
            detail=f"Recommendation service communication error: {str(exc)}"
        )
    except Exception as exc:
        logger.error(f"Unexpected error in recommendation request: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(exc)}"
        )

@router.post("/feedback", response_model=DataResponse)
async def provide_recommendation_feedback(feedback: Dict[str, Any] = Body(...)):
    """
    Provide feedback on recommendations.
    
    This endpoint forwards feedback to the Recommendation service to improve
    future recommendations based on user input.
    """
    try:
        logger.info("Forwarding recommendation feedback")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{RECOMMENDATION_SERVICE_URL}/feedback",
                json=feedback,
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.error(f"Recommendation service error: {response.status_code}, {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Recommendation service error: {response.text}"
                )
            
            # Create a standardized response
            feedback_response = response.json()
            
            return DataResponse(
                success=True,
                message="Recommendation feedback processed",
                data=feedback_response
            )
            
    except httpx.RequestError as exc:
        logger.error(f"Error communicating with recommendation service: {str(exc)}")
        raise HTTPException(
            status_code=503,
            detail=f"Recommendation service communication error: {str(exc)}"
        )
    except Exception as exc:
        logger.error(f"Unexpected error in feedback submission: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(exc)}"
        ) 