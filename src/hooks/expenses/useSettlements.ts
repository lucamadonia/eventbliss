import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { expenseKeys } from "./useExpensesV2";
import type {
  ExpenseSettlement,
  SettleDebtInput,
  SimplifiedDebt,
  ParticipantBalance,
} from "@/lib/expenses-v2/types";

// useBalances — derived net-balance view per participant for a given event
export function useBalances(eventId: string | undefined) {
  return useQuery({
    queryKey: eventId ? expenseKeys.balances(eventId) : ["expenses-v2", "none", "balances"],
    enabled: !!eventId,
    queryFn: async (): Promise<ParticipantBalance[]> => {
      if (!eventId) return [];
      const { data, error } = await (supabase.from as any)("expense_balance_view")
        .select("*")
        .eq("event_id", eventId);
      if (error) throw error;
      return (data as ParticipantBalance[]) ?? [];
    },
    staleTime: 30_000,
  });
}

// useSimplifiedDebts — minimal set of transfers to settle everyone (RPC)
export function useSimplifiedDebts(eventId: string | undefined) {
  return useQuery({
    queryKey: eventId ? expenseKeys.simplified(eventId) : ["expenses-v2", "none", "simplified"],
    enabled: !!eventId,
    queryFn: async (): Promise<SimplifiedDebt[]> => {
      if (!eventId) return [];
      const { data, error } = await (supabase.rpc as any)("simplified_debts", {
        p_event_id: eventId,
      });
      if (error) throw error;
      return (data as SimplifiedDebt[]) ?? [];
    },
    staleTime: 30_000,
  });
}

// useSettlements — list all settlements in an event
export function useSettlements(eventId: string | undefined) {
  return useQuery({
    queryKey: eventId
      ? ([...expenseKeys.byEvent(eventId), "settlements"] as const)
      : ["expenses-v2", "none", "settlements"],
    enabled: !!eventId,
    queryFn: async (): Promise<ExpenseSettlement[]> => {
      if (!eventId) return [];
      const { data, error } = await (supabase.from as any)("expense_settlements")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as ExpenseSettlement[]) ?? [];
    },
    staleTime: 30_000,
  });
}

// useSettleDebt — record a payment between two participants
export function useSettleDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SettleDebtInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      // Insert with payer-side confirmation timestamp. Payee confirms in a
      // follow-up action (or auto-confirms if they are the initiator).
      const { data, error } = await (supabase.from as any)("expense_settlements")
        .insert({
          event_id: input.eventId,
          from_participant_id: input.fromParticipantId,
          to_participant_id: input.toParticipantId,
          amount: input.amount,
          currency: input.currency ?? "EUR",
          method: input.method,
          reference_url: input.referenceUrl ?? null,
          note: input.note ?? null,
          // If initiator is the payer, mark payer-confirmed immediately.
          confirmed_by_payer_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data as ExpenseSettlement;
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: expenseKeys.byEvent(input.eventId) });
      qc.invalidateQueries({ queryKey: expenseKeys.balances(input.eventId) });
      qc.invalidateQueries({ queryKey: expenseKeys.simplified(input.eventId) });
      qc.invalidateQueries({ queryKey: expenseKeys.activity(input.eventId) });
      toast.success("Zahlung erfasst — warten auf Bestätigung.");
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

// useConfirmSettlementByPayee — the payee confirms receipt
export function useConfirmSettlementByPayee(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ settlementId }: { settlementId: string }) => {
      const { error } = await (supabase.from as any)("expense_settlements")
        .update({ confirmed_by_payee_at: new Date().toISOString() })
        .eq("id", settlementId);
      if (error) throw error;
      return { settlementId };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.byEvent(eventId) });
      qc.invalidateQueries({ queryKey: expenseKeys.balances(eventId) });
      qc.invalidateQueries({ queryKey: expenseKeys.simplified(eventId) });
      toast.success("Zahlung bestätigt — schön gewesen!");
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}
