"""
Pagination utilities for API Gateway in Energy AI Optimizer.
This module provides utilities for paginating API responses.
"""
from typing import List, TypeVar, Generic, Dict, Any, Optional, Union
import math
from pydantic import BaseModel, Field

from .api_responses import PaginatedResponse

# Generic type for pagination
T = TypeVar('T')

class PaginationParams(BaseModel):
    """Common pagination parameters."""
    page: int = 1
    page_size: int = 20
    sort_by: Optional[str] = None
    sort_direction: Optional[str] = "asc"
    filter_field: Optional[str] = None
    filter_value: Optional[str] = None

def paginate(
    items: List[T], 
    page: int = 1, 
    page_size: int = 20, 
    sort_by: Optional[str] = None,
    sort_direction: str = "asc",
    filter_field: Optional[str] = None,
    filter_value: Optional[str] = None
) -> PaginatedResponse:
    """
    Paginate, sort, and filter a list of items.
    
    Args:
        items: List of items to paginate
        page: Page number (1-indexed)
        page_size: Number of items per page
        sort_by: Field to sort by
        sort_direction: Sort direction (asc or desc)
        filter_field: Field to filter on
        filter_value: Value to filter by
        
    Returns:
        PaginatedResponse with paginated items
    """
    # Apply filtering if specified
    if filter_field and filter_value is not None and isinstance(items, list) and len(items) > 0:
        if isinstance(items[0], dict):
            items = [item for item in items if str(item.get(filter_field, "")).lower() == str(filter_value).lower()]
        else:
            # For objects, we'll try to access attributes
            items = [item for item in items if hasattr(item, filter_field) and str(getattr(item, filter_field, "")).lower() == str(filter_value).lower()]
    
    # Apply sorting if specified
    if sort_by and isinstance(items, list) and len(items) > 0:
        reverse = sort_direction.lower() == "desc"
        
        if isinstance(items[0], dict):
            # For dictionaries
            items.sort(key=lambda x: x.get(sort_by, ""), reverse=reverse)
        else:
            # For objects, we'll try to access attributes
            items.sort(key=lambda x: getattr(x, sort_by, ""), reverse=reverse)
    
    # Ensure valid page and page_size
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 20
    if page_size > 100:
        page_size = 100  # Maximum page size
    
    # Calculate pagination values
    total_items = len(items)
    total_pages = math.ceil(total_items / page_size) if total_items > 0 else 1
    
    # Adjust page if needed
    if page > total_pages and total_pages > 0:
        page = total_pages
    
    # Calculate slice indices
    start_idx = (page - 1) * page_size
    end_idx = min(start_idx + page_size, total_items)
    
    # Get items for current page
    page_items = items[start_idx:end_idx]
    
    # Create paginated response
    return PaginatedResponse(
        data=page_items,
        page=page,
        page_size=page_size,
        total_items=total_items,
        total_pages=total_pages,
        success=True,
        message=f"Page {page} of {total_pages}"
    )

class SortableField(BaseModel):
    """Model for a sortable field."""
    field: str
    display_name: str
    data_type: str = "string"  # string, number, date, boolean
    sortable: bool = True
    filterable: bool = True
    
class PaginationMetadata(BaseModel):
    """Model for pagination metadata."""
    total_items: int
    total_pages: int
    page: int
    page_size: int
    sortable_fields: List[SortableField] = []
    
    def json_dict(self) -> Dict[str, Any]:
        """Convert to a JSON-serializable dictionary."""
        return {
            "total_items": self.total_items,
            "total_pages": self.total_pages,
            "page": self.page,
            "page_size": self.page_size,
            "sortable_fields": [field.dict() for field in self.sortable_fields]
        }

def get_pagination_links(
    base_url: str,
    page: int,
    page_size: int,
    total_pages: int,
    query_params: Optional[Dict[str, Any]] = None
) -> Dict[str, Optional[str]]:
    """
    Generate pagination links for HATEOAS (Hypermedia as the Engine of Application State).
    
    Args:
        base_url: Base URL for the endpoint
        page: Current page number
        page_size: Number of items per page
        total_pages: Total number of pages
        query_params: Additional query parameters to include
        
    Returns:
        Dictionary with pagination links
    """
    # Initialize query parameters
    params = query_params.copy() if query_params else {}
    
    # Helper function to build URL with query parameters
    def build_url(pg: int) -> str:
        params["page"] = pg
        params["page_size"] = page_size
        query_string = "&".join([f"{k}={v}" for k, v in params.items() if v is not None])
        return f"{base_url}?{query_string}"
    
    # Generate links
    first_page = build_url(1) if total_pages > 0 else None
    last_page = build_url(total_pages) if total_pages > 0 else None
    previous_page = build_url(page - 1) if page > 1 else None
    next_page = build_url(page + 1) if page < total_pages else None
    
    return {
        "first": first_page,
        "last": last_page,
        "previous": previous_page,
        "next": next_page
    } 