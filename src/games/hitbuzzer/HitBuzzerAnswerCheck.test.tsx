import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HitBuzzerAnswerCheck } from './HitBuzzerAnswerCheck';

const labels = { heading: 'Antwort prüfen', prompt: 'Erst laut nennen lassen', open: 'Lösung öffnen', artist: 'Interpret', title: 'Titel', compare: 'Abgleichen', privateHint: 'Gerät zum Host drehen', correct: 'Richtig', wrong: 'Falsch', void: 'Nicht wertbar' };
const props = { artist: 'The Weeknd', title: 'Blinding Lights', sharedDevice: false, onOpen: () => {}, onCorrect: () => {}, onWrong: () => {}, onVoid: () => {}, labels };

describe('Hit-Buzzer host answer card', () => {
  it('keeps the reference answer hidden until the host opens the review', () => {
    const closed = renderToStaticMarkup(<HitBuzzerAnswerCheck {...props} open={false} />);
    expect(closed).toContain('Lösung öffnen');
    expect(closed).not.toContain('The Weeknd');
    expect(closed).not.toContain('Blinding Lights');
    expect(closed).not.toContain('Richtig');

    const open = renderToStaticMarkup(<HitBuzzerAnswerCheck {...props} open />);
    expect(open).toContain('The Weeknd');
    expect(open).toContain('Blinding Lights');
    expect(open).toContain('Richtig');
    const shared = renderToStaticMarkup(<HitBuzzerAnswerCheck {...props} open sharedDevice />);
    expect(shared).toContain('role="dialog"');
    expect(shared).toContain('Gerät zum Host drehen');
  });
});
