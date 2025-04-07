"""
Pytest configuration for Energy AI Optimizer.
Contains fixtures and configurations for tests.
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import mongomock
import redis
from dotenv import load_dotenv

# Thêm thư mục gốc của project vào PYTHONPATH để import các modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Load biến môi trường từ .env nếu có
load_dotenv()

# Import các modules sau khi đã thêm thư mục gốc vào PYTHONPATH
from backend.api.main import app
from backend.agents.data_analysis.data_analysis_agent import DataAnalysisAgent
from backend.agents.recommendation.recommendation_agent import RecommendationAgent
from backend.agents.forecasting.forecasting_agent import ForecastingAgent
from backend.agents.commander.commander_agent import CommanderAgent
from backend.agents.memory.memory_agent import MemoryAgent
from backend.agents.evaluator.evaluator_agent import EvaluatorAgent
from backend.agents.adapter.adapter_agent import AdapterAgent


@pytest.fixture
def test_client():
    """
    Fixture trả về TestClient cho FastAPI.
    """
    with TestClient(app) as client:
        yield client


@pytest.fixture
def mock_mongodb():
    """
    Fixture để mock MongoDB, sử dụng mongomock.
    """
    mongo_client = mongomock.MongoClient()
    db = mongo_client["energy-ai-optimizer"]
    return db


@pytest.fixture
def mock_redis():
    """
    Fixture để mock Redis.
    """
    mock_redis_client = MagicMock()
    mock_redis_client.get.return_value = None
    mock_redis_client.set.return_value = True
    return mock_redis_client


@pytest.fixture
def mock_openai():
    """
    Fixture để mock OpenAI API.
    """
    with patch("openai.ChatCompletion.create") as mock_create:
        mock_create.return_value = {
            "choices": [
                {
                    "message": {
                        "content": "Nội dung trả về từ mock OpenAI",
                        "role": "assistant"
                    },
                    "finish_reason": "stop",
                    "index": 0
                }
            ],
            "created": 1677664795,
            "id": "mock-id",
            "model": "gpt-4o-mini",
            "object": "chat.completion",
            "usage": {
                "completion_tokens": 17,
                "prompt_tokens": 57,
                "total_tokens": 74
            }
        }
        yield mock_create


@pytest.fixture
def mock_data_analysis_agent():
    """
    Fixture để mock DataAnalysisAgent.
    """
    agent = MagicMock(spec=DataAnalysisAgent)
    agent.analyze_consumption_patterns.return_value = {
        "daily": {"peak_hours": ["09:00", "14:00"]},
        "weekly": {"highest_day": "Tuesday"},
        "seasonal": {"summer_average": 1400}
    }
    agent.detect_anomalies.return_value = [
        {
            "timestamp": "2023-01-15T14:00:00Z",
            "expected_value": 120.5,
            "actual_value": 175.2,
            "severity": "high"
        }
    ]
    return agent


@pytest.fixture
def mock_recommendation_agent():
    """
    Fixture để mock RecommendationAgent.
    """
    agent = MagicMock(spec=RecommendationAgent)
    agent.generate_recommendations.return_value = [
        {
            "id": "rec-001",
            "title": "Adjust HVAC Scheduling",
            "description": "Optimize HVAC operation hours",
            "estimated_savings": {"percentage": 12.5},
            "priority": "high"
        }
    ]
    return agent


@pytest.fixture
def mock_forecasting_agent():
    """
    Fixture để mock ForecastingAgent.
    """
    agent = MagicMock(spec=ForecastingAgent)
    agent.provide_forecast.return_value = {
        "data": [
            {"timestamp": "2023-04-01T00:00:00Z", "predicted_value": 78.5}
        ],
        "total_predicted_consumption": 35420
    }
    return agent


@pytest.fixture
def mock_commander_agent():
    """
    Fixture để mock CommanderAgent.
    """
    agent = MagicMock(spec=CommanderAgent)
    agent.route_query.return_value = {
        "answer": "Kết quả phân tích cho tòa nhà A",
        "confidence": 0.92
    }
    return agent


@pytest.fixture
def mock_memory_agent():
    """
    Fixture để mock MemoryAgent.
    """
    agent = MagicMock(spec=MemoryAgent)
    agent.store_analysis_result.return_value = "m1e2m3o4"
    agent.retrieve_building_history.return_value = {
        "consumption_patterns": [{"daily": {"peak_hours": ["09:00"]}}],
        "anomalies": [{"timestamp": "2023-01-15T14:00:00Z"}]
    }
    return agent


@pytest.fixture
def mock_evaluator_agent():
    """
    Fixture để mock EvaluatorAgent.
    """
    agent = MagicMock(spec=EvaluatorAgent)
    agent.evaluate_recommendation_outcome.return_value = {
        "savings": {"percentage": 14, "normalized_for_weather": 13.2},
        "roi": {"payback_period_months": 1}
    }
    return agent


@pytest.fixture
def mock_adapter_agent():
    """
    Fixture để mock AdapterAgent.
    """
    agent = MagicMock(spec=AdapterAgent)
    agent.fetch_weather_data.return_value = {
        "temperature": 25.5,
        "humidity": 60,
        "conditions": "clear"
    }
    agent.fetch_building_data.return_value = {
        "temperature": 22.0,
        "humidity": 45,
        "co2": 650,
        "electricity": 120.5
    }
    return agent


@pytest.fixture
def sample_building_data():
    """
    Fixture để cung cấp dữ liệu mẫu của tòa nhà.
    """
    return {
        "id": 1,
        "name": "Office Building A",
        "location": "New York",
        "type": "Office",
        "area": 50000,
        "year_built": 2005
    }


@pytest.fixture
def sample_consumption_data():
    """
    Fixture để cung cấp dữ liệu mẫu về tiêu thụ năng lượng.
    """
    return [
        {"timestamp": "2023-01-01T00:00:00Z", "value": 1250.5},
        {"timestamp": "2023-01-02T00:00:00Z", "value": 1180.2},
        {"timestamp": "2023-01-03T00:00:00Z", "value": 1210.8},
        {"timestamp": "2023-01-04T00:00:00Z", "value": 1195.3},
        {"timestamp": "2023-01-05T00:00:00Z", "value": 1220.1}
    ] 