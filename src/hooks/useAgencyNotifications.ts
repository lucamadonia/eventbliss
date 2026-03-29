import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";

export interface AgencyNotification {
  id: string;
  user_id: string;
  type: "deadline" | "task" | "budget" | "team" | "vendor" | "system";
  title: string;
  description: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export function useAgencyNotifications() {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<AgencyNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications],
  );

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase.from as any)("agency_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user, fetchNotifications]);

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        const { error } = await (supabase.from as any)("agency_notifications")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n,
          ),
        );
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    },
    [],
  );

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    try {
      const { error } = await (supabase.from as any)("agency_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })),
      );
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  }, [user]);

  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        const { error } = await (supabase.from as any)("agency_notifications")
          .delete()
          .eq("id", id);
        if (error) throw error;
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      } catch (err) {
        console.error("Error deleting notification:", err);
      }
    },
    [],
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  };
}
