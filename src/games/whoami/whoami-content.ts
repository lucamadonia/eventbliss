// Auto-generated language loader — selects content by current i18next language.
import i18n from 'i18next';
import * as de from './whoami-content-de';
import * as en from './whoami-content-en';
import * as es from './whoami-content-es';
import * as fr from './whoami-content-fr';
import * as it from './whoami-content-it';
import * as nl from './whoami-content-nl';
import * as pl from './whoami-content-pl';
import * as pt from './whoami-content-pt';
import * as tr from './whoami-content-tr';
import * as ar from './whoami-content-ar';

const BY_LANG: Record<string, typeof de> = { de, en, es, fr, it, nl, pl, pt, tr, ar };
function pack(): typeof de {
  const l = i18n.language?.split('-')[0] || 'de';
  return BY_LANG[l] || de;
}

export const getWHOAMI_CHARACTERS = () => pack().WHOAMI_CHARACTERS;

/**
 * Sprachunabhaengige Kennung einer Figurengruppe.
 *
 * WARUM ES DAS GIBT — der schwerste Fehler, den dieses Spiel hatte:
 * Das Feld `category` in den Inhaltspaketen ist die ANZEIGE und wird pro
 * Sprache mituebersetzt ("Prominente" / "Celebrities" / "Ünlüler"). Der
 * Spielcode filterte darauf mit einer fest eingebauten deutschen Tabelle.
 * In jeder Sprache ausser Deutsch traf der Filter also nichts, der Pool war
 * leer, und `pool[i % pool.length]` wurde zu `pool[NaN]` → `undefined.name`.
 * Ergebnis: WHO AM I stuerzte beim Start ab — in neun von zehn Sprachen, und
 * zwar so, dass es aussah wie ein toter Knopf.
 *
 * Deshalb wird ab hier NUR noch ueber diese Kennung ausgewaehlt. Die
 * Beschriftung bleibt fuer die Anzeige und darf sich frei aendern.
 */
export type WhoAmICategoryKey = 'prominente' | 'tiere' | 'berufe' | 'filme' | 'maerchen';

/**
 * Beschriftung → Kennung, erhoben aus den echten Paketen (nicht aus den
 * erwarteten Uebersetzungen). Wichtig: ar, pt und tr tragen fuer "Berufe" das
 * englische `Professions` — wer hier nach Lehrbuch uebersetzt, baut den Fehler
 * neu ein. `whoami-content.test.ts` prueft jede Sprache gegen jede Kennung;
 * wird ein Paket neu erzeugt und aendert eine Beschriftung, faellt genau diese
 * Zeile auf, statt dass das Spiel wieder still abstuerzt.
 */
const LABEL_TO_KEY: Record<string, WhoAmICategoryKey> = {
  // prominente
  Prominente: 'prominente', Celebrities: 'prominente', Famosos: 'prominente',
  Celebrites: 'prominente', Celebrita: 'prominente', Beroemdheden: 'prominente',
  Slawni: 'prominente', Celebridades: 'prominente', 'Ünlüler': 'prominente',
  'مشاهير': 'prominente',
  // tiere
  Tiere: 'tiere', Animals: 'tiere', Animales: 'tiere', Animaux: 'tiere',
  Animali: 'tiere', Dieren: 'tiere', Zwierzeta: 'tiere', Animais: 'tiere',
  Hayvanlar: 'tiere', 'حيوانات': 'tiere',
  // berufe
  Berufe: 'berufe', Professions: 'berufe', Profesiones: 'berufe',
  Metiers: 'berufe', Professioni: 'berufe', Beroepen: 'berufe', Zawody: 'berufe',
  // filme
  Filme: 'filme', Movies: 'filme', Peliculas: 'filme', Films: 'filme',
  Film: 'filme', Filmy: 'filme', Filmes: 'filme', Filmler: 'filme',
  'أفلام': 'filme',
  // maerchen
  'Märchen': 'maerchen', 'Fairy Tales': 'maerchen', Cuentos: 'maerchen',
  Contes: 'maerchen', Fiabe: 'maerchen', Sprookjes: 'maerchen',
  Basnie: 'maerchen', 'Contos de Fadas': 'maerchen', Masallar: 'maerchen',
  'قصص خيالية': 'maerchen',
};

/** Die Kennung einer Beschriftung, oder `null` fuer Unbekanntes. */
export function whoAmICategoryKey(label: string): WhoAmICategoryKey | null {
  return LABEL_TO_KEY[label] ?? null;
}

/** Alle Figuren einer Gruppe in der AKTUELLEN Sprache. */
export function getWhoAmIPool(key: WhoAmICategoryKey) {
  return pack().WHOAMI_CHARACTERS.filter((c) => LABEL_TO_KEY[c.category] === key);
}

/** Wie `getWhoAmIPool`, aber fuer ein bestimmtes Paket — fuer den Test. */
export function poolForPack(p: typeof de, key: WhoAmICategoryKey) {
  return p.WHOAMI_CHARACTERS.filter((c) => LABEL_TO_KEY[c.category] === key);
}

export const WHOAMI_PACKS = BY_LANG;
