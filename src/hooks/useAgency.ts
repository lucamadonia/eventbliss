import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Agency {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
  created_at: string;
  owner_id: string;
}

export type AgencyRole = "owner" | "admin" | "member" | "viewer";
export type AgencyMemberStatus = "active" | "invited" | "removed";

export interface AgencyMember {
  id: string;
  agency_id: string;
  user_id: string | null;
  email: string;
  name: string | null;
  role: AgencyRole;
  status: AgencyMemberStatus;
  joined_at: string | null;
  invited_at: string;
  task_count: number;
}

export interface UseAgencyResult {
  agency: Agency | null;
  members: AgencyMember[];
  isLoading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  createAgency: (name: string, slug: string, colors?: { primary_color?: string; accent_color?: string }) => Promise<Agency | null>;
  updateAgency: (updates: Partial<Pick<Agency, "name" | "slug" | "primary_color" | "accent_color" | "logo_url">>) => Promise<void>;
  inviteMember: (email: string, role: AgencyMember["role"]) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: AgencyMember["role"]) => Promise<void>;
  fetchAgency: () => Promise<void>;
}

export function useAgency(): UseAgencyResult {
  const { user } = useAuth();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [members, setMembers] = useState<AgencyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAgency = useCallback(async () => {
    if (!user) {
      setAgency(null);
      setMembers([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Find user's agency membership
      const { data: memberRow, error: memberErr } = await (supabase
        .from("agency_members" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle() as any);

      if (memberErr || !memberRow) {
        // Also check by email for invited members
        const { data: invitedRow } = await (supabase
          .from("agency_members" as any)
          .select("*")
          .eq("email", user.email)
          .eq("status", "invited")
          .maybeSingle() as any);

        if (invitedRow) {
          // Claim the invitation
          await (supabase
            .from("agency_members" as any)
            .update({ user_id: user.id, status: "active", joined_at: new Date().toISOString() } as any)
            .eq("id", invitedRow.id) as any);
          // Re-fetch after claiming
          await fetchAgency();
          return;
        }

        setAgency(null);
        setMembers([]);
        setIsLoading(false);
        return;
      }

      // Fetch the agency
      const { data: agencyRow, error: agencyErr } = await (supabase
        .from("agencies" as any)
        .select("*")
        .eq("id", memberRow.agency_id)
        .single() as any);

      if (agencyErr || !agencyRow) {
        setAgency(null);
        setMembers([]);
        setIsLoading(false);
        return;
      }

      setAgency(agencyRow as Agency);

      // Fetch all members of this agency
      const { data: allMembers } = await (supabase
        .from("agency_members" as any)
        .select("*")
        .eq("agency_id", memberRow.agency_id)
        .neq("status", "removed")
        .order("invited_at", { ascending: true }) as any);

      // Fetch task counts for members with user_ids
      const memberRows = (allMembers || []) as any[];
      const userIds = memberRows.filter((m) => m.user_id).map((m) => m.user_id);
      let taskCounts: Record<string, number> = {};
      if (userIds.length > 0) {
        const { data: tasks } = await (supabase
          .from("event_tasks" as any)
          .select("assignee_id")
          .in("assignee_id", userIds) as any);
        if (tasks) {
          for (const t of tasks as any[]) {
            taskCounts[t.assignee_id] = (taskCounts[t.assignee_id] || 0) + 1;
          }
        }
      }

      const enriched: AgencyMember[] = memberRows.map((m: any) => ({
        ...m,
        name: m.name || null,
        task_count: m.user_id ? (taskCounts[m.user_id] || 0) : 0,
      }));

      setMembers(enriched);
    } catch {
      setAgency(null);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAgency();
  }, [fetchAgency]);

  const isOwner = !!agency && agency.owner_id === user?.id;
  const isAdmin =
    isOwner ||
    members.some((m) => m.user_id === user?.id && (m.role === "admin" || m.role === "owner"));

  const createAgency = useCallback(
    async (name: string, slug: string, colors?: { primary_color?: string; accent_color?: string }): Promise<Agency | null> => {
      if (!user) return null;

      const { data: newAgency, error: createErr } = await (supabase
        .from("agencies" as any)
        .insert({
          name,
          slug,
          owner_id: user.id,
          primary_color: colors?.primary_color || "#8b5cf6",
          accent_color: colors?.accent_color || "#06b6d4",
        } as any)
        .select()
        .single() as any);

      if (createErr || !newAgency) {
        console.error("Failed to create agency:", createErr);
        return null;
      }

      // Insert owner as member
      await (supabase
        .from("agency_members" as any)
        .insert({
          agency_id: newAgency.id,
          user_id: user.id,
          email: user.email || "",
          role: "owner",
          status: "active",
          joined_at: new Date().toISOString(),
          invited_at: new Date().toISOString(),
        } as any) as any);

      await fetchAgency();
      return newAgency as Agency;
    },
    [user, fetchAgency]
  );

  const updateAgency = useCallback(
    async (updates: Partial<Pick<Agency, "name" | "slug" | "primary_color" | "accent_color" | "logo_url">>) => {
      if (!agency) return;
      await (supabase
        .from("agencies" as any)
        .update(updates as any)
        .eq("id", agency.id) as any);
      await fetchAgency();
    },
    [agency, fetchAgency]
  );

  const inviteMember = useCallback(
    async (email: string, role: AgencyMember["role"]) => {
      if (!agency) return;
      await (supabase
        .from("agency_members" as any)
        .insert({
          agency_id: agency.id,
          email,
          role,
          status: "invited",
          invited_at: new Date().toISOString(),
        } as any) as any);
      await fetchAgency();
    },
    [agency, fetchAgency]
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      if (!agency) return;
      await (supabase
        .from("agency_members" as any)
        .update({ status: "removed" } as any)
        .eq("id", memberId) as any);
      await fetchAgency();
    },
    [agency, fetchAgency]
  );

  const updateMemberRole = useCallback(
    async (memberId: string, role: AgencyMember["role"]) => {
      if (!agency) return;
      await (supabase
        .from("agency_members" as any)
        .update({ role } as any)
        .eq("id", memberId) as any);
      await fetchAgency();
    },
    [agency, fetchAgency]
  );

  return {
    agency,
    members,
    isLoading,
    isOwner,
    isAdmin,
    createAgency,
    updateAgency,
    inviteMember,
    removeMember,
    updateMemberRole,
    fetchAgency,
  };
}
