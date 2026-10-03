import type { PartyNightState } from '../party-types';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { partyEase, partyMotion } from '@/lib/party-motion';
import { tvPanel, tvType, tvActiveRing } from '../tv-tokens';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';
import TVPlayerAvatar from '../cinema/TVPlayerAvatar';
import TVBurst from '../cinema/TVBurst';
import { useTVCue } from '../cinema/tv-cue-context';
import { riseIn, staggerChildren } from '../cinema/scene';
import TVPhaseStage from '../cinema/TVPhaseStage';
import { lu } from '../components/tv-lobby-scale';

interface ViewState {
  partyNight?: PartyNightState;
  players?: Player[];
  phase?: string;
  round?: number;
}

/** „Erwischt!“: massives Gold (Design P2), kontraststark auf dem dunklen Rechteck. */
const CAUGHT_GOLD = '#f9ca24';

/**
 * TVImpostorView — big-screen view for the Impostor (Hochstapler) game.
 *
 * SECRET DISCIPLINE: `isImpostor` is NEVER shown before the reveal (revealStep 2)
 * or results screen. During discussion/voting the TV shows only who has spoken
 * and the running vote *tally* — never who voted for whom. Data arrives via the
 * host's `impostor` bridge (see ImpostorGame), which itself strips the secrets
 * before the reveal (impostorTVPlayers).
 *
 * Szenen: jede Phase ist eine eigene Szene mit gemeinsamem Ein-/Austritt
 * (cinema/scene). Titelkarten und Toene der Phasenwechsel kommen aus
 * cinema/tv-phase-cues ueber den TVScreen — hier nur der Enthuellungsmoment.
 */
const IMP = { red: '#ef4444', amber: '#f59e0b', gold: '#fbbf24', brightGold: '#FFD23F', cyan: '#8ff5ff', accent: '#df8eff', text: '#f1f3fc', dim: '#a8abb3', bg: '#060810' };

interface Player {
  id?: string;
  name: string;
  avatar?: string;
  isImpostor?: boolean;
  hasSpoken?: boolean;
  votedFor?: string | null;
  voteCount?: number;
  score?: number;
  color?: string;
}

const pid = (p: Player) => p.id || p.name;

function PlayerCard({ player, showVotes, highlight, ambient }: {
  player: Player; showVotes?: boolean; highlight?: boolean; ambient: boolean;
}) {
  const reduced = !!useReducedMotion();
  const color = player.color || IMP.accent;
  const voteCount = showVotes ? player.voteCount || 0 : 0;
  const spoken = !!player.hasSpoken && !showVotes;

  return (
    <motion.div
      variants={riseIn(reduced)}
      className="relative flex flex-col items-center gap-3 rounded-[28px] px-6 py-5"
      data-testid={`tv-impostor-player-${pid(player)}`}
      style={{
        background: highlight ? `linear-gradient(160deg, ${IMP.red}26, #0d0915 70%)` : `linear-gradient(160deg, ${color}1f, #0d0915 65%)`,
        border: `1.5px solid ${highlight ? IMP.red : 'rgba(255,255,255,0.08)'}`,
        ...(highlight ? tvActiveRing(IMP.red) : {}),
        minWidth: lu(16),
        transition: 'background 400ms ease, border-color 400ms ease',
      }}
    >
      <TVPlayerAvatar id={player.id} name={player.name} avatar={player.avatar} color={color} size={lu(8)} active={highlight} />
      <span className="font-bold" style={{ fontSize: tvType.body, color: IMP.text }}>{player.name}</span>
      {spoken && (
        <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="absolute right-3 top-3 grid place-items-center rounded-full font-black"
          style={{ width: '1.8em', height: '1.8em', fontSize: tvType.label, color: '#060810', background: IMP.cyan }}>✓</motion.span>
      )}
      <AnimatePresence>
        {showVotes && voteCount > 0 && (
          <motion.div
            key={voteCount}
            className="absolute -right-3 -top-3 flex items-center justify-center rounded-full font-black text-white"
            style={{ width: 'clamp(2.2rem,3vw,3rem)', height: 'clamp(2.2rem,3vw,3rem)', fontSize: tvType.label, background: IMP.red, ...tvActiveRing(IMP.red) }}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.45, bounce: 0.35 }}
          >
            {voteCount}
          </motion.div>
        )}
      </AnimatePresence>
      {!spoken && !showVotes && ambient && (
        <motion.span className="pointer-events-none absolute inset-0 rounded-[28px]"
          style={{ boxShadow: `0 0 18px ${color}33` }}
          animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }} />
      )}
    </motion.div>
  );
}

const EMPTY_PLAYERS: Player[] = [];

