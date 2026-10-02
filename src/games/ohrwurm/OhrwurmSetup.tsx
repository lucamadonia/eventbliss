// OHRWURM — Setup (Teilnehmer, Modus, Ziel, Genre, Wiedergabe) und Warteraum.
import { avatarOrFallback } from '../multiplayer/seat-avatar';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Loader2, Music2, User, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { useHaptics } from '@/hooks/useHaptics';
import { PlayerSetup } from '../ui/PlayerSetup';
import { GameSetupBackLink } from '../ui/GameSetupBackLink';
import { PremiumImageChoiceCard } from '../ui/PremiumImageChoiceCard';
import { OHRWURM_GENRE_ASSETS, OHRWURM_MODE_ASSETS } from '../ui/premium-game-assets';
import { OHRWURM_GENRES } from './ohrwurm-content';
import { type PlaybackMode, spotifyModePossible } from './playback';
import { OW, OW_STYLE, PLAYER_COLORS, type OhrwurmConfig, type SetupPlayer } from './ohrwurm-theme';

// ===========================================================================
// Setup-Screen
// ===========================================================================
interface SetupProps {
  onStart: (cfg: OhrwurmConfig, players: SetupPlayer[]) => void;
  haptics: ReturnType<typeof useHaptics>;
  /** Online mode: seed the roster from the room and lock it. */
  initialPlayers?: SetupPlayer[];
  lockRoster?: boolean;
}

