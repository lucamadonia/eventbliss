import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';

interface Props {
  gameState: { game: string; phase: string; [key: string]: unknown };
  drawing?: unknown[];
}

const GAME_NAMES: Record<string, string> = {
  taboo: 'TABOO',
  category: 'KATEGORIE',
  impostor: 'HOCHSTAPLER',
  whoami: 'WER BIN ICH?',
  truthdare: 'WAHRHEIT ODER PFLICHT',
  emojiguess: 'EMOJI RATEN',
  wordpress: 'DRÜCK DAS WORT',
  findit: 'WO IST WAS?',
};

function extractTVState(gs: any) {
  const players = gs.players || [];
  const currentIdx = gs.currentPlayerIndex ?? gs.activeIdx ?? gs.currentPlayerIdx ?? null;
  return {
    gameName: gs.game || '',
    phase: gs.phase || '',
    round: gs.currentRound || gs.round || 0,
    totalRounds: gs.totalRounds || gs.total || 0,
    players,
    currentPlayer: currentIdx !== null && players[currentIdx] ? players[currentIdx] : null,
    currentPlayerIndex: currentIdx,
    teams: gs.teams || null,
    activeTeamIdx: gs.activeTeamIdx ?? null,
    explainer: gs.explainer || null,
    category: gs.category || gs.currentCategory || '',
    task: gs.task || gs.currentTask || gs.currentWord || '',
    statement: gs.statement || gs.question || '',
    emojis: gs.emojis || '',
    answer: gs.answer || '',
    choiceType: gs.choiceType || null,
  };
}

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
};

