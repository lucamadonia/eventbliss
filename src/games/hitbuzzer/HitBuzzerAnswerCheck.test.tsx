import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HitBuzzerAnswerCheck } from './HitBuzzerAnswerCheck';

const labels = { answerNow: 'Dein Buzzer-Moment', sayAnswer: 'Interpret und Titel nennen', markAnswer: 'Selbst bewerten',
  waitForPlayer: 'Antwort wird gesagt', correct: 'Richtig', wrong: 'Falsch' };
const props = { playerName: 'Mia', secondsLeft: 6, totalSeconds: 8, onCorrect: () => {}, onWrong: () => {}, labels };

describe('Hit-Buzzer answer moment', () => {
  it('lets only the buzzer owner judge and keeps the secret song out of the card', () => {
    const own = renderToStaticMarkup(<HitBuzzerAnswerCheck {...props} canJudge />);
    expect(own).toContain('Richtig');
    expect(own).toContain('Falsch');
    expect(own).toContain('Mia');
    expect(own).toContain('>6<');
    expect(own).not.toContain('Gesuchter Song');
    expect(own).not.toContain('Lösung für Host');

    const other = renderToStaticMarkup(<HitBuzzerAnswerCheck {...props} canJudge={false} />);
    expect(other).toContain('Antwort wird gesagt');
    expect(other).not.toContain('Richtig');
    expect(other).not.toContain('Falsch');
  });
});
