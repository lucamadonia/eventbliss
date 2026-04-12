import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StripeConnectAccount {
  id: string;
  agency_id: string;
  stripe_account_id: string;
  onboarding_complete: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  country: string;
  default_currency: string;
}

export function useStripeConnect(agencyId: string | undefined) {
  const query = useQuery({
    queryKey: ["stripe-connect", agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("agency_stripe_accounts")
        .select("*")
        .eq("agency_id", agencyId)
        .maybeSingle();
      if (error) throw error;
      return data as StripeConnectAccount | null;
    },
  });

  return {
    ...query,
    stripeAccount: query.data,
    isOnboarded: query.data?.onboarding_complete ?? false,
    chargesEnabled: query.data?.charges_enabled ?? false,
    payoutsEnabled: query.data?.payouts_enabled ?? false,
  };
}

export function useInitiateOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (agencyId: string) => {
      const { data, error } = await supabase.functions.invoke("stripe-connect-onboard", {
        body: { agency_id: agencyId },
      });
      if (error) throw error;
      return data as { url: string };
    },
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
      qc.invalidateQueries({ queryKey: ["stripe-connect"] });
    },
    onError: (e: Error) => toast.error(`Stripe-Fehler: ${e.message}`),
  });
}
