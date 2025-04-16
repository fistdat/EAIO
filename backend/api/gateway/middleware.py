"""
Middleware for API Gateway in Energy AI Optimizer.
This module provides middleware functions for request/response processing.
"""
from typing import Callable, Dict, Any
from fastapi import Request, Response
import time
import logging
import json
from starlette.middleware.base import BaseHTTPMiddleware

# Get logger
logger = logging.getLogger("eaio.api.gateway.middleware")

class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging request and response details."""
    
    async def dispatch(self, request: Request, call_next: Callable):
        """Process the request and log details."""
        # Record start time
        start_time = time.time()
        
        # Extract request info
        method = request.method
        url = str(request.url)
        client_host = request.client.host if request.client else "unknown"
        
        # Log request
        logger.info(f"Request: {method} {url} from {client_host}")
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate processing time
            process_time = time.time() - start_time
            
            # Log response
            logger.info(f"Response: {method} {url} - Status: {response.status_code} - Time: {process_time:.4f}s")
            
            # Add processing time header
            response.headers["X-Process-Time"] = f"{process_time:.4f}"
            
            return response
            
        except Exception as e:
            # Log error
            logger.error(f"Error processing request {method} {url}: {str(e)}")
            raise

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware for global error handling and standardization."""
    
    async def dispatch(self, request: Request, call_next: Callable):
        """Process the request and standardize error responses."""
        try:
            return await call_next(request)
        except Exception as e:
            # Log error
            logger.error(f"Unhandled exception: {str(e)}")
            
            # Create standard error response
            status_code = 500
            error_detail = str(e)
            
            # Generate error response
            error_response = {
                "success": False,
                "message": "Internal server error",
                "code": status_code,
                "timestamp": time.time(),
                "error_details": {
                    "exception": error_detail
                }
            }
            
            # Return JSON response
            return Response(
                content=json.dumps(error_response),
                status_code=status_code,
                media_type="application/json"
            )

class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Basic rate limiting middleware."""
    
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_timestamps = {}
        
    async def dispatch(self, request: Request, call_next: Callable):
        """Process the request with rate limiting."""
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Get current timestamp
        current_time = time.time()
        
        # Remove old timestamps (older than 1 minute)
        one_minute_ago = current_time - 60
        if client_ip in self.request_timestamps:
            self.request_timestamps[client_ip] = [
                ts for ts in self.request_timestamps[client_ip] if ts > one_minute_ago
            ]
        else:
            self.request_timestamps[client_ip] = []
        
        # Check rate limit
        if len(self.request_timestamps[client_ip]) >= self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for {client_ip}")
            
            # Create rate limit error response
            error_response = {
                "success": False,
                "message": "Rate limit exceeded",
                "code": 429,
                "timestamp": current_time,
                "error_details": {
                    "requests_per_minute": self.requests_per_minute
                }
            }
            
            return Response(
                content=json.dumps(error_response),
                status_code=429,
                media_type="application/json"
            )
        
        # Add current timestamp to list
        self.request_timestamps[client_ip].append(current_time)
        
        # Process request
        return await call_next(request) 