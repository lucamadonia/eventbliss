import type { PartyNightState } from '../party-types';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Crown } from 'lucide-react';
import { partyEase } from '@/lib/party-motion';
import { tvType } from '../tv-tokens';
import TVPlayerAvatar from '../cinema/TVPlayerAvatar';
import { lu } from '../components/tv-lobby-scale';
import TVBurst from '../cinema/TVBurst';

interface Voter { id?: string; name: string; color?: string; avatar?: string }
interface ViewState {
  partyNight?: PartyNightState;
  category?: string;
  optionA?: string;
  optionB?: string;
  phase?: string;
  percentA?: number;
  percentB?: number;
  round?: number;
  totalRounds?: number;
  votesA?: number;
  votesB?: number;
  options?: string[];
  votersA?: Voter[];
  votersB?: Voter[];
  players?: Voter[];
  /** Wer schon abgestimmt hat — nur WER, nie welche Seite (optional vom Host). */
  votedIds?: string[];
}

const SIDE = { A: '#df8eff', B: '#8ff5ff' } as const;
const DIM = '#a8abb3';

/**
 * TVThisOrThatView — „Dies oder Das“ auf dem Fernseher.
 *
 * Zwei Haelften, die sich zu jeder Runde von aussen hereinschieben. Waehrend
 * der Abstimmung bleiben die Seiten verdeckt (die Bruecke liefert dann keine
 * Waehler); bei der Aufloesung steigt der Balken von unten, die Prozentzahl
 * steht in einer festen Zone unter dem Begriff — sie kann ihn nie ueberdecken.
 */
