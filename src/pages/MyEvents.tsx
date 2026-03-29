import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, Users, ArrowRight, Plus, ChevronLeft, Archive, Trash2, FolderPlus, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useMyEvents } from "@/hooks/useMyEvents";
import { useEventFolders } from "@/hooks/useEventFolders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCardActions } from "@/components/events/EventCardActions";
import { DeleteEventDialog } from "@/components/events/DeleteEventDialog";
import { CreateFolderDialog } from "@/components/events/CreateFolderDialog";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { toast } from "sonner";

type FilterType = "all" | "unfiled" | "archived" | "deleted" | string;

export default function MyEvents() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isPremium, planType } = useAuthContext();
  const { events, archivedEvents, deletedEvents, isLoading, refetch } = useMyEvents();
  const { folders, assignments, fetchFolders, createFolder, deleteFolder, assignToFolder, removeFromFolder, getFolderForEvent } = useEventFolders(user?.id);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<{ id: string; name: string } | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const dateLocale = i18n.language === "de" ? de : enUS;

  // TODO: Replace with actual agency plan check
  const isAgencyPlan = planType === "lifetime" || isPremium;

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchFolders();
  }, [user, fetchFolders]);

  const handleArchive = async (eventId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("events")
      .update({ archived_at: new Date().toISOString(), archived_by: user.id } as any)
      .eq("id", eventId);
    if (error) { toast.error(error.message); return; }
    toast.success(t("myEvents.eventArchived"));
    refetch();
  };

  const handleUnarchive = async (eventId: string) => {
    const { error } = await supabase
      .from("events")
      .update({ archived_at: null, archived_by: null } as any)
      .eq("id", eventId);
    if (error) { toast.error(error.message); return; }
    toast.success(t("myEvents.eventUnarchived"));
    refetch();
  };

  const handleDelete = async (reason?: string) => {
    if (!selectedEvent || !user) return;
    const { error } = await supabase
      .from("events")
      .update({ deleted_at: new Date().toISOString(), deleted_by: user.id, deletion_reason: reason || null } as any)
      .eq("id", selectedEvent.id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("myEvents.eventDeleted"));
    setDeleteDialogOpen(false);
    setSelectedEvent(null);
    refetch();
  };

  const handleRestore = async (eventId: string) => {
    const { error } = await supabase
      .from("events")
      .update({ deleted_at: null, deleted_by: null, deletion_reason: null } as any)
      .eq("id", eventId);
    if (error) { toast.error(error.message); return; }
    toast.success(t("myEvents.eventRestored"));
    refetch();
  };

  // Filter events
  const getFilteredEvents = () => {
    if (activeFilter === "archived") return archivedEvents;
    if (activeFilter === "deleted") return deletedEvents;
    if (activeFilter === "unfiled") {
      return events.filter(e => !getFolderForEvent(e.id));
    }
    if (activeFilter !== "all") {
      // Filter by folder ID
      return events.filter(e => getFolderForEvent(e.id) === activeFilter);
    }
    return events;
  };

  const filteredEvents = getFilteredEvents();
  const unfiledCount = events.filter(e => !getFolderForEvent(e.id)).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "planning": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "completed": return "bg-muted text-muted-foreground";
      case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "bachelor": case "bachelorette": return "🎉";
      case "birthday": return "🎂";
      case "trip": return "✈️";
      default: return "📅";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const folderCountMap = new Map<string, number>();
  events.forEach(e => {
    const fid = getFolderForEvent(e.id);
    if (fid) folderCountMap.set(fid, (folderCountMap.get(fid) || 0) + 1);
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 pt-[env(safe-area-inset-top)] border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">{t("profile.myEvents")}</h1>
          </div>
          <Button onClick={() => navigate("/create")}>
            <Plus className="h-4 w-4 mr-2" />
            {t("landing.hero.createEvent")}
          </Button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="container py-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <FilterChip active={activeFilter === "all"} onClick={() => setActiveFilter("all")} count={events.length}>
            {t("myEvents.allEvents")}
          </FilterChip>

          {isAgencyPlan && (
            <>
              <FilterChip active={activeFilter === "unfiled"} onClick={() => setActiveFilter("unfiled")} count={unfiledCount}>
                {t("myEvents.unfiled")}
              </FilterChip>
              {folders.map(f => (
                <FilterChip
                  key={f.id}
                  active={activeFilter === f.id}
                  onClick={() => setActiveFilter(f.id)}
                  count={folderCountMap.get(f.id) || 0}
                  color={f.color || undefined}
                >
                  {f.name}
                </FilterChip>
              ))}
              <button
                onClick={() => setFolderDialogOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                {t("myEvents.newFolder")}
              </button>
            </>
          )}

          <div className="w-px bg-border mx-1" />

          <FilterChip active={activeFilter === "archived"} onClick={() => setActiveFilter("archived")} count={archivedEvents.length} icon={<Archive className="h-3.5 w-3.5" />}>
            {t("myEvents.archived")}
          </FilterChip>

          {deletedEvents.length > 0 && (
            <FilterChip active={activeFilter === "deleted"} onClick={() => setActiveFilter("deleted")} count={deletedEvents.length} icon={<Trash2 className="h-3.5 w-3.5" />}>
              {t("myEvents.deleted")}
            </FilterChip>
          )}
        </div>
      </div>

      <main className="container pb-8">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardHeader>
                <CardContent><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-2/3" /></CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              {activeFilter === "archived" ? <Archive className="h-12 w-12 text-muted-foreground" /> :
               activeFilter === "deleted" ? <Trash2 className="h-12 w-12 text-muted-foreground" /> :
               <Calendar className="h-12 w-12 text-muted-foreground" />}
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {activeFilter === "archived" ? t("myEvents.noArchivedEvents") :
               activeFilter === "deleted" ? t("myEvents.noDeletedEvents") :
               t("profile.noEvents")}
            </h2>
            {activeFilter === "all" && (
              <>
                <p className="text-muted-foreground mb-6 max-w-md">{t("profile.noEventsDescription")}</p>
                <Button onClick={() => navigate("/create")}>
                  <Plus className="h-4 w-4 mr-2" />{t("profile.createFirstEvent")}
                </Button>
              </>
            )}
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event, index) => (
              <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card
                  className={`group hover:shadow-md transition-all cursor-pointer h-full ${event.deleted_at ? "opacity-60" : ""}`}
                  onClick={() => !event.deleted_at && navigate(`/e/${event.slug}/dashboard`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-2xl flex-shrink-0">{getEventTypeIcon(event.event_type)}</span>
                        <div className="min-w-0">
                          <CardTitle className="text-lg line-clamp-1">{event.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {t("createEvent.step4.forHonoree", { name: event.honoree_name })}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Badge variant="outline" className={getStatusColor(event.status)}>
                          {t(`dashboard.overview.status.${event.status}`)}
                        </Badge>
                        <EventCardActions
                          eventId={event.id}
                          isArchived={!!event.archived_at}
                          isDeleted={!!event.deleted_at}
                          folders={isAgencyPlan ? folders : []}
                          currentFolderId={getFolderForEvent(event.id)}
                          showFolders={isAgencyPlan}
                          onArchive={() => handleArchive(event.id)}
                          onUnarchive={() => handleUnarchive(event.id)}
                          onDelete={() => { setSelectedEvent({ id: event.id, name: event.name }); setDeleteDialogOpen(true); }}
                          onRestore={() => handleRestore(event.id)}
                          onMoveToFolder={(folderId) => assignToFolder(event.id, folderId)}
                          onRemoveFromFolder={() => removeFromFolder(event.id)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        {event.event_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(event.event_date), "dd MMM yyyy", { locale: dateLocale })}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {event.participant_count}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.is_organizer && (
                          <Badge variant="secondary" className="text-xs">
                            {t("dashboard.team.roles.organizer")}
                          </Badge>
                        )}
                        {event.deleted_at ? (
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleRestore(event.id); }}>
                            <RotateCcw className="h-3.5 w-3.5 mr-1" />{t("myEvents.restoreEvent")}
                          </Button>
                        ) : (
                          <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <DeleteEventDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        event={selectedEvent}
        onConfirm={handleDelete}
      />

      <CreateFolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        onSave={(name, color) => { createFolder(name, color); setFolderDialogOpen(false); }}
      />
    </div>
  );
}

// Filter chip sub-component
function FilterChip({ active, onClick, count, children, icon, color }: {
  active: boolean; onClick: () => void; count: number; children: React.ReactNode; icon?: React.ReactNode; color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted/50 text-muted-foreground hover:bg-muted"
      }`}
    >
      {color && <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />}
      {icon}
      {children}
      <span className={`text-xs ${active ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}>
        {count}
      </span>
    </button>
  );
}
