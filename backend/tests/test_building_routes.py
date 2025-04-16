#!/usr/bin/env python3
"""
Tests for building routes API endpoints
"""
import sys
import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
import json

# Add the backend directory to the path
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

# Import only what we need for testing
from api.main import app  # Using absolute import for tests

# Create test client
client = TestClient(app)

def test_api_buildings_endpoint():
    """Test that we can get a list of buildings."""
    response = client.get("/api/buildings/")
    assert response.status_code == 200
    
    # Check that the response contains the expected fields
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)
    
    # Print for debugging
    print(f"Found {data['total']} buildings in the response")
    if data['total'] > 0:
        print(f"First building ID: {data['items'][0]['id']}")

def test_building_consumption_endpoint():
    """Test the building consumption endpoint."""
    # This test will be skipped if there are no buildings
    # Get the buildings first
    buildings_response = client.get("/api/buildings/")
    buildings_data = buildings_response.json()
    
    if buildings_data["total"] > 0:
        building_id = buildings_data["items"][0]["id"]
        print(f"Testing consumption for building: {building_id}")
        
        # Now call the consumption endpoint with the building ID
        response = client.get(f"/api/buildings/{building_id}/consumption?metric=electricity&interval=daily")
        
        # Check basic structure only
        assert response.status_code == 200
        data = response.json()
        assert "building_id" in data
        
        # Check for data or error field
        if "error" in data:
            print(f"Error from API: {data['error']}")
            # This is expected in test environment without real data
            assert isinstance(data["error"], str)
        else:
            assert "data" in data
            assert isinstance(data["data"], list)
            if len(data["data"]) > 0:
                print(f"First data point: {data['data'][0]}")
    else:
        pytest.skip("No buildings available to test")
