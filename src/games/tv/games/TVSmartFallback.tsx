import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { partyEase, partyMotion } from '@/lib/party-motion';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { tvPanel, tvType, tvActiveRing } from '../tv-tokens';
import { lu } from '../components/tv-lobby-scale';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';
import TVPlayerAvatar from '../cinema/TVPlayerAvatar';
import type { PartyNightState } from '../party-types';

interface FallbackPlayer { id?: string; name: string; score?: number; color?: string; avatar?: string }
interface FallbackState {
  partyNight?: PartyNightState;
  game?: string;
  phase?: string;
  category?: string;
  currentCategory?: string;
  task?: string;
  currentTask?: string;
  statement?: string;
  question?: string;
  emojis?: string;
  choiceType?: string;
  explainer?: string;
  currentPlayerIndex?: number;
  activeIdx?: number;
  currentPlayerIdx?: number;
  currentRound?: number;
  round?: number;
  totalRounds?: number;
  total?: number;
  activeTeamIdx?: number;
  players?: FallbackPlayer[];
  teams?: { name?: string; score?: number }[];
}

interface Props {
  gameState: FallbackState;
  drawing?: unknown[];
}

const ACC = { purple: '#df8eff', cyan: '#8ff5ff', amber: '#fbbf24', text: '#f1f3fc', dim: '#a8abb3', truth: '#3b82f6', dare: '#ef4444' };

/** Bekannte Spielnamen (Rueckfall, falls ein Spiel ohne eigene Ansicht laeuft). */
const GAME_NAMES: Record<string, [string, string]> = {
  taboo: ['tvCinema.fallback.games.taboo', 'Tabu'],
  category: ['tvCinema.fallback.games.category', 'Kategorie'],
  impostor: ['tvCinema.fallback.games.impostor', 'Hochstapler'],
  whoami: ['tvCinema.fallback.games.whoami', 'Wer bin ich?'],
  truthdare: ['tvCinema.fallback.games.truthdare', 'Wahrheit oder Pflicht'],
  emojiguess: ['tvCinema.fallback.games.emojiguess', 'Emoji raten'],
  wordpress: ['tvCinema.fallback.games.wordpress', 'Drück das Wort'],
  findit: ['tvCinema.fallback.games.findit', 'Wo ist was?'],
};

/**
 * TVSmartFallback — Fernsehbild fuer Spiele ohne eigene Ansicht.
 *
 * GEHEIMNIS-DISZIPLIN: Das Spiel ist hier unbekannt, also kann diese Ansicht
 * nicht wissen, welche Felder geheim sind. Sie zeigt deshalb nur, was in jedem
 * Spiel oeffentlich ist (Runde, wer dran ist, Teams, Kategorie, eine
 * Aufgabe/Frage, Emoji-Raetsel) — NIE `answer`, `currentWord`, Loesungen
 * oder Rollen, auch wenn ein Spiel sie mitschickt.
 */
function extractTVState(gs: FallbackState) {
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
    task: gs.task || gs.currentTask || '',
    statement: gs.statement || gs.question || '',
    emojis: gs.emojis || '',
    choiceType: gs.choiceType || null,
  };
}

