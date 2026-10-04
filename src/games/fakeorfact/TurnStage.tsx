import { motion } from 'framer-motion';
import { Check, Hourglass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SeatAvatar, SeatIcon } from '@/components/native/party/PartySheet';
import { checkPop, playerGlow } from '@/lib/party-motion';
import type { Player } from './game-model';
import type { TurnMark } from './turn-order';

/** Hex colour + alpha byte, for the 18 % player light behind the stage. */
const tint = (hex: string, alpha: string) => (/^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${alpha}` : 'rgba(120,217,219,.18)');

/**
 * Who judges now (design §9.1/9.2): big avatar in the player's own light,
 * "Du bist dran" / "Max ist dran", a 🔁 chip when a guest holds the host
 * phone, the clock, and a ✓ · now · open row so the room sees the progress.
 */
export function TurnStage({ player, mine, guestHere, round, total, timeLeft, timerSec, marks, players }: {
  player: Player | null;
  mine: boolean;
  guestHere: boolean;
  round: number;
  total: number;
  timeLeft: number;
  timerSec: number;
  marks: { id: string; mark: TurnMark }[];
  players: Player[];
}) {
  const { t } = useTranslation();
  if (!player) return null;
  const pct = timerSec > 0 ? Math.max(0, Math.min(100, (timeLeft / timerSec) * 100)) : 0;
  const urgent = timeLeft <= 5;
  return (
    <section data-testid="fof-turn-stage" className="fof-stage relative w-full overflow-hidden px-4 pt-4 pb-3"
      style={{ background: `radial-gradient(120% 90% at 50% 0%, ${tint(player.color, mine ? '2e' : '14')}, transparent 70%)` }}>
      <div className="mx-auto flex w-full max-w-[58rem] items-center gap-4">
        <motion.span key={player.id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="rounded-full" style={{ boxShadow: playerGlow(player.color, mine ? 'active' : 'soft') }}>
          <SeatAvatar avatar={player.avatar} color={player.color} size={64} />
        </motion.span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.8125rem] font-semibold text-white/60">
            {mine ? t('games.fakeorfact.yourTurn', 'Du bist dran') : t('games.fakeorfact.playerTurn', { name: player.name, defaultValue: '{{name}} ist dran' })}
          </p>
          <h2 className="truncate text-[1.75rem] font-extrabold leading-tight text-white">{player.name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.8125rem] font-semibold text-white/50">
            <span className="tabular-nums">{t('games.fakeorfact.round', { current: round, total })}</span>
            {guestHere && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-white/70">
                <SeatIcon guest /> {t('games.fakeorfact.onHostPhone', 'Am Host-Handy')}
              </span>
            )}
          </div>
        </div>
        <span className={`newsroom-clock tabular-nums${urgent ? ' is-urgent' : ''}`} role="timer"
          aria-label={t('games.fakeorfact.timeLeft', { seconds: Math.ceil(timeLeft), defaultValue: 'Noch {{seconds}} Sekunden' })}>
          {Math.ceil(timeLeft)}<small>s</small>
        </span>
      </div>
      <div className="mx-auto mt-3 h-1.5 w-full max-w-[58rem] overflow-hidden rounded-full bg-white/[0.06]" aria-hidden>
        <motion.div className="h-full rounded-full" style={{ background: player.color }}
          animate={{ width: `${pct}%` }} transition={{ duration: 0.4, ease: 'linear' }} />
      </div>
      {marks.length > 1 && (
        <ol className="mx-auto mt-3 flex w-full max-w-[58rem] flex-wrap items-center gap-2" aria-label={t('games.fakeorfact.progressLabel', 'Wer schon entschieden hat')}>
          {marks.map(({ id, mark }) => {
            const p = players.find(x => x.id === id);
            if (!p) return null;
            return (
              <li key={id} className="relative" title={p.name}
                aria-label={`${p.name}: ${mark === 'done' ? t('games.fakeorfact.markDone', 'hat entschieden') : mark === 'now' ? t('games.fakeorfact.markNow', 'ist dran') : t('games.fakeorfact.markOpen', 'kommt noch')}`}>
                <span className="block rounded-full" style={mark === 'now' ? { boxShadow: playerGlow(p.color, 'active') } : undefined}>
                  <SeatAvatar avatar={p.avatar} color={p.color} size={30} dimmed={mark === 'open'} />
                </span>
                {mark === 'done' && (
                  <motion.span variants={checkPop} initial="initial" animate="animate"
                    className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-[#78d9db] text-[#11282a]">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </motion.span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

/** Not this phone's turn: calm stage instead of greyed-out buttons. */
export function WaitingStrip({ player, answered }: { player: Player | null; answered: boolean }) {
  const { t } = useTranslation();
  return (
    <div role="status" className="fof-waiting mx-auto flex w-full max-w-[58rem] items-center gap-3 rounded-2xl border border-white/10 bg-[#0d0915] px-4 py-4"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)' }}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/[0.06] text-[#78d9db]">
        {answered ? <Check className="h-5 w-5" /> : <Hourglass className="h-5 w-5" />}
      </span>
      <div className="min-w-0">
        <p className="text-base font-semibold text-white">
          {player ? t('games.fakeorfact.waitingFor', { name: player.name, defaultValue: '{{name}} entscheidet gerade …' }) : null}
        </p>
        <p className="text-[0.8125rem] font-semibold text-white/55">
          {answered ? t('games.fakeorfact.answerLocked', 'Deine Antwort ist gespeichert – gleich kommt die Auflösung') : t('games.fakeorfact.turnSoon', 'Du kommst gleich dran')}
        </p>
      </div>
    </div>
  );
}
