import { ACCENT, card, sound, str, type CueFn } from './cue-kit';
import { stableCue } from './stable';

/**
 * Ohrwurm: Karte je Zug („Sara ist dran – Mystery-Song“), Konter-Fenster als
 * Karte, Aufloesung nur als Ton (das Jahr IST der Moment).
 *
 * GEHEIM bis zur Aufloesung: Titel, Interpret, Jahr. Die Karte traegt nur den
 * oeffentlichen Namen der aktiven Person. Einen Rundenzaehler sendet das Spiel
 * nicht — der Zug ist eindeutig ueber aktive Person + Laenge ihrer Timeline.
 */
const ohrwurm: CueFn = stableCue((phase, s) => {
  const name = str(s.activeName);
  const turn = `${str(s.activeId) || name}:${Array.isArray(s.timeline) ? s.timeline.length : 0}`;
  const eyebrow = name ? { key: 'tvCinema.ohrwurm.turnOf', fallback: '{{name}} ist dran', params: { name } } : undefined;
  switch (phase) {
    case 'draw':
      return card(`ohrwurm:${turn}:draw`, '#FF2E88', 'chime', { key: 'tvCinema.ohrwurm.listen', fallback: 'Mystery-Song' },
        { ...(eyebrow ? { eyebrow } : {}), subtitle: { key: 'tvCinema.ohrwurm.listenSub', fallback: 'Hört genau hin – wann ist er erschienen?' } });
    case 'counter':
      return card(`ohrwurm:${turn}:counter`, ACCENT.amber, 'tick', { key: 'tvCinema.ohrwurm.counter', fallback: 'Konter-Chance' },
        { subtitle: name
          ? { key: 'tvCinema.ohrwurm.counterSub', fallback: 'Liegt {{name}} falsch? Jetzt kontern!', params: { name } }
          : { key: 'tvCinema.ohrwurm.counterSubAnon', fallback: 'Liegt die Einordnung falsch? Jetzt kontern!' } });
    case 'reveal':
      return sound(`ohrwurm:${turn}:reveal`, 'reveal', '#FF2E88');
    default:
      return null;
  }
});

export const cues = { ohrwurm };
