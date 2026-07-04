/**
 * EventsScreen — native "My Events" tab.
 * Card list with stagger reveal, tap opens the event dashboard.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PartyPopper, Users, Calendar, Plus, Archive, ArchiveRestore, Search, MoreVertical, Trash2, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useMyEvents, type MyEvent } from "@/hooks/useMyEvents";
import { useHaptics } from "@/hooks/useHaptics";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { supabase } from "@/integrations/supabase/client";
import { spring, stagger, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Tab = "active" | "archived";

export default function EventsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { events = [], archivedEvents = [], isLoading, refetch } = useMyEvents();
  const { containerRef, PullIndicator } = usePullToRefresh({
    onRefresh: async () => { await refetch(); },
  });
  const [tab, setTab] = useState<Tab>("active");
  const [query, setQuery] = useState("");
  const [actionFor, setActionFor] = useState<MyEvent | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const setArchived = async (ev: MyEvent, archive: boolean) => {
    setBusy(true);
    const { error } = await supabase
      .from("events")
      .update({ archived_at: archive ? new Date().toISOString() : null })
      .eq("id", ev.id);
    setBusy(false);
    if (error) { haptics.warning(); toast.error(t("native.events.actionError", "Das hat nicht geklappt.")); return; }
    haptics.success();
    toast.success(archive ? t("native.events.archived", "Archiviert") : t("native.events.restored", "Wiederhergestellt"));
    setActionFor(null);
    await refetch();
  };

  const softDelete = async (ev: MyEvent) => {
    setBusy(true);
    const { error } = await supabase
      .from("events")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", ev.id);
    setBusy(false);
    if (error) { haptics.warning(); toast.error(t("native.events.actionError", "Das hat nicht geklappt.")); return; }
    haptics.warning();
    toast.success(t("native.events.deleted", "Event gelöscht"));
    setActionFor(null);
    setConfirmDelete(false);
    await refetch();
  };

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
        <h1 className="text-3xl font-display font-bold text-foreground">{t('native.events.title')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('native.events.countSummary', { active: events.length, archived: archivedEvents.length })}
        </p>
      </div>

      {/* Search */}
      <div className="px-5 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder={t('native.events.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-foreground/5 border border-border text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-2">
        <div className="relative flex gap-1 p-1 rounded-2xl bg-foreground/5 border border-border">
          {(["active", "archived"] as Tab[]).map((tabId) => (
            <button
              key={tabId}
              onClick={() => switchTab(tabId)}
              className="relative flex-1 h-9 text-sm font-medium z-10 text-foreground/80"
            >
              {tab === tabId && (
                <motion.div
                  layoutId="events-tab"
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500"
                  transition={spring.snappy}
                />
              )}
              <span className="relative">
                {tabId === "active" ? t('native.events.tabActive') : t('native.events.tabArchived')}
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
              {tab === "active" ? t('native.events.noEventsTitle') : t('native.events.noArchivedTitle')}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {tab === "active"
                ? t('native.events.noEventsDesc')
                : t('native.events.noArchivedDesc')}
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
                {t('native.events.createEvent')}
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
              <motion.div
                key={event.id}
                variants={staggerItem}
                whileTap={{ scale: 0.98 }}
                role="button"
                tabIndex={0}
                onClick={() => {
                  haptics.light();
                  navigate(`/e/${event.slug}/dashboard`);
                }}
                className={cn(
                  "relative w-full rounded-2xl p-4 text-left bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border cursor-pointer",
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
                        {t('native.events.forHonoree', { name: event.honoree_name })}
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

                {event.is_organizer && (
                  <button
                    type="button"
                    aria-label={t("native.events.manage", "Verwalten")}
                    onClick={(e) => { e.stopPropagation(); haptics.light(); setConfirmDelete(false); setActionFor(event); }}
                    className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-foreground/10 active:bg-foreground/15"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Manage sheet — archive / restore / delete */}
      <AnimatePresence>
        {actionFor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[80] flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }}
            onClick={() => { if (!busy) { setActionFor(null); setConfirmDelete(false); } }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={spring.snappy}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl border-t border-x border-border bg-card p-5 safe-bottom"
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20">
                  <PartyPopper className="h-5 w-5 text-violet-400 dark:text-violet-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-foreground">{actionFor.name}</p>
                  <p className="text-xs text-muted-foreground">{t("native.events.manageSub", "Event verwalten")}</p>
                </div>
                <button type="button" onClick={() => { if (!busy) { setActionFor(null); setConfirmDelete(false); } }} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-foreground/10">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {!confirmDelete ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setArchived(actionFor, !actionFor.archived_at)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-border bg-muted/60 p-3.5 text-left active:bg-muted disabled:opacity-50"
                  >
                    {actionFor.archived_at
                      ? <ArchiveRestore className="h-5 w-5 text-foreground" />
                      : <Archive className="h-5 w-5 text-foreground" />}
                    <span className="text-sm font-semibold text-foreground">
                      {actionFor.archived_at ? t("native.events.restore", "Wiederherstellen") : t("native.events.archive", "Archivieren")}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmDelete(true)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-left active:bg-red-500/15 disabled:opacity-50"
                  >
                    <Trash2 className="h-5 w-5 text-red-500 dark:text-red-400" />
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">{t("native.events.delete", "Löschen")}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t("native.events.deleteConfirm", "Event wirklich löschen? Das kann nicht rückgängig gemacht werden.")}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 rounded-2xl border border-border bg-muted/60 py-3 text-sm font-semibold text-foreground active:bg-muted disabled:opacity-50"
                    >
                      {t("common.cancel", "Abbrechen")}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => softDelete(actionFor)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white active:bg-red-600 disabled:opacity-50"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      {t("native.events.delete", "Löschen")}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
