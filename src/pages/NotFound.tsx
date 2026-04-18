import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Home,
  ArrowLeft,
  Compass,
  Sparkles,
  ShoppingBag,
  Calendar,
  MessageCircle,
  Search,
} from "lucide-react";

const SUGGESTIONS = [
  { to: "/", icon: Home, labelKey: "Startseite", sub: "event-bliss.com" },
  { to: "/marketplace", icon: ShoppingBag, labelKey: "Marketplace", sub: "Event-Services entdecken" },
  { to: "/my-bookings", icon: Calendar, labelKey: "Meine Buchungen", sub: "Reservierungen verwalten" },
  { to: "/agency-apply", icon: Sparkles, labelKey: "Agentur werden", sub: "Partner-Bewerbung" },
];

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reduced = !!useReducedMotion();

  useEffect(() => {
    console.error("404 Error: non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0612] text-white">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/3 -left-1/4 w-[90vw] h-[90vw] rounded-full blur-3xl opacity-25"
          style={{ background: "radial-gradient(circle, rgba(207,150,255,0.45), transparent 60%)" }}
          animate={reduced ? undefined : { scale: [1, 1.05, 1], rotate: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-1/3 -right-1/4 w-[70vw] h-[70vw] rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, rgba(0,227,253,0.4), transparent 60%)" }}
          animate={reduced ? undefined : { scale: [1, 1.08, 1], rotate: [0, -25, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 right-1/3 w-[40vw] h-[40vw] rounded-full blur-3xl opacity-15"
          style={{ background: "radial-gradient(circle, rgba(255,115,80,0.35), transparent 60%)" }}
          animate={reduced ? undefined : { scale: [0.95, 1.12, 0.95] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top nav */}
        <header className="px-5 py-5 sm:px-8 sm:py-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-violet-200 via-white to-cyan-200 bg-clip-text text-transparent">
              EventBliss
            </span>
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Zurück
          </button>
        </header>

        {/* Hero */}
        <main className="flex-1 flex items-center justify-center px-5 pb-16 pt-4">
          <div className="w-full max-w-2xl text-center">
            {/* Glitchy 404 */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative inline-block"
            >
              <h1
                className="text-[120px] sm:text-[180px] font-black leading-none tracking-[-0.05em] bg-gradient-to-br from-violet-300 via-fuchsia-200 to-cyan-300 bg-clip-text text-transparent"
                style={{
                  filter: "drop-shadow(0 0 48px rgba(207,150,255,0.3))",
                }}
              >
                404
              </h1>
              {/* Subtle animated ring behind */}
              <motion.div
                aria-hidden
                className="absolute -inset-8 rounded-full border border-white/5 pointer-events-none"
                animate={reduced ? undefined : { rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                style={{
                  maskImage: "linear-gradient(to bottom, black, transparent 70%)",
                  WebkitMaskImage: "linear-gradient(to bottom, black, transparent 70%)",
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="mt-4"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-white/5 text-violet-200 border border-violet-400/20">
                <Compass className="w-3 h-3" /> Seite nicht gefunden
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mt-5 text-2xl sm:text-3xl font-bold text-white tracking-tight"
            >
              Hier ist nichts — aber dafür woanders umso mehr.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mt-3 text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed"
            >
              Die URL{" "}
              <code className="inline-block px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 font-mono text-xs text-violet-200 break-all">
                {location.pathname}
              </code>{" "}
              existiert nicht (oder nicht mehr). Spring zurück oder wähl unten einen Weg.
            </motion.p>

            {/* CTA row */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link
                to="/"
                className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all active:scale-[0.98]"
              >
                <Home className="w-4 h-4" />
                Zur Startseite
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <button
                onClick={() => {
                  const q = window.prompt("Wonach suchst du?");
                  if (q?.trim()) navigate(`/marketplace?search=${encodeURIComponent(q.trim())}`);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm bg-white/5 text-slate-200 border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4" />
                Marketplace durchsuchen
              </button>
            </motion.div>

            {/* Quick suggestions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.6 }}
              className="mt-12"
            >
              <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold mb-4">
                Vielleicht suchst du
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SUGGESTIONS.map((s, i) => (
                  <motion.div
                    key={s.to}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.05 }}
                  >
                    <Link
                      to={s.to}
                      className="group relative block p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-violet-400/30 hover:bg-white/[0.06] transition-all text-left overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 via-violet-500/0 to-cyan-500/0 group-hover:from-violet-500/10 group-hover:to-cyan-500/10 transition-all" />
                      <div className="relative">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/25 to-cyan-500/25 border border-white/10 flex items-center justify-center mb-2.5 group-hover:from-violet-500/40 group-hover:to-cyan-500/40 transition-colors">
                          <s.icon className="w-4 h-4 text-violet-200" />
                        </div>
                        <div className="text-xs font-bold text-white leading-tight">{s.labelKey}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate">{s.sub}</div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Support footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-14 flex items-center justify-center gap-2 text-[11px] text-slate-500"
            >
              <MessageCircle className="w-3 h-3" />
              <span>Nichts passt?</span>
              <a
                href="mailto:support@event-bliss.com"
                className="text-violet-300 hover:text-violet-200 transition-colors"
              >
                support@event-bliss.com
              </a>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotFound;
