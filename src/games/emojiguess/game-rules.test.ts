import { it, expect } from 'vitest';
import { awardEmojiPoints, matchesEmojiAnswer, publicEmojiPuzzle, nextEmojiTurn, emojiRoundBudget } from './game-rules';
import { getEMOJI_PUZZLES } from './emoji-content';
import { curateEmojiPuzzles } from './curated-puzzles';
import { EMOJI_PUZZLES as de } from './emoji-content-de';
import { EMOJI_PUZZLES as en } from './emoji-content-en';
it('requires a real matching answer while accepting accents, case and punctuation', () => {
  expect(matchesEmojiAnswer('  KÖNIG-DER LÖWEN ', 'König der Löwen')).toBe(true);
  expect(matchesEmojiAnswer('', 'Titanic')).toBe(false);
  expect(matchesEmojiAnswer('Titan', 'Titanic')).toBe(false);
});
it('accepts explicit title aliases and German keyboard spelling, without substring guessing', () => {
  expect(matchesEmojiAnswer('der koenig der loewen', 'König der Löwen', ['Der König der Löwen'])).toBe(true);
  expect(matchesEmojiAnswer('Spider Man', 'Spider-Man')).toBe(true);
  expect(matchesEmojiAnswer('E.T.!', 'ET')).toBe(true);
  expect(matchesEmojiAnswer('Lion', 'The Lion King')).toBe(false);
});
it('does not disclose any alternate solution in a live snapshot', () => {
  const p = { answer: 'König der Löwen', aliases: ['The Lion King'], emojis: '🦁👑' };
  expect(publicEmojiPuzzle(p, false, true)).toEqual({ ...p, answer: 'K', aliases: [] });
});
it('curates clear clues and carries translated titles as accepted answers', () => {
  const curated = curateEmojiPuzzles(de, [de, en]);
  expect(curated.length).toBeGreaterThanOrEqual(25);
  expect(curated.some(p => p.answer === 'Probieren geht über Studieren')).toBe(false);
  expect(curated.find(p => p.emojis === '🦁👑')?.aliases).toContain('The Lion King');
  expect(new Set(curated.map(p => p.emojis)).size).toBe(curated.length);
});
it('gives every player exactly one turn per round, including odd team rosters', () => {
  const seen: number[] = []; let actor = 0; let round = 1;
  for (let i = 0; i < 6; i++) {
    seen.push(actor); const next = nextEmojiTurn(actor, round, 3, 2);
    expect(next.finished).toBe(i === 5); actor = next.nextPlayer; round = next.round;
  }
  expect(seen).toEqual([0, 1, 2, 0, 1, 2]);
});
it.each(['de','en','es','fr','it','nl','pl','pt','tr','ar'])('has a substantial unique localized deck and a fair non-repeating budget: %s', language => {
  const deck = getEMOJI_PUZZLES(language);
  expect(deck.length).toBeGreaterThanOrEqual(60);
  expect(new Set(deck.map(p => p.answer)).size).toBe(deck.length);
  for (const players of [2, 3, 12, 20]) {
    const rounds = emojiRoundBudget(30, players, deck.length);
    expect(rounds * players).toBeLessThanOrEqual(deck.length);
    expect(rounds).toBeGreaterThan(0);
  }
  expect(deck.every(p => p.answer && p.category && matchesEmojiAnswer(p.answer, p.answer, p.aliases))).toBe(true);
});
it('awards a team once through its members, with no opponent points', () => {
  const players = Array.from({length:4}, () => ({score:0,streak:0}));
  expect(awardEmojiPoints(players, 2, 70, true).map(p => p.score)).toEqual([70,0,70,0]);
  expect(awardEmojiPoints(players, 2, 70, false).map(p => p.score)).toEqual([0,0,70,0]);
});
it('reveals only the permitted clue before the result', () => {
  const puzzle = {answer:'Titanic', emojis:'🚢'};
  expect(publicEmojiPuzzle(puzzle,false,false)?.answer).toBe('');
  expect(publicEmojiPuzzle(puzzle,false,true)?.answer).toBe('T');
  expect(publicEmojiPuzzle(puzzle,true,true)?.answer).toBe('Titanic');
});

