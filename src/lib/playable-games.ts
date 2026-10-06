/**
 * playable-games.ts — single source of truth for the 22 fully integrated,
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
  /**
   * Wie Gaeste am Host-Handy (🔁) mitspielen (Party-Play-Masterplan 7).
   * Beschreibt das SPIEL, nicht den Stand der Umsetzung — solange
   * `sharedDeviceSupported` nicht gesetzt ist, setzen Gaeste trotzdem aus
   * (siehe `guestPolicy`).
   */
  sharedDevice: SharedDeviceMode;
  /** Erst wenn das Spiel die Weitergabe wirklich umsetzt, gilt `sharedDevice`. */
  sharedDeviceSupported?: boolean;
}

/**
 * - `turns`: immer nur einer dran → Weitergabe vor dem Zug.
 * - `sequential`: alle antworten gleichzeitig → Gaeste nacheinander, Zeit pro Person.
 * - `secret`: geheime Rollen/Infos → wie `sequential`, verdeckt auf-/zudecken.
 * - `team`: Echtzeit mit Teams → Gaeste im Team des Hosts.
 * - `sitout`: Echtzeit ohne Teams → Gaeste setzen aus (zaehlt nicht als gespielt).
 */
export type SharedDeviceMode = "turns" | "sequential" | "secret" | "team" | "sitout";

/**
 * Der i18n-Schluessel zum Abzeichen.
 *
 * WARUM DIESE ZUORDNUNG HIER STEHT: die Werte `"Hot"` und `"Neu"` sind
 * Registry-Kennungen, keine Anzeigetexte — sie wurden aber an vier Stellen
 * unuebersetzt ausgegeben. Ein tuerkischer Nutzer sah "NEU" auf jedem zweiten
 * Spiel. Eine einzige Zuordnung, damit die vier Stellen nicht wieder
 * auseinanderlaufen.
 *
 * Die Kennungen bleiben absichtlich deutsch: sie stehen in dieser Datei und in
 * der Praesentationsliste von GamesHub, nicht auf dem Bildschirm.
 */
export const GAME_BADGE_KEY: Record<"Hot" | "Neu", string> = {
  Hot: "nativeExtra.gamesHub.badgeHot",
  Neu: "nativeExtra.gamesHub.badgeNew",
};

/*
 * sharedDevice weicht an diesen Stellen von der vorlaeufigen Tabelle im
 * Masterplan ab — jeweils nach dem tatsaechlichen Spielablauf:
 * - category, emoji-raten, drueck-das-wort, ohrwurm, brew → `turns`: Alle
 *   fuehren einen aktiven Spieler (`currentPlayerIndex`/`turn`/`activeIdx`),
 *   die Uhr laeuft erst nach dem Start des Zugs.
 * - split-quiz, geteilt-gequizzt → `secret`: Antworten bzw. Rollen-Infos sind
 *   pro Team/Person verdeckt (`private-state.ts`).
 * - pixeljagd → `team`: Buzzer-Rennen ums schnellste Erraten. Das Host-Handy
 *   ist EIN Buzzer fuer seine Plaetze; Punkte gehen an genau einen gewaehlten
 *   Platz, eine falsche Antwort sperrt das ganze Handy.
 * - bomb → `turns`, aber ohne Weitergabe-Bildschirm und ohne Pause: der Host
 *   reicht das Handy einfach weiter, die versteckte Zuendschnur brennt weiter
 *   (eine Pause machte Gaeste zum sicheren Hafen und verriete die Restzeit).
 * - schnellzeichner → `turns`: ein Zeichner, danach raten die Mitspielenden
 *   einzeln nacheinander mit eigener Frist — kein Echtzeit-Rennen.
 * - fake-or-fact → `turns`: die Mitspielenden urteilen einzeln nacheinander
 *   (Warteschlange), nicht gleichzeitig.
 * - wer-bin-ich → `secret`: die eigene Figur sehen alle ausser der Person
 *   selbst — Weitergabe nur verdeckt.
 */
