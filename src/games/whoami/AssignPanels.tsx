import type { ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, EyeOff, Play, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listStagger, partyMotion, pressable } from '@/lib/party-motion';
import { StageAction } from '../ui/GameStage';
import OnlineWaiting from '../multiplayer/OnlineWaiting';
import { DEPTH, PartyStage, SeatAvatar, SecretName } from './party-ui';
import type { CharacterView } from './party-seats';

interface Seat { id: string; name: string; avatar: string; color: string; character: string }
type Shown = { player: Seat; view: Exclude<CharacterView, { kind: 'hidden' }> };

/**
 * Online-Verteilen: jede Person sieht die Figuren aller anderen — nie die
 * eigene. Am Host-Handy mit 🔁-Gaesten schaut zuerst der Host, dann jeder
 * Gast nach verdeckter Weitergabe; Figuren von Plaetzen an diesem Handy nur
 * mit Halte-Geste.
 */
const listNames = (names: string[], language: string) => {
  try { return new Intl.ListFormat(language, { type: 'conjunction' }).format(names); } catch { return names.join(', '); }
};

export function OnlineAssign({ holder, shown, isHost, hasGuests, holderIsGuest, holderPending, allSeen, notSeen = [], onSeen, onStart, footer }: {
  holder?: Seat; shown: Shown[]; isHost: boolean; hasGuests: boolean; holderIsGuest: boolean;
  /** Der Halter muss die Karten noch bestaetigen (Kette am Host-Handy). */
  holderPending: boolean;
  /** Alle Plaetze an diesem Handy haben die Karten gesehen. */
  allSeen: boolean;
  /** Seats at this phone still to see the cards: Start stays disabled and names them. */
  notSeen?: string[];
  onSeen: () => void; onStart: () => void; footer: ReactNode;
}) {
  const { t, i18n } = useTranslation();
  const reduce = !!useReducedMotion();
  const blocked = notSeen.length > 0;
  return (
    <PartyStage testId="whoami-assign" seat={holder} eyebrow={t('games.whoami.setup.heading')}
      title={holder ? t('games.whoami.party.theOthersAre', 'Das sind die anderen') : t('native.gameNames.werBinIch')}
      subtitle={t('games.whoami.party.notYours', 'Deine eigene Figur bleibt geheim — die musst du erfragen.')}>
      <motion.ul variants={listStagger} initial="initial" animate="animate" className="grid max-h-[46dvh] gap-2.5 overflow-y-auto pb-1" aria-label={t('games.whoami.onlineRoles')}>
        {shown.map(({ player, view }) => (
          <motion.li key={player.id} variants={partyMotion('cardEnter', reduce)} className="flex items-center gap-3 rounded-2xl border border-white/10 px-3.5 py-3"
            style={{ background: DEPTH.panel, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }} data-testid="whoami-identity-card" data-player-id={player.id}>
            <SeatAvatar seat={player} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.8125rem] font-semibold text-white/60">{player.name}</p>
              <SecretName view={view} color={player.color} className="text-lg font-extrabold text-white" />
            </div>
          </motion.li>
        ))}
      </motion.ul>
      {holderPending && hasGuests ? (
        <motion.button {...pressable} type="button" data-testid="whoami-assign-seen" onClick={onSeen}
          className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-6 font-extrabold text-[#0b0b12]">
          {holderIsGuest ? <><Check className="h-5 w-5" aria-hidden /> {t('games.whoami.party.seenCover', 'Gesehen – zudecken')}</>
            : <>{t('games.whoami.party.seenPass', 'Gesehen – Handy weitergeben')} <ArrowRight className="h-5 w-5" aria-hidden /></>}
        </motion.button>
      ) : isHost ? (
        <>
          {hasGuests && allSeen && (
            <motion.p variants={partyMotion('checkPop', reduce)} initial="initial" animate="animate" role="status"
              className="flex items-center justify-center gap-2 text-[0.8125rem] font-semibold text-emerald-300">
              <Users className="h-4 w-4" aria-hidden /> {t('games.whoami.party.allSeen', 'Alle am Handy haben die Karten gesehen')}
            </motion.p>
          )}
          <motion.button {...(blocked ? {} : pressable)} type="button" data-testid="whoami-assign-start" onClick={onStart} disabled={blocked}
            aria-describedby={blocked ? 'whoami-not-seen' : undefined}
            className="flex min-h-14 items-center justify-center gap-2 rounded-full px-6 font-extrabold text-[#0b0b12] disabled:opacity-45"
            style={{ background: 'linear-gradient(90deg, #ef987e, #d779ff)', boxShadow: blocked ? 'none' : '0 12px 32px -10px rgba(239,152,126,0.7)' }}>
            <Play className="h-5 w-5" aria-hidden /> {t('games.whoami.assign.startGame')}
          </motion.button>
          {blocked
            ? <p id="whoami-not-seen" role="status" data-testid="whoami-not-seen" className="text-center text-sm font-semibold text-white/75">
                {t('games.whoami.party.notSeenYet', 'Noch nicht gesehen: {{names}}', { names: listNames(notSeen, i18n.language) })}</p>
            : <p className="text-center text-[0.8125rem] font-semibold text-white/60">{t('games.whoami.party.startWhenReady', 'Starte, sobald alle ihre Karten gesehen haben.')}</p>}
        </>
      ) : <OnlineWaiting />}
      {footer}
    </PartyStage>
  );
}

