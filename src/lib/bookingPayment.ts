import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PaymentState = "paid" | "unpaid" | "on_site" | "refunded" | "not_required";

export interface BookingPaymentInput {
  status: string;
  stripe_payment_intent_id?: string | null;
  payment_method?: string | null; // 'online' | 'on_site' | null
}

// ---------------------------------------------------------------------------
// Derive payment state from booking fields
// ---------------------------------------------------------------------------
//
// Precedence (cancellation and refund always win — they represent a terminal
// state where no payment is owed or the transaction has been reversed):
//  1. 'refunded' status
//  2. 'cancelled_by_*' status → not_required (booking is dead, don't show payment UI)
//  3. 'on_site' payment method → on_site (no Stripe transaction required)
//  4. PI present → paid
//  5. pending_payment → unpaid
//  6. defensive fallback: confirmed/pending_confirmation without PI and not on_site → unpaid
//  7. default → unpaid
export function derivePaymentState(b: BookingPaymentInput): PaymentState {
  const status = b.status;
  const hasPI = !!b.stripe_payment_intent_id;
  const isOnSite = b.payment_method === "on_site";

  if (status === "refunded") return "refunded";
  if (status === "cancelled_by_customer" || status === "cancelled_by_agency") {
    return "not_required";
  }
  if (isOnSite) return "on_site";
  if (hasPI) return "paid";

  if (status === "pending_payment") return "unpaid";

  // defensive fallback — a confirmed/pending_confirmation booking without PI
  // and not on_site should surface as unpaid so the user can complete it.
  if (status === "confirmed" || status === "pending_confirmation") return "unpaid";

  return "unpaid";
}

// ---------------------------------------------------------------------------
// Pay-now hook — resumes a Stripe Checkout for an existing booking.
// ---------------------------------------------------------------------------

export function usePayBookingNow(): {
  mutate: (bookingId: string) => void;
  isPending: boolean;
} {
  const mutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase.functions.invoke("marketplace-checkout", {
        body: { booking_id: bookingId },
      });
      if (error) throw error;
      const url = (data as { url?: string } | null)?.url;
      if (!url) throw new Error("Keine Checkout-URL erhalten");
      return url;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (e: Error) => {
      toast.error(`Zahlung konnte nicht gestartet werden: ${e.message}`);
    },
  });

  return {
    mutate: (bookingId: string) => mutation.mutate(bookingId),
    isPending: mutation.isPending,
  };
}
