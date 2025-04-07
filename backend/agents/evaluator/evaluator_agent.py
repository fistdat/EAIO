"""
Evaluator Agent implementation for the Energy AI Optimizer.
"""
from typing import Dict, List, Optional, Any, Union
import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta

from agents.base_agent import BaseAgent
from utils.logging_utils import get_logger

# Get logger
logger = get_logger('eaio.agent.evaluator')

class EvaluatorAgent(BaseAgent):
    """
    Evaluator Agent for assessing outcomes of energy optimization strategies.
    
    This agent is responsible for:
    - Evaluating the effectiveness of implemented recommendations
    - Measuring energy savings from optimization strategies
    - Validating forecast accuracy against actual consumption
    - Providing feedback to improve future recommendations
    - Calculating ROI and payback periods for energy initiatives
    """
    
    def __init__(
        self,
        name: str = "EvaluatorAgent",
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: Optional[int] = 2000,
        api_key: Optional[str] = None,
    ):
        """
        Initialize the Evaluator Agent.
        
        Args:
            name: Agent name
            model: LLM model to use
            temperature: Sampling temperature for the model
            max_tokens: Maximum number of tokens to generate
            api_key: OpenAI API key
        """
        # Define system message for evaluator role
        system_message = """
        You are an Energy Evaluator Agent, part of the Energy AI Optimizer system.
        Your primary role is to assess the outcomes and effectiveness of energy
        optimization strategies that have been implemented.
        
        Your capabilities include:
        1. Evaluating the effectiveness of implemented recommendations
        2. Calculating energy savings and financial benefits
        3. Comparing forecast predictions to actual consumption
        4. Assessing the accuracy of energy analysis
        5. Providing feedback to improve future recommendations
        
        When evaluating outcomes, focus on:
        - Quantitative metrics (energy reduction, cost savings)
        - Implementation quality and completeness
        - Financial metrics (ROI, payback period)
        - Factors that influenced success or underperformance
        - Lessons learned for future recommendations
        
        Your evaluations should be data-driven, objective, and provide actionable
        insights for continuous improvement of the energy optimization process.
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
        
        logger.info(f"Initialized {name} with evaluation capabilities")
    
    def evaluate_recommendation_outcome(
        self,
        recommendation: Dict[str, Any],
        before_data: Dict[str, Any],
        after_data: Dict[str, Any],
        energy_rates: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Evaluate the outcome of an implemented recommendation.
        
        Args:
            recommendation: The original recommendation that was implemented
            before_data: Energy consumption data before implementation
            after_data: Energy consumption data after implementation
            energy_rates: Energy cost rates ($/kWh, etc.)
            
        Returns:
            Dict[str, Any]: Evaluation results
        """
        try:
            logger.info("Evaluating recommendation outcome")
            
            # Set default energy rates if not provided
            if energy_rates is None:
                energy_rates = {
                    'electricity': 0.12,  # $/kWh
                    'gas': 0.80,          # $/therm
                }
            
            # Convert data to JSON for the LLM
            recommendation_json = json.dumps(recommendation, indent=2)
            before_data_json = json.dumps(before_data, indent=2)
            after_data_json = json.dumps(after_data, indent=2)
            rates_json = json.dumps(energy_rates, indent=2)
            
            prompt = f"""
            Evaluate the outcome of this implemented energy recommendation:
            
            ORIGINAL RECOMMENDATION:
            {recommendation_json}
            
            ENERGY DATA BEFORE IMPLEMENTATION:
            {before_data_json}
            
            ENERGY DATA AFTER IMPLEMENTATION:
            {after_data_json}
            
            ENERGY RATES:
            {rates_json}
            
            Please provide a comprehensive evaluation including:
            
            1. Energy Savings Analysis
               - Absolute energy reduction (kWh, therms, etc.)
               - Percentage reduction compared to baseline
               - Normalization for factors like weather or occupancy
            
            2. Financial Impact
               - Cost savings achieved
               - Return on investment (if implementation cost is available)
               - Payback period calculation
            
            3. Implementation Assessment
               - Completeness of implementation
               - Quality of implementation
               - Any deviations from the original recommendation
            
            4. Success Factors & Challenges
               - Key factors that contributed to success or underperformance
               - Unexpected challenges or benefits encountered
            
            5. Recommendations for Improvement
               - How to improve future similar recommendations
               - Additional steps to maximize benefits
            
            Provide a data-driven, objective assessment with quantitative metrics
            wherever possible. Consider all relevant factors that might have affected
            the outcome.
            """
            
            # Get evaluation from the LLM
            evaluation_result = self.process_message(prompt)
            
            # Calculate basic metrics to include with the LLM evaluation
            metrics = self._calculate_basic_metrics(before_data, after_data, energy_rates)
            
            # Return the evaluation results
            return {
                'recommendation_id': recommendation.get('id', 'unknown'),
                'building_id': recommendation.get('building_id', 'unknown'),
                'evaluation_date': datetime.now().isoformat(),
                'evaluation_period': {
                    'before_start': before_data.get('start_date'),
                    'before_end': before_data.get('end_date'),
                    'after_start': after_data.get('start_date'),
                    'after_end': after_data.get('end_date'),
                },
                'calculated_metrics': metrics,
                'evaluation': evaluation_result,
            }
        
        except Exception as e:
            logger.error(f"Error evaluating recommendation outcome: {str(e)}")
            raise
    
    def _calculate_basic_metrics(
        self,
        before_data: Dict[str, Any],
        after_data: Dict[str, Any],
        energy_rates: Dict[str, float]
    ) -> Dict[str, Any]:
        """Calculate basic evaluation metrics."""
        metrics = {}
        
        try:
            # Extract consumption values if available
            if 'consumption' in before_data and 'consumption' in after_data:
                before_consumption = before_data['consumption']
                after_consumption = after_data['consumption']
                
                # Calculate absolute and percentage savings
                absolute_savings = before_consumption - after_consumption
                percent_savings = (absolute_savings / before_consumption) * 100 if before_consumption > 0 else 0
                
                metrics['absolute_savings'] = absolute_savings
                metrics['percent_savings'] = percent_savings
                
                # Calculate cost savings if energy type is known
                energy_type = before_data.get('energy_type', 'electricity')
                if energy_type in energy_rates:
                    cost_savings = absolute_savings * energy_rates[energy_type]
                    metrics['cost_savings'] = cost_savings
        
        except Exception as e:
            logger.warning(f"Error calculating basic metrics: {str(e)}")
        
        return metrics
    
    def evaluate_forecast_accuracy(
        self,
        forecast: Dict[str, Any],
        actual_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate the accuracy of an energy consumption forecast.
        
        Args:
            forecast: The original energy consumption forecast
            actual_data: Actual energy consumption data for the same period
            
        Returns:
            Dict[str, Any]: Forecast accuracy evaluation
        """
        try:
            logger.info("Evaluating forecast accuracy")
            
            # Convert data to JSON for the LLM
            forecast_json = json.dumps(forecast, indent=2)
            actual_data_json = json.dumps(actual_data, indent=2)
            
            # Calculate accuracy metrics
            accuracy_metrics = self._calculate_forecast_metrics(forecast, actual_data)
            metrics_json = json.dumps(accuracy_metrics, indent=2)
            
            prompt = f"""
            Evaluate the accuracy of this energy consumption forecast:
            
            FORECAST:
            {forecast_json}
            
            ACTUAL DATA:
            {actual_data_json}
            
            CALCULATED ACCURACY METRICS:
            {metrics_json}
            
            Please provide a comprehensive evaluation of forecast accuracy including:
            
            1. Accuracy Assessment
               - Interpretation of the calculated error metrics (MAE, MAPE, RMSE)
               - Analysis of bias (systematic over or under-prediction)
               - Identification of periods with highest and lowest accuracy
            
            2. Pattern Analysis
               - How well the forecast captured temporal patterns (daily, weekly)
               - Specific events or anomalies that were missed or accurately predicted
               - Assessment of how well the forecast anticipated changes in consumption
            
            3. Factor Assessment
               - Evaluation of which factors were well-accounted for in the forecast
               - Identification of factors that were missed or improperly weighted
               - Weather sensitivity and other external factors
            
            4. Recommendations for Improvement
               - Specific ways to improve future forecast accuracy
               - Additional data sources that could enhance forecasting
               - Model adjustments or alternative approaches to consider
            
            Provide a data-driven, balanced assessment that acknowledges both
            strengths and weaknesses of the forecast.
            """
            
            # Get evaluation from the LLM
            evaluation_result = self.process_message(prompt)
            
            # Return the evaluation results
            return {
                'forecast_id': forecast.get('id', 'unknown'),
                'building_id': forecast.get('building_id', 'unknown'),
                'evaluation_date': datetime.now().isoformat(),
                'forecast_period': {
                    'start': forecast.get('start_date'),
                    'end': forecast.get('end_date'),
                },
                'accuracy_metrics': accuracy_metrics,
                'evaluation': evaluation_result,
            }
        
        except Exception as e:
            logger.error(f"Error evaluating forecast accuracy: {str(e)}")
            raise
    
    def _calculate_forecast_metrics(
        self,
        forecast: Dict[str, Any],
        actual_data: Dict[str, Any]
    ) -> Dict[str, float]:
        """Calculate forecast accuracy metrics."""
        metrics = {}
        
        try:
            # Extract forecast and actual values
            forecast_values = forecast.get('values', [])
            actual_values = actual_data.get('values', [])
            
            # Ensure we have data to compare
            if not forecast_values or not actual_values:
                logger.warning("Missing forecast or actual values for metrics calculation")
                return metrics
            
            # Convert to numpy arrays for calculation
            f_values = np.array(forecast_values)
            a_values = np.array(actual_values)
            
            # Calculate Mean Absolute Error (MAE)
            mae = np.mean(np.abs(f_values - a_values))
            metrics['mae'] = float(mae)
            
            # Calculate Root Mean Square Error (RMSE)
            rmse = np.sqrt(np.mean((f_values - a_values) ** 2))
            metrics['rmse'] = float(rmse)
            
            # Calculate Mean Absolute Percentage Error (MAPE)
            # Avoid division by zero
            with np.errstate(divide='ignore', invalid='ignore'):
                mape = np.mean(np.abs((a_values - f_values) / a_values)) * 100
                mape = float(np.nan_to_num(mape))  # Replace NaN with 0
            metrics['mape'] = mape
            
            # Calculate bias (positive means forecast is higher than actual)
            bias = np.mean(f_values - a_values)
            metrics['bias'] = float(bias)
            
            # Calculate correlation coefficient
            if len(f_values) > 1:
                corr = np.corrcoef(f_values, a_values)[0, 1]
                metrics['correlation'] = float(corr)
        
        except Exception as e:
            logger.warning(f"Error calculating forecast metrics: {str(e)}")
        
        return metrics
    
    def evaluate_analysis_accuracy(
        self,
        analysis: Dict[str, Any],
        ground_truth: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate the accuracy of an energy data analysis.
        
        Args:
            analysis: The original energy data analysis
            ground_truth: Verified ground truth data for comparison
            
        Returns:
            Dict[str, Any]: Analysis accuracy evaluation
        """
        try:
            logger.info("Evaluating analysis accuracy")
            
            # Convert data to JSON for the LLM
            analysis_json = json.dumps(analysis, indent=2)
            ground_truth_json = json.dumps(ground_truth, indent=2)
            
            prompt = f"""
            Evaluate the accuracy of this energy data analysis compared to ground truth:
            
            ANALYSIS:
            {analysis_json}
            
            GROUND TRUTH:
            {ground_truth_json}
            
            Please evaluate the accuracy and quality of the analysis including:
            
            1. Factual Accuracy
               - Correctness of the identified patterns and trends
               - Accuracy of statistical calculations
               - Validity of correlations and relationships identified
            
            2. Completeness
               - Were any important patterns or insights missed?
               - Was the analysis comprehensive in scope?
               - Were all relevant factors considered?
            
            3. Methodology Assessment
               - Appropriateness of analytical methods used
               - Proper handling of data anomalies or outliers
               - Soundness of assumptions made
            
            4. Interpretive Quality
               - Clarity and relevance of explanations provided
               - Balance between detail and high-level insights
               - Actionability of the insights provided
            
            5. Recommendations for Improvement
               - How could the analysis methodology be improved?
               - What additional analyses would be valuable?
               - How to enhance interpretive quality?
            
            Provide a balanced, objective assessment that identifies both strengths
            and areas for improvement in the analysis.
            """
            
            # Get evaluation from the LLM
            evaluation_result = self.process_message(prompt)
            
            # Return the evaluation results
            return {
                'analysis_id': analysis.get('id', 'unknown'),
                'building_id': analysis.get('building_id', 'unknown'),
                'evaluation_date': datetime.now().isoformat(),
                'analysis_type': analysis.get('type', 'unknown'),
                'evaluation': evaluation_result,
            }
        
        except Exception as e:
            logger.error(f"Error evaluating analysis accuracy: {str(e)}")
            raise
    
    def calculate_roi(
        self,
        implementation_costs: Dict[str, float],
        energy_savings: Dict[str, float],
        time_period_months: int = 12
    ) -> Dict[str, Any]:
        """
        Calculate Return on Investment (ROI) for energy optimization initiatives.
        
        Args:
            implementation_costs: Costs of implementing recommendations
            energy_savings: Energy and cost savings achieved
            time_period_months: Time period for ROI calculation in months
            
        Returns:
            Dict[str, Any]: ROI calculation results
        """
        try:
            logger.info(f"Calculating ROI for {time_period_months}-month period")
            
            # Convert data to JSON for the LLM
            costs_json = json.dumps(implementation_costs, indent=2)
            savings_json = json.dumps(energy_savings, indent=2)
            
            # Calculate basic ROI
            total_costs = sum(implementation_costs.values())
            monthly_savings = sum(energy_savings.get('monthly_savings', {}).values())
            total_savings = monthly_savings * time_period_months
            
            if total_costs > 0:
                roi_percentage = ((total_savings - total_costs) / total_costs) * 100
                simple_payback_months = total_costs / monthly_savings if monthly_savings > 0 else float('inf')
            else:
                roi_percentage = float('inf')
                simple_payback_months = 0
            
            # Calculate basic metrics
            basic_metrics = {
                'total_implementation_cost': total_costs,
                'monthly_savings': monthly_savings,
                'total_savings_period': total_savings,
                'roi_percentage': roi_percentage,
                'simple_payback_months': simple_payback_months,
                'time_period_months': time_period_months,
            }
            
            metrics_json = json.dumps(basic_metrics, indent=2)
            
            prompt = f"""
            Analyze the Return on Investment (ROI) for these energy optimization initiatives:
            
            IMPLEMENTATION COSTS:
            {costs_json}
            
            ENERGY SAVINGS:
            {savings_json}
            
            CALCULATED METRICS:
            {metrics_json}
            
            Please provide a comprehensive financial analysis including:
            
            1. ROI Assessment
               - Interpretation of the calculated ROI percentage
               - Analysis of payback period and break-even point
               - Comparison to typical energy project ROI benchmarks
            
            2. Financial Benefit Analysis
               - Present value of future savings
               - Non-energy financial benefits (maintenance, operational)
               - Potential additional savings not captured in basic calculation
            
            3. Risk Assessment
               - Sensitivity to energy price changes
               - Uncertainty factors in savings projections
               - Implementation risk considerations
            
            4. Optimization Recommendations
               - Suggestions to improve ROI
               - Phasing or prioritization recommendations
               - Additional measures to consider for enhanced returns
            
            Provide actionable financial insights to help stakeholders make
            informed decisions about energy investments.
            """
            
            # Get ROI analysis from the LLM
            roi_analysis = self.process_message(prompt)
            
            # Return the ROI results
            return {
                'evaluation_date': datetime.now().isoformat(),
                'time_period_months': time_period_months,
                'calculated_metrics': basic_metrics,
                'roi_analysis': roi_analysis,
            }
        
        except Exception as e:
            logger.error(f"Error calculating ROI: {str(e)}")
            raise
    
    def assess_implementation_quality(
        self,
        recommendation: Dict[str, Any],
        implementation_details: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Assess the quality and completeness of recommendation implementation.
        
        Args:
            recommendation: The original recommendation
            implementation_details: Details of how the recommendation was implemented
            
        Returns:
            Dict[str, Any]: Implementation quality assessment
        """
        try:
            logger.info("Assessing implementation quality")
            
            # Convert data to JSON for the LLM
            recommendation_json = json.dumps(recommendation, indent=2)
            implementation_json = json.dumps(implementation_details, indent=2)
            
            prompt = f"""
            Assess the quality and completeness of this energy recommendation implementation:
            
            ORIGINAL RECOMMENDATION:
            {recommendation_json}
            
            IMPLEMENTATION DETAILS:
            {implementation_json}
            
            Please provide a comprehensive assessment including:
            
            1. Implementation Completeness
               - Extent to which all elements of the recommendation were implemented
               - Missing or incomplete aspects of implementation
               - Additional elements implemented beyond the original recommendation
            
            2. Quality Assessment
               - Quality of workmanship and technical execution
               - Adherence to best practices and standards
               - Appropriate customization for the specific context
            
            3. Process Evaluation
               - Efficiency of the implementation process
               - Stakeholder involvement and communication
               - Documentation and verification of changes
            
            4. Risk and Sustainability Assessment
               - Potential issues that could affect long-term performance
               - Maintenance considerations
               - Training and knowledge transfer completeness
            
            5. Recommendations for Improvement
               - Specific steps to improve implementation quality
               - Additional measures needed to complete implementation
               - Process improvements for future implementations
            
            Provide an objective assessment with a clear scoring or rating system for
            different aspects of implementation quality.
            """
            
            # Get assessment from the LLM
            assessment_result = self.process_message(prompt)
            
            # Return the assessment results
            return {
                'recommendation_id': recommendation.get('id', 'unknown'),
                'building_id': recommendation.get('building_id', 'unknown'),
                'assessment_date': datetime.now().isoformat(),
                'assessment': assessment_result,
            }
        
        except Exception as e:
            logger.error(f"Error assessing implementation quality: {str(e)}")
            raise
    
    def generate_performance_report(
        self,
        building_id: str,
        evaluation_results: List[Dict[str, Any]],
        time_period: Dict[str, str],
        user_role: str
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive performance report for a building or initiative.
        
        Args:
            building_id: Building identifier
            evaluation_results: Collection of evaluation results
            time_period: Start and end dates for the report
            user_role: Role of the user requesting the report
            
        Returns:
            Dict[str, Any]: Comprehensive performance report
        """
        try:
            logger.info(f"Generating performance report for building {building_id}")
            
            # Convert data to JSON for the LLM
            eval_results_json = json.dumps(evaluation_results, indent=2)
            time_period_json = json.dumps(time_period, indent=2)
            
            # Customize prompt based on user role
            role_focus = {
                "facility_manager": "operational improvements and maintenance considerations",
                "energy_analyst": "detailed technical performance metrics and analysis",
                "executive": "financial outcomes, ROI, and strategic implications"
            }
            
            role_specifics = role_focus.get(
                user_role.lower().replace(" ", "_"),
                role_focus["facility_manager"]  # Default
            )
            
            prompt = f"""
            Generate a comprehensive energy performance report for Building {building_id}:
            
            TIME PERIOD:
            {time_period_json}
            
            EVALUATION RESULTS:
            {eval_results_json}
            
            This report is for a {user_role} and should focus on {role_specifics}.
            
            Please create a comprehensive performance report including:
            
            1. Executive Summary
               - Overall performance assessment
               - Key achievements and challenges
               - Most significant results and trends
            
            2. Recommendation Performance
               - Effectiveness of implemented recommendations
               - Energy savings achieved
               - Financial outcomes and ROI
            
            3. Forecasting Performance
               - Accuracy of energy consumption forecasts
               - Factors affecting forecast performance
               - Improvements in forecasting over time
            
            4. Analysis Quality
               - Accuracy and usefulness of energy analyses
               - Insights gained and their application
               - Areas for analytical improvement
            
            5. Strategic Recommendations
               - Next steps to improve energy performance
               - Opportunities for additional optimization
               - Lessons learned and best practices
            
            Format the report in a clear, professional structure with appropriate
            sections and subsections. Include quantitative metrics wherever possible.
            """
            
            # Get report from the LLM
            report_content = self.process_message(prompt)
            
            # Return the performance report
            return {
                'building_id': building_id,
                'report_type': 'performance_evaluation',
                'time_period': time_period,
                'generation_date': datetime.now().isoformat(),
                'user_role': user_role,
                'report_content': report_content,
            }
        
        except Exception as e:
            logger.error(f"Error generating performance report: {str(e)}")
            raise 