"""
API Gateway routers initialization.
This module exports all router modules for the API Gateway.
"""

from .analysis_router import router as analysis_router
from .forecast_router import router as forecast_router
from .recommendation_router import router as recommendation_router
from .building_router import router as building_router
from .auth_router import router as auth_router

__all__ = [
    "analysis_router",
    "forecast_router",
    "recommendation_router",
    "building_router",
    "auth_router"
] 