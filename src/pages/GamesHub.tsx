import { lazy, Suspense, useState, useMemo, useCallback, useEffect, useRef, memo } from "react";
import { useTranslation } from "react-i18next";
import { useSEO } from "@/hooks/useSEO";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { usePremium } from "@/hooks/usePremium";
import { GAME_TIERS, isGamePremium, getFreePlaysUsed, recordFreePlay } from "@/games/premium/gameConfig";
import { TVBroadcastProvider, useTVContext } from "@/contexts/TVBroadcastContext";
import { GameRulesModal, useAutoShowRules, RulesHelpButton } from "@/games/ui/GameRulesModal";
import { GameReportModal } from "@/games/ui/GameReportModal";
import { GameTitleBar } from "@/games/ui/GameTitleBar";
import PremiumBadge from "@/games/premium/PremiumBadge";
import PremiumPaywall from "@/games/premium/PremiumPaywall";
import { playableGames } from "@/lib/playable-games";
import { PartyNightFlow } from "@/components/native/party/PartyNightFlow";
import { getActivePartySession } from "@/hooks/usePartySession";
import { partyGameName } from "@/hooks/useTVGameBridge";
import { buildPartyNightState } from "@/games/party/standings";
import {
  Gamepad2, Bomb, Brain, MessageSquareOff, Timer, Users, Clock,
  ArrowLeft, Shuffle, Bell, Star, UserX, Type, Search as SearchIcon,
  HelpCircle, Palette, Languages, Hand, Dices, Pencil, Link,
  Heart, ArrowLeftRight, Smile, HelpCircle as QuestionMark, BookOpen,
  Wine, Globe, X, Music2, Eye, Target, Drama,
} from "lucide-react";

const GameLobby = lazy(() => import("@/games/multiplayer/GameLobby"));
const OnlineGameWrapper = lazy(() => import("@/games/multiplayer/OnlineGameWrapper"));

const CategoryGame = lazy(() => import("@/games/category/CategoryGame"));
const BombGame = lazy(() => import("@/games/bomb/BombGame"));
const HeadUpGame = lazy(() => import("@/games/headup/HeadUpGame"));
const TabooGame = lazy(() => import("@/games/taboo/TabooGame"));
const ImpostorGame = lazy(() => import("@/games/impostor/ImpostorGame"));
const WordPressGame = lazy(() => import("@/games/wordpress/WordPressGame"));
const FindItGame = lazy(() => import("@/games/findit/FindItGame"));
const SplitQuizGame = lazy(() => import("@/games/splitquiz/SplitQuizGame"));
const SharedQuizGame = lazy(() => import("@/games/sharedquiz/SharedQuizGame"));
const QuickDrawGame = lazy(() => import("@/games/quickdraw/QuickDrawGame"));
const TruthDareGame = lazy(() => import("@/games/truthdare/TruthDareGame"));
const ThisOrThatGame = lazy(() => import("@/games/thisorthat/ThisOrThatGame"));
const WhoAmIGame = lazy(() => import("@/games/whoami/WhoAmIGame"));
const EmojiGuessGame = lazy(() => import("@/games/emojiguess/EmojiGuessGame"));
const FakeOrFactGame = lazy(() => import("@/games/fakeorfact/FakeOrFactGame"));
const StoryBuilderGame = lazy(() => import("@/games/storybuilder/StoryBuilderGame"));
const BottleSpinGame = lazy(() => import("@/games/bottlespin/BottleSpinGame"));
const OhrwurmGame = lazy(() => import("@/games/ohrwurm/OhrwurmGame"));
const PixeljagdGame = lazy(() => import("@/games/pixeljagd/PixeljagdGame"));
const CloseEnoughGame = lazy(() => import("@/games/closeenough/CloseEnoughGame"));
const PantomimeGame = lazy(() => import("@/games/pantomime/PantomimeGame"));

// Design tokens
const C = {
  surface: "bg-[#0d0d15]",
  high: "bg-[#1f1f29]",
  low: "bg-[#13131b]",
  primary: "#cf96ff",
  secondary: "#00e3fd",
  tertiary: "#ff7350",
  border: "border-[#484750]/10",
} as const;

interface GameCardData {
  id: string;
  nameKey: string;
  descKey: string;
  icon: React.ElementType;
  gradient: string;
  players: string;
  duration: string;
  badge?: "Hot" | "Neu";
  rating: number;
  image?: string;
}

/**
 * Nur Darstellung und Reihenfolge. Name und Beschreibung stehen NICHT hier —
 * die kommen aus playable-games.ts (nameKey/descKey) und damit aus i18n.
 * Sonst gibt es zwei Spielkataloge, die auseinanderlaufen.
 */
type GamePresentation = Omit<GameCardData, "nameKey" | "descKey">;

