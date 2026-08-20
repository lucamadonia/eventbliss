import { describe, it, expect } from 'vitest';
import { anchorKeyFor, ANCHOR_SUBJECTS } from './closeenough-anchors';

/**
 * Der Selbstverrats-Schutz ist der einzige Teil mit Logik — und der einzige,
 * bei dem ein Fehler das Spiel kaputtmacht statt nur zu nerven: Ein Tipp, der
 * die Antwort nennt, beendet die Runde, bevor sie begonnen hat.
 */
describe('anchorKeyFor', () => {
  it('liefert den Schlüssel zum Rahmen', () => {
    expect(anchorKeyFor('height_structure')).toBe('games.closeenough.anchors.height_structure');
  });

  it('hat für jeden Rahmen einen Anker', () => {
    // 42 Rahmen, 42 Anker. Fehlt einer, bleibt der Tipp-Knopf dort stumm.
    expect(Object.keys(ANCHOR_SUBJECTS)).toHaveLength(42);
  });

  it('unterdrückt den Tipp, wenn er die Antwort verraten würde', () => {
    // „Wie hoch ist der Brocken?" darf nicht mit „Der Brocken ist 1141 m hoch"
    // beantwortet werden.
    expect(anchorKeyFor('height_mountain', 'Brocken')).toBeNull();
  });

  it('erkennt den Verrat auch bei abweichender Schreibung', () => {
    expect(anchorKeyFor('height_mountain', 'brocken')).toBeNull();
    expect(anchorKeyFor('population', 'München')).toBeNull();
  });

  it('erkennt Teilnamen in beide Richtungen', () => {
    // Der Anker nennt den Main; die Frage geht um den Main-Donau-Kanal.
    expect(anchorKeyFor('length_river', 'Main-Donau-Kanal')).toBeNull();
  });

  it('lässt unbeteiligte Fragen unangetastet', () => {
    expect(anchorKeyFor('height_mountain', 'Mount Everest')).not.toBeNull();
    expect(anchorKeyFor('population', 'Barcelona')).not.toBeNull();
  });

  it('kollidiert nie bei Ankern ohne benannten Gegenstand', () => {
    // „Ein Wohnhaus ist etwa 10 Meter hoch" nennt nichts Bestimmtes.
    expect(anchorKeyFor('height_structure', 'Wohnhaus')).not.toBeNull();
    expect(anchorKeyFor('mass_animal', 'Blauwal')).not.toBeNull();
  });

  it('gibt für Freitextfragen keinen Anker', () => {
    // Handverlesene Alltagsfragen haben keinen Rahmen und damit keinen Bezug.
    expect(anchorKeyFor('custom', 'Olympisches Schwimmbecken')).toBeNull();
  });

  it('kommt ohne Fragennamen aus', () => {
    expect(anchorKeyFor('population')).toBe('games.closeenough.anchors.population');
  });
});