export function OhrwurmSetup({ onStart, haptics, initialPlayers, lockRoster = false }: SetupProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'solo' | 'group'>('solo');
  const [winTarget, setWinTarget] = useState(10);
  const [genre, setGenre] = useState<string | null>(null);
  const [playback, setPlayback] = useState<PlaybackMode>('preview');
  const [players, setPlayers] = useState<SetupPlayer[]>(
    initialPlayers && initialPlayers.length >= 2
      ? initialPlayers
      : [
          { id: 'p-1', name: t('games.ohrwurm.defaultPlayerYou'), color: PLAYER_COLORS[0], avatar: avatarOrFallback(undefined, 0) },
          { id: 'p-2', name: t('games.ohrwurm.defaultPlayer', { n: 2 }), color: PLAYER_COLORS[1], avatar: avatarOrFallback(undefined, 1) },
        ],
  );
  // Tastatur-Sichtbarkeit (Native): fixe Start-CTA ausblenden, damit das
  // fokussierte Namensfeld nicht verdeckt wird — gleicher Event wie NativeShell.
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const h = (e: Event) => setKeyboardVisible(!!(e as CustomEvent).detail?.visible);
    window.addEventListener('capacitor:keyboard', h);
    return () => window.removeEventListener('capacitor:keyboard', h);
  }, []);

  const MIN = 2, MAX = 4; // Spec §2.1: 2–4 Teilnehmer
  const addPlayer = () => {
    if (players.length >= MAX) return;
    const idx = players.length;
    void haptics.select();
    const id = `p-${idx + 1}-${Date.now()}`;
    setPlayers((prev) => [...prev, { id, name: `${mode === 'group' ? t('games.ohrwurm.group') : t('games.ohrwurm.player')} ${idx + 1}`, color: PLAYER_COLORS[idx % PLAYER_COLORS.length], avatar: avatarOrFallback(undefined, idx) }]);
  };
  const removePlayer = (id: string) => setPlayers((prev) => (prev.length > MIN ? prev.filter((p) => p.id !== id) : prev));
  const renamePlayer = (id: string, name: string) =>
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));

  const importNames = (names: string[]) => {
    setPlayers((prev) => {
      const kept = prev.filter((p) => p.name.trim() && !/^(Spieler|Gruppe|Player|Group) \d+$/.test(p.name.trim()) && p.name.trim() !== 'Du' && p.name.trim() !== 'You');
      const merged = [...kept];
      for (const n of names) {
        if (merged.length >= MAX) break;
        const idx = merged.length;
        merged.push({ id: `imp-${idx}-${n}`, name: n, color: PLAYER_COLORS[idx % PLAYER_COLORS.length], avatar: avatarOrFallback(undefined, idx) });
      }
      while (merged.length < MIN) {
        const idx = merged.length;
        merged.push({ id: `p-${idx + 1}`, name: `${t('games.ohrwurm.player')} ${idx + 1}`, color: PLAYER_COLORS[idx % PLAYER_COLORS.length], avatar: avatarOrFallback(undefined, idx) });
      }
      return merged;
    });
  };

  const canStart = players.length >= MIN && players.every((p) => p.name.trim().length > 0);
  const start = () => {
    if (!canStart) return;
    void haptics.celebrate();
    onStart({ mode, winTarget, genre, playback }, players);
  };

  const TARGETS = [
    { v: 6, label: t('games.ohrwurm.targetFast'), desc: t('games.ohrwurm.targetHits', { count: 6 }) },
    { v: 10, label: t('games.ohrwurm.targetClassic'), desc: t('games.ohrwurm.targetHits', { count: 10 }) },
    { v: 15, label: t('games.ohrwurm.targetMarathon'), desc: t('games.ohrwurm.targetHits', { count: 15 }) },
  ];

  return (
    <div className="relative min-h-[100dvh] overflow-hidden font-game" style={{ background: OW.bg, color: OW.text }}>
      <style>{OW_STYLE}</style>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full blur-[110px]" style={{ background: 'rgba(255,46,136,0.14)' }} />
        <div className="absolute top-1/3 -right-20 w-72 h-72 rounded-full blur-[120px]" style={{ background: 'rgba(38,224,196,0.10)' }} />
      </div>

      <main className="relative z-10 pt-10 px-6 max-w-2xl mx-auto">
        <GameSetupBackLink onClick={() => navigate('/games')} className="mb-6" style={{ color: OW.dim }}>
          <ArrowLeft className="w-3.5 h-3.5" /> {t('games.ohrwurm.back')}
        </GameSetupBackLink>

        {/* Hero */}
        <section className="relative mb-9 min-h-[230px] overflow-hidden rounded-[32px] border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.36)]">
          <img
            src={genre ? OHRWURM_GENRE_ASSETS[genre] : OHRWURM_MODE_ASSETS[mode]}
            alt=""
            aria-hidden="true"
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#16101f] via-[#16101f]/42 to-transparent" />
          <div className="relative flex min-h-[230px] flex-col justify-end p-6">
            <p className="mb-2 text-[13px] font-black" style={{ color: OW.secondary }}>{t('games.ohrwurm.musicQuiz')}</p>
            <h1 className="text-5xl font-black tracking-tighter leading-[0.95] ow-glow-pink" style={{ color: OW.primary }}>OHRWURM</h1>
            <p className="mt-2 max-w-sm text-sm text-white/65">
              {t('games.ohrwurm.setupHeroDesc', { count: winTarget })}
            </p>
          </div>
        </section>

        {/* Teilnehmer — einheitlicher Spieler-Block, IMMER ganz oben (1. Sektion) */}
        <section className="mb-8">
          <PlayerSetup
            players={players}
            locked={lockRoster}
            onAdd={lockRoster ? () => {} : addPlayer}
            onRemove={lockRoster ? () => {} : removePlayer}
            onRename={lockRoster ? () => {} : renamePlayer}
            onImportNames={lockRoster ? undefined : importNames}
            min={lockRoster ? players.length : MIN}
            max={lockRoster ? players.length : MAX}
            accent={OW.primary}
            label={lockRoster ? t('games.ohrwurm.inRoom') : (mode === 'group' ? t('games.ohrwurm.groups') : t('games.ohrwurm.players'))}
            maxNameLength={16}
          />
        </section>

        {/* Modus */}
        <section className="mb-8">
          <h3 className="text-sm font-bold mb-3" style={{ color: OW.dim }}>{t('games.ohrwurm.sectionMode')}</h3>
          <div className="grid grid-cols-2 gap-3">
            {([
              { id: 'solo', label: t('games.ohrwurm.modeSoloLabel'), desc: t('games.ohrwurm.modeSoloDesc'), icon: <User className="w-5 h-5" /> },
              { id: 'group', label: t('games.ohrwurm.modeGroupLabel'), desc: t('games.ohrwurm.modeGroupDesc'), icon: <Users className="w-5 h-5" /> },
            ] as const).map((m) => {
              const activeMode = mode === m.id;
              return (
                <PremiumImageChoiceCard
                  key={m.id}
                  title={m.label}
                  subtitle={m.desc}
                  image={OHRWURM_MODE_ASSETS[m.id]}
                  selected={activeMode}
                  onClick={() => { void haptics.select(); setMode(m.id); }}
                  accent={OW.primary}
                />
              );
            })}
          </div>
        </section>

        {/* Spielziel */}
        <section className="mb-8">
          <h3 className="text-sm font-bold mb-3" style={{ color: OW.dim }}>{t('games.ohrwurm.sectionTarget')}</h3>
          <div className="grid grid-cols-3 gap-3">
            {TARGETS.map((tgt) => {
              const activeT = winTarget === tgt.v;
              return (
                <button key={tgt.v} onClick={() => { void haptics.select(); setWinTarget(tgt.v); }}
                  className="rounded-2xl p-4 text-center transition-all active:scale-[0.98]"
                  style={{ background: OW.surface, border: `2px solid ${activeT ? OW.accent : 'transparent'}` }}>
                  <div className="text-2xl font-black" style={{ color: activeT ? OW.accent : OW.text }}>{tgt.v}</div>
                  <div className="text-[12px] font-bold mt-0.5">{tgt.label}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Genre-Filter */}
        <section className="mb-8">
          <h3 className="text-sm font-bold mb-3" style={{ color: OW.dim }}>{t('games.ohrwurm.sectionGenre')} <span className="opacity-50 normal-case tracking-normal">({t('games.ohrwurm.optional')})</span></h3>
          <PremiumImageChoiceCard
            title={t('games.ohrwurm.genreAll')}
            image={OHRWURM_MODE_ASSETS.solo}
            selected={genre === null}
            onClick={() => { void haptics.select(); setGenre(null); }}
            accent={OW.accent}
            layout="wide"
            className="mb-3"
          />
          <div className="-mx-6 flex snap-x gap-3 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {OHRWURM_GENRES.map((g) => (
              <PremiumImageChoiceCard
                key={g}
                title={g}
                image={OHRWURM_GENRE_ASSETS[g]}
                selected={genre === g}
                onClick={() => { void haptics.select(); setGenre(g); }}
                accent={OW.accent}
                className="!w-[154px] min-w-[154px] shrink-0 snap-start"
              />
            ))}
          </div>
        </section>

        {/* Wiedergabe */}
        <section className="mb-8">
          <h3 className="text-sm font-bold mb-3" style={{ color: OW.dim }}>{t('games.ohrwurm.sectionPlayback')}</h3>
          <div className="grid grid-cols-2 gap-3">
            {([
              { id: 'preview', label: t('games.ohrwurm.playbackPreviewLabel'), desc: t('games.ohrwurm.playbackPreviewDesc') },
              { id: 'spotify', label: t('games.ohrwurm.playbackSpotifyLabel'), desc: t('games.ohrwurm.playbackSpotifyDesc') },
            ] as const).map((m) => {
              const activeP = playback === m.id;
              const dimmed = m.id === 'spotify' && !spotifyModePossible();
              return (
                <PremiumImageChoiceCard
                  key={m.id}
                  title={m.label}
                  subtitle={dimmed ? t('games.ohrwurm.appOnly') : m.desc}
                  image={OHRWURM_MODE_ASSETS[m.id]}
                  selected={activeP}
                  disabled={dimmed}
                  onClick={() => { if (dimmed) return; void haptics.select(); setPlayback(m.id); }}
                  accent={OW.secondary}
                />
              );
            })}
          </div>
          {playback === 'spotify' && (
            <p className="text-[13px] mt-2" style={{ color: OW.dim }}>
              {t('games.ohrwurm.spotifyNote')}
            </p>
          )}
        </section>

      </main>

      {/* Start CTA — bei offener Tastatur ausblenden, damit das Namensfeld frei bleibt */}
      {!keyboardVisible && (
        <div className="relative z-40 flex justify-center px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <motion.button onClick={start} disabled={!canStart} whileTap={canStart ? { scale: 0.97 } : {}}
            className="w-full max-w-2xl h-16 rounded-full font-black tracking-tight text-base flex items-center justify-center gap-3 transition-all"
            style={canStart
              ? { background: `linear-gradient(135deg, ${OW.primary}, ${OW.secondary})`, color: OW.bg, boxShadow: `0 20px 40px ${OW.primary}40` }
              : { background: OW.surface, color: OW.dim }}>
            {canStart ? <>{t('games.ohrwurm.startGame')} <Crown className="w-5 h-5" /></> : t('games.ohrwurm.minPlayers', { count: MIN, label: mode === 'group' ? t('games.ohrwurm.groups') : t('games.ohrwurm.players') })}
          </motion.button>
        </div>
      )}
    </div>
  );
}

/** Online guests wait here until the host starts the game (first state arrives). */
export function OhrwurmWaiting({ roomCode }: { roomCode: string }) {
  const { t } = useTranslation();
  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center gap-5 px-8 text-center font-game" style={{ background: OW.bg, color: OW.text }}>
      <style>{OW_STYLE}</style>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[130px]" style={{ background: 'rgba(255,46,136,0.12)' }} />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-[130px]" style={{ background: 'rgba(38,224,196,0.10)' }} />
      </div>
      <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full" style={{ background: 'rgba(255,46,136,0.12)', border: `1px solid ${OW.primary}` }}>
        <Music2 className="w-8 h-8" style={{ color: OW.primary }} />
      </div>
      <h1 className="relative text-3xl font-black ow-glow-pink" style={{ color: OW.primary }}>OHRWURM</h1>
      <div className="relative flex items-center gap-2 text-sm font-bold" style={{ color: OW.secondary }}>
        <Loader2 className="w-4 h-4 animate-spin" /> {t('games.ohrwurm.waitingForHost')}
      </div>
      <p className="relative text-xs" style={{ color: OW.dim }}>
        {t('games.ohrwurm.waitingRoom', { code: roomCode })}
      </p>
    </div>
  );
}
