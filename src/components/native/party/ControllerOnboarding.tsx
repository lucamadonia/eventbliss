import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Clock3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useHaptics';
import { usePartySession } from '@/hooks/usePartySession';
import type { ControllerMember, ControllerPartyData } from '@/games/party/controller-api';
import { controllerErrorCode, describeControllerError } from '@/games/party/controller-errors';
import {
  claimControllerSeat, finishControllerOnboarding, ownMember, queueControllerProfile, refreshControllerParty, updateControllerProfile, type PlayerProfile,
} from '@/games/party/controller-session';
import { findSimilarGuest } from '@/games/party/guest-match';
import { checkPop, partyMotion, playerGlow } from '@/lib/party-motion';
import { PartySheet, SeatAvatar } from './PartySheet';
import { PlayerProfileEditor } from './PlayerProfileEditor';
import { usePartyScreenTrace } from './ui-trace';
import { whoAreYouSeats, WhoAreYou, type SeatNotice } from './WhoAreYou';

type Step = { kind: 'who' } | { kind: 'profile'; claimed: boolean } | { kind: 'pending'; guest: ControllerMember };
interface Props {
  data: ControllerPartyData; userId: string; busy: boolean;
  /** Full party, no own seat yet: only a guest seat can be taken (B13). */
  seatless?: boolean;
}

/** My own pending takeover (server marks it only for the claimer). */
export const myPendingClaim = (data: ControllerPartyData) => data.members.find(m => m.pending_claim_mine) ?? null;

/**
 * Fresh join: "Wer bist du?" → (claim | new seat) → profile → lobby.
 * Skips the question when there are no guest seats (masterplan 3.3, B09).
 */
export function ControllerOnboarding({ data, userId, busy, seatless = false }: Props) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const reduced = !!useReducedMotion();
  const party = usePartySession();
  const me = ownMember(data, userId);
  const { guests } = whoAreYouSeats(data.members, me?.player_id ?? null);
  const freeGuests = guests.filter(g => !g.pending_claim);
  const [step, setStep] = useState<Step>(() => {
    const pending = myPendingClaim(data);
    if (pending) return { kind: 'pending', guest: pending };
    return freeGuests.length ? { kind: 'who' } : { kind: 'profile', claimed: false };
  });
  const [similar, setSimilar] = useState<{ profile: PlayerProfile; guest: ControllerMember } | null>(null);
  const [notice, setNotice] = useState<SeatNotice | null>(null);
  const playing = data.party.status === 'playing';
  const hostName = data.members.find(m => m.is_host)?.name ?? '';
  const points = useMemo(() => Object.fromEntries([...(party.session?.players ?? []), ...(party.session?.archivedPlayers ?? [])].map(p => [p.id, p.totalScore])), [party.session]);
  const translate = (key: string, fallback: string) => t(key, fallback);
  const toNotice = (error: unknown): SeatNotice => {
    const message = error instanceof Error ? error.message : String(error);
    return { text: describeControllerError(message, translate) ?? message, code: controllerErrorCode(message) };
  };

  const claim = async (guest: ControllerMember, profile?: Partial<PlayerProfile>) => {
    setNotice(null); setSimilar(null);
    try {
      const next = await claimControllerSeat(guest.player_id, profile);
      haptics.success();
      // During a game the seat keeps its id and is only marked for me.
      const waiting = next?.members.find(m => m.player_id === guest.player_id && (m.pending_claim_mine ?? m.pending_claim));
      setStep(waiting ? { kind: 'pending', guest } : { kind: 'profile', claimed: true });
    } catch (error) {
      haptics.error();
      const seatNotice = toNotice(error);
      if (seatNotice.code === 'seat_taken' || seatNotice.code === 'not_guest') await refreshControllerParty();
      setNotice(seatNotice);
      setStep({ kind: 'who' });
    }
  };
  const saveNew = async (profile: PlayerProfile) => {
    setSimilar(null);
    if (!me) return;
    try {
      if (playing) queueControllerProfile(me.player_id, profile);
      else await updateControllerProfile(me.player_id, profile);
      finishControllerOnboarding();
    } catch (error) { setNotice(toNotice(error)); }
  };
  const submitProfile = (profile: PlayerProfile, claimed: boolean) => {
    const match = claimed ? null : findSimilarGuest(profile.name, freeGuests);
    if (match) { haptics.medium(); setSimilar({ profile, guest: match }); return; }
    void saveNew(profile);
  };

  const slide = partyMotion('cardEnter', reduced);

  return (
    <div className="mx-auto max-w-md pb-8">
      <AnimatePresence mode="wait">
        {step.kind === 'who' && (
          <motion.div key="who" variants={slide} initial="initial" animate="animate" exit="exit">
            <WhoAreYou hostName={hostName} members={data.members} ownPlayerId={me?.player_id ?? null} points={points}
              busy={busy} notice={notice} onPick={guest => void claim(guest)}
              fullNotice={seatless ? describeControllerError('party_full', translate) : null}
              onCreateNew={() => { setNotice(null); setStep({ kind: 'profile', claimed: false }); }} />
          </motion.div>
        )}

        {step.kind === 'profile' && me && (
          <motion.section key={`profile:${step.claimed}`} variants={slide} initial="initial" animate="animate" exit="exit" className="space-y-5" aria-labelledby="onboarding-profile">
            <header className="space-y-2">
              <motion.p variants={partyMotion('checkPop', reduced)} initial="initial" animate="animate" className="text-xs font-semibold uppercase tracking-[.2em] text-[#8ff5ff]">
                {step.claimed ? t('partyPlay.onboarding.claimed', 'Willkommen zurück') : t('partyPlay.onboarding.joined', 'Du bist dabei ✓')}
              </motion.p>
              <h1 id="onboarding-profile" className="text-3xl font-black tracking-tight">{t('partyPlay.onboarding.profileTitle', 'Wie sollen dich alle sehen?')}</h1>
            </header>
            {playing && <p role="status" className="rounded-2xl bg-white/[.05] p-3 text-sm text-white/70">{t('partyPlay.onboarding.afterRound', 'Gerade läuft ein Spiel – dein Profil erscheint ab der nächsten Runde.')}</p>}
            <PlayerProfileEditor key={me.player_id} initial={me} busy={busy} error={notice}
              submitLabel={t('partyPlay.onboarding.go', "Los geht's")}
              onSubmit={profile => submitProfile(profile, step.claimed)}
              secondary={freeGuests.length && !step.claimed ? { label: t('partyPlay.onboarding.back', 'Zurück zur Auswahl'), onClick: () => { setNotice(null); setStep({ kind: 'who' }); } } : undefined} />
          </motion.section>
        )}

        {step.kind === 'pending' && <PendingClaim key="pending" guest={step.guest} onDone={finishControllerOnboarding} />}
      </AnimatePresence>

      {/* "Bist du Max?" — a sheet over the profile, not an alert (B12). */}
      <PartySheet open={!!similar} onClose={() => setSimilar(null)} testId="seat-match-prompt"
        title={similar ? t('partyPlay.similar.title', 'Bist du {{name}}?', { name: similar.guest.name }) : ''}>
        {similar && (
          <div className="space-y-6 pb-2 text-center">
            <span className="mx-auto block w-fit rounded-full" style={{ boxShadow: playerGlow(similar.guest.color, 'active') }}>
              <SeatAvatar avatar={similar.guest.avatar} color={similar.guest.color} size={88} />
            </span>
            <p className="text-white/65">{(points[similar.guest.player_id] ?? 0) > 0
              ? t('partyPlay.similar.points', 'Die {{count}} Punkte übernehmen?', { count: points[similar.guest.player_id] })
              : t('partyPlay.similar.noPoints', 'Dann übernimmst du diesen Platz am Host-Handy.')}</p>
            <div className="space-y-2">
              <button type="button" data-testid="seat-match-yes" disabled={busy} onClick={() => void claim(similar.guest)}
                className="min-h-14 w-full rounded-2xl bg-gradient-to-r from-[#df8eff] to-[#8ff5ff] font-bold text-[#0a0e14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] disabled:opacity-40">
                {t('partyPlay.similar.yes', 'Ja, das bin ich')}
              </button>
              <button type="button" data-testid="seat-match-no" disabled={busy} onClick={() => void saveNew(similar.profile)}
                className="min-h-14 w-full rounded-2xl bg-white/[.06] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] active:bg-white/10 disabled:opacity-40">
                {t('partyPlay.similar.no', 'Nein, ich bin jemand anderes')}
              </button>
            </div>
          </div>
        )}
      </PartySheet>
    </div>
  );
}

