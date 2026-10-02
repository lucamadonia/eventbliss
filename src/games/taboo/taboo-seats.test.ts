import { describe, expect, it } from 'vitest';
import { activeGuest, handoverReducer, initialHandoverState, isClockPaused, type HandoverState } from '../ui/handover-machine';
import {
  mayHolderSeeCard, phoneHolder, pickReferee, tabooHandoverSeat, tabooRecipients, tabooRoles, tabooSeatRole,
  tabooSnapshotFor, tabooTvPlayers, tabooTvState, type TabooRoles,
} from './taboo-seats';

/*
 * Party: host phone "host" plays host + 🔁 guests g1, g2; own phones p1..p3.
 * Teams (ids, as built at start): A = host, g1, p1 · B = g2, p2, p3.
 */
const players = [
  { id: 'host' }, { id: 'g1', controlledBy: 'host' }, { id: 'p1' },
  { id: 'g2', controlledBy: 'host' }, { id: 'p2' }, { id: 'p3' },
];
const team = (...ids: string[]) => ({ ids, players: ids.map(id => id.toUpperCase()) });
const teams = [team('host', 'g1', 'p1'), team('g2', 'p2', 'p3')] as const;
const local = ['host', 'g1', 'g2'];
const isGuest = (id: string) => id === 'g1' || id === 'g2';
const isLocal = (id: string) => local.includes(id);
const CARD = { term: 'Zahnbürste', forbidden: ['Zähne', 'putzen'], category: 'x', difficulty: 'easy' as const };

describe('taboo roles', () => {
  it('explainer is the active team pointer; referee rotates in the other team', () => {
    expect(tabooRoles([...teams] as never, 0, [2, 1], players)).toEqual({ explainerId: 'p1', refereeId: 'p2' });
    expect(tabooRoles([...teams] as never, 1, [0, 2], players)).toEqual({ explainerId: 'p3', refereeId: 'host' });
  });
  it('prefers a referee on another device than the explainer', () => {
    // g1 (host phone) explains, next in B would be g2 — also on the host phone → p2 referees.
    expect(tabooRoles([...teams] as never, 0, [1, 0], players)).toEqual({ explainerId: 'g1', refereeId: 'p2' });
    // host explains: g2 skipped as well
    expect(tabooRoles([...teams] as never, 0, [0, 0], players).refereeId).toBe('p2');
  });
  it('phone-only groups keep the plain rotation (every seat its own device)', () => {
    const own = ['a', 'b', 'c', 'd'].map(id => ({ id }));
    expect(tabooRoles([team('a', 'b'), team('c', 'd')], 0, [1, 3], own)).toEqual({ explainerId: 'b', refereeId: 'd' });
  });
  it('falls back to the room half split for teams without ids', () => {
    const roomPlayers = ['a', 'b', 'c', 'd', 'e'].map(id => ({ id }));
    expect(tabooRoles([{ players: ['A', 'B', 'C'] }, { players: ['D', 'E'] }], 1, [0, 1], roomPlayers)).toEqual({ explainerId: 'e', refereeId: 'a' });
  });
  it('pickReferee: whole team on the explainer device → normal pointer; empty → null', () => {
    expect(pickReferee(['x', 'y'], 1, 'dev', () => 'dev')).toBe('y');
    expect(pickReferee([], 0, null, id => id)).toBeNull();
  });
});

