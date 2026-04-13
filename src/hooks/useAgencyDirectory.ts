import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DirectoryAgency {
  id: number;
  country: string;
  country_code: string;
  city: string;
  name: string;
  website: string;
  phone: string;
  email: string;
  description: string;
  status: "active" | "invited" | "partner" | "inactive";
  affiliate_id: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export function useAgencyDirectory(filters?: {
  country?: string;
  search?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["agency-directory", filters],
    queryFn: async () => {
      let query = (supabase.from as any)("agency_directory")
        .select("*")
        .order("country", { ascending: true })
        .order("city", { ascending: true })
        .order("name", { ascending: true });

      if (filters?.country && filters.country !== "all") {
        query = query.eq("country", filters.country);
      }
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.search?.trim()) {
        query = query.or(
          `name.ilike.%${filters.search}%,city.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as DirectoryAgency[];
    },
  });
}

export function useAgencyDirectoryCountries() {
  return useQuery({
    queryKey: ["agency-directory-countries"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("agency_directory")
        .select("country, country_code")
        .order("country");
      if (error) throw error;
      const unique = new Map<string, string>();
      for (const row of data || []) {
        unique.set(row.country, row.country_code);
      }
      return Array.from(unique.entries()).map(([country, code]) => ({
        country,
        country_code: code,
      }));
    },
    staleTime: 60_000,
  });
}

export function useCreateDirectoryAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (agency: {
      name: string;
      city: string;
      country: string;
      country_code: string;
      website?: string;
      phone?: string;
      email?: string;
      description?: string;
    }) => {
      const { error } = await (supabase.from as any)("agency_directory").insert({
        name: agency.name,
        city: agency.city,
        country: agency.country,
        country_code: agency.country_code,
        website: agency.website || "",
        phone: agency.phone || "",
        email: agency.email || "",
        description: agency.description || "",
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agentur hinzugefügt");
      qc.invalidateQueries({ queryKey: ["agency-directory"] });
      qc.invalidateQueries({ queryKey: ["agency-directory-countries"] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

export function useUpdateDirectoryAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<DirectoryAgency> & { id: number }) => {
      const { error } = await (supabase.from as any)("agency_directory")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agentur aktualisiert");
      qc.invalidateQueries({ queryKey: ["agency-directory"] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

export function useDeleteDirectoryAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await (supabase.from as any)("agency_directory")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agentur gelöscht");
      qc.invalidateQueries({ queryKey: ["agency-directory"] });
      qc.invalidateQueries({ queryKey: ["agency-directory-countries"] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

export function useInviteDirectoryAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await (supabase.from as any)("agency_directory")
        .update({ status: "invited" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Einladung gesendet");
      qc.invalidateQueries({ queryKey: ["agency-directory"] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}
