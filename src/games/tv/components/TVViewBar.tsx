import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import type { PartyNightState } from '../party-types';

/**
 * TVViewBar — die Knopfreihe auf dem FERNSEHER.
 *
 * WARUM ES SIE GIBT: Die Nacht-Route lag bis hierher hinter einem unsichtbaren
 * Klick auf die ganze Flaeche — kein Knopf, keine Beschriftung, und nach dem
 * ersten Mal nicht einmal mehr ein Hinweis. Zwischenstand und Siegerehrung
 * waren ueberhaupt nicht erreichbar. Wer nicht wusste, dass es sie gibt, hat
 * sie nie gefunden.
 *
 * ZWEI HAUSREGELN, die hier aufeinandertreffen:
 *  1. Nichts liegt dauerhaft ueber dem Spielbild (TVScreen begruendet das mit
 *     verdeckten Zeitleisten und Spielkarten). Deshalb verhaelt sich die Reihe
 *     wie die Bedienleiste eines Videoplayers: Sie erscheint auf Zuruf und
 *     verschwindet nach vier Sekunden Ruhe von selbst.
 *  2. Ein Fernseher wird mit der FERNBEDIENUNG bedient. Smart-TV-Browser
 *     bilden das Steuerkreuz auf Pfeiltasten ab und OK auf Enter — deshalb
 *     echte <button>-Elemente, wandernder Fokus und ein Fokusring, den man aus
 *     drei Metern sieht. Ein klickbares <div> waere mit dem Steuerkreuz
 *     unerreichbar.
 *
 * Geschaltet werden ausschliesslich die Erlebnis-Ansichten. In ein laufendes
 * Spiel greift diese Leiste nicht ein — gespielt wird auf dem Telefon.
 */

type View = PartyNightState['phase'];

const VIEWS: { view: View; key: string; icon: string }[] = [
  { view: 'between', key: 'standings', icon: '🏆' },
  { view: 'map', key: 'map', icon: '🗺️' },
  { view: 'finale', key: 'finale', icon: '🎉' },
  { view: 'intro', key: 'intro', icon: '📺' },
  { view: 'ingame', key: 'game', icon: '🎮' },
];

/** Nach so langer Ruhe blendet sich die Leiste wieder aus. */
const IDLE_MS = 4000;

export interface TVViewBarProps {
  current: View;
  onSelect: (view: View) => void;
  /** false = keine Party, dann gibt es nichts zu schalten. */
  enabled: boolean;
}

export default function TVViewBar({ current, onSelect, enabled }: TVViewBarProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [focus, setFocus] = useState(0);
  const timerRef = useRef<number | null>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const wake = useCallback(() => {
    setVisible((was) => {
      // Beim Auftauchen auf der AKTUELLEN Ansicht stehen, damit die erste
      // Pfeiltaste von einer sinnvollen Stelle aus loslaeuft.
      if (!was) {
        const i = VIEWS.findIndex((v) => v.view === current);
        setFocus(i >= 0 ? i : 0);
      }
      return true;
    });
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setVisible(false), IDLE_MS);
  }, [current]);

  // Jede Regung weckt die Leiste — Maus UND Taste. Wer zur Fernbedienung
  // greift, will sie sehen; nur auf Mausbewegung zu horchen waere auf einem
  // Fernseher wertlos.
  useEffect(() => {
    if (!enabled) return;
    const onMove = () => wake();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setVisible(false); return; }
      wake();
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('keydown', onKey);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [enabled, wake]);

  // Den Fokus wirklich setzen, sonst laeuft das Steuerkreuz ins Leere.
  useEffect(() => {
    if (visible) btnRefs.current[focus]?.focus();
  }, [visible, focus]);

  if (!enabled) return null;

  const move = (delta: number) =>
    setFocus((i) => (i + delta + VIEWS.length) % VIEWS.length);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-6 left-1/2 z-[210] -translate-x-1/2 flex flex-wrap justify-center gap-2 max-w-[94vw] px-4 py-3 rounded-3xl bg-[#151a21]/90 border border-[#df8eff]/30 backdrop-blur-lg"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.22 }}
          role="toolbar"
          aria-label={t('tv.remote.title')}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
          }}
        >
          {VIEWS.map((v, i) => {
            const active = current === v.view;
            return (
              <button
                key={v.view}
                ref={(el) => { btnRefs.current[i] = el; }}
                type="button"
                aria-pressed={active}
                onClick={() => { onSelect(v.view); wake(); }}
                onFocus={() => setFocus(i)}
                className={[
                  'flex items-center gap-2 rounded-2xl px-4 py-3 text-lg font-semibold whitespace-nowrap transition-colors',
                  'outline-none focus-visible:outline-none',
                  // Fokusring bewusst kraeftig: aus drei Metern muss erkennbar
                  // sein, wo das Steuerkreuz gerade steht.
                  'focus:ring-4 focus:ring-[#8ff5ff] focus:shadow-[0_0_28px_rgba(143,245,255,0.55)]',
                  active
                    ? 'bg-[#df8eff]/20 text-[#f1f3fc] ring-2 ring-[#df8eff]/60'
                    : 'text-[#a8abb3] hover:text-[#f1f3fc]',
                ].join(' ')}
              >
                <span aria-hidden>{v.icon}</span>
                <span>{t(`tv.remote.${v.key}`)}</span>
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
