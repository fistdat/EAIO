"""
API Router configuration for Energy AI Optimizer.
This module combines all API endpoints into a single router.
"""
from fastapi import APIRouter
from api.forecast_endpoints import router as forecast_router
# Import các router khác ở đây

# Tạo router chính
api_router = APIRouter()

# Đăng ký các router con
api_router.include_router(forecast_router)
# Đăng ký các router khác ở đây 