import { createContext, useContext } from 'react';

/**
 * Wer ist wer auf dem Fernseher — EINE Quelle fuer Symbol und Farbe.
 *
 * Im Wartebereich hat jeder sein Emoji; viele Spielzustaende tragen aber nur
 * Name und Farbe. Ohne diese Liste wuerde aus „🦊 Lena“ im Spiel ploetzlich
 * ein „L“ — derselbe Mensch, ein anderes Gesicht (Design §9, P0).
 */
export interface TVRosterEntry { name: string; avatar?: string; color?: string }
export interface TVRoster { byId: Map<string, TVRosterEntry>; byName: Map<string, TVRosterEntry> }

const EMPTY: TVRoster = { byId: new Map(), byName: new Map() };
export const TVRosterContext = createContext<TVRoster>(EMPTY);
export const useTVRoster = () => useContext(TVRosterContext);

type Source = { id?: unknown; name?: unknown; avatar?: unknown; color?: unknown };
const s = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

/**
 * Ein echtes Spieler-Symbol — oder undefined. Manche Spielzustaende schicken
 * statt des Emojis nur die Initiale („H“); die gilt als „kein Avatar“, damit
 * das Emoji aus der Teilnehmerliste gewinnt (Design-Pixelpass Ohrwurm).
 */
export function realAvatar(v: unknown): string | undefined {
  const value = s(v);
  return value && !/^\p{L}{1,2}$/u.test(value) ? value : undefined;
}

/** Symbol fuer eine Anzeige: echtes Emoji, sonst aus der Liste, sonst die Initiale. */
export function avatarFor(roster: TVRoster, entry: { id?: string; name?: string; avatar?: string }): string {
  return realAvatar(entry.avatar) || lookupRoster(roster, entry.id, entry.name)?.avatar || (entry.name || '?').charAt(0).toUpperCase();
}

/** Spaetere Quellen ergaenzen fruehere, ueberschreiben aber kein vorhandenes Emoji. */
export function buildRoster(...sources: (readonly Source[] | null | undefined)[]): TVRoster {
  const byId = new Map<string, TVRosterEntry>();
  const byName = new Map<string, TVRosterEntry>();
  for (const list of sources) {
    for (const raw of list ?? []) {
      const name = s(raw?.name);
      if (!name) continue;
      const id = s(raw.id);
      const prev = (id && byId.get(id)) || byName.get(name.toLowerCase());
      const entry: TVRosterEntry = {
        name,
        avatar: prev?.avatar ?? realAvatar(raw.avatar),
        color: prev?.color ?? s(raw.color),
      };
      if (id) byId.set(id, entry);
      byName.set(name.toLowerCase(), entry);
    }
  }
  return { byId, byName };
}

export function lookupRoster(roster: TVRoster, id?: string, name?: string): TVRosterEntry | undefined {
  return (id ? roster.byId.get(id) : undefined) ?? (name ? roster.byName.get(name.trim().toLowerCase()) : undefined);
}
