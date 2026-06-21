import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { tvPanel, tvPanelRaised, tvType, tvActiveRing } from '../tv-tokens';

/**
 * TVTabooView — big-screen view for Taboo (two-team explain-the-word battle).
 *
 * The HERO is the two-team scoreboard battle; the active team glows. The TV
 * NEVER shows the current card or its forbidden words — those stay on the
 * explainer's phone. On phase==='turnSummary' it flashes the turn's tally.
 *
 * Data via useTVGameBridge('taboo', …): { phase, currentRound, totalRounds,
 * teams[{name,color,score,players}], activeTeamIdx, explainer, timeLeft,
 * turnCorrect, turnTaboo, turnSkipped }.
 */
const TB = { purpleHex: '#df8eff', cyanHex: '#8ff5ff', text: '#f1f3fc', dim: '#a8abb3', bg: '#060810', correct: '#10b981', taboo: '#ff6e84', skip: '#a8abb3' };

/** Team colors arrive as tailwind classes ("bg-[#df8eff]"); pull the hex out. */
function teamHex(team: any, fallback: string): string {
  const raw: string = team?.color || '';
  const m = raw.match(/#([0-9a-fA-F]{6})/);
  return m ? `#${m[1]}` : (raw.startsWith('#') ? raw : fallback);
}

export default function TVTabooView({ gameState }: { gameState: any }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();

  const phase: string = (gameState?.phase || 'playing') as string;
  const currentRound: number = (gameState?.currentRound || 1) as number;
  const totalRounds = gameState?.totalRounds;
  const teams = (gameState?.teams || []) as any[];
  const activeTeamIdx: number = (gameState?.activeTeamIdx ?? 0) as number;
  const explainer = gameState?.explainer as { name?: string; color?: string } | undefined;
  const explainerName = explainer?.name || '';
  const timeLeft = gameState?.timeLeft;
  const turnCorrect: number = gameState?.turnCorrect ?? 0;
  const turnTaboo: number = gameState?.turnTaboo ?? 0;
  const turnSkipped: number = gameState?.turnSkipped ?? 0;

  return (
    <div className="h-screen flex flex-col items-center justify-between p-[clamp(1.25rem,2.4vw,3rem)] relative overflow-hidden" style={{ background: TB.bg, color: TB.text }}>
      {/* Static brand washes (low blur, no animation) */}
      <div className="absolute -top-24 -left-24 w-[34rem] h-[34rem] rounded-full blur-[90px] pointer-events-none" style={{ background: 'rgba(223,142,255,0.09)' }} />
      <div className="absolute -bottom-24 -right-24 w-[34rem] h-[34rem] rounded-full blur-[90px] pointer-events-none" style={{ background: 'rgba(143,245,255,0.08)' }} />

      {/* Top rail: round + timer */}
      <div className="relative flex items-center gap-4 z-10">
        <span style={{ fontSize: tvType.label }}>🤐</span>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRound}
            className={`${tvPanel} px-7 py-2.5`}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <span className="font-bold tracking-[0.18em] tabular-nums" style={{ fontSize: tvType.micro, color: TB.dim }}>
              {t('tv.round', 'Runde')} {currentRound}{totalRounds ? `/${totalRounds}` : ''}
            </span>
          </motion.div>
        </AnimatePresence>
        {timeLeft !== undefined && phase === 'playing' && (
          <motion.div
            className={`${tvPanel} px-6 py-2 font-mono font-black tabular-nums`}
            style={{ fontSize: tvType.title, color: Number(timeLeft) <= 10 ? TB.taboo : TB.text }}
            animate={ambient && Number(timeLeft) <= 5 ? { scale: [1, 1.12, 1] } : { scale: 1 }}
            transition={ambient && Number(timeLeft) <= 5 ? { repeat: Infinity, duration: 0.4 } : { duration: 0.2 }}
          >
            {timeLeft}s
          </motion.div>
        )}
      </div>

      {/* Center: turn summary OR team battle */}
      <div className="relative flex-1 flex items-center justify-center w-full max-w-6xl gap-6 z-10 min-h-0">
        <AnimatePresence mode="wait">
          {phase === 'turnSummary' ? (
            <motion.div
              key="summary"
              className={`${tvPanelRaised} flex flex-col items-center gap-8 px-[clamp(2rem,5vw,5rem)] py-[clamp(1.5rem,4vh,4rem)]`}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 16 }}
            >
              <span className="font-black italic" style={{ fontSize: tvType.title, color: TB.purpleHex }}>
                {teams[activeTeamIdx]?.name || t('tv.taboo.turnOver', 'Zug vorbei')}
              </span>
              <div className="flex gap-[clamp(1.5rem,4vw,4rem)]">
                <SummaryStat value={turnCorrect} label={t('tv.taboo.correct', 'Richtig')} color={TB.correct} delay={0.15} />
                <SummaryStat value={turnTaboo} label={t('tv.taboo.taboo', 'Tabu')} color={TB.taboo} delay={0.25} />
                <SummaryStat value={turnSkipped} label={t('tv.taboo.skipped', 'Skip')} color={TB.skip} delay={0.35} />
              </div>
              <span className="font-bold tabular-nums" style={{ fontSize: tvType.body, color: TB.dim }}>
                {t('tv.taboo.points', { points: turnCorrect - turnTaboo, defaultValue: `${turnCorrect - turnTaboo} Punkte` })}
              </span>
            </motion.div>
          ) : teams.length >= 2 ? (
            <motion.div key="battle" className="flex items-center justify-center w-full gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TeamCard team={teams[0]} isActive={activeTeamIdx === 0} side="left" ambient={ambient} explainerName={activeTeamIdx === 0 ? explainerName : ''} />

              {/* VS divider — rotation gated on ambient */}
              <motion.div
                className="flex-shrink-0 flex items-center justify-center"
                animate={ambient ? { rotateZ: [-3, 3, -3] } : { rotateZ: 0 }}
                transition={ambient ? { repeat: Infinity, duration: 4, ease: 'easeInOut' } : { duration: 0.3 }}
              >
                <span className="font-black italic select-none" style={{ fontSize: tvType.display, background: `linear-gradient(135deg, ${TB.purpleHex}, ${TB.cyanHex})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: `drop-shadow(0 0 20px ${TB.purpleHex}66)` }}>
                  VS
                </span>
              </motion.div>

              <TeamCard team={teams[1]} isActive={activeTeamIdx === 1} side="right" ambient={ambient} explainerName={activeTeamIdx === 1 ? explainerName : ''} />
            </motion.div>
          ) : (
            <span style={{ fontSize: tvType.body, color: TB.dim }}>{t('tv.taboo.waiting', 'Warte auf Teams...')}</span>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom: explainer (name only — never the card) */}
      <div className="relative pt-2 z-10">
        <AnimatePresence>
          {explainer?.name && phase === 'playing' && (
            <motion.div
              className={`${tvPanel} px-10 py-3.5`}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: 'spring', damping: 18 }}
            >
              <span className="font-bold" style={{ fontSize: tvType.body, color: TB.text }}>
                {'🎤 '}
                <span style={{ color: teamHex({ color: explainer.color }, TB.purpleHex) }}>{explainer.name}</span>
                {' '}{t('tv.taboo.explains', 'erklärt')}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TeamCard({ team, isActive, side, ambient, explainerName }: { team: any; isActive: boolean; side: 'left' | 'right'; ambient: boolean; explainerName: string }) {
  const { t } = useTranslation();
  const name = team?.name || 'Team';
  const score = team?.score ?? 0;
  const players: any[] = team?.players || [];
  const color = teamHex(team, side === 'left' ? '#df8eff' : '#8ff5ff');

  return (
    <motion.div
      className={`flex-1 max-w-md ${isActive ? tvPanelRaised : tvPanel} p-8 flex flex-col items-center justify-center gap-4 relative`}
      style={isActive ? tvActiveRing(color) : undefined}
      initial={{ x: side === 'left' ? -100 : 100, opacity: 0 }}
      animate={{ x: 0, opacity: isActive ? 1 : 0.6, scale: isActive ? 1.02 : 1 }}
      transition={{ x: { type: 'spring', damping: 18, delay: side === 'left' ? 0 : 0.1 }, opacity: { duration: 0.4 }, scale: { duration: 0.4 } }}
    >
      {/* Active breathing — scale only, gated */}
      {isActive && ambient && (
        <motion.div
          className="absolute inset-0 rounded-[28px] pointer-events-none"
          style={{ boxShadow: `0 0 60px -10px ${color}` }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        />
      )}

      <h2 className="font-black tracking-wide" style={{ fontSize: tvType.title, color: TB.text }}>{name}</h2>

      <motion.span
        key={score}
        className="font-black leading-none tabular-nums"
        style={{ fontSize: tvType.display, color: isActive ? color : TB.text, textShadow: isActive ? `0 0 30px ${color}66` : 'none' }}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 10, stiffness: 300 }}
      >
        {score}
      </motion.span>

      {/* Every team member gets a chip (no truncation) — the current explainer is ringed. */}
      <div className="flex flex-wrap gap-2 justify-center mt-2 max-w-full">
        {players.length > 0 ? (
          players.map((p: any, i: number) => {
            const pname = (typeof p === 'string' ? p : p?.name) || '';
            const isExplainer = isActive && !!explainerName && pname === explainerName;
            return (
              <span
                key={i}
                className="rounded-full px-3 py-1 font-semibold whitespace-nowrap inline-flex items-center gap-1"
                style={{
                  fontSize: tvType.micro,
                  color: isExplainer ? color : TB.dim,
                  background: isExplainer ? `${color}1f` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isExplainer ? color + '66' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                {isExplainer && '🎤'}{pname}
              </span>
            );
          })
        ) : (
          <span style={{ fontSize: tvType.micro, color: TB.dim }}>{t('tv.playersCount', { count: players.length })}</span>
        )}
      </div>
    </motion.div>
  );
}

function SummaryStat({ value, label, color, delay }: { value: number; label: string; color: string; delay: number }) {
  return (
    <motion.div className="flex flex-col items-center" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay, type: 'spring' }}>
      <motion.span className="font-black tabular-nums" style={{ fontSize: tvType.display, color, textShadow: `0 0 28px ${color}88` }}
        initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ delay: delay + 0.1, duration: 0.4 }}>
        {value}
      </motion.span>
      <span className="mt-2 font-bold" style={{ fontSize: tvType.micro, color: '#a8abb3' }}>{label}</span>
    </motion.div>
  );
}
