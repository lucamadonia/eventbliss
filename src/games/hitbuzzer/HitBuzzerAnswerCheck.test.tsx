import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HitBuzzerAnswerCheck } from './HitBuzzerAnswerCheck';
import { roundFlowText } from './round-flow-copy';

const labels = { ...roundFlowText('de'), correct: 'Richtig', wrong: 'Falsch' };
const props = { playerName: 'Mia', secondsLeft: 6, totalSeconds: 8, mode: 'both' as const,
  onSpoken: () => {}, onCorrect: () => {}, onWrong: () => {}, labels };

describe('Hit-Buzzer answer moment', () => {
  it('requires the spoken answer before privately displaying the solution', () => {
    const own = renderToStaticMarkup(<HitBuzzerAnswerCheck {...props} phase="answering" solution={null} isClaimant />);
    expect(own).toContain('Gesagt · prüfen');
    expect(own).not.toContain('Richtig');
    expect(own).not.toContain('Artist');
    expect(own).toContain('Mia');
    expect(own).toContain('>6<');
    const other = renderToStaticMarkup(<HitBuzzerAnswerCheck {...props} phase="reviewing" solution={null} isClaimant={false} />);
    expect(other).toContain('Die Antwort wird abgeglichen');
    expect(other).not.toContain('Richtig');
    expect(other).not.toContain('Artist');
  });

  it('shows both fields but highlights only the field required by the mode', () => {
    const solution = { title: 'The Song', artist: 'The Artist' };
    const title = renderToStaticMarkup(<HitBuzzerAnswerCheck {...props} phase="reviewing" mode="title" solution={solution} isClaimant />);
    const artist = renderToStaticMarkup(<HitBuzzerAnswerCheck {...props} phase="reviewing" mode="artist" solution={solution} isClaimant />);
    expect(title).toContain('The Song');
    expect(title).toContain('The Artist');
    expect(title.match(/Zählt/g)).toHaveLength(1);
    expect(artist.match(/Zählt/g)).toHaveLength(1);
    expect(title).toContain('Richtig');
    expect(title).toContain('Falsch');
  });
});
