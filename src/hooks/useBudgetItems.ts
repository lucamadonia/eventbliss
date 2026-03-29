import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BudgetItem {
  id: string;
  event_id: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  planned_amount: number;
  quoted_amount: number | null;
  actual_amount: number | null;
  currency: string;
  vendor_id: string | null;
  is_approved: boolean;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

interface CategorySummary {
  planned: number;
  quoted: number;
  actual: number;
}

interface BudgetSummary {
  totalPlanned: number;
  totalQuoted: number;
  totalActual: number;
  byCategory: Map<string, CategorySummary>;
}

export function useBudgetItems(eventId: string | undefined) {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase.from as any)("budget_items")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order");

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error("Error fetching budget items:", err);
      toast.error("Failed to load budget items");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) fetchItems();
  }, [eventId, fetchItems]);

  const summary = useMemo<BudgetSummary>(() => {
    let totalPlanned = 0;
    let totalQuoted = 0;
    let totalActual = 0;
    const byCategory = new Map<string, CategorySummary>();

    for (const item of items) {
      const planned = item.planned_amount || 0;
      const quoted = item.quoted_amount || 0;
      const actual = item.actual_amount || 0;

      totalPlanned += planned;
      totalQuoted += quoted;
      totalActual += actual;

      const existing = byCategory.get(item.category) || { planned: 0, quoted: 0, actual: 0 };
      existing.planned += planned;
      existing.quoted += quoted;
      existing.actual += actual;
      byCategory.set(item.category, existing);
    }

    return { totalPlanned, totalQuoted, totalActual, byCategory };
  }, [items]);

  const createItem = useCallback(
    async (data: Partial<BudgetItem> & { category: string; planned_amount: number }) => {
      if (!eventId) return;
      try {
        const { error } = await (supabase.from as any)("budget_items").insert({
          event_id: eventId,
          category: data.category,
          subcategory: data.subcategory ?? null,
          description: data.description ?? null,
          planned_amount: data.planned_amount,
          quoted_amount: data.quoted_amount ?? null,
          actual_amount: data.actual_amount ?? null,
          currency: data.currency ?? "EUR",
          vendor_id: data.vendor_id ?? null,
          is_approved: data.is_approved ?? false,
          notes: data.notes ?? null,
          sort_order: items.length,
        });
        if (error) throw error;
        toast.success("Budget item created");
        await fetchItems();
      } catch (err) {
        console.error("Error creating budget item:", err);
        toast.error("Failed to create budget item");
      }
    },
    [eventId, items.length, fetchItems],
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<BudgetItem>) => {
      try {
        const { error } = await (supabase.from as any)("budget_items")
          .update(updates)
          .eq("id", id);
        if (error) throw error;
        toast.success("Budget item updated");
        await fetchItems();
      } catch (err) {
        console.error("Error updating budget item:", err);
        toast.error("Failed to update budget item");
      }
    },
    [fetchItems],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      try {
        const { error } = await (supabase.from as any)("budget_items")
          .delete()
          .eq("id", id);
        if (error) throw error;
        toast.success("Budget item deleted");
        await fetchItems();
      } catch (err) {
        console.error("Error deleting budget item:", err);
        toast.error("Failed to delete budget item");
      }
    },
    [fetchItems],
  );

  const approveItem = useCallback(
    async (id: string) => {
      try {
        const { error } = await (supabase.from as any)("budget_items")
          .update({ is_approved: true })
          .eq("id", id);
        if (error) throw error;
        toast.success("Budget item approved");
        await fetchItems();
      } catch (err) {
        console.error("Error approving budget item:", err);
        toast.error("Failed to approve budget item");
      }
    },
    [fetchItems],
  );

  return {
    items,
    summary,
    isLoading,
    createItem,
    updateItem,
    deleteItem,
    approveItem,
    refetch: fetchItems,
  };
}
