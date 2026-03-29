import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface EventFolder {
  id: string;
  name: string;
  color: string | null;
  sort_order: number;
  created_at: string;
}

export interface FolderAssignment {
  event_id: string;
  folder_id: string;
}

export function useEventFolders(userId: string | undefined) {
  const { t } = useTranslation();
  const [folders, setFolders] = useState<EventFolder[]>([]);
  const [assignments, setAssignments] = useState<FolderAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFolders = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { data: folderData } = await supabase
        .from("event_folders" as any)
        .select("*")
        .eq("user_id", userId)
        .order("sort_order");

      const { data: assignmentData } = await supabase
        .from("event_folder_assignments" as any)
        .select("event_id, folder_id")
        .eq("user_id", userId);

      setFolders((folderData as any[]) || []);
      setAssignments((assignmentData as any[]) || []);
    } catch (err) {
      console.error("Error fetching folders:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const createFolder = useCallback(async (name: string, color?: string) => {
    if (!userId) return;
    const { error } = await supabase
      .from("event_folders" as any)
      .insert({ name, color: color || null, user_id: userId } as any);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("myEvents.folderCreated"));
    await fetchFolders();
  }, [userId, fetchFolders, t]);

  const deleteFolder = useCallback(async (folderId: string) => {
    const { error } = await supabase
      .from("event_folders" as any)
      .delete()
      .eq("id", folderId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("myEvents.folderDeleted"));
    await fetchFolders();
  }, [fetchFolders, t]);

  const assignToFolder = useCallback(async (eventId: string, folderId: string) => {
    if (!userId) return;
    // Remove existing assignment first
    await supabase
      .from("event_folder_assignments" as any)
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);
    // Insert new assignment
    const { error } = await supabase
      .from("event_folder_assignments" as any)
      .insert({ event_id: eventId, folder_id: folderId, user_id: userId } as any);
    if (error) {
      toast.error(error.message);
      return;
    }
    await fetchFolders();
  }, [userId, fetchFolders]);

  const removeFromFolder = useCallback(async (eventId: string) => {
    if (!userId) return;
    await supabase
      .from("event_folder_assignments" as any)
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);
    await fetchFolders();
  }, [userId, fetchFolders]);

  const getFolderForEvent = useCallback((eventId: string): string | null => {
    const assignment = assignments.find(a => a.event_id === eventId);
    return assignment?.folder_id || null;
  }, [assignments]);

  return {
    folders,
    assignments,
    isLoading,
    fetchFolders,
    createFolder,
    deleteFolder,
    assignToFolder,
    removeFromFolder,
    getFolderForEvent,
  };
}
