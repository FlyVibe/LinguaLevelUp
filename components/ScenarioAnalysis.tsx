import React, { useState } from 'react';
import { AnalysisResult, ScenarioTopic, TimeFrame } from '../types';
import { Check, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ScenarioAnalysisProps {
  analysis: AnalysisResult;
  onConfirmPlan: (selectedTopics: ScenarioTopic[], timeFrame: TimeFrame) => void;
}

const ScenarioAnalysis: React.FC<ScenarioAnalysisProps> = ({ analysis, onConfirmPlan }) => {
  const { t } = useLanguage();
  const [topics, setTopics] = useState<ScenarioTopic[]>(
    analysis.suggestedTopics.map(t => ({ ...t, selected: true }))
  );
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('Week');

  const toggleTopic = (id: string) => {
    setTopics(prev => prev.map(t => 
      t.id === id ? { ...t, selected: !t.selected } : t
    ));
  };

  const selectedCount = topics.filter(t => t.selected).length;

  const handleConfirm = () => {
    const selected = topics.filter(t => t.selected);
    if (selected.length > 0) {
      onConfirmPlan(selected, timeFrame);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">{t('mission_analysis')}: <span className="text-indigo-600">{analysis.originalGoal}</span></h2>
        <p className="text-gray-500 mt-1">{analysis.suggestedTopics.length} {t('found_scenarios')}</p>
      </div>

      {/* Grid of Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {topics.map(topic => (
          <div 
            key={topic.id}
            onClick={() => toggleTopic(topic.id)}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              topic.selected 
                ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                : 'border-gray-200 bg-white hover:border-indigo-200'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className={`font-bold text-lg ${topic.selected ? 'text-indigo-900' : 'text-gray-600'}`}>
                {topic.title}
              </h3>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                topic.selected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
              }`}>
                {topic.selected && <Check className="w-4 h-4 text-white" />}
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-3">{topic.description}</p>
            <div className="flex flex-wrap gap-2">
              {topic.keyVocabulary.slice(0, 3).map((word, i) => (
                <span key={i} className="px-2 py-1 bg-white/50 border border-black/5 text-[10px] rounded-md text-gray-600">
                  {word}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
               {(['Day', 'Week', 'Month', 'Year'] as TimeFrame[]).map(tf => (
                 <button
                   key={tf}
                   onClick={() => setTimeFrame(tf)}
                   className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                     timeFrame === tf ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                   }`}
                 >
                   {tf}
                 </button>
               ))}
            </div>
            <span className="text-sm text-gray-500 hidden sm:inline">{t('pace')}</span>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-400">{t('selected')}</p>
              <p className="font-bold text-indigo-600">{selectedCount} Scenarios</p>
            </div>
            <button
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all"
            >
              {t('generate_plan')} <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ScenarioAnalysis;