export const playableGames: PlayableGame[] = [
  { id: "bomb",            nameKey: "native.gameNames.bomb",            descKey: "native.gameDescs.bomb",            image: "/images/games/bomb.webp",            gradient: "from-orange-500 to-red-600",       minPlayers: 2, maxPlayers: 20, tier: "free",    badge: "Hot", sharedDevice: "turns", sharedDeviceSupported: true, categories: ["party", "quiz"] },
  { id: "headup",          nameKey: "native.gameNames.headup",          descKey: "native.gameDescs.headup",          image: "/images/games/headup.webp",          gradient: "from-violet-500 to-purple-600",    minPlayers: 2, maxPlayers: 12, tier: "free",                  sharedDevice: "turns", sharedDeviceSupported: true, categories: ["party", "wort"] },
  { id: "taboo",           nameKey: "native.gameNames.taboo",           descKey: "native.gameDescs.taboo",           image: "/images/games/taboo.webp",           gradient: "from-cyan-500 to-blue-600",        minPlayers: 4, maxPlayers: 20, tier: "free",                  sharedDevice: "turns", sharedDeviceSupported: true, categories: ["party", "wort"] },
  { id: "category",        nameKey: "native.gameNames.category",        descKey: "native.gameDescs.category",        image: "/images/games/category.webp",        gradient: "from-amber-500 to-orange-600",     minPlayers: 2, maxPlayers: 15, tier: "free",                  sharedDevice: "turns", sharedDeviceSupported: true, categories: ["wort", "reaktion"] },
  { id: "this-or-that",    nameKey: "native.gameNames.thisOrThat",      descKey: "native.gameDescs.thisOrThat",      image: "/images/games/this-or-that.webp",    gradient: "from-violet-500 to-fuchsia-600",   minPlayers: 2, maxPlayers: 20, tier: "free",    badge: "Neu", sharedDevice: "sequential", sharedDeviceSupported: true, categories: ["party", "social"] },
  { id: "hochstapler",     nameKey: "native.gameNames.hochstapler",     descKey: "native.gameDescs.hochstapler",     image: "/images/games/hochstapler.webp",     gradient: "from-slate-600 to-gray-800",       minPlayers: 4, maxPlayers: 15, tier: "premium", badge: "Neu", sharedDevice: "secret", sharedDeviceSupported: true, categories: ["social", "party"] },
  { id: "wahrheit-pflicht",nameKey: "native.gameNames.wahrheitPflicht", descKey: "native.gameDescs.wahrheitPflicht", image: "/images/games/wahrheit-pflicht.webp",gradient: "from-pink-500 to-rose-600",        minPlayers: 2, maxPlayers: 20, tier: "premium", badge: "Neu", sharedDevice: "turns", sharedDeviceSupported: true, categories: ["party", "social"] },
  { id: "wer-bin-ich",     nameKey: "native.gameNames.werBinIch",       descKey: "native.gameDescs.werBinIch",       image: "/images/games/wer-bin-ich.webp",     gradient: "from-amber-400 to-orange-500",     minPlayers: 2, maxPlayers: 10, tier: "premium", badge: "Neu", sharedDevice: "secret", sharedDeviceSupported: true, categories: ["social", "party"] },
  { id: "flaschendrehen",  nameKey: "native.gameNames.flaschendrehen",  descKey: "native.gameDescs.flaschendrehen",  image: "/images/games/flaschendrehen.webp",  gradient: "from-violet-500 to-pink-500",      minPlayers: 2, maxPlayers: 12, tier: "premium", badge: "Hot", sharedDevice: "turns", sharedDeviceSupported: true, categories: ["party", "social"] },
  { id: "emoji-raten",     nameKey: "native.gameNames.emojiRaten",      descKey: "native.gameDescs.emojiRaten",      image: "/images/games/emoji-raten.webp",     gradient: "from-yellow-400 to-amber-500",     minPlayers: 2, maxPlayers: 20, tier: "premium", badge: "Neu", sharedDevice: "turns", sharedDeviceSupported: true, categories: ["quiz", "kreativ"] },
  { id: "fake-or-fact",    nameKey: "native.gameNames.fakeOrFact",      descKey: "native.gameDescs.fakeOrFact",      image: "/images/games/fake-or-fact.webp",    gradient: "from-red-500 to-rose-600",         minPlayers: 2, maxPlayers: 20, tier: "premium", badge: "Neu", sharedDevice: "turns", sharedDeviceSupported: true, categories: ["quiz", "wort"] },
  { id: "schnellzeichner", nameKey: "native.gameNames.schnellzeichner", descKey: "native.gameDescs.schnellzeichner", image: "/images/games/schnellzeichner.webp", gradient: "from-orange-500 to-red-500",       minPlayers: 2, maxPlayers: 10, tier: "premium", badge: "Neu", sharedDevice: "turns", sharedDeviceSupported: true, categories: ["kreativ", "party"] },
  { id: "split-quiz",      nameKey: "native.gameNames.splitQuiz",       descKey: "native.gameDescs.splitQuiz",       image: "/images/games/split-quiz.webp",      gradient: "from-blue-500 to-indigo-700",      minPlayers: 4, maxPlayers: 30, tier: "premium",               sharedDevice: "secret", sharedDeviceSupported: true, categories: ["quiz", "social"] },
  { id: "geteilt-gequizzt",nameKey: "native.gameNames.geteiltGequizzt", descKey: "native.gameDescs.geteiltGequizzt", image: "/images/games/geteilt-gequizzt.webp",gradient: "from-cyan-500 to-blue-600",        minPlayers: 3, maxPlayers: 10, tier: "premium", badge: "Neu", sharedDevice: "secret", sharedDeviceSupported: true, categories: ["quiz", "social"] },
  { id: "story-builder",   nameKey: "native.gameNames.storyBuilder",    descKey: "native.gameDescs.storyBuilder",    image: "/images/games/story-builder.webp",   gradient: "from-teal-400 to-emerald-500",     minPlayers: 2, maxPlayers: 20, tier: "premium", badge: "Neu", sharedDevice: "turns", sharedDeviceSupported: true, categories: ["kreativ", "wort"] },
  { id: "wo-ist-was",      nameKey: "native.gameNames.woIstWas",        descKey: "native.gameDescs.woIstWas",        image: "/images/games/wo-ist-was.webp",      gradient: "from-cyan-500 to-blue-600",        minPlayers: 1, maxPlayers: 10, tier: "premium",               sharedDevice: "sequential", sharedDeviceSupported: true, categories: ["karte", "quiz"] },
  { id: "drueck-das-wort", nameKey: "native.gameNames.drueckDasWort",   descKey: "native.gameDescs.drueckDasWort",   image: "/images/games/drueck-das-wort.webp", gradient: "from-emerald-500 to-green-600",    minPlayers: 1, maxPlayers:  8, tier: "premium",               sharedDevice: "turns", sharedDeviceSupported: true, categories: ["wort", "reaktion"] },
  { id: "ohrwurm",         nameKey: "native.gameNames.ohrwurm",         descKey: "native.gameDescs.ohrwurm",         image: "/images/games/ohrwurm.webp",         gradient: "from-pink-500 to-teal-400",        minPlayers: 2, maxPlayers: 20, tier: "free",    badge: "Neu", sharedDevice: "turns", sharedDeviceSupported: true, categories: ["party", "quiz"] },
  { id: "pixeljagd",       nameKey: "native.gameNames.pixeljagd",       descKey: "native.gameDescs.pixeljagd",       image: "/images/games/pixeljagd.webp",       gradient: "from-sky-400 to-violet-500",       minPlayers: 2, maxPlayers:  8, tier: "free",    badge: "Neu", sharedDevice: "team", sharedDeviceSupported: true, categories: ["quiz", "reaktion"] },
  { id: "closeenough",     nameKey: "native.gameNames.closeenough",     descKey: "native.gameDescs.closeenough",     image: "/images/games/closeenough.webp",     gradient: "from-amber-400 to-emerald-400",     minPlayers: 2, maxPlayers:  8, tier: "free",    badge: "Neu", sharedDevice: "sequential", sharedDeviceSupported: true, categories: ["quiz", "party"] },
  { id: "pantomime",       nameKey: "native.gameNames.pantomime",       descKey: "native.gameDescs.pantomime",       image: "/images/games/pantomime.webp",       gradient: "from-amber-400 to-pink-400",        minPlayers: 4, maxPlayers: 16, tier: "free",    badge: "Neu", sharedDevice: "turns", sharedDeviceSupported: true, categories: ["party", "kreativ"] },
  // GEBRAEU: Aushaengeschild, deshalb "free" statt hinter der Schranke.
  // "reaktion" statt "kreativ"/"quiz", weil das Spiel keine Kreativ- oder
  // Wissensaufgabe stellt, sondern staendige schnelle Zieh-Entscheidungen
  // unter Risiko (Bust-Karten) verlangt.
  { id: "brew",            nameKey: "native.gameNames.brew",            descKey: "native.gameDescs.brew",            image: "/images/games/brew.webp",            gradient: "from-[#FF9F2E] to-[#9B5DE5]",       minPlayers: 2, maxPlayers:  8, tier: "free",    badge: "Neu", sharedDevice: "turns", sharedDeviceSupported: true, categories: ["party", "reaktion"] },
];

