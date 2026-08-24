import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import type { PartyNightState } from '../party-types';

/**
 * TVViewBar — das Menue auf dem FERNSEHER.
 *
 * WARUM ES SIE GIBT: Die Nacht-Route lag frueher hinter einem unsichtbaren
 * Klick auf die ganze Flaeche — kein Knopf, keine Beschriftung. Zwischenstand,
 * Siegerehrung und Anleitung waren gar nicht erreichbar. Wer nicht wusste,
 * dass es sie gibt, hat sie nie gefunden.
 *
 * WARUM EIN KNOPF STATT EINER REIHE: Die erste Fassung zeigte alle Eintraege
 * nebeneinander und verdeckte damit im Geraetetest die Spielerkarten. Eine
 * andere Ecke haette nichts geloest — OHRWURM belegt den rechten Rand mit einer
 * festen Spalte (min. 280px), BOMBE ebenfalls, mehrere Ansichten die ganze
 * Flaeche. Es gibt keinen freien Platz. Also liegt zugeklappt nur EIN Knopf im
 * Bild, und aufgeklappt dunkelt das Bild ab: Dann ist es sichtbar ein Menue
 * und kein Versehen.
 *
 * BEDIENBAR MIT DER FERNBEDIENUNG: Smart-TV-Browser bilden das Steuerkreuz auf
 * Pfeiltasten ab und OK auf Enter. Deshalb echte <button>-Elemente, wandernder
 * Fokus und ein Fokusring, den man aus drei Metern sieht — ein klickbares
 * <div> waere mit dem Steuerkreuz unerreichbar.
 *
 * Geschaltet werden ausschliesslich die Erlebnis-Ansichten. In ein laufendes
 * Spiel greift dieses Menue nicht ein — gespielt wird auf dem Telefon.
 */

type View = PartyNightState['phase'];

const VIEWS: { view: View; key: string; icon: string }[] = [
  { view: 'between', key: 'standings', icon: '🏆' },
  { view: 'map', key: 'map', icon: '🗺️' },
  { view: 'rules', key: 'rules', icon: '📖' },
  { view: 'finale', key: 'finale', icon: '🎉' },
  { view: 'intro', key: 'intro', icon: '📺' },
  { view: 'ingame', key: 'game', icon: '🎮' },
];

/** Nach so langer Ruhe klappt das Menue von selbst wieder zu. */
const IDLE_MS = 4000;

export interface TVViewBarProps {
  current: View;
  onSelect: (view: View) => void;
  /** false = keine Party, dann gibt es nichts zu schalten. */
  enabled: boolean;
}

export default function TVViewBar({ current, onSelect, enabled }: TVViewBarProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(0);
  const timerRef = useRef<number | null>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  /** Den Zuklapp-Zaehler neu starten. */
  const arm = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setOpen(false), IDLE_MS);
  }, []);

  const toggle = useCallback(() => {
    setOpen((was) => {
      if (was) return false;
      // Auf der AKTUELLEN Ansicht stehen, damit die erste Pfeiltaste von einer
      // sinnvollen Stelle aus loslaeuft.
      const i = VIEWS.findIndex((v) => v.view === current);
      setFocus(i >= 0 ? i : 0);
      return true;
    });
  }, [current]);

  /**
   * KEIN `mousemove`-Lauscher.
   *
   * Die erste Fassung weckte das Menue bei jeder Mausbewegung. Auf einem
   * Fernseher gibt es keine Maus — am Rechner dagegen sprang es bei jeder
   * Handbewegung auf und verdeckte das laufende Spiel, ohne dass jemand es
   * gerufen hatte. Geoeffnet wird nur noch ausdruecklich.
   */
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'GoBack') {
        setOpen(false);
        return;
      }
      if (!open) {
        // Der erste Tastendruck holt nur den Knopf in den Fokus, statt sofort
        // aufzuklappen — sonst loest ein versehentlicher Druck gleich eine
        // Ansicht aus.
        toggleRef.current?.focus();
        return;
      }
      arm();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [enabled, open, arm]);

  // Solange offen, laeuft der Zuklapp-Zaehler.
  useEffect(() => {
    if (!open) return;
    arm();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [open, arm]);

  // Den Fokus wirklich setzen, sonst laeuft das Steuerkreuz ins Leere.
  useEffect(() => {
    if (open) btnRefs.current[focus]?.focus();
  }, [open, focus]);

  if (!enabled) return null;

  const move = (delta: number) =>
    setFocus((i) => (i + delta + VIEWS.length) % VIEWS.length);

  return (
    <>
      {/* Der Schleier. Er macht aus "verdeckt zufaellig etwas" ein "liegt
          erkennbar obenauf" — unabhaengig davon, welche Ansicht darunter ist. */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[205] bg-[#060810]/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-[210] flex flex-col items-end gap-3">
        <AnimatePresence>
          {open && (
            <motion.div
              className="flex max-w-[92vw] flex-wrap justify-end gap-2 rounded-3xl border border-[#df8eff]/30 bg-[#151a21]/95 px-4 py-3 backdrop-blur-lg"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              role="toolbar"
              aria-label={t('tv.remote.menu')}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  move(1);
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  move(-1);
                }
              }}
            >
              {VIEWS.map((v, i) => {
                const active = current === v.view;
                return (
                  <button
                    key={v.view}
                    ref={(el) => {
                      btnRefs.current[i] = el;
                    }}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      onSelect(v.view);
                      setOpen(false);
                    }}
                    onFocus={() => setFocus(i)}
                    className={[
                      'flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-3 text-lg font-semibold transition-colors',
                      'outline-none focus-visible:outline-none',
                      // Fokusring bewusst kraeftig: aus drei Metern muss
                      // erkennbar sein, wo das Steuerkreuz gerade steht.
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

        {/* Zugeklappt liegt NUR dieser Knopf im Bild — im Stil der Sound-Pille
            und an derselben Stelle. */}
        <button
          ref={toggleRef}
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label={t('tv.remote.menu')}
          className={[
            'flex items-center gap-2 rounded-full border border-[#df8eff]/30 bg-[#151a21]/90 px-5 py-3 text-lg font-semibold backdrop-blur-lg transition-colors',
            'outline-none focus:ring-4 focus:ring-[#8ff5ff] focus:shadow-[0_0_28px_rgba(143,245,255,0.55)]',
            open ? 'text-[#f1f3fc]' : 'text-[#a8abb3]',
          ].join(' ')}
        >
          <span aria-hidden>{open ? '✕' : '📺'}</span>
          <span>{t('tv.remote.menu')}</span>
        </button>
      </div>
    </>
  );
}
