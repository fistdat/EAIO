"""
Main FastAPI application for the Energy AI Optimizer backend.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi
from datetime import datetime
import logging
import sys
import os

# Thêm thư mục gốc của dự án vào PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

# Import route modules trực tiếp với đường dẫn chính xác
from api.routes import building_routes, analysis_routes, recommendation_routes, forecasting_routes
from api.routes import adapter_routes, memory_routes, evaluator_routes, commander_routes
from api.routes import weather_routes, chat

# Vô hiệu hóa API Gateway để sử dụng routes trực tiếp
# from api.gateway.api_gateway import api_gateway_router
# from api.gateway.middleware import LoggingMiddleware, ErrorHandlingMiddleware, RateLimitingMiddleware
# from api.gateway.error_handlers import register_exception_handlers

# Import middleware cần thiết nếu có (không sử dụng API Gateway)
from fastapi.middleware.trustedhost import TrustedHostMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger("eaio.api")

# Initialize FastAPI app with enhanced metadata for documentation
app = FastAPI(
    title="Energy AI Optimizer API",
    description="""
    # Energy AI Optimizer API
    
    The Energy AI Optimizer is an intelligent system for optimizing energy consumption in buildings 
    using AI and machine learning techniques.
    
    ## Key Features
    
    * **Data Analysis**: Analyze building energy consumption patterns
    * **Anomaly Detection**: Detect abnormal energy usage patterns
    * **Forecasting**: Predict future energy consumption
    * **Recommendations**: Generate actionable energy-saving recommendations
    * **Multi-agent System**: Leverage specialized AI agents for different tasks
    
    ## Direct API Architecture
    
    This API provides direct access to all endpoints under `/api/v1` for accessing all functionalities.
    """,
    version="1.0.0",
    docs_url="/docs",  # Sử dụng docs mặc định
    redoc_url="/redoc",  # Sử dụng redoc mặc định
    openapi_url="/api/v1/openapi.json",  # Path to the OpenAPI schema
    contact={
        "name": "Energy AI Optimizer Team",
        "email": "support@energyaioptimizer.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
)

# Add middleware
# Order matters! Middleware are executed in reverse order (last added is executed first)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Vô hiệu hóa các custom middleware từ API Gateway
# app.add_middleware(ErrorHandlingMiddleware)
# app.add_middleware(LoggingMiddleware)
# app.add_middleware(RateLimitingMiddleware, requests_per_minute=1000)

# Bỏ qua register_exception_handlers
# register_exception_handlers(app)

# Include routers with /api/v1 prefix
api_prefix = "/api/v1"

# Không sử dụng API Gateway
# app.include_router(api_gateway_router, prefix=api_prefix)

# Include all routers directly
app.include_router(building_routes.router, prefix=api_prefix)
app.include_router(analysis_routes.router, prefix=api_prefix)
app.include_router(recommendation_routes.router, prefix=api_prefix)
app.include_router(forecasting_routes.router, prefix=api_prefix)
app.include_router(adapter_routes.router, prefix=api_prefix)
app.include_router(memory_routes.router, prefix=api_prefix)
app.include_router(evaluator_routes.router, prefix=api_prefix)
app.include_router(commander_routes.router, prefix=api_prefix)
app.include_router(weather_routes.router, prefix=api_prefix)

# Include chat router with /api prefix (not /api/v1)
app.include_router(chat.router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    """Initialize components on application startup."""
    logger.info("Starting Energy AI Optimizer API")
    logger.info(f"API Documentation available at /docs and /redoc")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources when shutting down the application."""
    logger.info("Shutting down Energy AI Optimizer API")

@app.get("/")
async def root():
    """Simple root endpoint for testing if the API is accessible"""
    return {
        "message": "Energy AI Optimizer API is running", 
        "version": "1.0.0",
        "docs_url": f"/docs",
        "redoc_url": f"/redoc"
    }

@app.get("/health")
async def health_check():
    """Healthcheck endpoint to verify the API is running"""
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "api_gateway": "disabled",
        "docs_available": True
    }

if __name__ == "__main__":
    # This block is executed when running the script directly
    import uvicorn
    import os
    
    # Check if port is specified in environment
    port = int(os.environ.get("PORT", 8000))
    
    # Start server
    uvicorn.run("api.main:app", host="0.0.0.0", port=port, reload=True) 