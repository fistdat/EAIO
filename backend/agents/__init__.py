"""
Initialization module for the agent layer of Energy AI Optimizer system.
This module provides access to all agent types.
"""

# Import all agent types for easy access
from agents.base_agent import BaseAgent
from agents.data_analysis import DataAnalysisAgent
from agents.recommendation import RecommendationAgent
from agents.forecasting import ForecastingAgent
from agents.commander import CommanderAgent
from agents.memory import MemoryAgent
from agents.evaluator import EvaluatorAgent
from agents.adapter import AdapterAgent

__all__ = [
    'BaseAgent',
    'DataAnalysisAgent',
    'RecommendationAgent',
    'ForecastingAgent',
    'CommanderAgent',
    'MemoryAgent',
    'EvaluatorAgent',
    'AdapterAgent'
] 