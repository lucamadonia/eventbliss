import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EventVendor {
  id: string;
  event_id: string;
  vendor_id: string;
  service_description: string | null;
  agreed_price: number | null;
  deposit_amount: number | null;
  deposit_paid: boolean;
  contract_status: string | null;
  contract_url: string | null;
  notes: string | null;
  created_at: string;
  vendors: {
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    type: string | null;
    rating: number | null;
  } | null;
}

export function useEventVendors(eventId: string | undefined) {
  const [eventVendors, setEventVendors] = useState<EventVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEventVendors = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase.from as any)("event_vendors")
        .select("*, vendors(name, company, email, phone, type, rating)")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEventVendors(data || []);
    } catch (err) {
      console.error("Error fetching event vendors:", err);
      toast.error("Failed to load event vendors");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) fetchEventVendors();
  }, [eventId, fetchEventVendors]);

  const assignVendor = useCallback(
    async (data: {
      vendor_id: string;
      service_description?: string;
      agreed_price?: number;
      deposit_amount?: number;
    }) => {
      if (!eventId) return;
      try {
        const { error } = await (supabase.from as any)("event_vendors").insert({
          event_id: eventId,
          vendor_id: data.vendor_id,
          service_description: data.service_description ?? null,
          agreed_price: data.agreed_price ?? null,
          deposit_amount: data.deposit_amount ?? null,
          deposit_paid: false,
          contract_status: "pending",
        });
        if (error) throw error;
        toast.success("Vendor assigned to event");
        await fetchEventVendors();
      } catch (err) {
        console.error("Error assigning vendor:", err);
        toast.error("Failed to assign vendor");
      }
    },
    [eventId, fetchEventVendors],
  );

  const updateAssignment = useCallback(
    async (id: string, updates: Partial<EventVendor>) => {
      try {
        const { vendors: _vendors, ...cleanUpdates } = updates as any;
        const { error } = await (supabase.from as any)("event_vendors")
          .update(cleanUpdates)
          .eq("id", id);
        if (error) throw error;
        toast.success("Vendor assignment updated");
        await fetchEventVendors();
      } catch (err) {
        console.error("Error updating vendor assignment:", err);
        toast.error("Failed to update vendor assignment");
      }
    },
    [fetchEventVendors],
  );

  const removeVendor = useCallback(
    async (id: string) => {
      try {
        const { error } = await (supabase.from as any)("event_vendors")
          .delete()
          .eq("id", id);
        if (error) throw error;
        toast.success("Vendor removed from event");
        await fetchEventVendors();
      } catch (err) {
        console.error("Error removing vendor:", err);
        toast.error("Failed to remove vendor");
      }
    },
    [fetchEventVendors],
  );

  return {
    eventVendors,
    isLoading,
    assignVendor,
    updateAssignment,
    removeVendor,
    refetch: fetchEventVendors,
  };
}
