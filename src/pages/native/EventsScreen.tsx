/**
 * EventsScreen — native "My Events" tab.
 * Card list with stagger reveal, tap opens the event dashboard.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PartyPopper, Users, Calendar, Plus, Archive, Search } from "lucide-react";
import { useMyEvents } from "@/hooks/useMyEvents";
import { useHaptics } from "@/hooks/useHaptics";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { spring, stagger, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Tab = "active" | "archived";

export default function EventsScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { events = [], archivedEvents = [], isLoading, refetch } = useMyEvents();
  const { containerRef, PullIndicator } = usePullToRefresh({
    onRefresh: async () => { await refetch(); },
  });
  const [tab, setTab] = useState<Tab>("active");
  const [query, setQuery] = useState("");

  const source = tab === "active" ? events : archivedEvents;
  const filtered = source.filter((e) =>
    e.name.toLowerCase().includes(query.toLowerCase())
  );

  const switchTab = (next: Tab) => {
    haptics.select();
    setTab(next);
  };

  return (
    <div className="relative h-full flex flex-col bg-background safe-top">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <h1 className="text-3xl font-display font-bold text-foreground">Events</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {events.length} aktive · {archivedEvents.length} archiviert
        </p>
      </div>

      {/* Search */}
      <div className="px-5 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Event suchen..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-foreground/5 border border-border text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-2">
        <div className="relative flex gap-1 p-1 rounded-2xl bg-foreground/5 border border-border">
          {(["active", "archived"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className="relative flex-1 h-9 text-sm font-medium z-10 text-foreground/80"
            >
              {tab === t && (
                <motion.div
                  layoutId="events-tab"
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500"
                  transition={spring.snappy}
                />
              )}
              <span className="relative">
                {t === "active" ? "Aktiv" : "Archiviert"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div ref={containerRef} className="flex-1 overflow-y-auto native-scroll pb-tabbar">
        <PullIndicator />
        {isLoading ? (
          <div className="px-5 space-y-3 mt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-foreground/5 border border-border/50 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 pt-10 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 flex items-center justify-center mx-auto mb-4">
              {tab === "active" ? (
                <PartyPopper className="w-10 h-10 text-primary/60" />
              ) : (
                <Archive className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-display font-semibold text-foreground mb-1">
              {tab === "active" ? "Noch keine Events" : "Keine Archivierten"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {tab === "active"
                ? "Plan dein erstes Event und lade Freunde ein."
                : "Archivierte Events erscheinen hier."}
            </p>
            {tab === "active" && (
              <motion.button
                onClick={() => {
                  haptics.medium();
                  navigate("/create");
                }}
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold shadow-[0_0_30px_rgba(139,92,246,0.4)]"
              >
                <Plus className="w-5 h-5" />
                Event erstellen
              </motion.button>
            )}
          </div>
        ) : (
          <motion.div
            className="px-5 space-y-3 pt-2"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            {filtered.map((event) => (
              <motion.button
                key={event.id}
                variants={staggerItem}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  haptics.light();
                  navigate(`/e/${event.slug}/dashboard`);
                }}
                className={cn(
                  "w-full rounded-2xl p-4 text-left bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border",
                  "hover:border-primary/30 transition-colors"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                    <PartyPopper className="w-6 h-6 text-violet-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-foreground truncate">
                      {event.name}
                    </h3>
                    {event.honoree_name && (
                      <p className="text-xs text-muted-foreground truncate">
                        für {event.honoree_name}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {event.event_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(event.event_date).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.participant_count}
                      </span>
                    </div>
                  </div>
                  {event.is_organizer && (
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
                      Host
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
