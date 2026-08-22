import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { tvPanel, tvType, tvActiveRing } from '../tv-tokens';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';

/**
 * TVImpostorView — big-screen view for the Impostor (Hochstapler) game.
 *
 * SECRET DISCIPLINE: `isImpostor` is NEVER shown before the reveal (revealStep 2)
 * or results screen. During discussion/voting the TV shows only who has spoken
 * and the running vote *tally* — never who voted for whom. Data arrives via the
 * host's `impostor` bridge (see ImpostorGame).
 */
const IMP = { red: '#ef4444', amber: '#f59e0b', gold: '#fbbf24', accent: '#df8eff', text: '#f1f3fc', dim: '#a8abb3', bg: '#060810' };

interface Player {
  id?: string;
  name: string;
  isImpostor?: boolean;
  hasSpoken?: boolean;
  votedFor?: string;
  score?: number;
  color?: string;
}

function PlayerCard({ player, index, showVotes, revealImpostor, isTopVoted, ambient }: {
  player: Player; index: number; showVotes?: boolean;
  revealImpostor?: boolean; isTopVoted?: boolean; ambient: boolean;
}) {
  const color = player.color || IMP.accent;
  const voteCount = showVotes ? (player as any).voteCount || 0 : 0;
  const dimmed = !!player.hasSpoken && !showVotes;
  const highlight = isTopVoted || (revealImpostor && player.isImpostor);

  return (
    <motion.div
      className="flex flex-col items-center gap-2 px-5 py-4 rounded-[28px] relative"
      style={{
        background: '#0d0915',
        border: `1.5px solid ${highlight ? IMP.red : 'rgba(255,255,255,0.08)'}`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        ...(highlight ? tvActiveRing(IMP.red) : {}),
      }}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: dimmed ? 0.5 : 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, type: 'spring', damping: 18 }}
    >
      <div className="rounded-full flex items-center justify-center text-white font-bold"
        style={{ width: 'clamp(3rem,4vw,4rem)', height: 'clamp(3rem,4vw,4rem)', fontSize: tvType.body, backgroundColor: color, ...tvActiveRing(color) }}>
        {player.name.charAt(0).toUpperCase()}
      </div>
      <span className="font-bold" style={{ fontSize: tvType.body, color: IMP.text }}>{player.name}</span>
      {dimmed && <span style={{ fontSize: tvType.micro, color: IMP.dim }}>✓</span>}
      <AnimatePresence>
        {showVotes && voteCount > 0 && (
          <motion.div
            className="absolute -top-2 -right-2 rounded-full flex items-center justify-center text-white font-black"
            style={{ width: 'clamp(1.75rem,2.4vw,2.5rem)', height: 'clamp(1.75rem,2.4vw,2.5rem)', fontSize: tvType.micro, background: IMP.red, ...tvActiveRing(IMP.red) }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
          >
            {voteCount}
          </motion.div>
        )}
      </AnimatePresence>
      {/* idle breathing for un-spoken players — gated, opacity only */}
      {!dimmed && !showVotes && ambient && (
        <motion.span className="absolute inset-0 rounded-[28px] pointer-events-none"
          style={{ boxShadow: '0 0 12px rgba(255,255,255,0.06)' }}
          animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }} />
      )}
    </motion.div>
  );
}

