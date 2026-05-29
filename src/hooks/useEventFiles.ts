import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import { stripExif, sanitizeFileName } from "@/lib/exif-strip";

export interface EventFile {
  id: string;
  event_id: string;
  file_name: string;
  /** Storage path inside the private `event-files` bucket. Frontend renders via signed URLs. */
  file_url: string;
  file_size: number;
  file_type: string;
  category: string;
  uploaded_by: string;
  created_at: string;
  event_name?: string;
}

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
]);
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

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

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" ist größer als 25 MB.`);
        return;
      }
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        toast.error(`Dateityp "${file.type || "unbekannt"}" wird nicht akzeptiert.`);
        return;
      }

      // Strip EXIF (incl. GPS) from images before upload — GDPR Art. 32 hardening.
      const safeFile = await stripExif(file, { maxDimension: 3200 });
      const cleanName = sanitizeFileName(safeFile.name);
      const filePath = `${eventId}/${Date.now()}_${cleanName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from("event-files")
          .upload(filePath, safeFile, {
            contentType: safeFile.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { error: insertError } = await (supabase.from as any)(
          "event_files",
        ).insert({
          event_id: eventId,
          file_name: cleanName,
          // Store the relative storage path, not a URL. Rendering uses createSignedUrl().
          file_url: filePath,
          file_size: safeFile.size,
          file_type: safeFile.type,
          category,
          uploaded_by: user.id,
        });

        if (insertError) throw insertError;
        toast.success(`"${cleanName}" hochgeladen`);
        await fetchFiles();
      } catch (err) {
        console.error("Error uploading file:", err);
        toast.error(`Fehler beim Hochladen von "${file.name}"`);
      }
    },
    [user, fetchFiles],
  );

  /**
   * Mints a time-limited signed URL for a stored file path. Use this in
   * UI components instead of constructing public URLs.
   */
  const getSignedUrl = useCallback(async (filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from("event-files")
        .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);
      if (error) throw error;
      return data?.signedUrl ?? null;
    } catch (err) {
      console.error("Error creating signed URL:", err);
      return null;
    }
  }, []);

  const deleteFile = useCallback(
    async (fileId: string) => {
      try {
        const target = files.find((f) => f.id === fileId);
        if (!target) return;

        // `file_url` is now a storage path; older rows may still hold a public URL.
        let storagePath = target.file_url;
        if (storagePath.startsWith("http")) {
          try {
            const url = new URL(storagePath);
            const pathMatch = url.pathname.match(/event-files\/(.+)$/);
            if (pathMatch) storagePath = decodeURIComponent(pathMatch[1]);
          } catch {
            // ignore — try as-is
          }
        }

        await supabase.storage.from("event-files").remove([storagePath]);

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
    getSignedUrl,
  };
}
