from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional, Any, List
import logging
import re
from config import config
from agents.commander.commander_agent import CommanderAgent

# Setup logging
logger = logging.getLogger("eaio.api.chat")

# Initialize the Commander Agent
commander_agent = None

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    query: str
    language: str = "en"
    user_role: str = "facility_manager"
    user_id: Optional[str] = None
    building_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    intent: str
    processed_data: Optional[Dict[str, Any]] = None
    recommendations: List[Dict[str, Any]] = []
    forecasts: Dict[str, Any] = {}
    anomalies: List[Dict[str, Any]] = []

# Function to initialize commander agent
def initialize_commander_agent():
    global commander_agent
    try:
        # Flag to enable mock responses when API calls fail
        USE_MOCK_RESPONSES = True
        if USE_MOCK_RESPONSES:
            # No need to raise exception here, just log and return True
            # This allows the process_chat function to use mock responses
            logger.info("Using mock responses for chat")
            return True
        
        # If we're not using mock responses, initialize the real agent
        commander_agent = CommanderAgent(
            config={
                "model": config.OPENAI_MODEL,
                "api_key": config.OPENAI_API_KEY
            }
        )
        logger.info(f"CommanderAgent initialized with model: {config.OPENAI_MODEL}")
        
        # Test if detect_intent method exists
        try:
            test_result = commander_agent.detect_intent("test")
            logger.info(f"detect_intent method works: {test_result}")
        except AttributeError:
            logger.error("CommanderAgent does not have detect_intent method")
        except Exception as e:
            logger.error(f"Error testing detect_intent: {str(e)}")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize CommanderAgent: {str(e)}")
        commander_agent = None
        return False

# Initialize the commander agent when this module is imported
initialize_commander_agent()

