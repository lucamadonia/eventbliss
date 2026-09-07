import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Plus, Minus, User, Globe, CalendarPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  /** The connected room is the sole source of player identities. */
  locked?: boolean;
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
  // KEIN Vorgabewert mehr: Ein hartkodiertes 'Spieler' landete ueber
  // games.setup.addEntity ("Add {{label}}") als "Add Spieler" in JEDER
  // Sprache. Im Deutschen fiel es nicht auf, weil dort zufaellig
  // "Spieler hinzufuegen" herauskam. Der Rueckfall unten ist uebersetzt.
  label,
  hint,
  maxNameLength = 20,
  onImportNames,
  locked = false,
}: PlayerSetupProps) {
  const { t } = useTranslation();
  // Faellt der Aufrufer nichts mit, gilt das uebersetzte "Spieler"/"Players".
  const entity = label ?? t('games.setup.players');
  const haptics = useHaptics();
  const reduce = useReducedMotion();
  const [pickerOpen, setPickerOpen] = useState(false);

  const rosterLocked = locked || players.some(player => player.readOnly);
  const atMax = players.length >= max;
  const canRemove = !rosterLocked && players.length > min;

  const handleAdd = () => { if (rosterLocked) return; void haptics.light(); onAdd(); };
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
    <section style={{ ['--accent' as string]: accent }} className="player-setup space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-300">
          {entity} ({players.length})
        </h2>
        {hint}
      </div>

      {/* Liste */}
      <div className="space-y-2.5" aria-live="polite">
        <AnimatePresence initial={false}>
          {players.map((player, i) => {
            const color = player.color ?? getPlayerColor(i);
            const initial = player.avatar ?? (player.name ? getPlayerInitial(player.name) : null);
            return (
              <motion.div key={player.id} {...rowMotion} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-3 py-2">
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                  style={{ backgroundColor: `${color}24`, color, border:`1px solid ${color}60` }}
                  aria-hidden="true"
                >
                  {initial ?? <User className="w-4 h-4 opacity-80" />}
                </div>

                {/* Name */}
                {rosterLocked || player.readOnly ? <p className="min-w-0 flex-1 break-words px-1 text-sm font-semibold text-white">{player.name}</p> : <input
                  type="text"
                  value={player.name}
                  onChange={(e) => { if (!rosterLocked) onRename(player.id, e.target.value); }}
                  placeholder={`${entity} ${i + 1}`}
                  maxLength={maxNameLength}
                  inputMode="text"
                  autoCorrect="off"
                  autoCapitalize="words"
                  spellCheck={false}
                  readOnly={rosterLocked || player.readOnly}
                  aria-label={t('games.setup.nameOf', { label: entity, n: i + 1 })}
                  className={cn(
                    'flex-1 min-w-0 rounded-lg px-2 py-2.5 text-base text-white bg-transparent border border-transparent',
                    'placeholder:text-gray-500 transition-[border-color,box-shadow] duration-150',
                    'focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/45',
                    'focus-visible:ring-2 focus-visible:ring-[var(--accent)]/45',
                    (rosterLocked || player.readOnly) && 'border-[var(--accent)]/30 bg-[var(--accent)]/5 cursor-default',
                  )}
                />}

                {/* Trailing slot: Online-Badge / Entfernen / Platzhalter (Breite stabil) */}
                {rosterLocked || player.readOnly ? (
                  <div className="shrink-0 grid place-items-center w-11 h-11 rounded-xl bg-[var(--accent)]/10"
                    title={t('games.setup.onlinePlayer')} aria-label={t('games.setup.onlinePlayer')}>
                    <Globe className="w-4 h-4 text-[var(--accent)]" />
                  </div>
                ) : (
                  // Always show the remove button so it's discoverable; disable it at
                  // the minimum (previously it was hidden entirely, so users had to add
                  // a player just to reveal the minus on the others).
                  <button
                    type="button"
                    onClick={() => { if (canRemove) handleRemove(player.id); }}
                    disabled={!canRemove}
                    aria-label={`${t('games.setup.removePlayer')}: ${entity} ${i + 1}`}
                    title={!canRemove ? t('games.setup.minPlayers', { count: min }) : undefined}
                    className={cn(
                      'shrink-0 grid place-items-center w-11 h-11 rounded-xl transition-colors duration-150',
                      canRemove
                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 active:scale-95'
                        : 'bg-white/[0.03] text-gray-600 cursor-not-allowed',
                    )}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Hinzufügen */}
        <AnimatePresence initial={false}>
          {!rosterLocked && !atMax && (
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
              {t('games.setup.addEntity', { label: entity })}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Aus Event übernehmen — Teilnehmer eines eigenen Events laden.
            Bewusst prominent (gefüllter Akzent + Glow), damit die Funktion in
            jedem Spiel klar erkennbar ist. */}
        {!rosterLocked && onImportNames && (
          <button
            type="button"
            onClick={() => { void haptics.light(); setPickerOpen(true); }}
            className="w-full min-h-12 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold text-[var(--accent)] border border-[var(--accent)]/30 bg-transparent transition-transform duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
          >
            <CalendarPlus className="w-4 h-4" />
            {t('games.setup.importFromEvent')}
          </button>
        )}
      </div>

      {!rosterLocked && onImportNames && (
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
