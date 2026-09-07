import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { translateReactionWord } from '../../wordpress/word-content';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { spring, ease } from '@/lib/motion';
import { tvPanel, tvType, tvActiveRing } from '../tv-tokens';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';

/**
 * TVWordPressView — big-screen view for "Drück das Wort" (tap the right word
 * under time pressure). The TV is the richer shared canvas:
 *
 *   ┌──────────┬───────────────────────────┬──────────┐
 *   │ round    │   mode pill (top-center)  │ active   │
 *   │ rail     │                           │ player   │
 *   │          │   HERO: MASSIVE word      │ + score  │
 *   │          │   (pops in on change)     │ + combo  │
 *   ├──────────┴───────────────────────────┴──────────┤
 *   │ TVScoreboard — the WHOLE party, always on screen │
 *   └──────────────────────────────────────────────────┘
 *
 * The public rule, forbidden word and actual ink color match the phone.
 * Per-word correctness (isTarget) remains private and is never rendered here.
 */
const WP = { primary: '#df8eff', secondary: '#8ff5ff', accent: '#ffb84d', text: '#f4eefb', dim: '#a99cc4', bg: '#0a0e14' };

interface TVPlayer { name: string; score: number; combo: number; maxCombo: number; correct: number; wrong: number; missed: number }

function modeLabel(mode: string, t: (k: string, d: string) => string): string {
  switch (mode) {
    case 'kategorie': return t('games.wordpress.modes.kategorie', 'Kategorie');
    case 'stroop': return t('games.wordpress.modes.stroop', 'Stroop');
    case 'verboten': return t('games.wordpress.modes.verboten', 'Verboten');
    case 'speed-rush': return t('games.wordpress.modes.speedRush', 'Speed Rush');
    default: return mode;
  }
}

function accuracyOf(p: TVPlayer | undefined): number | null {
  if (!p) return null;
  const total = p.correct + p.wrong + p.missed;
  return total > 0 ? Math.round((p.correct / total) * 100) : null;
}

