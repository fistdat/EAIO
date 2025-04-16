"""
API Gateway for Energy AI Optimizer.

This module exports the API Gateway router for inclusion in the main API.
Thiết kế monolithic đơn giản để điều phối tất cả các request API.
"""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import logging

# Cấu hình logging
logger = logging.getLogger("eaio.api.gateway")

# Create a router without prefix - prefix will be added in main.py
api_gateway_router = APIRouter(tags=["API Gateway"])

# Thêm endpoint mặc định cho gateway root
@api_gateway_router.get("/", summary="API Gateway Root", description="Endpoint gốc của API Gateway")
async def gateway_root():
    """Trả về thông tin về API Gateway"""
    return {
        "message": "Energy AI Optimizer API Gateway",
        "version": "1.0.0",
        "status": "active",
        "endpoints": [
            "/buildings",
            "/analysis", 
            "/recommendations",
            "/forecasts",
            "/weather"
        ]
    }

# Endpoint chuyển tiếp đến các dịch vụ cụ thể trong kiến trúc monolithic
@api_gateway_router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"], include_in_schema=False)
async def api_gateway_proxy(request: Request, path: str):
    """
    Endpoint proxy để điều hướng yêu cầu trong kiến trúc monolithic.
    Trong triển khai monolithic, đây chỉ là một điểm truy cập thống nhất.
    """
    logger.info(f"Gateway received request for path: {path}")
    
    return JSONResponse({
        "message": f"Request to {path} received by API Gateway",
        "status": "processed",
        "original_path": path,
        "method": request.method,
        "note": "Monolithic API Gateway is operational"
    })
