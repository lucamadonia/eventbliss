import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EventTask {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assignee_name: string | null;
  due_date: string | null;
  category: string | null;
  sort_order: number;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
}

interface GroupedTasks {
  todo: EventTask[];
  in_progress: EventTask[];
  done: EventTask[];
}

export function useEventTasks(eventId: string | undefined) {
  const [tasks, setTasks] = useState<EventTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase.from as any)("event_tasks")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order");

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) fetchTasks();
  }, [eventId, fetchTasks]);

  const grouped = useMemo<GroupedTasks>(() => {
    return {
      todo: tasks.filter((t) => t.status === "todo"),
      in_progress: tasks.filter((t) => t.status === "in_progress"),
      done: tasks.filter((t) => t.status === "done"),
    };
  }, [tasks]);

  const createTask = useCallback(
    async (data: {
      title: string;
      description?: string;
      status?: EventTask["status"];
      priority?: EventTask["priority"];
      assignee_name?: string;
      due_date?: string;
      category?: string;
    }) => {
      if (!eventId) return;
      try {
        const { error } = await (supabase.from as any)("event_tasks").insert({
          event_id: eventId,
          title: data.title,
          description: data.description ?? null,
          status: data.status ?? "todo",
          priority: data.priority ?? "medium",
          assignee_name: data.assignee_name ?? null,
          due_date: data.due_date ?? null,
          category: data.category ?? null,
          sort_order: tasks.length,
        });
        if (error) throw error;
        toast.success("Task created");
        await fetchTasks();
      } catch (err) {
        console.error("Error creating task:", err);
        toast.error("Failed to create task");
      }
    },
    [eventId, tasks.length, fetchTasks],
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<EventTask>) => {
      try {
        const { error } = await (supabase.from as any)("event_tasks")
          .update(updates)
          .eq("id", id);
        if (error) throw error;
        toast.success("Task updated");
        await fetchTasks();
      } catch (err) {
        console.error("Error updating task:", err);
        toast.error("Failed to update task");
      }
    },
    [fetchTasks],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      try {
        const { error } = await (supabase.from as any)("event_tasks")
          .delete()
          .eq("id", id);
        if (error) throw error;
        toast.success("Task deleted");
        await fetchTasks();
      } catch (err) {
        console.error("Error deleting task:", err);
        toast.error("Failed to delete task");
      }
    },
    [fetchTasks],
  );

  const moveTask = useCallback(
    async (id: string, newStatus: EventTask["status"]) => {
      try {
        const updates: Partial<EventTask> = { status: newStatus };
        if (newStatus === "done") {
          updates.completed_at = new Date().toISOString();
        } else {
          updates.completed_at = null;
        }
        const { error } = await (supabase.from as any)("event_tasks")
          .update(updates)
          .eq("id", id);
        if (error) throw error;
        toast.success(`Task moved to ${newStatus.replace("_", " ")}`);
        await fetchTasks();
      } catch (err) {
        console.error("Error moving task:", err);
        toast.error("Failed to move task");
      }
    },
    [fetchTasks],
  );

  return {
    tasks: grouped,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    refetch: fetchTasks,
  };
}
