import { useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Play, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPlayerColor, getPlayerInitial } from "./PlayerAvatars";
import { PlayerSetup, type PlayerSetupPlayer } from "./PlayerSetup";
import { getOnlineRoomPlayers } from "../multiplayer/useGameRoom";
import { getActivePartySession } from "@/hooks/usePartySession";
import { GameRulesModal, useAutoShowRules, RulesHelpButton } from "./GameRulesModal";

export interface GameMode {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
}

export interface SettingsConfig {
  timer: { min: number; max: number; default: number; step: number; label: string };
  rounds: { min: number; max: number; default: number; step: number; label: string };
}

interface SetupPlayer {
  id: string;
  name: string;
}

export interface OnlinePlayer {
  id: string;
  name: string;
  color: string;
  avatar: string;
}

interface GameSetupProps {
  modes: GameMode[];
  settings: SettingsConfig;
  onStart: (
    players: { id: string; name: string; color: string; avatar: string }[],
    mode: string,
    settings: { timer: number; rounds: number }
  ) => void;
  title?: string;
  gameId?: string;
  minPlayers?: number;
  maxPlayers?: number;
  onlinePlayers?: OnlinePlayer[];
}

let nextPlayerId = 1;
function createPlayer(name?: string): SetupPlayer {
  const id = `p-${nextPlayerId++}`;
  return { id, name: name ?? "" };
}