export default function TVImpostorView({ gameState }: { gameState: any }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();
  const phase: string = gameState?.phase || 'setup';
  const round: number = gameState?.round || 1;
  const players: Player[] = gameState?.players || [];

  const [revealStep, setRevealStep] = useState(0);

  useEffect(() => {
    if (phase === 'reveal') {
      setRevealStep(1);
      const timer = setTimeout(() => setRevealStep(2), 1500);
      return () => clearTimeout(timer);
    }
    setRevealStep(0);
  }, [phase]);

  const impostor = useMemo(() => players.find(p => p.isImpostor), [players]);

  const playersWithVotes = useMemo(() => {
    const counts: Record<string, number> = {};
    players.forEach(p => { if (p.votedFor) counts[p.votedFor] = (counts[p.votedFor] || 0) + 1; });
    const maxVotes = Math.max(0, ...Object.values(counts));
    return players.map(p => ({
      ...p,
      voteCount: counts[p.id || p.name] || 0,
      isTopVoted: maxVotes > 0 && (counts[p.id || p.name] || 0) === maxVotes,
    }));
  }, [players]);

  const sortedResults = useMemo(
    () => [...players].sort((a, b) => (b.score || 0) - (a.score || 0)),
    [players],
  );

  // Whole-party roster strip. SECRET: pre-reveal we only ever expose hasSpoken
  // (done ✓) vs waiting — never `isImpostor`, never who voted for whom.
  const rosterPreReveal: TVScorePlayer[] = players.map((p) => ({
    id: p.id || p.name,
    name: p.name,
    color: p.color || IMP.accent,
    subtitle: typeof p.score === 'number' ? `${p.score}` : undefined,
    status: p.hasSpoken ? 'done' : 'waiting',
  }));

  const shell = 'h-screen flex flex-col items-center justify-center p-10 relative overflow-hidden';
  const RoundBadge = () => (
    <div className={`${tvPanel} px-5 py-2`}>
      <span className="font-bold uppercase tracking-[0.2em]" style={{ fontSize: tvType.micro, color: IMP.dim }}>
        {t('tv.round', 'Runde')} {round}
      </span>
    </div>
  );
  const RedWash = () => (
    <motion.div className="absolute inset-0 pointer-events-none"
      style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(239,68,68,0.10) 0%, transparent 70%)' }}
      animate={ambient ? { opacity: [0.4, 0.85, 0.4] } : { opacity: 0.6 }}
      transition={ambient ? { repeat: Infinity, duration: 3 } : { duration: 0.3 }} />
  );

  // --- WORD REVEAL ---
  if (phase === 'wordReveal') {
    return (
      <div className={shell} style={{ background: IMP.bg }}>
        <RedWash />
        <motion.h1 className="font-black text-center" style={{ fontSize: tvType.title, color: IMP.text }}
          animate={ambient ? { scale: [1, 1.03, 1] } : { scale: 1 }} transition={ambient ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}>
          👀 {t('tv.impostor.checkPhones', 'SCHAUT AUF EURE HANDYS!')}
        </motion.h1>
        <p className="mt-4" style={{ fontSize: tvType.body, color: IMP.dim }}>{t('tv.impostor.oneWordOneDifferent', 'Ein Wort — aber einer hat ein anderes...')}</p>
      </div>
    );
  }

  // --- DISCUSSION ---
  if (phase === 'discussion') {
    return (
      <div className={shell} style={{ background: IMP.bg }}>
        <div className="absolute top-6 left-8 right-8 flex items-center justify-between z-10">
          <div className="px-5 py-2 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <span className="font-bold uppercase tracking-[0.15em]" style={{ fontSize: tvType.micro, color: IMP.amber }}>{t('tv.impostor.discussion', 'DISKUSSION')}</span>
          </div>
          <RoundBadge />
        </div>
        <h1 className="font-black text-center mb-12 leading-tight" style={{ fontSize: tvType.title, color: IMP.text }}>
          {t('tv.impostor.whoIsImpostor', 'WER IST DER HOCHSTAPLER?')}
        </h1>
        <div className="flex flex-wrap justify-center gap-5 max-w-5xl">
          {players.map((p, i) => (
            <PlayerCard key={p.id || p.name} player={p} index={i} ambient={ambient} />
          ))}
        </div>
        {/* whole party on screen — who has already spoken (✓) */}
        <div className="absolute bottom-6 left-8 right-8">
          <TVScoreboard party={gameState?.partyNight} players={rosterPreReveal} sort="order" />
        </div>
      </div>
    );
  }

  // --- VOTING ---
  if (phase === 'voting') {
    return (
      <div className={shell} style={{ background: IMP.bg }}>
        <div className="absolute top-6 left-8 right-8 flex items-center justify-between z-10">
          <div className="px-5 py-2 rounded-full" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <span className="font-bold uppercase tracking-[0.15em]" style={{ fontSize: tvType.micro, color: IMP.red }}>{t('tv.impostor.voting', 'ABSTIMMUNG')}</span>
          </div>
          <RoundBadge />
        </div>
        <h1 className="font-black mb-10" style={{ fontSize: tvType.title, color: IMP.text }}>
          {t('tv.impostor.whoIsSuspected', 'WER WIRD VERDÄCHTIGT?')}
        </h1>
        <div className="flex flex-wrap justify-center gap-5 max-w-5xl">
          {playersWithVotes.map((p, i) => (
            <PlayerCard key={p.id || p.name} player={p} index={i} showVotes isTopVoted={p.isTopVoted} ambient={ambient} />
          ))}
        </div>
      </div>
    );
  }

  // --- REVEAL COUNTDOWN ---
  if (phase === 'revealCountdown') {
    return (
      <div className={shell} style={{ background: IMP.bg }}>
        <RedWash />
        <motion.h1 className="font-black" style={{ fontSize: tvType.title, color: IMP.text }}
          animate={ambient ? { scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] } : { scale: 1, opacity: 1 }}
          transition={ambient ? { repeat: Infinity, duration: 1.2 } : { duration: 0.3 }}>
          {t('tv.impostor.revealIn', 'ENTHÜLLUNG IN...')}
        </motion.h1>
      </div>
    );
  }

  // --- REVEAL (2-step) ---
  if (phase === 'reveal') {
    return (
      <div className={shell} style={{ background: IMP.bg }}>
        <RedWash />
        <AnimatePresence mode="wait">
          {revealStep === 1 && (
            <motion.h1 key="step1" className="font-black" style={{ fontSize: tvType.title, color: IMP.text }}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: [0.8, 1.05, 1] }}
              exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.6 }}>
              {t('tv.impostor.theImpostorIs', 'DER HOCHSTAPLER IST...')}
            </motion.h1>
          )}
          {revealStep === 2 && impostor && (
            <motion.div key="step2" className="flex flex-col items-center gap-6">
              <div className="relative flex items-center justify-center" style={{ width: 'clamp(7rem,12vw,11rem)', height: 'clamp(7rem,12vw,11rem)' }}>
                {ambient && (
                  <motion.span className="absolute inset-0 rounded-full pointer-events-none" style={{ border: `2px solid ${IMP.red}` }}
                    animate={{ scale: [1, 1.4], opacity: [0.6, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut' }} />
                )}
                <motion.div className="rounded-full flex items-center justify-center text-white font-black"
                  style={{
                    width: 'clamp(6rem,10vw,9rem)', height: 'clamp(6rem,10vw,9rem)', fontSize: tvType.display,
                    backgroundColor: impostor.color || IMP.red, ...tvActiveRing(IMP.red),
                  }}
                  initial={{ scale: 0 }} animate={{ scale: [0, 1.25, 1] }}
                  transition={{ type: 'spring', damping: 9, stiffness: 120 }}>
                  {impostor.name.charAt(0).toUpperCase()}
                </motion.div>
              </div>
              <motion.h1 className="font-black" style={{ fontSize: tvType.hero, color: IMP.red, textShadow: `0 0 60px ${IMP.red}66` }}
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                transition={{ type: 'spring', damping: 9, stiffness: 120, delay: 0.15 }}>
                {impostor.name}
              </motion.h1>
              <motion.span className="font-black uppercase tracking-[0.25em] px-5 py-2 rounded-full"
                style={{ fontSize: tvType.label, color: IMP.red, background: `${IMP.red}1a`, border: `1px solid ${IMP.red}55` }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                {t('tv.impostor.label', 'HOCHSTAPLER')}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- BONUS GUESS ---
  if (phase === 'bonusGuess') {
    return (
      <div className={shell} style={{ background: IMP.bg }}>
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(245,158,11,0.10) 0%, transparent 70%)' }}
          animate={ambient ? { opacity: [0.4, 0.8, 0.4] } : { opacity: 0.6 }} transition={ambient ? { repeat: Infinity, duration: 2.5 } : { duration: 0.3 }} />
        <motion.h1 className="font-black text-center px-8 leading-relaxed" style={{ fontSize: tvType.title, color: IMP.text }}
          animate={ambient ? { scale: [1, 1.02, 1] } : { scale: 1 }} transition={ambient ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}>
          {t('tv.impostor.canImpostorGuess', 'KANN DER HOCHSTAPLER DAS WORT ERRATEN?')}
        </motion.h1>
      </div>
    );
  }

  // --- RESULTS ---
  if (phase === 'results') {
    return (
      <div className={shell} style={{ background: IMP.bg }}>
        <h2 className="font-black mb-8" style={{ fontSize: tvType.title, color: IMP.text }}>{t('tv.impostor.results', 'ERGEBNIS')}</h2>
        <div className="flex flex-col gap-3 w-full max-w-xl">
          {sortedResults.map((p, i) => (
            <motion.div key={p.id || p.name}
              className={`${tvPanel} flex items-center gap-4 px-6 py-4`}
              style={{
                border: `1.5px solid ${i === 0 ? IMP.gold : 'rgba(255,255,255,0.08)'}`,
                ...(i === 0 ? tvActiveRing(IMP.gold) : {}),
              }}
              initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1, type: 'spring' }}>
              <span className="font-black" style={{ fontSize: tvType.body, color: i === 0 ? IMP.gold : IMP.dim, minWidth: '2.5rem' }}>
                {i === 0 ? '👑' : `#${i + 1}`}
              </span>
              <div className="rounded-full flex items-center justify-center text-white font-bold"
                style={{ width: 'clamp(2.25rem,3vw,3rem)', height: 'clamp(2.25rem,3vw,3rem)', fontSize: tvType.body, backgroundColor: p.color || IMP.accent }}>
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-bold flex-1" style={{ fontSize: tvType.body, color: IMP.text }}>{p.name}</span>
              {p.isImpostor && <span className="font-bold uppercase tracking-[0.12em]" style={{ fontSize: tvType.micro, color: IMP.red }}>{t('tv.impostor.label', 'HOCHSTAPLER')}</span>}
              <span className="font-black" style={{ fontSize: tvType.body, color: i === 0 ? IMP.gold : IMP.accent }}>{p.score || 0}</span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // --- FALLBACK (setup / unknown) ---
  return (
    <div className={shell} style={{ background: IMP.bg }}>
      <motion.div className="flex items-center gap-3"
        animate={ambient ? { opacity: [0.3, 1, 0.3] } : { opacity: 0.7 }} transition={ambient ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}>
        <div className="w-3 h-3 rounded-full" style={{ background: IMP.accent }} />
        <span style={{ fontSize: tvType.body, color: IMP.dim }}>{t('tv.impostor.preparing', 'Spiel wird vorbereitet...')}</span>
      </motion.div>
    </div>
  );
}
