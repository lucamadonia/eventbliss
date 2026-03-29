import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

export interface EventTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  event_type: string | null;
  template_data: Record<string, unknown> | null;
  times_used: number;
  created_at: string;
}

export function useEventTemplates() {
  const { user } = useAuthContext();
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase.from as any)("event_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("times_used", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error("Error fetching templates:", err);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchTemplates();
  }, [user, fetchTemplates]);

  const createTemplate = useCallback(
    async (data: {
      name: string;
      description?: string;
      category: string;
      event_type?: string;
      template_data?: Record<string, unknown>;
    }) => {
      if (!user) return;
      try {
        const { error } = await (supabase.from as any)("event_templates").insert({
          user_id: user.id,
          name: data.name,
          description: data.description ?? null,
          category: data.category,
          event_type: data.event_type ?? null,
          template_data: data.template_data ?? null,
          times_used: 0,
        });
        if (error) throw error;
        toast.success("Template created");
        await fetchTemplates();
      } catch (err) {
        console.error("Error creating template:", err);
        toast.error("Failed to create template");
      }
    },
    [user, fetchTemplates],
  );

  const updateTemplate = useCallback(
    async (id: string, updates: Partial<EventTemplate>) => {
      try {
        const { error } = await (supabase.from as any)("event_templates")
          .update(updates)
          .eq("id", id);
        if (error) throw error;
        toast.success("Template updated");
        await fetchTemplates();
      } catch (err) {
        console.error("Error updating template:", err);
        toast.error("Failed to update template");
      }
    },
    [fetchTemplates],
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      try {
        const { error } = await (supabase.from as any)("event_templates")
          .delete()
          .eq("id", id);
        if (error) throw error;
        toast.success("Template deleted");
        await fetchTemplates();
      } catch (err) {
        console.error("Error deleting template:", err);
        toast.error("Failed to delete template");
      }
    },
    [fetchTemplates],
  );

  const useTemplate = useCallback(
    async (id: string): Promise<Record<string, unknown> | null> => {
      try {
        const template = templates.find((t) => t.id === id);
        if (!template) {
          toast.error("Template not found");
          return null;
        }

        // Increment times_used
        const { error } = await (supabase.from as any)("event_templates")
          .update({ times_used: (template.times_used || 0) + 1 })
          .eq("id", id);
        if (error) throw error;

        toast.success(`Using template: ${template.name}`);
        await fetchTemplates();
        return template.template_data;
      } catch (err) {
        console.error("Error using template:", err);
        toast.error("Failed to use template");
        return null;
      }
    },
    [templates, fetchTemplates],
  );

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    useTemplate,
    refetch: fetchTemplates,
  };
}