export default function TVSmartFallback({ gameState }: Props) {
  const tv = useMemo(() => extractTVState(gameState), [gameState]);
  const displayName = GAME_NAMES[tv.gameName] || tv.gameName.toUpperCase();
  const hasScores = tv.players.some((p: any) => typeof p.score === 'number');
  const sortedPlayers = useMemo(
    () => hasScores ? [...tv.players].sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0)) : tv.players,
    [tv.players, hasScores],
  );

  // Phase overlay
  const [phaseFlash, setPhaseFlash] = useState('');
  const [prevPhase, setPrevPhase] = useState(tv.phase);
  useEffect(() => {
    if (tv.phase !== prevPhase) {
      setPrevPhase(tv.phase);
      if (tv.phase === 'roundEnd') setPhaseFlash('RUNDE VORBEI!');
      else if (tv.phase === 'gameOver') setPhaseFlash('SPIELENDE!');
      else setPhaseFlash('');
    }
  }, [tv.phase, prevPhase]);
  useEffect(() => {
    if (!phaseFlash) return;
    const t = setTimeout(() => setPhaseFlash(''), 2200);
    return () => clearTimeout(t);
  }, [phaseFlash]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden font-game">

      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-10 py-6 relative z-10">
        <h1
          className="text-3xl font-black italic"
          style={{
            background: 'linear-gradient(135deg, #df8eff 0%, #8ff5ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 18px rgba(223,142,255,0.4))',
          }}
        >
          {displayName}
        </h1>

        {tv.round > 0 && (
          <motion.div
            key={tv.round}
            className="px-5 py-2 rounded-full"
            style={glass}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <span className="text-xl font-bold text-[#f1f3fc]" style={{ fontVariantNumeric: 'tabular-nums' }}>
              RUNDE {tv.round}{tv.totalRounds ? `/${tv.totalRounds}` : ''}
            </span>
          </motion.div>
        )}

        <motion.div
          key={tv.phase}
          className="px-4 py-2 rounded-full"
          style={{ ...glass, borderColor: 'rgba(143,245,255,0.2)' }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <span className="text-xl font-semibold text-[#8ff5ff]">{tv.phase.toUpperCase()}</span>
        </motion.div>
      </div>

      {/* ── Center Area ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-10 relative z-10">
        <AnimatePresence mode="wait">

          {/* Teams display (taboo-style) */}
          {tv.teams ? (
            <motion.div key="teams" className="flex gap-10 items-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {(tv.teams as any[]).map((team: any, i: number) => {
                const isActive = i === tv.activeTeamIdx;
                return (
                  <motion.div
                    key={i}
                    className="flex flex-col items-center gap-4 px-10 py-8 rounded-3xl"
                    style={{
                      ...glass,
                      ...(isActive ? { boxShadow: '0 0 40px rgba(223,142,255,0.3)', borderColor: 'rgba(223,142,255,0.3)' } : {}),
                    }}
                    animate={isActive ? { scale: [1, 1.03, 1] } : {}}
                    transition={isActive ? { repeat: Infinity, duration: 2, ease: 'easeInOut' } : {}}
                  >
                    <span className="text-3xl font-black text-[#f1f3fc]">{team.name || `Team ${i + 1}`}</span>
                    <span className="text-6xl font-black" style={{ color: isActive ? '#df8eff' : '#a8abb3', fontVariantNumeric: 'tabular-nums' }}>
                      {team.score ?? 0}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : tv.currentPlayer ? (
            /* Current player display */
            <motion.div
              key={`player-${tv.currentPlayerIndex}`}
              className="flex flex-col items-center gap-4"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              {/* Avatar circle */}
              <motion.div
                className="w-32 h-32 rounded-full flex items-center justify-center text-6xl font-black text-white"
                style={{
                  background: `${tv.currentPlayer.color || '#df8eff'}22`,
                  border: `4px solid ${tv.currentPlayer.color || '#df8eff'}`,
                  boxShadow: `0 0 30px ${tv.currentPlayer.color || '#df8eff'}44`,
                }}
                animate={{ boxShadow: [
                  `0 0 20px ${tv.currentPlayer.color || '#df8eff'}33`,
                  `0 0 40px ${tv.currentPlayer.color || '#df8eff'}55`,
                  `0 0 20px ${tv.currentPlayer.color || '#df8eff'}33`,
                ]}}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              >
                {(tv.currentPlayer.name || '?')[0].toUpperCase()}
              </motion.div>

              {/* Name */}
              <h2 className="text-5xl font-black" style={{ color: tv.currentPlayer.color || '#df8eff' }}>
                {tv.currentPlayer.name}
              </h2>
              <span className="text-2xl font-medium text-[#a8abb3] tracking-widest">IST DRAN</span>

              {/* Explainer sub-label */}
              {tv.explainer && (
                <span className="text-xl text-[#8ff5ff] mt-2">Erklärt: <b>{tv.explainer}</b></span>
              )}
            </motion.div>
          ) : (
            <motion.div key="idle" className="text-3xl text-[#a8abb3]" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}>
              Warte auf Spieler...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category pill */}
        {tv.category && (
          <motion.div
            className="mt-8 px-8 py-3 rounded-full"
            style={glass}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <span className="text-2xl font-semibold text-[#8ff5ff]">{tv.category}</span>
          </motion.div>
        )}

        {/* Emoji puzzle display */}
        {tv.emojis && (
          <motion.div
            key={tv.emojis}
            className="mt-6 flex flex-col items-center gap-3"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <span className="text-7xl">{tv.emojis}</span>
            {tv.answer && (
              <motion.span
                className="text-3xl font-bold text-[#10b981]"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                {tv.answer}
              </motion.span>
            )}
          </motion.div>
        )}

        {/* Statement / Question display */}
        {tv.statement && !tv.emojis && (
          <motion.div
            key={tv.statement}
            className="mt-6 px-10 py-6 rounded-2xl max-w-4xl text-center"
            style={glass}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 250, damping: 20 }}
          >
            <p className="text-3xl font-bold text-[#f1f3fc]" style={{ textShadow: '0 0 20px rgba(223,142,255,0.2)' }}>
              {tv.statement}
            </p>
          </motion.div>
        )}

        {/* Choice type badge (truth/dare) */}
        {tv.choiceType && (
          <motion.div
            className="mt-4 px-6 py-2 rounded-full"
            style={{ ...glass, borderColor: tv.choiceType === 'truth' ? 'rgba(59,130,246,0.3)' : 'rgba(239,68,68,0.3)' }}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <span className="text-xl font-bold" style={{ color: tv.choiceType === 'truth' ? '#3b82f6' : '#ef4444' }}>
              {tv.choiceType === 'truth' ? '💬 WAHRHEIT' : '🎯 PFLICHT'}
            </span>
          </motion.div>
        )}

        {/* Task / Current word */}
        {tv.task && (
          <motion.p
            className="mt-5 text-xl text-[#f1f3fc]/80 text-center max-w-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {tv.task}
          </motion.p>
        )}
      </div>

      {/* ── Bottom Scoreboard ── */}
      {hasScores && (
        <div className="px-10 pb-8 relative z-10">
          <div className="flex gap-3 justify-center flex-wrap">
            {sortedPlayers.map((p: any, i: number) => {
              const isCurrent = tv.currentPlayer?.name === p.name;
              const clr = p.color || '#df8eff';
              return (
                <motion.div
                  key={p.name || i}
                  className="flex flex-col items-center px-5 py-3 rounded-xl min-w-[100px]"
                  style={{
                    ...glass,
                    borderTop: `3px solid ${clr}`,
                    ...(isCurrent ? { boxShadow: `0 0 20px ${clr}33` } : {}),
                  }}
                  layout
                >
                  <span className="text-xl font-bold text-[#f1f3fc] truncate max-w-[120px]">{p.name}</span>
                  <motion.span
                    className="text-3xl font-black mt-1"
                    style={{ color: clr, fontVariantNumeric: 'tabular-nums' }}
                    key={p.score}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    {p.score ?? 0}
                  </motion.span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Phase Overlay ── */}
      <AnimatePresence>
        {phaseFlash && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.h1
              className="text-8xl font-black italic text-[#f1f3fc]"
              style={{ textShadow: '0 0 60px rgba(223,142,255,0.6), 0 0 120px rgba(143,245,255,0.3)' }}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.15, 1], opacity: [0, 1, 1] }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {phaseFlash}
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
