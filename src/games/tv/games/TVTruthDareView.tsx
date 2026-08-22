import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Heart, Flame } from 'lucide-react';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { spring, blissBloom } from '@/lib/motion';
import { tvPanel, tvType, tvActiveRing } from '../tv-tokens';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';

/**
 * TVTruthDareView — big-screen view for Truth or Dare.
 *
 * The TV is the richer shared canvas (more than the phones):
 *   ┌─────────────┬───────────────────────┬─────────────┐
 *   │ ACTIVE      │  HERO: spin / choice /│  CHOICE     │
 *   │ player +    │  question / dare +    │  badge +    │
 *   │ "ist dran"  │  timer / vote tally   │  round      │
 *   ├─────────────┴───────────────────────┴─────────────┤
 *   │ SCOREBOARD — the FULL party, turn order, W/P count │
 *   └───────────────────────────────────────────────────┘
 *
 * Secrets kept off the TV: the active player's typed truth answer is never
 * broadcast, and individual vote choices stay hidden — only the aggregate
 * yes/no tally appears, and only during the vote phase.
 *
 * Data arrives via the host's `tv-state` broadcast (see TruthDareGame).
 */
const TD = {
  truth: '#df8eff',
  truthDim: '#d779ff',
  dare: '#ff6b98',
  text: '#f1f3fc',
  dim: '#a8abb3',
  bg: '#0a0e14',
  yes: '#10b981',
  no: '#ef4444',
};

interface TVPlayer {
  id: string;
  name: string;
  color: string;
  avatar: string;
  score: number;
  truthCount: number;
  dareCount: number;
}

/** Map the broadcast roster to the shared scoreboard, in turn order. */
function toRoster(players: TVPlayer[], t: (k: string, o?: any) => string): TVScorePlayer[] {
  return players.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    score: p.score,
    avatar: p.avatar,
    subtitle: t('tv.truthdare.wpCount', {
      w: p.truthCount,
      p: p.dareCount,
      defaultValue: '{{w}}× W · {{p}}× P',
    }),
  }));
}

