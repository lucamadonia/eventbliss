import type { PartyNightState } from '../party-types';
interface ViewState {
  partyNight?: PartyNightState;
  players?: (Player)[];
  mode?: string;
  phase?: string;
  selectedName?: string;
  task?: string;
  taskId?: string;
  taskType?: string;
  currentRound?: number;
  rotation?: number;
  round?: number;
  selectedIdx?: number;
  totalRounds?: number;
  voteNo?: number;
  voteYes?: number;
}
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { partyEase } from '@/lib/party-motion';
import TVPlayerAvatar from '../cinema/TVPlayerAvatar';
import { lu } from '../components/tv-lobby-scale';
import { useTranslation } from 'react-i18next';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { tvPanel, tvPanelRaised, tvType } from '../tv-tokens';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';
import { getBottleCardById } from '../../bottlespin/bottlespin-content';

/**
 * TVBottleView — big-screen view for the Bottle-Spin (Flaschendrehen) game.
 *
 * The TV is the stage: the spinning bottle + the ring of players is the HERO.
 * A phase badge (SPINNING / CARD / VOTE) tells the room where they are; in
 * 'fragen' mode a scoreboard strip rides along the bottom; the task card only
 * appears once the bottle has stopped and the card phase begins (hidden until
 * then). Data arrives via the host's `bottlespin` bridge (see BottleSpinGame).
 */
/** Groesse der Spieler-Symbole im Kreis (px, weil der Kreis in px gerechnet ist). */
const WHEEL_AVATAR_PX = 84;
const WHEEL_AVATAR = `${WHEEL_AVATAR_PX}px`;
const BTL = { primary: '#df8eff', secondary: '#8ff5ff', yes: '#10b981', no: '#ef4444', text: '#f1f3fc', dim: '#a8abb3', bg: '#060810' };

interface Player { id?: string; name: string; color?: string; score?: number; avatar?: string }

