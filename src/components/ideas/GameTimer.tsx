import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Timer, 
  Volume2, 
  VolumeX,
  Maximize2,
  Minimize2,
  Bell,
  BellOff,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GameTimerProps {
  onClose?: () => void;
  defaultMinutes?: number;
  compact?: boolean;
}

const PRESETS = [5, 10, 15, 20, 30];

export const GameTimer = ({ onClose, defaultMinutes = 10, compact = false }: GameTimerProps) => {
  const { t } = useTranslation();
  const [totalSeconds, setTotalSeconds] = useState(defaultMinutes * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const progress = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  // Create alarm sound using Web Audio API
  const playAlarm = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 1);
      
      // Play 3 beeps
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 900;
        gain2.gain.setValueAtTime(0.5, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.5);
      }, 300);
      
      setTimeout(() => {
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.connect(gain3);
        gain3.connect(ctx.destination);
        osc3.frequency.value = 1000;
        gain3.gain.setValueAtTime(0.5, ctx.currentTime);
        gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
        osc3.start(ctx.currentTime);
        osc3.stop(ctx.currentTime + 1);
      }, 600);
    } catch (error) {
      console.error("Audio error:", error);
    }
  }, [soundEnabled]);

  // Vibrate on mobile
  const vibrate = useCallback(() => {
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
  }, []);

  // Send notification
  const sendNotification = useCallback(() => {
    if (!notificationEnabled) return;
    
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(t('gamesLibrary.timer.finished'), {
        body: t('gamesLibrary.timer.timeUp'),
        icon: "/favicon.png"
      });
    }
  }, [notificationEnabled, t]);

  // Request notification permission
  useEffect(() => {
    if (notificationEnabled && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [notificationEnabled]);

  // Timer logic
  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            playAlarm();
            vibrate();
            sendNotification();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, remainingSeconds, playAlarm, vibrate, sendNotification]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handlePreset = (mins: number) => {
    const newSeconds = mins * 60;
    setTotalSeconds(newSeconds);
    setRemainingSeconds(newSeconds);
    setIsRunning(false);
  };

  const handleCustomTime = () => {
    const mins = parseInt(customMinutes);
    if (mins > 0 && mins <= 180) {
      handlePreset(mins);
      setCustomMinutes("");
    }
  };

  const toggleTimer = () => {
    if (remainingSeconds === 0) {
      setRemainingSeconds(totalSeconds);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
  };

  const circleRadius = compact ? 60 : 80;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "rounded-2xl bg-gradient-to-br from-card via-card to-muted/30 border border-border/50 shadow-xl",
        isFullscreen && "fixed inset-0 z-50 flex items-center justify-center rounded-none bg-background",
        compact ? "p-4" : "p-6"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">
            {t('gamesLibrary.timer.title')}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setNotificationEnabled(!notificationEnabled)}
          >
            {notificationEnabled ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
          
          {onClose && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Circular Timer Display */}
      <div className={cn(
        "relative flex items-center justify-center",
        compact ? "my-4" : "my-8"
      )}>
        <svg 
          className={cn(
            "transform -rotate-90",
            compact ? "w-36 h-36" : "w-48 h-48"
          )}
        >
          {/* Background circle */}
          <circle
            cx="50%"
            cy="50%"
            r={circleRadius}
            fill="none"
            stroke="currentColor"
            strokeWidth={compact ? 6 : 8}
            className="text-muted"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx="50%"
            cy="50%"
            r={circleRadius}
            fill="none"
            stroke="url(#timerGradient)"
            strokeWidth={compact ? 6 : 8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className={cn(
              "font-mono font-bold tabular-nums",
              compact ? "text-3xl" : "text-5xl",
              remainingSeconds <= 10 && isRunning && "text-red-500"
            )}
            animate={remainingSeconds <= 10 && isRunning ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </motion.span>
          
          {remainingSeconds === 0 && (
            <motion.span
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-medium text-primary mt-1"
            >
              {t('gamesLibrary.timer.finished')}
            </motion.span>
          )}
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {PRESETS.map((mins) => (
          <motion.div key={mins} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Badge
              variant={totalSeconds === mins * 60 ? "default" : "outline"}
              className={cn(
                "cursor-pointer px-3 py-1.5 text-sm transition-all",
                totalSeconds === mins * 60 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-primary/10"
              )}
              onClick={() => handlePreset(mins)}
            >
              {mins} min
            </Badge>
          </motion.div>
        ))}
        
        {/* Custom time input */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="1"
            max="180"
            placeholder={t('gamesLibrary.timer.custom')}
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustomTime()}
            className="w-16 h-8 px-2 text-sm rounded-md border border-border bg-background text-center"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={handleCustomTime}
            disabled={!customMinutes}
          >
            {t('common.confirm')}
          </Button>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center gap-3">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            size={compact ? "default" : "lg"}
            onClick={toggleTimer}
            className={cn(
              "gap-2 shadow-lg",
              isRunning 
                ? "bg-amber-500 hover:bg-amber-600" 
                : "bg-green-500 hover:bg-green-600"
            )}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                {t('gamesLibrary.timer.pause')}
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                {t('gamesLibrary.timer.start')}
              </>
            )}
          </Button>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            size={compact ? "default" : "lg"}
            variant="outline"
            onClick={resetTimer}
            className="gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            {t('gamesLibrary.timer.reset')}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};