/** Takeover waits for the round to end (B04). */
export function PendingClaim({ guest, onDone, onCancel }: { guest: ControllerMember; onDone?: () => void; onCancel?: () => void }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  usePartyScreenTrace('pending-claim');
  return (
    <motion.section variants={partyMotion('cardEnter', reduced)} initial="initial" animate="animate" exit="exit" role="status" data-testid="join-next-round" className="space-y-6 pt-6 text-center">
      <div className="relative mx-auto w-fit">
        <SeatAvatar avatar={guest.avatar} color={guest.color} size={96} />
        <motion.span variants={reduced ? undefined : checkPop} initial="initial" animate="animate" className="absolute -bottom-1 -end-1">
          <Clock3 className="h-8 w-8 rounded-full bg-[#0a0e14] p-1 text-amber-300" aria-hidden />
        </motion.span>
      </div>
      <h1 className="text-3xl font-black tracking-tight">{t('partyPlay.pending.title', 'Vorgemerkt')}</h1>
      <p className="text-white/65">{t('partyPlay.pending.body', 'Gerade läuft ein Spiel. Ab der nächsten Runde spielst du als {{name}} auf deinem Handy.', { name: guest.name })}</p>
      {onDone && <button type="button" onClick={onDone} className="min-h-14 w-full rounded-2xl bg-white/[.08] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] active:bg-white/15">
        {t('partyPlay.pending.ok', 'Alles klar')}
      </button>}
      {onCancel && <button type="button" onClick={onCancel} className="min-h-12 w-full rounded-2xl text-sm font-semibold text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] active:bg-white/5">
        {t('partyPlay.pending.cancel', 'Vormerkung zurücknehmen')}
      </button>}
    </motion.section>
  );
}
