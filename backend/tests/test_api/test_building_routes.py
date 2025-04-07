"""
Test suite for Building API endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os

# Overriding mocks
from backend.api.routes import building_routes

# Create our own fixtures to override API behavior for tests
@pytest.fixture(autouse=True)
def override_dependencies():
    """Override the building API dependencies with mocks for testing."""
    
    # Mock data for buildings
    mock_buildings = [
        {
            "id": 1,
            "name": "Office Building A",
            "location": "New York",
            "type": "Office",
            "area": 50000,
            "year_built": 2005
        },
        {
            "id": 2,
            "name": "Office Building B",
            "location": "Boston",
            "type": "Office",
            "area": 45000,
            "year_built": 2010
        }
    ]
    
    # Mock data for a specific building
    mock_building = {
        "id": 1,
        "name": "Office Building A",
        "location": "New York",
        "type": "Office",
        "area": 50000,
        "year_built": 2005,
        "floors": 12,
        "occupancy": 1200,
        "operation_hours": "8:00-18:00",
        "systems": [
            {
                "type": "HVAC",
                "details": "Central system with chillers"
            },
            {
                "type": "Lighting",
                "details": "LED with motion sensors"
            }
        ]
    }
    
    # Mock consumption data
    mock_consumption = {
        "data": [
            {"timestamp": "2023-01-01T00:00:00Z", "value": 1250.5},
            {"timestamp": "2023-01-02T00:00:00Z", "value": 1180.2},
            {"timestamp": "2023-01-03T00:00:00Z", "value": 1210.8},
            {"timestamp": "2023-01-04T00:00:00Z", "value": 1195.3},
            {"timestamp": "2023-01-05T00:00:00Z", "value": 1220.1}
        ]
    }
    
    # Store original functions
    original_get_buildings = building_routes.get_buildings_from_db
    original_get_building = building_routes.get_building_by_id
    original_get_consumption = building_routes.get_building_consumption
    original_create_building = building_routes.create_building
    original_update_building = building_routes.update_building
    original_delete_building = building_routes.delete_building
    
    # Override functions with mocks for testing
    def mock_get_buildings_from_db():
        return mock_buildings
    
    def mock_get_building_by_id(building_id):
        if building_id == 1:
            return mock_building
        return None
    
    def mock_get_building_consumption(building_id, **kwargs):
        if building_id == 1:
            return mock_consumption
        return {"data": []}
    
    def mock_create_building(building_data):
        new_building = dict(building_data)
        new_building["id"] = 3  # Test expects id 3
        return new_building
    
    def mock_update_building(building_id, building_data):
        if building_id == 1:
            updated = dict(mock_building)
            updated.update(building_data)
            return updated
        return None
    
    def mock_delete_building(building_id):
        return building_id == 1  # Returns True if building_id is 1, otherwise False
    
    # Apply mock functions
    building_routes.get_buildings_from_db = mock_get_buildings_from_db
    building_routes.get_building_by_id = mock_get_building_by_id
    building_routes.get_building_consumption = mock_get_building_consumption
    building_routes.create_building = mock_create_building
    building_routes.update_building = mock_update_building
    building_routes.delete_building = mock_delete_building
    
    yield
    
    # Restore original functions
    building_routes.get_buildings_from_db = original_get_buildings
    building_routes.get_building_by_id = original_get_building
    building_routes.get_building_consumption = original_get_consumption
    building_routes.create_building = original_create_building
    building_routes.update_building = original_update_building
    building_routes.delete_building = original_delete_building


class TestBuildingRoutes:
    """Test cases for building routes."""

    @pytest.fixture(autouse=True)
    def setup(self, test_client):
        """Set up test case."""
        self.client = test_client

    @patch("api.routes.building_routes.get_buildings_from_db")
    def test_get_buildings(self, mock_get_buildings):
        """Test get_buildings endpoint."""
        # Mock dữ liệu trả về từ database
        mock_get_buildings.return_value = [
            {
                "id": 1,
                "name": "Office Building A",
                "location": "New York",
                "type": "Office",
                "area": 50000,
                "year_built": 2005
            },
            {
                "id": 2,
                "name": "Office Building B",
                "location": "Boston",
                "type": "Office",
                "area": 45000,
                "year_built": 2010
            }
        ]
        
        # Gọi API endpoint
        response = self.client.get("/api/buildings")
        
        # Kiểm tra kết quả
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) == 2
        assert data["items"][0]["id"] == 1
        assert data["items"][0]["name"] == "Office Building A"
        assert data["items"][1]["id"] == 2
        assert data["items"][1]["name"] == "Office Building B"
        assert "total" in data
        
        # Kiểm tra mock function được gọi với đúng tham số
        mock_get_buildings.assert_called_once()

    @patch("api.routes.building_routes.get_building_by_id")
    def test_get_building(self, mock_get_building):
        """Test get_building endpoint."""
        # Mock dữ liệu trả về từ database
        mock_get_building.return_value = {
            "id": 1,
            "name": "Office Building A",
            "location": "New York",
            "type": "Office",
            "area": 50000,
            "year_built": 2005,
            "floors": 12,
            "occupancy": 1200,
            "operation_hours": "8:00-18:00",
            "systems": [
                {
                    "type": "HVAC",
                    "details": "Central system with chillers"
                },
                {
                    "type": "Lighting",
                    "details": "LED with motion sensors"
                }
            ]
        }
        
        # Gọi API endpoint
        response = self.client.get("/api/buildings/1")
        
        # Kiểm tra kết quả
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["name"] == "Office Building A"
        assert data["floors"] == 12
        assert len(data["systems"]) == 2
        assert data["systems"][0]["type"] == "HVAC"
        
        # Kiểm tra mock function được gọi với đúng tham số
        mock_get_building.assert_called_once_with(1)

    @patch("api.routes.building_routes.get_building_by_id")
    def test_get_building_not_found(self, mock_get_building):
        """Test get_building endpoint with non-existent ID."""
        # Mock không tìm thấy tòa nhà
        mock_get_building.return_value = None
        
        # Gọi API endpoint
        response = self.client.get("/api/buildings/999")
        
        # Kiểm tra kết quả
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower()
        
        # Kiểm tra mock function được gọi với đúng tham số
        mock_get_building.assert_called_once_with(999)

    @patch("api.routes.building_routes.get_building_consumption")
    @patch("api.routes.building_routes.get_building_by_id")
    def test_get_building_consumption(self, mock_get_building, mock_get_consumption):
        """Test get_building_consumption endpoint."""
        # Mock dữ liệu tòa nhà
        mock_get_building.return_value = {
            "id": 1,
            "name": "Office Building A"
        }
        
        # Mock dữ liệu tiêu thụ
        mock_get_consumption.return_value = {
            "data": [
                {"timestamp": "2023-01-01T00:00:00Z", "value": 1250.5},
                {"timestamp": "2023-01-02T00:00:00Z", "value": 1180.2},
                {"timestamp": "2023-01-03T00:00:00Z", "value": 1210.8},
                {"timestamp": "2023-01-04T00:00:00Z", "value": 1195.3},
                {"timestamp": "2023-01-05T00:00:00Z", "value": 1220.1}
            ]
        }
        
        # Gọi API endpoint
        response = self.client.get(
            "/api/buildings/1/consumption?start_date=2023-01-01&end_date=2023-01-05&interval=daily&type=electricity"
        )
        
        # Kiểm tra kết quả
        assert response.status_code == 200
        data = response.json()
        assert data["building_id"] == 1
        assert data["building_name"] == "Office Building A"
        assert "data" in data
        assert len(data["data"]) == 5
        assert data["data"][0]["timestamp"] == "2023-01-01T00:00:00Z"
        assert data["data"][0]["value"] == 1250.5
        
        # Kiểm tra mock function được gọi với đúng tham số
        mock_get_building.assert_called_once_with(1)
        mock_get_consumption.assert_called_once_with(
            building_id=1,
            start_date="2023-01-01",
            end_date="2023-01-05",
            interval="daily",
            energy_type="electricity"
        )

    @patch("api.routes.building_routes.get_building_by_id")
    def test_get_building_consumption_building_not_found(self, mock_get_building):
        """Test get_building_consumption endpoint with non-existent building ID."""
        # Mock không tìm thấy tòa nhà
        mock_get_building.return_value = None
        
        # Gọi API endpoint
        response = self.client.get(
            "/api/buildings/999/consumption?start_date=2023-01-01&end_date=2023-01-05&interval=daily&type=electricity"
        )
        
        # Kiểm tra kết quả
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower()
        
        # Kiểm tra mock function được gọi với đúng tham số
        mock_get_building.assert_called_once_with(999)

    @patch("api.routes.building_routes.create_building")
    def test_create_building(self, mock_create_building):
        """Test create_building endpoint."""
        # Mock dữ liệu trả về sau khi tạo
        mock_create_building.return_value = {
            "id": 3,
            "name": "New Office Building",
            "location": "Chicago",
            "type": "Office",
            "area": 60000,
            "year_built": 2020
        }
        
        # Dữ liệu để tạo tòa nhà mới
        new_building_data = {
            "name": "New Office Building",
            "location": "Chicago",
            "type": "Office",
            "area": 60000,
            "year_built": 2020
        }
        
        # Gọi API endpoint
        response = self.client.post(
            "/api/buildings",
            json=new_building_data
        )
        
        # Kiểm tra kết quả
        assert response.status_code == 201
        data = response.json()
        assert data["id"] == 3
        assert data["name"] == "New Office Building"
        assert data["location"] == "Chicago"
        
        # Kiểm tra mock function được gọi với đúng tham số
        mock_create_building.assert_called_once_with(new_building_data)

    @patch("api.routes.building_routes.update_building")
    @patch("api.routes.building_routes.get_building_by_id")
    def test_update_building(self, mock_get_building, mock_update_building):
        """Test update_building endpoint."""
        # Mock dữ liệu tòa nhà hiện tại
        mock_get_building.return_value = {
            "id": 1,
            "name": "Office Building A",
            "location": "New York",
            "type": "Office",
            "area": 50000,
            "year_built": 2005
        }
        
        # Mock dữ liệu sau khi cập nhật
        mock_update_building.return_value = {
            "id": 1,
            "name": "Office Building A - Renovated",
            "location": "New York",
            "type": "Office",
            "area": 52000,
            "year_built": 2005,
            "renovation_year": 2023
        }
        
        # Dữ liệu cập nhật
        update_data = {
            "name": "Office Building A - Renovated",
            "area": 52000,
            "renovation_year": 2023
        }
        
        # Gọi API endpoint
        response = self.client.patch(
            "/api/buildings/1",
            json=update_data
        )
        
        # Kiểm tra kết quả
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["name"] == "Office Building A - Renovated"
        assert data["area"] == 52000
        assert data["renovation_year"] == 2023
        
        # Kiểm tra mock function được gọi với đúng tham số
        mock_get_building.assert_called_once_with(1)
        mock_update_building.assert_called_once_with(1, update_data)

    @patch("api.routes.building_routes.get_building_by_id")
    def test_update_building_not_found(self, mock_get_building):
        """Test update_building endpoint with non-existent ID."""
        # Mock không tìm thấy tòa nhà
        mock_get_building.return_value = None
        
        # Dữ liệu cập nhật
        update_data = {
            "name": "Updated Name"
        }
        
        # Gọi API endpoint
        response = self.client.patch(
            "/api/buildings/999",
            json=update_data
        )
        
        # Kiểm tra kết quả
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower()
        
        # Kiểm tra mock function được gọi với đúng tham số
        mock_get_building.assert_called_once_with(999)

    @patch("api.routes.building_routes.delete_building")
    @patch("api.routes.building_routes.get_building_by_id")
    def test_delete_building(self, mock_get_building, mock_delete_building):
        """Test delete_building endpoint."""
        # Mock dữ liệu tòa nhà hiện tại
        mock_get_building.return_value = {
            "id": 1,
            "name": "Office Building A"
        }
        
        # Mock xóa thành công
        mock_delete_building.return_value = True
        
        # Gọi API endpoint
        response = self.client.delete("/api/buildings/1")
        
        # Kiểm tra kết quả
        assert response.status_code == 204
        
        # Kiểm tra mock function được gọi với đúng tham số
        mock_get_building.assert_called_once_with(1)
        mock_delete_building.assert_called_once_with(1)

    @patch("api.routes.building_routes.get_building_by_id")
    def test_delete_building_not_found(self, mock_get_building):
        """Test delete_building endpoint with non-existent ID."""
        # Mock không tìm thấy tòa nhà
        mock_get_building.return_value = None
        
        # Gọi API endpoint
        response = self.client.delete("/api/buildings/999")
        
        # Kiểm tra kết quả
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower()
        
        # Kiểm tra mock function được gọi với đúng tham số
        mock_get_building.assert_called_once_with(999) 