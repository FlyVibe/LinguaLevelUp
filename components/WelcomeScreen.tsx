import React, { useState } from 'react';
import { Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface WelcomeScreenProps {
  onStart: (scenario: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onStart(input);
    }
  };

  const suggestions = [
    "Travel to the USA",
    "Business English for IT",
    "Moving to Canada",
    "Medical English",
    "Study Abroad Preparation"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
            <BookOpen className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('welcome_title')}</h1>
          <p className="text-indigo-100">{t('welcome_subtitle')}</p>
        </div>

        <div className="p-8">
          <p className="text-gray-600 mb-6 text-center">
            {t('goal_prompt')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('goal_placeholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all pl-4"
              />
              <Sparkles className="absolute right-3 top-3.5 text-indigo-400 w-5 h-5" />
            </div>

            <button
              type="submit"
              disabled={!input.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {t('analyze_btn')} <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3 text-center">
              {t('popular_goals')}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 text-xs rounded-full transition-colors border border-transparent hover:border-indigo-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;