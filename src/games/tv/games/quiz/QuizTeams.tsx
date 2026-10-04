import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Crown } from 'lucide-react';
import { partyEase, playerGlow } from '@/lib/party-motion';
import { tvType } from '../../tv-tokens';
import { lu } from '../../components/tv-lobby-scale';
import TVPlayerAvatar from '../../cinema/TVPlayerAvatar';
import { activeRole, QZ, type QuizPlayer, type TeamState } from './quiz-model';

/**
 * SplitQuiz: Tauziehen-Balken + beide Teamkarten mit jedem Mitglied als
 * Avatar. Teamfarbe nur als Licht/Flaeche, Schrift bleibt weiss.
 */
export function SplitQuizTeams({ teamA, teamB, info }: { teamA: TeamState; teamB: TeamState; info: QuizPlayer[] }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const total = teamA.score + teamB.score;
  const aFraction = total > 0 ? teamA.score / total : 0.5;
  const byName = (name: string) => info.find((p) => p.name === name);

  return (
    <div className="flex w-full flex-col gap-[1.4vh]" data-testid="tv-split-teams">
      <div className="relative flex h-[1.6vh] overflow-hidden rounded-full" style={{ background: teamB.color }}>
        <motion.div className="h-full w-full origin-left" style={{ background: teamA.color }}
          initial={false} animate={{ scaleX: aFraction }} transition={{ duration: 0.9, ease: partyEase.out }} />
        <div className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2" style={{ background: '#060810' }} />
      </div>
      <div className="grid grid-cols-2 gap-[1.6vw]">
        {[teamA, teamB].map((team, i) => {
          const other = i === 0 ? teamB : teamA;
          const leading = team.score > other.score;
          return (
            <motion.div key={i} className="flex items-center gap-[1.2vw] rounded-[28px] px-[1.6vw] py-[1.4vh]"
              style={{ background: `linear-gradient(135deg, ${team.color}26, #0d0915 65%)`, boxShadow: playerGlow(team.color, leading ? 'active' : 'soft') }}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: partyEase.out, delay: 0.15 * i }}>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-center gap-2">
                  {leading && <Crown aria-hidden style={{ width: lu(3), height: lu(3), color: '#FFD23F' }} />}
                  <span className="truncate font-black" style={{ fontSize: tvType.body, color: QZ.text }}>{team.name}</span>
                  <span className="font-bold" style={{ fontSize: tvType.label, color: QZ.dim }}>
                    {t('tvCinema.quiz.teamCorrect', '{{count}} richtig', { count: team.correctCount })}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {team.players.map((name, pi) => {
                    const p = byName(name);
                    return (
                      <span key={`${name}-${pi}`} className="flex items-center gap-2 rounded-full py-1 pe-3 ps-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <TVPlayerAvatar id={p?.id} name={name} avatar={p?.avatar} color={p?.color || team.color} size={lu(4)} />
                        <span className="font-bold" style={{ fontSize: tvType.label, color: QZ.text }}>{name}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
              <motion.span key={team.score} className="font-black tabular-nums" style={{ fontSize: tvType.display, color: QZ.text, textShadow: `0 0 30px ${team.color}` }}
                initial={reduced ? { opacity: 0.4 } : { scale: 1.3 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', duration: 0.5, bounce: 0.4 }}>
                {team.score}
              </motion.span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * SharedQuiz: drei Rollen (liest Frage · liest Optionen · raet). Die Rollen
 * sind oeffentlich — am Handy stehen sie im Rundenauftakt fuer alle sichtbar.
 * Die gerade aktive Rolle leuchtet, die anderen treten zurueck.
 */
export function SharedQuizRoles({ players, roleIndices, phase, large = false }: {
  players: QuizPlayer[]; roleIndices: number[]; phase: string; large?: boolean;
}) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  if (roleIndices.length < 3 || players.length === 0) return null;
  const active = activeRole(phase);
  const roles = [
    { icon: '❓', label: t('tvCinema.quiz.roleQuestion', 'liest die Frage'), idx: roleIndices[0] },
    { icon: '💬', label: t('tvCinema.quiz.roleOptions', 'liest die Optionen'), idx: roleIndices[1] },
    { icon: '🎯', label: t('tvCinema.quiz.roleGuess', 'rät die Antwort'), idx: roleIndices[2] },
  ];
  return (
    <div className="flex items-stretch justify-center gap-[2vw]" data-testid="tv-shared-roles">
      {roles.map((r, i) => {
        const p = players[r.idx % players.length];
        if (!p) return null;
        const on = active === i;
        const dim = active >= 0 && !on;
        return (
          <motion.div key={i} className="flex flex-col items-center gap-3 rounded-[28px] px-[2vw] py-[2.4vh]"
            style={{ minWidth: large ? lu(30) : lu(22), background: on ? `linear-gradient(160deg, ${p.color || QZ.purple}33, #16101f 70%)` : '#0d0915',
              border: '1px solid rgba(255,255,255,0.08)', boxShadow: on ? playerGlow(p.color || QZ.purple, 'active') : 'none' }}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: dim ? 0.45 : 1, y: 0, scale: on && !reduced ? 1.04 : dim ? 0.96 : 1 }}
            transition={{ duration: 0.5, ease: partyEase.out, delay: 0.1 * i }}>
            <span aria-hidden style={{ fontSize: large ? lu(4.4) : lu(3.2) }}>{r.icon}</span>
            <TVPlayerAvatar id={p.id} name={p.name} avatar={p.avatar} color={p.color} size={large ? lu(11) : lu(7)} active={on} />
            <span className="font-black" style={{ fontSize: large ? tvType.title : tvType.body, color: QZ.text }}>{p.name}</span>
            <span className="font-bold" style={{ fontSize: tvType.label, color: on ? QZ.text : QZ.dim }}>{r.label}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
