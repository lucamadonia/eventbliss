import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { partyEase } from '@/lib/party-motion';
import type { TVLobbyPlayer } from '../tv-lobby-state';
import { lu } from './tv-lobby-scale';

const EXPANDED_MS = 10_000;

/**
 * Nachzuegler-QR waehrend des Spiels (T15). Er liegt ueber dem Spielbild,
 * also nur kurz gross: nach 10 s schrumpft er zur Pille (kleiner QR + Code)
 * und waechst nur wieder, wenn die Szene wechselt (zwischen Runden) oder
 * jemand neu dazukommt. Sitzt im 5-%-Sicherheitsrand (Overscan).
 */
export default function TVLatecomerQR({ url, code, expandKey, players, onLateJoin }: {
  url: string;
  code: string;
  /** Wechselt der Wert (andere Szene), klappt die Karte wieder auf. */
  expandKey: string;
  players: TVLobbyPlayer[];
  onLateJoin?: () => void;
}) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const [expanded, setExpanded] = useState(true);
  const [lateName, setLateName] = useState<string | null>(null);
  const [bump, setBump] = useState(0);
  const knownIdsRef = useRef<Set<string> | null>(null);
  const lateJoinRef = useRef(onLateJoin);
  lateJoinRef.current = onLateJoin;

  useEffect(() => { setExpanded(true); setBump((b) => b + 1); }, [expandKey]);

  useEffect(() => {
    const ids = new Set(players.map((p) => p.id));
    const known = knownIdsRef.current;
    knownIdsRef.current = ids;
    if (!known) return;
    const newcomer = players.find((p) => !known.has(p.id));
    if (!newcomer) return;
    setLateName(newcomer.name);
    setExpanded(true);
    setBump((b) => b + 1);
    lateJoinRef.current?.();
  }, [players]);

  useEffect(() => {
    if (!expanded) return;
    const timer = window.setTimeout(() => { setExpanded(false); setLateName(null); }, EXPANDED_MS);
    return () => window.clearTimeout(timer);
  }, [expanded, bump]);

  return (
    <motion.aside
      data-testid="tv-latecomer-qr"
      data-join-url={url}
      data-expanded={String(expanded)}
      layout={!reduced}
      className="fixed z-40 flex items-center rounded-[28px] border border-white/10 bg-[#0d0915]/92 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)]"
      style={{ insetBlockEnd: '5vh', insetInlineEnd: '5vw', gap: lu(expanded ? 2 : 1.2), padding: lu(expanded ? 1.6 : 0.9), paddingInlineEnd: lu(expanded ? 2.4 : 1.6) }}
      initial={{ opacity: 0, y: reduced ? 0 : 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: partyEase.out }}
    >
      <motion.div layout={!reduced} className="shrink-0 rounded-2xl bg-white" style={{ padding: lu(0.5) }}>
        <QRCodeSVG
          value={url}
          level="M"
          marginSize={4}
          fgColor="#060810"
          title={t('tvLobby.latecomerTitle', 'Noch dazukommen?')}
          style={{ display: 'block', width: lu(expanded ? 16 : 9), height: lu(expanded ? 16 : 9), transition: 'width 320ms ease, height 320ms ease' }}
        />
      </motion.div>
      <motion.div layout={!reduced} style={{ maxWidth: lu(30) }}>
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
              {lateName ? (
                <p data-testid="tv-toast" data-kind="late-join" className="font-black leading-tight text-white" style={{ fontSize: lu(2.6) }}>
                  ✨ {t('tvLobby.lateJoin', '{{name}} ist ab der nächsten Runde dabei', { name: lateName })}
                </p>
              ) : (
                <>
                  <p className="font-black leading-tight text-white" style={{ fontSize: lu(2.6) }}>{t('tvLobby.latecomerTitle', 'Noch dazukommen?')}</p>
                  <p className="font-semibold text-white/70" style={{ fontSize: lu(2), marginTop: lu(0.4) }}>{t('tvLobby.latecomerHint', 'Scannen – ab der nächsten Runde dabei')}</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <p dir="ltr" className="font-mono font-black tabular-nums text-[#8ff5ff]" style={{ fontSize: lu(expanded ? 3 : 2.4), letterSpacing: '0.2em', marginTop: expanded ? lu(0.8) : 0 }}>
          {code}
        </p>
      </motion.div>
    </motion.aside>
  );
}
