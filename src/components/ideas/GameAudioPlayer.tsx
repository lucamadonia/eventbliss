import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward,
  Volume2,
  VolumeX,
  Loader2,
  AudioLines
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GameAudioPlayerProps {
  text: string;
  language?: string;
  onClose?: () => void;
  compact?: boolean;
}

// Language to voice mapping for Web Speech API
const languageVoiceMap: Record<string, string> = {
  de: "de-DE",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  it: "it-IT",
  nl: "nl-NL",
  pl: "pl-PL",
  pt: "pt-PT",
  tr: "tr-TR",
  ar: "ar-SA"
};

// Preferred voice patterns - prioritize high-quality voices from Google, Microsoft, Apple
const preferredVoicePatterns: Record<string, string[]> = {
  de: ["Google Deutsch", "Microsoft Katja", "Microsoft Hedda", "Anna", "Petra", "Helena"],
  en: ["Google US English", "Google UK English Female", "Microsoft Zira", "Samantha", "Karen", "Moira"],
  es: ["Google español", "Microsoft Helena", "Microsoft Laura", "Monica", "Paulina"],
  fr: ["Google français", "Microsoft Julie", "Microsoft Caroline", "Amélie", "Thomas"],
  it: ["Google italiano", "Microsoft Elsa", "Alice", "Federica"],
  nl: ["Google Nederlands", "Microsoft", "Ellen", "Xander"],
  pl: ["Google polski", "Microsoft Paulina", "Zosia", "Ewa"],
  pt: ["Google português", "Microsoft Maria", "Joana", "Luciana"],
  tr: ["Google Türkçe", "Microsoft Tolga", "Yelda"],
  ar: ["Google العربية", "Microsoft", "Maged", "Laila"]
};

