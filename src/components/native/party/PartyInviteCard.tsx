import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Tv, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useHaptics';
import { getBaseUrl } from '@/lib/platform';
import { pressable } from '@/lib/party-motion';
import { cn } from '@/lib/utils';
import { PartySheet } from './PartySheet';

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff]';

/** Invitations are the core of a party: mini QR + code + share; tap for the big QR. */
export function PartyInviteCard({ code, compact = false }: { code: string; compact?: boolean }) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const reduced = !!useReducedMotion();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = `${getBaseUrl()}/party/join/${code}`;
  const share = async () => {
    haptics.light();
    const text = t('partyPlay.invite.shareText', 'Komm zu meiner Party! Code {{code}}', { code });
    try {
      if (navigator.share) { await navigator.share({ title: 'EventBliss', text, url }); return; }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    } catch { /* share sheet dismissed */ }
  };
  const sheet = (
    <PartySheet open={open} onClose={() => setOpen(false)} testId="lobby-qr-sheet" title={t('partyPlay.invite.title', 'Freunde einladen')}
      subtitle={t('partyPlay.invite.sheetHint', 'Handykamera auf den Code – die App öffnet sich und du bist dabei.')}>
      <div className="flex flex-col items-center gap-4 pb-4">
        <div className="rounded-3xl bg-white p-4"><QRCodeSVG value={url} size={240} title={t('partyControllers.scan')} /></div>
        <p className="font-game text-4xl tracking-[.25em]">{code}</p>
        <button type="button" onClick={() => void share()} className={cn('flex min-h-11 items-center gap-2 rounded-full bg-[#8ff5ff]/12 px-5 text-sm font-bold text-[#8ff5ff]', focus)}>
          <Share2 className="h-4 w-4" aria-hidden />{t('partyPlay.invite.share', 'Einladung teilen')}
        </button>
      </div>
    </PartySheet>
  );
  // Everyone's in (or a game runs): the invitation steps back to a chip.
  if (compact) return <>
    <button type="button" data-testid="lobby-invite" data-compact="true" onClick={() => { haptics.light(); setOpen(true); }} aria-haspopup="dialog"
      className={cn('mx-auto flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-4 text-sm font-semibold text-white/80 active:bg-white/10', focus)}>
      <UserPlus className="h-4 w-4 text-[#8ff5ff]" aria-hidden />{t('partyPlay.invite.chip', 'Einladen')}<span className="font-game tracking-[.15em] text-white/60">{code}</span>
    </button>
    {sheet}
  </>;
  return <>
    <div data-testid="lobby-invite" className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[.04] p-3">
      <motion.button type="button" {...(reduced ? {} : pressable)} onClick={() => { haptics.light(); setOpen(true); }}
        aria-label={t('partyPlay.invite.showQr', 'QR-Code groß zeigen')} aria-haspopup="dialog"
        className={cn('shrink-0 rounded-2xl bg-white p-1.5', focus)}>
        <QRCodeSVG value={url} size={76} />
      </motion.button>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-bold"><UserPlus className="h-4 w-4 text-[#8ff5ff]" aria-hidden />{t('partyPlay.invite.title', 'Freunde einladen')}</p>
        <p className="mt-0.5 text-xs text-white/55">{t('partyPlay.invite.hint', 'Scannen oder Code eingeben')}</p>
        <p className="mt-1 font-game text-xl tracking-[.18em]">{code}</p>
      </div>
      <motion.button type="button" data-testid="lobby-share" {...(reduced ? {} : pressable)} onClick={() => void share()}
        aria-label={t('partyPlay.invite.share', 'Einladung teilen')}
        className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#8ff5ff]/12 text-[#8ff5ff]', focus)}>
        <Share2 className="h-5 w-5" aria-hidden />
      </motion.button>
    </div>
    {copied && <p role="status" className="-mt-4 text-center text-xs text-[#8ff5ff]">{t('partyPlay.invite.copied', 'Link kopiert')}</p>}
    {sheet}
  </>;
}

/** TV as a tile: icon, status dot, one tap to pair (§3.4). */
export function PartyTvTile({ connected, onPair }: { connected: boolean; onPair?: () => void }) {
  const { t } = useTranslation();
  return (
    <button type="button" data-testid="lobby-tv-tile" data-connected={connected} disabled={connected || !onPair} onClick={onPair}
      className={cn('flex min-h-16 w-full items-center gap-3 rounded-3xl border px-4 text-start disabled:cursor-default', focus,
        connected ? 'border-[#8ff5ff]/30 bg-[#8ff5ff]/[.06]' : 'border-white/10 bg-white/[.04] active:bg-white/10')}>
      <span className="relative grid h-10 w-10 place-items-center rounded-2xl bg-white/[.06]">
        <Tv className="h-5 w-5" aria-hidden />
        <span aria-hidden className={cn('absolute -end-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#060810]', connected ? 'bg-[#8ff5ff]' : 'bg-white/30')} />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm">{t('partyPlay.tv.title', 'Fernseher')}</strong>
        <span className={cn('text-xs', connected ? 'text-[#8ff5ff]' : 'text-white/55')}>{connected ? t('partyPlay.lobby.tvOn', 'Fernseher verbunden') : t('partyPlay.tv.pair', 'Tippen zum Koppeln')}</span>
      </span>
    </button>
  );
}
