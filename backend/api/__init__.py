"""
API module for the Energy AI Optimizer.
This module provides FastAPI endpoints to connect the backend agents with the frontend.
"""

from fastapi import APIRouter
from .routes import api_router

# Re-export the api_router for use in main.py
__all__ = ['api_router'] 