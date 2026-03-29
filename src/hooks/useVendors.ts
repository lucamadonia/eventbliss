import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

export interface Vendor {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  type: string | null;
  specialization: string | null;
  tags: string[] | null;
  rating: number | null;
  rating_quality: number | null;
  rating_punctuality: number | null;
  rating_price: number | null;
  rating_communication: number | null;
  rating_flexibility: number | null;
  notes: string | null;
  city: string | null;
  country: string | null;
  is_active: boolean;
  created_at: string;
}

export interface VendorRatings {
  quality: number;
  punctuality: number;
  price: number;
  communication: number;
  flexibility: number;
}

export function useVendors() {
  const { user } = useAuthContext();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchVendors = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase.from as any)("vendors")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setVendors(data || []);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      toast.error("Failed to load vendors");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchVendors();
  }, [user, fetchVendors]);

  const createVendor = useCallback(
    async (data: Partial<Vendor> & { name: string }) => {
      if (!user) return;
      try {
        const { error } = await (supabase.from as any)("vendors").insert({
          user_id: user.id,
          name: data.name,
          company: data.company ?? null,
          email: data.email ?? null,
          phone: data.phone ?? null,
          website: data.website ?? null,
          type: data.type ?? null,
          specialization: data.specialization ?? null,
          tags: data.tags ?? null,
          notes: data.notes ?? null,
          city: data.city ?? null,
          country: data.country ?? null,
          is_active: data.is_active ?? true,
        });
        if (error) throw error;
        toast.success("Vendor created");
        await fetchVendors();
      } catch (err) {
        console.error("Error creating vendor:", err);
        toast.error("Failed to create vendor");
      }
    },
    [user, fetchVendors],
  );

  const updateVendor = useCallback(
    async (id: string, updates: Partial<Vendor>) => {
      try {
        const { error } = await (supabase.from as any)("vendors")
          .update(updates)
          .eq("id", id);
        if (error) throw error;
        toast.success("Vendor updated");
        await fetchVendors();
      } catch (err) {
        console.error("Error updating vendor:", err);
        toast.error("Failed to update vendor");
      }
    },
    [fetchVendors],
  );

  const deleteVendor = useCallback(
    async (id: string) => {
      try {
        const { error } = await (supabase.from as any)("vendors")
          .delete()
          .eq("id", id);
        if (error) throw error;
        toast.success("Vendor deleted");
        await fetchVendors();
      } catch (err) {
        console.error("Error deleting vendor:", err);
        toast.error("Failed to delete vendor");
      }
    },
    [fetchVendors],
  );

  const rateVendor = useCallback(
    async (id: string, ratings: VendorRatings) => {
      try {
        const average =
          (ratings.quality +
            ratings.punctuality +
            ratings.price +
            ratings.communication +
            ratings.flexibility) /
          5;

        const { error } = await (supabase.from as any)("vendors")
          .update({
            rating: Math.round(average * 10) / 10,
            rating_quality: ratings.quality,
            rating_punctuality: ratings.punctuality,
            rating_price: ratings.price,
            rating_communication: ratings.communication,
            rating_flexibility: ratings.flexibility,
          })
          .eq("id", id);
        if (error) throw error;
        toast.success("Vendor rated");
        await fetchVendors();
      } catch (err) {
        console.error("Error rating vendor:", err);
        toast.error("Failed to rate vendor");
      }
    },
    [fetchVendors],
  );

  const searchVendors = useCallback(
    (query: string): Vendor[] => {
      if (!query.trim()) return vendors;
      const lower = query.toLowerCase();
      return vendors.filter(
        (v) =>
          v.name.toLowerCase().includes(lower) ||
          v.company?.toLowerCase().includes(lower) ||
          v.email?.toLowerCase().includes(lower) ||
          v.tags?.some((t) => t.toLowerCase().includes(lower)),
      );
    },
    [vendors],
  );

  return {
    vendors,
    isLoading,
    createVendor,
    updateVendor,
    deleteVendor,
    rateVendor,
    searchVendors,
    refetch: fetchVendors,
  };
}
