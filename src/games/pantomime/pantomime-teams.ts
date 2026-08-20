/**
 * OHNE WORTE — wer spielt mit wem.
 *
 * Eigenes Modul, weil die Zuteilung genau die Sorte Logik ist, die still
 * danebengeht: Ein Team mit einer einzigen Person kann nicht spielen — der
 * eine stellt dar und rät sich selbst nichts vor. Das faellt beim Bauen nicht
 * auf, sondern erst am Spieltisch.
 *
 * Die Zuteilung ist eine Abbildung Spieler-Kennung -> Team (0 oder 1). Sie
 * bleibt bestehen, waehrend Namen dazukommen und verschwinden: Wer schon in
 * einem Team steht, BLEIBT dort. Sonst wuerde sich beim Tippen des vierten
 * Namens die ganze Aufstellung neu wuerfeln, und niemand koennte sich
 * absprechen.
 */

export type TeamIndex = 0 | 1;
export type TeamMap = Record<string, TeamIndex>;

/** Wie viele in Team A und wie viele in Team B stehen. */
export function teamSizes(map: TeamMap): [number, number] {
  let a = 0;
  let b = 0;
  for (const v of Object.values(map)) {
    if (v === 0) a++;
    else b++;
  }
  return [a, b];
}

/**
 * Die Zuteilung an die aktuelle Spielerliste anpassen.
 *
 * Bestehende Zuordnungen bleiben, Ausgeschiedene fliegen raus, Neue kommen
 * ins kleinere Team — so bleibt es von selbst ausgeglichen, ohne dass jemand
 * die Aufstellung neu sortieren muss.
 */
export function assignTeams(ids: string[], previous: TeamMap = {}): TeamMap {
  const next: TeamMap = {};
  for (const id of ids) {
    if (previous[id] !== undefined) next[id] = previous[id];
  }
  for (const id of ids) {
    if (next[id] !== undefined) continue;
    const [a, b] = teamSizes(next);
    next[id] = a <= b ? 0 : 1;
  }
  return next;
}

/** Alles neu auswuerfeln, aber gleichmaessig. */
export function shuffleTeams(ids: string[], rng: () => number = Math.random): TeamMap {
  const order = ids.slice();
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const half = Math.ceil(order.length / 2);
  const map: TeamMap = {};
  order.forEach((id, i) => {
    map[id] = i < half ? 0 : 1;
  });
  return map;
}

/** Einen Spieler ins andere Team schieben. */
export function flipTeam(map: TeamMap, id: string): TeamMap {
  if (map[id] === undefined) return map;
  return { ...map, [id]: map[id] === 0 ? 1 : 0 };
}

/**
 * Kann so gespielt werden?
 *
 * Zwei je Team ist das Minimum: einer stellt dar, mindestens einer raet.
 */
export function canPlay(map: TeamMap): boolean {
  const [a, b] = teamSizes(map);
  return a >= 2 && b >= 2;
}

/** Die Kennungen je Team, in der Reihenfolge der uebergebenen Liste. */
export function splitByTeam(ids: string[], map: TeamMap): [string[], string[]] {
  const a: string[] = [];
  const b: string[] = [];
  for (const id of ids) {
    if (map[id] === 1) b.push(id);
    else a.push(id);
  }
  return [a, b];
}
