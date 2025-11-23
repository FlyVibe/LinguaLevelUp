import React, { useState, useEffect, useRef } from 'react';
import { Flashcard } from '../types';
import { generateCardImage, generateCardAudio, playEncodedAudio } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { CheckCircle, ChevronLeft, ChevronRight, Volume2, Loader2, ImageIcon, Keyboard, Ear, Eye, RefreshCw, Trophy, Mic, MicOff } from 'lucide-react';

interface FlashcardDeckProps {
  cards: Flashcard[];
}

type DrillMode = 'view' | 'type' | 'speech';

// Levenshtein distance helper
const getLevenshteinDistance = (a: string, b: string) => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards: initialCards }) => {
  const { t } = useLanguage();
  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  // Drill Modes
  const [mode, setMode] = useState<DrillMode>('view');
  
  // Typing Drill State
  const [drillInput, setDrillInput] = useState('');
  const [drillStatus, setDrillStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  // Speech Drill State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Reset states when card changes
  useEffect(() => {
    setDrillInput('');
    setDrillStatus('idle');
    setTranscript('');
    setIsListening(false);
    setIsFlipped(false);
    if (recognitionRef.current) {
        recognitionRef.current.stop();
    }
  }, [currentIndex]);

  // Focus input when typing mode activates
  useEffect(() => {
    if (mode === 'type' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  // Load media for current card if missing
  useEffect(() => {
    const loadMedia = async () => {
      const currentCard = cards[currentIndex];
      let needsUpdate = false;
      let newImage = currentCard.generatedImageBase64;
      let newAudio = currentCard.generatedAudioBase64;

      if (!newImage || !newAudio) {
        setIsLoadingMedia(true);
        
        const promises = [];
        if (!newImage) promises.push(generateCardImage(currentCard.imageVisualDescription));
        else promises.push(Promise.resolve(null));

        if (!newAudio) promises.push(generateCardAudio(currentCard.front));
        else promises.push(Promise.resolve(null));

        const [imgResult, audioResult] = await Promise.all(promises);

        if (imgResult) {
          newImage = imgResult;
          needsUpdate = true;
        }
        if (audioResult) {
          newAudio = audioResult;
          needsUpdate = true;
        }

        if (needsUpdate) {
          setCards(prev => prev.map((c, i) => 
            i === currentIndex 
              ? { ...c, generatedImageBase64: newImage, generatedAudioBase64: newAudio }
              : c
          ));
        }
        setIsLoadingMedia(false);
      }
    };

    loadMedia();
  }, [currentIndex]); 

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  const handleFlip = () => {
    if (mode === 'view') {
      setIsFlipped(!isFlipped);
    }
  };

  const currentCard = cards[currentIndex];

  const handlePlayAudio = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentCard.generatedAudioBase64) {
      playEncodedAudio(currentCard.generatedAudioBase64);
    }
  };

  const normalizeText = (text: string) => {
    return text.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim();
  };

  // --- Typing Drill Logic ---
  const checkDrillInput = () => {
    const normalizedInput = normalizeText(drillInput);
    const normalizedTarget = normalizeText(currentCard.front);

    if (normalizedInput === normalizedTarget) {
      setDrillStatus('correct');
      if (currentCard.generatedAudioBase64) playEncodedAudio(currentCard.generatedAudioBase64);
    } else {
      setDrillStatus('incorrect');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (drillStatus === 'correct') {
         // Auto-advance
         handleNext();
      } else {
         checkDrillInput();
      }
    }
  };

  // --- Speech Drill Logic ---
  const toggleListening = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isListening) {
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsListening(false);
        return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Speech Recognition not supported in this browser. Try Chrome.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
        const currentTranscript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
        setTranscript(currentTranscript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
        console.error("Speech error", event.error);
        setIsListening(false);
    };

    recognition.start();
  };

  // Logic to render colored speech feedback
  const renderSpeechFeedback = () => {
    if (!transcript) return <p className="text-gray-400 italic text-center">{t('speech_instruction')}</p>;

    const targetWords = normalizeText(currentCard.front).split(' ');
    const inputWords = normalizeText(transcript).split(' ');
    
    return (
        <div className="flex flex-wrap gap-1 justify-center mt-2">
            {targetWords.map((word, idx) => {
                // Find best matching word in the transcript around the same index
                // This is a simplified matching for visual feedback
                let status = 'red';
                const searchWindow = 2; // Look 2 words ahead/behind
                let bestDist = 100;
                
                for(let i = Math.max(0, idx - searchWindow); i < Math.min(inputWords.length, idx + searchWindow + 1); i++) {
                    const dist = getLevenshteinDistance(word, inputWords[i]);
                    if (dist < bestDist) bestDist = dist;
                }

                if (bestDist === 0) status = 'green';
                else if (bestDist <= 2 || bestDist <= word.length / 2) status = 'orange';

                let colorClass = "text-red-500 bg-red-50";
                if (status === 'green') colorClass = "text-green-600 bg-green-50";
                if (status === 'orange') colorClass = "text-orange-500 bg-orange-50";

                return (
                    <span key={idx} className={`px-1.5 py-0.5 rounded ${colorClass} font-medium text-lg`}>
                        {currentCard.front.split(' ')[idx] || word} 
                    </span>
                );
            })}
        </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-start h-full p-2 sm:p-4 w-full max-w-lg mx-auto">
      
      {/* Top Controls: Mode Switcher */}
      <div className="flex items-center justify-between w-full mb-4 px-1 gap-2">
        <div className="text-left flex-1">
          <h2 className="text-xl font-bold text-gray-800">{t('scene_cards')}</h2>
          <p className="text-gray-500 text-xs">{t('card_of', { current: currentIndex + 1, total: cards.length })}</p>
        </div>
        
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            <button
                onClick={() => setMode('view')}
                className={`p-1.5 rounded-md transition-all ${mode === 'view' ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}
                title={t('view_mode')}
            >
                <Eye className="w-4 h-4" />
            </button>
            <button
                onClick={() => setMode('type')}
                className={`p-1.5 rounded-md transition-all ${mode === 'type' ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}
                title={t('drill_mode')}
            >
                <Keyboard className="w-4 h-4" />
            </button>
             <button
                onClick={() => setMode('speech')}
                className={`p-1.5 rounded-md transition-all ${mode === 'speech' ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}
                title={t('speech_mode')}
            >
                <Mic className="w-4 h-4" />
            </button>
        </div>
      </div>

      <div
        className={`relative w-full aspect-[3/4] sm:aspect-[4/5] perspective-1000 group ${mode === 'view' ? 'cursor-pointer' : ''}`}
        onClick={handleFlip}
      >
        <div
          className={`relative w-full h-full duration-500 transform-style-3d transition-all ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front Side */}
          <div className="absolute w-full h-full bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col overflow-hidden backface-hidden">
            {/* Image Area */}
            <div className="relative h-1/2 w-full bg-indigo-50 flex items-center justify-center overflow-hidden">
                {currentCard.generatedImageBase64 ? (
                     <img 
                        src={`data:image/jpeg;base64,${currentCard.generatedImageBase64}`} 
                        alt={currentCard.front}
                        className={`w-full h-full object-cover transition-all duration-700 ${mode !== 'view' && drillStatus !== 'correct' ? 'blur-sm scale-105' : ''}`}
                     />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-indigo-300">
                        {isLoadingMedia ? (
                             <Loader2 className="w-8 h-8 animate-spin" />
                        ) : (
                             <ImageIcon className="w-10 h-10" />
                        )}
                        <span className="text-xs font-medium">{isLoadingMedia ? t('visualizing') : t('loading_scene')}</span>
                    </div>
                )}
                
                {/* Overlay for Typing Mode */}
                {mode === 'type' && (
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePlayAudio(); }}
                      className="bg-white/90 backdrop-blur-md p-4 rounded-full shadow-lg hover:scale-105 transition-transform text-indigo-600 animate-pulse"
                    >
                      <Ear className="w-8 h-8" />
                    </button>
                  </div>
                )}

                <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {t('scene')}
                </div>
            </div>

            {/* Text / Interaction Area */}
            <div className="h-1/2 p-6 flex flex-col items-center justify-center relative w-full">
                
                {mode === 'type' ? (
                  // --- TYPE DRILL UI ---
                  <div className="w-full flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">
                      {t('drill_mode')}
                    </p>
                    <p className="text-sm text-gray-500 text-center mb-2">
                      {t('drill_instruction')}
                    </p>
                    
                    <div className="relative w-full">
                      <input
                        ref={inputRef}
                        type="text"
                        value={drillInput}
                        onChange={(e) => {
                          setDrillInput(e.target.value);
                          setDrillStatus('idle');
                        }}
                        onKeyDown={handleKeyDown}
                        disabled={drillStatus === 'correct'}
                        placeholder={t('type_response')}
                        className={`w-full px-4 py-3 rounded-xl border-2 text-center font-medium focus:outline-none transition-all ${
                          drillStatus === 'correct' 
                            ? 'border-green-500 bg-green-50 text-green-700' 
                            : drillStatus === 'incorrect'
                            ? 'border-red-500 bg-red-50 text-gray-800'
                            : 'border-indigo-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
                        }`}
                      />
                      {drillStatus === 'correct' && (
                        <Trophy className="absolute right-3 top-3.5 text-green-500 w-5 h-5 animate-bounce" />
                      )}
                    </div>

                    {drillStatus === 'incorrect' && (
                       <p className="text-xs text-red-500 font-medium">{t('try_again')}</p>
                    )}

                    {drillStatus === 'correct' ? (
                       <div className="flex items-center gap-2 text-green-600 font-bold mt-2">
                         <CheckCircle className="w-5 h-5" /> {t('perfect')}
                       </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); checkDrillInput(); }}
                        className="mt-2 px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-full shadow-md hover:bg-indigo-700 transition-colors"
                      >
                        {t('check')}
                      </button>
                    )}
                  </div>
                ) : mode === 'speech' ? (
                  // --- SPEECH DRILL UI ---
                  <div className="w-full flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
                     <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                      {t('speech_mode')}
                    </p>

                    <div className="min-h-[60px] flex items-center justify-center">
                        {renderSpeechFeedback()}
                    </div>

                    <button
                        onClick={toggleListening}
                        className={`p-6 rounded-full transition-all duration-300 shadow-xl ${
                            isListening 
                            ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105'
                        }`}
                    >
                        {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                    </button>
                    <p className="text-xs text-gray-400 font-medium">
                        {isListening ? t('listening') : transcript ? t('accuracy') : ''}
                    </p>
                  </div>
                ) : (
                  // --- VIEW MODE UI ---
                  <>
                    <p className="text-xl sm:text-2xl font-bold text-center text-gray-800 leading-snug mb-2">
                    {currentCard.front}
                    </p>
                    {currentCard.pronunciation && (
                    <p className="text-gray-400 font-mono text-xs mb-6">
                        /{currentCard.pronunciation}/
                    </p>
                    )}

                    <button
                        onClick={handlePlayAudio}
                        disabled={!currentCard.generatedAudioBase64}
                        className="p-3 bg-indigo-50 hover:bg-indigo-100 rounded-full text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-wait"
                    >
                    {(!currentCard.generatedAudioBase64 && isLoadingMedia) ? <Loader2 className="w-6 h-6 animate-spin" /> : <Volume2 className="w-6 h-6" />}
                    </button>
                    <p className="absolute bottom-4 text-[10px] text-gray-300 uppercase tracking-widest">{t('tap_meaning')}</p>
                  </>
                )}
            </div>
          </div>

          {/* Back Side (Translation) */}
          <div className="absolute w-full h-full bg-indigo-600 rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center backface-hidden rotate-y-180 text-white">
            <div className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-6">
                {t('translation')}
             </div>
            <p className="text-xl sm:text-2xl font-medium text-center leading-relaxed">
              {currentCard.back}
            </p>
            <div className="mt-8 pt-8 border-t border-white/20 w-full text-center">
                <p className="text-indigo-200 text-sm">{t('context')}</p>
                <p className="text-xs text-indigo-100 mt-2 italic opacity-80">{currentCard.imageVisualDescription}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between w-full mt-6 px-4">
        <button
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="p-3 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {mode !== 'view' ? (
           <div className="text-xs text-gray-400 font-medium flex items-center gap-1">
             <RefreshCw className="w-3 h-3" /> {mode === 'type' ? t('drill_mode') : t('speech_mode')}
           </div>
        ) : (
          <button
              onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                  setTimeout(() => {
                      setCurrentIndex((prev) => (prev + 1) % cards.length);
                  }, 150);
              }}
              className="flex items-center gap-2 px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold shadow-lg shadow-green-200 transition-all transform active:scale-95"
          >
              <CheckCircle className="w-5 h-5" /> {t('got_it')}
          </button>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="p-3 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm transition-all"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default FlashcardDeck;