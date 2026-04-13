import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EventOption {
  id: string;
  name: string;
  status: string;
}

interface EventSelectorDropdownProps {
  selectedEventId: string | null;
  onSelect: (eventId: string) => void;
}

export function EventSelectorDropdown({ selectedEventId, onSelect }: EventSelectorDropdownProps) {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("events")
        .select("id, name, status" as any)
        .eq("created_by", user.id)
        .is("deleted_at" as any, null)
        .order("created_at", { ascending: false });

      setEvents((data as any[] || []).map((e: any) => ({
        id: e.id,
        name: e.name || "Untitled Event",
        status: e.status || "planning",
      })));
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const grouped = {
    active: events.filter((e) => e.status === "active"),
    planning: events.filter((e) => e.status === "planning"),
    completed: events.filter((e) => e.status === "completed"),
  };

  return (
    <Select value={selectedEventId || ""} onValueChange={onSelect}>
      <SelectTrigger className="bg-white/5 border-white/10 text-white">
        <SelectValue placeholder={loading ? "Laden..." : "Event auswählen..."} />
      </SelectTrigger>
      <SelectContent>
        {grouped.active.length > 0 && (
          <>
            <SelectItem value="__group_active" disabled className="text-xs text-white/40 font-semibold">Active</SelectItem>
            {grouped.active.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </>
        )}
        {grouped.planning.length > 0 && (
          <>
            <SelectItem value="__group_planning" disabled className="text-xs text-white/40 font-semibold">Planning</SelectItem>
            {grouped.planning.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </>
        )}
        {grouped.completed.length > 0 && (
          <>
            <SelectItem value="__group_completed" disabled className="text-xs text-white/40 font-semibold">Completed</SelectItem>
            {grouped.completed.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </>
        )}
        {events.length === 0 && !loading && (
          <SelectItem value="__empty" disabled className="text-white/40">Keine Events gefunden</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
