import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { partyEase, partyMotion, playerGlow } from '@/lib/party-motion';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import TVPlayerAvatar from '../../cinema/TVPlayerAvatar';
import TVBurst from '../../cinema/TVBurst';
import { useTVCue } from '../../cinema/tv-cue-context';
import { riseIn, staggerChildren } from '../../cinema/scene';
import { lu } from '../../components/tv-lobby-scale';
import { tvPanel, tvPanelRaised, tvType } from '../../tv-tokens';
import { TB, memberKey, type TabooMember, type TabooSeatLike } from './taboo-tv';

export interface TeamView { name: string; score: number; color: string; members: TabooMember[] }

function Stat({ value, label, color, reduced, big = false }: { value: number; label: string; color: string; reduced: boolean; big?: boolean }) {
  return (
    <motion.div variants={riseIn(reduced)} className="flex flex-col items-center" style={{ minWidth: lu(12) }}>
      <motion.span key={value} className="font-black tabular-nums leading-none" style={{ fontSize: big ? tvType.hero : tvType.display, color: '#fff', textShadow: `0 0 30px ${color}` }}
        initial={reduced ? { opacity: 0.5 } : { scale: 1.4 }} animate={reduced ? { opacity: 1 } : { scale: 1 }} transition={{ duration: 0.35, ease: partyEase.out }}>
        {value}
      </motion.span>
      <span className="mt-2 flex items-center gap-2 font-bold" style={{ fontSize: tvType.body, color: TB.text }}>
        <span aria-hidden className="rounded-full" style={{ width: '0.55em', height: '0.55em', background: color }} />{label}
      </span>
    </motion.div>
  );
}

