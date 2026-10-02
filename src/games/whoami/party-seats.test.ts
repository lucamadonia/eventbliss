import { describe, expect, it } from 'vitest';
import {
  answerVoter, characterView, guardedSeats, holderSeat, pendingAssignViewers, snapshotRecipients,
  solveBonus, visibleCharacters, whoamiActiveSeat, whoamiTVPlayers, notSeenNames,
} from './party-seats';
import { whoamiSnapshotFor } from './private-state';

const seat = (id: string, character: string, extra: Partial<{ questionsAsked: number; guessedCorrectly: boolean; eliminated: boolean }> = {}) =>
  ({ id, name: id.toUpperCase(), avatar: id[0], color: '#ef987e', score: 0, character, questionsAsked: 0, guessedCorrectly: false, eliminated: false, ...extra });

// host = Host-Handy, g1/g2 = 🔁-Gaeste am Host-Handy, p = Spieler mit eigenem Handy
const players = [seat('host', 'Einstein'), seat('g1', 'Cleopatra'), seat('g2', 'Mozart'), seat('p', 'Pikachu')];
const local = ['host', 'g1', 'g2'];
const guarded = guardedSeats(local, ['g1', 'g2']);

describe('characterView — wer darf welche Figur sehen', () => {
  it('der Host haelt das Handy: eigene Figur verdeckt, Gaeste nur mit Geste, Fremde offen', () => {
    const ctx = { phase: 'asking', holderId: 'host', guarded };
    expect(characterView(players[0], ctx)).toEqual({ kind: 'hidden' });
    expect(characterView(players[1], ctx)).toEqual({ kind: 'guarded', text: 'Cleopatra' });
    expect(characterView(players[3], ctx)).toEqual({ kind: 'open', text: 'Pikachu' });
  });

  it('ein Gast haelt das Handy: seine Figur verdeckt, die des Hosts und anderer sichtbar', () => {
    const ctx = { phase: 'answerVote', holderId: 'g1', guarded };
    expect(characterView(players[1], ctx)).toEqual({ kind: 'hidden' });
    expect(characterView(players[0], ctx).kind).toBe('guarded');
    expect(characterView(players[2], ctx).kind).toBe('guarded');
    expect(characterView(players[3], ctx)).toEqual({ kind: 'open', text: 'Pikachu' });
  });

  it('nie die eigene Figur in der Verteil-Ansicht — fuer jeden Halter', () => {
    for (const holder of local) {
      const shown = visibleCharacters(players, { phase: 'assign', holderId: holder, guarded });
      expect(shown.map(s => s.player.id)).not.toContain(holder);
      expect(shown).toHaveLength(players.length - 1);
      expect(JSON.stringify(shown)).not.toContain(players.find(p => p.id === holder)!.character);
    }
  });

  it('ohne Gaeste am Handy braucht nichts eine Geste', () => {
    const ctx = { phase: 'assign', holderId: 'host', guarded: guardedSeats(['host'], []) };
    expect(visibleCharacters(players, ctx).every(s => s.view.kind === 'open')).toBe(true);
  });

  it('aufgedeckt wird nur im Ergebnis des Fragenden oder im Endstand', () => {
    const solved = { ...players[1], guessedCorrectly: true };
    expect(characterView(solved, { phase: 'guessResult', holderId: 'g1', activeId: 'g1', guarded })).toEqual({ kind: 'open', text: 'Cleopatra' });
    // falsch geraten, Fragen uebrig: bleibt verdeckt
    expect(characterView(players[1], { phase: 'guessResult', holderId: 'g1', activeId: 'g1', maxQ: 20, guarded }).kind).toBe('hidden');
    // geloest, aber nicht der Fragende: kein Aufdecken fuer ihn
    expect(characterView(solved, { phase: 'guessResult', holderId: 'g1', activeId: 'g2', guarded }).kind).toBe('hidden');
    expect(characterView(players[0], { phase: 'gameOver', holderId: 'host', guarded })).toEqual({ kind: 'open', text: 'Einstein' });
  });

  it('leere Figur (vom Host geschwaerzt) bleibt verdeckt; lokales Spiel zeigt alles', () => {
    expect(characterView({ ...players[3], character: '' }, { phase: 'asking', holderId: 'p' }).kind).toBe('hidden');
    expect(characterView(players[0], { phase: 'asking', holderId: null })).toEqual({ kind: 'open', text: 'Einstein' });
  });
});

