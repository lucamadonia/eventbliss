import { GameStage } from '../ui/GameStage';
import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, MessageSquare, Shuffle, Check, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useHaptics } from "@/hooks/useHaptics";
import { PlayerSetup } from '../ui/PlayerSetup';
import { GameSetupBackLink } from '@/games/ui/GameSetupBackLink';
import { useInitialRoster } from '@/games/ui/useInitialRoster';

export const PLAYER_COLORS = ['#06b6d4','#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#10b981','#ec4899','#f97316','#6366f1','#14b8a6'];

// Sentinel used internally so import logic doesn't depend on the displayed name.
const DEFAULT_PLAYER_SENTINEL = '__DEFAULT__';

// Mode cards for the bento setup grid. `size` controls the grid span,
// `tone` selects the accent color family used for border/chip/icon.
type ModeCard = {
  id: string;
  labelKey: string;
  tagKey?: string;
  descKey: string;
  icon: React.ReactNode;
  size: 'large' | 'medium' | 'small';
  tone: 'primary' | 'secondary' | 'tertiary';
};
const MODE_CARDS: ModeCard[] = [
  { id: 'classic', labelKey: 'gameModes.thisorthat.classic.name', tagKey: 'games.thisorthat.modeTagPopular', descKey: 'gameModes.thisorthat.classic.desc', icon: <Shuffle className="w-6 h-6" />, size: 'large',  tone: 'primary'  },
  { id: 'speed',   labelKey: 'gameModes.thisorthat.speed.name',                                               descKey: 'gameModes.thisorthat.speed.desc',   icon: <Zap className="w-6 h-6" />,      size: 'small',  tone: 'tertiary' },
  { id: 'debatte', labelKey: 'gameModes.thisorthat.debatte.name',                                             descKey: 'gameModes.thisorthat.debatte.desc', icon: <MessageSquare className="w-6 h-6" />, size: 'medium', tone: 'secondary' },
  { id: 'chaos',   labelKey: 'games.thisorthat.modeChaosLabel',                                               descKey: 'games.thisorthat.modeChaosDesc',    icon: <Flame className="w-6 h-6" />,    size: 'medium', tone: 'primary'  },
];

// ---------------------------------------------------------------------------
// ThisOrThatSetup — bento-grid game setup (hero + mode cards + difficulty +
// player strip + start). Lives inside the same file to keep the diff
// reviewable; the shared `GameSetup` component stays in place for the 6
// other games that use it.
// ---------------------------------------------------------------------------

interface ThisOrThatSetupProps {
  onStart: (
    mapped: { id: string; name: string; color: string; avatar: string }[],
    selectedMode: string,
    settings: { timer: number; rounds: number },
  ) => void;
  onlinePlayers?: { id: string; name: string; color?: string; avatar?: string }[];
  haptics: ReturnType<typeof useHaptics>;
}

const TONE_STYLE: Record<'primary' | 'secondary' | 'tertiary', {
  border: string; chip: string; icon: string; text: string; glow: string;
}> = {
  primary:   { border: 'border-[#df8eff]', chip: 'bg-[#df8eff]/20 text-[#edb095]',  icon: 'text-[#edb095]',  text: 'text-[#edb095]',  glow: 'shadow-[0_0_22px_rgba(223,142,255,0.22)]' },
  secondary: { border: 'border-[#ff6b98]', chip: 'bg-[#ff6b98]/20 text-[#ff6b98]',  icon: 'text-[#ff6b98]',  text: 'text-[#ff6b98]',  glow: 'shadow-[0_0_22px_rgba(255,107,152,0.22)]' },
  tertiary:  { border: 'border-[#8ff5ff]', chip: 'bg-[#8ff5ff]/20 text-[#8ff5ff]',  icon: 'text-[#8ff5ff]',  text: 'text-[#8ff5ff]',  glow: 'shadow-[0_0_22px_rgba(143,245,255,0.22)]' },
};

