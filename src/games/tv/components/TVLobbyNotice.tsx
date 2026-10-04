import { motion, useReducedMotion } from 'framer-motion';
import { PartyPopper, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LOBBY_ACCENTS, lu } from './tv-lobby-scale';

/**
 * Statt eines leeren „Ein Handy für alle · Dabei 0“: Der Fernseher kennt noch
 * keinen Gastgeber (Code geoeffnet, Telefon nicht verbunden) — oder die Party
 * wurde beendet, bevor ein Spiel gewertet war.
 */
export default function TVLobbyNotice({ kind, code }: { kind: 'waiting-host' | 'ended'; code: string }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const Icon = kind === 'ended' ? PartyPopper : Smartphone;
  return (
    <motion.section
      data-testid="tv-lobby-notice"
      data-kind={kind}
      className="flex flex-col items-center rounded-[28px] border border-white/[0.07] bg-[#0d0915] text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
      style={{ padding: lu(6), gap: lu(2.4), maxWidth: lu(110) }}
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="grid place-items-center rounded-full"
        style={{ width: lu(12), height: lu(12), background: 'radial-gradient(circle, rgba(223,142,255,0.28), rgba(143,245,255,0.08) 70%)' }}
        animate={reduced || kind === 'ended' ? undefined : { opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon aria-hidden strokeWidth={2.2} style={{ width: lu(5.5), height: lu(5.5), color: LOBBY_ACCENTS.purple }} />
      </motion.div>
      <h2 className="font-black leading-tight text-white" style={{ fontSize: lu(5.4) }}>
        {kind === 'ended' ? t('tvLobby.partyEnded', 'Diese Party ist vorbei') : t('tvLobby.waitingForHost', 'Warte auf den Host …')}
      </h2>
      <p className="font-medium leading-snug text-white/70" style={{ fontSize: lu(2.6), maxWidth: '34ch' }}>
        {kind === 'ended'
          ? t('tvLobby.partyEndedHint', 'Danke fürs Mitspielen! Für eine neue Runde einfach eine neue Party starten.')
          : t('tvLobby.waitingForHostHint', 'Auf dem Handy des Hosts: Party öffnen und „{{button}}“ antippen.', { button: t('tv.connectTitle') })}
      </p>
      {kind === 'waiting-host' && code && (
        <span dir="ltr" data-testid="tv-lobby-code" className="font-mono font-black tabular-nums text-[#8ff5ff]" style={{ fontSize: lu(4), letterSpacing: '0.2em' }}>
          {code}
        </span>
      )}
    </motion.section>
  );
}
