import { describe, it, expect, beforeEach } from 'vitest';
import { registerBackGuard, runBackGuards } from './back-guard';

/**
 * Die Reihenfolge ist der ganze Kern dieses Moduls — und im laufenden Programm
 * unsichtbar. Steht sie falsch herum, stürzt nichts ab: Der Zurück-Knopf
 * springt mitten in einer Partie ohne Nachfrage zur Spieleübersicht, und die
 * Partie ist weg. Genau deshalb steht sie hier fest.
 */
const stack = () => (globalThis as unknown as { __modalStack?: unknown[] }).__modalStack;

beforeEach(() => {
  (globalThis as unknown as { __modalStack?: unknown[] }).__modalStack = [];
});

describe('runBackGuards', () => {
  it('fragt Overlays von innen nach außen — zuletzt registriert zuerst', () => {
    const asked: string[] = [];
    registerBackGuard(() => { asked.push('außen'); return false; });
    registerBackGuard(() => { asked.push('innen'); return false; });

    expect(runBackGuards()).toBe(false);
    expect(asked).toEqual(['innen', 'außen']);
  });

  it('hält an, sobald ein Handler übernimmt', () => {
    const asked: string[] = [];
    registerBackGuard(() => { asked.push('darunter'); return false; });
    registerBackGuard(() => { asked.push('übernimmt'); return true; });

    expect(runBackGuards()).toBe(true);
    // Der darunterliegende darf gar nicht erst gefragt werden.
    expect(asked).toEqual(['übernimmt']);
  });

  it('fragt den Rückfall der Route ZULETZT, auch wenn er zuerst registriert wurde', () => {
    const asked: string[] = [];
    registerBackGuard(() => { asked.push('route'); return true; }, 'route');
    registerBackGuard(() => { asked.push('spiel'); return true; });

    expect(runBackGuards()).toBe(true);
    // Das laufende Spiel behält seinen Bestätigungsdialog.
    expect(asked).toEqual(['spiel']);
  });

  it('fragt den Rückfall der Route ZULETZT, auch wenn er zuletzt registriert wurde', () => {
    // Der eigentliche Fall: React führt Kind-Effekte VOR Eltern-Effekten aus,
    // die Route registriert also nach dem Spiel. Ohne das `unshift` läge sie
    // damit oben auf dem Stapel und würde zuerst gefragt.
    const asked: string[] = [];
    registerBackGuard(() => { asked.push('spiel'); return true; });
    registerBackGuard(() => { asked.push('route'); return true; }, 'route');

    expect(runBackGuards()).toBe(true);
    expect(asked).toEqual(['spiel']);
  });

  it('greift der Rückfall, wenn sich sonst niemand zuständig fühlt', () => {
    const asked: string[] = [];
    registerBackGuard(() => { asked.push('route'); return true; }, 'route');
    registerBackGuard(() => { asked.push('spiel'); return false; });

    expect(runBackGuards()).toBe(true);
    expect(asked).toEqual(['spiel', 'route']);
  });

  it('lässt einen kaputten Handler die Navigation nicht blockieren', () => {
    const asked: string[] = [];
    registerBackGuard(() => { asked.push('darunter'); return false; });
    registerBackGuard(() => { throw new Error('kaputt'); });

    expect(runBackGuards()).toBe(false);
    expect(asked).toEqual(['darunter']);
  });

  it('trägt einen Handler wieder aus', () => {
    const asked: string[] = [];
    const off = registerBackGuard(() => { asked.push('weg'); return true; });
    off();

    expect(runBackGuards()).toBe(false);
    expect(asked).toEqual([]);
    expect(stack()).toHaveLength(0);
  });

  it('meldet false, wenn gar nichts registriert ist', () => {
    expect(runBackGuards()).toBe(false);
  });
});