const GAME_PRESENTATION: GamePresentation[] = [
  { id: "bomb", icon: Bomb, gradient: "from-[#ff7350] to-[#ff4444]", players: "3-20", duration: "5-20", badge: "Hot", rating: 4.8, image: "/images/games/bomb.webp" },
  { id: "headup", icon: Brain, gradient: "from-[#cf96ff] to-[#9b59b6]", players: "2-20", duration: "5-20", rating: 4.7, image: "/images/games/headup.webp" },
  { id: "taboo", icon: MessageSquareOff, gradient: "from-[#00e3fd] to-[#0099cc]", players: "4-20", duration: "10-30", rating: 4.6, image: "/images/games/taboo.webp" },
  { id: "category", icon: Timer, gradient: "from-amber-500 to-amber-600", players: "2-15", duration: "5-15", rating: 4.5, image: "/images/games/category.webp" },
  { id: "hochstapler", icon: UserX, gradient: "from-[#cf96ff] to-pink-500", players: "4-15", duration: "10-25", badge: "Neu", rating: 4.9, image: "/images/games/hochstapler.webp" },
  { id: "drueck-das-wort", icon: Type, gradient: "from-emerald-500 to-green-600", players: "1-8", duration: "3-10", rating: 4.3, image: "/images/games/drueck-das-wort.webp" },
  { id: "wo-ist-was", icon: SearchIcon, gradient: "from-cyan-400 to-cyan-600", players: "2-10", duration: "5-15", rating: 4.4, image: "/images/games/wo-ist-was.webp" },
  { id: "split-quiz", icon: Users, gradient: "from-blue-500 to-blue-700", players: "4-30", duration: "10-30", rating: 4.6, image: "/images/games/split-quiz.webp" },
  { id: "geteilt-gequizzt", icon: Link, gradient: "from-[#00e3fd] to-[#0099cc]", players: "3-10", duration: "10-25", badge: "Neu", rating: 4.8, image: "/images/games/geteilt-gequizzt.webp" },
  { id: "schnellzeichner", icon: Pencil, gradient: "from-[#ff7350] to-[#ff4444]", players: "2-10", duration: "10-30", badge: "Neu", rating: 4.7, image: "/images/games/schnellzeichner.webp" },
  { id: "wahrheit-pflicht", icon: Heart, gradient: "from-pink-500 to-rose-600", players: "2-20", duration: "10-30", badge: "Neu", rating: 4.8, image: "/images/games/wahrheit-pflicht.webp" },
  { id: "this-or-that", icon: ArrowLeftRight, gradient: "from-violet-500 to-purple-600", players: "2-20", duration: "5-15", badge: "Neu", rating: 4.5, image: "/images/games/this-or-that.webp" },
  { id: "wer-bin-ich", icon: QuestionMark, gradient: "from-amber-400 to-orange-500", players: "2-10", duration: "10-30", badge: "Neu", rating: 4.6, image: "/images/games/wer-bin-ich.webp" },
  { id: "emoji-raten", icon: Smile, gradient: "from-yellow-400 to-amber-500", players: "2-10", duration: "5-20", badge: "Neu", rating: 4.7, image: "/images/games/emoji-raten.webp" },
  { id: "fake-or-fact", icon: Dices, gradient: "from-red-500 to-rose-600", players: "2-15", duration: "5-20", badge: "Neu", rating: 4.5, image: "/images/games/fake-or-fact.webp" },
  { id: "story-builder", icon: BookOpen, gradient: "from-teal-400 to-emerald-500", players: "3-15", duration: "10-25", badge: "Neu", rating: 4.4, image: "/images/games/story-builder.webp" },
  { id: "flaschendrehen", icon: Wine, gradient: "from-[#cf96ff] to-pink-500", players: "2-12", duration: "10-30", badge: "Hot", rating: 4.9, image: "/images/games/flaschendrehen.webp" },
  { id: "ohrwurm", icon: Music2, gradient: "from-[#FF2E88] to-[#26E0C4]", players: "2-4", duration: "20-40", badge: "Neu", rating: 4.8, image: "/images/games/ohrwurm.webp" },
  { id: "pixeljagd", icon: Eye, gradient: "from-[#38BDF8] to-[#A78BFA]", players: "2-8", duration: "10-20", badge: "Neu", rating: 4.7, image: "/images/games/pixeljagd.webp" },
  { id: "closeenough", icon: Target, gradient: "from-[#FBBF24] to-[#34D399]", players: "2-8", duration: "10-25", badge: "Neu", rating: 4.8, image: "/images/games/closeenough.webp" },
  { id: "pantomime", icon: Drama, gradient: "from-[#FBBF24] to-[#F472B6]", players: "4-16", duration: "15-30", badge: "Neu", rating: 4.9, image: "/images/games/pantomime.webp" },
];

const PLAYABLE_BY_ID = new Map(playableGames.map((g) => [g.id, g]));

const allGames: GameCardData[] = GAME_PRESENTATION.map((p) => {
  const entry = PLAYABLE_BY_ID.get(p.id);
  if (!entry) {
    // Laut scheitern statt einen Schluessel als Titel anzuzeigen: Wer hier ein
    // Spiel eintraegt, muss es auch in playable-games.ts registrieren.
    throw new Error(`GamesHub: "${p.id}" fehlt in playable-games.ts`);
  }
  return { ...p, nameKey: entry.nameKey, descKey: entry.descKey };
});

const categories = [
  { labelKey: "nativeExtra.gamesHub.cat.alle", icon: Gamepad2, color: C.primary, filter: "alle" },
  { labelKey: "nativeExtra.gamesHub.cat.quiz", icon: HelpCircle, color: C.primary, filter: "quiz" },
  { labelKey: "nativeExtra.gamesHub.cat.wort", icon: Languages, color: C.secondary, filter: "wort" },
  { labelKey: "nativeExtra.gamesHub.cat.karte", icon: Globe, color: C.tertiary, filter: "karte" },
  { labelKey: "nativeExtra.gamesHub.cat.party", icon: Heart, color: "#ff6b98", filter: "party" },
  { labelKey: "nativeExtra.gamesHub.cat.reaktion", icon: Hand, color: C.tertiary, filter: "reaktion" },
  { labelKey: "nativeExtra.gamesHub.cat.social", icon: Users, color: C.primary, filter: "social" },
  { labelKey: "nativeExtra.gamesHub.cat.kreativ", icon: Palette, color: C.secondary, filter: "kreativ" },
];

