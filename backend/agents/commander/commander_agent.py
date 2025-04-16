"""
Commander Agent implementation for the Energy AI Optimizer.
"""
from typing import Dict, List, Optional, Any, Union
import json
import logging
from datetime import datetime

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
    Commander Agent for orchestrating the multi-agent system.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the Commander Agent.
        
        Args:
            config: Configuration dictionary
        """
        # Extract parameters from config for BaseAgent initialization
        config = config or {}
        system_message = config.get("system_message", 
                                  "You are the Commander Agent responsible for orchestrating the multi-agent system for energy optimization.")
        model = config.get("model", "gpt-4o-mini")
        temperature = config.get("temperature", 0.7)
        max_tokens = config.get("max_tokens", 4096)
        api_key = config.get("api_key", None)
        config_list = config.get("config_list", None)
        
        # Call super().__init__ with the extracted parameters
        super().__init__(
            name="CommanderAgent",
            system_message=system_message,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=api_key,
            config_list=config_list
        )
        
        self.agents = {}
        self._initialize_agents(config)
        logger.info("CommanderAgent initialized")
    
    def _initialize_agents(self, config: Dict[str, Any] = None) -> None:
        """
        Initialize all the agents in the system.
        
        Args:
            config: Configuration dictionary
        """
        if not config:
            config = {}
            
        try:
            # Initialize agents
            self.agents["data_analysis"] = DataAnalysisAgent(config.get("data_analysis", {}))
            self.agents["recommendation"] = RecommendationAgent(config.get("recommendation", {}))
            self.agents["forecasting"] = ForecastingAgent(config.get("forecasting", {}))
            self.agents["memory"] = MemoryAgent(config.get("memory", {}))
            self.agents["evaluator"] = EvaluatorAgent(config.get("evaluator", {}))
            self.agents["adapter"] = AdapterAgent(config.get("adapter", {}))
            
            logger.info("All agents initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing agents: {str(e)}")
            raise
    
    def detect_intent(self, query: str) -> Dict[str, Any]:
        """
        Detect the intent of a user query.
        
        Args:
            query: The user query
            
        Returns:
            Dict with intent information including:
            - intent_type: The type of intent (analysis, recommendation, forecasting, etc.)
            - confidence: Confidence score of the intent detection
            - entities: Any entities extracted from the query
        """
        # For now, implementing a simple keyword-based intent detection
        # This should be replaced with a more sophisticated NLP-based solution
        
        query_lower = query.lower()
        
        # Define intent patterns
        intent_patterns = {
            "analysis": ["analyze", "consumption", "usage", "trend", "compare", "anomaly", "pattern"],
            "recommendation": ["recommend", "suggestion", "optimize", "improve", "save", "efficiency", "reduce"],
            "forecasting": ["forecast", "predict", "future", "expected", "tomorrow", "next week", "projection"],
            "building": ["building", "facility", "property", "location", "site"],
            "weather": ["weather", "temperature", "humidity", "climate", "forecast"],
            "help": ["help", "guide", "instruction", "how to", "tutorial"]
        }
        
        # Count keyword matches for each intent
        intent_scores = {}
        entities = []
        
        for intent, keywords in intent_patterns.items():
            score = sum(1 for keyword in keywords if keyword in query_lower)
            if score > 0:
                intent_scores[intent] = score
                
        # If no intent matched, default to general help
        if not intent_scores:
            return {
                "intent_type": "help",
                "confidence": 1.0,
                "entities": []
            }
            
        # Get the intent with highest score
        max_intent = max(intent_scores.items(), key=lambda x: x[1])
        intent_type = max_intent[0]
        confidence = min(max_intent[1] / 3, 1.0)  # Normalize confidence
        
        return {
            "intent_type": intent_type,
            "confidence": confidence,
            "entities": entities
        }
    
    def route_query(self, query: str, user_role: str = "facility_manager") -> Dict[str, Any]:
        """
        Route a query to the appropriate agent based on intent.
        
        Args:
            query: The user query
            user_role: The role of the user
            
        Returns:
            Response from the appropriate agent
        """
        logger.info(f"Routing query: {query[:20]}...")
        
        try:
            # Detect intent of the query
            intent_data = self.detect_intent(query)
            intent = intent_data["intent_type"]
            
            # Route to appropriate agent based on intent
            if intent == "energy_analysis":
                if "data_analysis" in self.agents:
                    response = self.agents["data_analysis"].analyze_consumption(query, user_role)
                else:
                    response = {"error": "Data Analysis Agent not available"}
            
            elif intent == "anomaly_detection":
                if "data_analysis" in self.agents:
                    response = self.agents["data_analysis"].detect_anomalies(query, user_role)
                else:
                    response = {"error": "Data Analysis Agent not available"}
            
            elif intent == "forecast_request":
                if "forecasting" in self.agents:
                    response = self.agents["forecasting"].generate_forecast(query, user_role)
                else:
                    response = {"error": "Forecasting Agent not available"}
            
            elif intent == "recommendation_request":
                if "recommendation" in self.agents:
                    response = self.agents["recommendation"].generate_recommendations(query, user_role)
                else:
                    response = {"error": "Recommendation Agent not available"}
            
            elif intent == "building_info":
                if "adapter" in self.agents:
                    response = self.agents["adapter"].get_building_info(query, user_role)
                else:
                    response = {"error": "Adapter Agent not available"}
            
            elif intent == "comparison_request":
                if "data_analysis" in self.agents:
                    response = self.agents["data_analysis"].compare_consumption(query, user_role)
                else:
                    response = {"error": "Data Analysis Agent not available"}
            
            else:
                # Default handling for unknown or general queries
                response = {
                    "response": f"I received your query about '{query}'. How can I assist you further?",
                    "intent": intent,
                    "confidence": intent_data["confidence"]
                }
            
            # Log and return the response
            logger.info(f"Query processed with intent: {intent}")
            return response
            
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}")
            return {
                "error": f"Error processing query: {str(e)}",
                "intent": "error"
            }
    
    def process_query(self, query: str, user_role: str = "facility_manager") -> Dict[str, Any]:
        """
        Process a user query by determining intent and dispatching to appropriate agents.
        Wrapper for route_query for backward compatibility.
        
        Args:
            query: The user's query string
            user_role: The role of the user (facility_manager, energy_analyst, or executive)
            
        Returns:
            Dict containing processed information and response
        """
        return self.route_query(query, user_role)