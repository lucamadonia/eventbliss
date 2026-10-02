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
        avatar: prev?.avatar ?? s(raw.avatar),
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