export default function TVSmartFallback({ gameState }: Props) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const ambient = useAmbientMotion();
  const tv = useMemo(() => extractTVState(gameState), [gameState]);
  const named = GAME_NAMES[tv.gameName];
  const displayName = named ? t(named[0], named[1]) : tv.gameName;
  const hasScores = tv.players.some((p) => typeof p.score === 'number');

  const phaseText: Record<string, string> = {
    playing: t('tvCinema.fallback.phase.playing', 'Läuft'),
    roundEnd: t('tvCinema.fallback.phase.roundEnd', 'Runde vorbei'),
    reveal: t('tvCinema.fallback.phase.reveal', 'Auflösung'),
    voting: t('tvCinema.fallback.phase.voting', 'Abstimmung'),
    results: t('tvCinema.fallback.phase.results', 'Ergebnis'),
  };
  const phaseLabel = phaseText[tv.phase] ?? null;

  // Kurzer Zwischentitel bei Rundenende — als Szene mit dunkler Freiflaeche.
  const [phaseFlash, setPhaseFlash] = useState('');
  const [prevPhase, setPrevPhase] = useState(tv.phase);
  useEffect(() => {
    if (tv.phase === prevPhase) return;
    setPrevPhase(tv.phase);
    setPhaseFlash(tv.phase === 'roundEnd' ? t('tvCinema.fallback.roundOver', 'Runde vorbei!') : '');
  }, [tv.phase, prevPhase, t]);
  useEffect(() => {
    if (!phaseFlash) return;
    const id = setTimeout(() => setPhaseFlash(''), 2200);
    return () => clearTimeout(id);
  }, [phaseFlash]);

  const scorePlayers = useMemo<TVScorePlayer[]>(() => tv.players.map((p, i) => ({
    id: p.id || p.name || String(i), name: p.name, color: p.color || ACC.purple, score: p.score, avatar: p.avatar,
  })), [tv.players]);
  const current = tv.currentPlayer;
  const currentId = current ? current.id || current.name : null;
  const pill = (text: string, color: string) => (
    <div className="rounded-full px-[1.4vw] py-[0.8vh]" style={{ background: `${color}1a`, border: `1px solid ${color}4d` }}>
      <span className="font-bold" style={{ fontSize: lu(2.4), color }}>{text}</span>
    </div>
  );

  return (
    <div className="relative flex h-screen flex-col overflow-hidden px-[5vw] pb-[5vh] pt-[5vh] font-game" style={{ background: '#060810', color: ACC.text }}>
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 45%, ${ACC.purple}14 0%, transparent 70%)` }} />

      {/* Kopfzeile: Spiel + Phase links, Runde rechts — die Mitte bleibt fuer die Uebergabe frei. */}
      <div className="relative z-10 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-[1vw]">
          {displayName && (
            <span className="font-black italic" style={{ fontSize: lu(3), color: ACC.purple, textShadow: `0 0 24px ${ACC.purple}55` }}>{displayName}</span>
          )}
          <AnimatePresence mode="wait">
            {phaseLabel && (
              <motion.div key={tv.phase} variants={partyMotion('phaseTitleSweep', reduced)} initial="initial" animate="animate" exit="exit">
                {pill(phaseLabel, ACC.cyan)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {tv.round > 0 && (
          <div className={`${tvPanel} px-[1.4vw] py-[0.8vh]`}>
            <span className="font-bold tabular-nums" style={{ fontSize: lu(2.4), color: ACC.dim }}>
              {tv.totalRounds
                ? t('tvCinema.roundOf', 'Runde {{round}} von {{total}}', { round: tv.round, total: tv.totalRounds })
                : t('tvCinema.round', 'Runde {{round}}', { round: tv.round })}
            </span>
          </div>
        )}
      </div>

      {/* Mitte */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-[2.4vh]">
        <AnimatePresence mode="wait">
          {tv.teams ? (
            <motion.div key="teams" className="flex items-end gap-[3vw]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {tv.teams.map((team, i) => {
                const isActive = i === tv.activeTeamIdx;
                return (
                  <motion.div key={i} className={`${tvPanel} flex flex-col items-center gap-[1.4vh] px-[3vw] py-[3vh]`}
                    style={isActive ? tvActiveRing(ACC.purple) : undefined}
                    animate={isActive && ambient ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                    transition={isActive && ambient ? { repeat: Infinity, duration: 2, ease: 'easeInOut' } : { duration: 0.3 }}>
                    <span className="font-black" style={{ fontSize: tvType.title, color: ACC.text }}>
                      {team.name || t('tvCinema.fallback.team', 'Team {{n}}', { n: i + 1 })}
                    </span>
                    <span className="font-black tabular-nums" style={{ fontSize: tvType.hero, color: isActive ? ACC.purple : ACC.dim, lineHeight: 1 }}>
                      {team.score ?? 0}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : current ? (
            <motion.div key={`player-${currentId}`} className="flex flex-col items-center gap-[1.6vh]"
              variants={partyMotion('spotlight', reduced)} initial="initial" animate="animate" exit="exit">
              <TVPlayerAvatar id={current.id} name={current.name} avatar={current.avatar} color={current.color} size={lu(16)} active />
              <h2 className="font-black" style={{ fontSize: tvType.display, color: '#fff' }}>{current.name}</h2>
              <span className="font-semibold" style={{ fontSize: tvType.body, color: ACC.dim }}>{t('tvCinema.fallback.isUp', 'ist dran')}</span>
              {tv.explainer && (
                <span style={{ fontSize: tvType.body, color: ACC.cyan }}>{t('tv.explainedBy', 'Erklärt:')} <b>{tv.explainer}</b></span>
              )}
            </motion.div>
          ) : (
            <motion.div key="idle" style={{ fontSize: tvType.title, color: ACC.dim }}
              animate={ambient ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.8 }} transition={ambient ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}>
              {t('tv.waitingForPlayers', 'Warte auf Spieler…')}
            </motion.div>
          )}
        </AnimatePresence>

        {tv.category && pill(tv.category, ACC.cyan)}

        {tv.emojis && (
          <motion.span key={tv.emojis} style={{ fontSize: tvType.hero, lineHeight: 1.1 }}
            initial={reduced ? { opacity: 0 } : { scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, ease: partyEase.out }}>
            {tv.emojis}
          </motion.span>
        )}

        {tv.statement && !tv.emojis && (
          <motion.div key={tv.statement} className={`${tvPanel} max-w-[70vw] px-[3vw] py-[2.4vh] text-center`}
            initial={reduced ? { opacity: 0 } : { scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, ease: partyEase.out }}>
            <p className="font-bold" style={{ fontSize: tvType.title, color: ACC.text }}>{tv.statement}</p>
          </motion.div>
        )}

        {tv.choiceType && pill(
          tv.choiceType === 'truth' ? t('tvCinema.fallback.truth', '💬 Wahrheit') : t('tvCinema.fallback.dare', '🎯 Pflicht'),
          tv.choiceType === 'truth' ? ACC.truth : ACC.dare,
        )}

        {tv.task && (
          <p className="max-w-[60vw] text-center font-semibold" style={{ fontSize: tvType.body, color: ACC.text }}>{tv.task}</p>
        )}
      </div>

      {hasScores && (
        <div className="relative z-10 shrink-0">
          <TVScoreboard party={gameState?.partyNight} players={scorePlayers} activeId={currentId} />
        </div>
      )}

      <AnimatePresence>
        {phaseFlash && (
          <motion.div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center"
            style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(6,8,16,0.92) 40%, rgba(6,8,16,0.6) 75%, transparent 100%)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <motion.h1 className="font-black italic" style={{ fontSize: tvType.display, color: ACC.text, textShadow: `0 0 60px ${ACC.purple}99` }}
              initial={reduced ? { opacity: 0 } : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: partyEase.out }}>
              {phaseFlash}
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