/** Set of playable game ids — handy for "is this idea card also playable?" checks. */
export const playableGameIds = new Set(playableGames.map((g) => g.id));

/**
 * Was die Party-Laufzeit mit 🔁-Gaesten in diesem Spiel tatsaechlich macht.
 * Nicht angepasste und unbekannte Spiele → `sitout`: Gaeste setzen aus, statt
 * dass ein Spiel, das nur `myPlayerId` kennt, mitten im Abend haengt.
 */
export function guestPolicy(gameId: string): SharedDeviceMode {
  const game = playableGames.find((g) => g.id === gameId);
  return game && (game.sharedDeviceSupported || qaForcedSharedDevice(gameId)) ? game.sharedDevice : "sitout";
}

/**
 * NUR fuer die QA-Laeufe (qa-party, Dev-Server oder Build mit VITE_QA_HARNESS):
 * `window.__partyPlayForceShared = ['headup']`
 * auf dem Host-Geraet laesst Gaeste in einem angepassten, aber noch nicht
 * freigegebenen Spiel mitspielen — die Freigabe (`sharedDeviceSupported`) gibt
 * es erst nach bestandenen Szenarien. Im Betrieb setzt das niemand.
 */
export function qaForcedSharedDevice(
  gameId: string,
  env: { DEV?: boolean; VITE_QA_HARNESS?: string | boolean } = import.meta.env,
): boolean {
  // Nur Dev-Server und QA-Builds: im Produktions-Bundle ist `DEV` fest false
  // und `VITE_QA_HARNESS` ungesetzt — der Schalter ist dort wirkungslos.
  if (!env.DEV && !env.VITE_QA_HARNESS) return false;
  const forced = (globalThis as { __partyPlayForceShared?: unknown }).__partyPlayForceShared;
  return Array.isArray(forced) && forced.includes(gameId);
}

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

