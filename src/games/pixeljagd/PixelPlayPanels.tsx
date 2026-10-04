/**
 * PIXELJAGD — Bedienflaechen unter dem Bild: Aufloesung, Buzz-Urteil,
 * Eingabe (Buzzer/Text) und Punktestand. Online spielt jedes Handy nur seine
 * eigenen Plaetze; am Host-Handy sind das Host + 🔁-Gaeste als ein Team
 * (team-buzzer.ts).
 */
import { SeatAvatar } from '@/components/native/party/PartySheet';
import { avatarOrFallback } from '../multiplayer/seat-avatar';
import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Trophy, ChevronRight, X, Check, Zap } from 'lucide-react';
import { hasShellBackButton } from '../ui/shell-back';
import { partyMotion, playerGlow, pressable } from '@/lib/party-motion';
import { PartyTurnRibbon } from '../ui/PartyTurnRibbon';
import type { PixelPuzzle } from './pixeljagd-content';
import { PJ, type AnswerMode, type Player } from './pixeljagd-theme';
import { typistFor } from './team-buzzer';

/** Break at hyphens/spaces ("ALEXANDRA-" / "MARIE"), never mid-word. */
const NAME_WRAP = { wordBreak: 'normal', overflowWrap: 'break-word', hyphens: 'manual' } as const;

const initial = (p: Player) => avatarOrFallback(p.avatar, p.id);

export function RoundReveal({ puzzle, winner, isHost, onNext }: {
  puzzle: PixelPuzzle; winner: Player | undefined; isHost: boolean; onNext: () => void;
}) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  return (
    <motion.div key="reveal" variants={partyMotion('cardEnter', reduced)} initial="initial" animate="animate" exit="exit"
      className="relative z-10 px-4 mt-4">
      <div className="rounded-[28px] p-5 text-center" style={{ background: PJ.surface, boxShadow: winner ? playerGlow(winner.color) : undefined }}>
        <p className="text-[0.8125rem] font-semibold" style={{ color: PJ.dim }}>{t('games.pixeljagd.solution')}</p>
        <p dir="auto" className="text-2xl font-black mt-1">{puzzle.answer}</p>
        {winner ? (
          <p className="text-sm mt-2 flex items-center justify-center gap-2" style={{ color: PJ.primary }}>
            <Trophy className="w-4 h-4" />
            {t('games.pixeljagd.roundWinner', { name: winner.name })}
          </p>
        ) : (
          <p className="text-sm mt-2" style={{ color: PJ.dim }}>{t('games.pixeljagd.nobody')}</p>
        )}
        {/* Bildnachweis — immer sichtbar, sobald das Motiv aufgedeckt ist. */}
        <p className="text-[13px] mt-3 leading-snug" style={{ color: PJ.dim }}>
          {t('games.pixeljagd.credit')}:{' '}
          {puzzle.sourceUrl ? (
            <a href={puzzle.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{puzzle.credit}</a>
          ) : puzzle.credit}
          {/* Aenderungshinweis ist Lizenzpflicht, nicht Hoeflichkeit: CC-BY
              verlangt, Bearbeitungen kenntlich zu machen — und die Verpixelung
              IST eine Bearbeitung. */}
          {' · '}{t('games.pixeljagd.modified')}
        </p>
        <motion.button {...pressable} disabled={!isHost} onClick={onNext}
          className="mt-4 w-full min-h-12 rounded-2xl font-black flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: PJ.primary, color: PJ.bg }}>
          {t('games.pixeljagd.next')} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
        </motion.button>
      </div>
    </motion.div>
  );
}

/**
 * Zweistufig, und das ist der Kern des Spiels: Wer gebuzzert hat, sagt die
 * Antwort LAUT. Erst danach deckt die Gruppe die Loesung auf und vergleicht.
 */
