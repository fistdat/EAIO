import React, { useState } from 'react';
import ChatInterface from './ChatInterface';
import { Settings } from 'lucide-react';

export default function ChatPage() {
  const [language, setLanguage] = useState<'en' | 'vi'>('vi');
  
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'vi' : 'en');
  };
  
  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-6rem)]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          {language === 'en' ? 'Energy AI Assistant' : 'Trợ Lý AI Năng Lượng'}
        </h1>
        <button 
          onClick={toggleLanguage}
          className="inline-flex items-center text-sm rounded-md border px-3 py-1 hover:bg-gray-100 transition-colors"
        >
          <Settings className="h-4 w-4 mr-2" />
          {language === 'en' ? 'Tiếng Việt' : 'English'}
        </button>
      </div>
      
      <div className="h-[calc(100%-3rem)]">
        <ChatInterface language={language} />
      </div>
    </div>
  );
} 