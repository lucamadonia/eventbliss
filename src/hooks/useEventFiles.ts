import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

export interface EventFile {
  id: string;
  event_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  category: string;
  uploaded_by: string;
  created_at: string;
  event_name?: string;
}

export function useEventFiles() {
  const { user } = useAuthContext();
  const [files, setFiles] = useState<EventFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFiles = useCallback(
    async (eventId?: string) => {
      if (!user) return;
      setIsLoading(true);
      try {
        let query = (supabase.from as any)("event_files")
          .select("*")
          .order("created_at", { ascending: false });

        if (eventId) {
          query = query.eq("event_id", eventId);
        }

        const { data, error } = await query;
        if (error) throw error;
        setFiles(data || []);
      } catch (err) {
        console.error("Error fetching files:", err);
        toast.error("Dateien konnten nicht geladen werden");
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    if (user) fetchFiles();
  }, [user, fetchFiles]);

  const uploadFile = useCallback(
    async (file: File, eventId: string, category: string) => {
      if (!user) return;

      const filePath = `${eventId}/${Date.now()}_${file.name}`;
      try {
        const { error: uploadError } = await supabase.storage
          .from("event-files")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("event-files").getPublicUrl(filePath);

        const { error: insertError } = await (supabase.from as any)(
          "event_files",
        ).insert({
          event_id: eventId,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          file_type: file.type,
          category,
          uploaded_by: user.id,
        });

        if (insertError) throw insertError;
        toast.success(`"${file.name}" hochgeladen`);
        await fetchFiles();
      } catch (err) {
        console.error("Error uploading file:", err);
        toast.error(`Fehler beim Hochladen von "${file.name}"`);
      }
    },
    [user, fetchFiles],
  );

  const deleteFile = useCallback(
    async (fileId: string) => {
      try {
        const target = files.find((f) => f.id === fileId);
        if (!target) return;

        // Extract storage path from URL
        const url = new URL(target.file_url);
        const pathMatch = url.pathname.match(/event-files\/(.+)$/);
        if (pathMatch) {
          await supabase.storage
            .from("event-files")
            .remove([decodeURIComponent(pathMatch[1])]);
        }

        const { error } = await (supabase.from as any)("event_files")
          .delete()
          .eq("id", fileId);

        if (error) throw error;
        toast.success("Datei gelöscht");
        await fetchFiles();
      } catch (err) {
        console.error("Error deleting file:", err);
        toast.error("Datei konnte nicht gelöscht werden");
      }
    },
    [files, fetchFiles],
  );

  const getStorageUsage = useCallback((): number => {
    return files.reduce((sum, f) => sum + (f.file_size || 0), 0);
  }, [files]);

  return {
    files,
    isLoading,
    uploadFile,
    deleteFile,
    fetchFiles,
    getStorageUsage,
  };
}
