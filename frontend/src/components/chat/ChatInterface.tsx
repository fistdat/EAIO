import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  language?: 'en' | 'vi';
}

const SAMPLE_QUESTIONS = {
  en: [
    "What's my electricity consumption trend?",
    "Any unusual usage patterns?",
    "How can I optimize my energy usage?",
    "Compare my usage with last month"
  ],
  vi: [
    "Xu hướng tiêu thụ điện của tôi như thế nào?",
    "Có mẫu tiêu thụ bất thường nào không?",
    "Làm thế nào để tối ưu hóa việc sử dụng năng lượng?",
    "So sánh mức tiêu thụ của tôi với tháng trước"
  ]
};

const PLACEHOLDER_TEXT = {
  en: "Ask about energy usage, patterns, or recommendations...",
  vi: "Hỏi về việc sử dụng năng lượng, các mẫu tiêu thụ, hoặc khuyến nghị..."
};

const INTRO_TEXT = {
  en: "Ask me about your energy usage patterns, anomalies, or recommendations.",
  vi: "Hỏi tôi về các mẫu tiêu thụ năng lượng, bất thường, hoặc các khuyến nghị của bạn."
};

const CHAT_HEADER = {
  en: "Ask EnergyAI",
  vi: "Hỏi EnergyAI"
};

const TRY_QUESTIONS = {
  en: "Try questions like",
  vi: "Thử những câu hỏi như"
};

export default function ChatInterface({ language = 'en' }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Set language to 'vi' for Vietnamese responses
  const currentLanguage = language || 'vi';
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      // Send query to backend
      const response = await fetch('/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: input,
          language: currentLanguage,
          user_role: 'facility_manager', // Default role
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Add AI response
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      
      // Add error message
      const errorMessage = currentLanguage === 'vi' 
        ? 'Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.'
        : 'Sorry, an error occurred while processing your request. Please try again later.';
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSampleQuestion = (question: string) => {
    setInput(question);
  };
  
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-blue-600 text-white p-4">
        <h2 className="text-xl font-semibold">{CHAT_HEADER[currentLanguage]}</h2>
        <p className="text-sm opacity-90">{INTRO_TEXT[currentLanguage]}</p>
      </div>
      
      {messages.length === 0 ? (
        <div className="flex-1 p-4 flex flex-col items-center justify-center text-gray-500">
          <p className="mb-4 text-center">{TRY_QUESTIONS[currentLanguage]}:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-2xl">
            {SAMPLE_QUESTIONS[currentLanguage].map((question, index) => (
              <button
                key={index}
                className="bg-gray-100 hover:bg-gray-200 rounded-lg p-3 text-left text-sm transition-colors"
                onClick={() => handleSampleQuestion(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
            >
              <div 
                className={`inline-block max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
              >
                {message.content}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-800">
                  {currentLanguage === 'vi' ? 'Đang xử lý...' : 'Processing...'}
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDER_TEXT[currentLanguage]}
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
} 