import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  Expense,
  ExpensePayer,
  ExpenseShare,
  ExpensesSummary,
  AddExpenseInput,
  UpdateExpenseInput,
  ReceiptOcrResult,
} from "@/lib/expenses-v2/types";
import { shareIsPaid } from "@/lib/expenses-v2/types";

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------
export const expenseKeys = {
  all: ["expenses-v2"] as const,
  byEvent: (eventId: string) => ["expenses-v2", eventId] as const,
  balances: (eventId: string) => ["expenses-v2", eventId, "balances"] as const,
  simplified: (eventId: string) => ["expenses-v2", eventId, "simplified-debts"] as const,
  activity: (eventId: string) => ["expenses-v2", eventId, "activity"] as const,
  recurring: (eventId: string) => ["expenses-v2", eventId, "recurring"] as const,
  categories: (eventId: string) => ["expenses-v2", eventId, "categories"] as const,
};

// ---------------------------------------------------------------------------
// useExpensesV2 — list + aggregates
// ---------------------------------------------------------------------------
export function useExpensesV2(eventId: string | undefined) {
  return useQuery({
    queryKey: eventId ? expenseKeys.byEvent(eventId) : ["expenses-v2", "none"],
    enabled: !!eventId,
    queryFn: async (): Promise<{ items: Expense[]; summary: ExpensesSummary }> => {
      if (!eventId) return { items: [], summary: emptySummary() };

      // Fetch expenses (non-deleted)
      const { data: expenses, error } = await (supabase.from as any)("expenses")
        .select("*")
        .eq("event_id", eventId)
        .is("deleted_at", null)
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!expenses?.length) return { items: [], summary: emptySummary() };

      const ids = expenses.map((e: any) => e.id);

      // Fetch payers + shares in parallel
      const [{ data: payers }, { data: shares }] = await Promise.all([
        (supabase.from as any)("expense_payers").select("*").in("expense_id", ids),
        (supabase.from as any)("expense_shares").select("*").in("expense_id", ids),
      ]);

      const payersByExpense = new Map<string, ExpensePayer[]>();
      for (const p of (payers as ExpensePayer[]) || []) {
        (payersByExpense.get(p.expense_id) ?? payersByExpense.set(p.expense_id, []).get(p.expense_id)!).push(p);
      }
      const sharesByExpense = new Map<string, ExpenseShare[]>();
      for (const s of (shares as ExpenseShare[]) || []) {
        (sharesByExpense.get(s.expense_id) ?? sharesByExpense.set(s.expense_id, []).get(s.expense_id)!).push(s);
      }

      const items: Expense[] = expenses.map((e: any) => ({
        ...e,
        payers: payersByExpense.get(e.id) ?? [],
        shares: sharesByExpense.get(e.id) ?? [],
      }));

      return { items, summary: buildSummary(items) };
    },
    staleTime: 30_000,
  });
}

function emptySummary(): ExpensesSummary {
  return { totalAmount: 0, settledAmount: 0, openAmount: 0, byCategoryId: {}, byPayerId: {}, count: 0 };
}

function buildSummary(items: Expense[]): ExpensesSummary {
  const s = emptySummary();
  s.count = items.length;
  for (const e of items) {
    s.totalAmount += e.amount;
    if (e.is_settled_cached) s.settledAmount += e.amount;
    else s.openAmount += e.amount;
    const catKey = e.category_id ?? e.category ?? "uncategorized";
    s.byCategoryId[catKey] = (s.byCategoryId[catKey] ?? 0) + e.amount;
    for (const p of e.payers ?? []) {
      s.byPayerId[p.participant_id] = (s.byPayerId[p.participant_id] ?? 0) + p.amount;
    }
  }
  return s;
}