/** Zugbeginn: Team + Erklaerer im Rampenlicht. */
export function TabooTurnStart({ team, explainer }: { team: TeamView; explainer: TabooSeatLike }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const ex = team.members.find((m) => m.name === explainer.name);
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 55% 50% at 50% 48%, ${team.color}2e 0%, transparent 70%)` }} />
      <motion.div className="relative flex flex-col items-center text-center" style={{ gap: lu(2.4) }} variants={staggerChildren(130)} initial="initial" animate="animate">
        <motion.span variants={riseIn(reduced)} className="rounded-full px-6 py-2 font-bold" style={{ fontSize: lu(2.6), color: '#fff', background: `${team.color}26`, boxShadow: playerGlow(team.color, 'soft') }}>
          {t('tvCinema.taboo.teamTurn', '{{team}} ist dran', { team: team.name })}
        </motion.span>
        {explainer.name && (
          <motion.div variants={partyMotion('spotlight', reduced)}>
            <TVPlayerAvatar id={explainer.id ?? ex?.id} name={explainer.name} avatar={explainer.avatar ?? ex?.avatar} color={explainer.color || ex?.color || team.color} size={lu(22)} active />
          </motion.div>
        )}
        <motion.h1 variants={riseIn(reduced)} className="font-black leading-none" style={{ fontSize: tvType.display, color: '#fff' }}>
          {explainer.name ? t('tvCinema.taboo.explains', '{{name}} erklärt', { name: explainer.name }) : team.name}
        </motion.h1>
        <motion.p variants={riseIn(reduced)} className="font-semibold" style={{ fontSize: tvType.body, color: TB.dim }}>
          {t('tvCinema.taboo.turnStartSub', 'Die Karte gibt es nur auf dem Handy – verbotene Wörter sind tabu!')}
        </motion.p>
      </motion.div>
    </>
  );
}

/** Mitte der Buehne waehrend des Zuges: Zeit-Ring und Live-Zaehler. Treffer/Tabu klingen. */
export function TabooLiveCenter({ timeLeft, correct, taboo, skipped, color }: { timeLeft: number | null; correct: number; taboo: number; skipped: number; color: string }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const ambient = useAmbientMotion();
  const cue = useTVCue();
  const prev = useRef({ correct, taboo });
  const maxRef = useRef(timeLeft ?? 0);
  if ((timeLeft ?? 0) > maxRef.current) maxRef.current = timeLeft ?? 0;
  useEffect(() => {
    if (correct > prev.current.correct) cue.play('correct');
    else if (taboo > prev.current.taboo) cue.play('wrong');
    prev.current = { correct, taboo };
  }, [correct, taboo]); // eslint-disable-line react-hooks/exhaustive-deps

  const warn = timeLeft !== null && timeLeft <= 10;
  const ring = warn ? TB.taboo : color;
  const R = 44;
  const C = 2 * Math.PI * R;
  const frac = timeLeft === null ? 1 : Math.max(0, Math.min(1, timeLeft / Math.max(maxRef.current, 1)));
  return (
    <motion.div className="flex flex-col items-center" style={{ gap: lu(3) }} variants={staggerChildren(90)} initial="initial" animate="animate">
      <motion.div variants={riseIn(reduced)} className="relative grid place-items-center rounded-full" style={{ width: lu(20), height: lu(20), boxShadow: `0 0 50px -10px ${ring}` }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r={R} fill="#0d0915" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <motion.circle cx="50" cy="50" r={R} fill="none" stroke={ring} strokeWidth="6" strokeLinecap="round" strokeDasharray={C}
            animate={{ strokeDashoffset: C * (1 - frac) }} transition={{ duration: 0.5, ease: partyEase.out }} />
        </svg>
        <motion.span className="relative font-black tabular-nums" style={{ fontSize: tvType.display, color: '#fff' }}
          animate={ambient && warn && (timeLeft ?? 0) > 0 ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={ambient && warn ? { repeat: Infinity, duration: 1 } : { duration: 0.2 }}>
          {timeLeft ?? '–'}
        </motion.span>
      </motion.div>
      <motion.div className={`${tvPanel} flex flex-col`} style={{ gap: lu(1.6), padding: `${lu(2)} ${lu(3)}` }} variants={staggerChildren(80)}>
        <Stat value={correct} label={t('tv.taboo.correct', 'Richtig')} color={TB.correct} reduced={reduced} />
        <Stat value={taboo} label={t('tv.taboo.taboo', 'Tabu')} color={TB.taboo} reduced={reduced} />
        <Stat value={skipped} label={t('tvCinema.taboo.skipped', 'Übersprungen')} color={TB.skip} reduced={reduced} />
      </motion.div>
    </motion.div>
  );
}

/** Zug-Bilanz: Team, Erklaerer, drei Zaehler, Punkte dieses Zuges. */
export function TabooTurnSummary({ team, explainer, correct, taboo, skipped }: { team: TeamView; explainer: TabooSeatLike; correct: number; taboo: number; skipped: number }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const ex = team.members.find((m) => m.name === explainer.name);
  const points = correct - taboo;
  return (
    <motion.div className={`${tvPanelRaised} relative flex flex-col items-center`} style={{ gap: lu(3), padding: `${lu(4)} ${lu(7)}`, boxShadow: playerGlow(team.color, 'active') }}
      variants={staggerChildren(110)} initial="initial" animate="animate">
      <motion.div variants={riseIn(reduced)} className="flex items-center" style={{ gap: lu(2) }}>
        {explainer.name && <TVPlayerAvatar id={explainer.id ?? ex?.id} name={explainer.name} avatar={explainer.avatar ?? ex?.avatar} color={explainer.color || ex?.color || team.color} size={lu(9)} active />}
        <div className="flex flex-col items-start">
          <span className="font-semibold" style={{ fontSize: tvType.body, color: TB.dim }}>{team.name}</span>
          <span className="font-black leading-none" style={{ fontSize: tvType.title, color: '#fff' }}>{explainer.name || team.name}</span>
        </div>
      </motion.div>
      <motion.div className="flex" style={{ gap: lu(5) }} variants={staggerChildren(110)}>
        <Stat value={correct} label={t('tv.taboo.correct', 'Richtig')} color={TB.correct} reduced={reduced} big />
        <Stat value={taboo} label={t('tv.taboo.taboo', 'Tabu')} color={TB.taboo} reduced={reduced} big />
        <Stat value={skipped} label={t('tvCinema.taboo.skipped', 'Übersprungen')} color={TB.skip} reduced={reduced} big />
      </motion.div>
      <motion.span variants={riseIn(reduced)} className="rounded-full px-6 py-2 font-black tabular-nums"
        style={{ fontSize: tvType.title, color: '#fff', background: `${points >= 0 ? TB.correct : TB.taboo}2e`, boxShadow: `inset 0 0 0 1.5px ${points >= 0 ? TB.correct : TB.taboo}66` }}>
        {t('tvCinema.taboo.turnPoints', '{{points}} Punkte für {{team}}', { points: points > 0 ? `+${points}` : points, team: team.name })}
      </motion.span>
    </motion.div>
  );
}

/** Spielende: Siegerteam mit allen Mitgliedern, Konfetti hinter dem Text. */
export function TabooGameOver({ teams }: { teams: TeamView[] }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  if (teams.length < 2) return null;
  const tie = teams[0].score === teams[1].score;
  const win = teams[0].score >= teams[1].score ? teams[0] : teams[1];
  const lose = win === teams[0] ? teams[1] : teams[0];
  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-0"><TVBurst colors={tie ? [TB.cyan, TB.purple, '#ffffff'] : [TB.gold, win.color, TB.cyan, '#ffffff']} count={tie ? 36 : 64} delay={0.3} /></div>
      <motion.div className="relative z-10 flex flex-col items-center rounded-[50%] px-[8vw] py-[5vh] text-center" style={{ gap: lu(2.6), background: 'radial-gradient(ellipse closest-side, #060810 64%, rgba(6,8,16,0.85) 82%, transparent 100%)' }}
        variants={staggerChildren(130)} initial="initial" animate="animate">
        <motion.h1 variants={riseIn(reduced)} className="font-black leading-none" style={{ fontSize: tvType.display, color: '#fff', textShadow: `0 0 60px ${tie ? TB.cyan : TB.gold}88` }}>
          {tie ? t('tvCinema.taboo.tie', 'Unentschieden!') : t('tvCinema.taboo.teamWins', '{{team}} gewinnt!', { team: win.name })}
        </motion.h1>
        <motion.div variants={riseIn(reduced)} className="flex flex-wrap justify-center" style={{ gap: lu(2) }}>
          {(tie ? [...teams[0].members, ...teams[1].members] : win.members).map((m, i) => (
            <div key={memberKey(m, i)} className="flex flex-col items-center" style={{ gap: lu(0.8) }}>
              <TVPlayerAvatar id={m.id} name={m.name} avatar={m.avatar} color={m.color} size={lu(9)} active={!tie} />
              <span className="font-bold" style={{ fontSize: tvType.body, color: TB.text }}>{m.name}</span>
            </div>
          ))}
        </motion.div>
        <motion.div variants={riseIn(reduced)} className="flex items-center font-black tabular-nums" style={{ gap: lu(3), fontSize: tvType.display, color: '#fff' }}>
          <span style={{ textShadow: `0 0 30px ${win.color}` }}>{win.score}</span>
          <span style={{ fontSize: tvType.title, color: TB.dim }}>:</span>
          <span style={{ color: TB.dim }}>{lose.score}</span>
        </motion.div>
        {!tie && (
          <motion.span variants={riseIn(reduced)} className="font-semibold" style={{ fontSize: tvType.body, color: TB.dim }}>
            {t('tvCinema.taboo.against', 'gegen {{team}}', { team: lose.name })}
          </motion.span>
        )}
      </motion.div>
    </>
  );
}