/** Lokales Reihum-Verteilen: Handy wandert, Karte nur nach Tippen sichtbar (unveraendert). */
export function LocalAssign({ player, revealed, isLast, onReveal, onNext }: {
  player?: Seat; revealed: boolean; isLast: boolean; onReveal: () => void; onNext: () => void;
}) {
  const { t } = useTranslation();
  return (
    <motion.div key="assign" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="identity-phase flex-1 flex flex-col items-center justify-center gap-5 px-4">
      <Users className="w-8 h-8 text-[#ef987e]" />
      <h2 className="text-xl font-extrabold text-center">{t('games.whoami.assign.passPhone', { name: player?.name })}</h2>
      <p className="flex items-center justify-center gap-2 text-base text-white/75 text-center"><EyeOff className="h-5 w-5 shrink-0" aria-hidden />{t('games.whoami.assign.dontLook', { name: player?.name })}</p>
      <motion.button onClick={() => { if (!revealed) onReveal(); }} whileTap={!revealed ? { scale: 0.97 } : {}}
        className="identity-flip w-full max-w-sm p-6 text-center relative overflow-hidden cursor-pointer">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#ef987e] to-[#e4cec0]" />
        <div className="flex items-center justify-center gap-2 mb-3">
          {player && <SeatAvatar seat={player} size={44} />}
        </div>
        <div className="text-white/75 text-sm mb-2">{t('games.whoami.assign.playerIs', { name: player?.name })}</div>
        <AnimatePresence mode="wait">
          {revealed ? (
            <motion.div key="revealed" initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
              <div className="text-3xl font-extrabold text-[#ef987e] mb-1">{player?.character}</div>
            </motion.div>
          ) : (
            <motion.div key="hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-5xl mb-2">❓</div>
              <div className="text-sm text-[#e4cec0] font-bold animate-pulse">{t('games.whoami.assign.tapToReveal')}</div>
              <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm text-white/75" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <EyeOff className="h-4 w-4 shrink-0" aria-hidden />{t('games.whoami.assign.ensureNotWatching', { name: player?.name })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      {revealed && (
        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.97 }} onClick={onNext}
          className="identity-handoff-next flex items-center justify-center gap-2 bg-[#ef987e] text-[#302624] px-6 py-3.5 rounded h-auto min-h-14 font-extrabold">
          {isLast ? <><Play className="w-5 h-5" /> {t('games.whoami.assign.startGame')}</> : <>{t('games.whoami.assign.next')} <ArrowRight className="w-5 h-5" /></>}
        </motion.button>
      )}
    </motion.div>
  );
}

/** Kleiner Ausstieg unter den Party-Buehnen. */
export function ExitLink({ onExit }: { onExit: () => void }) {
  const { t } = useTranslation();
  return <StageAction variant="ghost" onClick={onExit}>{t('games.whoami.exitGame')}</StageAction>;
}
