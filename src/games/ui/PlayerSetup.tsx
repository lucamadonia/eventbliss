import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Plus, Minus, User, Globe, CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';
import { getPlayerColor, getPlayerInitial } from './PlayerAvatars';
import { EventParticipantPicker } from './EventParticipantPicker';

// OHRWURM/Party — EINHEITLICHER „Spieler hinzufügen"-Block für ALLE Spiele.
// Controlled: das Spiel besitzt seine Spieler-Liste weiter (players + Handler).
// Themebar pro Spiel über `accent`. Nur der Spieler-Bereich — keine Modi/Optionen.

export interface PlayerSetupPlayer {
  id: string;
  name: string;
  /** Optionaler Farb-Override; sonst getPlayerColor(index). */
  color?: string;
  /** Optionaler Avatar/Initiale-Override; sonst getPlayerInitial(name). */
  avatar?: string;
  /** Echter Online-Spieler (Remote-Gerät): nicht editier-/entfernbar. */
  readOnly?: boolean;
}

export interface PlayerSetupProps {
  players: PlayerSetupPlayer[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
  min?: number;
  max?: number;
  /** Akzentfarbe des Spiels (Hex). Default: dezentes Violett. */
  accent?: string;
  /** Bezeichnung (z.B. „Spieler" oder „Gruppen"). Default „Spieler". */
  label?: string;
  /** Badge-Slot rechts im Header (z.B. „Online Room"). */
  hint?: React.ReactNode;
  /** Max-Länge der Namensfelder. Default 20. */
  maxNameLength?: number;
  /** Wenn gesetzt: zeigt „Aus Event übernehmen" — liefert gewählte Teilnehmer-Namen. */
  onImportNames?: (names: string[]) => void;
}

const DEFAULT_ACCENT = '#A78BFA';

export function PlayerSetup({
  players,
  onAdd,
  onRemove,
  onRename,
  min = 2,
  max = 20,
  accent = DEFAULT_ACCENT,
  label = 'Spieler',
  hint,
  maxNameLength = 20,
  onImportNames,
}: PlayerSetupProps) {
  const haptics = useHaptics();
  const reduce = useReducedMotion();
  const [pickerOpen, setPickerOpen] = useState(false);

  const atMax = players.length >= max;
  const canRemove = players.length > min;

  const handleAdd = () => { void haptics.light(); onAdd(); };
  const handleRemove = (id: string) => { void haptics.light(); onRemove(id); };

  const rowMotion = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } }
    : {
        layout: true,
        initial: { opacity: 0, x: -16 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 16, height: 0, marginTop: 0 },
        transition: { duration: 0.18, ease: [0.23, 1, 0.32, 1] as const },
      };

  return (
    <section style={{ ['--accent' as string]: accent }} className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          {label} ({players.length})
        </h2>
        {hint}
      </div>

      {/* Liste */}
      <div className="space-y-2.5" aria-live="polite">
        <AnimatePresence initial={false}>
          {players.map((player, i) => {
            const color = player.color ?? getPlayerColor(i);
            const initial = player.avatar ?? (player.name ? getPlayerInitial(player.name) : null);
            const showRemove = canRemove && !player.readOnly;
            return (
              <motion.div key={player.id} {...rowMotion} className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                  style={{ backgroundColor: color, boxShadow: `0 2px 8px -2px ${color}66, inset 0 1px 0 rgba(255,255,255,0.25)` }}
                  aria-hidden="true"
                >
                  {initial ?? <User className="w-4 h-4 opacity-80" />}
                </div>

                {/* Name */}
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => onRename(player.id, e.target.value)}
                  placeholder={`${label} ${i + 1}`}
                  maxLength={maxNameLength}
                  inputMode="text"
                  autoCorrect="off"
                  autoCapitalize="words"
                  spellCheck={false}
                  readOnly={player.readOnly}
                  aria-label={`Name ${label} ${i + 1}`}
                  className={cn(
                    'flex-1 min-w-0 rounded-xl px-3.5 py-2.5 text-base text-white bg-gray-800/60 border border-gray-700',
                    'placeholder:text-gray-500 transition-[border-color,box-shadow] duration-150',
                    'focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/45',
                    'focus-visible:ring-2 focus-visible:ring-[var(--accent)]/45',
                    player.readOnly && 'border-[var(--accent)]/30 bg-[var(--accent)]/5 cursor-default',
                  )}
                />

                {/* Trailing slot: Online-Badge / Entfernen / Platzhalter (Breite stabil) */}
                {player.readOnly ? (
                  <div className="shrink-0 grid place-items-center w-11 h-11 rounded-xl bg-[var(--accent)]/10"
                    title="Online-Spieler" aria-label="Online-Spieler">
                    <Globe className="w-4 h-4 text-[var(--accent)]" />
                  </div>
                ) : showRemove ? (
                  <button
                    type="button"
                    onClick={() => handleRemove(player.id)}
                    aria-label={`${label} ${i + 1} entfernen`}
                    className="shrink-0 grid place-items-center w-11 h-11 rounded-xl bg-red-500/10 text-red-400 transition-colors duration-150 hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="w-11 h-11 shrink-0" aria-hidden="true" />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Hinzufügen */}
        <AnimatePresence initial={false}>
          {!atMax && (
            <motion.button
              key="__add"
              type="button"
              onClick={handleAdd}
              layout={!reduce}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-700 text-gray-400 text-sm font-medium transition-colors duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/45"
            >
              <Plus className="w-4 h-4" />
              {label} hinzufügen
            </motion.button>
          )}
        </AnimatePresence>

        {/* Aus Event übernehmen — Teilnehmer eines eigenen Events laden */}
        {onImportNames && !atMax && (
          <button
            type="button"
            onClick={() => { void haptics.light(); setPickerOpen(true); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/25 transition-colors hover:bg-[var(--accent)]/15"
          >
            <CalendarPlus className="w-4 h-4" />
            Aus Event übernehmen
          </button>
        )}
      </div>

      {onImportNames && (
        <EventParticipantPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(names) => onImportNames(names)}
          accent={accent}
        />
      )}
    </section>
  );
}
