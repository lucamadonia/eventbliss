import { useEffect, useState } from 'react';
import { Ban, DoorOpen, Gamepad2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useHaptics';
import type { KickMode } from '@/games/party/controller-api';
import { firePartyHaptic, partyCue } from '@/lib/party-motion';
import { cn } from '@/lib/utils';
import { radioKeyDown, radioTabIndex } from './radio-keys';
import { PartySheet, SeatAvatar } from './PartySheet';

export interface KickTarget { id: string; name: string; avatar: string; color: string }

/** Which options the sheet offers (masterplan 6.6). */
export function kickModes(opts: { playing: boolean; canBan: boolean; inMatch: boolean }): KickMode[] {
  return [
    ...(opts.playing && opts.inMatch ? ['match_only' as const] : []),
    'party' as const,
    ...(opts.canBan ? ['ban' as const] : []),
  ];
}

interface Props {
  target: KickTarget | null;
  /** A game is running: "Nur aus diesem Spiel nehmen" becomes available. */
  playing: boolean;
  /** The target takes part in the running match. */
  inMatch?: boolean;
  /** Local party (one phone) has no accounts to ban. */
  canBan?: boolean;
  onConfirm: (target: KickTarget, mode: KickMode) => void;
  onClose: () => void;
}

const ICONS: Record<KickMode, typeof Ban> = { match_only: Gamepad2, party: DoorOpen, ban: Ban };

export function KickPlayerSheet({ target, playing, inMatch = true, canBan = true, onConfirm, onClose }: Props) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const modes = kickModes({ playing, canBan, inMatch });
  const [mode, setMode] = useState<KickMode>('party');
  useEffect(() => { if (target) setMode('party'); }, [target]);

  const copy: Record<KickMode, { title: string; hint: string }> = {
    match_only: { title: t('partyPlay.kick.matchOnly', 'Nur aus diesem Spiel nehmen'), hint: t('partyPlay.kick.matchOnlyHint', 'Bleibt in der Party und ist beim nächsten Spiel wieder dabei.') },
    party: { title: t('partyPlay.kick.party', 'Aus der Party entfernen'), hint: t('partyPlay.kick.partyHint', 'Punkte bleiben in der Wertung.') },
    ban: { title: t('partyPlay.kick.ban', 'Entfernen und sperren'), hint: t('partyPlay.kick.banHint', 'Kann mit diesem Code nicht wieder beitreten.') },
  };

  return (
    <PartySheet open={!!target} onClose={onClose} testId="kick-sheet"
      title={target ? t('partyPlay.kick.title', '{{name}} entfernen?', { name: target.name }) : ''}
      subtitle={playing ? t('partyPlay.kick.playingHint', 'Das laufende Spiel geht ohne Pause weiter.') : undefined}
      footer={target && (
        <div className="grid grid-cols-2 gap-3">
          <button type="button" data-testid="kick-cancel" onClick={onClose} className="min-h-14 rounded-2xl bg-white/[.06] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] active:bg-white/10">
            {t('partyPlay.cancel', 'Abbrechen')}
          </button>
          <button type="button" data-testid="kick-confirm" onClick={() => { firePartyHaptic(haptics, partyCue('T19', 'host').haptic); onConfirm(target, mode); }}
            className={cn('min-h-14 rounded-2xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] active:scale-[.98]',
              mode === 'ban' ? 'bg-[#ff6b98] text-[#0b0b12] shadow-[0_12px_32px_rgba(255,107,152,.35)]' : 'bg-white/[.08] text-rose-300')}>
            {t('partyPlay.kick.confirm', 'Entfernen')}
          </button>
        </div>
      )}>
      {target && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white/[.04] p-3">
            <SeatAvatar avatar={target.avatar} color={target.color} size={44} />
            <strong className="truncate text-lg">{target.name}</strong>
          </div>
          <div role="radiogroup" aria-label={t('partyPlay.kick.how', 'Wie entfernen?')} className="space-y-2">
            {modes.map(option => {
              const Icon = ICONS[option], selected = option === mode;
              return (
                <button key={option} type="button" role="radio" aria-checked={selected} tabIndex={radioTabIndex(selected)}
                  data-testid={`kick-mode-${option}`}
                  onClick={() => { haptics.select(); setMode(option); }}
                  onKeyDown={event => radioKeyDown(event, modes, mode, value => { haptics.select(); setMode(value); })}
                  className={cn('flex min-h-[68px] w-full items-center gap-4 rounded-2xl border px-4 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] active:scale-[.99]',
                    selected ? (option === 'ban' ? 'border-rose-400/60 bg-rose-500/10' : 'border-[#df8eff]/60 bg-[#df8eff]/10') : 'border-white/10 bg-white/[.03]')}>
                  <Icon className={cn('h-5 w-5 shrink-0', option === 'ban' ? 'text-rose-300' : 'text-[#df8eff]')} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <strong className="block">{copy[option].title}</strong>
                    <span className="text-sm text-white/55">{copy[option].hint}</span>
                  </span>
                  <span aria-hidden className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-full border-2', selected ? 'border-[#df8eff]' : 'border-white/25')}>
                    {selected && <span className="h-3 w-3 rounded-full bg-[#df8eff]" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </PartySheet>
  );
}
