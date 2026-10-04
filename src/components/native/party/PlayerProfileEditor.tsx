import { useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Lock, Tv } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useHaptics';
import { PLAYER_AVATARS, PLAYER_COLORS, PLAYER_NAME_MAX, playerName } from '@/games/party/session-schema';
import type { PlayerProfile } from '@/games/party/controller-session';
import { partyMotion, playerGlow, pressable, readableOn } from '@/lib/party-motion';
import { cn } from '@/lib/utils';
import { SeatAvatar, SeatIcon } from './PartySheet';
import { radioKeyDown, radioTabIndex } from './radio-keys';
import { usePartyScreenTrace } from './ui-trace';

interface Props {
  initial: PlayerProfile;
  submitLabel: string;
  onSubmit: (profile: PlayerProfile) => void;
  busy?: boolean;
  /** While a game is running, profiles are read-only ("nach der Runde änderbar"). */
  locked?: boolean;
  /** Seat played on the Host's device: the preview shows the 🔁 badge. */
  hostDevice?: boolean;
  secondary?: { label: string; onClick: () => void };
  /** Server rejection, already translated, with its raw code for QA. */
  error?: { text: string; code: string | null } | null;
  /** QA selectors for the add-guest form (`guest-name` / `guest-save`). */
  testIds?: { name?: string; save?: string };
}

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0d1a]';

/**
 * Name, symbol and colour with a live preview of the TV card. Used after
 * "Wer bist du?", from one's own seat in the lobby and by the Host for guests.
 */
