import React, { useState, useEffect, useRef } from 'react';
import { RolePlayScenario } from '../types';
import { getRolePlayResponse } from '../services/geminiService';
import { Send, Bot, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface RolePlayArenaProps {
  scenario: RolePlayScenario;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const RolePlayArena: React.FC<RolePlayArenaProps> = ({ scenario }) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ role: 'model', text: scenario.openingLine }]);
  }, [scenario]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');
    setIsLoading(true);

    const newMessages: Message[] = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);

    const history = [
      {
        role: "user" as const,
        parts: [{ text: `We are roleplaying. Context: ${scenario.setting}. My role: ${scenario.userRole}. Your role: ${scenario.aiRole}. Your goal is to help me achieve: ${scenario.objective}. Start.` }]
      },
      {
        role: "model" as const,
        parts: [{ text: scenario.openingLine }]
      },
      ...newMessages.slice(1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }))
    ];

    try {
      const responseText = await getRolePlayResponse(history, userText);
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
        setMessages(prev => [...prev, { role: 'model', text: "Sorry, I lost connection. Try again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden max-h-[600px] w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-indigo-600 p-4 text-white">
        <h3 className="font-bold flex items-center gap-2">
           <Bot className="w-5 h-5" /> {t('roleplay_title')}: {scenario.aiRole}
        </h3>
        <p className="text-indigo-200 text-xs mt-1">
          {t('objective')}: {scenario.objective}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('type_response')}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white p-3 rounded-xl transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RolePlayArena;