// Game category tags
const GAME_CATEGORIES: Record<string, string[]> = {
  "bomb": ["quiz", "party"],
  "headup": ["wort", "party"],
  "taboo": ["wort", "party"],
  "category": ["wort", "reaktion"],
  "hochstapler": ["social", "party"],
  "drueck-das-wort": ["wort", "reaktion"],
  "wo-ist-was": ["karte", "quiz"],
  "split-quiz": ["quiz", "social"],
  "geteilt-gequizzt": ["quiz", "social"],
  "schnellzeichner": ["kreativ", "party"],
  "wahrheit-pflicht": ["party", "social"],
  "this-or-that": ["party", "social"],
  "wer-bin-ich": ["social", "party"],
  "emoji-raten": ["quiz", "kreativ"],
  "fake-or-fact": ["quiz", "wort"],
  "story-builder": ["kreativ", "wort"],
  "flaschendrehen": ["party", "social"],
  "ohrwurm": ["party", "quiz"],
  "pixeljagd": ["quiz", "reaktion"],
  "closeenough": ["quiz", "party"],
  "pantomime": ["party", "kreativ"],
};

const recentGames = [
  { nameKey: "native.gameNames.bomb", icon: Bomb, timeKey: "nativeExtra.gamesHub.hoursAgo", timeOpts: { hours: 2 } },
  { nameKey: "native.gameNames.headup", icon: Brain, timeKey: "nativeExtra.gamesHub.hoursAgo", timeOpts: { hours: 5 } },
  { nameKey: "native.gameNames.taboo", icon: MessageSquareOff, timeKey: "nativeExtra.gamesHub.yesterday", timeOpts: {} },
];

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } },
};

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-3 w-3 ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-[#484750]"}`} />
      ))}
      <span className="ml-1 text-[10px] text-white/40 font-['Be_Vietnam_Pro']">{rating}</span>
    </div>
  );
}