describe('who gets the host phone', () => {
  const roles = (explainerId: string, refereeId: string): TabooRoles => ({ explainerId, refereeId });
  it('a guest explainer from the turn announcement to the end of the turn', () => {
    expect(tabooHandoverSeat('turnStart', roles('g1', 'p2'), isGuest, isLocal)).toBe('g1');
    expect(tabooHandoverSeat('playing', roles('g1', 'p2'), isGuest, isLocal)).toBe('g1');
    expect(tabooHandoverSeat('turnSummary', roles('g1', 'p2'), isGuest, isLocal)).toBeNull();
  });
  it('a guest referee only while a remote explainer plays', () => {
    expect(tabooHandoverSeat('turnStart', roles('p1', 'g2'), isGuest, isLocal)).toBeNull();
    expect(tabooHandoverSeat('playing', roles('p1', 'g2'), isGuest, isLocal)).toBe('g2');
  });
  it('the host keeps it when he explains (the referee guest reads along)', () => {
    expect(tabooHandoverSeat('playing', roles('host', 'g2'), isGuest, isLocal)).toBeNull();
  });
  it('nothing to hand over for own-phone roles or setup/game over', () => {
    expect(tabooHandoverSeat('playing', roles('p1', 'p2'), isGuest, isLocal)).toBeNull();
    expect(tabooHandoverSeat('setup', roles('g1', 'g2'), isGuest, isLocal)).toBeNull();
    expect(tabooHandoverSeat('gameOver', roles('g1', 'g2'), isGuest, isLocal)).toBeNull();
  });
});

describe('may this holder see the card?', () => {
  const roles: TabooRoles = { explainerId: 'g1', refereeId: 'p2' };
  it('only in a running turn', () => {
    for (const phase of ['setup', 'turnStart', 'turnSummary', 'gameOver']) {
      expect(mayHolderSeeCard({ isOnline: true, phase, holder: 'g1', roles })).toBe(false);
      expect(mayHolderSeeCard({ isOnline: false, phase, holder: null, roles })).toBe(false);
    }
  });
  it('local pass-and-play is unchanged: the card shows while playing', () => {
    expect(mayHolderSeeCard({ isOnline: false, phase: 'playing', holder: null, roles })).toBe(true);
  });
  it('explainer and referee yes; guessers, other watchers and nobody no', () => {
    expect(mayHolderSeeCard({ isOnline: true, phase: 'playing', holder: 'g1', roles })).toBe(true);
    expect(mayHolderSeeCard({ isOnline: true, phase: 'playing', holder: 'p2', roles })).toBe(true);
    expect(mayHolderSeeCard({ isOnline: true, phase: 'playing', holder: 'host', roles })).toBe(false); // teammate of g1
    expect(mayHolderSeeCard({ isOnline: true, phase: 'playing', holder: 'p1', roles })).toBe(false);
    expect(mayHolderSeeCard({ isOnline: true, phase: 'playing', holder: 'p3', roles })).toBe(false);
    expect(mayHolderSeeCard({ isOnline: true, phase: 'playing', holder: null, roles })).toBe(false);
  });
  it('the holder is nobody while the phone travels, the guest only after confirming', () => {
    expect(phoneHolder({ isOnline: true, myId: 'host', activeGuest: null, handoverPaused: true })).toBeNull();
    expect(phoneHolder({ isOnline: true, myId: 'host', activeGuest: 'g1', handoverPaused: false })).toBe('g1');
    expect(phoneHolder({ isOnline: true, myId: 'host', activeGuest: null, handoverPaused: false })).toBe('host');
    expect(phoneHolder({ isOnline: false, myId: null, activeGuest: null, handoverPaused: false })).toBeNull();
  });
  it('roles per holder', () => {
    const args = { isOnline: true, roles, activeTeamIds: ['host', 'g1', 'p1'] };
    expect(tabooSeatRole({ ...args, holder: 'g1' })).toBe('explainer');
    expect(tabooSeatRole({ ...args, holder: 'p2' })).toBe('referee');
    expect(tabooSeatRole({ ...args, holder: 'host' })).toBe('guesser');
    expect(tabooSeatRole({ ...args, holder: 'p3' })).toBe('watcher');
    expect(tabooSeatRole({ ...args, holder: null })).toBe('watcher');
    expect(tabooSeatRole({ ...args, isOnline: false, holder: null })).toBe('explainer');
  });
});

/**
 * End-to-end on the host phone: drive the real handover machine the way
 * useSeatHandover does and check the card at EVERY step of whole turns.
 */
