import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward,
  Volume2,
  VolumeX,
  Loader2,
  AudioLines,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getVoicesForLanguage,
  getDefaultVoice,
  isNeuralVoice,
  isVoxtralVoice,
  getVoxtralVoiceId,
  getStoredVoicePreference,
  storeVoicePreference,
  webSpeechLanguages,
  type VoiceOption,
} from "@/lib/tts-voice-config";
import { supabase } from "@/integrations/supabase/client";

interface GameAudioPlayerProps {
  text: string;
  language?: string;
  onClose?: () => void;
  compact?: boolean;
}

// Preferred voice patterns for Web Speech API fallback
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
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentSection, setCurrentSection] = useState(0);
  
  // Voice selection state
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [vitsModule, setVitsModule] = useState<any>(null);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Split text into sections for navigation
  const sections = text.split(/\*\*[^*]+\*\*/).filter(Boolean).map(s => s.trim());
  const sectionHeaders = text.match(/\*\*[^*]+\*\*/g) || [];
  
  const currentLang = language || i18n.language || "de";
  const speechLang = webSpeechLanguages[currentLang] || "de-DE";
  
  // Get available voices for current language
  const availableVoices = getVoicesForLanguage(currentLang);
  const selectedVoice = availableVoices.find(v => v.id === selectedVoiceId);
  const isVoxtral = selectedVoiceId ? isVoxtralVoice(selectedVoiceId) : false;
  const isNeural = selectedVoiceId ? isNeuralVoice(selectedVoiceId) : false;

  // Initialize voice selection from preferences
  useEffect(() => {
    const stored = getStoredVoicePreference(currentLang);
    if (stored && availableVoices.some(v => v.id === stored)) {
      setSelectedVoiceId(stored);
    } else {
      setSelectedVoiceId(getDefaultVoice(currentLang));
    }
  }, [currentLang, availableVoices]);

  // Load VITS module dynamically
  useEffect(() => {
    if (isNeural && !vitsModule) {
      import('@diffusionstudio/vits-web').then((module) => {
        setVitsModule(module);
      }).catch((err) => {
        console.error('Failed to load VITS module:', err);
      });
    }
  }, [isNeural, vitsModule]);

  // Check if neural model is ready
  useEffect(() => {
    if (isNeural && vitsModule && selectedVoiceId) {
      // Check if model is already downloaded
      vitsModule.stored().then((storedVoices: string[]) => {
        setIsModelReady(storedVoices.includes(selectedVoiceId));
      }).catch(() => {
        setIsModelReady(false);
      });
    } else {
      setIsModelReady(false);
    }
  }, [isNeural, vitsModule, selectedVoiceId]);

  // Load browser voices for Web Speech API fallback
  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    
    const loadVoices = () => {
      const voices = synthRef.current?.getVoices() || [];
      if (voices.length > 0) {
        setBrowserVoices(voices);
      }
    };
    
    loadVoices();
    
    if (synthRef.current) {
      synthRef.current.onvoiceschanged = loadVoices;
    }
    
    const retryTimeout = setTimeout(loadVoices, 100);
    
    return () => {
      clearTimeout(retryTimeout);
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle voice selection change
  const handleVoiceChange = (voiceId: string) => {
    handleStop();
    setSelectedVoiceId(voiceId);
    storeVoicePreference(currentLang, voiceId);
    setIsModelReady(false);
    
    // Check model availability for neural voices
    if (isNeuralVoice(voiceId) && vitsModule) {
      vitsModule.stored().then((storedVoices: string[]) => {
        setIsModelReady(storedVoices.includes(voiceId));
      }).catch(() => {
        setIsModelReady(false);
      });
    }
  };

  // Find best Web Speech voice
  const getBestWebSpeechVoice = useCallback(() => {
    if (!browserVoices.length) return null;
    
    const langPrefix = speechLang.split("-")[0];
    const preferredPatterns = preferredVoicePatterns[langPrefix] || [];
    
    const languageVoices = browserVoices.filter(v => 
      v.lang === speechLang || v.lang.startsWith(langPrefix)
    );
    
    if (languageVoices.length === 0) {
      return browserVoices[0];
    }
    
    for (const pattern of preferredPatterns) {
      const match = languageVoices.find(v => 
        v.name.toLowerCase().includes(pattern.toLowerCase())
      );
      if (match) return match;
    }
    
    const googleVoice = languageVoices.find(v => v.name.includes("Google"));
    if (googleVoice) return googleVoice;
    
    const microsoftVoice = languageVoices.find(v => v.name.includes("Microsoft"));
    if (microsoftVoice) return microsoftVoice;
    
    return languageVoices[0];
  }, [browserVoices, speechLang]);

  // Clean text for speech
  const cleanTextForSpeech = (inputText: string): string => {
    return inputText
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/^[-•]\s*/gm, "")
      .replace(/\n+/g, ". ")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Play with VITS neural TTS
  const playWithVITS = async (textToSpeak: string) => {
    if (!vitsModule || !selectedVoiceId) return;
    
    setIsLoading(true);
    
    try {
      const wav = await vitsModule.predict({
        text: textToSpeak,
        voiceId: selectedVoiceId,
      });
      
      const audioUrl = URL.createObjectURL(wav);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.volume = isMuted ? 0 : volume / 100;
      
      audio.onplay = () => {
        setIsLoading(false);
        setIsPlaying(true);
        setIsPaused(false);
      };
      
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };
      
      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(100);
        URL.revokeObjectURL(audioUrl);
        setTimeout(() => setProgress(0), 1000);
      };
      
      audio.onerror = () => {
        setIsLoading(false);
        setIsPlaying(false);
        toast.error(t('gamesLibrary.tts.error'));
      };
      
      await audio.play();
    } catch (error) {
      console.error('VITS playback error:', error);
      setIsLoading(false);
      toast.error(t('gamesLibrary.tts.error'));
    }
  };

  // Play with Voxtral TTS (Mistral Cloud)
  const playWithVoxtral = async (textToSpeak: string) => {
    setIsLoading(true);

    try {
      const voxtralVoiceId = getVoxtralVoiceId(selectedVoiceId, currentLang);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('gamesLibrary.tts.error'));
        setIsLoading(false);
        return;
      }

      const response = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'voxtral_tts',
          tts_text: textToSpeak,
          tts_voice: voxtralVoiceId,
          tts_speed: 1.0,
          context: { event_type: 'other', honoree_name: '', participant_count: 0 },
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const audioBlob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: 'audio/mpeg' });

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.volume = isMuted ? 0 : volume / 100;

      audio.onplay = () => {
        setIsLoading(false);
        setIsPlaying(true);
        setIsPaused(false);
      };

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(100);
        URL.revokeObjectURL(audioUrl);
        setTimeout(() => setProgress(0), 1000);
      };

      audio.onerror = () => {
        setIsLoading(false);
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        toast.error(t('gamesLibrary.tts.error'));
      };

      await audio.play();
    } catch (error) {
      console.error('Voxtral playback error:', error);
      setIsLoading(false);
      toast.error(t('gamesLibrary.tts.error'));
    }
  };

  // Play with Web Speech API
  const playWithWebSpeech = (textToSpeak: string) => {
    if (!synthRef.current) {
      toast.error(t('gamesLibrary.tts.notSupported'));
      return;
    }

    if (isPaused && utteranceRef.current) {
      synthRef.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    synthRef.current.cancel();
    setIsLoading(true);
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    const voice = getBestWebSpeechVoice();
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.lang = speechLang;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = isMuted ? 0 : volume / 100;
    
    utterance.onstart = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setIsPaused(false);
      
      const estimatedDuration = textToSpeak.length * 60;
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
  };

  const handlePlay = useCallback(async () => {
    const cleanedText = cleanTextForSpeech(text);

    // Voxtral cloud voice - call Mistral API via Supabase
    if (isVoxtral) {
      playWithVoxtral(cleanedText);
      return;
    }

    // Local neural voice - download if needed, then play
    if (isNeural && vitsModule) {
      if (!isModelReady) {
        setDownloadProgress(0);

        try {
          await vitsModule.download(selectedVoiceId, (progress: { loaded: number; total: number }) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setDownloadProgress(percent);
          });

          setIsModelReady(true);
          setDownloadProgress(null);
          toast.success(t('gamesLibrary.tts.modelReady'));

          playWithVITS(cleanedText);
        } catch (error) {
          console.error('Failed to download model:', error);
          setDownloadProgress(null);
          toast.error(t('gamesLibrary.tts.downloadError'));
        }
      } else {
        playWithVITS(cleanedText);
      }
    } else {
      // Standard voice - use Web Speech API
      playWithWebSpeech(cleanedText);
    }
  }, [text, isVoxtral, isNeural, isModelReady, vitsModule, selectedVoiceId, isPaused, volume, isMuted, t]);

  const handlePause = () => {
    if (audioRef.current && (isNeural || isVoxtral)) {
      audioRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    } else if (synthRef.current && isPlaying) {
      synthRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleResume = () => {
    if (audioRef.current && (isNeural || isVoxtral)) {
      audioRef.current.play();
      setIsPaused(false);
      setIsPlaying(true);
    } else if (synthRef.current) {
      synthRef.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
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
    
    const sectionText = cleanTextForSpeech(
      (sectionHeaders[nextSection] || "") + " " + sections[nextSection]
    );
    
    setTimeout(() => {
      if (isVoxtral) {
        playWithVoxtral(sectionText);
      } else if (isNeural && isModelReady && vitsModule) {
        playWithVITS(sectionText);
      } else {
        playWithWebSpeech(sectionText);
      }
    }, 100);
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (audioRef.current) {
      audioRef.current.volume = newMuted ? 0 : volume / 100;
    }
  };

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
      {/* Header with Voice Selection */}
      <div className="flex items-center gap-2 mb-3">
        <AudioLines className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          {t('gamesLibrary.tts.title')}
        </span>
        
        {/* Engine Badge */}
        {isVoxtral && (
          <Badge variant="secondary" className="text-xs gap-1 bg-violet-500/20 text-violet-600 dark:text-violet-400 border-0">
            <Sparkles className="w-3 h-3" />
            Voxtral AI
          </Badge>
        )}
        {isNeural && !isVoxtral && (
          <Badge variant="secondary" className="text-xs gap-1 bg-primary/20 text-primary border-0">
            <Sparkles className="w-3 h-3" />
            Neural
          </Badge>
        )}
      </div>

      {/* Voice Selection Dropdown */}
      <div className="mb-3">
        <Select value={selectedVoiceId} onValueChange={handleVoiceChange}>
          <SelectTrigger className="w-full h-9 text-sm bg-background/50 border-border/50">
            <SelectValue placeholder={t('gamesLibrary.tts.selectVoice')}>
              {selectedVoice && (
                <span className="flex items-center gap-2">
                  {selectedVoice.engine === 'neural' && <Sparkles className="w-3 h-3 text-primary" />}
                  {selectedVoice.name}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            {availableVoices.map((voice) => (
              <SelectItem key={voice.id} value={voice.id}>
                <div className="flex items-center gap-2">
                  {voice.engine === 'voxtral' && <Sparkles className="w-3 h-3 text-violet-500" />}
                  {voice.engine === 'neural' && <Sparkles className="w-3 h-3 text-primary" />}
                  <span className={voice.engine === 'voxtral' ? 'font-medium' : ''}>{voice.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {voice.quality === 'high' ? '★★★' : voice.quality === 'medium' ? '★★' : '★'}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Voxtral cloud info */}
      {isVoxtral && (
        <div className="mb-3 p-2 rounded-lg bg-violet-500/5 border border-violet-500/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 text-violet-500" />
            <span>{currentLang === 'de' ? 'Mistral Voxtral AI — höchste Sprachqualität' : 'Mistral Voxtral AI — highest voice quality'}</span>
          </div>
        </div>
      )}

      {/* Model Info (for local neural voices not yet downloaded) */}
      {isNeural && !isVoxtral && !isModelReady && downloadProgress === null && (
        <div className="mb-3 p-2 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>{t('gamesLibrary.tts.firstTimeDownload')}</span>
          </div>
        </div>
      )}

      {/* Download Progress */}
      {downloadProgress !== null && (
        <div className="mb-3 p-2 rounded-lg bg-primary/10 border border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm font-medium text-foreground">
              {t('gamesLibrary.tts.loadingVoice')} {downloadProgress}%
            </span>
          </div>
          <Progress value={downloadProgress} className="h-2" />
        </div>
      )}

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
            ) : isPaused ? (
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleResume}
                className="h-9 w-9 text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                <Play className="w-5 h-5" />
              </Button>
            ) : (
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handlePlay}
                disabled={downloadProgress !== null}
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
