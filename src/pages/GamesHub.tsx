import { lazy, Suspense, useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { usePremium } from "@/hooks/usePremium";
import { GAME_TIERS, isGamePremium } from "@/games/premium/gameConfig";
import { TVBroadcastProvider } from "@/contexts/TVBroadcastContext";
import PremiumBadge from "@/games/premium/PremiumBadge";
import PremiumPaywall from "@/games/premium/PremiumPaywall";
import {
  Gamepad2, Bomb, Brain, MessageSquareOff, Timer, Users, Clock,
  ArrowLeft, Shuffle, Bell, Star, UserX, Type, Search as SearchIcon,
  HelpCircle, Palette, Languages, Hand, Dices, Pencil, Link,
  Heart, ArrowLeftRight, Smile, HelpCircle as QuestionMark, BookOpen,
  Wine, Globe, X,
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
  name: string;
  desc: string;
  icon: React.ElementType;
  gradient: string;
  players: string;
  duration: string;
  badge?: "Hot" | "Neu";
  rating: number;
  image?: string;
}

const allGames: GameCardData[] = [
  { id: "bomb", name: "Tickende Bombe", desc: "Bei wem knallt's? Nerven aus Stahl gefragt!", icon: Bomb, gradient: "from-[#ff7350] to-[#ff4444]", players: "3-20", duration: "5-20", badge: "Hot", rating: 4.8, image: "/images/games/bomb.webp" },
  { id: "headup", name: "Stirnraten", desc: "Begriffe erraten mit Stirn-Power", icon: Brain, gradient: "from-[#cf96ff] to-[#9b59b6]", players: "2-20", duration: "5-20", rating: 4.7, image: "/images/games/headup.webp" },
  { id: "taboo", name: "Wortverbot", desc: "Erklären ohne Tabu-Wörter", icon: MessageSquareOff, gradient: "from-[#00e3fd] to-[#0099cc]", players: "4-20", duration: "10-30", rating: 4.6, image: "/images/games/taboo.webp" },
  { id: "category", name: "Zeit-Kategorie", desc: "Gegen die Uhr Begriffe nennen", icon: Timer, gradient: "from-amber-500 to-amber-600", players: "2-15", duration: "5-15", rating: 4.5, image: "/images/games/category.webp" },
  { id: "hochstapler", name: "Hochstapler", desc: "Wer lügt am besten? Entlarve den Faker!", icon: UserX, gradient: "from-[#cf96ff] to-pink-500", players: "4-15", duration: "10-25", badge: "Neu", rating: 4.9, image: "/images/games/hochstapler.webp" },
  { id: "drueck-das-wort", name: "Drück das Wort", desc: "Schnell tippen, schnell denken!", icon: Type, gradient: "from-emerald-500 to-green-600", players: "1-8", duration: "3-10", rating: 4.3, image: "/images/games/drueck-das-wort.webp" },
  { id: "wo-ist-was", name: "Wo ist was?", desc: "Finde den versteckten Gegenstand", icon: SearchIcon, gradient: "from-cyan-400 to-cyan-600", players: "2-10", duration: "5-15", rating: 4.4, image: "/images/games/wo-ist-was.webp" },
  { id: "split-quiz", name: "Split Quiz", desc: "Team-Quiz mit Wissenssplit", icon: Users, gradient: "from-blue-500 to-blue-700", players: "4-30", duration: "10-30", rating: 4.6, image: "/images/games/split-quiz.webp" },
  { id: "geteilt-gequizzt", name: "Geteilt & Gequizzt", desc: "Kooperatives Quiz — Wissen ist aufgeteilt!", icon: Link, gradient: "from-[#00e3fd] to-[#0099cc]", players: "3-10", duration: "10-25", badge: "Neu", rating: 4.8, image: "/images/games/geteilt-gequizzt.webp" },
  { id: "schnellzeichner", name: "Schnellzeichner", desc: "Zeichne & rate — wer erkennt es zuerst?", icon: Pencil, gradient: "from-[#ff7350] to-[#ff4444]", players: "2-10", duration: "10-30", badge: "Neu", rating: 4.7, image: "/images/games/schnellzeichner.webp" },
  { id: "wahrheit-pflicht", name: "Wahrheit oder Pflicht", desc: "Der Klassiker — digital und erweitert!", icon: Heart, gradient: "from-pink-500 to-rose-600", players: "2-20", duration: "10-30", badge: "Neu", rating: 4.8, image: "/images/games/wahrheit-pflicht.webp" },
  { id: "this-or-that", name: "This or That", desc: "Blitz-Entscheidungen — wie tickt die Gruppe?", icon: ArrowLeftRight, gradient: "from-violet-500 to-purple-600", players: "2-20", duration: "5-15", badge: "Neu", rating: 4.5, image: "/images/games/this-or-that.webp" },
  { id: "wer-bin-ich", name: "Wer bin ich?", desc: "Errate wer du bist mit Ja/Nein-Fragen", icon: QuestionMark, gradient: "from-amber-400 to-orange-500", players: "2-10", duration: "10-30", badge: "Neu", rating: 4.6, image: "/images/games/wer-bin-ich.webp" },
  { id: "emoji-raten", name: "Emoji-Raten", desc: "Erkenne Filme, Songs & mehr aus Emojis", icon: Smile, gradient: "from-yellow-400 to-amber-500", players: "2-10", duration: "5-20", badge: "Neu", rating: 4.7, image: "/images/games/emoji-raten.webp" },
  { id: "fake-or-fact", name: "Fake or Fact", desc: "Wahrheit oder Lüge? Teste dein Wissen!", icon: Dices, gradient: "from-red-500 to-rose-600", players: "2-15", duration: "5-20", badge: "Neu", rating: 4.5, image: "/images/games/fake-or-fact.webp" },
  { id: "story-builder", name: "Story Builder", desc: "Schreibt gemeinsam die verrückteste Geschichte", icon: BookOpen, gradient: "from-teal-400 to-emerald-500", players: "3-15", duration: "10-25", badge: "Neu", rating: 4.4, image: "/images/games/story-builder.webp" },
  { id: "flaschendrehen", name: "Flaschendrehen", desc: "Die Flasche entscheidet — mit Fragen oder pur!", icon: Wine, gradient: "from-[#cf96ff] to-pink-500", players: "2-12", duration: "10-30", badge: "Hot", rating: 4.9, image: "/images/games/flaschendrehen.webp" },
];

const categories = [
  { label: "Alle", icon: Gamepad2, color: C.primary, filter: "alle" },
  { label: "Quiz & Wissen", icon: HelpCircle, color: C.primary, filter: "quiz" },
  { label: "Wort & Sprache", icon: Languages, color: C.secondary, filter: "wort" },
  { label: "Karte & Geografie", icon: Globe, color: C.tertiary, filter: "karte" },
  { label: "Party & JGA", icon: Heart, color: "#ff6b98", filter: "party" },
  { label: "Reaktion & Geschick", icon: Hand, color: C.tertiary, filter: "reaktion" },
  { label: "Social & Bluff", icon: Users, color: C.primary, filter: "social" },
  { label: "Kreativ & Spaß", icon: Palette, color: C.secondary, filter: "kreativ" },
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
};

const recentGames = [
  { name: "Tickende Bombe", icon: Bomb, time: "Vor 2 Std." },
  { name: "Stirnraten", icon: Brain, time: "Vor 5 Std." },
  { name: "Wortverbot", icon: MessageSquareOff, time: "Gestern" },
];

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
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

function GameCard({ game, onClick, onOnline, premiumInfo }: { game: GameCardData; onClick: () => void; onOnline?: () => void; premiumInfo?: { isLocked: boolean; freePlaysLeft: number; isPremium: boolean } }) {
  const Icon = game.icon;
  return (
    <motion.button
      variants={fadeUp}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-[1rem] border border-[#484750]/10 bg-[#1f1f29] text-left transition-all hover:border-[#cf96ff]/30 hover:shadow-[0_0_20px_rgba(207,150,255,0.15)] ${premiumInfo?.isLocked ? "opacity-75" : ""}`}
    >
      {/* Game card header with image */}
      <div className={`relative flex aspect-[16/9] items-center justify-center bg-gradient-to-br ${game.gradient} overflow-hidden`}>
        {game.image && (
          <img src={game.image} alt={game.name} loading="lazy"
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
          <span className={`absolute top-2 right-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider font-['Plus_Jakarta_Sans'] ${
            game.badge === "Hot" ? "bg-[#ff7350] text-white" : "bg-[#00e3fd] text-[#0d0d15]"
          }`}>
            {game.badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-extrabold text-white font-['Plus_Jakarta_Sans'] truncate">{game.name}</h3>
        <p className="text-[11px] text-white/50 font-['Be_Vietnam_Pro'] line-clamp-2 leading-relaxed">{game.desc}</p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1">
          <span className="inline-flex items-center gap-0.5 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/60 font-['Be_Vietnam_Pro']">
            <Users className="h-2.5 w-2.5" />{game.players}
          </span>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/60 font-['Be_Vietnam_Pro']">
            <Clock className="h-2.5 w-2.5" />{game.duration} Min
          </span>
        </div>

        <RatingStars rating={game.rating} />

        {/* Spielen + Online buttons */}
        <div className="pt-1 flex gap-1.5">
          <div className="flex-1 rounded-lg bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] py-1.5 text-center text-[11px] font-bold text-[#0d0d15] font-['Plus_Jakarta_Sans'] transition-shadow group-hover:shadow-[0_0_12px_rgba(207,150,255,0.4)]">
            Spielen
          </div>
          {onOnline && (
            <button
              onClick={(e) => { e.stopPropagation(); onOnline(); }}
              className="flex items-center justify-center rounded-lg border border-[#df8eff]/25 bg-[#df8eff]/10 px-2 py-1.5 transition-colors hover:bg-[#df8eff]/20"
              title="Online spielen"
            >
              <Globe className="h-3.5 w-3.5 text-[#df8eff]" />
            </button>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function getFreePlaysForGame(gameId: string): number {
  try {
    const date = new Date().toISOString().split("T")[0];
    return Number(localStorage.getItem(`free_plays_${gameId}_${date}`) || "0");
  } catch {
    return 0;
  }
}

const GamesHub = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const roomCode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get("room") : null;
  const lobbyParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get("lobby") : null;
  const [onlineGameId, setOnlineGameId] = useState<string | null>(lobbyParam);
  const [paywallGame, setPaywallGame] = useState<GameCardData | null>(null);
  const [activeCategory, setActiveCategory] = useState("alle");

  const filteredGames = useMemo(() => {
    if (activeCategory === "alle") return allGames;
    return allGames.filter(g => (GAME_CATEGORIES[g.id] || []).includes(activeCategory));
  }, [activeCategory]);
  const [onlinePlayerName] = useState(() => {
    try { return localStorage.getItem("eventbliss_player_name") || "Spieler"; } catch { return "Spieler"; }
  });
  const { isPremium } = usePremium();

  // Sync ?lobby= URL param to onlineGameId (used by native GameRoomSheet)
  useEffect(() => {
    if (lobbyParam && lobbyParam !== onlineGameId) {
      setOnlineGameId(lobbyParam);
    }
  }, [lobbyParam]);

  const premiumInfoMap = useMemo(() => {
    const map: Record<string, { isLocked: boolean; freePlaysLeft: number; isPremium: boolean }> = {};
    for (const tier of GAME_TIERS) {
      if (tier.tier === "premium") {
        const used = getFreePlaysForGame(tier.gameId);
        const limit = tier.freeRoundsLimit ?? 2;
        const left = Math.max(0, limit - used);
        map[tier.gameId] = {
          isLocked: !isPremium && left <= 0,
          freePlaysLeft: left,
          isPremium,
        };
      }
    }
    return map;
  }, [isPremium]);

  const handleGameClick = useCallback((game: GameCardData) => {
    const info = premiumInfoMap[game.id];
    if (info?.isLocked) {
      setPaywallGame(game);
    } else {
      navigate(`/games/${game.id}`);
    }
  }, [premiumInfoMap, navigate]);

  const handleQuickStart = () => {
    const playable = allGames;
    const random = playable[Math.floor(Math.random() * playable.length)];
    navigate(`/games/${random.id}`);
  };

  const handleOnlineStart = (players: any[], roomCode: string, selectedGameId?: string) => {
    const targetGame = selectedGameId || onlineGameId;
    if (targetGame) {
      navigate(`/games/${targetGame}?room=${roomCode}`);
    }
    setOnlineGameId(null);
  };

  // Game component routing
  const GameFallback = (
    <div className="min-h-screen bg-[#0d0d15] flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#cf96ff] border-t-transparent" />
    </div>
  );

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
      return null;
    };

    return (
      <TVBroadcastProvider roomCode={roomCode}>
        <Suspense fallback={GameFallback}>
          <OnlineGameWrapper gameId={gameId} roomCode={roomCode} playerName={onlinePlayerName}>
            {(onlineProps) => renderOnlineGame(onlineProps)}
          </OnlineGameWrapper>
        </Suspense>
      </TVBroadcastProvider>
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
            gameName={allGames.find((g) => g.id === onlineGameId)?.name ?? "Spiel"}
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
      const used = getFreePlaysForGame(gameId);
      const limit = tierConfig.freeRoundsLimit ?? 2;
      const left = Math.max(0, limit - used);
      if (left <= 0) {
        const gameData = allGames.find((g) => g.id === gameId);
        return (
          <>
            <PremiumPaywall
              isOpen={true}
              onClose={() => navigate("/games")}
              gameName={gameData?.name}
              freePlaysLeft={0}
            />
          </>
        );
      }
    }
  }

  // Offline games — wrapped in TVBroadcastProvider so they can
  // optionally connect to a TV screen via the floating 📺 button
  if (gameId === "category") return <TVBroadcastProvider><Suspense fallback={GameFallback}><CategoryGame /></Suspense></TVBroadcastProvider>;
  if (gameId === "bomb") return <TVBroadcastProvider><Suspense fallback={GameFallback}><BombGame /></Suspense></TVBroadcastProvider>;
  if (gameId === "headup") return <TVBroadcastProvider><Suspense fallback={GameFallback}><HeadUpGame /></Suspense></TVBroadcastProvider>;
  if (gameId === "taboo") return <TVBroadcastProvider><Suspense fallback={GameFallback}><TabooGame /></Suspense></TVBroadcastProvider>;
  if (gameId === "hochstapler") return <TVBroadcastProvider><Suspense fallback={GameFallback}><ImpostorGame /></Suspense></TVBroadcastProvider>;
  if (gameId === "drueck-das-wort") return <TVBroadcastProvider><Suspense fallback={GameFallback}><WordPressGame /></Suspense></TVBroadcastProvider>;
  if (gameId === "wo-ist-was") return <TVBroadcastProvider><Suspense fallback={GameFallback}><FindItGame /></Suspense></TVBroadcastProvider>;
  if (gameId === "split-quiz") return <TVBroadcastProvider><Suspense fallback={GameFallback}><SplitQuizGame onClose={() => navigate("/games")} /></Suspense></TVBroadcastProvider>;
  if (gameId === "geteilt-gequizzt") return <TVBroadcastProvider><Suspense fallback={GameFallback}><SharedQuizGame /></Suspense></TVBroadcastProvider>;
  if (gameId === "schnellzeichner") return <TVBroadcastProvider><Suspense fallback={GameFallback}><QuickDrawGame /></Suspense></TVBroadcastProvider>;
  if (gameId === "wahrheit-pflicht") return <TVBroadcastProvider><Suspense fallback={GameFallback}><TruthDareGame /></Suspense></TVBroadcastProvider>;
  if (gameId === "this-or-that") return <TVBroadcastProvider><Suspense fallback={GameFallback}><ThisOrThatGame /></Suspense></TVBroadcastProvider>;
  if (gameId === "wer-bin-ich") return <TVBroadcastProvider><Suspense fallback={GameFallback}><WhoAmIGame /></Suspense></TVBroadcastProvider>;
  if (gameId === "emoji-raten") return <TVBroadcastProvider><Suspense fallback={GameFallback}><EmojiGuessGame /></Suspense></TVBroadcastProvider>;
  if (gameId === "fake-or-fact") return <TVBroadcastProvider><Suspense fallback={GameFallback}><FakeOrFactGame /></Suspense></TVBroadcastProvider>;
  if (gameId === "story-builder") return <TVBroadcastProvider><Suspense fallback={GameFallback}><StoryBuilderGame /></Suspense></TVBroadcastProvider>;
  if (gameId === "flaschendrehen") return <TVBroadcastProvider><Suspense fallback={GameFallback}><BottleSpinGame /></Suspense></TVBroadcastProvider>;

  // Placeholder for not-yet-implemented games
  if (gameId) {
    const game = allGames.find((g) => g.id === gameId);
    const Icon = game?.icon ?? Gamepad2;
    return (
      <div className={`min-h-screen ${C.surface}`}>
        <div className="mx-auto max-w-2xl px-4 py-8">
          <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} onClick={() => navigate("/games")}
            className="mb-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" /><span className="text-sm font-medium font-['Be_Vietnam_Pro']">Zurück</span>
          </motion.button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-[1rem] border border-[#484750]/10 bg-[#1f1f29] p-8 text-center">
            {game && (
              <div className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br ${game.gradient}`}>
                <Icon className="h-12 w-12 text-white" />
              </div>
            )}
            <h1 className="text-2xl font-extrabold text-white mb-2 font-['Plus_Jakarta_Sans']">{game?.name ?? "Spiel nicht gefunden"}</h1>
            <p className="text-white/50 mb-4 font-['Be_Vietnam_Pro']">{game?.desc ?? ""}</p>
            <p className="text-sm text-white/30 font-['Be_Vietnam_Pro']">Spiellogik wird in Kürze freigeschaltet.</p>
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
        <h1 className="text-xl font-extrabold font-['Plus_Jakarta_Sans'] text-[#cf96ff] drop-shadow-[0_0_8px_rgba(207,150,255,0.4)]">
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
              <h2 className="text-4xl md:text-5xl font-extrabold text-white font-['Plus_Jakarta_Sans'] mb-2">Schnellstart</h2>
              <p className="text-white/50 font-['Be_Vietnam_Pro'] text-sm mb-5">
                Kein Plan? Kein Problem. Lass den Zufall entscheiden und starte sofort ein zufälliges Partyspiel!
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={handleQuickStart}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] px-6 py-3 text-sm font-bold text-[#0d0d15] font-['Plus_Jakarta_Sans'] shadow-[0_0_20px_rgba(207,150,255,0.3)] transition-shadow hover:shadow-[0_0_30px_rgba(207,150,255,0.5)]">
                  <Dices className="h-5 w-5" />
                  Random Game
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    const random = allGames[Math.floor(Math.random() * allGames.length)];
                    setOnlineGameId(random.id);
                  }}
                  className="inline-flex items-center gap-2.5 rounded-xl border border-[#df8eff]/30 bg-[#df8eff]/10 px-6 py-3 text-sm font-bold text-[#df8eff] font-['Plus_Jakarta_Sans'] transition-all hover:bg-[#df8eff]/20 hover:shadow-[0_0_20px_rgba(223,142,255,0.2)]">
                  <Globe className="h-5 w-5" />
                  Online spielen
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/tv')}
                  className="inline-flex items-center gap-2.5 rounded-xl border border-[#8ff5ff]/30 bg-[#8ff5ff]/10 px-6 py-3 text-sm font-bold text-[#8ff5ff] font-['Plus_Jakarta_Sans'] transition-all hover:bg-[#8ff5ff]/20 hover:shadow-[0_0_20px_rgba(143,245,255,0.2)]">
                  <span className="text-lg">📺</span>
                  TV Screen
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
          <h2 className="text-lg font-extrabold text-white font-['Plus_Jakarta_Sans'] mb-3">Kategorien</h2>
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
                  <span className={`text-[9px] font-semibold text-center leading-tight whitespace-nowrap ${active ? 'text-white' : 'text-white/50'}`}>{cat.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* Zuletzt gespielt */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8">
          <h2 className="text-lg font-extrabold text-white font-['Plus_Jakarta_Sans'] mb-3">Zuletzt gespielt</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {recentGames.map((rg) => {
              const RIcon = rg.icon;
              return (
                <div key={rg.name} className="flex items-center gap-3 min-w-[11rem] rounded-[1rem] bg-[#1f1f29] border border-[#484750]/10 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 flex-shrink-0">
                    <RIcon className="h-5 w-5 text-[#cf96ff]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white font-['Plus_Jakarta_Sans'] truncate">{rg.name}</p>
                    <p className="text-[10px] text-white/40 font-['Be_Vietnam_Pro']">{rg.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Alle Spiele */}
        <motion.section className="mt-8" initial="hidden" animate="visible" variants={stagger}>
          <h2 className="text-lg font-extrabold text-white font-['Plus_Jakarta_Sans'] mb-4">Alle Spiele</h2>
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {filteredGames.map((game) => (
                <GameCard key={game.id} game={game} onClick={() => handleGameClick(game)} onOnline={() => setOnlineGameId(game.id)} premiumInfo={premiumInfoMap[game.id]} />
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
                gameName={allGames.find((g) => g.id === onlineGameId)?.name ?? "Spiel"}
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
        gameName={paywallGame?.name}
        freePlaysLeft={paywallGame ? (premiumInfoMap[paywallGame.id]?.freePlaysLeft ?? 0) : 0}
      />

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-4 py-3 bg-[#13131b]/80 backdrop-blur-2xl border-t border-[#484750]/10 rounded-t-[2rem]"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        {[
          { label: "Events", icon: Dices, path: "/", active: false },
          { label: "Games Hub", icon: Gamepad2, path: "/games", active: true },
          { label: "Profile", icon: Users, path: "/profile", active: false },
          { label: "Settings", icon: Bell, path: "/settings", active: false },
        ].map((item) => {
          const NavIcon = item.icon;
          return (
            <button key={item.label} onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-1 rounded-2xl transition-colors ${
                item.active ? "bg-[#cf96ff]/15" : ""
              }`}>
              <NavIcon className={`h-5 w-5 ${item.active ? "text-[#cf96ff] drop-shadow-[0_0_8px_rgba(207,150,255,0.4)]" : "text-white/40"}`} />
              <span className={`text-[10px] font-medium font-['Be_Vietnam_Pro'] ${item.active ? "text-[#cf96ff]" : "text-white/40"}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default GamesHub;