export default function TVTruthDareView({ gameState }: { gameState: any }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();

  const phase: string = gameState?.phase || 'spin';
  const players: TVPlayer[] = gameState?.players || [];
  const activeIdx: number = gameState?.activeIdx ?? 0;
  const currentRound: number = gameState?.currentRound ?? 1;
  const totalRounds: number = gameState?.totalRounds ?? 0;
  const choiceType: 'truth' | 'dare' | null = gameState?.choiceType ?? null;
  const task: string = gameState?.task || '';
  const timeLeft: number = gameState?.timeLeft ?? 0;
  const maxTime: number = gameState?.maxTime ?? 60;
  const voteTally = (gameState?.voteTally as { yes: number; no: number }) || { yes: 0, no: 0 };

  const active = players[activeIdx];
  const isTruth = choiceType === 'truth';
  const tone = isTruth ? TD.truth : TD.dare;

  // Dare countdown only matters while a dare is being revealed.
  const showTimer = phase === 'reveal' && choiceType === 'dare' && maxTime > 0;
  const timerProgress = Math.max(0, Math.min(1, timeLeft / maxTime));
  const urgent = showTimer && timeLeft <= 10;

  const totalVotes = voteTally.yes + voteTally.no;
  const yesPct = totalVotes > 0 ? voteTally.yes / totalVotes : 0;
  const noPct = totalVotes > 0 ? voteTally.no / totalVotes : 0;

  // --- GAME OVER ---
  if (phase === 'gameOver') {
    const winner = [...players].sort((a, b) => b.score - a.score)[0];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-12" style={{ background: TD.bg, color: TD.text }}>
        <motion.div variants={blissBloom} initial="initial" animate="animate" className="text-center">
          <div style={{ fontSize: tvType.display }}>🏆</div>
          <div className="font-black" style={{ fontSize: tvType.title, color: TD.truth }}>
            {winner?.name} {t('tv.wins', 'gewinnt!')}
          </div>
        </motion.div>
        <div className="w-full max-w-[min(72vw,860px)]">
          <TVScoreboard party={gameState?.partyNight} players={toRoster(players, t)} sort="score" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ background: TD.bg, color: TD.text }}>
      {/* soft brand wash (static, low blur) */}
      <div className="absolute -top-24 -left-24 w-[34rem] h-[34rem] rounded-full blur-[100px] pointer-events-none" style={{ background: 'rgba(223,142,255,0.10)' }} />
      <div className="absolute -bottom-24 -right-24 w-[34rem] h-[34rem] rounded-full blur-[100px] pointer-events-none" style={{ background: 'rgba(255,107,152,0.09)' }} />

      {/* Wordmark */}
      <div className="relative flex items-center justify-center gap-3 pt-[clamp(1rem,2vh,2rem)]">
        <Heart style={{ width: tvType.label, height: tvType.label, color: TD.truth }} />
        <span className="font-black tracking-[0.35em]" style={{ fontSize: tvType.label, color: TD.truth }}>
          {t('tv.truthdare.title', 'WAHRHEIT ODER PFLICHT')}
        </span>
        <Flame style={{ width: tvType.label, height: tvType.label, color: TD.dare }} />
      </div>

      {/* 3-zone broadcast grid */}
      <div className="relative flex-1 grid grid-cols-[minmax(280px,1fr)_2fr_minmax(280px,1fr)] gap-[clamp(1rem,2vw,2.5rem)] p-[clamp(1.25rem,2.4vw,3rem)] min-h-0">
        {/* LEFT — ACTIVE PLAYER (the unmistakable focus) */}
        <div className={`${tvPanel} flex flex-col items-center justify-center gap-6 p-[clamp(1rem,1.8vw,2rem)] text-center`}>
          <span className="uppercase tracking-[0.25em] font-bold" style={{ fontSize: tvType.micro, color: TD.dim }}>
            {t('tv.nowPlaying', 'Jetzt dran')}
          </span>
          <AnimatePresence mode="wait">
            {active && (
              <motion.div key={active.id} variants={blissBloom} initial="initial" animate="animate" exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-5">
                <motion.div className="rounded-full flex items-center justify-center font-black text-white"
                  style={{ width: 'clamp(5rem,8vw,9rem)', height: 'clamp(5rem,8vw,9rem)', fontSize: tvType.title, background: active.color, ...tvActiveRing(active.color) }}
                  animate={ambient ? { scale: [1, 1.04, 1] } : {}}
                  transition={ambient ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : {}}>
                  {active.avatar || active.name?.slice(0, 1).toUpperCase()}
                </motion.div>
                <div className="font-black leading-tight" style={{ fontSize: tvType.title, color: TD.text }}>{active.name}</div>
                <span className="uppercase tracking-[0.2em] font-bold" style={{ fontSize: tvType.micro, color: active.color }}>{t('tv.truthdare.isUp', 'ist dran')}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CENTER — HERO */}
        <div className="flex flex-col items-center justify-center min-h-0">
          <AnimatePresence mode="wait">
            {/* SPIN */}
            {phase === 'spin' && (
              <motion.div key="spin" variants={blissBloom} initial="initial" animate="animate" exit={{ opacity: 0, scale: 0.94 }} className="flex flex-col items-center gap-8 text-center">
                <motion.div
                  style={{ fontSize: tvType.hero }}
                  animate={ambient ? { rotate: [0, 360] } : {}}
                  transition={ambient ? { duration: 2.4, repeat: Infinity, ease: 'linear' } : {}}>
                  🎯
                </motion.div>
                <span className="font-black uppercase tracking-[0.2em] max-w-[16ch] leading-tight" style={{ fontSize: tvType.title, color: TD.text }}>
                  {t('tv.truthdare.whosNext', 'Wer ist als Nächstes dran?')}
                </span>
              </motion.div>
            )}

            {/* CHOICE — pulsing truth/dare icons */}
            {phase === 'choice' && (
              <motion.div key="choice" variants={blissBloom} initial="initial" animate="animate" exit={{ opacity: 0, scale: 0.94 }} className="flex flex-col items-center gap-10 text-center">
                <span className="font-black leading-tight max-w-[18ch]" style={{ fontSize: tvType.title, color: TD.text }}>
                  {active?.name} {t('tv.truthdare.chooses', 'wählt…')}
                </span>
                <div className="flex items-center gap-[clamp(2rem,5vw,5rem)]">
                  <motion.div className="flex flex-col items-center gap-3"
                    animate={ambient ? { scale: [1, 1.12, 1] } : {}}
                    transition={ambient ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : {}}>
                    <Heart style={{ width: tvType.display, height: tvType.display, color: TD.truth, filter: `drop-shadow(0 0 24px ${TD.truth}66)` }} />
                    <span className="font-black uppercase tracking-[0.2em]" style={{ fontSize: tvType.label, color: TD.truth }}>{t('games.truthdare.truth', 'Wahrheit')}</span>
                  </motion.div>
                  <span className="font-black" style={{ fontSize: tvType.title, color: TD.dim }}>/</span>
                  <motion.div className="flex flex-col items-center gap-3"
                    animate={ambient ? { scale: [1, 1.12, 1] } : {}}
                    transition={ambient ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.7 } : {}}>
                    <Flame style={{ width: tvType.display, height: tvType.display, color: TD.dare, filter: `drop-shadow(0 0 24px ${TD.dare}66)` }} />
                    <span className="font-black uppercase tracking-[0.2em]" style={{ fontSize: tvType.label, color: TD.dare }}>{t('games.truthdare.dare', 'Pflicht')}</span>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* REVEAL — big question/dare card (+ dare countdown) */}
            {phase === 'reveal' && (
              <motion.div key="reveal" variants={blissBloom} initial="initial" animate="animate" exit={{ opacity: 0, scale: 0.94 }} className="flex flex-col items-center gap-8 text-center w-full">
                {showTimer && (
                  <div className="flex flex-col items-center gap-3">
                    <motion.div className="font-black tabular-nums leading-none" style={{ fontSize: tvType.display, color: urgent ? '#ff5d73' : TD.dare }}
                      animate={urgent && ambient ? { scale: [1, 1.06, 1] } : {}}
                      transition={urgent && ambient ? { duration: 0.6, repeat: Infinity } : {}}>
                      {timeLeft}
                    </motion.div>
                    <div className="h-3 rounded-full overflow-hidden" style={{ width: 'min(40vw,480px)', background: 'rgba(255,255,255,0.08)' }}>
                      <motion.div className="h-full w-full rounded-full origin-left"
                        style={{ background: urgent ? '#ff5d73' : TD.dare }}
                        animate={{ scaleX: timerProgress }} transition={{ duration: 0.3 }} />
                    </div>
                  </div>
                )}
                <span className="uppercase tracking-[0.3em] font-black" style={{ fontSize: tvType.label, color: tone }}>
                  {isTruth ? t('games.truthdare.truth', 'Wahrheit') : t('games.truthdare.dare', 'Pflicht')}
                </span>
                <div className="rounded-[28px] px-[clamp(1.5rem,3vw,3.5rem)] py-[clamp(1.5rem,3vh,3rem)] max-w-[24ch]"
                  style={{ background: `${tone}14`, border: `2px solid ${tone}55`, boxShadow: `0 0 40px -10px ${tone}66` }}>
                  <p className="font-black leading-tight" style={{ fontSize: tvType.title, color: TD.text }}>{task}</p>
                </div>
              </motion.div>
            )}

            {/* VOTE — the dare + live yes/no tally bars */}
            {phase === 'vote' && (
              <motion.div key="vote" variants={blissBloom} initial="initial" animate="animate" exit={{ opacity: 0, scale: 0.94 }} className="flex flex-col items-center gap-8 text-center w-full">
                <span className="uppercase tracking-[0.3em] font-black" style={{ fontSize: tvType.label, color: TD.dim }}>
                  {t('tv.truthdare.didComplete', 'Geschafft?')}
                </span>
                {task && (
                  <p className="font-bold leading-tight max-w-[24ch]" style={{ fontSize: tvType.body, color: TD.text }}>{task}</p>
                )}
                <div className="flex flex-col gap-4 w-full max-w-[min(42vw,520px)]">
                  <VoteBar label={t('games.truthdare.yes', 'Ja')} count={voteTally.yes} pct={yesPct} color={TD.yes} />
                  <VoteBar label={t('games.truthdare.no', 'Nein')} count={voteTally.no} pct={noPct} color={TD.no} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT — ROUND + CHOICE BADGE */}
        <div className={`${tvPanel} flex flex-col items-center justify-center gap-7 p-[clamp(1rem,1.8vw,2rem)] text-center`}>
          {totalRounds > 0 && (
            <div className="flex flex-col items-center gap-2">
              <span className="uppercase tracking-[0.25em] font-bold" style={{ fontSize: tvType.micro, color: TD.dim }}>
                {t('tv.round', 'Runde')}
              </span>
              <span className="font-black tabular-nums" style={{ fontSize: tvType.title, color: TD.text }}>
                {currentRound}<span style={{ color: TD.dim }}>/{totalRounds}</span>
              </span>
            </div>
          )}
          <AnimatePresence mode="wait">
            {choiceType && (
              <motion.div key={choiceType} variants={blissBloom} initial="initial" animate="animate" exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-3 px-6 py-4 rounded-2xl"
                style={{ background: `${tone}14`, border: `1.5px solid ${tone}66` }}>
                {isTruth
                  ? <Heart style={{ width: tvType.body, height: tvType.body, color: tone }} />
                  : <Flame style={{ width: tvType.body, height: tvType.body, color: tone }} />}
                <span className="font-black uppercase tracking-[0.2em]" style={{ fontSize: tvType.label, color: tone }}>
                  {isTruth ? t('games.truthdare.truth', 'Wahrheit') : t('games.truthdare.dare', 'Pflicht')}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* BOTTOM — shared scoreboard strip (full party, turn order) */}
      <div className="relative px-[clamp(1.25rem,2.4vw,3rem)] pb-[clamp(1rem,2vh,2rem)]">
        <TVScoreboard party={gameState?.partyNight} players={toRoster(players, t)} activeId={active?.id ?? null} sort="order" />
      </div>
    </div>
  );
}

function VoteBar({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-black uppercase tracking-[0.15em] text-left" style={{ fontSize: tvType.label, color, minWidth: '3.5em' }}>{label}</span>
      <div className="flex-1 h-[clamp(1.6rem,2.6vh,2.6rem)] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <motion.div className="h-full w-full rounded-full origin-left"
          style={{ background: color }}
          animate={{ scaleX: pct }} transition={spring.soft} />
      </div>
      <span className="font-black tabular-nums text-right" style={{ fontSize: tvType.body, color: '#f1f3fc', minWidth: '1.5em' }}>{count}</span>
    </div>
  );
}
