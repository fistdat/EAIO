"""
Base agent class for all agent implementations in the Energy AI Optimizer.
"""
import autogen
from typing import Dict, List, Optional, Tuple, Any, Union, Callable
import openai
import os
import json
import uuid
from datetime import datetime
import time
import random
import requests
import backoff
import traceback
from tenacity import retry, stop_after_attempt, wait_exponential

# Import configuration and logging
from config import config
from utils.logging_utils import get_logger

# Get logger
logger = get_logger('eaio.agent.base')

class BaseAgent:
    """
    Base agent class for the Energy AI Optimizer system.
    
    This class provides common functionality for all agent implementations.
    It serves as the foundation for specialized agents like DataAnalysisAgent,
    RecommendationAgent, ForecastingAgent, and CommanderAgent.
    """
    
    def __init__(
        self,
        name: str,
        system_message: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        api_key: Optional[str] = None,
        config_list: Optional[List[Dict[str, Any]]] = None
    ):
        """
        Initialize a base agent.
        
        Args:
            name: Agent name
            system_message: System message defining the agent's role
            model: LLM model to use
            temperature: Sampling temperature for the model
            max_tokens: Maximum number of tokens to generate
            api_key: OpenAI API key
            config_list: List of configuration options for AutoGen
        """
        self.name = name
        self.system_message = system_message
        self.model = model or config.OPENAI_MODEL
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.api_key = api_key or config.OPENAI_API_KEY
        self.agent_id = str(uuid.uuid4())
        
        # Create configuration list if not provided
        if config_list is None:
            self.config_list = [{
                'model': self.model,
                'api_key': self.api_key,
                'temperature': self.temperature,
            }]
            
            # Add max_tokens if specified
            if self.max_tokens:
                self.config_list[0]['max_tokens'] = self.max_tokens
        else:
            self.config_list = config_list
        
        # Initialize the message history
        self.message_history = []
        
        # Initialize the autogen agent
        self._init_agent()
        
        logger.info(f"Initialized {self.name} agent with ID: {self.agent_id}")
    
    def _run_llm_inference(self, prompt: str, **kwargs) -> Dict[str, Any]:
        """
        Run inference using the configured LLM.
        
        This is a direct way to interact with the LLM API for specialized needs.
        Most agent interactions should use the higher-level process_message method.
        
        Args:
            prompt: The prompt to send to the LLM
            **kwargs: Additional parameters to pass to the LLM API
            
        Returns:
            Dict[str, Any]: The LLM response
        """
        try:
            logger.info(f"Running LLM inference for {self.name} agent")
            
            # Set default parameters
            params = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": self.system_message},
                    {"role": "user", "content": prompt}
                ],
                "temperature": self.temperature,
            }
            
            # Add max_tokens if specified
            if self.max_tokens:
                params["max_tokens"] = self.max_tokens
                
            # Override defaults with any provided kwargs
            params.update(kwargs)
            
            # Make sure API key is set
            client = openai.OpenAI(api_key=self.api_key)
            
            # Call the OpenAI API
            response = client.chat.completions.create(**params)
            
            # Extract the response text
            response_content = response.choices[0].message.content
            
            # Record in history
            self._record_message("User", prompt)
            self._record_message(self.name, response_content)
            
            logger.info(f"LLM inference completed for {self.name} agent")
            
            # Return the full response object as a dict
            return {
                "content": response_content,
                "model": response.model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                },
                "finish_reason": response.choices[0].finish_reason
            }
        except Exception as e:
            logger.error(f"Error running LLM inference: {str(e)}")
            raise
    
    def _init_agent(self):
        """
        Initialize the AutoGen agent.
        """
        try:
            # Create LLM config
            llm_config = {
                "config_list": [
                    {
                        "model": self.model,
                        "api_key": self.api_key,
                    }
                ],
                "temperature": self.temperature,
                "seed": 42,
            }
            
            # Add max_tokens if specified
            if self.max_tokens:
                llm_config["max_tokens"] = self.max_tokens
            
            # Create the agent
            self.agent = autogen.AssistantAgent(
                name=self.name,
                system_message=self.system_message,
                llm_config=llm_config
            )
            
            logger.info(f"Created AutoGen agent for {self.name}")
        except Exception as e:
            logger.error(f"Error initializing AutoGen agent: {str(e)}")
            raise
    
    def process_message(self, message: str, sender: Optional[str] = None) -> str:
        """
        Process a message and generate a response.
        
        Args:
            message: The input message
            sender: The name of the sender
            
        Returns:
            str: The agent's response
        """
        try:
            logger.info(f"Processing message for {self.name} agent")
            
            # Create a user proxy agent for this interaction
            user_proxy = autogen.UserProxyAgent(
                name=sender or "User",
                human_input_mode="NEVER",
                is_termination_msg=lambda x: False,
            )
            
            # Record message in history
            self._record_message(sender or "User", message)
            
            # Generate response using the agent
            user_proxy.initiate_chat(
                self.agent, 
                message=message,
                clear_history=False
            )
            
            # Get the last response from the agent
            last_message = user_proxy.last_message()
            response_content = last_message.get("content", "") if last_message else ""
            
            # Record response in history
            self._record_message(self.name, response_content)
            
            logger.info(f"Generated response for {self.name} agent")
            return response_content
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            error_msg = f"Error processing your message: {str(e)}"
            self._record_message(self.name, error_msg)
            return error_msg
    
    def _record_message(self, sender: str, message: str):
        """
        Record a message in the agent's history.
        
        Args:
            sender: The name of the sender
            message: The message content
        """
        self.message_history.append({
            'timestamp': datetime.now().isoformat(),
            'sender': sender,
            'message': message
        })
    
    def get_history(self) -> List[Dict[str, Any]]:
        """
        Get the agent's message history.
        
        Returns:
            List[Dict[str, Any]]: List of message history entries
        """
        return self.message_history
    
    def clear_history(self):
        """
        Clear the agent's message history.
        """
        self.message_history = []
        # Also clear the AutoGen agent's chat history
        if hasattr(self.agent, 'clear_chat_history'):
            self.agent.clear_chat_history()
            logger.info(f"Cleared chat history for {self.name} agent")
    
    def save_history(self, file_path: Optional[str] = None) -> bool:
        """
        Save the agent's message history to a file.
        
        Args:
            file_path: Path to save the history (optional)
            
        Returns:
            bool: True if save was successful
        """
        try:
            if file_path is None:
                # Generate default file path
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                file_path = f"{self.name}_{timestamp}_history.json"
            
            # Create history object
            history_obj = {
                'agent_id': self.agent_id,
                'agent_name': self.name,
                'timestamp': datetime.now().isoformat(),
                'messages': self.message_history
            }
            
            # Write to file
            with open(file_path, 'w') as f:
                json.dump(history_obj, f, indent=2)
            
            logger.info(f"Saved message history to {file_path}")
            return True
        
        except Exception as e:
            logger.error(f"Error saving message history: {str(e)}")
            return False
    
    def load_history(self, file_path: str) -> bool:
        """
        Load message history from a file.
        
        Args:
            file_path: Path to the history file
            
        Returns:
            bool: True if load was successful
        """
        try:
            # Read from file
            with open(file_path, 'r') as f:
                history_obj = json.load(f)
            
            # Validate history object
            if 'messages' not in history_obj:
                logger.error(f"Invalid history file: {file_path}")
                return False
            
            # Set message history
            self.message_history = history_obj['messages']
            
            logger.info(f"Loaded message history from {file_path}")
            return True
        
        except Exception as e:
            logger.error(f"Error loading message history: {str(e)}")
            return False
    
    def get_system_message(self) -> str:
        """
        Get the agent's system message.
        
        Returns:
            str: System message
        """
        return self.system_message
    
    def update_system_message(self, new_message: str):
        """
        Update the agent's system message.
        
        Args:
            new_message: New system message
        """
        self.system_message = new_message
        # Reinitialize the agent with the new system message
        self._init_agent()
        logger.info(f"Updated system message for {self.name} agent")
    
    def get_config(self) -> Dict[str, Any]:
        """
        Get the agent's configuration.
        
        Returns:
            Dict[str, Any]: Agent configuration
        """
        return {
            'name': self.name,
            'model': self.model,
            'temperature': self.temperature,
            'max_tokens': self.max_tokens,
            'agent_id': self.agent_id
        }
    
    def update_config(self, config: Dict[str, Any]):
        """
        Update the agent's configuration.
        
        Args:
            config: New configuration parameters
        """
        # Update configuration attributes
        if 'name' in config:
            self.name = config['name']
        
        if 'model' in config:
            self.model = config['model']
        
        if 'temperature' in config:
            self.temperature = config['temperature']
        
        if 'max_tokens' in config:
            self.max_tokens = config['max_tokens']
        
        if 'api_key' in config:
            self.api_key = config['api_key']
        
        # Update config list
        self.config_list = [{
            'model': self.model,
            'api_key': self.api_key,
            'temperature': self.temperature,
        }]
        
        # Add max_tokens if specified
        if self.max_tokens:
            self.config_list[0]['max_tokens'] = self.max_tokens
        
        # Reinitialize the agent with the new configuration
        self._init_agent()
        
        logger.info(f"Updated configuration for {self.name} agent")
    
    def multi_step_processing(
        self, 
        inputs: Dict[str, Any], 
        steps: List[Callable[[Dict[str, Any]], Dict[str, Any]]]
    ) -> Dict[str, Any]:
        """
        Perform multi-step processing using a sequence of functions.
        
        This allows chaining together multiple processing steps, where each step
        takes the output of the previous step as input.
        
        Args:
            inputs: Initial input data
            steps: List of processing functions
            
        Returns:
            Dict[str, Any]: Final processing results
        """
        try:
            logger.info(f"Starting multi-step processing with {len(steps)} steps")
            
            results = inputs.copy()
            
            # Execute each step in sequence
            for i, step in enumerate(steps):
                logger.info(f"Executing step {i+1}/{len(steps)}")
                
                # Call the step function with the current results
                step_result = step(results)
                
                # Update results with the step output
                results.update(step_result)
            
            logger.info(f"Completed multi-step processing")
            
            return results
        
        except Exception as e:
            logger.error(f"Error in multi-step processing: {str(e)}")
            raise 