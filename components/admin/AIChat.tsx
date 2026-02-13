
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { queryDataWithAI } from '../../services/aiService';

const AIChat: React.FC = () => {
  const { orders, menuItems, activeRestaurantId, aiConfig } = useStore();

  const tenantOrders = orders.filter(o => o.restaurantId === activeRestaurantId);
  const tenantMenuItems = menuItems.filter(m => m.restaurantId === activeRestaurantId);

  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hello! I'm your BistroFlow Analyst. Ask me anything about your sales, popular dishes, or business performance today." }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMsg = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    const aiResponse = await queryDataWithAI(
      userMsg,
      tenantOrders,
      tenantMenuItems,
      aiConfig?.apiKey || '',
      aiConfig?.provider || 'gemini',
      aiConfig?.model
    );

    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
  };

  const suggestions = [
    "Total sales today?",
    "Which is my best selling dish?",
    "Summary of cancelled orders",
    "How is my revenue compared to last week?"
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[600px] max-w-4xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-indigo-50 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
          <i className="fas fa-robot text-lg"></i>
        </div>
        <div>
          <h3 className="font-bold text-slate-800">BistroFlow Data Intelligence</h3>
          <p className="text-xs text-indigo-600 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span> Powered by Gemini
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user'
              ? 'bg-indigo-600 text-white rounded-tr-none'
              : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200'
              }`}>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 p-4 rounded-2xl text-sm text-slate-400 flex items-center gap-2">
              <span className="animate-bounce">●</span>
              <span className="animate-bounce [animation-delay:0.2s]">●</span>
              <span className="animate-bounce [animation-delay:0.4s]">●</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-6 pb-2 flex flex-wrap gap-2">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => { setQuery(s); }}
              className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors border border-indigo-100"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-slate-50">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your business data..."
            className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          />
          <button
            onClick={handleSend}
            disabled={!query.trim() || isTyping}
            className="absolute right-2 top-1.5 w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 disabled:bg-slate-300 transition-colors"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-2">
          This AI analyzes your real-time database to provide accurate insights.
        </p>
      </div>
    </div>
  );
};

export default AIChat;