describe('host phone never leaks the card (simulated turns)', () => {
  type Step = { phase: string; roles: TabooRoles; confirm?: boolean };
  function run(steps: Step[]) {
    let state: HandoverState = initialHandoverState;
    let previous: string | null = null;
    const seen: { phase: string; holder: string | null; card: boolean; paused: boolean }[] = [];
    const look = (step: Step) => {
      const holder = phoneHolder({ isOnline: true, myId: 'host', activeGuest: activeGuest(state), handoverPaused: isClockPaused(state) });
      seen.push({ phase: step.phase, holder, card: mayHolderSeeCard({ isOnline: true, phase: step.phase, holder, roles: step.roles }), paused: isClockPaused(state) });
    };
    for (const step of steps) {
      look(step); // first render after the phase change, before the effect requested the handover
      const seat = tabooHandoverSeat(step.phase, step.roles, isGuest, isLocal);
      if (previous !== seat) {
        if (previous && isGuest(previous)) {
          if (activeGuest(state) === previous) state = handoverReducer(state, { type: 'done' });
          else state = handoverReducer(state, { type: 'cancel' });
        }
        if (seat && isGuest(seat)) state = handoverReducer(state, { type: 'request', playerIds: [seat] });
        previous = seat;
      }
      look(step);
      while (step.confirm !== false && state.status !== 'idle' && state.status !== 'revealed') {
        state = handoverReducer(state, { type: 'confirm' });
        look(step);
      }
    }
    return seen;
  }
  const forbidden = (roles: TabooRoles) => (holder: string | null) => !!holder && holder !== roles.explainerId && holder !== roles.refereeId;

  it('guest explainer g1 (host is a guessing teammate): card only after g1 confirmed, covered before the host gets it back', () => {
    const roles = { explainerId: 'g1', refereeId: 'p2' };
    const seen = run([{ phase: 'turnStart', roles }, { phase: 'playing', roles }, { phase: 'turnSummary', roles }]);
    expect(seen.filter(s => s.card).every(s => s.holder === 'g1')).toBe(true);
    expect(seen.some(s => s.card)).toBe(true);
    expect(seen.filter(s => s.holder === 'host').every(s => !s.card)).toBe(true);
    expect(seen.filter(s => forbidden(roles)(s.holder)).every(s => !s.card)).toBe(true);
  });

  it('remote explainer, guest referee g2, host guesses: the phone goes to g2, never shows the host', () => {
    const roles = { explainerId: 'p1', refereeId: 'g2' };
    const seen = run([{ phase: 'turnStart', roles }, { phase: 'playing', roles }, { phase: 'turnSummary', roles }]);
    expect(seen.filter(s => s.card).map(s => s.holder)).toEqual(expect.arrayContaining(['g2']));
    expect(seen.filter(s => s.card).every(s => s.holder === 'g2')).toBe(true);
    expect(seen.filter(s => s.holder === 'host').every(s => !s.card)).toBe(true);
  });

  it('while the phone travels nobody sees the card and the clock is paused', () => {
    const roles = { explainerId: 'g1', refereeId: 'p2' };
    const seen = run([{ phase: 'turnStart', roles, confirm: false }, { phase: 'playing', roles, confirm: false }]);
    expect(seen.filter(s => s.paused).every(s => !s.card && s.holder === null)).toBe(true);
    expect(seen.some(s => s.paused)).toBe(true);
  });

  it('host explains: he sees it on his own phone, no handover', () => {
    const roles = { explainerId: 'host', refereeId: 'p2' };
    const seen = run([{ phase: 'turnStart', roles }, { phase: 'playing', roles }]);
    expect(seen.every(s => !s.paused && s.holder === 'host')).toBe(true);
    expect(seen.filter(s => s.phase === 'playing').every(s => s.card)).toBe(true);
  });

  it('two guest turns in a row (g1 explains team A, then g2 team B): no card for the wrong guest', () => {
    const a = { explainerId: 'g1', refereeId: 'p2' }, b = { explainerId: 'g2', refereeId: 'p1' };
    const seen = run([{ phase: 'playing', roles: a }, { phase: 'turnSummary', roles: a }, { phase: 'turnStart', roles: b }, { phase: 'playing', roles: b }]);
    for (const s of seen.filter(x => x.card)) expect(['g1', 'g2']).toContain(s.holder);
    const cardHolders = seen.filter(s => s.card);
    expect(cardHolders.length).toBeGreaterThan(0);
  });
});