export default function TVBottleView({ gameState }: { gameState: ViewState }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();
  const reduced = !!useReducedMotion();

  const players: Player[] = gameState?.players || [];
  const rotation = gameState?.rotation || 0;
  const phase: string = gameState?.phase || 'spinning';
  const selectedIdx: number = gameState?.selectedIdx ?? -1;
  const selectedName: string = gameState?.selectedName || (selectedIdx >= 0 ? players[selectedIdx]?.name ?? '' : '');
  const task: string = gameState?.task ? getBottleCardById(gameState?.taskId)?.text ?? gameState.task : '';
  const taskType: string = gameState?.taskType || '';
  const mode: string = gameState?.mode || 'fragen';
  const round = gameState?.currentRound || gameState?.round || 1;
  const total = gameState?.totalRounds || '?';
  const voteYes: number = gameState?.voteYes ?? 0;
  const voteNo: number = gameState?.voteNo ?? 0;

  const count = players.length || 6;
  const radius = 280;
  const containerSize = radius * 2 + 160;
  const isResult = selectedIdx >= 0 && (phase === 'card' || phase === 'vote');

  const phaseBadge =
    phase === 'spinning' ? { label: t('tvCinema.bottle.spinningPill', 'Flasche dreht sich …'), color: BTL.secondary }
    : phase === 'card' ? { label: t('tvCinema.bottle.card', 'Karte'), color: BTL.primary }
    : phase === 'vote' ? { label: t('tvCinema.bottle.vote', 'Abstimmung'), color: BTL.no }
    : null;

  const totalVotes = voteYes + voteNo;
  const yesPct = totalVotes > 0 ? voteYes / totalVotes : 0;

  // Whole party on the bottom strip. Scores only matter in 'fragen' mode; the
  // just-selected player gets the active ring after the bottle stops.
  const showScores = mode === 'fragen';
  const roster: TVScorePlayer[] = players.map((p, i) => ({
    id: p.id || p.name,
    name: p.name,
    color: p.color || `hsl(${(i / count) * 360}, 70%, 60%)`,
    score: showScores ? (p.score ?? 0) : undefined,
  }));
  const selectedId = selectedIdx >= 0 ? (players[selectedIdx]?.id || players[selectedIdx]?.name || null) : null;

  return (
    <div className="h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: BTL.bg, color: BTL.text }}>
      {/* Ambient circular glow (static) */}
      <div className="absolute pointer-events-none" style={{
        width: containerSize + 200, height: containerSize + 200, left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle, rgba(223,142,255,0.05) 0%, transparent 60%)',
      }} />

      {/* Top bar — phase badge + round counter */}
      <div className="absolute top-8 left-8 right-8 flex items-center justify-between z-20">
        {phaseBadge ? (
          <div data-testid="tv-bottle-phase" className="flex items-center gap-3 px-5 py-2 rounded-full" style={{ background: `${phaseBadge.color}1f`, border: `1px solid ${phaseBadge.color}55` }}>
            {phase === 'spinning' && (
              <motion.span aria-hidden className="rounded-full" style={{ width: lu(1.1), height: lu(1.1), background: phaseBadge.color, boxShadow: `0 0 12px ${phaseBadge.color}` }}
                animate={ambient ? { opacity: [0.35, 1, 0.35], scale: [0.85, 1.1, 0.85] } : { opacity: 0.9 }}
                transition={ambient ? { repeat: Infinity, duration: 1.1, ease: 'easeInOut' } : { duration: 0.2 }} />
            )}
            <span className="font-bold" style={{ fontSize: lu(2.4), color: phaseBadge.color }}>{phaseBadge.label}</span>
          </div>
        ) : <span />}
        <div className={`${tvPanel} px-5 py-2`}>
          <span className="font-bold" style={{ fontSize: lu(2.4), color: BTL.dim }}>
            {t('tvCinema.roundOf', 'Runde {{round}} von {{total}}', { round, total })}
          </span>
        </div>
      </div>

      {/* Player circle + bottle HERO — macht bei Karte/Abstimmung dem Rampenlicht Platz */}
      <motion.div
        className="relative"
        style={{ width: containerSize, height: containerSize }}
        animate={isResult ? { x: reduced ? 0 : '-24vw', scale: 0.74 } : { x: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: partyEase.out }}
      >
        {/* Outer decorative rings (static) */}
        <div className="absolute inset-4 rounded-full" style={{ border: '1px solid rgba(223,142,255,0.10)' }} />
        <div className="absolute inset-8 rounded-full" style={{ border: '1px solid rgba(143,245,255,0.06)' }} />

        {/* Player avatars around circle */}
        {players.map((p: Player, i: number) => {
          const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(angle) * radius + containerSize / 2;
          const y = Math.sin(angle) * radius + containerSize / 2;
          const isSelected = i === selectedIdx;
          const color = p.color || `hsl(${(i / count) * 360}, 70%, 60%)`;
          const isWinner = isSelected && isResult;
          return (
            <motion.div
              key={p.id || i}
              className="absolute flex flex-col items-center"
              style={{ left: x - WHEEL_AVATAR_PX / 2, top: y - WHEEL_AVATAR_PX / 2, width: WHEEL_AVATAR_PX }}
              animate={
                isWinner ? { scale: 1.25 }
                : isResult && !isSelected ? { opacity: 0.4, scale: 0.85 }
                : { scale: 1, opacity: 1 }
              }
              transition={{ duration: 0.5, type: 'spring' }}
            >
              <TVPlayerAvatar id={p.id} name={p.name} avatar={p.avatar} color={color} size={WHEEL_AVATAR} active={isWinner} />
              <span
                className="mt-2 whitespace-nowrap text-center font-bold"
                style={{ fontSize: tvType.body, color: isWinner ? '#fff' : BTL.text, opacity: isResult && !isSelected ? 0.6 : 1 }}
              >
                {p.name}
              </span>
            </motion.div>
          );
        })}

        {/* Bottle - center */}
        <motion.div
          className="absolute"
          style={{ left: containerSize / 2 - 24, top: containerSize / 2 - 80, transformOrigin: '24px 80px' }}
          animate={{ rotate: rotation }}
          transition={phase === 'spinning' ? { duration: 3.5, ease: [0.12, 0.8, 0.2, 1] } : { duration: 0 }}
        >
          <svg width="48" height="160" viewBox="0 0 48 160">
            <defs>
              <linearGradient id="bottle-grad-tv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#df8eff" />
                <stop offset="50%" stopColor="#c77aff" />
                <stop offset="100%" stopColor="#8ff5ff" />
              </linearGradient>
              <filter id="bottle-glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <polygon points="24,0 16,18 32,18" fill="#df8eff" filter="url(#bottle-glow)" />
            <rect x="19" y="16" width="10" height="35" rx="5" fill="url(#bottle-grad-tv)" />
            <ellipse cx="24" cy="90" rx="22" ry="55" fill="url(#bottle-grad-tv)" opacity="0.9" />
            <ellipse cx="18" cy="80" rx="6" ry="30" fill="rgba(255,255,255,0.15)" />
          </svg>
        </motion.div>

        {/* Center glow dot — pulse gated on ambient, transform/opacity only */}
        <motion.div
          className="absolute rounded-full"
          style={{
            left: containerSize / 2 - 20, top: containerSize / 2 - 20, width: 40, height: 40,
            background: 'radial-gradient(circle, rgba(223,142,255,0.4) 0%, transparent 70%)',
          }}
          animate={ambient ? { scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] } : { scale: 1, opacity: 0.7 }}
          transition={ambient ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}
        />
      </motion.div>

      {/* Rampenlicht: wer dran ist + Karte — erst wenn die Flasche steht */}
      <AnimatePresence>
        {isResult && selectedName && (
          <motion.div
            data-testid="tv-bottle-spotlight"
            className="absolute right-[5vw] top-1/2 z-10 flex w-[44vw] -translate-y-1/2 flex-col items-start gap-6"
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.25, ease: partyEase.exit } }}
            transition={{ duration: 0.6, ease: partyEase.out, delay: 0.2 }}
          >
            <div className="flex items-center gap-6">
              <motion.div initial={reduced ? { opacity: 0 } : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', duration: 0.6, bounce: 0.4, delay: 0.3 }}>
                <TVPlayerAvatar id={players[selectedIdx]?.id} name={selectedName} avatar={players[selectedIdx]?.avatar}
                  color={players[selectedIdx]?.color || BTL.primary} size="clamp(6rem,11vh,9rem)" active />
              </motion.div>
              <div className="flex min-w-0 flex-col">
                <span className="font-bold" style={{ fontSize: tvType.label, color: BTL.dim }}>
                  {t('tvCinema.bottle.yourTurn', 'Die Flasche zeigt auf')}
                </span>
                <h2 className="break-words font-black italic leading-none" style={{ fontSize: tvType.display, color: '#fff', textShadow: `0 0 60px ${BTL.primary}66`, paddingInlineEnd: '0.15em' }}>
                  {selectedName}
                </h2>
              </div>
            </div>
            {task && (
              <motion.div
                className={`${tvPanelRaised} w-full px-[clamp(1.5rem,3vw,3rem)] py-[clamp(1.25rem,2.5vw,2.5rem)]`}
                initial={reduced ? { opacity: 0 } : { y: 24, opacity: 0, rotateX: -12 }}
                animate={{ y: 0, opacity: 1, rotateX: 0 }}
                transition={{ duration: 0.55, ease: partyEase.out, delay: 0.5 }}
                style={{ transformPerspective: 900 }}
              >
                {taskType && (
                  <span className="mb-3 block font-bold" style={{ fontSize: tvType.label, color: BTL.primary }}>
                    {taskType === 'frage' ? t('tv.bottle.question', 'Frage') : taskType === 'aufgabe' ? t('tv.bottle.task', 'Aufgabe') : taskType}
                  </span>
                )}
                <p className="font-bold leading-snug" style={{ fontSize: tvType.title, color: BTL.text }}>{task}</p>
              </motion.div>
            )}

            {/* Abstimmung: Ja/Nein-Verteilung */}
            {phase === 'vote' && (
              <motion.div className="w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-bold" style={{ fontSize: tvType.label, color: BTL.yes }}>👍 {voteYes}</span>
                  <span className="font-bold" style={{ fontSize: tvType.label, color: BTL.no }}>{voteNo} 👎</span>
                </div>
                <div className="flex h-4 overflow-hidden rounded-full" style={{ background: totalVotes > 0 ? `${BTL.no}55` : 'rgba(255,255,255,0.08)' }}>
                  <motion.div className="h-full origin-left" style={{ width: '100%', background: BTL.yes }}
                    animate={{ scaleX: totalVotes > 0 ? yesPct : 0 }} transition={{ duration: 0.5, ease: partyEase.out }} />
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-party scoreboard strip — every player on screen */}
      {players.length > 0 && (
        <div className="absolute bottom-4 left-0 right-0 px-[clamp(1.25rem,2.4vw,3rem)] z-10">
          <TVScoreboard party={gameState?.partyNight} players={roster} activeId={selectedId} sort={showScores ? 'score' : 'order'} />
        </div>
      )}
    </div>
  );
}
