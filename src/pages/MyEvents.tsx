import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, Users, ArrowRight, Plus, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";

interface EventWithParticipants {
  id: string;
  name: string;
  slug: string;
  event_type: string;
  event_date: string | null;
  status: string;
  honoree_name: string;
  created_at: string;
  participant_count: number;
  is_organizer: boolean;
}

export default function MyEvents() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuthContext();
  const [events, setEvents] = useState<EventWithParticipants[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const dateLocale = i18n.language === "de" ? de : enUS;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;

      try {
        // Get events where user is creator or participant
        const { data: participantEvents, error: participantError } = await supabase
          .from("participants")
          .select(`
            event_id,
            role,
            events (
              id,
              name,
              slug,
              event_type,
              event_date,
              status,
              honoree_name,
              created_at
            )
          `)
          .eq("user_id", user.id);

        if (participantError) throw participantError;

        // Get events created by user (in case they're not a participant)
        const { data: createdEvents, error: createdError } = await supabase
          .from("events")
          .select("id, name, slug, event_type, event_date, status, honoree_name, created_at")
          .eq("created_by", user.id);

        if (createdError) throw createdError;

        // Merge and deduplicate events
        const eventMap = new Map<string, EventWithParticipants>();

        // Add participant events
        participantEvents?.forEach((p) => {
          const event = p.events as any;
          if (event) {
            eventMap.set(event.id, {
              ...event,
              participant_count: 0,
              is_organizer: p.role === "organizer",
            });
          }
        });

        // Add created events (mark as organizer)
        createdEvents?.forEach((event) => {
          if (!eventMap.has(event.id)) {
            eventMap.set(event.id, {
              ...event,
              participant_count: 0,
              is_organizer: true,
            });
          } else {
            // Mark as organizer if they created it
            const existing = eventMap.get(event.id)!;
            existing.is_organizer = true;
          }
        });

        // Get participant counts for all events
        const eventIds = Array.from(eventMap.keys());
        if (eventIds.length > 0) {
          const { data: counts } = await supabase
            .from("participants")
            .select("event_id")
            .in("event_id", eventIds);

          const countMap = new Map<string, number>();
          counts?.forEach((c) => {
            countMap.set(c.event_id, (countMap.get(c.event_id) || 0) + 1);
          });

          eventMap.forEach((event, id) => {
            event.participant_count = countMap.get(id) || 0;
          });
        }

        // Sort by created_at descending
        const sortedEvents = Array.from(eventMap.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setEvents(sortedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchEvents();
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "planning":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "completed":
        return "bg-muted text-muted-foreground";
      case "cancelled":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "bachelor":
      case "bachelorette":
        return "🎉";
      case "birthday":
        return "🎂";
      case "trip":
        return "✈️";
      default:
        return "📅";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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

      <main className="container py-8">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="rounded-full bg-muted p-6 mb-4">
              <Calendar className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t("profile.noEvents")}</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              {t("profile.noEventsDescription")}
            </p>
            <Button onClick={() => navigate("/create")}>
              <Plus className="h-4 w-4 mr-2" />
              {t("profile.createFirstEvent")}
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group hover:shadow-md transition-all cursor-pointer h-full" onClick={() => navigate(`/e/${event.slug}/dashboard`)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getEventTypeIcon(event.event_type)}</span>
                        <div>
                          <CardTitle className="text-lg line-clamp-1">{event.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {t("createEvent.step4.forHonoree", { name: event.honoree_name })}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className={getStatusColor(event.status)}>
                        {t(`dashboard.overview.status.${event.status}`)}
                      </Badge>
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
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
