import { lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2, Bomb, Brain, MessageSquareOff, Timer, Users, Clock,
  ArrowLeft, Shuffle, Bell, Star, UserX, Type, Search as SearchIcon,
  HelpCircle, Palette, Languages, Hand, Dices,
} from "lucide-react";

const CategoryGame = lazy(() => import("@/games/category/CategoryGame"));
const BombGame = lazy(() => import("@/games/bomb/BombGame"));
const HeadUpGame = lazy(() => import("@/games/headup/HeadUpGame"));
const TabooGame = lazy(() => import("@/games/taboo/TabooGame"));
const ImpostorGame = lazy(() => import("@/games/impostor/ImpostorGame"));
const WordPressGame = lazy(() => import("@/games/wordpress/WordPressGame"));
const FindItGame = lazy(() => import("@/games/findit/FindItGame"));
const SplitQuizGame = lazy(() => import("@/games/splitquiz/SplitQuizGame"));

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
}

const allGames: GameCardData[] = [
  { id: "bomb", name: "Tickende Bombe", desc: "Bei wem knallt's? Nerven aus Stahl gefragt!", icon: Bomb, gradient: "from-[#ff7350] to-[#ff4444]", players: "3-20", duration: "5-20", badge: "Hot", rating: 4.8 },
  { id: "headup", name: "Stirnraten", desc: "Begriffe erraten mit Stirn-Power", icon: Brain, gradient: "from-[#cf96ff] to-[#9b59b6]", players: "2-20", duration: "5-20", rating: 4.7 },
  { id: "taboo", name: "Wortverbot", desc: "Erklären ohne Tabu-Wörter", icon: MessageSquareOff, gradient: "from-[#00e3fd] to-[#0099cc]", players: "4-20", duration: "10-30", rating: 4.6 },
  { id: "category", name: "Zeit-Kategorie", desc: "Gegen die Uhr Begriffe nennen", icon: Timer, gradient: "from-amber-500 to-amber-600", players: "2-15", duration: "5-15", rating: 4.5 },
  { id: "hochstapler", name: "Hochstapler", desc: "Wer lügt am besten? Entlarve den Faker!", icon: UserX, gradient: "from-[#cf96ff] to-pink-500", players: "4-15", duration: "10-25", badge: "Neu", rating: 4.9 },
  { id: "drueck-das-wort", name: "Drück das Wort", desc: "Schnell tippen, schnell denken!", icon: Type, gradient: "from-emerald-500 to-green-600", players: "1-8", duration: "3-10", rating: 4.3 },
  { id: "wo-ist-was", name: "Wo ist was?", desc: "Finde den versteckten Gegenstand", icon: SearchIcon, gradient: "from-cyan-400 to-cyan-600", players: "2-10", duration: "5-15", rating: 4.4 },
  { id: "split-quiz", name: "Split Quiz", desc: "Team-Quiz mit Wissenssplit", icon: Users, gradient: "from-blue-500 to-blue-700", players: "4-30", duration: "10-30", rating: 4.6 },
];

const categories = [
  { label: "Quiz & Wissen", icon: HelpCircle, color: C.primary },
  { label: "Wort & Sprache", icon: Languages, color: C.secondary },
  { label: "Reaktion & Geschick", icon: Hand, color: C.tertiary },
  { label: "Social & Bluff", icon: Users, color: C.primary },
  { label: "Kreativ & Spaß", icon: Palette, color: C.secondary },
];

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

function GameCard({ game, onClick }: { game: GameCardData; onClick: () => void }) {
  const Icon = game.icon;
  return (
    <motion.button
      variants={fadeUp}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-[1rem] border border-[#484750]/10 bg-[#1f1f29] text-left transition-all hover:border-[#cf96ff]/30 hover:shadow-[0_0_20px_rgba(207,150,255,0.15)]"
    >
      {/* Gradient header */}
      <div className={`relative flex aspect-[16/9] items-center justify-center bg-gradient-to-br ${game.gradient} overflow-hidden`}>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 50%),
                            radial-gradient(circle at 70% 30%, rgba(255,255,255,0.15) 0%, transparent 40%)`,
        }} />
        <Icon className="relative z-10 h-12 w-12 text-white drop-shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
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

        {/* Spielen button */}
        <div className="pt-1">
          <div className="w-full rounded-lg bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] py-1.5 text-center text-[11px] font-bold text-[#0d0d15] font-['Plus_Jakarta_Sans'] transition-shadow group-hover:shadow-[0_0_12px_rgba(207,150,255,0.4)]">
            Spielen
          </div>
        </div>
      </div>
    </motion.button>
  );
}

const GamesHub = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();

  const handleQuickStart = () => {
    const playable = allGames.filter(g => ["bomb", "headup", "taboo", "category", "hochstapler", "drueck-das-wort", "wo-ist-was", "split-quiz"].includes(g.id));
    const random = playable[Math.floor(Math.random() * playable.length)];
    navigate(`/games/${random.id}`);
  };

  // Game component routing
  const GameFallback = (
    <div className="min-h-screen bg-[#0d0d15] flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#cf96ff] border-t-transparent" />
    </div>
  );

  if (gameId === "category") return <Suspense fallback={GameFallback}><CategoryGame /></Suspense>;
  if (gameId === "bomb") return <Suspense fallback={GameFallback}><BombGame /></Suspense>;
  if (gameId === "headup") return <Suspense fallback={GameFallback}><HeadUpGame /></Suspense>;
  if (gameId === "taboo") return <Suspense fallback={GameFallback}><TabooGame /></Suspense>;
  if (gameId === "hochstapler") return <Suspense fallback={GameFallback}><ImpostorGame /></Suspense>;
  if (gameId === "drueck-das-wort") return <Suspense fallback={GameFallback}><WordPressGame /></Suspense>;
  if (gameId === "wo-ist-was") return <Suspense fallback={GameFallback}><FindItGame /></Suspense>;
  if (gameId === "split-quiz") return <Suspense fallback={GameFallback}><SplitQuizGame onClose={() => navigate("/games")} /></Suspense>;

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
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={handleQuickStart}
                className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] px-6 py-3 text-sm font-bold text-[#0d0d15] font-['Plus_Jakarta_Sans'] shadow-[0_0_20px_rgba(207,150,255,0.3)] transition-shadow hover:shadow-[0_0_30px_rgba(207,150,255,0.5)]">
                <Dices className="h-5 w-5" />
                Random Game
              </motion.button>
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
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {categories.map((cat) => {
              const CatIcon = cat.icon;
              return (
                <motion.div key={cat.label} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center justify-center gap-2 min-w-[4.5rem] w-[4.5rem] h-[4.5rem] rounded-2xl bg-[#1f1f29] border border-[#484750]/10 cursor-pointer transition-colors hover:border-white/10">
                  <CatIcon className="h-5 w-5" style={{ color: cat.color }} />
                  <span className="text-[9px] font-medium text-white/60 font-['Be_Vietnam_Pro'] text-center leading-tight whitespace-nowrap">{cat.label}</span>
                </motion.div>
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
              {allGames.map((game) => (
                <GameCard key={game.id} game={game} onClick={() => navigate(`/games/${game.id}`)} />
              ))}
            </AnimatePresence>
          </div>
        </motion.section>
      </div>

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