export function PlayerProfileEditor({ initial, submitLabel, onSubmit, busy, locked, hostDevice, secondary, error, testIds }: Props) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const reduced = !!useReducedMotion();
  const nameId = useId();
  const [name, setName] = useState(initial.name);
  const [avatar, setAvatar] = useState(PLAYER_AVATARS.includes(initial.avatar) ? initial.avatar : PLAYER_AVATARS[0]);
  const [color, setColor] = useState<string>((PLAYER_COLORS as readonly string[]).includes(String(initial.color ?? '').toLowerCase()) ? String(initial.color).toLowerCase() : PLAYER_COLORS[0]);
  const valid = playerName(name);
  const disabled = !!locked || !!busy;
  const morph = partyMotion('profileMorph', reduced);
  usePartyScreenTrace('profile');

  const submit = () => {
    if (!valid || disabled) { haptics.warning(); return; }
    haptics.success();
    onSubmit({ name: valid, avatar, color });
  };
  const pickAvatar = (value: string) => { haptics.select(); setAvatar(value); };
  const pickColor = (value: string) => { haptics.select(); setColor(value); };

  return (
    <form data-testid="profile-editor" className="space-y-6" onSubmit={event => { event.preventDefault(); submit(); }}>
      {/* Live preview: the chip exactly as the TV waiting room draws it. */}
      <figure data-testid="profile-preview" className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#060810] p-5">
        <figcaption className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.18em] text-white/50">
          <Tv className="h-3.5 w-3.5" aria-hidden />{t('partyPlay.profile.preview', 'So sieht dich der Fernseher')}
        </figcaption>
        <div className="flex items-center gap-4" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={avatar + color} variants={morph} initial="initial" animate="animate" exit="exit"
              className="rounded-full" style={{ boxShadow: playerGlow(color, 'active') }}>
              <SeatAvatar avatar={avatar} color={color} size={64} />
            </motion.span>
          </AnimatePresence>
          <div className="min-w-0">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p key={valid ?? ''} variants={morph} initial="initial" animate="animate" exit="exit" className="truncate text-2xl font-black tracking-tight text-white">
                {valid ?? t('partyPlay.profile.namePlaceholder', 'Dein Name')}
              </motion.p>
            </AnimatePresence>
            <p className="flex items-center gap-1 text-sm text-white/55"><SeatIcon guest={!!hostDevice} />{hostDevice ? t('partyPlay.seat.hostDevice', 'am Host-Handy') : t('partyPlay.seat.phone', 'eigenes Handy')}</p>
          </div>
        </div>
      </figure>

      {locked && (
        <p role="status" data-testid="profile-locked" className="flex items-center gap-2 rounded-2xl bg-amber-300/10 p-4 text-sm text-amber-100">
          <Lock className="h-4 w-4 shrink-0" aria-hidden />{t('partyPlay.profile.locked', 'Gerade läuft ein Spiel – nach der Runde änderbar.')}
        </p>
      )}
      {error && <p role="alert" data-testid="profile-error" data-error-code={error.code ?? ''} className="rounded-2xl border border-rose-300/30 bg-rose-300/10 p-4 text-sm">{error.text}</p>}

      <fieldset disabled={disabled} className="space-y-6 disabled:opacity-60">
        <label htmlFor={nameId} className="block space-y-2">
          <span className="text-sm font-semibold text-white/80">{t('partyPlay.profile.name', 'Name')}</span>
          <input id={nameId} data-testid={testIds?.name ?? 'profile-name'} value={name} maxLength={PLAYER_NAME_MAX + 8} autoComplete="nickname" enterKeyHint="done"
            onChange={event => setName(event.target.value)}
            aria-invalid={!valid}
            className="min-h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-lg font-semibold outline-none transition focus:border-[#df8eff]/60 focus-visible:ring-2 focus-visible:ring-[#8ff5ff]" />
          {!valid && name.length > 0 && <span className="text-xs text-rose-200">{t('partyPlay.profile.nameInvalid', 'Bitte 1–24 Zeichen.')}</span>}
        </label>

        <div role="radiogroup" aria-label={t('partyPlay.profile.symbol', 'Symbol')} className="space-y-2">
          <span className="text-sm font-semibold text-white/80">{t('partyPlay.profile.symbol', 'Symbol')}</span>
          <div className="grid grid-cols-6 gap-2">
            {PLAYER_AVATARS.map(symbol => {
              const checked = symbol === avatar;
              return (
                <button key={symbol} type="button" role="radio" aria-checked={checked} aria-label={symbol} tabIndex={radioTabIndex(checked)}
                  data-testid="profile-avatar" data-value={symbol}
                  onClick={() => pickAvatar(symbol)} onKeyDown={event => radioKeyDown(event, PLAYER_AVATARS, avatar, pickAvatar)}
                  className={cn('grid aspect-square min-h-12 place-items-center rounded-2xl text-2xl transition active:scale-[.95]', focusRing, checked ? 'bg-white/15' : 'bg-white/[.04]')}
                  style={checked ? { boxShadow: playerGlow(color, 'active') } : undefined}>
                  {symbol}
                </button>
              );
            })}
          </div>
        </div>

        <div role="radiogroup" aria-label={t('partyPlay.profile.color', 'Farbe')} className="space-y-2">
          <span className="text-sm font-semibold text-white/80">{t('partyPlay.profile.color', 'Farbe')}</span>
          <div className="flex flex-wrap gap-1">
            {PLAYER_COLORS.map((swatch, index) => {
              const checked = swatch === color;
              return (
                <button key={swatch} type="button" role="radio" aria-checked={checked} tabIndex={radioTabIndex(checked)}
                  aria-label={t('partyPlay.profile.colorOption', 'Farbe {{n}}', { n: index + 1 })}
                  data-testid="profile-color" data-value={swatch}
                  onClick={() => pickColor(swatch)} onKeyDown={event => radioKeyDown(event, PLAYER_COLORS, color, pickColor)}
                  className={cn('grid h-11 w-11 place-items-center rounded-full transition active:scale-[.95]', focusRing)}>
                  <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: swatch, boxShadow: checked ? '0 0 0 2px #ffffff' : undefined }}>
                    {checked && <Check className="h-5 w-5" style={{ color: readableOn(swatch) }} aria-hidden />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </fieldset>

      <div className="sticky bottom-0 -mx-1 space-y-2 bg-gradient-to-t from-[#0e0d1a] via-[#0e0d1a]/95 to-transparent px-1 pb-2 pt-4">
        <motion.button type="submit" data-testid={testIds?.save ?? 'profile-save'} disabled={!valid || disabled} {...(reduced ? {} : pressable)}
          className={cn('min-h-14 w-full rounded-2xl bg-gradient-to-r from-[#df8eff] to-[#8ff5ff] text-base font-bold text-[#0a0e14] shadow-[0_12px_40px_rgba(223,142,255,.3)] disabled:opacity-40', focusRing)}>
          {submitLabel}
        </motion.button>
        {secondary && (
          <button type="button" onClick={secondary.onClick} disabled={busy}
            className={cn('min-h-12 w-full rounded-2xl text-sm font-semibold text-white/70 active:bg-white/5 disabled:opacity-40', focusRing)}>
            {secondary.label}
          </button>
        )}
      </div>
    </form>
  );
}
