import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EventNote {
  id: string;
  event_id: string;
  content: string;
  author_name: string;
  is_pinned: boolean;
  created_at: string;
}

export function useEventNotes(eventId: string | undefined) {
  const [notes, setNotes] = useState<EventNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase.from as any)("event_notes")
        .select("*")
        .eq("event_id", eventId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error("Error fetching notes:", err);
      toast.error("Failed to load notes");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) fetchNotes();
  }, [eventId, fetchNotes]);

  const createNote = useCallback(
    async (content: string, authorName: string) => {
      if (!eventId) return;
      try {
        const { error } = await (supabase.from as any)("event_notes").insert({
          event_id: eventId,
          content,
          author_name: authorName,
          is_pinned: false,
        });
        if (error) throw error;
        toast.success("Note created");
        await fetchNotes();
      } catch (err) {
        console.error("Error creating note:", err);
        toast.error("Failed to create note");
      }
    },
    [eventId, fetchNotes],
  );

  const updateNote = useCallback(
    async (id: string, content: string) => {
      try {
        const { error } = await (supabase.from as any)("event_notes")
          .update({ content })
          .eq("id", id);
        if (error) throw error;
        toast.success("Note updated");
        await fetchNotes();
      } catch (err) {
        console.error("Error updating note:", err);
        toast.error("Failed to update note");
      }
    },
    [fetchNotes],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      try {
        const { error } = await (supabase.from as any)("event_notes")
          .delete()
          .eq("id", id);
        if (error) throw error;
        toast.success("Note deleted");
        await fetchNotes();
      } catch (err) {
        console.error("Error deleting note:", err);
        toast.error("Failed to delete note");
      }
    },
    [fetchNotes],
  );

  const togglePin = useCallback(
    async (id: string) => {
      try {
        const note = notes.find((n) => n.id === id);
        if (!note) return;
        const { error } = await (supabase.from as any)("event_notes")
          .update({ is_pinned: !note.is_pinned })
          .eq("id", id);
        if (error) throw error;
        toast.success(note.is_pinned ? "Note unpinned" : "Note pinned");
        await fetchNotes();
      } catch (err) {
        console.error("Error toggling pin:", err);
        toast.error("Failed to toggle pin");
      }
    },
    [notes, fetchNotes],
  );

  return {
    notes,
    isLoading,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    refetch: fetchNotes,
  };
}