// ---------------------------------------------------------------------------
// useAddExpenseV2 — insert expense + payers + shares + optional receipt upload
// ---------------------------------------------------------------------------
export function useAddExpenseV2() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddExpenseInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      // 1) Optional receipt upload (before expense insert so we can store URL)
      let receiptPath: string | null = null;
      let receiptPublicUrl: string | null = null;
      if (input.receiptFile) {
        const ext = inferExt(input.receiptFile);
        // Placeholder expense id for path; rename after insert is too costly,
        // so we just use a uuid at the event folder root and rewrite later if needed.
        const tmpId = crypto.randomUUID();
        const path = `${input.eventId}/tmp-${tmpId}/${crypto.randomUUID()}.${ext}`;
        const { data, error: upErr } = await supabase.storage
          .from("expense-receipts")
          .upload(path, input.receiptFile, { cacheControl: "31536000", upsert: false });
        if (upErr) throw new Error(`Beleg-Upload fehlgeschlagen: ${upErr.message}`);
        receiptPath = data.path;
        const { data: signed } = await supabase.storage
          .from("expense-receipts")
          .createSignedUrl(data.path, 60 * 60);
        receiptPublicUrl = signed?.signedUrl ?? null;
      }

      // 2) Insert expense
      const { data: expense, error } = await (supabase.from as any)("expenses")
        .insert({
          event_id: input.eventId,
          amount: input.amount,
          currency: input.currency ?? "EUR",
          original_currency: input.originalCurrency ?? null,
          exchange_rate: input.exchangeRate ?? null,
          description: input.description,
          expense_date: input.expenseDate ?? new Date().toISOString().slice(0, 10),
          category_id: input.categoryId ?? null,
          emoji: input.emoji ?? null,
          notes: input.notes ?? null,
          tags: input.tags ?? [],
          split_type: input.splitType ?? "equal",
          created_via: input.createdVia ?? "manual",
          created_by_user_id: user.id,
          receipt_url: receiptPublicUrl,
          // paid_by_participant_id kept for legacy compat, best-effort first payer
          paid_by_participant_id: input.payers[0]?.participant_id ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      const expenseId = (expense as Expense).id;

      // 3) Insert payers
      if (input.payers.length > 0) {
        const { error: payersErr } = await (supabase.from as any)("expense_payers").insert(
          input.payers.map((p) => ({
            expense_id: expenseId,
            participant_id: p.participant_id,
            amount: p.amount,
          })),
        );
        if (payersErr) throw payersErr;
      }

      // 4) Insert shares
      if (input.shares.length > 0) {
        const { error: sharesErr } = await (supabase.from as any)("expense_shares").insert(
          input.shares.map((s) => ({
            expense_id: expenseId,
            participant_id: s.participant_id,
            amount: s.amount,
            paid_amount: 0,
          })),
        );
        if (sharesErr) throw sharesErr;
      }

      // 5) Optional OCR dispatch (fire-and-forget, doesn't block the booking UX)
      if (receiptPath && input.dispatchOcr !== false) {
        void supabase.functions.invoke("ocr-receipt", {
          body: { expense_id: expenseId, storage_path: receiptPath },
        }).catch(() => null);
      }

      return expense as Expense;
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: expenseKeys.byEvent(input.eventId) });
      qc.invalidateQueries({ queryKey: expenseKeys.balances(input.eventId) });
      qc.invalidateQueries({ queryKey: expenseKeys.simplified(input.eventId) });
      qc.invalidateQueries({ queryKey: expenseKeys.activity(input.eventId) });
      toast.success("Ausgabe hinzugefügt");
    },
    onError: (e: Error) => {
      if (e.message?.includes("EXPENSE_LIMIT_FREE_TIER")) {
        toast.error("Gratis-Limit erreicht — upgrade auf Pro für unbegrenzte Ausgaben.");
      } else {
        toast.error(`Fehler: ${e.message}`);
      }
    },
  });
}

function inferExt(f: File | Blob): string {
  if ("name" in f && typeof f.name === "string") {
    const dot = f.name.lastIndexOf(".");
    if (dot > -1) return f.name.slice(dot + 1).toLowerCase();
  }
  if (f.type?.includes("jpeg")) return "jpg";
  if (f.type?.includes("png")) return "png";
  if (f.type?.includes("heic")) return "heic";
  if (f.type?.includes("pdf")) return "pdf";
  return "bin";
}

// ---------------------------------------------------------------------------
// useUpdateExpenseV2 — partial patch on expenses + optional payers/shares replace
// ---------------------------------------------------------------------------
export function useUpdateExpenseV2(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateExpenseInput) => {
      if (Object.keys(input.patch).length > 0) {
        const { error } = await (supabase.from as any)("expenses").update(input.patch).eq("id", input.id);
        if (error) throw error;
      }
      if (input.payers) {
        // Replace payers (delete all + insert new)
        const { error: delErr } = await (supabase.from as any)("expense_payers")
          .delete()
          .eq("expense_id", input.id);
        if (delErr) throw delErr;
        if (input.payers.length > 0) {
          const { error: insErr } = await (supabase.from as any)("expense_payers").insert(
            input.payers.map((p) => ({
              expense_id: input.id,
              participant_id: p.participant_id,
              amount: p.amount,
            })),
          );
          if (insErr) throw insErr;
        }
      }
      if (input.shares) {
        // Replace shares (preserves paid_amount=0 for new shares; existing ones lose their paid state — warn caller)
        const { error: delErr } = await (supabase.from as any)("expense_shares")
          .delete()
          .eq("expense_id", input.id);
        if (delErr) throw delErr;
        if (input.shares.length > 0) {
          const { error: insErr } = await (supabase.from as any)("expense_shares").insert(
            input.shares.map((s) => ({
              expense_id: input.id,
              participant_id: s.participant_id,
              amount: s.amount,
              paid_amount: 0,
            })),
          );
          if (insErr) throw insErr;
        }
      }
      return { id: input.id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.byEvent(eventId) });
      qc.invalidateQueries({ queryKey: expenseKeys.balances(eventId) });
      qc.invalidateQueries({ queryKey: expenseKeys.simplified(eventId) });
      toast.success("Ausgabe aktualisiert");
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

// ---------------------------------------------------------------------------
// useDeleteExpenseV2 — soft delete
// ---------------------------------------------------------------------------
export function useDeleteExpenseV2(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase.from as any)("expenses")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id ?? null,
          deletion_reason: reason ?? null,
        })
        .eq("id", id);
      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.byEvent(eventId) });
      qc.invalidateQueries({ queryKey: expenseKeys.balances(eventId) });
      qc.invalidateQueries({ queryKey: expenseKeys.simplified(eventId) });
      toast.success("Ausgabe gelöscht");
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

// ---------------------------------------------------------------------------
// useRestoreExpenseV2 — undo a soft delete (clears deleted_at)
// ---------------------------------------------------------------------------
export function useRestoreExpenseV2(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await (supabase.from as any)("expenses")
        .update({ deleted_at: null, deleted_by: null, deletion_reason: null })
        .eq("id", id);
      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.byEvent(eventId) });
      qc.invalidateQueries({ queryKey: expenseKeys.balances(eventId) });
      qc.invalidateQueries({ queryKey: expenseKeys.simplified(eventId) });
      toast.success("Ausgabe wiederhergestellt");
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

export { shareIsPaid };
export type { ReceiptOcrResult };