export const GameAudioPlayer = ({ text, language = "de", onClose, compact = false }: GameAudioPlayerProps) => {
  const { t, i18n } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentSection, setCurrentSection] = useState(0);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Split text into sections for navigation
  const sections = text.split(/\*\*[^*]+\*\*/).filter(Boolean).map(s => s.trim());
  const sectionHeaders = text.match(/\*\*[^*]+\*\*/g) || [];
  
  const currentLang = language || i18n.language || "de";
  const speechLang = languageVoiceMap[currentLang] || "de-DE";

  // Load voices with retry logic for Chrome
  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    
    const loadVoices = () => {
      const voices = synthRef.current?.getVoices() || [];
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };
    
    // Initial load
    loadVoices();
    
    // Chrome loads voices asynchronously
    if (synthRef.current) {
      synthRef.current.onvoiceschanged = loadVoices;
    }
    
    // Fallback: retry after short delay (some browsers need this)
    const retryTimeout = setTimeout(loadVoices, 100);
    
    return () => {
      clearTimeout(retryTimeout);
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Find best matching voice with quality prioritization
  const getBestVoice = useCallback(() => {
    if (!availableVoices.length) return null;
    
    const langPrefix = speechLang.split("-")[0];
    const preferredPatterns = preferredVoicePatterns[langPrefix] || [];
    
    // Get all voices for this language
    const languageVoices = availableVoices.filter(v => 
      v.lang === speechLang || v.lang.startsWith(langPrefix)
    );
    
    if (languageVoices.length === 0) {
      return availableVoices[0];
    }
    
    // 1. Try preferred voice patterns (Google, Microsoft, Apple high-quality)
    for (const pattern of preferredPatterns) {
      const match = languageVoices.find(v => 
        v.name.toLowerCase().includes(pattern.toLowerCase())
      );
      if (match) return match;
    }
    
    // 2. Prefer Google voices (they're generally highest quality in Chrome)
    const googleVoice = languageVoices.find(v => v.name.includes("Google"));
    if (googleVoice) return googleVoice;
    
    // 3. Prefer Microsoft voices (good quality on Windows/Edge)
    const microsoftVoice = languageVoices.find(v => v.name.includes("Microsoft"));
    if (microsoftVoice) return microsoftVoice;
    
    // 4. Prefer non-compact/enhanced voices (often have "Enhanced" or "Premium" in name)
    const enhancedVoice = languageVoices.find(v => 
      v.name.toLowerCase().includes("enhanced") || 
      v.name.toLowerCase().includes("premium") ||
      v.name.toLowerCase().includes("neural")
    );
    if (enhancedVoice) return enhancedVoice;
    
    // 5. Prefer female voices (often clearer for instructions)
    const femalePatterns = ["female", "frau", "mujer", "femme", "donna", "kobieta"];
    const femaleVoice = languageVoices.find(v => 
      femalePatterns.some(p => v.name.toLowerCase().includes(p))
    );
    if (femaleVoice) return femaleVoice;
    
    // 6. Return first available voice for the language
    return languageVoices[0];
  }, [availableVoices, speechLang]);

  // Clean text for speech (remove markdown)
  const cleanTextForSpeech = (inputText: string): string => {
    return inputText
      .replace(/\*\*([^*]+)\*\*/g, "$1") // Bold
      .replace(/\*([^*]+)\*/g, "$1")     // Italic
      .replace(/^[-•]\s*/gm, "")          // Bullets
      .replace(/\n+/g, ". ")              // Line breaks to pauses
      .replace(/\s+/g, " ")               // Multiple spaces
      .trim();
  };

  const handlePlay = useCallback(() => {
    if (!synthRef.current) {
      toast.error(t('gamesLibrary.tts.notSupported'));
      return;
    }

    // Check if paused and resume
    if (isPaused && utteranceRef.current) {
      synthRef.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    setIsLoading(true);
    
    const cleanedText = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    const voice = getBestVoice();
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.lang = speechLang;
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = isMuted ? 0 : volume / 100;
    
    utterance.onstart = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setIsPaused(false);
      
      // Estimate progress based on text length
      const estimatedDuration = cleanedText.length * 60; // ~60ms per character at 0.9 rate
      let elapsed = 0;
      
      progressIntervalRef.current = setInterval(() => {
        elapsed += 100;
        const newProgress = Math.min((elapsed / estimatedDuration) * 100, 99);
        setProgress(newProgress);
      }, 100);
    };
    
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setTimeout(() => setProgress(0), 1000);
    };
    
    utterance.onerror = (event) => {
      console.error("Speech error:", event);
      setIsLoading(false);
      setIsPlaying(false);
      setIsPaused(false);
      if (event.error !== "interrupted") {
        toast.error(t('gamesLibrary.tts.error'));
      }
    };
    
    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [text, speechLang, getBestVoice, isPaused, volume, isMuted, t]);

  const handlePause = () => {
    if (synthRef.current && isPlaying) {
      synthRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
  };

  const handleSkipSection = () => {
    if (sections.length <= 1) return;
    
    handleStop();
    const nextSection = (currentSection + 1) % sections.length;
    setCurrentSection(nextSection);
    
    // Play the next section
    setTimeout(() => {
      if (synthRef.current) {
        const sectionText = cleanTextForSpeech(
          (sectionHeaders[nextSection] || "") + " " + sections[nextSection]
        );
        const utterance = new SpeechSynthesisUtterance(sectionText);
        const voice = getBestVoice();
        if (voice) utterance.voice = voice;
        utterance.lang = speechLang;
        utterance.rate = 0.9;
        utterance.volume = isMuted ? 0 : volume / 100;
        
        utterance.onstart = () => {
          setIsPlaying(true);
          setIsPaused(false);
        };
        
        utterance.onend = () => {
          setIsPlaying(false);
        };
        
        synthRef.current.speak(utterance);
      }
    }, 100);
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Check if Speech Synthesis is supported
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  if (!isSupported) {
    return (
      <div className="text-sm text-muted-foreground text-center p-4">
        {t('gamesLibrary.tts.notSupported')}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cn(
        "rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 backdrop-blur-sm",
        compact ? "p-3" : "p-4"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <AudioLines className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          {t('gamesLibrary.tts.title')}
        </span>
        
        {availableVoices.length > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            {getBestVoice()?.name || speechLang}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 rounded-full bg-muted overflow-hidden mb-3">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {/* Play/Pause Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {isLoading ? (
              <Button size="icon" variant="ghost" disabled className="h-9 w-9">
                <Loader2 className="w-5 h-5 animate-spin" />
              </Button>
            ) : isPlaying ? (
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handlePause}
                className="h-9 w-9 text-secondary-foreground hover:text-secondary-foreground/80 hover:bg-secondary/50"
              >
                <Pause className="w-5 h-5" />
              </Button>
            ) : (
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handlePlay}
                className="h-9 w-9 text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                <Play className="w-5 h-5" />
              </Button>
            )}
          </motion.div>

          {/* Stop Button */}
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleStop}
            disabled={!isPlaying && !isPaused}
            className="h-9 w-9"
          >
            <Square className="w-4 h-4" />
          </Button>

          {/* Skip Section Button */}
          {sections.length > 1 && (
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handleSkipSection}
              className="h-9 w-9"
              title={t('gamesLibrary.tts.nextSection')}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 flex-1 max-w-[150px]">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleMute}
            className="h-8 w-8 shrink-0"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={5}
            className="flex-1"
          />
        </div>
      </div>

      {/* Section indicator */}
      {sections.length > 1 && (
        <div className="mt-3 flex gap-1 justify-center">
          {sections.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                idx === currentSection ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
