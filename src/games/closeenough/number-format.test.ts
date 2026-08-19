import { describe, it, expect } from 'vitest';
import { parseNumber, formatNumber, formatWhileTyping, relativeError } from './number-format';

/**
 * Die Fälle hier sind nicht theoretisch: „2.500.000" heißt im Deutschen
 * zweieinhalb Millionen, `parseFloat` macht daraus 2. Ein solcher Fehler
 * verwandelt die beste Schätzung in die schlechteste, ohne dass irgendwo etwas
 * abstürzt — deshalb steht genau das hier unter Test.
 */
describe('parseNumber', () => {
  it('liest deutsche Tausenderpunkte richtig', () => {
    expect(parseNumber('2.500.000', 'de')).toBe(2_500_000);
    expect(parseNumber('1.620.343', 'de')).toBe(1_620_343);
  });

  it('liest englische Tausenderkommas richtig', () => {
    expect(parseNumber('2,500,000', 'en')).toBe(2_500_000);
    expect(parseNumber('1,620,343', 'en')).toBe(1_620_343);
  });

  it('erkennt eine einzelne Dreiergruppe als Tausender, nicht als Dezimalstelle', () => {
    // "2.500" ist im Deutschen zweitausendfünfhundert. Genau hier liegt die
    // Mehrdeutigkeit, an der eine naive Umsetzung scheitert.
    expect(parseNumber('2.500', 'de')).toBe(2500);
    expect(parseNumber('2,500', 'en')).toBe(2500);
  });

  it('versteht Dezimalstellen in beiden Schreibweisen', () => {
    expect(parseNumber('3,7', 'de')).toBeCloseTo(3.7);
    expect(parseNumber('3.7', 'en')).toBeCloseTo(3.7);
    expect(parseNumber('1.234,56', 'de')).toBeCloseTo(1234.56);
    expect(parseNumber('1,234.56', 'en')).toBeCloseTo(1234.56);
  });

  it('nimmt arabisch-indische Ziffern an', () => {
    // Auf einer arabischen Tastatur entstehen genau diese Zeichen. Ohne
    // Umsetzung könnte dort niemand mitspielen.
    expect(parseNumber('٢٥٠٠٠٠٠', 'ar')).toBe(2_500_000);
    expect(parseNumber('١٢٣', 'ar')).toBe(123);
  });

  it('verträgt Leerzeichen als Tausendertrenner', () => {
    expect(parseNumber('2 500 000', 'fr')).toBe(2_500_000);
  });

  it('ignoriert mitgetippte Einheiten', () => {
    expect(parseNumber('300 m', 'de')).toBe(300);
    expect(parseNumber('84 Meter', 'de')).toBe(84);
  });

  it('liefert null statt zu raten, wenn keine Zahl drinsteht', () => {
    expect(parseNumber('', 'de')).toBeNull();
    expect(parseNumber('keine Ahnung', 'de')).toBeNull();
    expect(parseNumber('   ', 'de')).toBeNull();
  });

  it('behält negative Werte für Jahreszahlen vor Christus', () => {
    expect(parseNumber('-2560', 'de')).toBe(-2560);
  });
});

describe('formatWhileTyping', () => {
  it('gruppiert wachsende Eingaben', () => {
    expect(formatWhileTyping('2500000', 'de')).toBe('2.500.000');
    expect(formatWhileTyping('2500000', 'en')).toBe('2,500,000');
  });

  it('lässt ein angefangenes Dezimalzeichen stehen', () => {
    // Sonst könnte man das Komma nicht tippen — es verschwände sofort wieder.
    expect(formatWhileTyping('3,', 'de')).toBe('3,');
    expect(formatWhileTyping('3,7', 'de')).toBe('3,7');
  });

  it('rundet Nachkommastellen beim Tippen nicht weg', () => {
    expect(formatWhileTyping('1234,567', 'de')).toBe('1.234,567');
  });

  it('gibt unfertige Eingaben unverändert zurück', () => {
    expect(formatWhileTyping('', 'de')).toBe('');
    expect(formatWhileTyping('-', 'de')).toBe('-');
  });
});

describe('formatNumber', () => {
  it('schreibt in der Sprache des Spielers', () => {
    expect(formatNumber(2_500_000, 'de')).toBe('2.500.000');
    expect(formatNumber(2_500_000, 'en')).toBe('2,500,000');
  });
});

describe('relativeError', () => {
  it('misst die Abweichung im Verhältnis zur Wahrheit', () => {
    expect(relativeError(2_000_000, 2_500_000)).toBeCloseTo(0.2);
    expect(relativeError(2_500_000, 2_500_000)).toBe(0);
  });

  it('behandelt große und kleine Fragen gleich fair', () => {
    // 20 % daneben ist 20 % daneben — egal ob bei acht Beinen oder
    // zweieinhalb Millionen Litern. Absolut gerechnet wäre das nicht so.
    expect(relativeError(10, 8)).toBeCloseTo(relativeError(3_125_000, 2_500_000));
  });

  it('läuft bei einer Antwort von null nicht ins Unendliche', () => {
    expect(Number.isFinite(relativeError(5, 0))).toBe(true);
  });
});