export function BuzzedCard({ buzzer, myId, isOnline, isHost, solutionShown, answer, onShow, onJudge }: {
  buzzer: Player | undefined; myId: string | null; isOnline: boolean; isHost: boolean; solutionShown: boolean;
  answer: string | undefined; onShow: () => void; onJudge: (correct: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-[28px] p-5 text-center" style={{ background: PJ.surface }}>
      {isOnline && buzzer ? (
        <PartyTurnRibbon player={buzzer} kind={buzzer.id === myId ? 'me' : 'other'}
          line={t('games.pixeljagd.sayItLoud', 'Sag die Lösung laut!')} />
      ) : (
        <p className="text-sm font-bold">{t('games.pixeljagd.buzzedSay', { name: buzzer?.name ?? '' })}</p>
      )}
      {!solutionShown ? (
        <>
          <p className="text-[13px] mt-2" style={{ color: PJ.dim }}>{t('games.pixeljagd.sayThenReveal')}</p>
          <motion.button {...pressable} disabled={!isHost} onClick={onShow}
            className="w-full min-h-12 rounded-2xl font-black mt-4 disabled:opacity-50"
            style={{ background: PJ.accent, color: PJ.bg }}>
            {t('games.pixeljagd.revealSolution')}
          </motion.button>
        </>
      ) : (
        <>
          <p className="text-[13px] mt-3" style={{ color: PJ.dim }}>{t('games.pixeljagd.solution')}</p>
          <p dir="auto" className="text-xl font-black mt-1" style={{ color: PJ.accent }}>{answer}</p>
          <p className="text-[13px] mt-2" style={{ color: PJ.dim }}>{t('games.pixeljagd.groupDecides')}</p>
          <div className="flex gap-2 mt-4">
            <motion.button {...pressable} disabled={!isHost} onClick={() => onJudge(false)}
              className="flex-1 min-h-12 rounded-2xl font-black flex items-center justify-center gap-1 disabled:opacity-50"
              style={{ background: PJ.bad, color: PJ.bg }}>
              <X className="w-4 h-4" /> {t('games.pixeljagd.wrong')}
            </motion.button>
            <motion.button {...pressable} disabled={!isHost} onClick={() => onJudge(true)}
              className="flex-1 min-h-12 rounded-2xl font-black flex items-center justify-center gap-1 disabled:opacity-50"
              style={{ background: PJ.primary, color: PJ.bg }}>
              <Check className="w-4 h-4" /> {t('games.pixeljagd.correct')}
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}

/** Avatar-Taste fuer einen Platz an diesem Handy (Buzz oder „Wer tippt?“). */
function SeatKey({ player, onPress, disabled, pressed, big }: {
  player: Player; onPress: () => void; disabled?: boolean; pressed?: boolean; big?: boolean;
}) {
  return (
    <motion.button {...pressable} type="button" onClick={onPress} disabled={disabled} aria-pressed={pressed}
      data-testid="pixel-seat-key" data-player-id={player.id}
      className={`flex items-center gap-3 rounded-[20px] px-3 font-black text-start disabled:opacity-35 ${big ? 'min-h-[72px]' : 'min-h-14'}`}
      style={{
        background: player.locked ? PJ.surface : pressed === false ? PJ.elevated : `radial-gradient(120% 140% at 0% 50%, ${player.color}55 0%, ${PJ.elevated} 70%)`,
        boxShadow: player.locked ? undefined : playerGlow(player.color, pressed ? 'active' : 'soft'),
        color: player.locked ? PJ.dim : PJ.text,
      }}>
      <SeatAvatar avatar={initial(player)} color={player.color} size={44} dimmed={player.locked} />
      <span className="min-w-0 flex-1">
        <span dir="auto" className="block line-clamp-2 text-base leading-tight" style={NAME_WRAP}>{player.name}</span>
        <span className="block text-[13px] font-bold tabular-nums opacity-70">{player.score}</span>
      </span>
    </motion.button>
  );
}

export function AnswerPad({ answerMode, isOnline, players, localSeats, imageReady, onBuzz, onText }: {
  answerMode: AnswerMode; isOnline: boolean; players: Player[];
  /** Online: Plaetze dieses Handys (Host + 🔁-Gaeste). Offline unbenutzt — alle buzzern am selben Handy. */
  localSeats: string[]; imageReady: boolean;
  onBuzz: (pid: string) => void; onText: (pid: string, text: string) => void;
}) {
  const { t } = useTranslation();
  const [guess, setGuess] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  const mine = players.filter(p => localSeats.includes(p.id));
  const team = isOnline && mine.length > 1;
  const typist = typistFor(choice, localSeats, players);
  const teamHint = team && (
    <p className="text-center text-[0.8125rem] font-semibold mb-2" style={{ color: PJ.dim }}>
      {t('games.pixeljagd.teamHint', 'Ihr ratet als Team – eine falsche Antwort sperrt das ganze Handy.')}
    </p>
  );

  if (answerMode === 'text' && isOnline) {
    const locked = !typist;
    return (
      <>
        {teamHint}
        {team && (
          <div className="mb-3">
            <p className="text-[0.8125rem] font-semibold mb-2" style={{ color: PJ.dim }}>{t('games.pixeljagd.whoTypes', 'Wer tippt?')}</p>
            <div className="grid grid-cols-2 gap-2">
              {mine.map(p => <SeatKey key={p.id} player={p} disabled={p.locked} pressed={p.id === typist} onPress={() => setChoice(p.id)} />)}
            </div>
          </div>
        )}
        <form onSubmit={(e) => {
          e.preventDefault();
          if (typist && guess.trim()) { onText(typist, guess); setGuess(''); }
        }} className="flex gap-2">
          <input value={guess} onChange={(e) => setGuess(e.target.value)} disabled={locked || !imageReady} dir="auto"
            aria-label={t('games.pixeljagd.typeGuess')} maxLength={200}
            placeholder={locked ? t('games.pixeljagd.lockedOut') : t('games.pixeljagd.typeGuess')}
            className="flex-1 min-h-12 px-4 rounded-2xl text-base outline-none"
            style={{ background: PJ.surface, color: PJ.text }} />
          <motion.button {...pressable} type="submit" disabled={locked || !imageReady || !guess.trim()}
            className="px-5 min-h-12 rounded-2xl font-black disabled:opacity-40" style={{ background: PJ.primary, color: PJ.bg }}>
            {t('games.pixeljagd.send')}
          </motion.button>
        </form>
      </>
    );
  }

  if (isOnline) {
    // Jeder Platz an diesem Handy hat seine eigene Taste — wer es weiss, drueckt sein Bild.
    return (
      <>
        {teamHint}
        <p className="text-center text-[13px] mb-2" style={{ color: PJ.dim }}>{t('games.pixeljagd.buzzHint')}</p>
        <div className={`grid gap-2 ${mine.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {mine.map(p => <SeatKey key={p.id} big player={p} disabled={!imageReady || p.locked} onPress={() => onBuzz(p.id)} />)}
        </div>
      </>
    );
  }

  // Ein Handy, alle drumherum (unveraendert).
  return (
    <>
      <p className="text-center text-[13px] mb-2" style={{ color: PJ.dim }}>{t('games.pixeljagd.buzzHint')}</p>
      <div className="grid grid-cols-2 gap-2">
        {players.map((p) => (
          <button key={p.id} onClick={() => onBuzz(p.id)} disabled={!imageReady || p.locked}
            className="h-16 rounded-2xl font-black text-sm disabled:opacity-35"
            style={{ background: p.locked ? PJ.surface : p.color, color: p.locked ? PJ.dim : PJ.bg }}>
            {p.name}
            <span className="block text-[12px] font-bold opacity-80">{p.score}</span>
          </button>
        ))}
      </div>
    </>
  );
}

/** `hide`: seats that already show their score on a buzzer on this device — no duplicates. */
export function ScoreStrip({ players, hide = [] }: { players: Player[]; hide?: readonly string[] }) {
  const sorted = [...players].filter((p) => !hide.includes(p.id)).sort((a, b) => b.score - a.score);
  if (!sorted.length) return null;
  return (
    <div className="relative z-10 px-4 pb-10 flex flex-wrap gap-2 justify-center">
      {sorted.map((p) => (
        <div key={p.id} className="flex items-center gap-1.5 ps-1 pe-3 py-1 rounded-full text-[13px] font-bold tabular-nums"
          style={{ background: PJ.surface, boxShadow: playerGlow(p.color), opacity: p.locked ? 0.55 : 1 }}>
          <SeatAvatar avatar={initial(p)} color={p.color} size={24} />
          <span dir="auto">{p.name}</span> · {p.score}
        </div>
      ))}
    </div>
  );
}

export function ExitDialog({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(11,17,32,0.85)' }}>
      <div className="w-full max-w-xs rounded-3xl p-5 text-center" style={{ background: PJ.surface }}>
        <p className="font-black">{t('games.pixeljagd.leaveTitle')}</p>
        <p className="text-xs mt-1" style={{ color: PJ.dim }}>{t('games.pixeljagd.leaveBody')}</p>
        <div className="flex gap-2 mt-4">
          <button onClick={onStay} className="flex-1 min-h-11 rounded-2xl font-bold" style={{ background: PJ.primary, color: PJ.bg }}>
            {t('games.pixeljagd.leaveStay')}
          </button>
          <button onClick={onLeave} className="flex-1 min-h-11 rounded-2xl font-bold" style={{ border: `1px solid ${PJ.dim}`, color: PJ.dim }}>
            {t('games.pixeljagd.leaveGo')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PixelHeader({ round, total, points, onLeave }: { round: number; total: number; points: number; onLeave: () => void }) {
  const { t } = useTranslation();
  const shell = hasShellBackButton();
  return (
    <div className="relative z-10 px-4 pt-14 pb-3 flex items-center justify-between">
      {/* In der App löst der FloatingBackButton über den Back-Guard denselben
          Dialog aus — dort nur unsichtbar schalten, nicht entfernen, damit
          Runde und Punkte in der Kopfzeile stehen bleiben, wo sie waren. */}
      <button onClick={onLeave} className={`min-h-11 text-xs font-bold${shell ? ' invisible pointer-events-none' : ''}`}
        aria-hidden={shell} tabIndex={shell ? -1 : undefined} style={{ color: PJ.dim }}>
        ← {t('games.pixeljagd.leave')}
      </button>
      <div className="text-xs font-bold tabular-nums" style={{ color: PJ.dim }}>
        {t('games.pixeljagd.roundOf', { round, total })}
      </div>
      <div className="flex items-center gap-1 text-sm font-black tabular-nums" style={{ color: PJ.accent }}>
        <Zap className="w-4 h-4" aria-hidden /> {t('games.pixeljagd.pointsShort', '{{count}} Pkt.', { count: points })}
      </div>
    </div>
  );
}
