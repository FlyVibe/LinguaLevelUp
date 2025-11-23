import React, { useState } from 'react';
import { LevelData, AppView, DashboardTab, AnalysisResult, CoursePlan, ScenarioTopic, TimeFrame } from './types';
import { analyzeUserScenario, generateCoursePlan, generateLevelContent } from './services/geminiService';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import WelcomeScreen from './components/WelcomeScreen';
import ScenarioAnalysis from './components/ScenarioAnalysis';
import CourseRoadmap from './components/CourseRoadmap';
import FlashcardDeck from './components/FlashcardDeck';
import RolePlayArena from './components/RolePlayArena';
import ExamRoom from './components/ExamRoom';
import WeeklySchedule from './components/WeeklySchedule';
import { Layers, MessageCircle, PenTool, ListTodo, Loader2, BookOpen, Map, ArrowLeft, Globe } from 'lucide-react';

const AppContent: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  
  // State
  const [view, setView] = useState<AppView>(AppView.WELCOME);
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.FLASHCARDS);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Data
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [coursePlan, setCoursePlan] = useState<CoursePlan | null>(null);
  const [levelData, setLevelData] = useState<LevelData | null>(null);

  // --- Handlers ---

  const handleStartAnalysis = async (goal: string) => {
    setView(AppView.ANALYZING);
    setErrorMsg(null);
    try {
      const data = await analyzeUserScenario(goal);
      setAnalysisData(data);
      setView(AppView.SELECTION);
    } catch (error) {
      console.error(error);
      setErrorMsg("Failed to analyze goal. Please check your connection.");
      setView(AppView.WELCOME);
    }
  };

  const handleConfirmPlan = async (selectedTopics: ScenarioTopic[], timeFrame: TimeFrame) => {
    setView(AppView.PLANNING);
    try {
      const plan = await generateCoursePlan(selectedTopics, timeFrame);
      setCoursePlan(plan);
      setView(AppView.ROADMAP);
    } catch (error) {
      console.error(error);
      setErrorMsg("Failed to create study plan.");
      setView(AppView.SELECTION);
    }
  };

  const handleStartModule = async (moduleTitle: string) => {
    setView(AppView.GENERATING_LEVEL);
    try {
      const data = await generateLevelContent(moduleTitle);
      setLevelData(data);
      setActiveTab(DashboardTab.FLASHCARDS);
      setView(AppView.LEVEL_DASHBOARD);
    } catch (error) {
      console.error(error);
      setErrorMsg("Failed to generate level content.");
      setView(AppView.ROADMAP);
    }
  };

  const handleBackToRoadmap = () => {
    setView(AppView.ROADMAP);
    setLevelData(null);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  // --- Renders ---

  const LanguageToggle = () => (
    <button 
      onClick={toggleLanguage}
      className="absolute top-4 right-4 z-50 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm border border-gray-200 hover:bg-white transition-all text-indigo-600"
    >
      <div className="flex items-center gap-1 text-xs font-bold">
        <Globe className="w-4 h-4" />
        {language.toUpperCase()}
      </div>
    </button>
  );

  const renderLoading = (message: string) => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-indigo-50 p-4 text-center">
      <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-6" />
      <h2 className="text-xl font-bold text-gray-800 mb-2">{message}</h2>
      <p className="text-gray-500 text-sm">AI is thinking...</p>
    </div>
  );

  const renderDashboardContent = () => {
    if (!levelData) return null;

    switch (activeTab) {
      case DashboardTab.FLASHCARDS:
        return <FlashcardDeck cards={levelData.flashcards} />;
      case DashboardTab.ROLEPLAY:
        return <RolePlayArena scenario={levelData.rolePlay} />;
      case DashboardTab.EXAM:
        return <ExamRoom questions={levelData.exam} />;
      case DashboardTab.TASKS:
        return <WeeklySchedule plan={levelData.weeklyPlan} />;
      default:
        return null;
    }
  };

  // --- Main View Switcher ---

  if (view === AppView.WELCOME) {
    return (
      <>
        <LanguageToggle />
        <WelcomeScreen onStart={handleStartAnalysis} />
        {errorMsg && <div className="fixed top-16 left-0 right-0 mx-auto w-fit bg-red-100 text-red-700 px-4 py-2 rounded shadow border border-red-300">{errorMsg}</div>}
      </>
    );
  }

  if (view === AppView.ANALYZING) return renderLoading(t('visualizing')); // Reusing visualizing for generic loading
  
  if (view === AppView.SELECTION && analysisData) {
    return (
      <>
        <LanguageToggle />
        <ScenarioAnalysis analysis={analysisData} onConfirmPlan={handleConfirmPlan} />
      </>
    );
  }

  if (view === AppView.PLANNING) return renderLoading(t('visualizing'));

  if (view === AppView.ROADMAP && coursePlan) {
    return (
      <>
        <LanguageToggle />
        <CourseRoadmap plan={coursePlan} onStartModule={handleStartModule} />
      </>
    );
  }

  if (view === AppView.GENERATING_LEVEL) return renderLoading(t('loading_scene'));

  if (view === AppView.LEVEL_DASHBOARD && levelData) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0 sm:pt-20">
        <LanguageToggle />
        
        {/* Desktop Header */}
        <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 hidden sm:block shadow-sm">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleBackToRoadmap}>
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                  <BookOpen className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-gray-800">LinguaLevel Up</span>
            </div>
            <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium border border-indigo-100">
               {t('current')}: {levelData.levelName}
            </div>
            <button 
              onClick={handleBackToRoadmap}
              className="text-sm font-medium text-gray-500 hover:text-indigo-600 flex items-center gap-1"
            >
              <Map className="w-4 h-4" /> {t('back_map')}
            </button>
          </div>
        </header>

        {/* Mobile Header */}
        <div className="sm:hidden bg-white p-4 shadow-sm border-b border-gray-200 sticky top-0 z-30 flex items-center gap-3">
             <button onClick={handleBackToRoadmap} className="p-1 -ml-1 text-gray-500">
               <ArrowLeft className="w-6 h-6" />
             </button>
             <div>
                <h1 className="font-bold text-lg text-gray-800 leading-none truncate w-56">{levelData.levelName}</h1>
                <p className="text-xs text-gray-500 mt-1">{levelData.topic}</p>
             </div>
        </div>

        {/* Main Content Area */}
        <main className="max-w-5xl mx-auto p-4 sm:p-6 min-h-[calc(100vh-140px)]">
          {renderDashboardContent()}
        </main>

        {/* Navigation Bar (Sticky Bottom) */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 sm:top-16 sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-fit sm:rounded-full sm:border sm:shadow-lg sm:px-2 sm:py-2 sm:mt-4 z-50">
          <ul className="flex items-center justify-between sm:gap-2 w-full max-w-md mx-auto">
            {[
              { id: DashboardTab.FLASHCARDS, icon: Layers, label: t('tab_cards') },
              { id: DashboardTab.ROLEPLAY, icon: MessageCircle, label: t('tab_roleplay') },
              { id: DashboardTab.EXAM, icon: PenTool, label: t('tab_exam') },
              { id: DashboardTab.TASKS, icon: ListTodo, label: t('tab_tasks') },
            ].map((item) => (
              <li key={item.id} className="flex-1 sm:flex-none">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col sm:flex-row items-center justify-center w-full sm:w-auto sm:px-4 sm:py-2 gap-1 rounded-xl transition-all ${
                    activeTab === item.id
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className={`w-6 h-6 sm:w-5 sm:h-5 ${activeTab === item.id ? 'fill-current opacity-20' : ''}`} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                  <span className="text-[10px] sm:text-sm font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    );
  }

  return null;
}

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;