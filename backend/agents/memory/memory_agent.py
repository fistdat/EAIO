"""
Memory Agent implementation for the Energy AI Optimizer.
"""
from typing import Dict, List, Optional, Any, Union
import pandas as pd
import json
import os
from datetime import datetime, timedelta
import shutil

from agents.base_agent import BaseAgent
from utils.logging_utils import get_logger

# Get logger
logger = get_logger('eaio.agent.memory')

class MemoryAgent(BaseAgent):
    """
    Memory Agent for maintaining system knowledge and building energy consumption history.
    
    This agent is responsible for:
    - Storing historical data from analysis and recommendations
    - Retrieving relevant historical context for current queries
    - Tracking changes in building performance over time
    - Maintaining user preferences and conversation history
    - Supporting long-term learning across multiple interactions
    """
    
    def __init__(
        self,
        name: str = "MemoryAgent",
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: Optional[int] = 2000,
        api_key: Optional[str] = None,
        memory_dir: str = "memory_storage"
    ):
        """
        Initialize the Memory Agent.
        
        Args:
            name: Agent name
            model: LLM model to use
            temperature: Sampling temperature for the model
            max_tokens: Maximum number of tokens to generate
            api_key: OpenAI API key
            memory_dir: Directory to store memory files
        """
        # Define system message for memory role
        system_message = """
        You are an Energy Memory Agent, part of the Energy AI Optimizer system.
        Your primary role is to maintain historical knowledge about building energy data,
        past analyses, and recommendations.
        
        Your capabilities include:
        1. Retrieving relevant historical context for current queries
        2. Summarizing past analyses and recommendations
        3. Identifying trends and changes in building performance over time
        4. Providing continuity across multiple user interactions
        5. Maintaining user preferences and conversation history
        
        When retrieving or summarizing information, focus on:
        - Relevance to the current query or context
        - Important patterns or trends over time
        - Previous recommendations and their outcomes
        - User-specific preferences and history
        - Changes in building performance metrics
        
        Your role is to provide historical context and continuity to make the overall
        system more effective at optimizing energy usage over time.
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
        
        # Set up memory storage
        self.memory_dir = os.path.join(os.getcwd(), memory_dir)
        self._ensure_memory_directories()
        
        logger.info(f"Initialized {name} with memory storage at {self.memory_dir}")
    
    def _ensure_memory_directories(self):
        """Create necessary directories for memory storage if they don't exist."""
        try:
            # Create main memory directory
            if not os.path.exists(self.memory_dir):
                os.makedirs(self.memory_dir)
                logger.info(f"Created memory directory: {self.memory_dir}")
            
            # Create subdirectories for different types of memories
            subdirs = [
                'building_data',     # For building energy data
                'analyses',          # For analysis results
                'recommendations',   # For recommendation history
                'forecasts',         # For forecast history
                'conversations',     # For conversation history
                'user_preferences',  # For user preferences
            ]
            
            for subdir in subdirs:
                subdir_path = os.path.join(self.memory_dir, subdir)
                if not os.path.exists(subdir_path):
                    os.makedirs(subdir_path)
                    logger.info(f"Created memory subdirectory: {subdir_path}")
        
        except Exception as e:
            logger.error(f"Error creating memory directories: {str(e)}")
            raise
    
    def store_analysis_result(
        self, 
        building_id: str,
        analysis_result: Dict[str, Any],
        analysis_type: str = "consumption_patterns"
    ) -> Dict[str, Any]:
        """
        Store an analysis result in memory.
        
        Args:
            building_id: Building identifier
            analysis_result: Analysis result to store
            analysis_type: Type of analysis (consumption_patterns, anomalies, etc.)
            
        Returns:
            Dict[str, Any]: Result of the store operation
        """
        try:
            logger.info(f"Storing {analysis_type} analysis for building {building_id}")
            
            # Create a timestamped filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{building_id}_{analysis_type}_{timestamp}.json"
            file_path = os.path.join(self.memory_dir, 'analyses', filename)
            
            # Add metadata to the analysis result
            storage_obj = {
                'building_id': building_id,
                'analysis_type': analysis_type,
                'timestamp': datetime.now().isoformat(),
                'result': analysis_result
            }
            
            # Write to file
            with open(file_path, 'w') as f:
                json.dump(storage_obj, f, indent=2)
            
            logger.info(f"Stored analysis result to {file_path}")
            
            return {
                'status': 'success',
                'file_path': file_path,
                'building_id': building_id,
                'analysis_type': analysis_type,
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error storing analysis result: {str(e)}")
            raise
    
    def store_recommendation(
        self, 
        building_id: str,
        recommendation: Dict[str, Any],
        user_role: str
    ) -> Dict[str, Any]:
        """
        Store a recommendation in memory.
        
        Args:
            building_id: Building identifier
            recommendation: Recommendation to store
            user_role: Role of the user who received the recommendation
            
        Returns:
            Dict[str, Any]: Result of the store operation
        """
        try:
            logger.info(f"Storing recommendation for building {building_id} (user role: {user_role})")
            
            # Create a timestamped filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{building_id}_recommendation_{timestamp}.json"
            file_path = os.path.join(self.memory_dir, 'recommendations', filename)
            
            # Add metadata to the recommendation
            storage_obj = {
                'building_id': building_id,
                'user_role': user_role,
                'timestamp': datetime.now().isoformat(),
                'recommendation': recommendation
            }
            
            # Write to file
            with open(file_path, 'w') as f:
                json.dump(storage_obj, f, indent=2)
            
            logger.info(f"Stored recommendation to {file_path}")
            
            return {
                'status': 'success',
                'file_path': file_path,
                'building_id': building_id,
                'user_role': user_role,
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error storing recommendation: {str(e)}")
            raise
    
    def store_forecast(
        self, 
        building_id: str,
        forecast: Dict[str, Any],
        forecast_horizon: str
    ) -> Dict[str, Any]:
        """
        Store a forecast in memory.
        
        Args:
            building_id: Building identifier
            forecast: Forecast to store
            forecast_horizon: Forecast horizon (day_ahead, week_ahead, month_ahead)
            
        Returns:
            Dict[str, Any]: Result of the store operation
        """
        try:
            logger.info(f"Storing {forecast_horizon} forecast for building {building_id}")
            
            # Create a timestamped filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{building_id}_{forecast_horizon}_{timestamp}.json"
            file_path = os.path.join(self.memory_dir, 'forecasts', filename)
            
            # Add metadata to the forecast
            storage_obj = {
                'building_id': building_id,
                'forecast_horizon': forecast_horizon,
                'timestamp': datetime.now().isoformat(),
                'forecast': forecast
            }
            
            # Write to file
            with open(file_path, 'w') as f:
                json.dump(storage_obj, f, indent=2)
            
            logger.info(f"Stored forecast to {file_path}")
            
            return {
                'status': 'success',
                'file_path': file_path,
                'building_id': building_id,
                'forecast_horizon': forecast_horizon,
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error storing forecast: {str(e)}")
            raise
    
    def store_conversation(
        self, 
        conversation_id: str,
        user_role: str,
        messages: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Store a conversation in memory.
        
        Args:
            conversation_id: Unique conversation identifier
            user_role: Role of the user in the conversation
            messages: List of conversation messages
            
        Returns:
            Dict[str, Any]: Result of the store operation
        """
        try:
            logger.info(f"Storing conversation {conversation_id} for user role {user_role}")
            
            # Create a filename based on conversation ID
            filename = f"{conversation_id}.json"
            file_path = os.path.join(self.memory_dir, 'conversations', filename)
            
            # Add metadata to the conversation
            storage_obj = {
                'conversation_id': conversation_id,
                'user_role': user_role,
                'updated_at': datetime.now().isoformat(),
                'messages': messages
            }
            
            # Check if conversation already exists
            if os.path.exists(file_path):
                # Load existing conversation
                with open(file_path, 'r') as f:
                    existing_data = json.load(f)
                
                # Update existing conversation
                existing_data['messages'] = messages
                existing_data['updated_at'] = datetime.now().isoformat()
                storage_obj = existing_data
            
            # Write to file
            with open(file_path, 'w') as f:
                json.dump(storage_obj, f, indent=2)
            
            logger.info(f"Stored conversation to {file_path}")
            
            return {
                'status': 'success',
                'file_path': file_path,
                'conversation_id': conversation_id,
                'user_role': user_role,
                'updated_at': datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error storing conversation: {str(e)}")
            raise
    
    def retrieve_building_history(
        self, 
        building_id: str,
        days: int = 30,
        content_types: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Retrieve historical data for a specific building.
        
        Args:
            building_id: Building identifier
            days: Number of days to look back
            content_types: Types of content to retrieve (analyses, recommendations, forecasts)
            
        Returns:
            Dict[str, Any]: Retrieved historical data
        """
        try:
            logger.info(f"Retrieving {days}-day history for building {building_id}")
            
            # Set default content types if not specified
            if content_types is None:
                content_types = ['analyses', 'recommendations', 'forecasts']
            
            # Calculate cutoff date
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Initialize results
            history = {
                'building_id': building_id,
                'period': {
                    'days': days,
                    'from': cutoff_date.isoformat(),
                    'to': datetime.now().isoformat()
                },
                'content_types': content_types,
                'items': []
            }
            
            # Process each content type
            for content_type in content_types:
                if content_type not in ['analyses', 'recommendations', 'forecasts']:
                    logger.warning(f"Skipping unknown content type: {content_type}")
                    continue
                
                # Get directory for this content type
                dir_path = os.path.join(self.memory_dir, content_type)
                
                # Skip if directory doesn't exist
                if not os.path.exists(dir_path):
                    logger.warning(f"Directory not found: {dir_path}")
                    continue
                
                # Get all files in the directory
                try:
                    files = [f for f in os.listdir(dir_path) if f.startswith(f"{building_id}_")]
                except Exception as e:
                    logger.warning(f"Error listing files in {dir_path}: {str(e)}")
                    continue
                
                # Process each file
                for filename in files:
                    file_path = os.path.join(dir_path, filename)
                    
                    try:
                        with open(file_path, 'r') as f:
                            data = json.load(f)
                        
                        # Check if within time range
                        item_date = datetime.fromisoformat(data.get('timestamp', ''))
                        if item_date >= cutoff_date:
                            # Add content type to the item
                            data['content_type'] = content_type
                            history['items'].append(data)
                    
                    except Exception as e:
                        logger.warning(f"Error processing file {file_path}: {str(e)}")
            
            # Sort items by timestamp (newest first)
            history['items'].sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            
            logger.info(f"Retrieved {len(history['items'])} historical items for building {building_id}")
            
            # Generate a summary of the retrieved history
            if history['items']:
                summary = self._generate_history_summary(history)
                history['summary'] = summary
            
            return history
        
        except Exception as e:
            logger.error(f"Error retrieving building history: {str(e)}")
            raise
    
    def _generate_history_summary(self, history: Dict[str, Any]) -> str:
        """
        Generate a summary of historical data.
        
        Args:
            history: Retrieved historical data
            
        Returns:
            str: Summary of the historical data
        """
        try:
            # Prepare data for the LLM
            history_json = json.dumps(history, indent=2)
            
            prompt = f"""
            Summarize this historical energy data for a building:
            
            {history_json}
            
            Provide a concise summary that includes:
            1. Overview of the time period and data available
            2. Key findings from analyses (if present)
            3. Major recommendations made (if present)
            4. Forecast trends (if present)
            5. Notable changes or patterns over time
            
            Focus on the most important insights that would be relevant for
            continuing energy optimization efforts.
            """
            
            # Get summary from the LLM
            summary = self.process_message(prompt)
            
            return summary
        
        except Exception as e:
            logger.error(f"Error generating history summary: {str(e)}")
            return "Could not generate summary due to an error."
    
    def retrieve_user_context(
        self, 
        user_id: str,
        user_role: str
    ) -> Dict[str, Any]:
        """
        Retrieve user context, preferences, and recent interactions.
        
        Args:
            user_id: User identifier
            user_role: User role
            
        Returns:
            Dict[str, Any]: User context information
        """
        try:
            logger.info(f"Retrieving context for user {user_id} (role: {user_role})")
            
            # Initialize user context
            user_context = {
                'user_id': user_id,
                'user_role': user_role,
                'preferences': self._get_user_preferences(user_id),
                'recent_conversations': self._get_recent_conversations(user_id),
                'timestamp': datetime.now().isoformat()
            }
            
            # Get recent building interactions
            recent_buildings = self._get_recent_building_interactions(user_id)
            if recent_buildings:
                user_context['recent_buildings'] = recent_buildings
            
            logger.info(f"Retrieved context for user {user_id}")
            
            return user_context
        
        except Exception as e:
            logger.error(f"Error retrieving user context: {str(e)}")
            raise
    
    def _get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """Get user preferences from storage."""
        prefs_file = os.path.join(self.memory_dir, 'user_preferences', f"{user_id}.json")
        
        if os.path.exists(prefs_file):
            try:
                with open(prefs_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Error reading user preferences: {str(e)}")
        
        # Return default preferences if not found
        return {
            'preferred_metrics': ['electricity_consumption', 'gas_consumption'],
            'default_time_period': '30d',
            'notification_preferences': 'all',
        }
    
    def _get_recent_conversations(self, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Get recent conversations for a user."""
        conversations = []
        conversations_dir = os.path.join(self.memory_dir, 'conversations')
        
        if not os.path.exists(conversations_dir):
            return conversations
        
        try:
            # Get all conversation files
            files = [f for f in os.listdir(conversations_dir) if f.endswith('.json')]
            
            # Process each file
            for filename in files:
                file_path = os.path.join(conversations_dir, filename)
                
                try:
                    with open(file_path, 'r') as f:
                        data = json.load(f)
                    
                    # Check if conversation involves this user
                    if data.get('user_id') == user_id:
                        # Create a summary entry
                        summary = {
                            'conversation_id': data.get('conversation_id'),
                            'date': data.get('updated_at'),
                            'message_count': len(data.get('messages', [])),
                            'summary': self._summarize_conversation(data.get('messages', []))
                        }
                        conversations.append(summary)
                
                except Exception as e:
                    logger.warning(f"Error processing conversation file {file_path}: {str(e)}")
            
            # Sort by date (newest first) and limit
            conversations.sort(key=lambda x: x.get('date', ''), reverse=True)
            return conversations[:limit]
        
        except Exception as e:
            logger.warning(f"Error getting recent conversations: {str(e)}")
            return []
    
    def _summarize_conversation(self, messages: List[Dict[str, Any]]) -> str:
        """Generate a brief summary of a conversation."""
        if not messages:
            return "Empty conversation"
        
        # For simplicity, use first and last messages to create a summary
        first_msg = messages[0].get('content', '') if messages[0].get('role') == 'user' else ''
        last_msg = messages[-2].get('content', '') if len(messages) > 1 and messages[-2].get('role') == 'user' else ''
        
        if not first_msg:
            first_msg = "Conversation start"
        if not last_msg:
            last_msg = "Conversation end"
        
        return f"Started with: '{first_msg[:50]}...' and ended with: '{last_msg[:50]}...'"
    
    def _get_recent_building_interactions(self, user_id: str) -> List[Dict[str, Any]]:
        """Get buildings that the user has recently interacted with."""
        # This would normally involve more complex logic with a database
        # For simplicity, we'll check for any building data with this user associated
        return []
    
    def update_user_preferences(
        self, 
        user_id: str, 
        preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update user preferences in memory.
        
        Args:
            user_id: User identifier
            preferences: User preferences to update
            
        Returns:
            Dict[str, Any]: Updated preferences
        """
        try:
            logger.info(f"Updating preferences for user {user_id}")
            
            # Create user preferences directory if it doesn't exist
            prefs_dir = os.path.join(self.memory_dir, 'user_preferences')
            if not os.path.exists(prefs_dir):
                os.makedirs(prefs_dir)
            
            # Get current preferences
            current_prefs = self._get_user_preferences(user_id)
            
            # Update preferences
            updated_prefs = {**current_prefs, **preferences}
            updated_prefs['updated_at'] = datetime.now().isoformat()
            
            # Write to file
            prefs_file = os.path.join(prefs_dir, f"{user_id}.json")
            with open(prefs_file, 'w') as f:
                json.dump(updated_prefs, f, indent=2)
            
            logger.info(f"Updated preferences for user {user_id}")
            
            return {
                'status': 'success',
                'user_id': user_id,
                'preferences': updated_prefs,
                'updated_at': datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error updating user preferences: {str(e)}")
            raise
    
    def purge_old_data(self, days_to_keep: int = 365) -> Dict[str, Any]:
        """
        Remove old data from memory storage.
        
        Args:
            days_to_keep: Number of days of data to keep
            
        Returns:
            Dict[str, Any]: Purge operation results
        """
        try:
            logger.info(f"Purging data older than {days_to_keep} days")
            
            # Calculate cutoff date
            cutoff_date = datetime.now() - timedelta(days=days_to_keep)
            
            # Directories to check
            dirs_to_check = ['analyses', 'recommendations', 'forecasts']
            
            # Count of purged files
            purged_count = 0
            
            # Process each directory
            for dir_name in dirs_to_check:
                dir_path = os.path.join(self.memory_dir, dir_name)
                
                # Skip if directory doesn't exist
                if not os.path.exists(dir_path):
                    continue
                
                # Get all files in the directory
                files = [f for f in os.listdir(dir_path) if f.endswith('.json')]
                
                # Process each file
                for filename in files:
                    file_path = os.path.join(dir_path, filename)
                    
                    try:
                        with open(file_path, 'r') as f:
                            data = json.load(f)
                        
                        # Check if file is old enough to purge
                        timestamp = data.get('timestamp')
                        if timestamp:
                            file_date = datetime.fromisoformat(timestamp)
                            if file_date < cutoff_date:
                                # Delete the file
                                os.remove(file_path)
                                purged_count += 1
                    
                    except Exception as e:
                        logger.warning(f"Error processing file for purge {file_path}: {str(e)}")
            
            logger.info(f"Purged {purged_count} files older than {days_to_keep} days")
            
            return {
                'status': 'success',
                'purged_count': purged_count,
                'days_kept': days_to_keep,
                'cutoff_date': cutoff_date.isoformat(),
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error purging old data: {str(e)}")
            raise 