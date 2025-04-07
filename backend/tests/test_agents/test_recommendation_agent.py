"""
Test suite for Recommendation Agent.
"""

import pytest
import json
from unittest.mock import patch, MagicMock
from agents.recommendation.recommendation_agent import RecommendationAgent


class TestRecommendationAgent:
    """Test cases for RecommendationAgent."""

    def setup_method(self):
        """Set up test method."""
        self.agent = RecommendationAgent(
            name="test_recommendation_agent",
            model="gpt-4o-mini",
            temperature=0.7,
            max_tokens=1000,
            api_key="test-api-key"
        )

    @patch("agents.base_agent.BaseAgent._run_llm_inference")
    def test_generate_recommendations(self, mock_run_llm):
        """Test generate_recommendations method."""
        # Tạo mock phân tích năng lượng
        analysis_results = {
            "consumption_patterns": {
                "daily": {
                    "peak_hours": ["09:00", "14:00"],
                    "off_peak_hours": ["01:00", "04:00"]
                },
                "weekly": {
                    "highest_day": "Tuesday",
                    "lowest_day": "Sunday"
                }
            },
            "anomalies": [
                {
                    "timestamp": "2023-01-15T14:00:00Z",
                    "expected_value": 120.5,
                    "actual_value": 175.2,
                    "severity": "high"
                }
            ],
            "weather_correlation": {
                "temperature": {
                    "correlation_coefficient": 0.82,
                    "impact": "high"
                }
            }
        }
        
        # Mock phản hồi từ LLM
        mock_run_llm.return_value = """
        [
            {
                "id": "rec-001",
                "title": "Adjust HVAC Scheduling",
                "description": "Optimize HVAC operation hours to match actual building occupancy patterns",
                "implementation_details": "Adjust BMS scheduling to turn on HVAC 30 minutes before occupancy and shut down 30 minutes before building closure.",
                "energy_type": "electricity",
                "estimated_savings": {
                    "percentage": 12.5,
                    "kwh": 45000,
                    "cost": 5400
                },
                "implementation": {
                    "difficulty": "easy",
                    "cost": "low",
                    "timeframe": "immediate"
                },
                "priority": "high"
            },
            {
                "id": "rec-002",
                "title": "Address Anomalous Consumption",
                "description": "Investigate and fix the recurring high consumption during Tuesday afternoons",
                "implementation_details": "Check HVAC settings and equipment operation during peak hours. Consider load shedding strategies.",
                "energy_type": "electricity",
                "estimated_savings": {
                    "percentage": 5.8,
                    "kwh": 21000,
                    "cost": 2520
                },
                "implementation": {
                    "difficulty": "medium",
                    "cost": "low",
                    "timeframe": "short-term"
                },
                "priority": "medium"
            }
        ]
        """
        
        # Gọi phương thức cần test
        result = self.agent.generate_recommendations(
            analysis_results=analysis_results,
            user_role="facility_manager"
        )
        
        # Kiểm tra kết quả
        assert len(result) == 2
        assert result[0]["id"] == "rec-001"
        assert result[0]["title"] == "Adjust HVAC Scheduling"
        assert result[0]["priority"] == "high"
        assert result[1]["id"] == "rec-002"
        assert "implementation_details" in result[0]
        assert "estimated_savings" in result[0]
        assert result[0]["estimated_savings"]["percentage"] == 12.5

    @patch("agents.base_agent.BaseAgent._run_llm_inference")
    def test_prioritize_recommendations(self, mock_run_llm):
        """Test prioritize_recommendations method."""
        # Tạo danh sách khuyến nghị
        recommendations = [
            {
                "id": "rec-001",
                "title": "Adjust HVAC Scheduling",
                "estimated_savings": {"percentage": 12.5, "cost": 5400},
                "implementation": {"difficulty": "easy", "cost": "low"},
                "priority": "medium"
            },
            {
                "id": "rec-002",
                "title": "Lighting Retrofit",
                "estimated_savings": {"percentage": 15.0, "cost": 6300},
                "implementation": {"difficulty": "medium", "cost": "high"},
                "priority": "low"
            },
            {
                "id": "rec-003",
                "title": "Server Room Cooling Optimization",
                "estimated_savings": {"percentage": 8.0, "cost": 3200},
                "implementation": {"difficulty": "medium", "cost": "low"},
                "priority": "low"
            }
        ]
        
        # Mock phản hồi từ LLM
        mock_run_llm.return_value = """
        [
            {
                "id": "rec-001",
                "title": "Adjust HVAC Scheduling",
                "priority": "high",
                "rationale": "High savings with low cost and easy implementation"
            },
            {
                "id": "rec-003",
                "title": "Server Room Cooling Optimization",
                "priority": "medium",
                "rationale": "Moderate savings with low cost and medium difficulty"
            },
            {
                "id": "rec-002",
                "title": "Lighting Retrofit",
                "priority": "low",
                "rationale": "High savings but high cost and medium difficulty"
            }
        ]
        """
        
        # Gọi phương thức cần test
        result = self.agent.prioritize_recommendations(
            recommendations=recommendations,
            constraints={"budget": "limited", "implementation_time": "short-term"}
        )
        
        # Kiểm tra kết quả
        assert len(result) == 3
        assert result[0]["id"] == "rec-001"
        assert result[0]["priority"] == "high"
        assert result[1]["id"] == "rec-003"
        assert result[1]["priority"] == "medium"
        assert result[2]["id"] == "rec-002"
        assert result[2]["priority"] == "low"
        assert "rationale" in result[0]

    @patch("agents.base_agent.BaseAgent._run_llm_inference")
    def test_generate_implementation_plan(self, mock_run_llm):
        """Test generate_implementation_plan method."""
        # Tạo khuyến nghị mẫu
        recommendation = {
            "id": "rec-001",
            "title": "Adjust HVAC Scheduling",
            "description": "Optimize HVAC operation hours to match actual building occupancy patterns",
            "implementation_details": "Adjust BMS scheduling",
            "energy_type": "electricity",
            "estimated_savings": {"percentage": 12.5},
            "implementation": {"difficulty": "easy", "cost": "low"},
            "priority": "high"
        }
        
        # Mock phản hồi từ LLM
        mock_run_llm.return_value = """
        {
            "steps": [
                {
                    "step_number": 1,
                    "description": "Review current HVAC schedules in BMS",
                    "responsible": "Facility Manager",
                    "duration": "1 day",
                    "resources_needed": ["BMS access"]
                },
                {
                    "step_number": 2,
                    "description": "Analyze building occupancy patterns",
                    "responsible": "Energy Analyst",
                    "duration": "2 days",
                    "resources_needed": ["Occupancy data", "Energy consumption data"]
                },
                {
                    "step_number": 3,
                    "description": "Create new HVAC schedule",
                    "responsible": "Facility Manager",
                    "duration": "1 day",
                    "resources_needed": ["BMS access", "Occupancy analysis"]
                },
                {
                    "step_number": 4,
                    "description": "Implement and test new schedule",
                    "responsible": "Facility Manager",
                    "duration": "1 week",
                    "resources_needed": ["BMS access"]
                },
                {
                    "step_number": 5,
                    "description": "Monitor and adjust as needed",
                    "responsible": "Facility Manager",
                    "duration": "2 weeks",
                    "resources_needed": ["Energy monitoring system"]
                }
            ],
            "timeline": {
                "total_duration": "4 weeks",
                "key_milestones": [
                    {"name": "Schedule creation", "week": 1},
                    {"name": "Implementation complete", "week": 2},
                    {"name": "Verification complete", "week": 4}
                ]
            },
            "resources": {
                "personnel": ["Facility Manager", "Energy Analyst"],
                "tools": ["BMS system", "Energy monitoring system"],
                "cost_breakdown": {
                    "labor_hours": 24,
                    "equipment": 0,
                    "total_estimated_cost": 1200
                }
            }
        }
        """
        
        # Gọi phương thức cần test
        result = self.agent.generate_implementation_plan(
            recommendation=recommendation,
            building_info={"name": "Office Building A", "type": "Office"}
        )
        
        # Kiểm tra kết quả
        assert "steps" in result
        assert len(result["steps"]) == 5
        assert result["steps"][0]["step_number"] == 1
        assert "timeline" in result
        assert result["timeline"]["total_duration"] == "4 weeks"
        assert "resources" in result
        assert "personnel" in result["resources"]
        assert "Facility Manager" in result["resources"]["personnel"]

    @patch("agents.base_agent.BaseAgent._run_llm_inference")
    def test_estimate_recommendation_savings(self, mock_run_llm):
        """Test estimate_recommendation_savings method."""
        # Tạo khuyến nghị mẫu
        recommendation = {
            "id": "rec-001",
            "title": "Adjust HVAC Scheduling",
            "description": "Optimize HVAC operation hours",
            "energy_type": "electricity"
        }
        
        # Tạo dữ liệu tiêu thụ mẫu
        consumption_data = {
            "building_id": 1,
            "type": "electricity",
            "unit": "kWh",
            "data": [
                {"timestamp": "2023-01-01T00:00:00Z", "value": 1250.5},
                {"timestamp": "2023-01-02T00:00:00Z", "value": 1180.2},
                {"timestamp": "2023-01-03T00:00:00Z", "value": 1210.8}
            ]
        }
        
        # Mock phản hồi từ LLM
        mock_run_llm.return_value = """
        {
            "estimated_savings": {
                "percentage": 12.5,
                "kwh_per_day": 150,
                "kwh_per_year": 54750,
                "cost_per_year": 6570,
                "co2_reduction_tons_per_year": 21.9
            },
            "payback_period": {
                "months": 1.8,
                "roi_percentage": 548
            },
            "confidence_level": "high",
            "methodology": "Based on typical savings from similar buildings with schedule optimization",
            "variables": {
                "electricity_rate": 0.12,
                "implementation_cost": 1000
            }
        }
        """
        
        # Gọi phương thức cần test
        result = self.agent.estimate_recommendation_savings(
            recommendation=recommendation,
            consumption_data=consumption_data,
            building_info={"name": "Office Building A", "type": "Office", "area": 50000}
        )
        
        # Kiểm tra kết quả
        assert "estimated_savings" in result
        assert result["estimated_savings"]["percentage"] == 12.5
        assert result["estimated_savings"]["kwh_per_year"] == 54750
        assert "payback_period" in result
        assert result["payback_period"]["months"] == 1.8
        assert "confidence_level" in result
        assert result["confidence_level"] == "high"

    @patch("agents.base_agent.BaseAgent._run_llm_inference")
    def test_adapt_for_user_role(self, mock_run_llm):
        """Test adapt_for_user_role method."""
        # Tạo một danh sách khuyến nghị
        recommendations = [
            {
                "id": "rec-001",
                "title": "Adjust HVAC Scheduling",
                "description": "Optimize HVAC operation hours",
                "energy_type": "electricity",
                "estimated_savings": {"percentage": 12.5, "cost": 5400},
                "implementation": {"difficulty": "easy", "cost": "low"},
                "priority": "high"
            },
            {
                "id": "rec-002",
                "title": "Lighting Retrofit",
                "description": "Replace T8 fluorescent lights with LED",
                "energy_type": "electricity",
                "estimated_savings": {"percentage": 15.0, "cost": 6300},
                "implementation": {"difficulty": "medium", "cost": "high"},
                "priority": "medium"
            }
        ]
        
        # Mock phản hồi từ LLM để vai trò quản lý cơ sở
        mock_run_llm.return_value = """
        [
            {
                "id": "rec-001",
                "title": "Adjust HVAC Scheduling",
                "description": "Optimize HVAC operation hours",
                "action_items": [
                    "Review BMS scheduling interface",
                    "Update schedule to align with occupancy",
                    "Monitor temperature complaints for one week"
                ],
                "key_metrics": [
                    "Daily electricity usage",
                    "Temperature compliance",
                    "Occupant comfort"
                ],
                "estimated_savings": "$5,400 annually",
                "implementation_timeframe": "Can be completed within 1 day"
            },
            {
                "id": "rec-002",
                "title": "Lighting Retrofit",
                "description": "Replace T8 fluorescent lights with LED",
                "action_items": [
                    "Inventory existing fixtures",
                    "Contact approved vendors for quotes",
                    "Schedule installation during off-hours"
                ],
                "key_metrics": [
                    "Lighting electricity usage",
                    "Light levels (lux)",
                    "Installation cost vs budget"
                ],
                "estimated_savings": "$6,300 annually",
                "implementation_timeframe": "4-6 weeks for complete retrofit"
            }
        ]
        """
        
        # Gọi phương thức cần test cho quản lý cơ sở
        result = self.agent.adapt_for_user_role(
            recommendations=recommendations,
            user_role="facility_manager"
        )
        
        # Kiểm tra kết quả
        assert len(result) == 2
        assert result[0]["id"] == "rec-001"
        assert "action_items" in result[0]
        assert "key_metrics" in result[0]
        assert "implementation_timeframe" in result[0]
        
        # Mock phản hồi từ LLM cho vai trò quản lý cấp cao
        mock_run_llm.return_value = """
        [
            {
                "id": "rec-001",
                "title": "Adjust HVAC Scheduling",
                "business_impact": "Immediate cost reduction with no capital investment",
                "financial_metrics": {
                    "annual_savings": "$5,400",
                    "roi": "540%",
                    "payback_period": "Immediate"
                },
                "implementation_overview": "Simple scheduling change requiring minimal staff time",
                "strategic_alignment": "Supports corporate sustainability goals with no impact on operations"
            },
            {
                "id": "rec-002",
                "title": "Lighting Retrofit",
                "business_impact": "Significant energy reduction with improved workplace lighting",
                "financial_metrics": {
                    "annual_savings": "$6,300",
                    "roi": "26%",
                    "payback_period": "46 months"
                },
                "implementation_overview": "Capital project requiring contractor coordination",
                "strategic_alignment": "Advances sustainability goals and workplace improvement initiatives"
            }
        ]
        """
        
        # Gọi phương thức cần test cho quản lý cấp cao
        result = self.agent.adapt_for_user_role(
            recommendations=recommendations,
            user_role="executive"
        )
        
        # Kiểm tra kết quả
        assert len(result) == 2
        assert result[0]["id"] == "rec-001"
        assert "business_impact" in result[0]
        assert "financial_metrics" in result[0]
        assert "strategic_alignment" in result[0] 