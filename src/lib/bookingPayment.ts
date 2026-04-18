import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { openCheckout } from "@/lib/nativeCheckout";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PaymentState = "paid" | "unpaid" | "on_site" | "refunded" | "not_required";

export interface BookingPaymentInput {
  status: string;
  stripe_payment_intent_id?: string | null;
  stripe_checkout_session_id?: string | null;
  payment_method?: string | null; // 'online' | 'on_site' | null
  total_price_cents?: number | null; // kept for callers, not used in logic
}

// ---------------------------------------------------------------------------
// Derive payment state — ALL paid bookings (including 0 €) MUST go through
// Stripe Checkout. The presence of a completed Checkout Session is proof
// of payment regardless of amount:
//   - 0 € Stripe sessions complete with payment_status='paid' but no PI.
//   - ≥50 ¢ sessions complete with both payment_status='paid' and a PI.
// The booking webhook moves 'pending_payment' → 'confirmed' / 'pending_confirmation'
// on either path. So status alone tells us whether Stripe was satisfied.
//
// Precedence:
//  1. status 'refunded' → refunded (terminal reversal)
//  2. status 'cancelled_*' → not_required (booking is dead)
//  3. payment_method 'on_site' → on_site (Stripe not involved by policy)
//  4. status 'pending_payment' → unpaid (Stripe session not yet completed)
//  5. anything else (confirmed / pending_confirmation / in_progress / completed) → paid
export function derivePaymentState(b: BookingPaymentInput): PaymentState {
  const status = b.status;

  if (status === "refunded") return "refunded";
  if (status === "cancelled_by_customer" || status === "cancelled_by_agency") {
    return "not_required";
  }
  if (b.payment_method === "on_site") return "on_site";
  if (status === "pending_payment") return "unpaid";

  // Any other active status means Stripe Checkout completed (webhook moved
  // the status) — even if total was 0 € and no PaymentIntent exists.
  return "paid";
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
      return { url, bookingId };
    },
    onSuccess: ({ url, bookingId }) => {
      // Native: in-app browser, landing back on BookingSuccess via router.
      // Web: full-page redirect.
      void openCheckout({
        url,
        onFinishPath: `/booking-success?booking=${bookingId}`,
      });
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

// ---------------------------------------------------------------------------
// Self-healing: verify a Stripe Checkout Session directly, and patch the
// booking if the webhook didn't fire. Returns whatever the edge function
// reports (already_confirmed / confirmed_now / no_session / not_paid).
// ---------------------------------------------------------------------------

export async function verifyBookingPayment(bookingId: string): Promise<{
  status: "already_confirmed" | "confirmed_now" | "no_session" | "not_paid" | "error";
  payment_status?: string;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "marketplace-verify-payment",
      { body: { booking_id: bookingId } },
    );
    if (error) return { status: "error", error: error.message };
    return (data as any) ?? { status: "error", error: "Leere Antwort" };
  } catch (e) {
    return { status: "error", error: e instanceof Error ? e.message : String(e) };
  }
}
