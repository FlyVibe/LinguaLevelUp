import React from 'react';
import { StudyPlanDay } from '../types';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface WeeklyScheduleProps {
  plan: StudyPlanDay[];
}

const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({ plan }) => {
  const { t } = useLanguage();

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-indigo-600 p-6 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6" /> {t('attack_plan')}
          </h2>
          <p className="text-indigo-100 mt-2">{t('consistency')}</p>
        </div>

        <div className="p-6">
          <div className="relative border-l-2 border-indigo-100 ml-4 space-y-8 my-4">
            {plan.map((day, index) => (
              <div key={day.day} className="relative pl-8">
                {/* Timeline Dot */}
                <span className="absolute -left-[9px] top-1 bg-white border-4 border-indigo-600 w-5 h-5 rounded-full" />
                
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-1">
                  <h3 className="text-lg font-bold text-gray-800">
                    {t('day', { n: day.day })}: <span className="text-indigo-600">{day.focus}</span>
                  </h3>
                  <div className="flex items-center text-gray-500 text-xs font-semibold bg-gray-100 px-2 py-1 rounded-full w-fit">
                    <Clock className="w-3 h-3 mr-1" /> {day.duration}
                  </div>
                </div>
                
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm leading-relaxed">
                  {day.task}
                </p>
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('consistency')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklySchedule;