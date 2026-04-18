import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { expenseKeys } from "./useExpensesV2";
import type {
  ExpenseRecurringTemplate,
  ExpenseActivityEntry,
  ExpenseCategory,
  NewRecurringInput,
  ReceiptOcrResult,
} from "@/lib/expenses-v2/types";

// ---------------------------------------------------------------------------
// Categories (per-event custom + system-wide defaults)
// ---------------------------------------------------------------------------
export function useExpenseCategories(eventId: string | undefined) {
  return useQuery({
    queryKey: eventId ? expenseKeys.categories(eventId) : ["expenses-v2", "none", "categories"],
    enabled: !!eventId,
    queryFn: async (): Promise<ExpenseCategory[]> => {
      if (!eventId) return [];
      // Load both system-wide (event_id IS NULL) and event-specific rows
      const { data, error } = await (supabase.from as any)("expense_categories")
        .select("*")
        .or(`event_id.is.null,event_id.eq.${eventId}`)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as ExpenseCategory[]) ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

// ---------------------------------------------------------------------------
// Recurring templates
// ---------------------------------------------------------------------------
export function useRecurringTemplates(eventId: string | undefined) {
  return useQuery({
    queryKey: eventId ? expenseKeys.recurring(eventId) : ["expenses-v2", "none", "recurring"],
    enabled: !!eventId,
    queryFn: async (): Promise<ExpenseRecurringTemplate[]> => {
      if (!eventId) return [];
      const { data, error } = await (supabase.from as any)("expense_recurring_templates")
        .select("*")
        .eq("event_id", eventId)
        .order("next_run_date", { ascending: true });
      if (error) throw error;
      return (data as ExpenseRecurringTemplate[]) ?? [];
    },
    staleTime: 60_000,
  });
}

export function useCreateRecurringTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewRecurringInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await (supabase.from as any)("expense_recurring_templates")
        .insert({
          event_id: input.eventId,
          title: input.title,
          amount: input.amount,
          currency: input.currency ?? "EUR",
          category_id: input.categoryId ?? null,
          emoji: input.emoji ?? null,
          split_config: input.splitConfig,
          payer_config: input.payerConfig,
          frequency: input.frequency,
          next_run_date: input.nextRunDate,
          created_by_user_id: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ExpenseRecurringTemplate;
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: expenseKeys.recurring(input.eventId) });
      toast.success("Wiederkehrende Ausgabe angelegt");
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

export function useToggleRecurringTemplate(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await (supabase.from as any)("expense_recurring_templates")
        .update({ is_active: active })
        .eq("id", id);
      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.recurring(eventId) });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

// ---------------------------------------------------------------------------
// Activity feed (infinite, newest first)
// ---------------------------------------------------------------------------
export function useExpenseActivity(eventId: string | undefined, pageSize = 25) {
  return useInfiniteQuery({
    queryKey: eventId ? expenseKeys.activity(eventId) : ["expenses-v2", "none", "activity"],
    enabled: !!eventId,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }): Promise<ExpenseActivityEntry[]> => {
      if (!eventId) return [];
      let query = (supabase.from as any)("expense_activity_log")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
        .limit(pageSize);
      if (pageParam) query = query.lt("created_at", pageParam);
      const { data, error } = await query;
      if (error) throw error;
      return (data as ExpenseActivityEntry[]) ?? [];
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage?.length || lastPage.length < pageSize) return undefined;
      return lastPage[lastPage.length - 1].created_at;
    },
    staleTime: 10_000,
  });
}

// ---------------------------------------------------------------------------
// Receipt upload + OCR dispatch
// ---------------------------------------------------------------------------
export function useReceiptUpload() {
  return useMutation({
    mutationFn: async ({
      eventId,
      expenseId,
      file,
      dispatchOcr = true,
    }: {
      eventId: string;
      expenseId?: string;
      file: File | Blob;
      dispatchOcr?: boolean;
    }): Promise<{ storagePath: string; signedUrl: string | null; ocr: ReceiptOcrResult | null }> => {
      const ext = "name" in file && typeof file.name === "string"
        ? file.name.split(".").pop()?.toLowerCase() ?? "jpg"
        : "jpg";
      const uid = crypto.randomUUID();
      const folder = expenseId ?? `tmp-${uid}`;
      const path = `${eventId}/${folder}/${uid}.${ext}`;

      const { data, error } = await supabase.storage
        .from("expense-receipts")
        .upload(path, file, { cacheControl: "31536000", upsert: false });
      if (error) throw error;

      const { data: signed } = await supabase.storage
        .from("expense-receipts")
        .createSignedUrl(data.path, 60 * 60);

      let ocr: ReceiptOcrResult | null = null;
      if (dispatchOcr) {
        try {
          const res = await supabase.functions.invoke("ocr-receipt", {
            body: { expense_id: expenseId, storage_path: data.path },
          });
          if (!res.error && res.data) {
            ocr = (res.data as { ocr?: ReceiptOcrResult })?.ocr ?? null;
          }
        } catch {
          // OCR is best-effort; don't block the upload
        }
      }

      return { storagePath: data.path, signedUrl: signed?.signedUrl ?? null, ocr };
    },
    onError: (e: Error) => toast.error(`Beleg-Upload: ${e.message}`),
  });
}
