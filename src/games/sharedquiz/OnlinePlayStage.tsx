/**
 * Spielbildschirm von GETEILT GEQUIZZT online — inklusive 🔁-Gaesten am
 * Host-Handy (guest-roles.ts). Auf einem geteilten Handy ist immer hoechstens
 * EINE Rolle sichtbar: die des Platzes, der es gerade haelt.
 */
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Users, Check } from 'lucide-react';

import { KnowledgeStage } from './KnowledgeStage';
import { roleOf, roleViewFor, currentAnswerer, sharesRoles, type RoleQuestion, type RoleView, type SharedMode } from './guest-roles';
import type { SharedQuizGuests } from './useSharedQuizGuests';
import type { GuestHandover } from '../ui/useGuestHandover';
import { playerGlow } from '@/lib/party-motion';

const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

interface Seat { id: string; name: string; color: string }

export function OnlinePlayStage({ mode, q, players, roleIndices, answered, round, totalRounds, myId, handover, guests, onAnswer, children }: {
  mode: SharedMode; q: RoleQuestion; players: Seat[]; roleIndices: [number, number, number]; answered: number;
  round: number; totalRounds: number; myId: string | undefined; handover: GuestHandover; guests: SharedQuizGuests;
  onAnswer: (index: number) => void; children?: ReactNode;
}) {
  const { t } = useTranslation();
  const [ownOpen, setOwnOpen] = useState(false);
  const roleLabels = [t('games.sharedquiz.roleQuestion'), t('games.sharedquiz.roleAnswers'), t('games.sharedquiz.hintLabel')];
  const seatOf = (id: string | null | undefined) => players.find(p => p.id === id);
  const ownRole = myId ? roleOf(players, roleIndices, myId) : -1;
  const holder = handover.activeGuest;
  const shared = sharesRoles(guests.roleSeats) || guests.roleSeats.some(seat => handover.isGuest(seat));

  const stage = (body: ReactNode) => (
    <KnowledgeStage title={t('games.sharedquiz.title')} mode={t(`gameModes.sharedquiz.${mode}.name`)} round={round} total={totalRounds}
      players={roleIndices.map(i => players[i]?.name ?? '')} labels={roleLabels}
      active={mode === 'trio' ? (holder ? roleOf(players, roleIndices, holder) : ownRole) : answered} completed={mode === 'trio' ? 0 : answered}>
      {children}{body}
    </KnowledgeStage>
  );

  const card = (seat: Seat, view: RoleView, onCover?: () => void, answer?: (i: number) => void) => (
    <RoleCard seat={seat} view={view} mode={mode} roleLabel={roleLabels[view.role]} onCover={onCover} onAnswer={answer} />
  );

  // 1) Ein Gast haelt das Handy: nur seine Rolle.
  if (holder) {
    const seat = seatOf(holder);
    if (!seat) return stage(null);
    const view = roleViewFor(mode, q, players, roleIndices, answered, holder);
    const finish = () => { guests.markSeen(holder); handover.done(); };
    return stage(card(seat, view,
      mode === 'trio' ? finish : undefined,
      view.canAnswer ? (i) => { onAnswer(i); finish(); } : undefined));
  }

  // 2) Kette / Alles-oder-nichts: wer antwortet gerade?
  if (mode !== 'trio') {
    const answerer = currentAnswerer(players, roleIndices, answered);
    const seat = seatOf(answerer);
    // Lokal (ein Handy, kein Raum) antwortet, wer gerade dran ist — wie bisher.
    const viewer = myId ?? answerer;
    const view = viewer ? roleViewFor(mode, q, players, roleIndices, answered, viewer) : null;
    const body = view?.canAnswer && seat && handover.state.status === 'idle'
      ? <><p className="knowledge-eyebrow">{t('games.sharedquiz.modeAnswerTurn', { name: seat.name, n: answered + 1 })}</p>{card(seat, view, undefined, onAnswer)}</>
      : <div className="knowledge-wait" data-testid="sharedquiz-wait"><Users size={36}/><h2>{seat?.name}</h2><p>{t('games.sharedquiz.modeAnswerTurn', { name: seat?.name, n: answered + 1 })}</p></div>;
    return stage(<>{body}<p className="mt-7 text-sm leading-relaxed">{t(`games.sharedquiz.${mode === 'chain' ? 'chainRules' : 'allRules'}`)}</p></>);
  }

  // 3) Trio, nur eine Rolle an diesem Handy: wie bisher, offen sichtbar.
  const own = seatOf(myId);
  if (!shared) {
    if (!own || ownRole < 0) return stage(<div className="knowledge-wait"><Users size={36}/><p>{t('nativeExtra.gameLobby.waitingForPlayers')}</p></div>);
    const view = roleViewFor(mode, q, players, roleIndices, answered, own.id);
    return stage(card(own, view, undefined, view.canAnswer ? onAnswer : undefined));
  }

  // 4) Trio, mehrere Rollen an diesem Handy: eigene Rolle zuerst, dann Uebersicht.
  if (own && ownRole >= 0 && (!guests.seen.includes(own.id) || ownOpen)) {
    const view = roleViewFor(mode, q, players, roleIndices, answered, own.id);
    const cover = () => { guests.markSeen(own.id); setOwnOpen(false); };
    return stage(card(own, view, cover, view.canAnswer ? (i) => { onAnswer(i); cover(); } : undefined));
  }
  return stage(
    <div data-testid="sharedquiz-shared-hub">
      <p className="knowledge-eyebrow">{t('games.sharedquiz.sharedPhoneTitle', 'Rollen an diesem Handy')}</p>
      <p className="mb-5 text-sm">{t('games.sharedquiz.sharedPhoneHint', 'Jede Rolle nur selbst ansehen – die anderen schauen weg.')}</p>
      <div className="grid gap-3">
        {guests.roleSeats.map(id => {
          const seat = seatOf(id); if (!seat) return null;
          const mine = id === myId;
          return <button key={id} type="button" data-testid={`sharedquiz-view-${id}`}
            onClick={() => (mine ? setOwnOpen(true) : guests.review(id))}
            className="flex min-h-[56px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-left"
            style={{ boxShadow: playerGlow(seat.color) }}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-white" style={{ background: seat.color }}>{seat.name.slice(0, 1).toUpperCase()}</span>
            <span className="flex-1">
              <span className="block text-xs uppercase tracking-widest opacity-60">{roleLabels[roleOf(players, roleIndices, id)]}</span>
              <span className="block font-bold">{mine ? t('games.sharedquiz.viewMyRole', 'Meine Rolle ansehen') : t('games.sharedquiz.viewGuestRole', '{{name}}: Rolle ansehen', { name: seat.name })}</span>
            </span>
            {guests.seen.includes(id) ? <Check size={18} aria-label={t('games.sharedquiz.seenBadge', 'angesehen')} /> : <Eye size={18} />}
          </button>;
        })}
      </div>
    </div>,
  );
}