export default function TVWordPressView({ gameState }: { gameState: any }) {
  const { t, i18n } = useTranslation();
  const ambient = useAmbientMotion();

  const phase: string = gameState?.phase || 'playing';
  const round: number = gameState?.round ?? 1;
  const totalRounds: number = gameState?.totalRounds ?? 5;
  const mode: string = gameState?.mode || 'kategorie';
  const players: TVPlayer[] = gameState?.players || [];
  const currentPlayerIndex: number = gameState?.currentPlayerIndex ?? 0;
  const word = translateReactionWord(gameState?.currentWord || '', gameState?.contentLanguage, i18n.language);
  const wordIndex: number = gameState?.wordIndex ?? 0;
  const wordsPerTurn: number = gameState?.wordsPerTurn ?? 12;
  const combo: number = gameState?.liveCombo ?? 0;
  const liveScore: number | null = typeof gameState?.liveScore === 'number' && Number.isFinite(gameState.liveScore)
    ? gameState.liveScore : null;

  const active = players[currentPlayerIndex];
  // Live score from the active turn beats the (stale until turn ends) players[] score.
  const activeScore = phase === 'playing' && liveScore !== null ? liveScore : active?.score ?? 0;
  const accuracy = accuracyOf(active);
  const progress = Math.max(0, Math.min(1, wordsPerTurn ? wordIndex / wordsPerTurn : 0));

  // The host-generated color carries Stroop's rule. A text hash would invent
  // a different puzzle on the TV, including for repeated identical words.
  const wordColor = typeof gameState?.displayColor === 'string' && gameState.displayColor
    ? gameState.displayColor : '#d5f46a';
  const forbiddenWord = translateReactionWord(typeof gameState?.forbiddenWord === 'string' ? gameState.forbiddenWord : '—', gameState?.contentLanguage, i18n.language);
  const rule = mode === 'stroop' ? t('games.wordpress.promptStroop')
    : mode === 'verboten' ? t('games.wordpress.promptVerboten', { word: forbiddenWord })
    : mode === 'speed-rush' ? t('games.wordpress.promptSpeedRush')
    : t('games.wordpress.promptKategorie');

  // The whole party, always on screen. Active player gets the ring; their chip
  // shows live combo/accuracy so the bottom strip stays meaningful all game.
  const roster: TVScorePlayer[] = players.map((p, i) => {
    const isActive = i === currentPlayerIndex && phase === 'playing';
    const acc = accuracyOf(p);
    return {
      id: String(i),
      name: p.name,
      color: WP.primary,
      score: isActive ? activeScore : p.score,
      subtitle: isActive
        ? (combo > 0 ? `🔥${combo}` : (acc !== null ? `${acc}%` : undefined))
        : (p.maxCombo > 0 ? `${p.maxCombo}×🔥` : undefined),
      status: isActive ? 'active' : 'waiting',
    };
  });

  if (phase === 'gameOver') {
    const winner = [...players].sort((a, b) => b.score - a.score)[0];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-10" style={{ background: WP.bg }}>
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring.bouncy} className="text-center">
          <div style={{ fontSize: tvType.display }}>🏆</div>
          <div className="font-black" style={{ fontSize: tvType.title, color: WP.primary }}>{winner?.name} {t('tv.wins', 'gewinnt!')}</div>
        </motion.div>
        <TVScoreboard party={gameState?.partyNight} players={roster.map((r) => ({ ...r, status: 'waiting' }))} sort="score" />
      </div>
    );
  }

  return (
    <div className="relative h-screen flex flex-col overflow-hidden" style={{ background: WP.bg, color: WP.text }}>
      {/* soft brand wash (static, low blur) */}
      <div className="absolute -top-24 -left-24 w-[34rem] h-[34rem] rounded-full blur-[90px] pointer-events-none" style={{ background: 'rgba(223,142,255,0.10)' }} />
      <div className="absolute -bottom-24 -right-24 w-[34rem] h-[34rem] rounded-full blur-[90px] pointer-events-none" style={{ background: 'rgba(143,245,255,0.08)' }} />

      {/* Wordmark */}
      <div className="relative flex items-center justify-center gap-3 pt-[clamp(1rem,2vh,2rem)]">
        <span style={{ fontSize: tvType.label }}>👆</span>
        <span className="font-black tracking-[0.15em]" style={{ fontSize: tvType.label, color: WP.primary }}>{t('games.wordpress.title')}</span>
      </div>

      {/* 3-zone broadcast grid */}
      <div className="relative flex-1 grid grid-cols-[minmax(260px,1fr)_2.2fr_minmax(280px,1fr)] gap-[clamp(1rem,2vw,2.5rem)] p-[clamp(1.25rem,2.4vw,3rem)] min-h-0">
        {/* LEFT — round + mode */}
        <div className={`${tvPanel} flex flex-col items-center justify-center gap-8 p-[clamp(1rem,1.8vw,2rem)] text-center`}>
          <div>
            <span className="uppercase tracking-[0.25em] font-bold" style={{ fontSize: tvType.micro, color: WP.dim }}>{t('tv.round', 'Runde')}</span>
            <div className="font-black tabular-nums leading-none" style={{ fontSize: tvType.display, color: WP.text }}>{round}<span style={{ fontSize: tvType.body, color: WP.dim }}>/{totalRounds}</span></div>
          </div>
          <span className="px-5 py-2 rounded-full font-black uppercase tracking-wider" style={{ fontSize: tvType.micro, color: WP.secondary, background: `${WP.secondary}1a`, border: `1.5px solid ${WP.secondary}55` }}>
            {modeLabel(mode, t)}
          </span>
        </div>

        {/* CENTER — HERO word */}
        <div className="flex flex-col items-center justify-center gap-10 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${wordIndex}-${word}`}
              initial={{ opacity: 0, scale: 0.7, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.14 } }}
              transition={spring.game}
              className="font-black text-center leading-none px-4 max-w-[18ch] break-words"
              style={{ fontSize: tvType.hero, color: wordColor, ...(mode === 'stroop' ? { background: '#eee9da', padding: '24px 40px', borderRadius: 24, WebkitTextStroke: '1px rgba(0,0,0,.25)' } : {}) }}
            >
              {word || '…'}
            </motion.div>
          </AnimatePresence>

          <p className="max-w-[32ch] text-center font-bold leading-snug px-4"
            style={{ fontSize: tvType.body, color: WP.secondary }}>
            {rule}
          </p>

          {/* progress bar — scaleX (compositor) */}
          <div className="h-3 rounded-full overflow-hidden" style={{ width: 'min(44vw,560px)', background: 'rgba(255,255,255,0.08)' }}>
            <motion.div className="h-full w-full rounded-full origin-left"
              style={{ background: `linear-gradient(90deg, ${WP.primary}, ${WP.secondary})` }}
              animate={{ scaleX: progress }} transition={{ duration: 0.3, ease: ease.out }} />
          </div>
          <span className="tabular-nums font-mono" style={{ fontSize: tvType.micro, color: WP.dim }}>{Math.min(wordIndex, wordsPerTurn)} / {wordsPerTurn}</span>
        </div>

        {/* RIGHT — active player + live combo/score (the unmistakable focal chip) */}
        <motion.div layout transition={spring.soft}
          className={`${tvPanel} flex flex-col items-center justify-center gap-5 p-[clamp(1rem,1.8vw,2rem)] text-center`}
          style={tvActiveRing(WP.primary)}>
          <span className="uppercase tracking-[0.25em] font-bold" style={{ fontSize: tvType.micro, color: WP.dim }}>{t('tv.nowPlaying', 'Jetzt dran')}</span>
          <AnimatePresence mode="wait">
            <motion.div key={active?.name}
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={spring.bouncy}
              className="flex flex-col items-center gap-5">
              <div className="rounded-full flex items-center justify-center font-black text-white"
                style={{ width: 'clamp(4.5rem,7vw,8rem)', height: 'clamp(4.5rem,7vw,8rem)', fontSize: tvType.title, background: WP.primary, ...tvActiveRing(WP.primary) }}>
                {active?.name?.slice(0, 1).toUpperCase()}
              </div>
              <div className="font-black leading-tight max-w-[12ch]" style={{ fontSize: tvType.title, color: WP.text }}>{active?.name}</div>
            </motion.div>
          </AnimatePresence>

          {/* live score — animates */}
          <motion.div key={activeScore} initial={{ scale: 1.22 }} animate={{ scale: 1 }} transition={spring.bouncy}
            className="font-black tabular-nums leading-none" style={{ fontSize: tvType.display, color: WP.secondary }}>
            {activeScore}
          </motion.div>

          {/* combo flame */}
          <AnimatePresence>
            {combo > 0 && (
              <motion.div key="combo" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={spring.bouncy}
                className="flex items-center gap-2 px-5 py-2 rounded-full font-black"
                style={{ fontSize: tvType.body, color: WP.accent, background: `${WP.accent}1f`, border: `1.5px solid ${WP.accent}66` }}>
                <motion.span animate={ambient ? { scale: [1, 1.25, 1] } : {}} transition={{ duration: 0.6, repeat: Infinity, ease: ease.inOut }}>🔥</motion.span>
                {combo}x {t('games.wordpress.comboLabel', 'COMBO')}
              </motion.div>
            )}
          </AnimatePresence>

          {accuracy !== null && (
            <span className="tabular-nums font-mono" style={{ fontSize: tvType.micro, color: WP.dim }}>
              {accuracy}% {t('tv.wordpress.accuracy', 'Treffer')}
            </span>
          )}
        </motion.div>
      </div>

      {/* BOTTOM — whole-party scoreboard strip */}
      <div className="relative px-[clamp(1.25rem,2.4vw,3rem)] pb-[clamp(1rem,2vh,2rem)]">
        <TVScoreboard party={gameState?.partyNight} players={roster} activeId={String(currentPlayerIndex)} sort="score" />
      </div>
    </div>
  );
}
