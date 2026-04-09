
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, X, Trash2, ArrowLeft } from 'lucide-react';
import { chatWithParamMitra } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ParamMitraChatProps {
    onClose?: () => void;
}

const ParamMitraChat: React.FC<ParamMitraChatProps> = ({ onClose }) => {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: language === 'English' 
          ? "Namaste! I am Param Mitra, your farming companion. Ask me anything about crops, schemes, or weather! 🌱"
          : `Namaste! (${language}) I am Param Mitra. Ask me anything!`, // A simplified initial placeholder, the AI will adapt immediately after 1st message.
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Prepare history for API
    const history = messages.map(m => ({
      role: m.sender === 'user' ? 'user' : 'model' as 'user' | 'model',
      text: m.text
    }));

    // Pass the current language to the AI service
    const responseText = await chatWithParamMitra(history, userMsg.text, language);

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      text: responseText,
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  const handleClear = () => {
      setMessages([{
        id: Date.now().toString(),
        text: "Chat cleared.",
        sender: 'bot',
        timestamp: new Date()
      }]);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Header for Overlay Mode */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-3">
              {onClose && (
                  <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                      <ArrowLeft size={20} className="text-gray-600"/>
                  </button>
              )}
              <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-tr from-emerald-500 to-teal-500 p-1.5 rounded-full">
                      <Bot size={18} className="text-white" />
                  </div>
                  <div>
                      <h3 className="font-bold text-gray-800 leading-none">{t('chat_title', 'Param Mitra')}</h3>
                      <p className="text-[10px] text-emerald-600 font-medium">{t('chat_subtitle', 'AI Assistant')}</p>
                  </div>
              </div>
          </div>
          <button onClick={handleClear} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition" title="Clear Chat">
              <Trash2 size={18} />
          </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}
          >
            <div className={`flex max-w-[85%] gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.sender === 'user' ? 'bg-gray-800' : 'bg-white'}`}>
                {msg.sender === 'user' ? <User size={14} className="text-white" /> : <Sparkles size={14} className="text-emerald-500" />}
              </div>
              
              <div className={`p-3.5 rounded-2xl shadow-sm text-sm ${
                msg.sender === 'user' 
                  ? 'bg-gray-800 text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
              }`}>
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <p className={`text-[9px] mt-1 text-right ${msg.sender === 'user' ? 'text-gray-400' : 'text-gray-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
           <div className="flex justify-start animate-fade-in">
             <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm ml-10">
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-gray-100 absolute bottom-0 w-full z-20">
        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-full border border-gray-200 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('chat_placeholder', 'Ask anything...')}
            className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none text-gray-800 placeholder-gray-500"
            autoFocus
          />
          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            className={`p-2.5 rounded-full shadow-md transition transform active:scale-95 flex items-center justify-center ${
                !inputText.trim() ? 'bg-gray-300 text-gray-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParamMitraChat;