/** Hoechstzahl einer Server-Party (`controller_party_members`). */
export const PARTY_SERVER_MAX_PLAYERS = 12;
/** Ein Party-Spiel braucht mindestens zwei Mitspielende — auch wenn das Spiel allein liefe. */
export const PARTY_MIN_PLAYERS = 2;

export type GameMode = "local-party" | "controller-party" | "online-room";

export interface GameAvailabilityContext {
  mode: GameMode;
  /** Spieler mit eigenem Handy (📱), OHNE den Host. */
  phonePlayers: number;
  /** Gaeste am Host-Handy (🔁). */
  guestPlayers: number;
  /** Spielt der Host selbst mit? Er setzt nie aus. */
  hostPlays: boolean;
  hostPremium: boolean;
}

export type GameUnavailableReason =
  | "too_few"
  | "too_many"
  | "premium"
  | "guests_sit_out_too_few"
  | "unknown_game";

/**
 * Zwei Fragen, zwei Antworten:
 *
 * - `plannable` — darf das Spiel auf die Spieleliste? Nein nur, wenn es in
 *   dieser Runde NIE laufen kann (Premium fehlt, zu viele Leute, unbekannt).
 *   Fehlen bloss Mitspielende, bleibt es planbar: Es kommen ja noch welche
 *   dazu („wartet auf 2 Spieler“).
 * - `startable` — kann es JETZT starten? Nur wenn nichts fehlt.
 *
 * Planen und Starten getrennt, damit der Host den Abend schon planen kann,
 * waehrend die Gaeste noch scannen — und trotzdem nie ein Spiel startet, das
 * mit der aktuellen Runde haengen wuerde.
 */