describe('Weitergabe am Host-Handy', () => {
  it('wer das Handy je Phase braucht', () => {
    expect(whoamiActiveSeat('asking', players, 1, 0, null)).toBe('g1');
    expect(whoamiActiveSeat('guessing', players, 2, 0, null)).toBe('g2');
    expect(whoamiActiveSeat('guessResult', players, 1, 0, null)).toBe('g1');
    // Fragender g1: Antworten in Sitzreihenfolge ohne ihn → host, g2, p
    expect(whoamiActiveSeat('answerVote', players, 1, 0, null)).toBe('host');
    expect(whoamiActiveSeat('answerVote', players, 1, 1, null)).toBe('g2');
    expect(whoamiActiveSeat('answerVote', players, 1, 2, null)).toBe('p');
    expect(whoamiActiveSeat('assign', players, 0, 0, 'g2')).toBe('g2');
    expect(whoamiActiveSeat('gameOver', players, 0, 0, null)).toBeNull();
    expect(answerVoter(players, 0, 5)).toBeUndefined();
  });

  it('Verteilen: erst der Host, dann jeder Gast; entfernte Plaetze fallen weg', () => {
    expect(pendingAssignViewers(local, players, [])).toEqual(['host', 'g1', 'g2']);
    expect(pendingAssignViewers(local, players, ['host', 'g1'])).toEqual(['g2']);
    expect(pendingAssignViewers(local, players.filter(p => p.id !== 'g2'), ['host', 'g1'])).toEqual([]);
  });

  it('Halter ist der bestaetigte Gast, sonst der eigene Platz', () => {
    expect(holderSeat('host', null)).toBe('host');
    expect(holderSeat('host', 'g1')).toBe('g1');
  });
});

describe('private Zustaende und TV', () => {
  it('nur Plaetze mit eigenem Handy bekommen den privaten Zustand — nie Gaeste', () => {
    expect(snapshotRecipients(players, 'host', local)).toEqual(['p']);
    expect(snapshotRecipients(players, 'host', ['host'])).toEqual(['g1', 'g2', 'p']);
  });

  it('der Empfaenger sieht alle Figuren ausser der eigenen', () => {
    const state = { phase: 'asking', activeIdx: 0, maxQ: 20, players };
    const json = JSON.stringify(whoamiSnapshotFor(state, 'p'));
    expect(json).not.toContain('Pikachu');
    for (const name of ['Einstein', 'Cleopatra', 'Mozart']) expect(json).toContain(name);
  });

  it('TV: volle Identitaet, Figuren erst im Endstand', () => {
    const tv = whoamiTVPlayers('guessResult', [{ ...players[1], guessedCorrectly: true }]);
    expect(tv[0]).toMatchObject({ id: 'g1', name: 'G1', avatar: 'g', color: '#ef987e', character: '' });
    expect(JSON.stringify(whoamiTVPlayers('asking', players))).not.toMatch(/Einstein|Cleopatra|Mozart|Pikachu/);
    expect(whoamiTVPlayers('gameOver', players)[0].character).toBe('Einstein');
  });

  it('Bonus fuer schnelles Loesen bleibt zwischen 1 und 10', () => {
    expect(solveBonus(0, 20)).toBe(10);
    expect(solveBonus(18, 20)).toBe(2);
    expect(solveBonus(25, 20)).toBe(1);
  });
});

describe('assign: Start waits until every seat at the host phone has seen the cards', () => {
  const players = [{ id: 'host', name: 'Luca' }, { id: 'lena', name: 'Lena' }, { id: 'max', name: 'Max' }, { id: 'gerda', name: 'Gerda' }];
  const local = ['host', 'max', 'gerda'];
  it('names everyone at this phone who has not seen the cards, in handover order', () => {
    expect(notSeenNames(pendingAssignViewers(local, players, ['host']), players)).toEqual(['Max', 'Gerda']);
    expect(notSeenNames(pendingAssignViewers(local, players, ['host', 'max', 'gerda']), players)).toEqual([]);
  });
  it('hands the phone on to the next guest automatically after each confirmation', () => {
    const seen: string[] = [];
    const order: (string | null)[] = [];
    for (let step = 0; step < 4; step++) {
      const next = pendingAssignViewers(local, players, seen)[0] ?? null;
      order.push(whoamiActiveSeat('assign', players, 0, 0, next));
      if (next) seen.push(next);
    }
    expect(order).toEqual(['host', 'max', 'gerda', null]);
  });
});
