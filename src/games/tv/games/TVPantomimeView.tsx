/**
 * OHNE WORTE auf dem Fernseher.
 *
 * DIE EINE REGEL, die alles andere schlägt: Der BEGRIFF darf hier nie stehen.
 * Alle im Raum schauen auf den Fernseher — stünde der Begriff dort, wäre das
 * Spiel in derselben Sekunde vorbei. Er kommt deshalb gar nicht erst im
 * Zustand an (siehe `tvPayload` in `PantomimeGame.tsx`).
 *
 * Die HERAUSFORDERUNG dagegen MUSS hier stehen. Nur so sieht die Gruppe, ob
 * der Kochlöffel wirklich benutzt wurde — sonst wären die doppelten Punkte
 * Ehrensache statt Spiel.
 *
 * Bühne: zwei Team-Leisten bleiben stehen, nur die Mitte wechselt je Phase
 * (TVPhaseStage). Die laufende Uhr lebt innerhalb der Spielphase.
 * Defensiv destrukturiert: Ein Fernseher kann sich jederzeit verbinden und
 * bekommt dann einen unvollständigen Zustand.
 */
import { useMemo, useRef, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import TVPlayerAvatar from '../cinema/TVPlayerAvatar';
import TVBurst from '../cinema/TVBurst';
import TVPhaseStage from '../cinema/TVPhaseStage';
import { riseIn, staggerChildren } from '../cinema/scene';
import { lu } from '../components/tv-lobby-scale';
import { tvType } from '../tv-tokens';
import TeamRail, { type PantomimeTeam } from './pantomime/TeamRail';
import { TS, TVTimerRing, TVTopBar, Wash, emojiOnly, hexOr } from './turn-stage/kit';

interface Props { gameState: Record<string, unknown> }
interface RosterEntry { id?: string; name: string; avatar?: string; color?: string; team?: number }

function ExtraCard({ text, label }: { text: string; label: string }) {
  const reduced = !!useReducedMotion();
  return (
    <motion.div variants={riseIn(reduced)} data-testid="tv-pantomime-extra"
      className="max-w-[46vw] rounded-[28px] px-[2.6vw] py-[2.4vh] text-center"
      style={{ background: TS.raised, boxShadow: `0 0 0 2px ${TS.gold}88, 0 0 50px -12px ${TS.gold}88` }}>
      <p className="font-bold" style={{ fontSize: tvType.label, color: TS.gold }}>{label}</p>
      <p className="mt-[0.6vh] font-black leading-tight" style={{ fontSize: tvType.title, color: TS.text }}>{text}</p>
    </motion.div>
  );
}

export default function TVPantomimeView({ gameState }: Props) {
  const reduced = !!useReducedMotion();
  const { t } = useTranslation();
  const s = (gameState ?? {}) as Record<string, unknown>;

  const phase = String(s.phase ?? 'turnStart');
  const round = Number(s.round ?? 1);
  const totalRounds = Number(s.totalRounds ?? 1);
  const activeTeamIdx = Number(s.activeTeamIdx ?? 0);
  const actor = String(s.actor ?? '');
  const actorId = typeof s.actorId === 'string' ? s.actorId : undefined;
  const timeLeft = Number(s.timeLeft ?? 0);
  const totalTime = Number(s.totalTime ?? 90);
  const correctCount = Number(s.correctCount ?? 0);
  const fetchLeft = Number(s.fetchLeft ?? 0);
  const turnPoints = Number(s.turnPoints ?? 0);
  const extraAccepted = Boolean(s.extraAccepted);
  const extra = (s.extra ?? null) as { text?: string; kind?: string } | null;

  // Holzeit: das Spiel schickt nur den Rest — der hoechste Wert der Phase ist die Gesamtzeit.
  const fetchTotal = useRef({ phase: '', max: 0 });
  if (fetchTotal.current.phase !== `${phase}:${round}:${activeTeamIdx}`) fetchTotal.current = { phase: `${phase}:${round}:${activeTeamIdx}`, max: 0 };
  fetchTotal.current.max = Math.max(fetchTotal.current.max, fetchLeft);

  const teams = useMemo<PantomimeTeam[]>(() => {
    const raw = Array.isArray(s.teams) ? s.teams : [];
    const roster = (Array.isArray(s.roster) ? s.roster : []) as RosterEntry[];
    return raw.map((tm, ti) => {
      const q = tm as Record<string, unknown>;
      const color = hexOr(q.color, ti === 0 ? TS.gold : TS.cyan);
      const names = Array.isArray(q.players) ? (q.players as unknown[]).map(String) : [];
      return {
        name: String(q.name ?? ''),
        color,
        score: Number(q.score ?? 0),
        members: names.map((name) => {
          const r = roster.find((x) => x.name === name && (x.team === undefined || x.team === ti)) ?? roster.find((x) => x.name === name);
          return { id: r?.id, name, avatar: emojiOnly(r?.avatar), color: hexOr(r?.color, color) };
        }),
      };
    });
  }, [s.teams, s.roster]);

  const activeTeam = teams[activeTeamIdx];
  const teamColor = activeTeam?.color ?? TS.gold;
  const actorMember = activeTeam?.members.find((m) => (actorId && m.id === actorId) || m.name === actor);
  const actorAvatar = (size: string, active = true) => (
    <TVPlayerAvatar id={actorMember?.id ?? actorId} name={actor} avatar={actorMember?.avatar} color={actorMember?.color ?? teamColor} size={size} active={active} />
  );

  const phaseBadge = {
    turnStart: { label: t('tvCinema.pantomime.turnStart', 'Nächster Zug'), color: teamColor },
    extra: { label: t('games.pantomime.extraTitle', 'Herausforderung'), color: TS.gold },
    fetch: { label: t('tvCinema.pantomime.fetch', 'Requisit holen'), color: TS.gold },
    playing: { label: t('tvCinema.pantomime.playing', 'Darstellen'), color: teamColor },
    turnSummary: { label: t('tvCinema.pantomime.summary', 'Wertung'), color: TS.good },
    gameOver: { label: t('tvCinema.pantomime.final', 'Endstand'), color: TS.gold },
  }[phase] ?? null;

  const winner = useMemo(() => {
    if (teams.length < 2) return teams[0] ?? null;
    const sorted = [...teams].sort((a, b) => b.score - a.score);
    return sorted[0].score === sorted[1].score ? null : sorted[0];
  }, [teams]);

  let center: ReactNode;
  if (phase === 'turnStart') {
    center = (
      <motion.div className="flex flex-col items-center gap-[2.4vh] text-center" variants={staggerChildren(110)} initial="initial" animate="animate">
        <motion.div variants={riseIn(reduced)}>{actorAvatar(lu(22))}</motion.div>
        <motion.h1 variants={riseIn(reduced)} className="font-black leading-none" style={{ fontSize: tvType.display }}>{actor || t('games.pantomime.title', 'Ohne Worte')}</motion.h1>
        <motion.p variants={riseIn(reduced)} className="font-bold" style={{ fontSize: tvType.title, color: TS.dim }}>{t('games.pantomime.actorIs', 'stellt gleich dar')}</motion.p>
        {activeTeam && (
          <motion.span variants={riseIn(reduced)} className="rounded-full px-6 py-2 font-bold" style={{ fontSize: lu(2.4), background: `${teamColor}1f`, boxShadow: `0 0 0 1px ${teamColor}66` }}>
            {t('tvCinema.pantomime.forTeam', 'für {{team}}', { team: activeTeam.name })}
          </motion.span>
        )}
      </motion.div>
    );
  } else if (phase === 'extra') {
    center = (
      <motion.div className="flex flex-col items-center gap-[2.4vh] text-center" variants={staggerChildren(110)} initial="initial" animate="animate">
        <motion.span variants={riseIn(reduced)} style={{ fontSize: lu(12) }} aria-hidden>🎲</motion.span>
        <motion.h1 variants={riseIn(reduced)} className="font-black leading-tight" style={{ fontSize: tvType.display }}>{t('tvCinema.pantomime.extraHeadline', 'Doppelte Punkte?')}</motion.h1>
        <motion.div variants={riseIn(reduced)} className="flex items-center gap-4">
          {actorAvatar(lu(7))}
          <span className="font-bold" style={{ fontSize: tvType.title, color: TS.dim }}>{t('tvCinema.pantomime.extraDecides', '{{name}} entscheidet', { name: actor })}</span>
        </motion.div>
      </motion.div>
    );
  } else if (phase === 'fetch') {
    center = (
      <motion.div className="flex flex-col items-center gap-[3vh] text-center" variants={staggerChildren(110)} initial="initial" animate="animate">
        <motion.h1 variants={riseIn(reduced)} className="font-black leading-tight" style={{ fontSize: tvType.display }}>{t('games.pantomime.fetchTitle', 'Hol dir schnell:')}</motion.h1>
        <motion.div variants={riseIn(reduced)}><TVTimerRing timeLeft={fetchLeft} total={fetchTotal.current.max || fetchLeft || 1} size={22} /></motion.div>
        {extra?.text && <ExtraCard text={extra.text} label={t('games.pantomime.extraTitle', 'Herausforderung')} />}
      </motion.div>
    );
  } else if (phase === 'playing') {
    center = (
      <motion.div className="flex flex-col items-center gap-[2.6vh] text-center" variants={staggerChildren(110)} initial="initial" animate="animate">
        <motion.div variants={riseIn(reduced)} className="flex items-center gap-4">
          {actorAvatar(lu(8))}
          <span className="font-black" style={{ fontSize: tvType.title }}>{t('games.pantomime.watching', '{{name}} stellt dar', { name: actor })}</span>
        </motion.div>
        <motion.div variants={riseIn(reduced)}><TVTimerRing timeLeft={timeLeft} total={totalTime} size={26} /></motion.div>
        <motion.p variants={riseIn(reduced)} className="font-black tabular-nums" style={{ fontSize: tvType.title, color: TS.text }}>
          <motion.span key={correctCount} className="inline-block" initial={reduced ? { opacity: 0 } : { scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', duration: 0.45, bounce: 0.45 }}>
            {t('games.pantomime.wordsSoFar', '{{count}} erraten', { count: correctCount })}
          </motion.span>
        </motion.p>
        {extra?.text && <ExtraCard text={extra.text} label={t('games.pantomime.extraTitle', 'Herausforderung')} />}
      </motion.div>
    );
  } else if (phase === 'turnSummary') {
    center = (
      <>
        {turnPoints > 0 && <div className="pointer-events-none absolute inset-0 z-0"><TVBurst colors={[teamColor, TS.good, '#ffffff']} count={turnPoints >= 4 ? 52 : 30} delay={0.15} /></div>}
        <motion.div className="relative z-10 flex flex-col items-center gap-[2vh] rounded-[50%] px-[6vw] py-[5vh] text-center"
          style={{ background: 'radial-gradient(ellipse closest-side, #060810 60%, rgba(6,8,16,0.85) 80%, transparent 100%)' }}
          variants={staggerChildren(110)} initial="initial" animate="animate">
          <motion.p variants={riseIn(reduced)} className="font-bold" style={{ fontSize: tvType.title, color: TS.dim }}>{t('games.pantomime.summaryTitle', 'Der Zug von {{name}}', { name: actor })}</motion.p>
          <motion.p variants={riseIn(reduced)} className="font-black tabular-nums leading-none" style={{ fontSize: tvType.hero, color: '#fff', textShadow: `0 0 60px ${turnPoints > 0 ? TS.good : TS.dim}aa` }}>
            {turnPoints > 0 ? `+${turnPoints}` : '0'}
          </motion.p>
          {turnPoints === 0 && <motion.p variants={riseIn(reduced)} className="font-bold" style={{ fontSize: tvType.body, color: TS.dim }}>{t('games.pantomime.summaryEmpty', 'Diesmal kam nichts durch.')}</motion.p>}
          {activeTeam && turnPoints > 0 && (
            <motion.p variants={riseIn(reduced)} className="font-bold" style={{ fontSize: tvType.title }}>{t('tvCinema.pantomime.forTeam', 'für {{team}}', { team: activeTeam.name })}</motion.p>
          )}
          {extraAccepted && (
            <motion.span variants={riseIn(reduced)} className="whitespace-nowrap rounded-full px-6 py-2 font-bold" style={{ fontSize: lu(2.4), background: `${TS.gold}1f`, boxShadow: `0 0 0 1px ${TS.gold}88` }}>
              {t('games.pantomime.summaryDoubled', 'Herausforderung bestanden — doppelte Punkte')}
            </motion.span>
          )}
        </motion.div>
      </>
    );
  } else if (phase === 'gameOver') {
    center = (
      <>
        <div className="pointer-events-none absolute inset-0 z-0"><TVBurst colors={[winner?.color ?? TS.gold, TS.gold, '#ffffff']} count={60} delay={0.2} /></div>
        <motion.div className="relative z-10 flex flex-col items-center gap-[2vh] rounded-[50%] px-[6vw] py-[6vh] text-center"
          style={{ background: 'radial-gradient(ellipse closest-side, #060810 60%, rgba(6,8,16,0.85) 80%, transparent 100%)' }}
          variants={staggerChildren(120)} initial="initial" animate="animate">
          <motion.span variants={riseIn(reduced)} style={{ fontSize: lu(12) }} aria-hidden>🏆</motion.span>
          <motion.h1 variants={riseIn(reduced)} className="font-black leading-tight" style={{ fontSize: tvType.display, textShadow: `0 0 50px ${(winner?.color ?? TS.gold)}88` }}>
            {winner ? t('games.pantomime.winner', '{{team}} gewinnt!', { team: winner.name }) : t('games.pantomime.draw', 'Unentschieden!')}
          </motion.h1>
        </motion.div>
      </>
    );
  } else {
    center = (
      <motion.div className="flex flex-col items-center gap-4 text-center" variants={staggerChildren(110)} initial="initial" animate="animate">
        <motion.span variants={riseIn(reduced)} style={{ fontSize: lu(12) }} aria-hidden>🤐</motion.span>
        <motion.h1 variants={riseIn(reduced)} className="font-black" style={{ fontSize: tvType.display }}>{t('games.pantomime.title', 'Ohne Worte')}</motion.h1>
      </motion.div>
    );
  }

  const left = teams[0];
  const right = teams[1];
  return (
    <div className="relative h-screen overflow-hidden" style={{ background: TS.bg, color: TS.text }}>
      <Wash color={phase === 'gameOver' ? (winner?.color ?? TS.gold) : teamColor} strength={0.12} />
      <TVTopBar phase={phaseBadge} round={t('games.pantomime.roundOf', 'Runde {{round}} von {{total}}', { round, total: totalRounds })} />

      <div className="absolute bottom-[6vh] left-[5vw] right-[5vw] top-[16vh] grid grid-cols-[minmax(0,22vw)_1fr_minmax(0,22vw)] items-center gap-[2vw]">
        <div>{left && <TeamRail team={left} active={activeTeamIdx === 0 && phase !== 'gameOver' ? true : phase === 'gameOver' && winner === left} actorName={actor} side="left" />}</div>
        <div className="relative h-full">
          <TVPhaseStage phase={phase} className="flex items-center justify-center">{center}</TVPhaseStage>
        </div>
        <div>{right && <TeamRail team={right} active={activeTeamIdx === 1 && phase !== 'gameOver' ? true : phase === 'gameOver' && winner === right} actorName={actor} side="right" />}</div>
      </div>
    </div>
  );
}
