import { lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Gamepad2,
  Bomb,
  Brain,
  MessageSquareOff,
  Timer,
  Zap,
  Users,
  Clock,
  ArrowLeft,
  Shuffle,
  Lock,
  HelpCircle,
  LayoutGrid,
  MapPin,
  Type,
} from "lucide-react";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";

const CategoryGame = lazy(() => import("@/games/category/CategoryGame"));

interface GameCardData {
  id: string;
  name: string;
  desc: string;
  icon: React.ElementType;
  gradient: string;
  players: string;
  duration: string;
  category: string;
}

const games: GameCardData[] = [
  {
    id: "bomb",
    name: "Tickende Bombe",
    desc: "Bei wem knallt's?",
    icon: Bomb,
    gradient: "from-red-600 to-orange-500",
    players: "3-20",
    duration: "5-20",
    category: "Nervenkitzel",
  },
  {
    id: "headup",
    name: "Stirnraten",
    desc: "Begriffe erraten",
    icon: Brain,
    gradient: "from-cyan-500 to-blue-500",
    players: "2-20",
    duration: "5-20",
    category: "Erklären",
  },
  {
    id: "taboo",
    name: "Wortverbot",
    desc: "Erklären ohne Tabu-Wörter",
    icon: MessageSquareOff,
    gradient: "from-violet-600 to-purple-600",
    players: "4-20",
    duration: "10-30",
    category: "Kommunikation",
  },
  {
    id: "category",
    name: "Zeit-Kategorie",
    desc: "Gegen die Uhr",
    icon: Timer,
    gradient: "from-amber-500 to-yellow-500",
    players: "2-15",
    duration: "5-15",
    category: "Schnelligkeit",
  },
];

interface ComingSoonCard {
  name: string;
  icon: React.ElementType;
}

const comingSoon: ComingSoonCard[] = [
  { name: "Hochstapler", icon: HelpCircle },
  { name: "Split Quiz", icon: LayoutGrid },
  { name: "Wo ist was?", icon: MapPin },
  { name: "Drück das Wort", icon: Type },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

function GameCard({ game, onClick }: { game: GameCardData; onClick: () => void }) {
  const Icon = game.icon;

  return (
    <motion.button
      variants={itemVariants}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl text-left transition-colors hover:border-white/20"
    >
      {/* Gradient header */}
      <div
        className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${game.gradient} overflow-hidden`}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 30% 50%, rgba(255,255,255,0.15) 0%, transparent 50%),
                              radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1) 0%, transparent 40%)`,
          }} />
        </div>
        <Icon className="relative z-10 h-14 w-14 text-white drop-shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-lg font-bold text-white">{game.name}</h3>
          <p className="text-sm text-white/60">{game.desc}</p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">
            <Users className="h-3 w-3" />
            {game.players} Spieler
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">
            <Clock className="h-3 w-3" />
            {game.duration} Min
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">
            <Zap className="h-3 w-3" />
            {game.category}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function ComingSoonCardComponent({ card }: { card: ComingSoonCard }) {
  const Icon = card.icon;
  return (
    <motion.div
      variants={itemVariants}
      className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm"
    >
      <div className="relative">
        <Icon className="h-8 w-8 text-white/20" />
        <Lock className="absolute -bottom-1 -right-1 h-3.5 w-3.5 text-white/30" />
      </div>
      <span className="text-sm font-medium text-white/30">{card.name}</span>
      <span className="text-[10px] uppercase tracking-widest text-white/15">
        Bald verfügbar
      </span>
    </motion.div>
  );
}

const GamesHub = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();

  const handleQuickStart = () => {
    const randomGame = games[Math.floor(Math.random() * games.length)];
    navigate(`/games/${randomGame.id}`);
  };

  const handleGameClick = (id: string) => {
    navigate(`/games/${id}`);
  };

  // Render actual game components for implemented games
  if (gameId === "category") {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#0f0a1e] flex items-center justify-center"><span className="text-white/40">Laden...</span></div>}>
        <CategoryGame />
      </Suspense>
    );
  }

  // Placeholder for games not yet implemented
  if (gameId) {
    const game = games.find((g) => g.id === gameId);
    const Icon = game?.icon ?? Gamepad2;

    return (
      <AnimatedBackground>
        <div className="min-h-screen bg-[#0f0a1e]/80">
          <div className="mx-auto max-w-2xl px-4 py-8">
            {/* Back */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => navigate("/games")}
              className="mb-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Zurück</span>
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center"
            >
              {game && (
                <div
                  className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br ${game.gradient}`}
                >
                  <Icon className="h-12 w-12 text-white" />
                </div>
              )}
              <h1 className="text-2xl font-bold text-white mb-2">
                {game?.name ?? "Spiel nicht gefunden"}
              </h1>
              <p className="text-white/60 mb-6">{game?.desc ?? ""}</p>
              <p className="text-sm text-white/40">
                Spiellogik wird in Kürze freigeschaltet.
              </p>
            </motion.div>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <div className="min-h-screen bg-[#0f0a1e]/80">
        <div className="mx-auto max-w-5xl px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => navigate("/")}
              className="mb-4 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Zurück</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 shadow-lg shadow-fuchsia-500/25">
                <Gamepad2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  EventBliss Games
                </h1>
                <p className="text-sm text-white/50">
                  Partyspiele für jede Feier
                </p>
              </div>
            </div>
          </motion.div>

          {/* Quick Start */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <button
              onClick={handleQuickStart}
              className="group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-fuchsia-600/20 via-pink-600/20 to-orange-500/20 p-5 backdrop-blur-xl transition-all hover:border-white/20 hover:shadow-lg hover:shadow-fuchsia-500/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                    <Shuffle className="h-5 w-5 text-fuchsia-400" />
                  </div>
                  <div className="text-left">
                    <span className="text-lg font-bold text-white">Schnellstart</span>
                    <p className="text-xs text-white/50">Zufälliges Spiel starten</p>
                  </div>
                </div>
                <Zap className="h-6 w-6 text-fuchsia-400 transition-transform group-hover:rotate-12 group-hover:scale-110" />
              </div>
            </button>
          </motion.div>

          {/* Game Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
          >
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onClick={() => handleGameClick(game.id)}
              />
            ))}
          </motion.div>

          {/* Coming Soon */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <h2 className="mb-4 text-lg font-semibold text-white/40">
              Bald verfügbar
            </h2>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-3 md:grid-cols-4"
            >
              {comingSoon.map((card) => (
                <ComingSoonCardComponent key={card.name} card={card} />
              ))}
            </motion.div>
          </motion.div>

          {/* Footer spacing */}
          <div className="h-16" />
        </div>
      </div>
    </AnimatedBackground>
  );
};

export default GamesHub;
