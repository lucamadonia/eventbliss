import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { scoreChipShadow } from '../components/TVScoreboard';

describe('TVScoreboard ring', () => {
  it('drops the active ring explicitly once nobody is active', () => {
    expect(scoreChipShadow(true, false, '#ff6b98')).toContain('#ff6b98');
    expect(scoreChipShadow(false, false, '#ff6b98')).toBe('none');
    expect(scoreChipShadow(false, true, '#ff6b98')).toContain('28px');
  });
});

describe('TVPhaseCard timing', () => {
  // Timer-Spiele schicken jede Sekunde einen neuen Zustand → neues Cue-Objekt.
  // Haengt der Effekt am Objekt, bricht jeder Takt den Ausblend-Timer ab und
  // die Karte bleibt stehen. Der Effekt darf nur am Schluessel haengen.
  it('runs its effect on the cue key, not on the cue object', () => {
    const src = fs.readFileSync(path.resolve(__dirname, 'TVPhaseCard.tsx'), 'utf8');
    expect(src).toContain('}, [cueKey, phaseStartsAt]);');
    expect(src).not.toContain('}, [cue, phaseStartsAt]);');
  });
});

describe('TV scene container', () => {
  // Ohne Hoehe am Szenen-Container fielen Ansichten mit h-full/flex-1 auf
  // Inhaltshoehe zusammen (Batch D musste h-screen in jede Ansicht schreiben).
  it('gives every scene the full screen height', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../TVScreen.tsx'), 'utf8');
    const scene = src.slice(src.indexOf('data-tv-scene'), src.indexOf('data-tv-scene') + 200);
    expect(scene).toMatch(/className="[^"]*\bh-screen\b[^"]*"/);
  });
});
