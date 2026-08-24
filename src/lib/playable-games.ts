/**
 * playable-games.ts — single source of truth for the 21 fully integrated,
 * playable games. Shared by the native GamesScreen ("Play" tab), the Ideas
 * highlight shelf, and party mode so the registry never drifts apart.
 *
 * Each game maps to the `/games/:gameId` router. Thumbnails live in
 * public/images/games/{id}.webp, names/descriptions in i18n under
 * native.gameNames.* / native.gameDescs.*.
 */

export type PlayableCategory =
  | "party"
  | "quiz"
  | "wort"
  | "karte"
  | "reaktion"
  | "social"
  | "kreativ";

export interface PlayableGame {
  id: string;
  nameKey: string;
  descKey: string;
  image: string;
  gradient: string;
  tier: "free" | "premium";
  /**
   * Spielbare Gruppengroesse. Erhoben aus den Setup-Bildschirmen der Spiele
   * (dort als `min`/`max` an `PlayerSetup` bzw. `GameSetup`). Der Party-Modus
   * blendet damit Spiele aus, die zur aktuellen Runde nicht passen — vorher
   * konnte man zu zweit ein 4-Spieler-Spiel einplanen und merkte es erst,
   * wenn es mitten im Abend nicht startete.
   *
   * ACHTUNG, es ist keine reine Mindestzahl: OHRWURM ist auf hoechstens vier
   * Personen ausgelegt.
   */
  minPlayers: number;
  maxPlayers: number;
  categories: PlayableCategory[];
  badge?: "Hot" | "Neu";
}