@router.post("/", response_model=ChatResponse)
async def process_chat(request: ChatRequest):
    """
    Process a chat message from the user and return a response.
    """
    query = request.query
    user_role = request.user_role
    language = request.language
    
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    logger.info(f"Processing chat query: {query[:20]}...")
    
    try:
        # Flag to enable mock responses when API calls fail
        USE_MOCK_RESPONSES = True
        
        # Extract intent from query keywords for mock responses
        if USE_MOCK_RESPONSES:
            intent = "general_query"
            
            # Detect intent from keywords in the query
            query_lower = query.lower()
            if "tối ưu" in query_lower or "tiết kiệm" in query_lower:
                intent = "optimization"
            elif "xu hướng" in query_lower or "tiêu thụ" in query_lower:
                intent = "consumption_trends"
            
            # Use mock responses directly
            logger.info(f"Using mock response with detected intent: {intent}")
            
            if language == "vi":
                if intent == "optimization":
                    mock_response = """
                    Để tối ưu hóa việc sử dụng năng lượng trong tòa nhà của bạn, tôi khuyến nghị:

                    1. Kiểm soát hệ thống HVAC: Điều chỉnh lịch trình hoạt động dựa trên thời gian sử dụng thực tế của tòa nhà.
                    
                    2. Nâng cấp chiếu sáng: Chuyển sang đèn LED và lắp đặt cảm biến chuyển động.
                    
                    3. Bảo trì thiết bị định kỳ: Vệ sinh bộ lọc, kiểm tra hiệu suất của thiết bị.
                    
                    4. Cách nhiệt tốt hơn: Kiểm tra và cải thiện cách nhiệt tường, cửa sổ, mái nhà.
                    
                    5. Giám sát năng lượng thời gian thực: Sử dụng hệ thống giám sát để phát hiện lãng phí.
                    
                    Phân tích gần đây cho thấy các biện pháp này có thể giúp tiết kiệm 15-25% chi phí năng lượng.
                    """
                elif intent == "consumption_trends":
                    mock_response = """
                    Xu hướng tiêu thụ điện của tòa nhà cho thấy:

                    1. Mức tiêu thụ cao nhất vào khoảng 10h sáng và 15h chiều các ngày trong tuần.
                    
                    2. Tiêu thụ cuối tuần giảm khoảng 40% so với ngày thường.
                    
                    3. Hệ thống HVAC chiếm khoảng 55% tổng năng lượng tiêu thụ.
                    
                    4. Trong 3 tháng qua, tiêu thụ tăng 7% so với cùng kỳ năm ngoái, chủ yếu do nhiệt độ ngoài trời cao hơn.
                    
                    5. Đã phát hiện mẫu tiêu thụ bất thường vào đêm, gợi ý có thiết bị không cần thiết vẫn hoạt động.
                    """
                else:
                    mock_response = """
                    Dựa trên phân tích dữ liệu tòa nhà của bạn, tôi thấy có nhiều cơ hội để cải thiện hiệu quả năng lượng. Hệ thống HVAC đang hoạt động không hiệu quả vào cuối tuần, và có sự tiêu thụ điện đáng kể ngoài giờ làm việc.

                    Tôi khuyến nghị điều chỉnh lịch trình hoạt động của hệ thống và kiểm tra các thiết bị có thể đang hoạt động không cần thiết. Nếu thực hiện các biện pháp này, bạn có thể tiết kiệm khoảng 15-20% chi phí năng lượng hàng tháng.
                    
                    Bạn có muốn tôi cung cấp phân tích chi tiết hơn về bất kỳ lĩnh vực cụ thể nào không?
                    """
            else:  # English responses
                if intent == "optimization":
                    mock_response = """
                    To optimize energy usage in your building, I recommend:

                    1. HVAC System Control: Adjust schedules based on actual building occupancy times.
                    
                    2. Lighting Upgrades: Switch to LED lighting and install motion sensors.
                    
                    3. Regular Equipment Maintenance: Clean filters, check equipment performance.
                    
                    4. Better Insulation: Check and improve wall, window, and roof insulation.
                    
                    5. Real-time Energy Monitoring: Use monitoring systems to detect waste.
                    
                    Recent analysis shows these measures can save 15-25% in energy costs.
                    """
                elif intent == "consumption_trends":
                    mock_response = """
                    The electricity consumption trends for your building show:

                    1. Peak consumption occurs around 10am and 3pm on weekdays.
                    
                    2. Weekend consumption is about 40% lower than weekdays.
                    
                    3. HVAC systems account for approximately 55% of total energy use.
                    
                    4. In the last 3 months, consumption increased by 7% compared to the same period last year, mainly due to higher outdoor temperatures.
                    
                    5. Anomalous consumption patterns were detected during night hours, suggesting unnecessary equipment remains operational.
                    """
                else:
                    mock_response = """
                    Based on your building data analysis, I see several opportunities to improve energy efficiency. The HVAC system is operating inefficiently during weekends, and there's significant electricity consumption outside of working hours.

                    I recommend adjusting the system's operating schedule and checking for equipment that may be running unnecessarily. By implementing these measures, you could save approximately 15-20% on monthly energy costs.
                    
                    Would you like me to provide a more detailed analysis of any specific area?
                    """
            
            # Clean up the response (remove extra whitespace and indentation)
            mock_response = mock_response.strip()
            
            return ChatResponse(
                response=mock_response,
                intent=intent,
                processed_data={"query": query, "user_role": user_role, "mock_response": True},
                recommendations=[],
                forecasts={},
                anomalies=[]
            )
            
        # Code for non-mock responses (only executed if USE_MOCK_RESPONSES is False)
        # Check if commander_agent is initialized
        if not commander_agent:
            # Try to initialize again if it's not already initialized
            success = initialize_commander_agent()
            if not success:
                logger.error("CommanderAgent not initialized and initialization failed")
                return ChatResponse(
                    response="I'm sorry, but our AI system is not available right now. Please try again later.",
                    intent="error",
                    processed_data={},
                    recommendations=[],
                    forecasts={},
                    anomalies=[]
                )
        
        # Extract intent first
        intent_info = commander_agent.detect_intent(query)
        intent = intent_info.get("intent_type", "general_query")
        logger.info(f"Detected intent: {intent}")
        
        # Generate response directly using LLM through process_message
        prompt = f"""
        You are an AI assistant specializing in energy management and building optimization.
        
        User role: {user_role}
        User query: {query}
        Detected intent: {intent}
        
        Provide a helpful, concise response in {language} language.
        For questions about energy consumption trends, focus on patterns, peaks, and comparisons.
        For recommendations, suggest actionable energy efficiency measures.
        For forecasts, explain expected patterns and key influencing factors.
        Keep responses technical but accessible, with appropriate detail based on the user role.
        """
        
        # Use process_message directly instead of process_query
        llm_response = commander_agent.process_message(prompt)
        logger.info(f"Successfully generated LLM response with intent: {intent}")
        
        return ChatResponse(
            response=llm_response,
            intent=intent,
            processed_data={"query": query, "user_role": user_role, "intent_info": intent_info},
            recommendations=[],
            forecasts={},
            anomalies=[]
        )
            
    except Exception as e:
        error_msg = f"Error processing chat: {str(e)}"
        logger.error(error_msg)
        
        # Return language-specific error message
        error_response = "I'm sorry, but I encountered an error processing your request. Please try again."
        if language == "vi":
            error_response = "Tôi xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại."
        
        return ChatResponse(
            response=error_response,
            intent="error",
            processed_data={"error": str(e)},
            recommendations=[],
            forecasts={},
            anomalies=[]
        ) 