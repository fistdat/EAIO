"""
Error handling utilities for API Gateway in Energy AI Optimizer.
This module provides utilities for standardized error handling across all endpoints.
"""
from typing import Dict, Any, Optional, Union, List
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
import logging
import time
import traceback

from .api_responses import ErrorResponse

# Get logger
logger = logging.getLogger("eaio.api.gateway.errors")

class APIError(Exception):
    """Base class for API errors."""
    def __init__(
        self, 
        message: str, 
        code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(message)

class NotFoundError(APIError):
    """Error for resource not found."""
    def __init__(self, message: str = "Resource not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_404_NOT_FOUND, details)

class ValidationFailedError(APIError):
    """Error for validation failures."""
    def __init__(self, message: str = "Validation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_400_BAD_REQUEST, details)

class UnauthorizedError(APIError):
    """Error for unauthorized access."""
    def __init__(self, message: str = "Unauthorized access", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, details)

class ForbiddenError(APIError):
    """Error for forbidden access."""
    def __init__(self, message: str = "Access forbidden", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_403_FORBIDDEN, details)

class RateLimitError(APIError):
    """Error for rate limit exceeded."""
    def __init__(self, message: str = "Rate limit exceeded", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_429_TOO_MANY_REQUESTS, details)

class ServerError(APIError):
    """Error for server-side errors."""
    def __init__(self, message: str = "Server error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR, details)

def handle_http_exception(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Handle FastAPI HTTPException and convert to standard error response.
    
    Args:
        request: FastAPI request
        exc: HTTPException
        
    Returns:
        JSONResponse with standardized error format
    """
    # Log the error
    logger.warning(f"HTTP Exception: {exc.detail} (status code: {exc.status_code})")
    
    # Create error response
    error_response = ErrorResponse(
        message=str(exc.detail),
        code=exc.status_code,
        error_details=exc.headers
    )
    
    # Return JSON response
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.dict()
    )

def handle_validation_error(request: Request, exc: Union[RequestValidationError, ValidationError]) -> JSONResponse:
    """
    Handle request validation errors and convert to standard error response.
    
    Args:
        request: FastAPI request
        exc: ValidationError or RequestValidationError
        
    Returns:
        JSONResponse with standardized error format
    """
    # Extract errors
    errors = []
    if hasattr(exc, "errors"):
        for error in exc.errors():
            errors.append({
                "loc": " -> ".join([str(loc) for loc in error.get("loc", [])]),
                "msg": error.get("msg", ""),
                "type": error.get("type", "")
            })
    
    # Log the error
    logger.warning(f"Validation Error: {errors}")
    
    # Create error response
    error_response = ErrorResponse(
        message="Request validation failed",
        code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        error_details={"errors": errors}
    )
    
    # Return JSON response
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_response.dict()
    )

def handle_api_error(request: Request, exc: APIError) -> JSONResponse:
    """
    Handle custom APIError exceptions and convert to standard error response.
    
    Args:
        request: FastAPI request
        exc: APIError
        
    Returns:
        JSONResponse with standardized error format
    """
    # Log the error
    logger.warning(f"API Error: {exc.message} (code: {exc.code})")
    
    # Create error response
    error_response = ErrorResponse(
        message=exc.message,
        code=exc.code,
        error_details=exc.details
    )
    
    # Return JSON response
    return JSONResponse(
        status_code=exc.code,
        content=error_response.dict()
    )

def handle_generic_exception(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle generic exceptions and convert to standard error response.
    
    Args:
        request: FastAPI request
        exc: Exception
        
    Returns:
        JSONResponse with standardized error format
    """
    # Get traceback
    tb = traceback.format_exc()
    
    # Log the error
    logger.error(f"Unhandled Exception: {str(exc)}\n{tb}")
    
    # Create error response
    error_response = ErrorResponse(
        message="Internal server error",
        code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_details={
            "type": type(exc).__name__,
            "detail": str(exc)
        }
    )
    
    # Return JSON response
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response.dict()
    )

def register_exception_handlers(app):
    """
    Register all exception handlers with the FastAPI app.
    
    Args:
        app: FastAPI application
    """
    app.add_exception_handler(HTTPException, handle_http_exception)
    app.add_exception_handler(RequestValidationError, handle_validation_error)
    app.add_exception_handler(ValidationError, handle_validation_error)
    app.add_exception_handler(APIError, handle_api_error)
    app.add_exception_handler(Exception, handle_generic_exception) 