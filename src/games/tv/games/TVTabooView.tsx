import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  gameState: { game: string; phase: string; [key: string]: unknown };
  drawing?: unknown[];
}

export default function TVTabooView({ gameState }: Props) {
  const phase = (gameState?.phase || 'playing') as string;
  const currentRound = (gameState?.currentRound || 1) as number;
  const teams = (gameState?.teams || []) as any[];
  const activeTeamIdx = (gameState?.activeTeamIdx ?? 0) as number;
  const explainer = gameState?.explainer as { name?: string; color?: string; avatar?: string } | undefined;

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-10 relative overflow-hidden">
      {/* Round counter */}
      <div className="flex justify-center pt-4 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRound}
            className="px-8 py-3 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <span className="text-2xl font-bold text-[#a8abb3] tracking-widest">
              RUNDE {currentRound}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Center: Team Battle */}
      <div className="flex-1 flex items-center justify-center w-full max-w-6xl gap-6 z-10">
        {teams.length >= 2 ? (
          <>
            {/* Team A */}
            <TeamCard team={teams[0]} isActive={activeTeamIdx === 0} side="left" />

            {/* VS Divider */}
            <motion.div
              className="flex-shrink-0 flex items-center justify-center"
              animate={{ rotateZ: [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            >
              <span
                className="text-5xl font-black italic select-none"
                style={{
                  background: 'linear-gradient(135deg, #df8eff, #8ff5ff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 20px rgba(223,142,255,0.4))',
                }}
              >
                VS
              </span>
            </motion.div>

            {/* Team B */}
            <TeamCard team={teams[1]} isActive={activeTeamIdx === 1} side="right" />
          </>
        ) : (
          <span className="text-2xl text-[#a8abb3]">Warte auf Teams...</span>
        )}
      </div>

      {/* Bottom: Explainer */}
      <div className="pb-6 z-10">
        <AnimatePresence>
          {explainer?.name && (
            <motion.div
              className="px-10 py-4 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: 'spring', damping: 18 }}
            >
              <span className="text-2xl font-bold text-[#f1f3fc]">
                {'🎤 '}
                <span style={{ color: explainer.color || '#df8eff' }}>{explainer.name}</span>
                {' ERKLÄRT'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Team Card ── */

function TeamCard({ team, isActive, side }: { team: any; isActive: boolean; side: 'left' | 'right' }) {
  const name = team?.name || 'Team';
  const score = team?.score ?? 0;
  const players = team?.players || [];
  const color = team?.color || (side === 'left' ? '#df8eff' : '#8ff5ff');

  const glowColor = isActive ? color : 'transparent';

  return (
    <motion.div
      className="flex-1 max-w-md rounded-3xl p-8 flex flex-col items-center justify-center gap-4 relative"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
        border: `2px solid ${isActive ? color + '55' : 'rgba(255,255,255,0.08)'}`,
      }}
      initial={{ x: side === 'left' ? -100 : 100, opacity: 0 }}
      animate={{
        x: 0,
        opacity: isActive ? 1 : 0.6,
        scale: isActive ? 1.02 : 1,
        boxShadow: isActive
          ? [
              `0 0 30px ${glowColor}22, 0 0 60px ${glowColor}11`,
              `0 0 50px ${glowColor}33, 0 0 100px ${glowColor}18`,
              `0 0 30px ${glowColor}22, 0 0 60px ${glowColor}11`,
            ]
          : `0 0 0px transparent`,
      }}
      transition={{
        x: { type: 'spring', damping: 18, delay: side === 'left' ? 0 : 0.1 },
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 },
        boxShadow: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' },
      }}
    >
      {/* Team name */}
      <h2 className="text-3xl font-black text-[#f1f3fc] tracking-wide">{name}</h2>

      {/* Score */}
      <motion.span
        key={score}
        className="text-8xl font-black leading-none"
        style={{
          color: isActive ? color : '#f1f3fc',
          textShadow: isActive ? `0 0 30px ${color}66` : 'none',
        }}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 10, stiffness: 300 }}
      >
        {score}
      </motion.span>

      {/* Players */}
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {players.length > 0 ? (
          players.slice(0, 6).map((p: any, i: number) => (
            <span key={i} className="text-lg text-[#a8abb3] font-medium">
              {p?.name || p}
              {i < Math.min(players.length, 6) - 1 ? ',' : ''}
            </span>
          ))
        ) : (
          <span className="text-lg text-[#a8abb3]">{players.length} Spieler</span>
        )}
      </div>
    </motion.div>
  );
}