// Memoized: re-renders only when game/premiumInfo/handler identity changes.
// Handlers receive the game (id) as argument so the parent can pass
// useCallback-stable references instead of per-card inline closures.
const GameCard = memo(function GameCard({ game, onClick, onOnline, premiumInfo }: { game: GameCardData; onClick: (game: GameCardData) => void; onOnline?: (gameId: string) => void; premiumInfo?: { isLocked: boolean; freePlaysLeft: number; isPremium: boolean } }) {
  const { t } = useTranslation();
  const Icon = game.icon;
  const name = t(game.nameKey);
  return (
    <motion.button
      variants={fadeUp}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick(game)}
      className={`group relative w-full overflow-hidden rounded-[1rem] border border-[#484750]/10 bg-[#1f1f29] text-left transition-all hover:border-[#cf96ff]/30 hover:shadow-[0_0_20px_rgba(207,150,255,0.15)] ${premiumInfo?.isLocked ? "opacity-75" : ""}`}
    >
      {/* Game card header with image */}
      <div className={`relative flex aspect-[16/9] items-center justify-center bg-gradient-to-br ${game.gradient} overflow-hidden`}>
        {game.image && (
          <img src={game.image} alt={name} loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        {!game.image && (
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 50%),
                              radial-gradient(circle at 70% 30%, rgba(255,255,255,0.15) 0%, transparent 40%)`,
          }} />
        )}
        <Icon className={`relative z-10 h-12 w-12 text-white drop-shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${premiumInfo?.isLocked ? "opacity-50" : ""} ${game.image ? "opacity-0" : ""}`} />
        {premiumInfo && isGamePremium(game.id) && (
          <PremiumBadge isLocked={premiumInfo.isLocked} freePlaysLeft={premiumInfo.freePlaysLeft} isPremium={premiumInfo.isPremium} />
        )}
        {game.badge && (
          <span className={`absolute top-2 right-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider font-game ${
            game.badge === "Hot" ? "bg-[#ff7350] text-white" : "bg-[#00e3fd] text-[#0d0d15]"
          }`}>
            {game.badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-extrabold text-white font-game truncate">{name}</h3>
        <p className="text-[11px] text-white/50 font-['Be_Vietnam_Pro'] line-clamp-2 leading-relaxed">{t(game.descKey)}</p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1">
          <span className="inline-flex items-center gap-0.5 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/60 font-['Be_Vietnam_Pro']">
            <Users className="h-2.5 w-2.5" />{game.players}
          </span>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/60 font-['Be_Vietnam_Pro']">
            <Clock className="h-2.5 w-2.5" />{game.duration} {t("nativeExtra.gamesHub.minutesShort")}
          </span>
        </div>

        <RatingStars rating={game.rating} />

        {/* Spielen + Online buttons */}
        <div className="pt-1 flex gap-1.5">
          <div className="flex-1 rounded-lg bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] py-1.5 text-center text-[11px] font-bold text-[#0d0d15] font-game transition-shadow group-hover:shadow-[0_0_12px_rgba(207,150,255,0.4)]">
            {t("nativeExtra.gamesHub.play")}
          </div>
          {onOnline && (
            <button
              onClick={(e) => { e.stopPropagation(); onOnline(game.id); }}
              className="flex items-center justify-center rounded-lg border border-[#df8eff]/25 bg-[#df8eff]/10 px-2 py-1.5 transition-colors hover:bg-[#df8eff]/20"
              title={t("nativeExtra.gamesHub.playOnline")}
            >
              <Globe className="h-3.5 w-3.5 text-[#df8eff]" />
            </button>
          )}
        </div>
      </div>
    </motion.button>
  );
});

// Marks a game entry whose free play was already counted in handleGameClick,
// so the direct-entry effect below never double-counts after navigate().
// Module-scoped: survives a potential remount between /games and /games/:gameId.
let clickCountedGameId: string | null = null;

const GamesHubInner = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { gameId } = useParams();
  const roomCode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get("room") : null;
  const lobbyParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get("lobby") : null;
  const [onlineGameId, setOnlineGameId] = useState<string | null>(lobbyParam);
  const [paywallGame, setPaywallGame] = useState<GameCardData | null>(null);
  const [activeCategory, setActiveCategory] = useState("alle");

  // Access TV broadcast context (provided by outer GamesHub wrapper)
  const tv = useTVContext();

  // Sync online room code to TV broadcast for online games
  useEffect(() => { tv?.setOnlineRoom(roomCode || null); }, [roomCode, tv]);

  /**
   * Der Zustand ZWISCHEN zwei Spielen — die einzige Stelle, die in diesem
   * Fenster ueberhaupt sendet, weil `useTVGameBridge` nur in Spielkomponenten
   * lebt und mit dem Spiel unmountet.
   *
   * Frueher schickte das hier eine handgestrickte Parallelstruktur ohne
   * `partyNight`. Da `useTVConnection` den Zustand vollstaendig ersetzt statt
   * zu mergen, verlor der Fernseher die Tabelle in genau dem Moment, in dem
   * er sie zeigen sollte. Jetzt geht derselbe Block wie im Spiel auf die
   * Leitung, nur mit `phase: 'between'` — das loest die Zwischenstands-Szene
   * aus, die vorher unerreichbar war.
   */
  useEffect(() => {
    if (gameId || !tv?.isActive) return;
    const session = getActivePartySession();
    if (!session) return;
    const partyNight = buildPartyNightState(
      session,
      (id) => partyGameName(id, i18n.language),
      "between",
    );
    tv.broadcastTV("tv-state", {
      game: "lobby",
      phase: "idle",
      lang: i18n.language,
      players: partyNight.standings.map((p) => ({
        name: p.name,
        score: p.points,
        color: p.color,
        avatar: p.avatar,
      })),
      gameHistory: session.gameHistory,
      partyNight,
    });
  }, [gameId, tv, i18n.language]);

  // NOTE: /games?room=CODE (share/invite link without a game) is handled
  // below by rendering the GameLobby join flow — the param must NOT be
  // stripped, otherwise shared invite links silently do nothing.

  // Auto-show game rules on first play
  const { showRules, openRules, closeRules } = useAutoShowRules(gameId || '');
  // Melde-Dialog. Bewusst hier und nicht in den Spielen: Die Titelleiste, an
  // der der Knopf haengt, wird ebenfalls von dieser Ebene gerendert.
  const [showReport, setShowReport] = useState(false);

  const filteredGames = useMemo(() => {
    if (activeCategory === "alle") return allGames;
    return allGames.filter(g => (GAME_CATEGORIES[g.id] || []).includes(activeCategory));
  }, [activeCategory]);
  const fallbackPlayerName = t("nativeExtra.gameLobby.defaultPlayerName");
  const [onlinePlayerName] = useState(() => {
    try { return localStorage.getItem("eventbliss_player_name") || fallbackPlayerName; } catch { return fallbackPlayerName; }
  });
  const { isPremium, loading: premiumLoading } = usePremium();
  // Bumped after recordFreePlay so freePlaysLeft on the cards reflects the new count
  // (the counters live in localStorage, outside React state).
  const [freePlaysVersion, setFreePlaysVersion] = useState(0);

  // Sync ?lobby= URL param to onlineGameId (used by native GameRoomSheet)
  useEffect(() => {
    if (lobbyParam && lobbyParam !== onlineGameId) {
      setOnlineGameId(lobbyParam);
    }
  }, [lobbyParam]);

  const premiumInfoMap = useMemo(() => {
    // freePlaysVersion is a dep so the map recomputes after recordFreePlay
    void freePlaysVersion;
    const map: Record<string, { isLocked: boolean; freePlaysLeft: number; isPremium: boolean }> = {};
    for (const tier of GAME_TIERS) {
      if (tier.tier === "premium") {
        const used = getFreePlaysUsed(tier.gameId);
        const limit = tier.freeRoundsLimit ?? 2;
        const left = Math.max(0, limit - used);
        map[tier.gameId] = {
          // While the premium status is still resolving, never show cards as
          // locked — premium customers must not see a lock flash.
          isLocked: !premiumLoading && !isPremium && left <= 0,
          freePlaysLeft: left,
          isPremium,
        };
      }
    }
    return map;
  }, [isPremium, premiumLoading, freePlaysVersion]);

  const handleGameClick = useCallback((game: GameCardData) => {
    const info = premiumInfoMap[game.id];
    if (info?.isLocked) {
      setPaywallGame(game);
      return;
    }
    // Non-premium user actually enters a premium game → consume one free round.
    // While premium status is loading we don't count here; the direct-entry
    // effect counts once the status resolves to non-premium.
    if (isGamePremium(game.id) && !premiumLoading && !isPremium) {
      recordFreePlay(game.id);
      clickCountedGameId = game.id;
      setFreePlaysVersion((v) => v + 1);
    }
    navigate(`/games/${game.id}`);
  }, [premiumInfoMap, isPremium, premiumLoading, navigate]);

  // Stable reference so memoized GameCards don't re-render on every parent render.
  const handleOpenOnline = useCallback((id: string) => setOnlineGameId(id), []);

  // ---- Free-play counting for direct entries (deep link, reload, quick start) ----
  // Guards: counted at most ONCE per game entry (useRef), and never again when
  // handleGameClick already counted before navigate() (clickCountedGameId).
  const countedEntryRef = useRef<string | null>(null);

  // Reset the per-entry guard when leaving or switching games.
  useEffect(() => {
    return () => {
      countedEntryRef.current = null;
    };
  }, [gameId]);

  useEffect(() => {
    if (!gameId || roomCode) return; // multiplayer rooms handle premium via roomHasPremium
    if (!isGamePremium(gameId)) return;
    if (clickCountedGameId === gameId) {
      // Already counted by handleGameClick — just adopt the entry marker.
      countedEntryRef.current = gameId;
      clickCountedGameId = null;
      return;
    }
    if (countedEntryRef.current === gameId) return; // already counted this entry
    if (premiumLoading || isPremium) return; // unknown or premium → never count
    const tierConfig = GAME_TIERS.find((t) => t.gameId === gameId);
    const left = Math.max(0, (tierConfig?.freeRoundsLimit ?? 2) - getFreePlaysUsed(gameId));
    if (left <= 0) return; // gate shows the paywall — no play started
    recordFreePlay(gameId);
    countedEntryRef.current = gameId;
    setFreePlaysVersion((v) => v + 1);
  }, [gameId, roomCode, premiumLoading, isPremium]);

  const handleQuickStart = () => {
    const playable = allGames;
    const random = playable[Math.floor(Math.random() * playable.length)];
    navigate(`/games/${random.id}`);
  };

  /** Uebersetzter Anzeigename eines Spiels; faellt auf ein generisches "Spiel" zurueck. */
  const gameNameById = useCallback((id: string | null | undefined) => {
    const entry = id ? allGames.find((g) => g.id === id) : undefined;
    return entry ? t(entry.nameKey) : t("nativeExtra.gamesHub.fallbackGameName");
  }, [t]);

  const handleOnlineStart = (players: any[], roomCode: string, selectedGameId?: string) => {
    const targetGame = selectedGameId || onlineGameId;
    if (targetGame) {
      navigate(`/games/${targetGame}?room=${roomCode}`);
    }
    setOnlineGameId(null);
  };

  // Rules overlay + unified title bar for ALL games (must be defined before early returns)
  const rulesOverlay = gameId ? (
    <>
      <GameTitleBar
        gameId={gameId}
        onHelpClick={openRules}
        onReportClick={() => setShowReport(true)}
      />
      <GameRulesModal gameId={gameId} open={showRules} onClose={closeRules} />
      {/*
        Der Melde-Dialog haengt hier, weil dieses Fragment in JEDEM der rund
        zwanzig Routing-Zweige unten mitgerendert wird. Eine Zeile hier ersetzt
        zwanzig Aenderungen in den Spieldateien.
      */}
      <GameReportModal
        gameId={gameId}
        open={showReport}
        onClose={() => setShowReport(false)}
      />
    </>
  ) : null;

  // Game component routing
  const GameFallback = (
    <div className="min-h-screen bg-[#0d0d15] flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#cf96ff] border-t-transparent" />
    </div>
  );

  // Share/invite link: /games?room=CODE without a game — open the lobby join
  // flow with the code prefilled (GameLobby reads ?room= itself). Guests are
  // navigated into the right game automatically when the host starts.
  if (roomCode && !gameId) {
    return (
      <Suspense fallback={GameFallback}>
        <GameLobby
          gameId="bomb"
          gameName={t("nativeExtra.gameLobby.title")}
          onStart={handleOnlineStart}
          onBack={() => navigate('/games', { replace: true })}
        />
      </Suspense>
    );
  }

  // Online game routing — when ?room=XXXXX is present, wrap game in OnlineGameWrapper
  if (roomCode && gameId) {
    const renderOnlineGame = (onlineProps: import("@/games/multiplayer/OnlineGameTypes").OnlineGameProps) => {
      if (gameId === "bomb") return <BombGame online={onlineProps} />;
      if (gameId === "hochstapler") return <ImpostorGame online={onlineProps} />;
      if (gameId === "split-quiz") return <SplitQuizGame onClose={() => navigate("/games")} online={onlineProps} />;
      if (gameId === "wo-ist-was") return <FindItGame online={onlineProps} />;
      if (gameId === "category") return <CategoryGame online={onlineProps} />;
      if (gameId === "headup") return <HeadUpGame online={onlineProps} />;
      if (gameId === "taboo") return <TabooGame online={onlineProps} />;
      if (gameId === "drueck-das-wort") return <WordPressGame online={onlineProps} />;
      if (gameId === "geteilt-gequizzt") return <SharedQuizGame online={onlineProps} />;
      if (gameId === "schnellzeichner") return <QuickDrawGame online={onlineProps} />;
      if (gameId === "wahrheit-pflicht") return <TruthDareGame online={onlineProps} />;
      if (gameId === "this-or-that") return <ThisOrThatGame online={onlineProps} />;
      if (gameId === "wer-bin-ich") return <WhoAmIGame online={onlineProps} />;
      if (gameId === "emoji-raten") return <EmojiGuessGame online={onlineProps} />;
      if (gameId === "fake-or-fact") return <FakeOrFactGame online={onlineProps} />;
      if (gameId === "story-builder") return <StoryBuilderGame online={onlineProps} />;
      if (gameId === "flaschendrehen") return <BottleSpinGame online={onlineProps} />;
      if (gameId === "ohrwurm") return <OhrwurmGame online={onlineProps} />;
      if (gameId === "pixeljagd") return <PixeljagdGame online={onlineProps} />;
      if (gameId === "closeenough") return <CloseEnoughGame online={onlineProps} />;
      if (gameId === "pantomime") return <PantomimeGame online={onlineProps} />;
      return null;
    };

    return (
      <>{rulesOverlay}
        <Suspense fallback={GameFallback}>
          <OnlineGameWrapper gameId={gameId} roomCode={roomCode} playerName={onlinePlayerName}>
            {(onlineProps) => renderOnlineGame(onlineProps)}
          </OnlineGameWrapper>
        </Suspense>
      </>
    );
  }

  // Online lobby — when navigating from GameRoomSheet with ?lobby= param
  // while a gameId is in the URL (e.g. /games/bomb?lobby=bomb).
  // Must appear BEFORE the offline-game early returns below, otherwise
  // the offline game component is returned and the lobby is never shown.
  if (gameId && onlineGameId) {
    return (
      <div className="fixed inset-0 z-[60] bg-[#0a0e14]/95 backdrop-blur-xl">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { setOnlineGameId(null); navigate('/games'); }}
          className="absolute top-4 right-4 z-[61] flex h-10 w-10 items-center justify-center rounded-full bg-[#1b2028]"
        >
          <X className="h-5 w-5 text-white/60" />
        </motion.button>
        <Suspense fallback={GameFallback}>
          <GameLobby
            gameId={onlineGameId}
            gameName={gameNameById(onlineGameId)}
            onStart={handleOnlineStart}
            onBack={() => { setOnlineGameId(null); navigate('/games'); }}
          />
        </Suspense>
      </div>
    );
  }

  // ---- Premium Gate: block direct URL access to locked premium games ----
  if (gameId && !roomCode) {
    const tierConfig = GAME_TIERS.find((t) => t.gameId === gameId);
    if (tierConfig?.tier === "premium" && !isPremium) {
      // Status still resolving → show the loader, never flash the paywall
      // at premium customers.
      if (premiumLoading) return GameFallback;
      const used = getFreePlaysUsed(gameId);
      const limit = tierConfig.freeRoundsLimit ?? 2;
      const left = Math.max(0, limit - used);
      if (left <= 0) {
        const gameData = allGames.find((g) => g.id === gameId);
        return (
          <>
            <PremiumPaywall
              isOpen={true}
              onClose={() => navigate("/games")}
              gameName={gameData ? t(gameData.nameKey) : undefined}
              freePlaysLeft={0}
            />
          </>
        );
      }
    }
  }

  // Offline games — TV broadcast is handled by the outer TVBroadcastProvider
  if (gameId === "category") return <>{rulesOverlay}<Suspense fallback={GameFallback}><CategoryGame /></Suspense></>;
  if (gameId === "bomb") return <>{rulesOverlay}<Suspense fallback={GameFallback}><BombGame /></Suspense></>;
  if (gameId === "headup") return <>{rulesOverlay}<Suspense fallback={GameFallback}><HeadUpGame /></Suspense></>;
  if (gameId === "taboo") return <>{rulesOverlay}<Suspense fallback={GameFallback}><TabooGame /></Suspense></>;
  if (gameId === "hochstapler") return <>{rulesOverlay}<Suspense fallback={GameFallback}><ImpostorGame /></Suspense></>;
  if (gameId === "drueck-das-wort") return <>{rulesOverlay}<Suspense fallback={GameFallback}><WordPressGame /></Suspense></>;
  if (gameId === "wo-ist-was") return <>{rulesOverlay}<Suspense fallback={GameFallback}><FindItGame /></Suspense></>;
  if (gameId === "split-quiz") return <>{rulesOverlay}<Suspense fallback={GameFallback}><SplitQuizGame onClose={() => navigate("/games")} /></Suspense></>;
  if (gameId === "geteilt-gequizzt") return <>{rulesOverlay}<Suspense fallback={GameFallback}><SharedQuizGame /></Suspense></>;
  if (gameId === "schnellzeichner") return <>{rulesOverlay}<Suspense fallback={GameFallback}><QuickDrawGame /></Suspense></>;
  if (gameId === "wahrheit-pflicht") return <>{rulesOverlay}<Suspense fallback={GameFallback}><TruthDareGame /></Suspense></>;
  if (gameId === "this-or-that") return <>{rulesOverlay}<Suspense fallback={GameFallback}><ThisOrThatGame /></Suspense></>;
  if (gameId === "wer-bin-ich") return <>{rulesOverlay}<Suspense fallback={GameFallback}><WhoAmIGame /></Suspense></>;
  if (gameId === "emoji-raten") return <>{rulesOverlay}<Suspense fallback={GameFallback}><EmojiGuessGame /></Suspense></>;
  if (gameId === "fake-or-fact") return <>{rulesOverlay}<Suspense fallback={GameFallback}><FakeOrFactGame /></Suspense></>;
  if (gameId === "story-builder") return <>{rulesOverlay}<Suspense fallback={GameFallback}><StoryBuilderGame /></Suspense></>;
  if (gameId === "flaschendrehen") return <>{rulesOverlay}<Suspense fallback={GameFallback}><BottleSpinGame /></Suspense></>;
  if (gameId === "ohrwurm") return <>{rulesOverlay}<Suspense fallback={GameFallback}><OhrwurmGame /></Suspense></>;
  if (gameId === "pixeljagd") return <>{rulesOverlay}<Suspense fallback={GameFallback}><PixeljagdGame /></Suspense></>;
  if (gameId === "closeenough") return <>{rulesOverlay}<Suspense fallback={GameFallback}><CloseEnoughGame /></Suspense></>;
  if (gameId === "pantomime") return <>{rulesOverlay}<Suspense fallback={GameFallback}><PantomimeGame /></Suspense></>;

  // Placeholder for not-yet-implemented games
  if (gameId) {
    const game = allGames.find((g) => g.id === gameId);
    const Icon = game?.icon ?? Gamepad2;
    return (
      <div className={`min-h-screen ${C.surface}`}>
        <div className="mx-auto max-w-2xl px-4 py-8">
          <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} onClick={() => navigate("/games")}
            className="mb-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" /><span className="text-sm font-medium font-['Be_Vietnam_Pro']">{t("common.back")}</span>
          </motion.button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-[1rem] border border-[#484750]/10 bg-[#1f1f29] p-8 text-center">
            {game && (
              <div className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br ${game.gradient}`}>
                <Icon className="h-12 w-12 text-white" />
              </div>
            )}
            <h1 className="text-2xl font-extrabold text-white mb-2 font-game">
              {game ? t(game.nameKey) : t("nativeExtra.gamesHub.gameNotFound")}
            </h1>
            <p className="text-white/50 mb-4 font-['Be_Vietnam_Pro']">{game ? t(game.descKey) : ""}</p>
            <p className="text-sm text-white/30 font-['Be_Vietnam_Pro']">{t("nativeExtra.gamesHub.comingSoon")}</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main GamesHub page
  return (
    <div className={`min-h-screen ${C.surface} pb-24`}>
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-5 py-4 bg-[#0d0d15]/90 backdrop-blur-xl border-b border-[#484750]/10">
        <h1 className="text-xl font-extrabold font-game text-[#cf96ff] drop-shadow-[0_0_8px_rgba(207,150,255,0.4)]">
          Eventbliss Games
        </h1>
        <button className="relative p-2 rounded-full bg-[#1f1f29]">
          <Bell className="h-5 w-5 text-white/60" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#ff7350]" />
        </button>
      </header>

      <div className="mx-auto max-w-5xl px-4">
        {/* Hero: Schnellstart */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative mt-6 overflow-hidden rounded-[1rem] bg-[#1f1f29] p-6 md:p-8 border border-[#484750]/10">
          {/* Gradient blurs */}
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#cf96ff]/20 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[#00e3fd]/15 blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white font-game mb-2">{t("nativeExtra.gamesHub.quickStart")}</h2>
              <p className="text-white/50 font-['Be_Vietnam_Pro'] text-sm mb-5">
                {t("nativeExtra.gamesHub.quickStartSub")}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={handleQuickStart}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] px-6 py-3 text-sm font-bold text-[#0d0d15] font-game shadow-[0_0_20px_rgba(207,150,255,0.3)] transition-shadow hover:shadow-[0_0_30px_rgba(207,150,255,0.5)]">
                  <Dices className="h-5 w-5" />
                  {t("nativeExtra.gamesHub.randomGame")}
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    const random = allGames[Math.floor(Math.random() * allGames.length)];
                    setOnlineGameId(random.id);
                  }}
                  className="inline-flex items-center gap-2.5 rounded-xl border border-[#df8eff]/30 bg-[#df8eff]/10 px-6 py-3 text-sm font-bold text-[#df8eff] font-game transition-all hover:bg-[#df8eff]/20 hover:shadow-[0_0_20px_rgba(223,142,255,0.2)]">
                  <Globe className="h-5 w-5" />
                  {t("nativeExtra.gamesHub.playOnline")}
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/tv')}
                  className="inline-flex items-center gap-2.5 rounded-xl border border-[#8ff5ff]/30 bg-[#8ff5ff]/10 px-6 py-3 text-sm font-bold text-[#8ff5ff] font-game transition-all hover:bg-[#8ff5ff]/20 hover:shadow-[0_0_20px_rgba(143,245,255,0.2)]">
                  <span className="text-lg">📺</span>
                  {t("nativeExtra.gamesHub.tvScreen")}
                </motion.button>
              </div>
            </div>
            {/* Decorative gradient orb */}
            <div className="hidden md:block relative h-32 w-32 flex-shrink-0">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#cf96ff]/40 to-[#00e3fd]/40 blur-md animate-pulse-soft" />
              <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[#cf96ff] to-[#00e3fd] opacity-60" />
              <Gamepad2 className="absolute inset-0 m-auto h-12 w-12 text-white drop-shadow-lg" />
            </div>
          </div>
        </motion.section>

        {/* Kategorien */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-8">
          <h2 className="text-lg font-extrabold text-white font-game mb-3">{t("nativeExtra.gamesHub.categories")}</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {categories.map((cat) => {
              const CatIcon = cat.icon;
              const active = activeCategory === cat.filter;
              return (
                <motion.button key={cat.filter} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(cat.filter)}
                  className={`flex flex-col items-center justify-center gap-1.5 min-w-[5rem] w-[5rem] h-[4.5rem] rounded-2xl border cursor-pointer transition-all ${
                    active ? 'border-white/20 shadow-[0_0_15px_rgba(207,150,255,0.15)]' : 'border-[#484750]/10 hover:border-white/10'
                  }`}
                  style={{ background: active ? `${typeof cat.color === 'string' ? cat.color : '#cf96ff'}15` : '#1f1f29' }}>
                  <CatIcon className="h-5 w-5" style={{ color: active ? (typeof cat.color === 'string' ? cat.color : '#cf96ff') : 'rgba(255,255,255,0.4)' }} />
                  <span className={`text-[9px] font-semibold text-center leading-tight whitespace-nowrap ${active ? 'text-white' : 'text-white/50'}`}>{t(cat.labelKey)}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* Zuletzt gespielt */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8">
          <h2 className="text-lg font-extrabold text-white font-game mb-3">{t("nativeExtra.gamesHub.recentlyPlayed")}</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {recentGames.map((rg) => {
              const RIcon = rg.icon;
              return (
                <div key={rg.nameKey} className="flex items-center gap-3 min-w-[11rem] rounded-[1rem] bg-[#1f1f29] border border-[#484750]/10 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 flex-shrink-0">
                    <RIcon className="h-5 w-5 text-[#cf96ff]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white font-game truncate">{t(rg.nameKey)}</p>
                    <p className="text-[10px] text-white/40 font-['Be_Vietnam_Pro']">{t(rg.timeKey, rg.timeOpts)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Alle Spiele */}
        <motion.section className="mt-8" initial="hidden" animate="visible" variants={stagger}>
          <h2 className="text-lg font-extrabold text-white font-game mb-4">{t("nativeExtra.gamesHub.allGames")}</h2>
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {filteredGames.map((game) => (
                <GameCard key={game.id} game={game} onClick={handleGameClick} onOnline={handleOpenOnline} premiumInfo={premiumInfoMap[game.id]} />
              ))}
            </AnimatePresence>
          </div>
        </motion.section>
      </div>

      {/* Online Lobby Modal */}
      <AnimatePresence>
        {onlineGameId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#0a0e14]/95 backdrop-blur-xl"
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setOnlineGameId(null)}
              className="absolute top-4 right-4 z-[61] flex h-10 w-10 items-center justify-center rounded-full bg-[#1b2028]"
            >
              <X className="h-5 w-5 text-white/60" />
            </motion.button>
            <Suspense fallback={GameFallback}>
              <GameLobby
                gameId={onlineGameId}
                gameName={gameNameById(onlineGameId)}
                onStart={handleOnlineStart}
                onBack={() => setOnlineGameId(null)}
              />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Paywall */}
      <PremiumPaywall
        isOpen={!!paywallGame}
        onClose={() => setPaywallGame(null)}
        gameName={paywallGame ? t(paywallGame.nameKey) : undefined}
        freePlaysLeft={paywallGame ? (premiumInfoMap[paywallGame.id]?.freePlaysLeft ?? 0) : 0}
      />

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-4 py-3 bg-[#13131b]/80 backdrop-blur-2xl border-t border-[#484750]/10 rounded-t-[2rem]"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        {[
          { labelKey: "nativeTabs.events", icon: Dices, path: "/", active: false },
          { labelKey: "nativeExtra.gamesHub.navGamesHub", icon: Gamepad2, path: "/games", active: true },
          { labelKey: "nativeTabs.profile", icon: Users, path: "/profile", active: false },
          { labelKey: "native.profile.settings", icon: Bell, path: "/settings", active: false },
        ].map((item) => {
          const NavIcon = item.icon;
          return (
            <button key={item.labelKey} onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-1 rounded-2xl transition-colors ${
                item.active ? "bg-[#cf96ff]/15" : ""
              }`}>
              <NavIcon className={`h-5 w-5 ${item.active ? "text-[#cf96ff] drop-shadow-[0_0_8px_rgba(207,150,255,0.4)]" : "text-white/40"}`} />
              <span className={`text-[10px] font-medium font-['Be_Vietnam_Pro'] ${item.active ? "text-[#cf96ff]" : "text-white/40"}`}>{t(item.labelKey)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

/** Outer wrapper — single TVBroadcastProvider persists across game switches */
function GamesHub() {
  useSEO({
    title: "Party Games — 24+ Free Group Games for Any Event | EventBliss",
    description: "Play 24+ free party games for bachelor & bachelorette parties, birthdays and group events — no install, works on any phone or on the big screen via TV mode.",
    canonical: "https://event-bliss.com/games",
    ogImage: "https://event-bliss.com/og-image.png",
    ogType: "website",
  });
  // Use PartySession TV code if a party is active, otherwise auto-generate
  const partyTvCode = (() => {
    try {
      const raw = localStorage.getItem("eventbliss_party_session");
      if (!raw) return undefined;
      const s = JSON.parse(raw);
      return s?.isActive && s?.tvCode ? s.tvCode : undefined;
    } catch { return undefined; }
  })();

  return (
    <TVBroadcastProvider sessionCode={partyTvCode}>
      <GamesHubInner />
      {/* Der Uebergang zwischen zwei Playlist-Spielen. Bewusst HIER und nicht
          neben dem laufenden Spiel: Spiele verlassen sich mit
          `navigate('/games')`, was den `/games/:gameId`-Teilbaum genau dann
          abraeumt, wenn der Uebergang erscheinen muss. */}
      <PartyNightFlow />
    </TVBroadcastProvider>
  );
}

export default GamesHub;