export function GameSetup({
  modes,
  settings,
  onStart,
  title,
  gameId = "",
  minPlayers = 2,
  maxPlayers = 20,
  onlinePlayers,
}: GameSetupProps) {
  const { t } = useTranslation();
  const { showRules, openRules, closeRules } = useAutoShowRules(gameId);

  // Auto-detect players: only use online/party players when explicitly provided
  // onlinePlayers prop means we are inside an OnlineGameWrapper — show Globe icon
  // getOnlineRoomPlayers() can have stale data from previous rooms — only trust the prop
  const autoOnlinePlayers = useMemo(() => {
    if (onlinePlayers && onlinePlayers.length > 0) return onlinePlayers;
    return undefined;
  }, [onlinePlayers]);

  // Party session fallback — separate from online (no Globe icon for party players)
  const partyPlayers = useMemo(() => {
    if (autoOnlinePlayers) return undefined;
    const roomPlayers = getOnlineRoomPlayers();
    if (roomPlayers.length >= 2) {
      return roomPlayers.map(p => ({ id: p.id, name: p.name, color: p.color, avatar: p.avatar || p.name.charAt(0) }));
    }
    const party = getActivePartySession();
    if (party?.players && party.players.length >= 2) {
      return party.players.map(p => ({ id: p.id, name: p.name, color: p.color, avatar: p.avatar || p.name.charAt(0) }));
    }
    return undefined;
  }, [autoOnlinePlayers]);

  const hasOnline = (autoOnlinePlayers && autoOnlinePlayers.length > 0) || (partyPlayers && partyPlayers.length > 0);
  const allAutoPlayers = autoOnlinePlayers || partyPlayers;

  const [players, setPlayers] = useState<SetupPlayer[]>(() => [
    createPlayer("Spieler 1"),
    createPlayer("Spieler 2"),
  ]);

  // Auto-populate players from online room or party
  useEffect(() => {
    if (hasOnline && allAutoPlayers && allAutoPlayers.length >= 2) {
      setPlayers(allAutoPlayers.map(p => ({ id: p.id, name: p.name })));
    }
  }, [hasOnline, allAutoPlayers?.length]);
  const [selectedMode, setSelectedMode] = useState(modes[0]?.id ?? "");
  const [timer, setTimer] = useState(settings.timer.default);
  const [rounds, setRounds] = useState(settings.rounds.default);

  const addPlayer = useCallback(() => {
    setPlayers((prev) => {
      if (prev.length >= maxPlayers) return prev;
      return [...prev, createPlayer(`Spieler ${prev.length + 1}`)];
    });
  }, [maxPlayers]);

  const removePlayer = useCallback(
    (id: string) => {
      setPlayers((prev) => {
        if (prev.length <= minPlayers) return prev;
        return prev.filter((p) => p.id !== id);
      });
    },
    [minPlayers]
  );

  const updateName = useCallback((id: string, name: string) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }, []);

  // Import participant names from one of the user's events. Replaces the
  // default "Spieler N" placeholders, keeps already-named players, caps at max.
  const handleImportNames = useCallback((names: string[]) => {
    setPlayers((prev) => {
      const kept = prev.filter((p) => p.name.trim() && !/^Spieler \d+$/.test(p.name.trim()));
      const merged = [...kept];
      for (const n of names) {
        if (merged.length >= maxPlayers) break;
        merged.push(createPlayer(n));
      }
      while (merged.length < minPlayers) merged.push(createPlayer(`Spieler ${merged.length + 1}`));
      return merged;
    });
  }, [maxPlayers, minPlayers]);

  // Für den einheitlichen PlayerSetup-Block: echte Online-Spieler sind read-only
  // (ihr Name ist auf deren eigenem Gerät maßgeblich); lokale/Party-Spieler editierbar.
  const setupPlayers: PlayerSetupPlayer[] = players.map((p) => {
    const online = autoOnlinePlayers?.find((op) => op.id === p.id);
    return { id: p.id, name: p.name, color: online?.color, avatar: online?.avatar, readOnly: !!online };
  });

  const canStart = players.every((p) => p.name.trim().length > 0) && selectedMode;

  const handleStart = () => {
    if (!canStart) return;
    const mapped = players.map((p, i) => {
      // Use online player's color if available
      const onlineMatch = autoOnlinePlayers?.find(op => op.id === p.id);
      return {
        id: p.id,
        name: p.name.trim(),
        color: onlineMatch?.color || getPlayerColor(i),
        avatar: onlineMatch?.avatar || getPlayerInitial(p.name),
      };
    });
    onStart(mapped, selectedMode, { timer, rounds });
  };

  return (
    <div className="min-h-screen bg-[#0a0e14] px-4 py-8 font-game">
      <div className="mx-auto max-w-md space-y-6">
        {/* Header with rules button */}
        <div className="flex items-center justify-between">
          <div className="w-10" /> {/* spacer */}
          <h1 className="text-2xl font-extrabold text-white text-center font-game tracking-tight">{title ?? t('games.setup.title')}</h1>
          {gameId ? <RulesHelpButton onClick={openRules} /> : <div className="w-10" />}
        </div>

        {/* Player list — einheitlicher PlayerSetup-Block (oben, 1. Sektion) */}
        <PlayerSetup
          players={setupPlayers}
          onAdd={addPlayer}
          onRemove={removePlayer}
          onRename={updateName}
          onImportNames={hasOnline ? undefined : handleImportNames}
          min={minPlayers}
          max={maxPlayers}
          accent="#df8eff"
          hint={hasOnline ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#df8eff]/10 border border-[#df8eff]/20">
              <Wifi className="w-3 h-3 text-[#df8eff]" />
              <span className="text-[10px] font-bold text-[#df8eff] uppercase tracking-wider">{t('games.setup.onlineRoom')}</span>
            </div>
          ) : undefined}
        />

        {/* Mode selection */}
        {modes.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('games.setup.selectMode')}</h2>
            <div className="grid grid-cols-2 gap-3">
              {modes.map((mode) => (
                <motion.button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-colors text-center",
                    selectedMode === mode.id
                      ? "border-purple-500 bg-purple-500/10 text-white"
                      : "border-gray-700 bg-gray-800/40 text-gray-300 hover:border-gray-600"
                  )}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="text-2xl">{mode.icon}</span>
                  <span className="text-sm font-semibold">{mode.name}</span>
                  <span className="text-xs text-gray-400 leading-tight">{mode.desc}</span>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* Settings sliders */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            {t('games.setup.settings')}
          </h2>
          <SliderSetting
            label={settings.timer.label}
            value={timer}
            min={settings.timer.min}
            max={settings.timer.max}
            step={settings.timer.step}
            onChange={setTimer}
            suffix="s"
          />
          <SliderSetting
            label={settings.rounds.label}
            value={rounds}
            min={settings.rounds.min}
            max={settings.rounds.max}
            step={settings.rounds.step}
            onChange={setRounds}
          />
        </section>

        {/* Start button */}
        <motion.button
          onClick={handleStart}
          disabled={!canStart}
          className={cn(
            "w-full py-4 rounded-2xl font-extrabold text-lg font-game flex items-center justify-center gap-2 transition-all",
            canStart
              ? "bg-gradient-to-r from-[#df8eff] via-[#ff6b98] to-[#ff8a50] text-white shadow-[0_0_30px_rgba(223,142,255,0.4)]"
              : "bg-[#1b2028] text-[#484750] cursor-not-allowed"
          )}
          whileHover={canStart ? { scale: 1.02 } : {}}
          whileTap={canStart ? { scale: 0.97 } : {}}
        >
          <Play className="w-5 h-5" />
          {t('games.setup.startGame')}
        </motion.button>
      </div>

      {/* Rules Modal */}
      {gameId && <GameRulesModal gameId={gameId} open={showRules} onClose={closeRules} />}
    </div>
  );
}

function SliderSetting({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix = "",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-300">{label}</span>
        <span className="text-white font-semibold">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none bg-gray-700 accent-purple-500 cursor-pointer"
      />
    </div>
  );
}
