"""
Main application file for Energy AI Optimizer backend.
This module initializes and configures the FastAPI application.
"""
import os
import sys

# Add the project root to sys.path to ensure proper imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from datetime import datetime

# Import the API router
from api.routes import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("logs/eaio.log")
    ]
)
logger = logging.getLogger("eaio")

# Create the FastAPI application
app = FastAPI(
    title="Energy AI Optimizer API",
    description="API for the Energy AI Optimizer multi-agent system",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API router at both /api/v1 (original) and /api (for frontend compatibility)
app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router, prefix="/api")  # Add this to support frontend calls

# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """Root endpoint providing API information."""
    return {
        "name": "Energy AI Optimizer API",
        "version": "0.1.0",
        "status": "operational",
        "timestamp": datetime.now().isoformat()
    }

# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 