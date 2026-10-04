import type { PartyNightState } from '../party-types';
import { motion, useReducedMotion } from 'framer-motion';
import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { partyMotion } from '@/lib/party-motion';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { tvPanel, tvType } from '../tv-tokens';
import TVPhaseStage from '../cinema/TVPhaseStage';
import { lu } from '../components/tv-lobby-scale';
import TabooTeamPanel from './taboo/TabooTeamPanel';
import { TabooGameOver, TabooLiveCenter, TabooTurnStart, TabooTurnSummary, type TeamView } from './taboo/TabooScenes';
import { TB, explainerOf, teamHex, teamMembers, type TabooSeatLike, type TabooTeam } from './taboo/taboo-tv';

interface ViewState {
  partyNight?: PartyNightState;
  phase?: string;
  activeTeamIdx?: number;
  currentRound?: number;
  timeLeft?: number;
  totalRounds?: number;
  turnCorrect?: number;
  turnSkipped?: number;
  turnTaboo?: number;
  teams?: TabooTeam[];
  explainer?: string | TabooSeatLike;
  roster?: TabooSeatLike[];
}

/**
 * TVTabooView — Fernseher fuer Tabu (zwei Teams erklaeren um die Wette).
 *
 * Szenen je Phase (TVPhaseStage): Zugbeginn (Team + Erklaerer im
 * Rampenlicht), Team-Duell waehrend des Zuges (Zeit-Ring + Live-Zaehler in
 * der Mitte), Zug-Bilanz, Siegerteam. Titelkarten: cinema/cues/taboo.cue.ts.
 *
 * GEHEIMNIS: Die Karte und ihre verbotenen Woerter erscheinen NIE — die
 * Bruecke (tabooTvState) zaehlt die Felder ausdruecklich auf, ohne Karte.
 */
const EMPTY: never[] = [];

export default function TVTabooView({ gameState }: { gameState: ViewState }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const ambient = useAmbientMotion();

  const phase: string = gameState?.phase || 'playing';
  const round: number = gameState?.currentRound || 1;
  const totalRounds = gameState?.totalRounds || 0;
  const activeIdx: number = gameState?.activeTeamIdx ?? 0;
  const explainer = explainerOf(gameState?.explainer);
  const timeLeft = typeof gameState?.timeLeft === 'number' ? gameState.timeLeft : null;
  const turnCorrect = gameState?.turnCorrect ?? 0;
  const turnTaboo = gameState?.turnTaboo ?? 0;
  const turnSkipped = gameState?.turnSkipped ?? 0;

  const rawTeams = gameState?.teams ?? EMPTY;
  const roster = gameState?.roster ?? EMPTY;
  const teams: TeamView[] = useMemo(() => rawTeams.slice(0, 2).map((team, i) => ({
    name: team?.name || (i === 0 ? 'Team A' : 'Team B'),
    score: team?.score ?? 0,
    color: teamHex(team, i),
    members: teamMembers(team, i, roster),
  })), [rawTeams, roster]);
  const active = teams[activeIdx] ?? teams[0];

  const topBar = (label: string, color: string, showRound = true) => (
    <div className="absolute left-[5vw] right-[5vw] top-[5vh] z-10 flex items-center justify-between">
      <motion.div className="flex items-center gap-3 rounded-full px-6 py-2" style={{ background: `${color}1f`, border: `1px solid ${color}4d` }}
        variants={partyMotion('phaseTitleSweep', reduced)} initial="initial" animate="animate">
        <span aria-hidden style={{ fontSize: lu(2.4) }}>🤐</span>
        <span className="font-bold" style={{ fontSize: lu(2.4), color: '#fff' }}>{label}</span>
      </motion.div>
      {showRound && (
        <div className={`${tvPanel} px-5 py-2`}>
          <span className="font-bold tabular-nums" style={{ fontSize: lu(2.4), color: TB.dim }}>
            {totalRounds ? t('tvCinema.roundOf', 'Runde {{round}} von {{total}}', { round, total: totalRounds }) : t('tvCinema.round', 'Runde {{round}}', { round })}
          </span>
        </div>
      )}
    </div>
  );

  let content: ReactNode;
  if (teams.length < 2 || !active) {
    content = (
      <motion.span className="font-semibold" style={{ fontSize: tvType.body, color: TB.dim }}
        animate={ambient ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.8 }} transition={ambient ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}>
        {t('tv.taboo.waiting', 'Warte auf Teams...')}
      </motion.span>
    );
  } else if (phase === 'turnStart') {
    content = (
      <>
        {topBar(t('tvCinema.taboo.nextTurn', 'Nächster Zug'), active.color)}
        <TabooTurnStart team={active} explainer={explainer} />
      </>
    );
  } else if (phase === 'playing') {
    content = (
      <>
        {topBar(explainer.name ? t('tvCinema.taboo.explains', '{{name}} erklärt', { name: explainer.name }) : active.name, active.color)}
        <div className="absolute inset-x-[5vw] bottom-[6vh] top-[15vh] grid grid-cols-[1fr_auto_1fr] items-center" style={{ gap: lu(3) }}>
          <TabooTeamPanel {...teams[0]} active={activeIdx === 0} explainerName={explainer.name || ''} side="left" />
          <div className="flex items-center justify-center">
            <TabooLiveCenter timeLeft={timeLeft} correct={turnCorrect} taboo={turnTaboo} skipped={turnSkipped} color={active.color} />
          </div>
          <TabooTeamPanel {...teams[1]} active={activeIdx === 1} explainerName={explainer.name || ''} side="right" />
        </div>
      </>
    );
  } else if (phase === 'turnSummary') {
    content = (
      <>
        {topBar(t('tvCinema.taboo.summary', 'Zug-Bilanz'), active.color)}
        <TabooTurnSummary team={active} explainer={explainer} correct={turnCorrect} taboo={turnTaboo} skipped={turnSkipped} />
        <div className="absolute bottom-[5vh] left-1/2 flex -translate-x-1/2 items-center font-black tabular-nums" style={{ gap: lu(3), fontSize: tvType.title }}>
          {teams.map((tm, i) => (
            <span key={i} className={`${tvPanel} flex items-center gap-3 px-6 py-2`} style={{ color: '#fff' }}>
              <span aria-hidden className="rounded-full" style={{ width: '0.5em', height: '0.5em', background: tm.color }} />
              <span className="font-bold" style={{ fontSize: tvType.body }}>{tm.name}</span>{tm.score}
            </span>
          ))}
        </div>
      </>
    );
  } else if (phase === 'gameOver') {
    content = (
      <>
        {topBar(t('tvCinema.taboo.gameOver', 'Spielende'), TB.gold, false)}
        <TabooGameOver teams={teams} />
      </>
    );
  } else {
    content = (
      <motion.span className="font-semibold" style={{ fontSize: tvType.body, color: TB.dim }}
        animate={ambient ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.8 }} transition={ambient ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}>
        {t('tvCinema.taboo.preparing', 'Teams werden gebildet …')}
      </motion.span>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden" style={{ background: TB.bg, color: TB.text }}>
      <TVPhaseStage phase={phase} className="flex flex-col items-center justify-center">
        {content}
      </TVPhaseStage>
    </div>
  );
}
