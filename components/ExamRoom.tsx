import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { Check, X, Award, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ExamRoomProps {
  questions: QuizQuestion[];
  onComplete?: () => void;
}

const ExamRoom: React.FC<ExamRoomProps> = ({ questions, onComplete }) => {
  const { t } = useLanguage();
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentQIndex];

  const handleOptionClick = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    if (index === currentQuestion.correctIndex) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
      if (onComplete) onComplete();
    }
  };

  const handleRetry = () => {
    setCurrentQIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsAnswered(false);
    setShowResults(false);
  };

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    let message = t('keep_practicing');
    if (percentage === 100) message = t('perfect_score');
    else if (percentage >= 80) message = t('great_job');
    else if (percentage >= 60) message = t('good_effort');

    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-lg text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
          <Award className="w-10 h-10 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('exam_complete')}</h2>
        <p className="text-gray-500 mb-6">{message}</p>
        
        <div className="text-5xl font-bold text-indigo-600 mb-2">{percentage}%</div>
        <p className="text-gray-400 mb-8">{t('you_got', { score, total: questions.length })}</p>

        <button
          onClick={handleRetry}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> {t('try_retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-2 rounded-full mb-8">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="mb-6">
        <span className="text-indigo-600 font-bold text-sm tracking-wide uppercase">{t('question')} {currentQIndex + 1}</span>
        <h3 className="text-xl font-semibold text-gray-900 mt-2 leading-relaxed">
          {currentQuestion.question}
        </h3>
      </div>

      <div className="space-y-3">
        {currentQuestion.options.map((option, idx) => {
          let buttonStyle = "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50";
          let icon = null;

          if (isAnswered) {
            if (idx === currentQuestion.correctIndex) {
              buttonStyle = "border-green-500 bg-green-50 text-green-700";
              icon = <Check className="w-5 h-5 text-green-600" />;
            } else if (idx === selectedOption) {
              buttonStyle = "border-red-500 bg-red-50 text-red-700";
              icon = <X className="w-5 h-5 text-red-600" />;
            } else {
              buttonStyle = "border-gray-100 opacity-50";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionClick(idx)}
              disabled={isAnswered}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${buttonStyle}`}
            >
              <span className="font-medium">{option}</span>
              {icon}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-bottom-4">
          <p className="font-bold text-blue-800 text-sm mb-1">{t('explanation')}:</p>
          <p className="text-blue-700 text-sm">{currentQuestion.explanation}</p>
          
          <button
            onClick={handleNext}
            className="mt-4 w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            {currentQIndex < questions.length - 1 ? t('next_question') : t('see_results')}
          </button>
        </div>
      )}
    </div>
  );
};

export default ExamRoom;