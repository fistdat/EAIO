"""
Forecasting Agent implementation for the Energy AI Optimizer.
"""
from typing import Dict, List, Optional, Any, Union
import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta

from agents.base_agent import BaseAgent
from utils.logging_utils import get_logger

# Get logger
logger = get_logger('eaio.agent.forecasting')

class ForecastingAgent(BaseAgent):
    """
    Forecasting Agent for predicting future energy consumption.
    
    This agent specializes in:
    - Forecasting energy consumption for different time horizons
    - Accounting for factors like weather and building operations
    - Providing uncertainty estimates in predictions
    - Analyzing forecast deviations and anomalies
    """
    
    def __init__(
        self,
        name: str = "ForecastingAgent",
        model: Optional[str] = None,
        temperature: float = 0.3,  # Lower temperature for more precise forecasting guidance
        max_tokens: Optional[int] = 2000,
        api_key: Optional[str] = None,
    ):
        """
        Initialize the Forecasting Agent.
        
        Args:
            name: Agent name
            model: LLM model to use
            temperature: Sampling temperature for the model
            max_tokens: Maximum number of tokens to generate
            api_key: OpenAI API key
        """
        # Define system message for forecasting role
        system_message = """
        You are an Energy Forecasting Agent, part of the Energy AI Optimizer system.
        Your primary role is to predict future energy consumption patterns based on
        historical data and relevant factors like weather forecasts.
        
        Your capabilities include:
        1. Forecasting energy consumption for different time horizons (day-ahead, week-ahead, month-ahead)
        2. Accounting for factors that influence energy consumption (weather, occupancy, etc.)
        3. Providing uncertainty estimates and confidence levels for predictions
        4. Analyzing forecasting accuracy and identifying improvement opportunities
        5. Explaining the factors that drive forecast results
        
        When generating forecasts, focus on:
        - Temporal patterns (daily, weekly, seasonal variations)
        - Weather sensitivity and upcoming weather conditions
        - Calendar effects (holidays, special events)
        - Operational patterns and scheduled changes
        - Historical consumption trends and anomalies
        
        Provide quantitative forecasts with appropriate uncertainty ranges. Explain the key
        factors driving your forecasts and identify potential risks or anomalies that might
        affect forecast accuracy.
        """
        
        # Call the parent class constructor
        super().__init__(
            name=name,
            system_message=system_message,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=api_key,
        )
        
        logger.info(f"Initialized {name} with specialized forecasting capabilities")
    
    def provide_forecast_guidance(
        self, 
        historical_data: Dict[str, Any],
        weather_forecast: Optional[Dict[str, Any]] = None,
        forecast_horizon: str = "day_ahead",
        building_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Provide guidance on forecasting future energy consumption.
        
        Args:
            historical_data: Historical energy consumption data
            weather_forecast: Weather forecast data (optional)
            forecast_horizon: Forecasting horizon (day_ahead, week_ahead, month_ahead)
            building_id: Building ID for which to generate the forecast (optional)
            
        Returns:
            Dict[str, Any]: Forecasting guidance and insights
        """
        try:
            logger.info(f"Providing {forecast_horizon} forecasting guidance for building {building_id or 'all buildings'}")
            
            # Validate forecast horizon
            valid_horizons = ["day_ahead", "week_ahead", "month_ahead"]
            if forecast_horizon not in valid_horizons:
                logger.warning(f"Invalid forecast horizon: {forecast_horizon}. Defaulting to day_ahead.")
                forecast_horizon = "day_ahead"
            
            # Convert input data to JSON for the LLM
            historical_data_json = json.dumps(historical_data, indent=2)
            weather_forecast_json = json.dumps(weather_forecast, indent=2) if weather_forecast else "No weather forecast provided"
            
            forecast_characteristics = {
                "day_ahead": {
                    "resolution": "hourly",
                    "horizon": "next 24 hours",
                    "key_factors": "recent consumption patterns, day of week, weather conditions",
                    "models": "regression, time series methods, or simple ML models",
                    "uncertainty": "relatively low uncertainty with good weather forecasts",
                },
                "week_ahead": {
                    "resolution": "daily",
                    "horizon": "next 7 days",
                    "key_factors": "weekly patterns, upcoming weather, known operational changes",
                    "models": "time series methods, machine learning, or ensemble approaches",
                    "uncertainty": "moderate uncertainty, especially for later days",
                },
                "month_ahead": {
                    "resolution": "daily or weekly",
                    "horizon": "next 30 days",
                    "key_factors": "seasonal patterns, monthly trends, long-term weather forecasts",
                    "models": "statistical methods with seasonal components, ML with calendar features",
                    "uncertainty": "higher uncertainty requiring wider prediction intervals",
                },
            }
            
            prompt = f"""
            Provide guidance for {forecast_horizon.replace('_', ' ')} energy consumption forecasting
            based on this historical consumption data:
            
            {historical_data_json}
            
            Weather forecast information:
            {weather_forecast_json}
            
            For {forecast_horizon.replace('_', ' ')} forecasting:
            - Typical resolution: {forecast_characteristics[forecast_horizon]['resolution']}
            - Horizon: {forecast_characteristics[forecast_horizon]['horizon']}
            - Key factors: {forecast_characteristics[forecast_horizon]['key_factors']}
            - Suitable models: {forecast_characteristics[forecast_horizon]['models']}
            - Uncertainty characteristics: {forecast_characteristics[forecast_horizon]['uncertainty']}
            
            Please provide:
            1. Analysis of the historical patterns relevant to this forecast horizon
            2. Key drivers that should be incorporated in the forecast model
            3. Recommended forecasting approach and model selection
            4. Expected forecast accuracy and uncertainty considerations
            5. Guidance on model validation and performance evaluation
            
            Focus on practical, actionable guidance for producing accurate consumption forecasts.
            """
            
            # Get forecasting guidance from the LLM
            forecast_guidance = self.process_message(prompt)
            
            # Return the forecasting guidance
            return {
                'building_id': building_id,
                'forecast_horizon': forecast_horizon,
                'forecast_guidance': forecast_guidance,
                'has_weather_data': weather_forecast is not None,
                'timestamp': datetime.now().isoformat(),
            }
        
        except Exception as e:
            logger.error(f"Error providing forecast guidance: {str(e)}")
            raise
    
    def interpret_forecast(
        self, 
        forecast_data: Dict[str, Any],
        historical_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Interpret a forecast, explaining key patterns and anomalies.
        
        Args:
            forecast_data: Energy consumption forecast data
            historical_data: Historical consumption data for comparison (optional)
            
        Returns:
            Dict[str, Any]: Forecast interpretation
        """
        try:
            logger.info("Interpreting forecast results")
            
            # Convert input data to JSON for the LLM
            forecast_data_json = json.dumps(forecast_data, indent=2)
            historical_comparison = "No historical data provided for comparison"
            
            if historical_data:
                historical_data_json = json.dumps(historical_data, indent=2)
                historical_comparison = f"Historical data for comparison:\n{historical_data_json}"
            
            prompt = f"""
            Interpret the following energy consumption forecast:
            
            {forecast_data_json}
            
            {historical_comparison}
            
            Please provide:
            1. Key patterns and trends identified in the forecast
            2. Notable anomalies or unusual periods in the forecast
            3. Comparison to historical patterns (if historical data is provided)
            4. Factors likely driving the forecasted consumption
            5. Areas of high uncertainty or potential forecast error
            6. Actionable insights based on the forecast
            
            Focus on providing clear, insightful interpretation that would help building
            operators understand and act on the forecast information.
            """
            
            # Get forecast interpretation from the LLM
            interpretation = self.process_message(prompt)
            
            # Return the interpretation
            return {
                'forecast_period': {
                    'start': forecast_data.get('start_date') or forecast_data.get('period', {}).get('start'),
                    'end': forecast_data.get('end_date') or forecast_data.get('period', {}).get('end'),
                },
                'interpretation': interpretation,
                'has_historical_comparison': historical_data is not None,
                'timestamp': datetime.now().isoformat(),
            }
        
        except Exception as e:
            logger.error(f"Error interpreting forecast: {str(e)}")
            raise
    
    def evaluate_forecast_accuracy(
        self, 
        forecast_data: Dict[str, Any],
        actual_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate the accuracy of a forecast against actual consumption.
        
        Args:
            forecast_data: Forecasted energy consumption data
            actual_data: Actual energy consumption data for the same period
            
        Returns:
            Dict[str, Any]: Forecast accuracy evaluation
        """
        try:
            logger.info("Evaluating forecast accuracy")
            
            # Convert input data to JSON for the LLM
            forecast_data_json = json.dumps(forecast_data, indent=2)
            actual_data_json = json.dumps(actual_data, indent=2)
            
            prompt = f"""
            Evaluate the accuracy of this energy consumption forecast:
            
            Forecast data:
            {forecast_data_json}
            
            Actual consumption data:
            {actual_data_json}
            
            Please provide:
            1. Calculation of key error metrics (MAE, MAPE, RMSE)
            2. Analysis of forecast bias (systematic over/under-prediction)
            3. Identification of periods with high forecast error
            4. Analysis of potential causes for forecast errors
            5. Recommendations for improving forecast accuracy
            6. Visual comparison of forecast vs. actual (describe what a chart would show)
            
            Focus on providing actionable insights that would help improve future forecasting accuracy.
            """
            
            # Get accuracy evaluation from the LLM
            accuracy_evaluation = self.process_message(prompt)
            
            # Return the evaluation results
            return {
                'forecast_period': {
                    'start': forecast_data.get('start_date') or forecast_data.get('period', {}).get('start'),
                    'end': forecast_data.get('end_date') or forecast_data.get('period', {}).get('end'),
                },
                'accuracy_evaluation': accuracy_evaluation,
                'timestamp': datetime.now().isoformat(),
            }
        
        except Exception as e:
            logger.error(f"Error evaluating forecast accuracy: {str(e)}")
            raise
    
    def analyze_forecast_sensitivity(
        self, 
        baseline_forecast: Dict[str, Any],
        scenario_parameters: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze forecast sensitivity to different factors or scenarios.
        
        Args:
            baseline_forecast: Baseline forecast data
            scenario_parameters: List of scenario parameters to analyze
            
        Returns:
            Dict[str, Any]: Sensitivity analysis results
        """
        try:
            logger.info("Analyzing forecast sensitivity to scenarios")
            
            # Convert input data to JSON for the LLM
            baseline_forecast_json = json.dumps(baseline_forecast, indent=2)
            scenario_parameters_json = json.dumps(scenario_parameters, indent=2)
            
            prompt = f"""
            Analyze how this baseline energy consumption forecast would change under different scenarios:
            
            Baseline forecast:
            {baseline_forecast_json}
            
            Scenario parameters to analyze:
            {scenario_parameters_json}
            
            For each scenario parameter, please:
            1. Describe how the forecast would likely change in response to this parameter
            2. Estimate the magnitude and direction of the change (qualitative or quantitative)
            3. Identify which parts of the forecast period would be most affected
            4. Assess the certainty of this impact (high, medium, or low confidence)
            
            Then provide an overall sensitivity analysis summary addressing:
            1. Which parameters have the greatest impact on the forecast
            2. Which forecast periods are most sensitive to parameter changes
            3. Recommendations for handling this uncertainty in energy planning
            
            Focus on providing actionable insights about forecast sensitivity and uncertainty.
            """
            
            # Get sensitivity analysis from the LLM
            sensitivity_analysis = self.process_message(prompt)
            
            # Return the sensitivity analysis
            return {
                'baseline_forecast_period': {
                    'start': baseline_forecast.get('start_date') or baseline_forecast.get('period', {}).get('start'),
                    'end': baseline_forecast.get('end_date') or baseline_forecast.get('period', {}).get('end'),
                },
                'scenarios_analyzed': len(scenario_parameters),
                'sensitivity_analysis': sensitivity_analysis,
                'timestamp': datetime.now().isoformat(),
            }
        
        except Exception as e:
            logger.error(f"Error analyzing forecast sensitivity: {str(e)}")
            raise
    
    def identify_anomalous_forecast_periods(
        self, 
        forecast_data: Dict[str, Any],
        historical_patterns: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Identify periods in a forecast that appear anomalous.
        
        Args:
            forecast_data: Energy consumption forecast data
            historical_patterns: Historical consumption patterns (optional)
            
        Returns:
            Dict[str, Any]: Identified anomalous periods
        """
        try:
            logger.info("Identifying anomalous periods in forecast")
            
            # Convert input data to JSON for the LLM
            forecast_data_json = json.dumps(forecast_data, indent=2)
            historical_context = "No historical patterns provided for context"
            
            if historical_patterns:
                historical_patterns_json = json.dumps(historical_patterns, indent=2)
                historical_context = f"Historical patterns for context:\n{historical_patterns_json}"
            
            prompt = f"""
            Identify potentially anomalous periods in this energy consumption forecast:
            
            {forecast_data_json}
            
            {historical_context}
            
            Please identify:
            1. Periods with unusually high forecasted consumption
            2. Periods with unusually low forecasted consumption
            3. Sudden changes or discontinuities in the forecast
            4. Forecasted patterns that deviate from typical expectations
            5. Periods where the forecast conflicts with historical patterns (if provided)
            
            For each anomalous period identified:
            - Specify the time period of the anomaly
            - Describe what makes it anomalous
            - Assess possible causes or explanations
            - Suggest whether it represents a legitimate forecast or potential error
            
            Focus on providing actionable insights about unusual forecast periods that might
            require further investigation or special consideration in energy planning.
            """
            
            # Get anomaly analysis from the LLM
            anomaly_analysis = self.process_message(prompt)
            
            # Return the anomaly analysis
            return {
                'forecast_period': {
                    'start': forecast_data.get('start_date') or forecast_data.get('period', {}).get('start'),
                    'end': forecast_data.get('end_date') or forecast_data.get('period', {}).get('end'),
                },
                'has_historical_context': historical_patterns is not None,
                'anomaly_analysis': anomaly_analysis,
                'timestamp': datetime.now().isoformat(),
            }
        
        except Exception as e:
            logger.error(f"Error identifying anomalous forecast periods: {str(e)}")
            raise 