export interface GameAvailability {
  plannable: boolean;
  startable: boolean;
  /**
   * @deprecated Durch `plannable`/`startable` ersetzt; entfaellt im naechsten
   * Release. Entspricht `startable` — das war die Bedeutung vor der Trennung,
   * so startet kein bestehender Aufrufer versehentlich ein unvollstaendiges Spiel.
   */
  selectable: boolean;
  /** Wer in diesem Spiel tatsaechlich mitspielt. */
  activePlayers: number;
  /** 🔁-Gaeste, die aussetzen (nur Server-Partys mit `guestPolicy` = sitout). */
  sittingOut: number;
  reason: GameUnavailableReason | null;
  /** Wie viele Mitspielende noch fehlen (> 0 nur bei `too_few`/`guests_sit_out_too_few`). */
  missingPlayers: number;
  /** Fuer den Hinweistext: `min`, `max`, `count`, `sittingOut`. */
  reasonParams?: Record<string, number>;
}

const count = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);

/**
 * Die EINE Regel fuer lokale Party, Joystick-Party und Online-Raum.
 *
 * Lokale Party: alle zaehlen, niemand setzt aus, keine Server-Obergrenze.
 * Server-Partys: 🔁-Gaeste setzen aus, wenn `guestPolicy` = sitout; hoechstens 12.
 * Mindestens 2 ueberall. Reihenfolge der Gruende: unbekannt → Premium → zu
 * viele → zu wenige (bzw. „zu wenige, weil Gaeste aussetzen“).
 */
export function gameAvailability(gameId: string, ctx: GameAvailabilityContext): GameAvailability {
  const game = playableGames.find((g) => g.id === gameId);
  const phones = count(ctx.phonePlayers);
  const guests = count(ctx.guestPlayers);
  const host = ctx.hostPlays ? 1 : 0;

  const sittingOut = ctx.mode !== "local-party" && guestPolicy(gameId) === "sitout" ? guests : 0;
  const activePlayers = phones + host + guests - sittingOut;
  const result = (
    reason: GameUnavailableReason | null,
    reasonParams?: Record<string, number>,
    missingPlayers = 0,
  ): GameAvailability => {
    const startable = reason === null;
    const plannable = startable || reason === "too_few" || reason === "guests_sit_out_too_few";
    const out: GameAvailability = { plannable, startable, selectable: startable, activePlayers, sittingOut, reason, missingPlayers };
    if (reasonParams) out.reasonParams = reasonParams;
    return out;
  };

  if (!game) return result("unknown_game");
  if (game.tier === "premium" && !ctx.hostPremium) return result("premium");

  const min = Math.max(PARTY_MIN_PLAYERS, game.minPlayers);
  const max = ctx.mode === "local-party" ? game.maxPlayers : Math.min(game.maxPlayers, PARTY_SERVER_MAX_PLAYERS);

  if (activePlayers > max) return result("too_many", { max, count: activePlayers });
  if (activePlayers < min) {
    const missing = min - activePlayers;
    return sittingOut > 0 && activePlayers + sittingOut >= min
      ? result("guests_sit_out_too_few", { min, count: activePlayers, sittingOut }, missing)
      : result("too_few", { min, count: activePlayers }, missing);
  }
  return result(null);
}

/** Warum der Start gesperrt ist — `null`, wenn das Spiel jetzt starten kann. */
export function startBlockReason(a: GameAvailability): GameUnavailableReason | null {
  return a.startable ? null : a.reason;
}

/** Feinere Lage fuer die Darstellung (docs/party-play-design.md §4.1). */
export type AvailabilityVariant = "fits" | "sitout" | "waiting" | "too_many" | "premium" | "unknown";
export type AvailabilityTone = "cyan" | "amber" | "pink" | "purple";

/** Tonfarben aus §4.1 — Text in Ton, Flaeche Ton + `1a`, Ring innen 1 px Ton + `38`. */
export const AVAILABILITY_TONE_HEX: Record<AvailabilityTone, string> = {
  cyan: "#8ff5ff",
  amber: "#fbbf24",
  pink: "#ff6b98",
  purple: "#df8eff",
};

