"""
Main entry point for the Energy AI Optimizer API Gateway.

This gateway serves as the central access point for all API operations,
providing standardized request/response handling, authentication,
documentation, and integration with the component services.
"""

import os
import time
from typing import Callable, Dict, List, Optional, Union
import uuid

from fastapi import FastAPI, Request, Response, status, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi

# Import routers
from .routers import (
    analysis_router,
    forecast_router,
    recommendation_router,
    building_router,
    auth_router
)

# Import response models
from .api_responses import (
    ErrorResponse, 
    ErrorDetail,
    ErrorSeverity,
    INTERNAL_SERVER_ERROR
)

# Create the FastAPI application
app = FastAPI(
    title="Energy AI Optimizer API",
    description="""
    The Energy AI Optimizer API provides intelligent energy optimization through AI-driven 
    analysis, recommendations, and forecasting capabilities.
    
    This API serves as the central interface for the Energy AI Optimizer system, supporting
    facility managers, energy analysts, and executives in making data-driven decisions for
    energy efficiency and sustainability.
    """,
    version="1.0.0",
    docs_url=None,  # We'll customize the docs route
    redoc_url=None,  # We'll customize the redoc route
    openapi_url="/api/v1/openapi.json"
)

# Configure CORS
origins = [
    "http://localhost:3000",  # Development React frontend
    "http://localhost:8000",  # Development backend
    "https://energy-ai-optimizer.com",  # Production domain (example)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request ID middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next: Callable) -> Response:
    """Add a unique request ID to each request for tracking."""
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    # Set start time for request duration tracking
    start_time = time.time()
    
    # Process the request
    try:
        response = await call_next(request)
        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        
        # Add processing time to response headers
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        
        return response
    except Exception as e:
        # If an unhandled exception occurs, return a standardized error response
        error_response = INTERNAL_SERVER_ERROR.copy(deep=True)
        error_response.error.details = {"exception": str(e)}
        error_response.trace_id = request_id
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response.dict()
        )

# Mount routers
app.include_router(
    building_router,
    prefix="/api/v1/buildings",
    tags=["Buildings"]
)

app.include_router(
    analysis_router,
    prefix="/api/v1/analysis",
    tags=["Analysis"]
)

app.include_router(
    forecast_router,
    prefix="/api/v1/forecasts",
    tags=["Forecasting"]
)

app.include_router(
    recommendation_router,
    prefix="/api/v1/recommendations",
    tags=["Recommendations"]
)

app.include_router(
    auth_router,
    prefix="/api/v1/auth",
    tags=["Authentication"]
)

# Custom OpenAPI schema generator
def custom_openapi():
    """Generate a customized OpenAPI schema with enhanced documentation."""
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Add security schemes
    openapi_schema["components"] = {
        "securitySchemes": {
            "ApiKeyAuth": {
                "type": "apiKey",
                "in": "header",
                "name": "X-API-Key",
                "description": "API key for authentication"
            },
            "BearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": "JWT token for user authentication"
            }
        }
    }
    
    # Set global security requirement
    openapi_schema["security"] = [{"ApiKeyAuth": []}]
    
    # Add API contact information
    openapi_schema["info"]["contact"] = {
        "name": "Energy AI Optimizer Support",
        "url": "https://energy-ai-optimizer.com/support",
        "email": "support@energy-ai-optimizer.com"
    }
    
    # Add terms of service and license
    openapi_schema["info"]["termsOfService"] = "https://energy-ai-optimizer.com/terms"
    openapi_schema["info"]["license"] = {
        "name": "Proprietary",
        "url": "https://energy-ai-optimizer.com/license"
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Custom documentation endpoints
@app.get("/api/v1/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    """Serve custom Swagger UI documentation."""
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=f"{app.title} - API Documentation",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui.css",
        swagger_favicon_url="/static/favicon.ico"
    )

@app.get("/api/v1/redoc", include_in_schema=False)
async def custom_redoc_html():
    """Serve custom ReDoc documentation."""
    return get_redoc_html(
        openapi_url=app.openapi_url,
        title=f"{app.title} - API Documentation",
        redoc_js_url="https://cdn.jsdelivr.net/npm/redoc@2.0.0/bundles/redoc.standalone.js",
        redoc_favicon_url="/static/favicon.ico"
    )

# Root endpoint that redirects to documentation
@app.get("/", tags=["Root"])
async def root():
    """Redirect to API documentation."""
    return {"message": "Welcome to Energy AI Optimizer API", "docs_url": "/api/v1/docs"}

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Simple health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": app.version
    }

# Allow for direct execution
if __name__ == "__main__":
    import uvicorn
    
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    uvicorn.run(
        "backend.api.gateway.main:app",
        host=host,
        port=port,
        reload=True if os.environ.get("ENV") == "development" else False
    ) 