function Half({ side, option, percent, votes, voters, showResults, winner, loser, round }: {
  side: 'A' | 'B'; option: string; percent: number; votes: number; voters: Voter[];
  showResults: boolean; winner: boolean; loser: boolean; round: number;
}) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const color = SIDE[side];
  const from = side === 'A' ? -1 : 1;
  return (
    <motion.div
      key={`${side}-${round}`}
      data-testid={`tv-tot-side-${side}`}
      data-winner={String(winner)}
      className="relative flex flex-1 flex-col items-center overflow-hidden"
      style={{ background: `linear-gradient(${side === 'A' ? 135 : 225}deg, ${color}${loser ? '08' : '1f'}, ${color}05)` }}
      initial={reduced ? { opacity: 0 } : { x: `${from * 30}vw`, opacity: 0 }}
      animate={{ x: 0, opacity: loser ? 0.55 : 1 }}
      transition={{ duration: 0.7, ease: partyEase.out }}
    >
      <div className="absolute inset-y-0 w-[2px]" style={{ [side === 'A' ? 'right' : 'left']: 0, background: `linear-gradient(to bottom, transparent, ${color}55, transparent)` }} />

      {/* Ergebnis: Fuellung von unten — nur Flaeche, kein Text darin. */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            className="absolute inset-x-0 bottom-0 origin-bottom"
            style={{ height: '100%', background: `linear-gradient(to top, ${color}${winner ? '55' : '22'}, ${color}00 ${Math.max(percent, 8)}%)` }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ duration: 1.1, ease: partyEase.out }}
          />
        )}
      </AnimatePresence>

      {/* Begriff — obere Zone */}
      <div className="relative flex w-full flex-1 flex-col items-center justify-center px-[4vw]" style={{ paddingTop: '14vh' }}>
        <AnimatePresence>
          {winner && (
            <motion.span
       className="mb-4 inline-flex items-center gap-2 rounded-full px-5 py-2 font-black"
              style={{ fontSize: tvType.label, color: '#060810', background: color }}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.4, delay: 1.1 }}
            >
              <Crown aria-hidden strokeWidth={2.6} style={{ width: '1.1em', height: '1.1em' }} />
              {t('tvCinema.thisOrThat.majority', 'Mehrheit')}
            </motion.span>
          )}
        </AnimatePresence>
        <motion.h2
          className="max-w-[38vw] text-center font-black italic leading-[1.05]"
          style={{ fontSize: tvType.hero, color, textShadow: `0 0 ${winner ? 60 : 24}px ${color}${winner ? '99' : '44'}` }}
          animate={winner && !reduced ? { scale: [1, 1.06, 1] } : { scale: 1 }}
          transition={{ duration: 0.8, ease: partyEase.out, delay: 1.1 }}
        >
          {option}
        </motion.h2>
        {showResults && voters.length > 0 && (
          <div className="mt-8 flex max-w-[34vw] flex-wrap justify-center gap-3">
            {voters.map((v, i) => (
              <motion.div key={v.id ?? `${v.name}-${i}`} title={v.name}
                initial={reduced ? { opacity: 0 } : { x: -from * 160, opacity: 0, scale: 0.4 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                transition={{ type: 'spring', duration: 0.6, bounce: 0.3, delay: 0.35 + i * 0.07 }}>
                <TVPlayerAvatar id={v.id} name={v.name} avatar={v.avatar} color={v.color || color} size="clamp(2.6rem,3.6vw,3.8rem)" />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Ergebnis-Zone — fest unten, getrennt vom Begriff */}
      <div className="relative flex h-[30vh] w-full flex-col items-center justify-center">
        <AnimatePresence>
          {showResults && (
            <motion.div className="flex flex-col items-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: partyEase.out, delay: 0.75 }}>
              <span className="font-black tabular-nums leading-none" style={{ fontSize: 'clamp(3.5rem,7vw,8.5rem)', color, textShadow: winner ? `0 0 40px ${color}88` : 'none' }}>
                {Math.round(percent)}%
              </span>
              <span className="mt-2 font-bold" style={{ fontSize: tvType.body, color: DIM }}>
                {t('games.thisorthat.voteCount', { count: votes })}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {winner && <TVBurst colors={[color, '#ffffff', side === 'A' ? '#ff6b98' : '#10b981']} count={40} delay={1.0} />}
    </motion.div>
  );
}

export default function TVThisOrThatView({ gameState }: { gameState: ViewState }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const optionA = gameState?.optionA || gameState?.options?.[0] || 'A';
  const optionB = gameState?.optionB || gameState?.options?.[1] || 'B';
  const phase = gameState?.phase || 'voting';
  const percentA = gameState?.percentA ?? 50;
  const percentB = gameState?.percentB ?? 50;
  const round = gameState?.round || 1;
  const total = gameState?.totalRounds || '?';
  const category = gameState?.category || '';
  const votesA = gameState?.votesA ?? 0;
  const votesB = gameState?.votesB ?? 0;
  const votersA = gameState?.votersA || [];
  const votersB = gameState?.votersB || [];
  const showResults = phase === 'results' || phase === 'reveal';
  const winnerSide = percentA > percentB ? 'A' : percentB > percentA ? 'B' : 'tie';
  const players = gameState?.players || [];
  const votedIds = Array.isArray(gameState?.votedIds) ? new Set(gameState.votedIds.filter((id): id is string => typeof id === 'string')) : null;
  const votedCount = votedIds ? players.filter((p) => p.id && votedIds.has(p.id)).length : votesA + votesB;
  const phaseLabel = phase === 'debate'
    ? { text: t('tvCinema.thisOrThat.debate', 'Diskussion'), color: '#fbbf24' }
    : showResults ? null
      : { text: t('tvCinema.thisOrThat.votingNow', 'Abstimmung läuft'), color: SIDE.A };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden" style={{ background: '#060810' }}>
      <div className="absolute left-[5vw] right-[5vw] top-[5vh] z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {category && (
            <div className="rounded-full border px-5 py-2" style={{ borderColor: `${SIDE.A}4d`, background: `${SIDE.A}14` }}>
              <span className="font-bold" style={{ fontSize: tvType.label, color: SIDE.A }}>{category}</span>
            </div>
          )}
          {phaseLabel && (
            <motion.div key={phaseLabel.text} className="flex items-center gap-2 rounded-full px-5 py-2" style={{ background: `${phaseLabel.color}1a`, border: `1px solid ${phaseLabel.color}4d` }}
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
              <motion.span className="rounded-full" style={{ width: '0.55em', height: '0.55em', background: phaseLabel.color, fontSize: tvType.label }}
                animate={reduced ? undefined : { opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.6, repeat: Infinity }} />
              <span className="font-bold" style={{ fontSize: lu(2.4), color: phaseLabel.color }}>{phaseLabel.text}</span>
            </motion.div>
          )}
        </div>
        <div className="rounded-full border border-white/5 bg-[#151a21]/80 px-5 py-2">
          <span className="font-bold" style={{ fontSize: lu(2.4), color: DIM }}>{t('tvCinema.roundOf', 'Runde {{round}} von {{total}}', { round, total })}</span>
        </div>
      </div>

      <div className="relative flex flex-1">
        <Half side="A" option={optionA} percent={percentA} votes={votesA} voters={votersA} showResults={showResults}
          winner={showResults && winnerSide === 'A'} loser={showResults && winnerSide === 'B'} round={round} />

        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <motion.div
            className="flex items-center justify-center rounded-full"
            style={{ width: 'clamp(5rem,7vw,8rem)', height: 'clamp(5rem,7vw,8rem)', background: '#060810', border: '3px solid rgba(255,255,255,0.1)', boxShadow: '0 0 40px rgba(0,0,0,0.6)' }}
            animate={!showResults && !reduced ? { scale: [1, 1.07, 1] } : { scale: 1 }}
            transition={{ repeat: !showResults && !reduced ? Infinity : 0, duration: 2 }}
          >
            {showResults && winnerSide === 'tie'
              ? <span className="px-2 text-center font-black leading-tight" style={{ fontSize: lu(1.9), color: '#fbbf24' }}>{t('tvCinema.thisOrThat.tie', 'Gleichstand')}</span>
              : <span className="font-black italic" style={{ fontSize: tvType.title, color: DIM }}>VS</span>}
          </motion.div>
        </div>

        <Half side="B" option={optionB} percent={percentB} votes={votesB} voters={votersB} showResults={showResults}
          winner={showResults && winnerSide === 'B'} loser={showResults && winnerSide === 'A'} round={round} />
      </div>

      {/* Lebenszeichen waehrend der Abstimmung: wer schon gewaehlt hat — ohne Seite. */}
      {phase === 'voting' && players.length > 0 && (
        <motion.div data-testid="tv-tot-voters" className="absolute inset-x-0 bottom-[5vh] z-30 flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: partyEase.out, delay: 0.4 }}>
          <span className="font-extrabold tabular-nums" style={{ fontSize: lu(2.4), color: '#f1f3fc' }}>
            {votedIds || votedCount > 0
              ? t('tvCinema.thisOrThat.votedCount', '{{count}}/{{total}} abgestimmt', { count: votedCount, total: players.length })
              : t('tvCinema.thisOrThat.votingNow', 'Abstimmung läuft')}
          </span>
          <div className="flex flex-wrap justify-center gap-3">
            {players.map((p, i) => {
              const voted = !!(p.id && votedIds?.has(p.id));
              return (
                <motion.div key={p.id ?? `${p.name}-${i}`} data-voted={String(voted)} className="relative"
                  animate={{ opacity: voted || !votedIds ? 1 : 0.45, scale: voted ? 1.06 : 1 }} transition={{ duration: 0.35, ease: partyEase.out }}>
                  <TVPlayerAvatar id={p.id} name={p.name} avatar={p.avatar} color={p.color} size={lu(5.6)} active={voted} />
                  {voted && (
                    <span className="absolute -bottom-1 -right-1 grid place-items-center rounded-full font-black"
                      style={{ width: '1.4em', height: '1.4em', fontSize: tvType.micro, background: '#8ff5ff', color: '#060810' }}>✓</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
