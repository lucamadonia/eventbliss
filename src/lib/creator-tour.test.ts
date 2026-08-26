import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { creatorTour, tourShotLang, type CreatorTour } from "./creator-tour";
import { creatorMediaKit, storyTileUrl } from "./creator-media-kit";
import { playableGames } from "./playable-games";

/**
 * Bindet die Texte des Influencer-Bereichs an die Dateien, die sie voraussetzen.
 *
 * WARUM DAS NOETIG IST: fehlt ein Bild, bleibt im Browser einfach ein leerer
 * Kasten stehen. Die Seite sieht weiter aus wie eine Seite, niemand bekommt
 * einen Fehler, und gemerkt wird es erst, wenn ein Influencer fragt, warum bei
 * ihm nichts zu sehen ist. Genau diese Luecke schliesst dieser Test.
 *
 * Er prueft gegen die tatsaechlich benutzten Pfadfunktionen (`storyTileUrl`,
 * derselbe Aufbau wie im Bauteil), nicht gegen eine zweite Liste von Hand —
 * die waere die naechste Stelle, die auseinanderlaeuft.
 */
const PUBLIC = path.resolve(__dirname, "../../public");
const LANGS = ["de", "en", "es", "fr", "it", "pt", "nl", "pl", "tr", "ar"] as const;

/** Sprachen, fuer die es fertige Story-Kacheln gibt — bewusst nur zwei. */
const TILE_LANGS = ["de", "en"] as const;

function exists(webPath: string): boolean {
  return fs.existsSync(path.join(PUBLIC, webPath.replace(/^\//, "")));
}

describe("Produkt-Tour — Texte", () => {
  it("gibt es in allen zehn Sprachen", () => {
    for (const lang of LANGS) {
      const tour = creatorTour(lang);
      expect(tour.title, `${lang}: Titel fehlt`).toBeTruthy();
      expect(tour.intro.length, `${lang}: Einleitung zu kurz`).toBeGreaterThan(40);
    }
  });

  it("faellt bei unbekannter Sprache auf Englisch zurueck, nicht auf Deutsch", () => {
    // Ein Influencer mit einer Sprache, die wir nicht fuehren, soll Englisch
    // lesen. Deutsch waere hier die schlechtere Vermutung.
    expect(creatorTour("sv")).toBe(creatorTour("en"));
    expect(creatorTour(null)).toBe(creatorTour("en"));
    expect(creatorTour("de")).not.toBe(creatorTour("en"));
  });

  it("hat in jeder Sprache dieselben Kapitel in derselben Reihenfolge", () => {
    const reference = creatorTour("de").chapters.map((c) => c.shot);
    expect(reference).toHaveLength(8);
    for (const lang of LANGS) {
      expect(creatorTour(lang).chapters.map((c) => c.shot), `${lang}`).toEqual(reference);
    }
  });

  it("hat zu jedem Kapitel Text UND einen Drehvorschlag", () => {
    // Der Drehvorschlag ist der eigentliche Grund fuer die Tour. Ein Kapitel
    // ohne ihn waere eine Funktionsbeschreibung — davon hat niemand etwas.
    for (const lang of LANGS) {
      for (const ch of creatorTour(lang).chapters) {
        expect(ch.title, `${lang}/${ch.shot}: Titel`).toBeTruthy();
        expect(ch.body.length, `${lang}/${ch.shot}: Text zu kurz`).toBeGreaterThan(50);
        expect(ch.idea.length, `${lang}/${ch.shot}: Drehvorschlag zu kurz`).toBeGreaterThan(40);
      }
    }
  });

  it("nennt keine Nutzerzahlen", () => {
    // Nutzer- und Downloadzahlen sind nicht geprueft, also werden sie nicht
    // behauptet — weder von uns noch ueber den Umweg eines Influencers.
    const forbidden = /\b\d{3,}(\.\d{3})*\+?\s*(nutzer|user|downloads?|installs?)/i;
    for (const lang of LANGS) {
      const tour = creatorTour(lang);
      const all = [tour.intro, ...tour.chapters.flatMap((c) => [c.body, c.idea])].join(" ");
      expect(all, `${lang}`).not.toMatch(forbidden);
    }
  });

  it("gibt eine Spielerspanne aus, die eine Spanne ist", () => {
    const tour: CreatorTour = creatorTour("de");
    expect(tour.gamesPlayers(2, 20)).toContain("2");
    expect(tour.gamesPlayers(2, 20)).toContain("20");
  });
});

describe("Produkt-Tour — Bildbestand", () => {
  it("hat zu jedem Kapitel in jeder Sprache eine Aufnahme", () => {
    const shots = creatorTour("de").chapters.map((c) => c.shot);
    for (const lang of LANGS) {
      for (const shot of shots) {
        expect(exists(`/tour/${lang}/${shot}.webp`), `/tour/${lang}/${shot}.webp fehlt`).toBe(true);
      }
    }
  });

  it("waehlt fuer eine ungefuehrte Sprache englische Aufnahmen", () => {
    expect(tourShotLang("sv")).toBe("en");
    expect(tourShotLang(undefined)).toBe("en");
    expect(tourShotLang("tr")).toBe("tr");
  });

  it("hat die Kachel zu jedem der 22 Spiele", () => {
    expect(playableGames).toHaveLength(22);
    for (const game of playableGames) {
      expect(exists(game.image), `${game.id}: ${game.image} fehlt`).toBe(true);
    }
  });
});

describe("Media-Kit — Bildbestand", () => {
  it("hat jede Story-Kachel in Deutsch und Englisch", () => {
    for (const lang of TILE_LANGS) {
      for (const tile of creatorMediaKit(lang).storyTiles) {
        const url = storyTileUrl(lang, tile.key);
        expect(exists(url), `${url} fehlt`).toBe(true);
      }
    }
  });

  it("beschriftet in beiden Sprachen dieselben Kacheln", () => {
    const de = creatorMediaKit("de").storyTiles.map((t) => t.key);
    const en = creatorMediaKit("en").storyTiles.map((t) => t.key);
    expect(en).toEqual(de);
  });

  it("hat neun Beispieltexte, drei je Format", () => {
    for (const lang of TILE_LANGS) {
      const caps = creatorMediaKit(lang).captions;
      expect(caps, `${lang}`).toHaveLength(9);
      const perFormat = new Map<string, number>();
      for (const c of caps) perFormat.set(c.format, (perFormat.get(c.format) ?? 0) + 1);
      expect([...perFormat.values()], `${lang}`).toEqual([3, 3, 3]);
    }
  });

  it("kennzeichnet jeden Beispieltext als Werbung", () => {
    // Ohne Kennzeichnung waere jeder dieser Texte ein rechtliches Problem —
    // und zwar fuer den Influencer, nicht fuer uns.
    for (const lang of TILE_LANGS) {
      for (const c of creatorMediaKit(lang).captions) {
        expect(c.text, `${lang}: "${c.text.slice(0, 30)}…"`).toMatch(/#Werbung|#ad/i);
      }
    }
  });

  it("verweist nur auf Bilder, die es gibt", () => {
    for (const lang of TILE_LANGS) {
      for (const asset of creatorMediaKit(lang).assets) {
        // Die Adressen stehen absolut, damit man sie weitergeben kann; geprueft
        // wird der Pfad dahinter.
        const rel = asset.url.replace(/^https?:\/\/[^/]+/, "");
        expect(exists(rel), `${asset.label}: ${rel} fehlt`).toBe(true);
      }
    }
  });
});
