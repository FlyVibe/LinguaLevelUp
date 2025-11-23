import React from 'react';
import { CoursePlan } from '../types';
import { Lock, Play, CheckCircle, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface CourseRoadmapProps {
  plan: CoursePlan;
  onStartModule: (moduleTitle: string) => void;
}

const CourseRoadmap: React.FC<CourseRoadmapProps> = ({ plan, onStartModule }) => {
  const { t } = useLanguage();

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      {/* Header */}
      <div className="text-center mb-10 mt-4">
        <h1 className="text-2xl font-bold text-gray-900">{plan.planTitle}</h1>
        <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold">
          <Clock className="w-3 h-3" /> {t('duration')}: {plan.totalDuration}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative border-l-4 border-indigo-100 ml-6 sm:ml-10 space-y-12 my-8">
        {plan.modules.map((module, index) => {
          const isLocked = module.status === 'locked';
          const isCompleted = module.status === 'completed';
          const isCurrent = module.status === 'current';

          return (
            <div key={module.id} className="relative pl-8 sm:pl-12 group">
              {/* Connector Dot */}
              <div 
                className={`absolute -left-[13px] top-0 w-6 h-6 rounded-full border-4 flex items-center justify-center transition-colors ${
                  isCompleted 
                    ? 'bg-green-500 border-green-500' 
                    : isCurrent 
                      ? 'bg-white border-indigo-600 scale-125' 
                      : 'bg-white border-gray-300'
                }`}
              >
                {isCompleted && <CheckCircle className="w-3 h-3 text-white" />}
                {isLocked && <div className="w-2 h-2 bg-gray-300 rounded-full" />}
                {isCurrent && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse" />}
              </div>

              {/* Card */}
              <div 
                className={`rounded-2xl border-2 p-5 transition-all duration-300 ${
                  isCurrent 
                    ? 'bg-white border-indigo-500 shadow-xl shadow-indigo-100 scale-105' 
                    : isCompleted
                      ? 'bg-gray-50 border-gray-200 opacity-70'
                      : 'bg-white border-gray-100 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('level', { n: index + 1 })}</span>
                    <h3 className={`font-bold text-lg ${isLocked ? 'text-gray-500' : 'text-gray-800'}`}>
                      {module.title}
                    </h3>
                  </div>
                  {isCurrent && (
                     <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                       {t('current')}
                     </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">{module.description}</p>
                
                <div className="flex items-center justify-between">
                   <div className="text-xs text-gray-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {module.estimatedTime}
                   </div>

                   {isCurrent ? (
                     <button 
                       onClick={() => onStartModule(module.title)}
                       className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-all shadow-lg hover:shadow-indigo-200"
                     >
                       <Play className="w-4 h-4 fill-current" /> {t('start')}
                     </button>
                   ) : isLocked ? (
                     <div className="text-gray-300 flex items-center gap-1 text-sm font-medium">
                       <Lock className="w-4 h-4" /> {t('locked')}
                     </div>
                   ) : (
                     <button 
                        onClick={() => onStartModule(module.title)}
                        className="text-indigo-600 text-sm font-semibold hover:underline"
                     >
                       {t('review')}
                     </button>
                   )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseRoadmap;