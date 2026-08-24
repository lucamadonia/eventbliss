/**
 * Registry-Kennung → Kennung in den Anleitungen.
 *
 * Beides laeuft auseinander: In `playable-games.ts` heisst das Spiel
 * `wer-bin-ich`, in `gameRules.*` heisst es `whoami`; `hochstapler` heisst
 * dort `impostor`. Ohne Uebersetzung findet ein Aufrufer die Anleitung nicht
 * und zeigt eine leere Seite.
 *
 * Die Tabelle lag bis hierher PRIVAT in `GameRulesModal.tsx`. Weil der
 * Fernseher dieselben Anleitungen zeigt, waere sie dort ein zweites Mal
 * entstanden — und zwei Kopien laufen frueher oder spaeter auseinander.
 */
const RULES_ID: Record<string, string> = {
  "wer-bin-ich": "whoami",
  "emoji-raten": "emojiguess",
  "fake-or-fact": "fakeorfact",
  "this-or-that": "thisorthat",
  "wahrheit-pflicht": "truthdare",
  "story-builder": "storybuilder",
  "geteilt-gequizzt": "sharedquiz",
  "schnellzeichner": "quickdraw",
  "split-quiz": "splitquiz",
  hochstapler: "impostor",
  "wo-ist-was": "wo-ist-was",
  "drueck-das-wort": "drueck-das-wort",
};

/** Die Kennung, unter der die Anleitung dieses Spiels steht. */
export function normalizeGameId(id: string): string {
  return RULES_ID[id] || id;
}

export interface GameRules {
  title: string;
  tagline: string;
  steps: string[];
  tip: string;
}

/**
 * Anleitung aufloesen. `t` kommt vom Aufrufer, damit dieselbe Funktion auf dem
 * Telefon und auf dem Fernseher laeuft.
 *
 * Gibt `null`, wenn es weder Titel noch Schritte gibt — dann darf der Aufrufer
 * gar nichts anzeigen statt einer leeren Seite.
 */
export function resolveGameRules(
  gameId: string,
  t: (key: string, fallback?: string) => string
): GameRules | null {
  const nid = normalizeGameId(gameId);
  if (!nid) return null;

  const steps: string[] = [];
  // Die Schritte stehen als step1 … step5; fehlende brechen die Reihe ab
  // nicht, denn nicht jedes Spiel braucht fuenf.
  for (let i = 1; i <= 5; i++) {
    const s = t(`gameRules.${nid}.step${i}`, "");
    if (s) steps.push(s);
  }

  const title = t(`gameRules.${nid}.title`, "");
  if (!title && steps.length === 0) return null;

  return {
    title,
    tagline: t(`gameRules.${nid}.tagline`, ""),
    steps,
    tip: t(`gameRules.${nid}.tip`, ""),
  };
}
