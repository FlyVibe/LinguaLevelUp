// Data Models

// 1. Analysis Phase Models
export interface ScenarioTopic {
  id: string;
  title: string;
  description: string;
  keyVocabulary: string[];
  selected?: boolean; // UI state
}

export interface AnalysisResult {
  originalGoal: string;
  suggestedTopics: ScenarioTopic[];
}

// 2. Planning Phase Models
export type TimeFrame = 'Day' | 'Week' | 'Month' | 'Year';

export interface CourseModule {
  id: string;
  title: string; // The specific scenario name
  description: string;
  estimatedTime: string; // e.g., "2 Days" or "1 Week"
  status: 'locked' | 'current' | 'completed';
}

export interface CoursePlan {
  planTitle: string;
  totalDuration: string;
  modules: CourseModule[];
}

// 3. Execution (Level) Models
export interface Flashcard {
  id: string;
  front: string; // English Sentence/Phrase
  back: string; // Chinese Translation & Explanation
  pronunciation?: string; // IPA or phonetic guide
  imageVisualDescription: string; // Prompt for the image generator
  generatedImageBase64?: string; // Cache for the image
  generatedAudioBase64?: string; // Cache for the audio
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number; // 0-3
  explanation: string;
}

export interface StudyPlanDay {
  day: number;
  focus: string;
  task: string;
  duration: string;
}

export interface RolePlayScenario {
  setting: string;
  userRole: string;
  aiRole: string;
  objective: string;
  openingLine: string;
}

export interface LevelData {
  topic: string;
  levelName: string;
  flashcards: Flashcard[];
  rolePlay: RolePlayScenario;
  exam: QuizQuestion[];
  weeklyPlan: StudyPlanDay[]; // Renamed in UI to "Task List"
}

// UI State Types
export enum AppView {
  WELCOME = 'WELCOME',
  ANALYZING = 'ANALYZING',    // Loading analysis
  SELECTION = 'SELECTION',    // Picking topics
  PLANNING = 'PLANNING',      // Loading plan
  ROADMAP = 'ROADMAP',        // Viewing the global plan
  GENERATING_LEVEL = 'GENERATING_LEVEL', // Loading specific level
  LEVEL_DASHBOARD = 'LEVEL_DASHBOARD',   // Inside a level
}

export enum DashboardTab {
  FLASHCARDS = 'FLASHCARDS',
  ROLEPLAY = 'ROLEPLAY',
  EXAM = 'EXAM',
  TASKS = 'TASKS', // Renamed from PLAN
}
