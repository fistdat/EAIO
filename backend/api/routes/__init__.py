"""
API routes initialization for Energy AI Optimizer.
This module imports all route modules and creates a list of routers.
"""
from fastapi import APIRouter

# Import route modules
from .building_routes import router as building_router
from .analysis_routes import router as analysis_router
from .recommendation_routes import router as recommendation_router
from .forecasting_routes import router as forecasting_router
from .weather_routes import router as weather_router
from .adapter_routes import router as adapter_router
from .memory_routes import router as memory_router
from .evaluator_routes import router as evaluator_router
from .commander_routes import router as commander_router

# Create a list of all routers
routers = [
    building_router,
    analysis_router,
    recommendation_router,
    forecasting_router,
    weather_router,
    adapter_router,
    memory_router,
    evaluator_router,
    commander_router
]

# Create the main API router
api_router = APIRouter()

# Include all routers
for router in routers:
    api_router.include_router(router) 