export const playableGames: PlayableGame[] = [
  { id: "bomb",            nameKey: "native.gameNames.bomb",            descKey: "native.gameDescs.bomb",            image: "/images/games/bomb.webp",            gradient: "from-orange-500 to-red-600",       minPlayers: 2, maxPlayers: 20, tier: "free",    badge: "Hot", categories: ["party", "quiz"] },
  { id: "headup",          nameKey: "native.gameNames.headup",          descKey: "native.gameDescs.headup",          image: "/images/games/headup.webp",          gradient: "from-violet-500 to-purple-600",    minPlayers: 2, maxPlayers: 12, tier: "free",                  categories: ["party", "wort"] },
  { id: "taboo",           nameKey: "native.gameNames.taboo",           descKey: "native.gameDescs.taboo",           image: "/images/games/taboo.webp",           gradient: "from-cyan-500 to-blue-600",        minPlayers: 2, maxPlayers: 20, tier: "free",                  categories: ["party", "wort"] },
  { id: "category",        nameKey: "native.gameNames.category",        descKey: "native.gameDescs.category",        image: "/images/games/category.webp",        gradient: "from-amber-500 to-orange-600",     minPlayers: 2, maxPlayers: 15, tier: "free",                  categories: ["wort", "reaktion"] },
  { id: "this-or-that",    nameKey: "native.gameNames.thisOrThat",      descKey: "native.gameDescs.thisOrThat",      image: "/images/games/this-or-that.webp",    gradient: "from-violet-500 to-fuchsia-600",   minPlayers: 2, maxPlayers: 20, tier: "free",    badge: "Neu", categories: ["party", "social"] },
  { id: "hochstapler",     nameKey: "native.gameNames.hochstapler",     descKey: "native.gameDescs.hochstapler",     image: "/images/games/hochstapler.webp",     gradient: "from-slate-600 to-gray-800",       minPlayers: 4, maxPlayers: 15, tier: "premium", badge: "Neu", categories: ["social", "party"] },
  { id: "wahrheit-pflicht",nameKey: "native.gameNames.wahrheitPflicht", descKey: "native.gameDescs.wahrheitPflicht", image: "/images/games/wahrheit-pflicht.webp",gradient: "from-pink-500 to-rose-600",        minPlayers: 2, maxPlayers: 20, tier: "premium", badge: "Neu", categories: ["party", "social"] },
  { id: "wer-bin-ich",     nameKey: "native.gameNames.werBinIch",       descKey: "native.gameDescs.werBinIch",       image: "/images/games/wer-bin-ich.webp",     gradient: "from-amber-400 to-orange-500",     minPlayers: 2, maxPlayers: 10, tier: "premium", badge: "Neu", categories: ["social", "party"] },
  { id: "flaschendrehen",  nameKey: "native.gameNames.flaschendrehen",  descKey: "native.gameDescs.flaschendrehen",  image: "/images/games/flaschendrehen.webp",  gradient: "from-violet-500 to-pink-500",      minPlayers: 2, maxPlayers: 12, tier: "premium", badge: "Hot", categories: ["party", "social"] },
  { id: "emoji-raten",     nameKey: "native.gameNames.emojiRaten",      descKey: "native.gameDescs.emojiRaten",      image: "/images/games/emoji-raten.webp",     gradient: "from-yellow-400 to-amber-500",     minPlayers: 2, maxPlayers: 20, tier: "premium", badge: "Neu", categories: ["quiz", "kreativ"] },
  { id: "fake-or-fact",    nameKey: "native.gameNames.fakeOrFact",      descKey: "native.gameDescs.fakeOrFact",      image: "/images/games/fake-or-fact.webp",    gradient: "from-red-500 to-rose-600",         minPlayers: 2, maxPlayers: 20, tier: "premium", badge: "Neu", categories: ["quiz", "wort"] },
  { id: "schnellzeichner", nameKey: "native.gameNames.schnellzeichner", descKey: "native.gameDescs.schnellzeichner", image: "/images/games/schnellzeichner.webp", gradient: "from-orange-500 to-red-500",       minPlayers: 2, maxPlayers: 10, tier: "premium", badge: "Neu", categories: ["kreativ", "party"] },
  { id: "split-quiz",      nameKey: "native.gameNames.splitQuiz",       descKey: "native.gameDescs.splitQuiz",       image: "/images/games/split-quiz.webp",      gradient: "from-blue-500 to-indigo-700",      minPlayers: 4, maxPlayers: 30, tier: "premium",               categories: ["quiz", "social"] },
  { id: "geteilt-gequizzt",nameKey: "native.gameNames.geteiltGequizzt", descKey: "native.gameDescs.geteiltGequizzt", image: "/images/games/geteilt-gequizzt.webp",gradient: "from-cyan-500 to-blue-600",        minPlayers: 3, maxPlayers: 10, tier: "premium", badge: "Neu", categories: ["quiz", "social"] },
  { id: "story-builder",   nameKey: "native.gameNames.storyBuilder",    descKey: "native.gameDescs.storyBuilder",    image: "/images/games/story-builder.webp",   gradient: "from-teal-400 to-emerald-500",     minPlayers: 2, maxPlayers: 20, tier: "premium", badge: "Neu", categories: ["kreativ", "wort"] },
  { id: "wo-ist-was",      nameKey: "native.gameNames.woIstWas",        descKey: "native.gameDescs.woIstWas",        image: "/images/games/wo-ist-was.webp",      gradient: "from-cyan-500 to-blue-600",        minPlayers: 1, maxPlayers: 10, tier: "premium",               categories: ["karte", "quiz"] },
  { id: "drueck-das-wort", nameKey: "native.gameNames.drueckDasWort",   descKey: "native.gameDescs.drueckDasWort",   image: "/images/games/drueck-das-wort.webp", gradient: "from-emerald-500 to-green-600",    minPlayers: 1, maxPlayers:  8, tier: "premium",               categories: ["wort", "reaktion"] },
  { id: "ohrwurm",         nameKey: "native.gameNames.ohrwurm",         descKey: "native.gameDescs.ohrwurm",         image: "/images/games/ohrwurm.webp",         gradient: "from-pink-500 to-teal-400",        minPlayers: 2, maxPlayers:  4, tier: "free",    badge: "Neu", categories: ["party", "quiz"] },
  { id: "pixeljagd",       nameKey: "native.gameNames.pixeljagd",       descKey: "native.gameDescs.pixeljagd",       image: "/images/games/pixeljagd.webp",       gradient: "from-sky-400 to-violet-500",       minPlayers: 2, maxPlayers:  8, tier: "free",    badge: "Neu", categories: ["quiz", "reaktion"] },
  { id: "closeenough",     nameKey: "native.gameNames.closeenough",     descKey: "native.gameDescs.closeenough",     image: "/images/games/closeenough.webp",     gradient: "from-amber-400 to-emerald-400",     minPlayers: 2, maxPlayers:  8, tier: "free",    badge: "Neu", categories: ["quiz", "party"] },
  { id: "pantomime",       nameKey: "native.gameNames.pantomime",       descKey: "native.gameDescs.pantomime",       image: "/images/games/pantomime.webp",       gradient: "from-amber-400 to-pink-400",        minPlayers: 4, maxPlayers: 16, tier: "free",    badge: "Neu", categories: ["party", "kreativ"] },
];

/** Set of playable game ids — handy for "is this idea card also playable?" checks. */
export const playableGameIds = new Set(playableGames.map((g) => g.id));

/**
 * Maps a static idea-card id (from games-library.ts) to its fully integrated
 * playable counterpart (/games/:id). When an idea is also a real in-app game,
 * IdeasScreen surfaces a "Play" deep-link instead of just showing instructions.
 * Only semantically identical games are mapped here.
 */
export const ideaToPlayable: Record<string, string> = {
  who_am_i: "wer-bin-ich",
  truth_or_dare: "wahrheit-pflicht",
  taboo: "taboo",
  pictionary: "schnellzeichner",
  would_you_rather: "this-or-that",
  charades: "pantomime",
  one_word_story: "story-builder",
  two_truths_lie: "fake-or-fact",
};