function RoleCard({ seat, view, mode, roleLabel, onCover, onAnswer }: {
  seat: Seat; view: RoleView; mode: SharedMode; roleLabel?: string; onCover?: () => void; onAnswer?: (i: number) => void;
}) {
  const { t } = useTranslation();
  return <div data-testid="sharedquiz-role-card" data-player-id={seat.id} data-role={view.role}>
    <p className="knowledge-eyebrow">{mode === 'trio' ? `${seat.name} · ${roleLabel ?? ''}` : seat.name}</p>
    {view.question && <><h2>{view.question}</h2>{mode === 'trio' && <p className="mt-8 text-sm">{t('games.sharedquiz.readQuestion')}</p>}</>}
    {view.answers.length > 0 && <div className="knowledge-choices">{view.answers.map((answer, i) => onAnswer
      ? <button key={i} type="button" data-testid={`sharedquiz-answer-${i}`} className="knowledge-choice" onClick={() => onAnswer(i)}><span>{ANSWER_LABELS[i]}</span><span>{answer}</span></button>
      : <div key={i} className="knowledge-choice"><span>{ANSWER_LABELS[i]}</span><span>{answer}</span></div>)}</div>}
    {view.role === 1 && mode === 'trio' && <p className="mt-8 text-sm">{t('games.sharedquiz.readAnswers')}</p>}
    {view.hint && <><h2>{view.hint}</h2><p className="mt-6 text-sm">{t('games.sharedquiz.readHintAndAnswer')}</p>
      {onAnswer && <div className="knowledge-choices grid-cols-2">{ANSWER_LABELS.map((label, i) => <button key={label} type="button" data-testid={`sharedquiz-answer-${i}`} className="knowledge-choice justify-center" onClick={() => onAnswer(i)}><span>{label}</span></button>)}</div>}</>}
    {onCover && <button type="button" data-testid="sharedquiz-cover" onClick={onCover}
      className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-white/15 text-sm font-semibold">
      <EyeOff size={18} /> {t('games.sharedquiz.coverRole', 'Gesehen – zudecken')}
    </button>}
  </div>;
}
