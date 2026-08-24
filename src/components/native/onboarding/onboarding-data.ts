/**
 * onboarding-data — geteilte Beispieldaten und Bewegungs-Helfer fuer die
 * sieben Intro-Folien.
 *
 * WARUM GETEILT: Folie 5 (Party-Modus) und Folie 6 (Nacht-Route) brauchen
 * dieselbe erfundene Set-Liste und denselben Spielstand, damit die Szenen
 * wie EIN durchgehender Abend wirken statt wie zwei zufaellige Beispiele.
 */
import type { TFunction } from "i18next";
import { playableGames } from "@/lib/playable-games";
import type { PartyPlaylistItem, PartyStanding } from "@/games/tv/party-types";
import { sceneStagger, sceneItem, entranceReduced } from "@/lib/motion";

/** Spiele quer durch die Kategorien, damit die Artwork-Vielfalt sichtbar wird. */
export const ONBOARDING_GAME_IDS = ["bomb", "taboo", "headup", "hochstapler"] as const;

/** Position, an der die erfundene Runde gerade steht — zwei Spiele gespielt. */
export const ONBOARDING_ACTIVE_INDEX = 2;

/** Baut die Set-Liste fuer die Vorschau — Namen kommen aus dem echten Katalog. */
export function buildOnboardingPlaylist(t: TFunction): PartyPlaylistItem[] {
  return ONBOARDING_GAME_IDS.map((id, i) => {
    const game = playableGames.find((g) => g.id === id)!;
    return { gameId: id, name: t(game.nameKey), done: i < ONBOARDING_ACTIVE_INDEX };
  });
}

/** Vier erfundene Gaeste mit denselben Neon-Farben wie die echte Nacht-Route. */
export const ONBOARDING_STANDINGS: PartyStanding[] = [
  { id: "1", name: "Mara", color: "#df8eff", avatar: "🦄", points: 340, rank: 1, prevRank: 2, gamesWon: 2, streak: 2 },
  { id: "2", name: "Ben", color: "#ff6b98", avatar: "🔥", points: 310, rank: 2, prevRank: 1, gamesWon: 1, streak: 0 },
  { id: "3", name: "Nils", color: "#f9ca24", avatar: "🎯", points: 260, rank: 3, prevRank: 3, gamesWon: 1, streak: 0 },
  { id: "4", name: "Lia", color: "#5ad1e6", avatar: "✨", points: 190, rank: 4, prevRank: 4, gamesWon: 0, streak: 0 },
];

/**
 * Liefert das passende Stagger-/Item-Variantenpaar fuer eine Szene.
 *
 * Bei Bewegungsarmut wird NICHT einfach die Animation weggelassen — dann
 * blieben die `sceneItem`-Kinder auf ihrem unsichtbaren `initial`-Zustand
 * haengen, weil niemand mehr "animate" auf sie schaltet. Richtig ist
 * `entranceReduced`: derselbe Endzustand, nur ohne Reise dorthin.
 */
export function sceneMotion(reduced: boolean) {
  return reduced
    ? { stagger: { initial: {}, animate: {} }, item: entranceReduced }
    : { stagger: sceneStagger, item: sceneItem };
}
