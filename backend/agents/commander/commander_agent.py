"""
Commander Agent implementation for the Energy AI Optimizer.
"""
from typing import Dict, List, Optional, Any, Union
import json
import logging

from agents.base_agent import BaseAgent
from agents.data_analysis.data_analysis_agent import DataAnalysisAgent
from agents.recommendation.recommendation_agent import RecommendationAgent
from agents.forecasting.forecasting_agent import ForecastingAgent
from agents.memory.memory_agent import MemoryAgent
from agents.evaluator.evaluator_agent import EvaluatorAgent
from agents.adapter.adapter_agent import AdapterAgent
from utils.logging_utils import get_logger

# Get logger
logger = get_logger('eaio.agent.commander')

class CommanderAgent(BaseAgent):
    """
    Commander Agent for orchestrating other agents in the Energy AI Optimizer.
    
    This agent is responsible for:
    - Coordinating workflows between different specialized agents
    - Routing user queries to appropriate agents
    - Aggregating results from multiple agents
    - Maintaining conversation context and history
    - Ensuring coherent user experience
    """
    
    def __init__(
        self,
        name: str = "CommanderAgent",
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = 2000,
        api_key: Optional[str] = None,
    ):
        """
        Initialize the Commander Agent.
        
        Args:
            name: Agent name
            model: LLM model to use
            temperature: Sampling temperature for the model
            max_tokens: Maximum number of tokens to generate
            api_key: OpenAI API key
        """
        # Define system message for commander role
        system_message = """
        You are the Commander Agent in the Energy AI Optimizer system, responsible for
        orchestrating specialized agents to provide comprehensive energy analysis and
        optimization solutions.
        
        Your responsibilities include:
        1. Understanding user requests and routing them to appropriate specialized agents
        2. Coordinating multi-step workflows involving multiple agents
        3. Aggregating and synthesizing information from different agents into coherent responses
        4. Maintaining conversation context and managing the overall interaction flow
        5. Ensuring all user requests are addressed comprehensively
        
        You have access to these specialized agents:
        - Data Analysis Agent: Analyzes energy data, identifies patterns and anomalies
        - Recommendation Agent: Generates actionable energy optimization recommendations
        - Forecasting Agent: Predicts future energy consumption and identifies trends
        
        Your role is to be the central coordinator that ensures each user receives
        appropriate information from these specialized agents based on their role
        (facility manager, energy analyst, or executive) and specific needs.
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
        
        # Initialize specialized agents
        self.data_analysis_agent = None
        self.recommendation_agent = None
        self.forecasting_agent = None
        
        logger.info(f"Initialized {name} as orchestration agent")
    
    def initialize_agents(
        self,
        model: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> None:
        """
        Initialize all specialized agents.
        
        Args:
            model: LLM model to use for agents
            api_key: OpenAI API key for agents
        """
        try:
            logger.info("Initializing specialized agents")
            
            # Initialize Data Analysis Agent
            self.data_analysis_agent = DataAnalysisAgent(
                model=model,
                api_key=api_key
            )
            
            # Initialize Recommendation Agent
            self.recommendation_agent = RecommendationAgent(
                model=model,
                api_key=api_key
            )
            
            # Initialize Forecasting Agent
            self.forecasting_agent = ForecastingAgent(
                model=model,
                api_key=api_key
            )
            
            logger.info("All specialized agents successfully initialized")
        
        except Exception as e:
            logger.error(f"Error initializing specialized agents: {str(e)}")
            raise
    
    def route_query(
        self,
        query: str,
        user_role: str,
        building_data: Optional[Dict[str, Any]] = None,
        weather_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Route a user query to appropriate specialized agents.
        
        Args:
            query: User query text
            user_role: User role (facility_manager, energy_analyst, executive)
            building_data: Building energy data (optional)
            weather_data: Weather data (optional)
            
        Returns:
            Dict[str, Any]: Results from the appropriate agent(s)
        """
        try:
            logger.info(f"Routing query from {user_role}: {query}")
            
            # Ensure agents are initialized
            if not all([self.data_analysis_agent, self.recommendation_agent, self.forecasting_agent]):
                logger.info("Initializing agents before routing query")
                self.initialize_agents(model=self.model, api_key=self.api_key)
            
            # Determine query intent to route to appropriate agent(s)
            intent_prompt = f"""
            Analyze this user query and determine the primary intent.
            Query: "{query}"
            User role: {user_role}
            
            Classify the primary intent as one of:
            - "analysis" (analyze patterns, anomalies, or correlations in energy data)
            - "recommendation" (get recommendations for energy optimization)
            - "forecast" (predict future energy consumption)
            - "multi" (requires multiple agent types)
            
            Response format: Just return the single intent classification word.
            """
            
            primary_intent = self.process_message(intent_prompt).strip().lower()
            
            # Handle different intents
            results = {
                'query': query,
                'user_role': user_role,
                'timestamp': datetime.now().isoformat(),
                'intent': primary_intent,
            }
            
            if primary_intent == "analysis" or primary_intent == "multi":
                if not building_data:
                    logger.warning("Analysis requested but no building data provided")
                    results['analysis_results'] = "Analysis requires building data, which was not provided."
                else:
                    logger.info("Routing to Data Analysis Agent")
                    analysis_results = self.data_analysis_agent.analyze_consumption_patterns(
                        building_data=building_data,
                        time_period="recent"  # Default to recent data
                    )
                    results['analysis_results'] = analysis_results
            
            if primary_intent == "recommendation" or primary_intent == "multi":
                logger.info("Routing to Recommendation Agent")
                
                # Get analysis results if available and not already performed
                if 'analysis_results' not in results and building_data:
                    analysis_results = self.data_analysis_agent.analyze_consumption_patterns(
                        building_data=building_data,
                        time_period="recent"
                    )
                else:
                    analysis_results = results.get('analysis_results')
                
                recommendation_results = self.recommendation_agent.generate_recommendations(
                    analysis_results=analysis_results,
                    user_role=user_role
                )
                results['recommendation_results'] = recommendation_results
            
            if primary_intent == "forecast" or primary_intent == "multi":
                logger.info("Routing to Forecasting Agent")
                
                forecast_horizon = "day_ahead"  # Default
                if "week" in query.lower():
                    forecast_horizon = "week_ahead"
                elif "month" in query.lower():
                    forecast_horizon = "month_ahead"
                
                forecast_results = self.forecasting_agent.provide_forecast_guidance(
                    historical_data=building_data or {},
                    weather_forecast=weather_data,
                    forecast_horizon=forecast_horizon
                )
                results['forecast_results'] = forecast_results
            
            # Generate comprehensive response using results from all involved agents
            if primary_intent == "multi":
                integrated_response = self.create_integrated_response(results, user_role)
                results['integrated_response'] = integrated_response
            
            logger.info(f"Successfully routed query with intent: {primary_intent}")
            return results
        
        except Exception as e:
            logger.error(f"Error routing query: {str(e)}")
            raise
    
    def create_integrated_response(
        self,
        agent_results: Dict[str, Any],
        user_role: str
    ) -> str:
        """
        Create an integrated response combining results from multiple agents.
        
        Args:
            agent_results: Results from different agents
            user_role: User role (facility_manager, energy_analyst, executive)
            
        Returns:
            str: Integrated response
        """
        try:
            logger.info("Creating integrated response from multiple agent results")
            
            # Extract results from different agents
            analysis = agent_results.get('analysis_results', 'No analysis data available')
            recommendations = agent_results.get('recommendation_results', 'No recommendations available')
            forecast = agent_results.get('forecast_results', {}).get('forecast_guidance', 'No forecast available')
            
            # Convert complex objects to strings for the prompt
            if not isinstance(analysis, str):
                analysis = json.dumps(analysis, indent=2)
            if not isinstance(recommendations, str):
                recommendations = json.dumps(recommendations, indent=2)
            if not isinstance(forecast, str):
                forecast = json.dumps(forecast, indent=2)
            
            # Create role-specific formatting instructions
            formatting_instructions = {
                "facility_manager": "Practical, actionable information with clear next steps. Focus on operational improvements.",
                "energy_analyst": "Detailed technical information with quantitative analysis. Include data references and methodologies.",
                "executive": "High-level strategic insights with financial implications. Focus on business impact and ROI."
            }
            
            role_format = formatting_instructions.get(
                user_role.lower().replace(" ", "_"),
                formatting_instructions["facility_manager"]  # Default
            )
            
            prompt = f"""
            Create a comprehensive response based on the following information:
            
            DATA ANALYSIS:
            {analysis}
            
            RECOMMENDATIONS:
            {recommendations}
            
            FORECAST:
            {forecast}
            
            Format this response for a {user_role}: {role_format}
            
            Create a cohesive, well-structured response that integrates these different elements
            into a unified whole. Ensure the information flows logically and connects the analysis
            to the recommendations and forecast information.
            
            The response should be comprehensive but focused on the most important insights and actions.
            """
            
            # Get integrated response from the LLM
            integrated_response = self.process_message(prompt)
            
            return integrated_response
        
        except Exception as e:
            logger.error(f"Error creating integrated response: {str(e)}")
            return "Error creating integrated response. Please try again."
    
    def handle_multi_step_query(
        self,
        query: str,
        conversation_history: List[Dict[str, Any]],
        user_role: str,
        building_data: Optional[Dict[str, Any]] = None,
        weather_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Handle complex queries requiring multi-step processing across agents.
        
        Args:
            query: User query text
            conversation_history: Previous conversation turns
            user_role: User role (facility_manager, energy_analyst, executive)
            building_data: Building energy data (optional)
            weather_data: Weather data (optional)
            
        Returns:
            Dict[str, Any]: Results from the multi-step process
        """
        try:
            logger.info(f"Handling multi-step query: {query}")
            
            # Ensure agents are initialized
            if not all([self.data_analysis_agent, self.recommendation_agent, self.forecasting_agent]):
                logger.info("Initializing agents before handling multi-step query")
                self.initialize_agents(model=self.model, api_key=self.api_key)
            
            # Step 1: Plan the multi-step approach
            history_text = "\n".join([
                f"User: {turn.get('user', '')}\nSystem: {turn.get('system', '')}"
                for turn in conversation_history[-5:]  # Include last 5 turns at most
            ])
            
            plan_prompt = f"""
            Create a step-by-step plan to answer this query:
            "{query}"
            
            User role: {user_role}
            Recent conversation history:
            {history_text}
            
            Create a plan with these components:
            1. Required data: What building or weather data is needed
            2. Analysis steps: What analyses must be performed
            3. Agent sequence: Which specialized agents should be involved and in what order
            4. Integration approach: How to combine results into a coherent response
            
            Format your response as a JSON object with these keys.
            """
            
            # Get plan from the LLM
            plan_response = self.process_message(plan_prompt)
            
            # Parse the plan JSON
            try:
                # Extract JSON from the response (it might be wrapped in ```json blocks)
                if "```json" in plan_response:
                    plan_json_str = plan_response.split("```json")[1].split("```")[0].strip()
                elif "```" in plan_response:
                    plan_json_str = plan_response.split("```")[1].split("```")[0].strip() 
                else:
                    plan_json_str = plan_response.strip()
                
                plan = json.loads(plan_json_str)
            except Exception as e:
                logger.warning(f"Failed to parse plan JSON, using default plan: {str(e)}")
                plan = {
                    "required_data": ["building_data", "weather_data"],
                    "analysis_steps": ["analyze_patterns", "detect_anomalies", "generate_recommendations"],
                    "agent_sequence": ["data_analysis", "recommendation", "forecasting"],
                    "integration_approach": "synthesize_all_results"
                }
            
            # Step 2: Execute the plan by calling agents in sequence
            results = {
                'query': query,
                'user_role': user_role,
                'plan': plan,
                'timestamp': datetime.now().isoformat(),
            }
            
            # Execute data analysis if needed
            if "data_analysis" in plan.get("agent_sequence", []):
                if not building_data:
                    logger.warning("Data analysis required but no building data provided")
                    results['analysis_results'] = "Analysis requires building data, which was not provided."
                else:
                    logger.info("Executing data analysis step")
                    analysis_results = self.data_analysis_agent.analyze_consumption_patterns(
                        building_data=building_data,
                        time_period="recent"
                    )
                    
                    # If anomaly detection is specified, also perform that
                    if "detect_anomalies" in plan.get("analysis_steps", []):
                        anomalies = self.data_analysis_agent.detect_anomalies(
                            building_data=building_data,
                            sensitivity="medium"
                        )
                        results['anomaly_results'] = anomalies
                    
                    # If weather correlation is specified, also perform that
                    if "correlate_weather" in plan.get("analysis_steps", []) and weather_data:
                        correlation = self.data_analysis_agent.correlate_with_weather(
                            building_data=building_data,
                            weather_data=weather_data
                        )
                        results['weather_correlation'] = correlation
                    
                    results['analysis_results'] = analysis_results
            
            # Execute recommendation generation if needed
            if "recommendation" in plan.get("agent_sequence", []):
                logger.info("Executing recommendation step")
                analysis_results = results.get('analysis_results')
                
                if analysis_results:
                    recommendations = self.recommendation_agent.generate_recommendations(
                        analysis_results=analysis_results,
                        user_role=user_role
                    )
                    results['recommendation_results'] = recommendations
                else:
                    results['recommendation_results'] = "Recommendations require analysis results, which are not available."
            
            # Execute forecasting if needed
            if "forecasting" in plan.get("agent_sequence", []):
                logger.info("Executing forecasting step")
                
                forecast_horizon = "day_ahead"  # Default
                if "week_ahead" in str(plan):
                    forecast_horizon = "week_ahead"
                elif "month_ahead" in str(plan):
                    forecast_horizon = "month_ahead"
                
                forecast = self.forecasting_agent.provide_forecast_guidance(
                    historical_data=building_data or {},
                    weather_forecast=weather_data,
                    forecast_horizon=forecast_horizon
                )
                results['forecast_results'] = forecast
            
            # Step 3: Integrate results according to the plan
            if plan.get("integration_approach") in ["synthesize_all_results", "combine_agent_outputs"]:
                integrated_response = self.create_integrated_response(results, user_role)
                results['integrated_response'] = integrated_response
            
            logger.info("Successfully completed multi-step query processing")
            return results
        
        except Exception as e:
            logger.error(f"Error handling multi-step query: {str(e)}")
            raise
    
    def evaluate_conversation_needs(
        self,
        query: str,
        conversation_history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Evaluate the conversation to determine what information or actions are needed.
        
        Args:
            query: User's current query
            conversation_history: Previous conversation turns
            
        Returns:
            Dict[str, Any]: Assessment of conversation needs
        """
        try:
            logger.info("Evaluating conversation needs")
            
            # Format conversation history
            history_text = "\n".join([
                f"User: {turn.get('user', '')}\nSystem: {turn.get('system', '')}"
                for turn in conversation_history[-5:]  # Include last 5 turns at most
            ])
            
            prompt = f"""
            Analyze this conversation to determine what information or actions are needed next:
            
            Conversation history:
            {history_text}
            
            Current query: "{query}"
            
            Determine:
            1. Context needed: Is additional context from previous turns needed?
            2. Missing information: What information is needed but not provided?
            3. Clarification needed: Does the user query need clarification?
            4. Next actions: What agent actions are likely needed?
            5. User intent: What is the user trying to accomplish?
            
            Format your response as a JSON object with these fields.
            """
            
            # Get evaluation from the LLM
            evaluation_response = self.process_message(prompt)
            
            # Parse the evaluation JSON
            try:
                # Extract JSON from the response (it might be wrapped in ```json blocks)
                if "```json" in evaluation_response:
                    eval_json_str = evaluation_response.split("```json")[1].split("```")[0].strip()
                elif "```" in evaluation_response:
                    eval_json_str = evaluation_response.split("```")[1].split("```")[0].strip() 
                else:
                    eval_json_str = evaluation_response.strip()
                
                evaluation = json.loads(eval_json_str)
            except Exception as e:
                logger.warning(f"Failed to parse evaluation JSON: {str(e)}")
                # Create a simple evaluation if parsing fails
                evaluation = {
                    "context_needed": True,
                    "missing_information": ["Specific data or time periods", "User role"],
                    "clarification_needed": True,
                    "next_actions": ["Ask for clarification", "Retrieve relevant context"],
                    "user_intent": "Unable to determine intent clearly"
                }
            
            logger.info("Successfully evaluated conversation needs")
            return evaluation
        
        except Exception as e:
            logger.error(f"Error evaluating conversation needs: {str(e)}")
            raise 