export default function TVImpostorView({ gameState }: { gameState: ViewState }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();
  const reduced = !!useReducedMotion();
  const cue = useTVCue();
  const phase: string = gameState?.phase || 'setup';
  const round: number = gameState?.round || 1;
  const players: Player[] = gameState?.players || EMPTY_PLAYERS;

  const [revealStep, setRevealStep] = useState(0);
  useEffect(() => {
    if (phase !== 'reveal') { setRevealStep(0); return; }
    setRevealStep(1);
    const timer = setTimeout(() => setRevealStep(2), 1600);
    return () => clearTimeout(timer);
  }, [phase]);

  const impostor = useMemo(() => players.find((p) => p.isImpostor), [players]);

  const playersWithVotes = useMemo(() => {
    const counts: Record<string, number> = {};
    players.forEach((p) => { if (p.votedFor) counts[p.votedFor] = (counts[p.votedFor] || 0) + 1; });
    const maxVotes = Math.max(0, ...Object.values(counts));
    return players.map((p) => ({ ...p, voteCount: counts[pid(p)] || 0, isTopVoted: maxVotes > 0 && (counts[pid(p)] || 0) === maxVotes }));
  }, [players]);

  /**
   * Erwischt = der Hochstapler hat (allein) die meisten Stimmen. Erst ab der
   * Enthuellung bekannt — vorher liefert die Bruecke weder Rollen noch Stimmen.
   */
  const caught = useMemo(() => {
    if (!impostor) return null;
    const top = playersWithVotes.filter((p) => p.isTopVoted);
    return top.length === 1 && pid(top[0]) === pid(impostor);
  }, [impostor, playersWithVotes]);

  // Der Enthuellungsmoment klingt: Fanfare bei „erwischt“, sonst der Fehlton.
  useEffect(() => {
    if (revealStep !== 2 || caught === null) return;
    cue.play(caught ? 'fanfare' : 'wrong');
  }, [revealStep, caught]); // eslint-disable-line react-hooks/exhaustive-deps

  const sortedResults = useMemo(() => [...players].sort((a, b) => (b.score || 0) - (a.score || 0)), [players]);
  const spokenCount = players.filter((p) => p.hasSpoken).length;

  const rosterPreReveal: TVScorePlayer[] = players.map((p) => ({
    id: pid(p),
    name: p.name,
    color: p.color || IMP.accent,
    subtitle: typeof p.score === 'number' ? `${p.score}` : undefined,
    status: p.hasSpoken ? 'done' : 'waiting',
  }));

  const PhasePill = ({ label, color }: { label: string; color: string }) => (
    <motion.div className="rounded-full px-6 py-2" style={{ background: `${color}1f`, border: `1px solid ${color}4d` }}
      variants={partyMotion('phaseTitleSweep', reduced)} initial="initial" animate="animate">
      <span className="font-bold" style={{ fontSize: lu(2.4), color }}>{label}</span>
    </motion.div>
  );
  const TopBar = ({ label, color }: { label: string; color: string }) => (
    <div className="absolute left-[5vw] right-[5vw] top-[5vh] z-10 flex items-center justify-between">
      <PhasePill label={label} color={color} />
      <div className={`${tvPanel} px-5 py-2`}>
        <span className="font-bold" style={{ fontSize: lu(2.4), color: IMP.dim }}>{t('tvCinema.round', 'Runde {{round}}', { round })}</span>
      </div>
    </div>
  );
  const Wash = ({ color, strength = 0.1 }: { color: string; strength?: number }) => (
    <motion.div className="pointer-events-none absolute inset-0"
      style={{ background: `radial-gradient(ellipse 70% 55% at 50% 50%, ${color}${Math.round(strength * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)` }}
      animate={ambient ? { opacity: [0.5, 1, 0.5] } : { opacity: 0.8 }}
      transition={ambient ? { repeat: Infinity, duration: 3.2, ease: 'easeInOut' } : { duration: 0.3 }} />
  );

  let content: ReactNode;

  if (phase === 'wordReveal') {
    content = (
      <>
        <Wash color={IMP.accent} strength={0.14} />
        <motion.div className="flex flex-col items-center gap-6 text-center" variants={staggerChildren(120)} initial="initial" animate="animate">
          <motion.span variants={riseIn(reduced)} style={{ fontSize: 'clamp(4rem,9vw,9rem)' }} aria-hidden>🤫</motion.span>
          <motion.h1 variants={riseIn(reduced)} className="font-black" style={{ fontSize: tvType.display, color: IMP.text }}>
            {t('tv.impostor.checkPhones', 'Schaut auf eure Handys!')}
          </motion.h1>
          <motion.p variants={riseIn(reduced)} style={{ fontSize: tvType.title, color: IMP.dim }}>
            {t('tv.impostor.oneWordOneDifferent', 'Ein Wort — aber einer hat ein anderes...')}
          </motion.p>
        </motion.div>
      </>
    );
  } else if (phase === 'discussion') {
    content = (
      <>
        <TopBar label={t('tvCinema.impostor.discussion', 'Diskussion')} color={IMP.amber} />
        <h1 className="mb-4 text-center font-black leading-tight" style={{ fontSize: tvType.display, color: IMP.text }}>
          {t('tv.impostor.whoIsImpostor', 'Wer ist der Hochstapler?')}
        </h1>
        <p className="mb-10 font-semibold" style={{ fontSize: tvType.body, color: IMP.dim }}>
          {t('tvCinema.impostor.spokenProgress', '{{count}} von {{total}} haben gesprochen', { count: spokenCount, total: players.length })}
        </p>
        <motion.div className="flex max-w-6xl flex-wrap justify-center gap-5" variants={staggerChildren()} initial="initial" animate="animate">
          {players.map((p) => <PlayerCard key={pid(p)} player={p} ambient={ambient} />)}
        </motion.div>
        <div className="absolute bottom-[5vh] left-[5vw] right-[5vw]">
          <TVScoreboard party={gameState?.partyNight} players={rosterPreReveal} sort="order" />
        </div>
      </>
    );
  } else if (phase === 'voting') {
    content = (
      <>
        <TopBar label={t('tvCinema.impostor.voting', 'Abstimmung')} color={IMP.red} />
        <Wash color={IMP.red} strength={0.07} />
        <h1 className="mb-10 font-black" style={{ fontSize: tvType.display, color: IMP.text }}>
          {t('tv.impostor.whoIsSuspected', 'Wer wird verdächtigt?')}
        </h1>
        <motion.div className="flex max-w-6xl flex-wrap justify-center gap-5" variants={staggerChildren()} initial="initial" animate="animate">
          {playersWithVotes.map((p) => <PlayerCard key={pid(p)} player={p} showVotes highlight={p.isTopVoted} ambient={ambient} />)}
        </motion.div>
      </>
    );
  } else if (phase === 'revealCountdown') {
    // Spannung: Ringe ziehen sich zur Mitte zusammen, der Trommelwirbel kommt vom Cue.
    content = (
      <>
        <Wash color={IMP.red} strength={0.16} />
        {!reduced && [0, 1, 2, 3].map((ring) => (
          <motion.span key={ring} aria-hidden className="absolute left-1/2 top-1/2 rounded-full"
            style={{ width: '70vh', height: '70vh', marginLeft: '-35vh', marginTop: '-35vh', border: `2px solid ${IMP.red}` }}
            initial={{ scale: 1.6, opacity: 0 }}
            animate={{ scale: [1.6, 0.25], opacity: [0, 0.7, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: ring * 0.4, ease: partyEase.inOut }} />
        ))}
        <motion.h1 className="relative font-black" style={{ fontSize: tvType.display, color: IMP.text, textShadow: `0 0 50px ${IMP.red}88` }}
          animate={reduced ? { opacity: 1 } : { scale: [1, 1.06, 1] }}
          transition={reduced ? { duration: 0.3 } : { repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}>
          {t('tvCinema.impostor.revealIn', 'Enthüllung in …')}
        </motion.h1>
      </>
    );
  } else if (phase === 'reveal') {
    // Helles Gold mit Schein (≥ 4.5:1 auf dem Grund) — das alte Gold wirkte auf dem Rot-Schleier braun.
    const verdictColor = caught ? CAUGHT_GOLD : IMP.red;
    content = (
      <>
        <Wash color={revealStep === 2 ? verdictColor : IMP.red} strength={0.14} />
        <AnimatePresence mode="wait">
          {revealStep === 1 && (
            <motion.h1 key="step1" className="font-black" style={{ fontSize: tvType.display, color: IMP.text }}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.08, transition: { duration: 0.22, ease: partyEase.exit } }}
              transition={{ duration: 0.6, ease: partyEase.out }}>
              {t('tvCinema.impostor.theImpostorIs', 'Der Hochstapler ist …')}
            </motion.h1>
          )}
          {revealStep === 2 && impostor && (
            <motion.div key="step2" data-testid="tv-impostor-verdict" data-caught={String(!!caught)} className="relative z-10 flex flex-col items-center gap-5 rounded-[2.5rem] px-[6vw] py-[4vh]"
              // Konfetti-freies Rechteck um Name, Chip und Urteil — Konfetti fliegt aussen herum (Design P2).
              style={{ background: 'rgba(6,8,16,0.94)', boxShadow: '0 0 60px 36px rgba(6,8,16,0.9)' }}>
              <motion.div className="relative"
                initial={reduced ? { opacity: 0 } : { scale: 0.3, opacity: 0, rotate: -12 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={reduced ? { duration: 0.2 } : { type: 'spring', duration: 0.7, bounce: 0.45 }}>
                <TVPlayerAvatar id={impostor.id} name={impostor.name} avatar={impostor.avatar} color={impostor.color || IMP.red} size="clamp(9rem,16vh,13rem)" active />
              </motion.div>
              <motion.h1 className="relative font-black leading-none" style={{ fontSize: tvType.hero, color: '#fff', textShadow: `0 0 70px ${verdictColor}aa` }}
                initial={reduced ? { opacity: 0 } : { y: 40, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.55, ease: partyEase.out, delay: 0.15 }}>
                {impostor.name}
                {/* Schein unter dem Namen in der Urteilsfarbe */}
                <span aria-hidden className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full"
                  style={{ bottom: '-0.32em', width: '110%', height: '0.42em', background: `radial-gradient(ellipse at center, ${verdictColor}88, transparent 70%)`, filter: 'blur(12px)' }} />
              </motion.h1>
              <motion.span className="rounded-full px-6 py-2 font-bold"
                style={{ fontSize: lu(2.2), color: IMP.red, background: `${IMP.red}1a`, border: `1px solid ${IMP.red}55` }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                {t('tvCinema.impostor.chip', 'Hochstapler')}
              </motion.span>
              {caught !== null && (
                <motion.p className="font-black italic" style={{ fontSize: tvType.display, color: verdictColor, textShadow: `0 0 28px ${verdictColor}66` }}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.6 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.45, ease: partyEase.out, delay: 0.7 }}>
                  {caught ? t('tvCinema.impostor.caught', 'Erwischt!') : t('tvCinema.impostor.escaped', 'Entkommen!')}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {revealStep === 2 && impostor && (
          <div className="pointer-events-none absolute inset-0 z-0"><TVBurst colors={caught ? [IMP.brightGold, IMP.cyan, IMP.accent, '#ffffff'] : [IMP.red, '#ff9b9b', IMP.amber]} count={caught ? 64 : 36} delay={0.2} /></div>
        )}
      </>
    );
  } else if (phase === 'bonusGuess') {
    content = (
      <>
        <Wash color={IMP.amber} strength={0.12} />
        <motion.h1 className="px-8 text-center font-black leading-relaxed" style={{ fontSize: tvType.display, color: IMP.text }}
          animate={ambient ? { scale: [1, 1.02, 1] } : { scale: 1 }} transition={ambient ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}>
          {t('tv.impostor.canImpostorGuess', 'Kann der Hochstapler das Wort erraten?')}
        </motion.h1>
      </>
    );
  } else if (phase === 'results') {
    content = (
      <>
        <h2 className="mb-8 font-black" style={{ fontSize: tvType.display, color: IMP.text }}>{t('tv.impostor.results', 'Ergebnis')}</h2>
        <motion.div className="flex w-full max-w-2xl flex-col gap-3" variants={staggerChildren(90)} initial="initial" animate="animate">
          {sortedResults.map((p, i) => (
            <motion.div key={pid(p)} variants={riseIn(reduced)}
              className={`${tvPanel} flex items-center gap-4 px-6 py-4`}
              style={{ border: `1.5px solid ${i === 0 ? IMP.gold : 'rgba(255,255,255,0.08)'}`, ...(i === 0 ? tvActiveRing(IMP.gold) : {}) }}>
              <span className="font-black" style={{ fontSize: tvType.body, color: i === 0 ? IMP.gold : IMP.dim, minWidth: '2.5rem' }}>{i === 0 ? '👑' : `#${i + 1}`}</span>
              <TVPlayerAvatar id={p.id} name={p.name} avatar={p.avatar} color={p.color || IMP.accent} size="clamp(2.5rem,3.4vw,3.4rem)" />
              <span className="flex-1 font-bold" style={{ fontSize: tvType.body, color: IMP.text }}>{p.name}</span>
              {p.isImpostor && <span className="font-bold" style={{ fontSize: lu(2.2), color: IMP.red }}>{t('tvCinema.impostor.chip', 'Hochstapler')}</span>}
              <span className="font-black" style={{ fontSize: tvType.body, color: i === 0 ? IMP.gold : IMP.accent }}>{p.score || 0}</span>
            </motion.div>
          ))}
        </motion.div>
      </>
    );
  } else {
    content = (
      <motion.div className="flex items-center gap-3"
        animate={ambient ? { opacity: [0.3, 1, 0.3] } : { opacity: 0.7 }} transition={ambient ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}>
        <div className="h-3 w-3 rounded-full" style={{ background: IMP.accent }} />
        <span style={{ fontSize: tvType.body, color: IMP.dim }}>{t('tv.impostor.preparing', 'Spiel wird vorbereitet...')}</span>
      </motion.div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden" style={{ background: IMP.bg }}>
      <TVPhaseStage phase={phase} className="flex flex-col items-center justify-center p-10">
        {content}
      </TVPhaseStage>
    </div>
  );
}
