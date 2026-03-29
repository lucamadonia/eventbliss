import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RunSheetItem {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  status: "pending" | "active" | "completed" | "skipped";
  responsible_name: string | null;
  responsible_role: string | null;
  stage: string | null;
  cue_notes: string | null;
  delay_minutes: number;
  sort_order: number;
  created_at: string;
}

export function useRunSheet(eventId: string | undefined) {
  const [items, setItems] = useState<RunSheetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase.from as any)("run_sheet_items")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order");

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error("Error fetching run sheet:", err);
      toast.error("Failed to load run sheet");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) fetchItems();
  }, [eventId, fetchItems]);

  const createItem = useCallback(
    async (data: Partial<RunSheetItem> & { title: string }) => {
      if (!eventId) return;
      try {
        const { error } = await (supabase.from as any)("run_sheet_items").insert({
          event_id: eventId,
          title: data.title,
          description: data.description ?? null,
          start_time: data.start_time ?? null,
          end_time: data.end_time ?? null,
          duration_minutes: data.duration_minutes ?? null,
          status: "pending",
          responsible_name: data.responsible_name ?? null,
          responsible_role: data.responsible_role ?? null,
          stage: data.stage ?? null,
          cue_notes: data.cue_notes ?? null,
          delay_minutes: 0,
          sort_order: items.length,
        });
        if (error) throw error;
        toast.success("Run sheet item created");
        await fetchItems();
      } catch (err) {
        console.error("Error creating run sheet item:", err);
        toast.error("Failed to create run sheet item");
      }
    },
    [eventId, items.length, fetchItems],
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<RunSheetItem>) => {
      try {
        const { error } = await (supabase.from as any)("run_sheet_items")
          .update(updates)
          .eq("id", id);
        if (error) throw error;
        toast.success("Run sheet item updated");
        await fetchItems();
      } catch (err) {
        console.error("Error updating run sheet item:", err);
        toast.error("Failed to update run sheet item");
      }
    },
    [fetchItems],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      try {
        const { error } = await (supabase.from as any)("run_sheet_items")
          .delete()
          .eq("id", id);
        if (error) throw error;
        toast.success("Run sheet item deleted");
        await fetchItems();
      } catch (err) {
        console.error("Error deleting run sheet item:", err);
        toast.error("Failed to delete run sheet item");
      }
    },
    [fetchItems],
  );

  const markActive = useCallback(
    async (id: string) => {
      try {
        const targetIndex = items.findIndex((item) => item.id === id);
        if (targetIndex === -1) return;

        // Mark all previous items as completed
        const previousIds = items
          .slice(0, targetIndex)
          .filter((item) => item.status !== "completed" && item.status !== "skipped")
          .map((item) => item.id);

        if (previousIds.length > 0) {
          const { error: prevError } = await (supabase.from as any)("run_sheet_items")
            .update({ status: "completed" })
            .in("id", previousIds);
          if (prevError) throw prevError;
        }

        const { error } = await (supabase.from as any)("run_sheet_items")
          .update({ status: "active" })
          .eq("id", id);
        if (error) throw error;

        toast.success("Item marked as active");
        await fetchItems();
      } catch (err) {
        console.error("Error marking item active:", err);
        toast.error("Failed to mark item as active");
      }
    },
    [items, fetchItems],
  );

  const markComplete = useCallback(
    async (id: string) => {
      try {
        const { error } = await (supabase.from as any)("run_sheet_items")
          .update({ status: "completed" })
          .eq("id", id);
        if (error) throw error;
        toast.success("Item completed");
        await fetchItems();
      } catch (err) {
        console.error("Error completing item:", err);
        toast.error("Failed to complete item");
      }
    },
    [fetchItems],
  );

  const skipItem = useCallback(
    async (id: string) => {
      try {
        const { error } = await (supabase.from as any)("run_sheet_items")
          .update({ status: "skipped" })
          .eq("id", id);
        if (error) throw error;
        toast.success("Item skipped");
        await fetchItems();
      } catch (err) {
        console.error("Error skipping item:", err);
        toast.error("Failed to skip item");
      }
    },
    [fetchItems],
  );

  const addDelay = useCallback(
    async (id: string, minutes: number) => {
      try {
        const targetIndex = items.findIndex((item) => item.id === id);
        if (targetIndex === -1) return;

        // Cascade delay to this item and all subsequent items
        const affectedItems = items.slice(targetIndex);
        const updates = affectedItems.map((item) =>
          (supabase.from as any)("run_sheet_items")
            .update({ delay_minutes: (item.delay_minutes || 0) + minutes })
            .eq("id", item.id),
        );

        const results = await Promise.all(updates);
        const hasError = results.some((r: any) => r.error);
        if (hasError) throw new Error("Failed to cascade delay");

        toast.success(`Added ${minutes} minute delay`);
        await fetchItems();
      } catch (err) {
        console.error("Error adding delay:", err);
        toast.error("Failed to add delay");
      }
    },
    [items, fetchItems],
  );

  return {
    items,
    isLoading,
    createItem,
    updateItem,
    deleteItem,
    markActive,
    markComplete,
    skipItem,
    addDelay,
    refetch: fetchItems,
  };
}
