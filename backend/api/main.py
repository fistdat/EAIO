"""
Main FastAPI application for the Energy AI Optimizer backend.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import logging
import sys
import os

# Thêm thư mục gốc của dự án vào PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

# Import route modules
from api.routes import building_routes, analysis_routes, recommendation_routes, forecasting_routes
from api.routes import adapter_routes, memory_routes, evaluator_routes, commander_routes
from api.routes import weather_routes

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger("eaio.api")

# Initialize FastAPI app
app = FastAPI(
    title="Energy AI Optimizer API",
    description="API for the Energy AI Optimizer system",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix
api_prefix = "/api"
app.include_router(building_routes.router, prefix=api_prefix)
app.include_router(analysis_routes.router, prefix=api_prefix)
app.include_router(recommendation_routes.router, prefix=api_prefix)
app.include_router(forecasting_routes.router, prefix=api_prefix)
app.include_router(adapter_routes.router, prefix=api_prefix)
app.include_router(memory_routes.router, prefix=api_prefix)
app.include_router(evaluator_routes.router, prefix=api_prefix)
app.include_router(commander_routes.router, prefix=api_prefix)
app.include_router(weather_routes.router, prefix=api_prefix)

@app.on_event("startup")
async def startup_event():
    """Initialize components on application startup."""
    logger.info("Starting Energy AI Optimizer API")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources when shutting down the application."""
    logger.info("Shutting down Energy AI Optimizer API")

@app.get("/")
async def root():
    """Root endpoint returning API information."""
    return {
        "name": "Energy AI Optimizer API",
        "version": "1.0.0",
        "status": "operational",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint to verify API is running."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    # This block is executed when running the script directly
    import uvicorn
    import os
    
    # Check if port is specified in environment
    port = int(os.environ.get("PORT", 8000))
    
    # Start server
    uvicorn.run("api.main:app", host="0.0.0.0", port=port, reload=True) 