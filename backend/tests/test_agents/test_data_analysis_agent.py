"""
Test suite for Data Analysis Agent.
"""

import pytest
import pandas as pd
from unittest.mock import patch, MagicMock
from agents.data_analysis.data_analysis_agent import DataAnalysisAgent


class TestDataAnalysisAgent:
    """Test cases for DataAnalysisAgent."""

    def setup_method(self):
        """Set up test method."""
        self.agent = DataAnalysisAgent(
            name="test_data_analysis_agent",
            model="gpt-4o-mini",
            temperature=0.7,
            max_tokens=1000,
            api_key="test-api-key"
        )
        
        # Tạo dữ liệu mẫu
        self.sample_df = pd.DataFrame({
            'timestamp': pd.date_range(start='2023-01-01', periods=48, freq='H'),
            'value': [100 + i % 20 for i in range(48)]
        })
        self.sample_df.set_index('timestamp', inplace=True)

    @patch("agents.data_analysis.data_analysis_agent.pd.read_csv")
    @patch("agents.base_agent.BaseAgent._run_llm_inference")
    def test_analyze_consumption_patterns(self, mock_run_llm, mock_read_csv):
        """Test analyze_consumption_patterns method."""
        # Mock dữ liệu đầu vào
        mock_read_csv.return_value = self.sample_df.reset_index()
        
        # Mock phản hồi từ LLM
        mock_run_llm.return_value = """
        {
            "daily": {
                "peak_hours": ["09:00", "18:00"],
                "off_peak_hours": ["01:00", "04:00"],
                "average_daily_profile": [100, 110, 105, 110, 115]
            },
            "weekly": {
                "highest_day": "Monday",
                "lowest_day": "Sunday",
                "weekday_weekend_ratio": 1.4
            },
            "seasonal": {
                "summer_average": 120,
                "winter_average": 140,
                "seasonal_variation": 16.7
            }
        }
        """
        
        # Gọi phương thức cần test
        result = self.agent.analyze_consumption_patterns(
            building_id=1,
            data_path="dummy/path.csv",
            start_date="2023-01-01",
            end_date="2023-01-03",
            energy_type="electricity"
        )
        
        # Kiểm tra kết quả
        assert "daily" in result
        assert "weekly" in result
        assert "seasonal" in result
        assert result["daily"]["peak_hours"] == ["09:00", "18:00"]
        assert result["weekly"]["highest_day"] == "Monday"
        assert result["seasonal"]["summer_average"] == 120

    @patch("agents.data_analysis.data_analysis_agent.pd.read_csv")
    @patch("agents.base_agent.BaseAgent._run_llm_inference")
    def test_detect_anomalies(self, mock_run_llm, mock_read_csv):
        """Test detect_anomalies method."""
        # Mock dữ liệu đầu vào
        mock_read_csv.return_value = self.sample_df.reset_index()
        
        # Mock phản hồi từ LLM
        mock_run_llm.return_value = """
        [
            {
                "timestamp": "2023-01-01T14:00:00Z",
                "expected_value": 105.0,
                "actual_value": 135.2,
                "deviation_percentage": 28.8,
                "severity": "medium",
                "possible_causes": ["Unusual occupancy", "Equipment malfunction"]
            },
            {
                "timestamp": "2023-01-02T10:00:00Z",
                "expected_value": 110.5,
                "actual_value": 70.3,
                "deviation_percentage": -36.4,
                "severity": "high",
                "possible_causes": ["Sensor error", "Unexpected shutdown"]
            }
        ]
        """
        
        # Gọi phương thức cần test
        result = self.agent.detect_anomalies(
            building_id=1,
            data_path="dummy/path.csv",
            start_date="2023-01-01",
            end_date="2023-01-03",
            energy_type="electricity",
            sensitivity="medium"
        )
        
        # Kiểm tra kết quả
        assert len(result) == 2
        assert result[0]["timestamp"] == "2023-01-01T14:00:00Z"
        assert result[0]["severity"] == "medium"
        assert result[1]["timestamp"] == "2023-01-02T10:00:00Z"
        assert result[1]["severity"] == "high"
        assert "possible_causes" in result[0]

    @patch("agents.data_analysis.data_analysis_agent.pd.read_csv")
    @patch("agents.data_analysis.data_analysis_agent.requests.get")
    @patch("agents.base_agent.BaseAgent._run_llm_inference")
    def test_correlate_with_weather(self, mock_run_llm, mock_requests, mock_read_csv):
        """Test correlate_with_weather method."""
        # Mock dữ liệu đầu vào
        mock_read_csv.return_value = self.sample_df.reset_index()
        
        # Mock API thời tiết
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "hourly": {
                "time": ["2023-01-01T00:00", "2023-01-01T01:00"],
                "temperature_2m": [25.5, 24.8]
            }
        }
        mock_response.status_code = 200
        mock_requests.return_value = mock_response
        
        # Mock phản hồi từ LLM
        mock_run_llm.return_value = """
        {
            "correlation": {
                "temperature": {
                    "correlation_coefficient": 0.85,
                    "impact": "high",
                    "description": "Strong positive correlation with outdoor temperature"
                },
                "humidity": {
                    "correlation_coefficient": 0.35,
                    "impact": "medium",
                    "description": "Moderate correlation with humidity"
                }
            },
            "sensitivity": {
                "per_degree_celsius": 2.8,
                "unit": "kWh"
            }
        }
        """
        
        # Gọi phương thức cần test
        result = self.agent.correlate_with_weather(
            building_id=1,
            consumption_data_path="dummy/path.csv",
            weather_data_path="dummy/weather.csv",
            start_date="2023-01-01",
            end_date="2023-01-03",
            energy_type="electricity"
        )
        
        # Kiểm tra kết quả
        assert "correlation" in result
        assert "temperature" in result["correlation"]
        assert result["correlation"]["temperature"]["correlation_coefficient"] == 0.85
        assert result["correlation"]["temperature"]["impact"] == "high"
        assert "sensitivity" in result
        assert result["sensitivity"]["per_degree_celsius"] == 2.8

    @patch("agents.data_analysis.data_analysis_agent.pd.read_csv")
    @patch("agents.base_agent.BaseAgent._run_llm_inference")
    def test_compare_buildings(self, mock_run_llm, mock_read_csv):
        """Test compare_buildings method."""
        # Mock dữ liệu đầu vào
        mock_read_csv.return_value = self.sample_df.reset_index()
        
        # Mock phản hồi từ LLM
        mock_run_llm.return_value = """
        {
            "comparison_metrics": {
                "average_daily_consumption": {
                    "building_a": 1250.5,
                    "building_b": 980.2,
                    "difference_percentage": 27.6
                },
                "peak_demand": {
                    "building_a": 175.2,
                    "building_b": 145.8,
                    "difference_percentage": 20.2
                },
                "energy_intensity": {
                    "building_a": 25.0,
                    "building_b": 19.6,
                    "difference_percentage": 27.6,
                    "unit": "kWh/m²"
                }
            },
            "efficiency_ranking": {
                "overall": "building_b",
                "peak_hours": "building_b",
                "off_peak_hours": "building_a",
                "weekends": "tie"
            },
            "recommendations": [
                "Building A should optimize HVAC scheduling similar to Building B",
                "Building B could improve weekend energy management from Building A's practices"
            ]
        }
        """
        
        # Gọi phương thức cần test
        result = self.agent.compare_buildings(
            building_ids=[1, 2],
            data_paths=["dummy/path1.csv", "dummy/path2.csv"],
            start_date="2023-01-01",
            end_date="2023-01-03",
            energy_type="electricity",
            normalization="area"
        )
        
        # Kiểm tra kết quả
        assert "comparison_metrics" in result
        assert "average_daily_consumption" in result["comparison_metrics"]
        assert result["comparison_metrics"]["average_daily_consumption"]["building_a"] == 1250.5
        assert "efficiency_ranking" in result
        assert result["efficiency_ranking"]["overall"] == "building_b"
        assert "recommendations" in result
        assert len(result["recommendations"]) == 2 
        
    @patch("agents.data_analysis.data_analysis_agent.pd.read_csv")
    @patch("agents.data_analysis.data_analysis_agent.Prophet")
    def test_forecast_consumption_prophet(self, mock_prophet, mock_read_csv):
        """Test forecast_consumption method with Prophet model."""
        # Mock dữ liệu đầu vào
        mock_read_csv.return_value = self.sample_df.reset_index()
        
        # Mock Prophet model
        mock_prophet_instance = MagicMock()
        mock_prophet_instance.seasonalities = {"daily": None, "weekly": None}
        mock_prophet_instance.make_future_dataframe.return_value = pd.DataFrame({
            'ds': pd.date_range(start='2023-01-03', periods=24, freq='H')
        })
        mock_prophet_instance.predict.return_value = pd.DataFrame({
            'ds': pd.date_range(start='2023-01-03', periods=24, freq='H'),
            'yhat': [120 + i % 20 for i in range(24)],
            'yhat_lower': [110 + i % 20 for i in range(24)],
            'yhat_upper': [130 + i % 20 for i in range(24)]
        })
        mock_prophet.return_value = mock_prophet_instance
        
        # Gọi phương thức cần test
        result = self.agent.forecast_consumption(
            building_id=1,
            data_path="dummy/path.csv",
            start_date="2023-01-01",
            end_date="2023-01-03",
            energy_type="electricity",
            forecast_horizon=24,
            model_type="prophet",
            include_weather=True
        )
        
        # Kiểm tra kết quả
        assert "forecast" in result
        assert "model_type" in result
        assert result["model_type"] == "prophet"
        assert "period_start" in result
        assert "period_end" in result
        assert len(result["forecast"]) == 24
        
        # Verify các phương thức của Prophet được gọi
        mock_prophet.assert_called_once()
        mock_prophet_instance.fit.assert_called_once()
        mock_prophet_instance.make_future_dataframe.assert_called_once()
        mock_prophet_instance.predict.assert_called_once()
    
    @patch("agents.data_analysis.data_analysis_agent.pd.read_csv")
    @patch("agents.data_analysis.data_analysis_agent.torch")
    @patch("agents.data_analysis.data_analysis_agent.TimeSeriesTransformerConfig")
    @patch("agents.data_analysis.data_analysis_agent.AutoformerForPrediction")
    def test_forecast_consumption_autoformer(self, mock_autoformer, mock_config, mock_torch, mock_read_csv):
        """Test forecast_consumption method with Autoformer model."""
        # Mock dữ liệu đầu vào
        mock_read_csv.return_value = self.sample_df.reset_index()
        
        # Mock các module và lớp cần thiết
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance
        
        mock_model = MagicMock()
        mock_autoformer.return_value = mock_model
        
        # Mock output từ model
        mock_outputs = MagicMock()
        mock_sequences = MagicMock()
        mock_sequences.mean.return_value = MagicMock()
        mock_sequences.mean.return_value.squeeze.return_value = MagicMock()
        mock_sequences.mean.return_value.squeeze.return_value.numpy.return_value = [120 + i % 20 for i in range(24)]
        mock_outputs.sequences = mock_sequences
        mock_model.return_value = mock_outputs
        
        # Mock torch.no_grad context
        mock_torch.no_grad.return_value.__enter__.return_value = None
        mock_torch.tensor.return_value = MagicMock()
        
        # Gọi phương thức cần test
        result = self.agent.forecast_consumption(
            building_id=1,
            data_path="dummy/path.csv",
            start_date="2023-01-01",
            end_date="2023-01-03",
            energy_type="electricity",
            forecast_horizon=24,
            model_type="autoformer",
            include_weather=False
        )
        
        # Kiểm tra kết quả
        assert "forecast" in result
        assert "model_type" in result
        assert result["model_type"] == "autoformer"
        assert "period_start" in result
        assert "period_end" in result
        assert "model_components" in result
        assert result["model_components"]["architecture"] == "autoformer"
    
    @patch("agents.data_analysis.data_analysis_agent.pd.read_csv")
    @patch("agents.data_analysis.data_analysis_agent.torch")
    @patch("agents.data_analysis.data_analysis_agent.TimeSeriesTransformerConfig")
    @patch("agents.data_analysis.data_analysis_agent.InformerForPrediction")
    def test_forecast_consumption_informer(self, mock_informer, mock_config, mock_torch, mock_read_csv):
        """Test forecast_consumption method with Informer model."""
        # Mock dữ liệu đầu vào
        mock_read_csv.return_value = self.sample_df.reset_index()
        
        # Mock các module và lớp cần thiết
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance
        
        mock_model = MagicMock()
        mock_informer.return_value = mock_model
        
        # Mock output từ model
        mock_outputs = MagicMock()
        mock_sequences = MagicMock()
        mock_sequences.mean.return_value = MagicMock()
        mock_sequences.mean.return_value.squeeze.return_value = MagicMock()
        mock_sequences.mean.return_value.squeeze.return_value.numpy.return_value = [120 + i % 20 for i in range(24)]
        mock_outputs.sequences = mock_sequences
        mock_model.return_value = mock_outputs
        
        # Mock torch.no_grad context
        mock_torch.no_grad.return_value.__enter__.return_value = None
        mock_torch.tensor.return_value = MagicMock()
        
        # Gọi phương thức cần test
        result = self.agent.forecast_consumption(
            building_id=1,
            data_path="dummy/path.csv",
            start_date="2023-01-01",
            end_date="2023-01-03",
            energy_type="electricity",
            forecast_horizon=24,
            model_type="informer",
            include_weather=False
        )
        
        # Kiểm tra kết quả
        assert "forecast" in result
        assert "model_type" in result
        assert result["model_type"] == "informer"
        assert "period_start" in result
        assert "period_end" in result
        assert "model_components" in result
        assert result["model_components"]["architecture"] == "informer"
        
    @patch("agents.data_analysis.data_analysis_agent.pd.read_csv")
    def test_forecast_consumption_invalid_model(self, mock_read_csv):
        """Test forecast_consumption method with invalid model type."""
        # Mock dữ liệu đầu vào
        mock_read_csv.return_value = self.sample_df.reset_index()
        
        # Kiểm tra xem có raise ValueError khi model type không hợp lệ
        with pytest.raises(ValueError) as excinfo:
            self.agent.forecast_consumption(
                building_id=1,
                data_path="dummy/path.csv",
                model_type="invalid_model"
            )
        
        # Kiểm tra thông báo lỗi
        assert "Unsupported model type" in str(excinfo.value) 