export function ThisOrThatSetup({ onStart, onlinePlayers, haptics }: ThisOrThatSetupProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isOnline = (onlinePlayers?.length ?? 0) > 0;
  /**
   * Party-Besetzung uebernehmen. Beim Umbau auf dieses eigene Bento-Setup
   * (Commit 977653d) ging der Party-Zweig verloren, den der geteilte
   * `GameSetup` mitgebracht hatte — seither begann This or That mitten in
   * einer Party mit zwei Platzhaltern.
   */
  const partyRoster = useInitialRoster({ onlinePlayers, min: 2 });

  const [modeId, setModeId] = useState<string>('classic');
  const [rounds, setRounds] = useState<number>(15);
  const [players, setPlayers] = useState<{ id: string; name: string; color: string; avatar: string }[]>(() => {
    if (isOnline && onlinePlayers) {
      return onlinePlayers.map((p, i) => ({
        id: p.id, name: p.name,
        color: p.color ?? PLAYER_COLORS[i % PLAYER_COLORS.length],
        avatar: p.avatar ?? p.name.slice(0, 1).toUpperCase(),
      }));
    }
    if (partyRoster) {
      return partyRoster.map((p, i) => ({
        id: p.id, name: p.name,
        color: p.color ?? PLAYER_COLORS[i % PLAYER_COLORS.length],
        avatar: p.avatar,
      }));
    }
    return [
      { id: 'p-1', name: DEFAULT_PLAYER_SENTINEL, color: PLAYER_COLORS[0], avatar: 'P' },
      { id: 'p-2', name: DEFAULT_PLAYER_SENTINEL, color: PLAYER_COLORS[1], avatar: '2' },
    ];
  });

  // Resolve the display name: sentinel → translated default, otherwise use stored name
  const resolveDisplayName = (name: string, idx: number): string => {
    if (name === DEFAULT_PLAYER_SENTINEL) {
      return idx === 0 ? t('games.thisorthat.defaultPlayer1') : t('games.thisorthat.defaultPlayerN', { n: idx + 1 });
    }
    return name;
  };

  const MIN = 2, MAX = 20;
  const addPlayer = () => {
    if (isOnline) return; // Online: Spielerliste ist fix (Remote-Geräte)
    if (players.length >= MAX) return;
    const idx = players.length;
    const id = `p-${Date.now()}-${idx}`;
    void haptics.select();
    setPlayers((prev) => [...prev, {
      id,
      name: DEFAULT_PLAYER_SENTINEL,
      color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
      avatar: String(idx + 1),
    }]);
  };
  const removePlayer = (id: string) => {
    if (isOnline) return;
    setPlayers((prev) => prev.length > MIN ? prev.filter((p) => p.id !== id) : prev);
  };
  const renamePlayer = (id: string, name: string) => {
    if (isOnline) return;
    setPlayers((prev) => prev.map((p) =>
      p.id === id ? { ...p, name, avatar: name.slice(0, 1).toUpperCase() || '?' } : p,
    ));
  };

  // Replace entire roster with imported names; drop all existing players incl. sentinels/placeholders.
  // Pad to MIN with sentinel placeholders if fewer than MIN names are imported.
  const handleImportNames = (names: string[]) => {
    if (isOnline) return;
    const fresh: { id: string; name: string; color: string; avatar: string }[] = [];
    for (const n of names) {
      if (fresh.length >= MAX) break;
      const trimmed = n.trim();
      if (!trimmed) continue;
      fresh.push({
        id: `p-${Date.now()}-${fresh.length}`,
        name: trimmed,
        color: PLAYER_COLORS[fresh.length % PLAYER_COLORS.length],
        avatar: trimmed.slice(0, 1).toUpperCase() || '?',
      });
    }
    while (fresh.length < MIN) {
      const idx = fresh.length;
      fresh.push({
        id: `p-${Date.now()}-${idx}`,
        name: DEFAULT_PLAYER_SENTINEL,
        color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
        avatar: String(idx + 1),
      });
    }
    setPlayers(fresh);
  };

  const canStart = players.length >= MIN && players.every((p) => p.name.trim().length > 0);
  const handleStart = () => {
    if (!canStart) return;
    void haptics.celebrate();
    // Resolve sentinel display names before passing to game
    const resolved = players.map((p, i) => ({
      ...p,
      name: resolveDisplayName(p.name, i),
      avatar: p.name === DEFAULT_PLAYER_SENTINEL
        ? (i === 0 ? t('games.thisorthat.defaultPlayer1').slice(0, 1).toUpperCase() : String(i + 1))
        : p.avatar,
    }));
    onStart(
      resolved,
      modeId === 'chaos' ? 'speed' : modeId, // chaos routes to speed with tighter rounds
      { timer: modeId === 'chaos' ? 3 : 5, rounds },
    );
  };

  // Bento grid layout map: col/row spans per card size. `large` takes
  // 4 columns of the 6-col grid with double height, others fill in.
  const bentoClasses: Record<ModeCard['size'], string> = {
    large:  'col-span-4 h-44 sm:h-48',
    medium: 'col-span-3 h-36 sm:h-40',
    small:  'col-span-2 h-44 sm:h-48',
  };

  return (
    <GameStage gameId="this-or-that" className="duel-shell relative min-h-screen overflow-hidden  text-[#f1f3fc] pb-40">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#df8eff]/10 rounded-full blur-[100px]" />
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#ff6b98]/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-32 -right-20 w-64 h-64 bg-[#ff6b98]/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-[#df8eff]/5 rounded-full blur-[150px]" />
      </div>

      <main className="relative z-10 pt-10 px-6 max-w-2xl mx-auto">
        {/* Back + hero */}
        <GameSetupBackLink
          onClick={() => navigate('/games')}
          className="mb-6 text-[#a8abb3] hover:text-white transition-colors"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t('common.back')}
        </GameSetupBackLink>

        <section className="relative mb-10">
          <p className="text-[#8ff5ff] font-bold tracking-[0.25em] text-[11px] uppercase mb-2">
            {t('games.thisorthat.socialChallenge')}
          </p>
          <h2 className="text-5xl font-black tracking-tighter leading-[0.95] mb-3">
            This <span className="text-[#edb095] italic drop-shadow-[0_0_10px_rgba(223,142,255,0.5)]">{t('games.thisorthat.orWord')}</span> That
          </h2>
          <p className="text-[#a8abb3] text-sm max-w-[300px]">
            {t('games.thisorthat.setupSubtitle')}
          </p>
        </section>

        {/* Player setup — always first section */}
        <section className="mb-10">
          <PlayerSetup
            players={players.map((p, i) => ({
              id: p.id,
              name: resolveDisplayName(p.name, i),
              color: p.color,
              avatar: p.avatar,
              readOnly: isOnline,
            }))}
            onAdd={addPlayer}
            onRemove={removePlayer}
            onRename={(id, name) => renamePlayer(id, name)}
            onImportNames={isOnline ? undefined : handleImportNames}
            min={MIN}
            max={isOnline ? players.length : MAX}
            accent="#df8eff"
            maxNameLength={12}
          />
        </section>

        {/* Mode bento grid */}
        <section className="mb-10">
          <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-[#a8abb3] mb-4 flex items-center gap-2">
            {t('games.setup.selectMode')}
            <span className="w-1.5 h-1.5 bg-[#ff6b98] rounded-full animate-pulse" />
          </h3>
          <div className="grid grid-cols-6 gap-3">
            {MODE_CARDS.map((m) => {
              const active = modeId === m.id;
              const tone = TONE_STYLE[m.tone];
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { void haptics.select(); setModeId(m.id); }}
                  aria-pressed={active}
                  aria-label={t(m.labelKey)}
                  className={cn(
                    'relative rounded-2xl overflow-hidden group text-left transition-all active:scale-[0.98]',
                    bentoClasses[m.size],
                    active
                      ? cn('border-2', tone.border, tone.glow)
                      : 'border border-[#44484f]/20 hover:border-[#44484f]/60',
                  )}
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, rgba(32,38,47,0.8), rgba(15,20,26,0.95))'
                      : 'rgba(15,20,26,0.7)',
                  }}
                >
                  {/* Oversized bg icon */}
                  <div className={cn(
                    'absolute -right-2 -bottom-2 opacity-10 transition-opacity pointer-events-none',
                    active ? 'opacity-25' : 'group-hover:opacity-20',
                    tone.icon,
                  )}>
                    <span className="block scale-[5] origin-bottom-right">
                      {m.icon}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="relative h-full p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      {m.tagKey && (
                        <span className={cn('inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md', tone.chip)}>
                          {t(m.tagKey)}
                        </span>
                      )}
                      {active && (
                        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center', tone.chip)}>
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className={cn('mb-1.5', tone.icon)}>{m.icon}</div>
                      <h4 className={cn('text-lg font-extrabold leading-none mb-1', active ? tone.text : 'text-white')}>
                        {t(m.labelKey)}
                      </h4>
                      {m.size !== 'small' && (
                        <p className="text-[10px] text-[#a8abb3] leading-snug line-clamp-2">{t(m.descKey)}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Rounds slider */}
        <section className="rounded-2xl bg-[#0f141a] border-l-4 border-[#df8eff] p-5 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[#a8abb3] font-medium text-sm">{t('games.setup.rounds')}</span>
            <span className="text-[#8ff5ff] font-black text-lg tabular-nums">{rounds}</span>
          </div>
          <input
            type="range"
            min={5}
            max={30}
            step={1}
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
            aria-label={t('games.setup.rounds')}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#df8eff]"
            style={{
              background: `linear-gradient(to right, #df8eff 0%, #ff6b98 ${((rounds - 5) / 25) * 100}%, #20262f ${((rounds - 5) / 25) * 100}%)`,
            }}
          />
          <div className="flex justify-between text-[10px] font-bold text-[#44484f] mt-2">
            <span>5</span>
            <span>15</span>
            <span>30</span>
          </div>
        </section>
      </main>

      {/* Floating start CTA */}
      <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] inset-x-0 px-6 flex justify-center z-40 pointer-events-none">
        <motion.button
          type="button"
          onClick={handleStart}
          disabled={!canStart}
          whileTap={canStart ? { scale: 0.97 } : {}}
          className={cn(
            'w-full max-w-md h-16 rounded-full font-black tracking-tight text-base flex items-center justify-center gap-3 pointer-events-auto transition-all',
            canStart
              ? 'text-[#0a0e14] shadow-[0_20px_40px_rgba(223,142,255,0.35)]'
              : 'bg-[#20262f] text-[#44484f] cursor-not-allowed',
          )}
          style={canStart ? { background: 'linear-gradient(135deg, #df8eff, #d779ff)' } : {}}
        >
          {canStart ? (
            <>
              {t('games.thisorthat.startGame')}
              <Zap className="w-5 h-5" />
            </>
          ) : (
            t('games.setup.minPlayers', { count: MIN })
          )}
        </motion.button>
      </div>
    </GameStage>
  );
}