describe('private sends', () => {
  it('only devices: never the host itself, never 🔁 guests', () => {
    expect(tabooRecipients(players, 'host', local)).toEqual(['p1', 'p2', 'p3']);
    // a guest is skipped by controlledBy even if the local seat list lags
    expect(tabooRecipients(players, 'host', ['host'])).toEqual(['p1', 'p2', 'p3']);
  });
  const state = { phase: 'playing', currentCard: CARD, turnResults: [{ card: { ...CARD, term: 'Schon gespielt' }, result: 'skipped' }], other: 1 };
  const roles: TabooRoles = { explainerId: 'p1', refereeId: 'p2' };
  it('explainer and referee get the card; guessers and watchers neither card nor played cards', () => {
    expect(tabooSnapshotFor(state, 'p1', roles).currentCard).toEqual(CARD);
    expect(tabooSnapshotFor(state, 'p2', roles).currentCard).toEqual(CARD);
    const guesser = tabooSnapshotFor(state, 'p3', roles);
    expect(guesser.currentCard).toBeNull();
    expect(JSON.stringify(guesser)).not.toContain('Zahnbürste');
    expect(JSON.stringify(guesser)).not.toContain('Schon gespielt');
    expect(guesser.turnResults[0].result).toBe('skipped');
    expect(guesser.other).toBe(1);
  });
  it('outside a turn no card; the summary list is public', () => {
    const summary = tabooSnapshotFor({ ...state, phase: 'turnSummary' }, 'p3', roles);
    expect(summary.currentCard).toBeNull();
    expect(summary.turnResults[0].card.term).toBe('Schon gespielt');
    expect(tabooSnapshotFor({ ...state, phase: 'turnStart' }, 'p1', roles).currentCard).toBeNull();
  });
});

describe('TV', () => {
  const tvTeams = [{ ...team('host', 'g1'), name: 'Team A', color: 'bg-[#ff8572]', score: 2 }, { ...team('p1', 'p2'), name: 'Team B', color: 'bg-[#e6ce81]', score: 1 }] as const;
  const seats = [{ id: 'host', name: 'Luca', avatar: '🎸', color: '#df8eff' }, { id: 'g1', name: 'Max', avatar: '🦊', color: '#ff6b98' }];
  it('full player identity with fallbacks', () => {
    const roster = tabooTvPlayers([...tvTeams] as never, seats);
    expect(roster[0]).toEqual({ id: 'host', name: 'Luca', avatar: '🎸', color: '#df8eff', team: 0 });
    expect(roster[2]).toEqual({ id: 'p1', name: 'P1', avatar: 'P', color: '#e6ce81', team: 1 });
  });
  it('never carries the card', () => {
    const tv = tabooTvState({
      phase: 'playing', phaseStartsAt: 1, currentRound: 1, totalRounds: 2, teams: [...tvTeams] as never, activeTeamIdx: 0,
      explainer: { id: 'g1', name: 'Max', avatar: '🦊', color: '#ff6b98' }, timeLeft: 40,
      turnResults: [{ result: 'correct', card: CARD } as never, { result: 'taboo' } as never],
      players: tabooTvPlayers([...tvTeams] as never, seats), handover: null,
    });
    expect(JSON.stringify(tv)).not.toContain('Zahnbürste');
    expect(JSON.stringify(tv)).not.toContain('Zähne');
    expect(tv).toMatchObject({ turnCorrect: 1, turnTaboo: 1, turnSkipped: 0, phaseStartsAt: 1, explainer: { name: 'Max' } });
    expect(tv.teams[0]).toEqual({ name: 'Team A', color: 'bg-[#ff8572]', score: 2, players: ['HOST', 'G1'], ids: ['host', 'g1'] });
  });
});
