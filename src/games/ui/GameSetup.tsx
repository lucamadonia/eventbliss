import { useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Play, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPlayerColor, getPlayerInitial } from "./PlayerAvatars";
import { PlayerSetup, type PlayerSetupPlayer } from "./PlayerSetup";
import { useInitialRoster } from "./useInitialRoster";
import { GameRulesModal, useAutoShowRules, RulesHelpButton } from "./GameRulesModal";
import { PremiumImageChoiceCard } from "./PremiumImageChoiceCard";

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
  /** Optional generated artwork turns the compact mode grid into cinematic cards. */
  modeAssets?: Record<string, string>;
  accent?: string;
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
  modeAssets,
  accent = "#df8eff",
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

  // Party session fallback — separate from online (no Globe icon for party players).
  // Die Rangfolge (Raum vor Party, ab zwei Personen) liegt jetzt in
  // `useInitialRoster` und wird von allen Spielen geteilt. Wichtig: Der Helfer
  // haengt ueber `useSyncExternalStore` an der Party-Sitzung — kommt jemand
  // waehrend des Setups dazu, ist er sofort dabei. Die frueher hier stehende
  // `useMemo`-Fassung las genau einmal beim Mount.
  const roster = useInitialRoster();
  const partyPlayers = autoOnlinePlayers ? undefined : roster;

  const hasOnline = (autoOnlinePlayers && autoOnlinePlayers.length > 0) || (partyPlayers && partyPlayers.length > 0);
  const allAutoPlayers = autoOnlinePlayers || partyPlayers;

  // Vorbelegte Namen ueber i18n — hartkodiertes "Spieler N" erschien sonst
  // auch in einer englischen Oberflaeche.
  const nameFor = (n: number) => t("games.setup.playerN", { n });
  const [players, setPlayers] = useState<SetupPlayer[]>(() => [
    createPlayer(nameFor(1)),
    createPlayer(nameFor(2)),
  ]);

  const rosterKey = allAutoPlayers?.map((p) => `${p.id}:${p.name}`).join("|");

  // Auto-populate players from online room or party
  useEffect(() => {
    if (hasOnline && allAutoPlayers && allAutoPlayers.length >= 2) {
      setPlayers(allAutoPlayers.map(p => ({ id: p.id, name: p.name })));
    }
    // Auf Kennung UND Name achten, nicht nur auf die Anzahl: Wird in der Party
    // jemand umbenannt oder ausgetauscht, bleibt die Anzahl gleich und die
    // Uebernahme unterblieb still.
  }, [hasOnline, rosterKey]);
  const [selectedMode, setSelectedMode] = useState(modes[0]?.id ?? "");
  const [timer, setTimer] = useState(settings.timer.default);
  const [rounds, setRounds] = useState(settings.rounds.default);

  const addPlayer = useCallback(() => {
    setPlayers((prev) => {
      if (prev.length >= maxPlayers) return prev;
      return [...prev, createPlayer(nameFor(prev.length + 1))];
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

  // Import participant names from one of the user's events. REPLACES the whole
  // roster with the imported names (so the "Spieler 1/2" placeholders don't
  // linger), capped at max and padded up to min.
  const handleImportNames = useCallback((names: string[]) => {
    setPlayers(() => {
      const merged = names.slice(0, maxPlayers).map((n) => createPlayer(n));
      while (merged.length < minPlayers) merged.push(createPlayer(nameFor(merged.length + 1)));
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
    <div className="relative min-h-screen overflow-hidden bg-[#0a0e14] px-4 py-8 font-game">
      {modeAssets && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 opacity-90"
          style={{
            background: `radial-gradient(circle at 15% 4%, ${accent}20, transparent 34%), radial-gradient(circle at 88% 18%, rgba(143,245,255,0.12), transparent 31%)`,
          }}
        />
      )}
      <div className={`relative mx-auto space-y-6 ${modeAssets ? 'max-w-2xl' : 'max-w-md'}`}>
        {/* Header with rules button */}
        {modeAssets ? (
          <section className="relative min-h-[210px] overflow-hidden rounded-[32px] border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.36)]">
            <img
              src={modeAssets[selectedMode] ?? Object.values(modeAssets)[0]}
              alt=""
              aria-hidden="true"
              decoding="async"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090711] via-[#090711]/45 to-black/10" />
            <div className="relative flex min-h-[210px] flex-col justify-end p-6">
              <div className="absolute right-4 top-4">
                {gameId ? <RulesHelpButton onClick={openRules} /> : null}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: accent }}>
                {t('games.setup.selectMode')}
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                {title ?? t('games.setup.title')}
              </h1>
            </div>
          </section>
        ) : (
          <div className="flex items-center justify-between">
            <div className="w-10" /> {/* spacer */}
            <h1 className="text-2xl font-extrabold text-white text-center font-game tracking-tight">{title ?? t('games.setup.title')}</h1>
            {gameId ? <RulesHelpButton onClick={openRules} /> : <div className="w-10" />}
          </div>
        )}

        {/* Player list — einheitlicher PlayerSetup-Block (oben, 1. Sektion) */}
        <PlayerSetup
          players={setupPlayers}
          onAdd={addPlayer}
          onRemove={removePlayer}
          onRename={updateName}
          onImportNames={hasOnline ? undefined : handleImportNames}
          min={minPlayers}
          max={maxPlayers}
          accent={accent}
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
            <div className={`grid grid-cols-2 gap-3 ${modeAssets && modes.length >= 5 ? 'sm:grid-cols-3' : ''}`}>
              {modes.map((mode) => (
                modeAssets?.[mode.id] ? (
                  <PremiumImageChoiceCard
                    key={mode.id}
                    title={mode.name}
                    subtitle={mode.desc}
                    image={modeAssets[mode.id]}
                    selected={selectedMode === mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    accent={accent}
                  />
                ) : (
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
                )
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
