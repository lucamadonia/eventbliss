/**
 * OHNE WORTE mit wechselnder Runde (F13/F14/F19). Haengt hier etwas, wartet
 * das Spiel auf einen Darsteller, der laengst gegangen ist.
 */
import { describe, it, expect } from 'vitest';

import { removeFromPantomime, type PantomimeRoster } from './roster-change';

type Team = { name: string; players: { id: string }[]; score: number };
const team = (name: string, ids: string[], score = 0): Team => ({ name, players: ids.map((id) => ({ id })), score });
const ids = (t: Team) => t.players.map((p) => p.id);

const base = (over: Partial<PantomimeRoster<Team>> = {}): PantomimeRoster<Team> => ({
  teams: [team('A', ['a1', 'a2', 'a3'], 5), team('B', ['b1', 'b2', 'b3'], 3)],
  activeTeamIdx: 0,
  actorIdx: [1, 0],
  phase: 'playing',
  ...over,
});

describe('removeFromPantomime', () => {
  it('niemand betroffen → unveraendert', () => {
    const s = base();
    const r = removeFromPantomime(s, ['x']);
    expect(r.changed).toBe(false);
    expect(r.state).toBe(s);
  });

  it('Zuschauer geht → Zug laeuft weiter, Darsteller bleibt derselbe', () => {
    const r = removeFromPantomime(base(), ['a1']);
    expect(r.restartTurn).toBe(false);
    expect(r.state.phase).toBe('playing');
    expect(ids(r.state.teams[0])).toEqual(['a2', 'a3']);
    expect(r.state.teams[0].players[r.state.actorIdx[0]].id).toBe('a2');
    expect(r.state.teams[0].score).toBe(5);
  });

  it('Darsteller geht mitten im Zug → Neustart des Zugs fuer den Naechsten (F14/F19)', () => {
    for (const phase of ['extra', 'fetch', 'playing']) {
      const r = removeFromPantomime(base({ phase }), ['a2']);
      expect(r.restartTurn, phase).toBe(true);
      expect(r.state.phase).toBe('turnStart');
      expect(r.state.teams[0].players[r.state.actorIdx[0]].id).toBe('a3');
    }
  });

  it('Darsteller geht am Zugende → Punkte bleiben, Weiterreichen landet beim Naechsten', () => {
    const r = removeFromPantomime(base({ phase: 'turnSummary' }), ['a2']);
    expect(r.restartTurn).toBe(false);
    expect(r.state.phase).toBe('turnSummary');
    const t = r.state.teams[0];
    // nextTurn rechnet +1
    expect(t.players[(r.state.actorIdx[0] + 1) % t.players.length].id).toBe('a3');
  });

  it('letzter im Team geht als Darsteller → wieder vorn', () => {
    const r = removeFromPantomime(base({ actorIdx: [2, 0], phase: 'turnStart' }), ['a3']);
    expect(r.state.teams[0].players[r.state.actorIdx[0]].id).toBe('a1');
    expect(r.restartTurn).toBe(false);
  });

  it('Darsteller-Zeiger des anderen Teams wird mitgezogen', () => {
    const r = removeFromPantomime(base({ actorIdx: [0, 2] }), ['b1']);
    expect(r.state.teams[1].players[r.state.actorIdx[1]].id).toBe('b3');
  });

  it('Team unter zwei → Ausgleich aus dem groesseren Team, nie dessen Darsteller', () => {
    const s = base({ teams: [team('A', ['a1', 'a2']), team('B', ['b1', 'b2', 'b3', 'b4'])], actorIdx: [0, 3], phase: 'turnStart' });
    const r = removeFromPantomime(s, ['a2']);
    expect(r.moved).toEqual(['b3']);
    expect(ids(r.state.teams[0])).toEqual(['a1', 'b3']);
    expect(ids(r.state.teams[1])).toEqual(['b1', 'b2', 'b4']);
    expect(r.state.teams[1].players[r.state.actorIdx[1]].id).toBe('b4');
  });

  it('kein Ausgleich, wenn das andere Team selbst nur zwei hat', () => {
    const s = base({ teams: [team('A', ['a1', 'a2']), team('B', ['b1', 'b2'])], actorIdx: [0, 0], phase: 'turnStart' });
    const r = removeFromPantomime(s, ['a2']);
    expect(r.moved).toEqual([]);
    expect(ids(r.state.teams[0])).toEqual(['a1']);
  });

  it('aktives Team leer → das andere ist dran, Zug neu', () => {
    const s = base({ teams: [team('A', ['a1']), team('B', ['b1', 'b2'])], actorIdx: [0, 1], phase: 'playing' });
    const r = removeFromPantomime(s, ['a1']);
    expect(r.state.activeTeamIdx).toBe(1);
    expect(r.state.phase).toBe('turnStart');
    expect(r.restartTurn).toBe(true);
    expect(r.state.teams[1].players[r.state.actorIdx[1]].id).toBe('b2');
  });

  it('alle weg → konsistent, kein Absturz', () => {
    const r = removeFromPantomime(base(), ['a1', 'a2', 'a3', 'b1', 'b2', 'b3']);
    expect(r.state.teams.map(ids)).toEqual([[], []]);
    expect(r.state.actorIdx).toEqual([0, 0]);
  });

  it('nach Spielende nur die Listen anpassen', () => {
    const r = removeFromPantomime(base({ phase: 'gameOver' }), ['a2']);
    expect(r.state.phase).toBe('gameOver');
    expect(r.restartTurn).toBe(false);
  });
});
