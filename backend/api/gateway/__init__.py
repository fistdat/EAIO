"""
API Gateway module for Energy AI Optimizer.
This module provides a unified API interface for all agent endpoints.
"""

from fastapi import APIRouter
from .api_gateway import api_gateway_router

# Re-export the api_gateway_router
__all__ = ["api_gateway_router"]