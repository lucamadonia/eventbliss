import { motion, useReducedMotion } from 'framer-motion';
import { DoorOpen, PartyPopper, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ControllerRemoval } from '@/games/party/controller-session';
import { partyMotion } from '@/lib/party-motion';
import { usePartyScreenTrace } from './ui-trace';

interface Props {
  removal: ControllerRemoval;
  onStartOwn: () => void;
  onDone: () => void;
  /** Recalled seat: take it back with this phone ("Wer bist du?"). */
  onRejoin?: () => void;
}

/** Shown on the device of a removed or recalled player — tactful, with one clear way out. */
export function PartyRemovedNotice({ removal, onStartOwn, onDone, onRejoin }: Props) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  usePartyScreenTrace('removed');
  const recalled = !!removal.recalled;
  const moved = !!removal.movedDevice;
  return (
    <motion.section role="alert" aria-labelledby="removed-title" data-testid={moved ? 'switched-device-notice' : recalled ? 'recalled-notice' : 'party-removed-screen'}
      className="mx-auto max-w-md space-y-6 pt-10 text-center"
      variants={partyMotion('cardEnter', reduced)} initial="initial" animate="animate">
      <div className="mx-auto grid h-24 w-24 place-items-center rounded-[28px] bg-gradient-to-br from-white/10 to-white/[.02] ring-1 ring-white/10">
        {recalled || moved ? <Smartphone className="h-10 w-10 text-[#8ff5ff]" aria-hidden /> : <DoorOpen className="h-10 w-10 text-white/70" aria-hidden />}
      </div>
      <h1 id="removed-title" className="text-3xl font-black tracking-tight">{moved
        ? t('partyPlay.switchDevice.movedTitle', 'Du spielst jetzt auf einem anderen Handy')
        : recalled
        ? t('partyPlay.recalled.title', 'Du spielst jetzt am Host-Handy')
        : t('partyPlay.removed.title', 'Du bist nicht mehr in dieser Party')}</h1>
      <p className="text-white/60">{moved
        ? t('partyPlay.switchDevice.movedBody', 'Deine Punkte sind mitgekommen. Willst du wieder hier spielen, tritt einfach erneut bei.')
        : recalled
        ? t('partyPlay.recalled.body', 'Deine Punkte bleiben. Du kannst deinen Platz jederzeit wieder auf dieses Handy holen.')
        : removal.banned
          ? t('partyPlay.removed.banned', 'Mit dem Code {{code}} kannst du nicht wieder beitreten.', { code: removal.code })
          : t('partyPlay.removed.body', 'Deine bisherigen Punkte bleiben in der Wertung.')}</p>
      <div className="space-y-2">
        {(recalled || moved) && onRejoin ? (
          <button type="button" onClick={onRejoin}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#df8eff] to-[#8ff5ff] font-bold text-[#0a0e14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff]">
            <Smartphone className="h-5 w-5" aria-hidden />{moved ? t('partyPlay.switchDevice.back', 'Hier weiterspielen') : t('partyPlay.recalled.rejoin', 'Wieder mit eigenem Handy')}
          </button>
        ) : (
          <button type="button" onClick={onStartOwn}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#df8eff] to-[#8ff5ff] font-bold text-[#0a0e14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff]">
            <PartyPopper className="h-5 w-5" aria-hidden />{t('partyPlay.removed.startOwn', 'Eigene Party starten')}
          </button>
        )}
        <button type="button" onClick={onDone} className="min-h-12 w-full rounded-2xl text-sm font-semibold text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] active:bg-white/5">
          {t('partyPlay.removed.done', 'Zur Spielübersicht')}
        </button>
      </div>
    </motion.section>
  );
}