export interface AvailabilityChip {
  /** Grob (abwaertskompatibel): ok = startklar · waiting = planbar, es fehlen Leute · locked = in dieser Runde nie. */
  kind: "ok" | "waiting" | "locked";
  /** Fein, steuert Icon und Farbe. `sitout` = passt, aber 🔁-Gaeste setzen aus. */
  variant: AvailabilityVariant;
  tone: AvailabilityTone;
  /** Kachel `aria-disabled`, Bild/Name 45 % — der Chip selbst wird nie abgedunkelt. */
  locked: boolean;
  /** Lucide-Icon-Name (Check, Users, Hourglass, Ban, Crown). */
  icon: "Check" | "Users" | "Hourglass" | "Ban" | "Crown";
  /** i18n-Schluessel unter `partyPlay.availability.*`. */
  key: string;
  /** Interpolation; `count` steuert die Pluralform (_one/_other), `names` ist fertig verbunden. */
  params: Record<string, string | number>;
}

export interface AvailabilityChipOptions {
  /** Namen der aussetzenden Gaeste → „Max und Gerda setzen aus“. Ohne: „2 Gaeste setzen aus“. */
  sittingOutNames?: readonly string[];
  /** Sprache fuer die Namensliste (i18n.language). Ohne: Sprache des Geraets. */
  locale?: string;
}

/**
 * „Max und Gerda“ / „Max and Gerda“ / „Max و Gerda“ — Intl.ListFormat in der
 * Sprache der Oberflaeche. Fehlt Intl.ListFormat (aeltere TV-Browser) oder ist
 * die Sprache ungueltig: neutral „Max, Gerda & Ute“.
 */
export function joinNames(names: readonly string[], locale?: string): string {
  const list = names.map((n) => n.trim()).filter(Boolean);
  if (list.length <= 1) return list[0] ?? "";
  try {
    const ListFormat = (Intl as { ListFormat?: new (l?: string, o?: object) => { format(items: string[]): string } }).ListFormat;
    if (ListFormat) return new ListFormat(locale, { style: "long", type: "conjunction" }).format(list);
  } catch {
    // ungueltige Sprache → Rueckfall unten
  }
  return `${list.slice(0, -1).join(", ")} & ${list[list.length - 1]}`;
}

/**
 * Der eine Hinweis-Chip fuer jede Spielauswahl (TV, Host-Handy, Online-Raum),
 * damit ueberall dieselben Worte, Farben und Icons stehen (Design §4.1). Ohne
 * i18n — die Oberflaeche rendert `t(key, params)` in `AVAILABILITY_TONE_HEX[tone]`.
 */
export function availabilityChip(a: GameAvailability, opts: AvailabilityChipOptions = {}): AvailabilityChip {
  const p = a.reasonParams ?? {};
  const k = (key: string) => `partyPlay.availability.${key}`;
  switch (a.reason) {
    case null: {
      if (a.sittingOut === 0) {
        return { kind: "ok", variant: "fits", tone: "cyan", locked: false, icon: "Check", key: k("ready"), params: { count: a.activePlayers } };
      }
      const names = joinNames(opts.sittingOutNames ?? [], opts.locale);
      return names
        ? { kind: "ok", variant: "sitout", tone: "cyan", locked: false, icon: "Users", key: k("sitout"), params: { names, count: a.sittingOut } }
        : { kind: "ok", variant: "sitout", tone: "cyan", locked: false, icon: "Users", key: k("sitoutCount"), params: { count: a.sittingOut } };
    }
    case "too_few":
      return { kind: "waiting", variant: "waiting", tone: "amber", locked: false, icon: "Hourglass", key: k("waiting"), params: { count: a.missingPlayers, min: p.min ?? 0 } };
    case "guests_sit_out_too_few": {
      const names = joinNames(opts.sittingOutNames ?? [], opts.locale);
      const params = { count: a.missingPlayers, sittingOut: a.sittingOut, min: p.min ?? 0 };
      return {
        kind: "waiting", variant: "waiting", tone: "amber", locked: false, icon: "Hourglass",
        key: k(names ? "guestsSitOutNames" : "guestsSitOut"),
        params: names ? { ...params, names } : params,
      };
    }
    case "too_many":
      return { kind: "locked", variant: "too_many", tone: "pink", locked: true, icon: "Ban", key: k("tooMany"), params: { max: p.max ?? 0, count: p.count ?? a.activePlayers } };
    case "premium":
      return { kind: "locked", variant: "premium", tone: "purple", locked: true, icon: "Crown", key: k("premium"), params: {} };
    case "unknown_game":
      return { kind: "locked", variant: "unknown", tone: "pink", locked: true, icon: "Ban", key: k("unknown"), params: {} };
  }
}
