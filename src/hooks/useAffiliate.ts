import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

export interface AffiliateStats {
  isAffiliate: boolean;
  affiliate?: {
    id: string;
    company_name: string | null;
    contact_name: string;
    email: string;
    status: string;
    tier: string;
    commission_type: string;
    commission_rate: number;
    total_earnings: number;
    pending_balance: number;
  };
  commissions?: {
    total: number;
    pending: number;
    approved: number;
    paid: number;
    totalPending: number;
    totalApproved: number;
    totalPaid: number;
    totalEarnings: number;
  };
  vouchers?: {
    count: number;
    totalRedemptions: number;
  };
  payouts?: {
    count: number;
    last: {
      amount: number;
      status: string;
      date: string;
    } | null;
  };
  monthlyStats?: Array<{
    month: string;
    earnings: number;
    conversions: number;
  }>;
}

export function useAffiliateStats() {
  const { user, session } = useAuthContext();

  return useQuery({
    queryKey: ["affiliate-stats", user?.id],
    queryFn: async (): Promise<AffiliateStats> => {
      const { data, error } = await supabase.functions.invoke("get-affiliate-stats", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!session,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAffiliateVouchers(affiliateId?: string) {
  return useQuery({
    queryKey: ["affiliate-vouchers", affiliateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_vouchers")
        .select(`
          id,
          custom_commission_type,
          custom_commission_rate,
          created_at,
          voucher:vouchers(id, code, discount_type, discount_value, used_count, is_active)
        `)
        .eq("affiliate_id", affiliateId!);
      
      if (error) throw error;
      return data;
    },
    enabled: !!affiliateId,
  });
}

export function useAffiliateCommissions(affiliateId?: string) {
  return useQuery({
    queryKey: ["affiliate-commissions", affiliateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_commissions")
        .select("*")
        .eq("affiliate_id", affiliateId!)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!affiliateId,
  });
}

export function useAffiliatePayouts(affiliateId?: string) {
  return useQuery({
    queryKey: ["affiliate-payouts", affiliateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_payouts")
        .select("*")
        .eq("affiliate_id", affiliateId!)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!affiliateId,
  });
}

export function useRequestPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("request-payout");
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-stats"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate-payouts"] });
      toast.success("Auszahlungsanfrage erfolgreich gestellt");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Admin hooks
export function useAllAffiliates() {
  return useQuery({
    queryKey: ["admin-affiliates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useAllCommissions() {
  return useQuery({
    queryKey: ["admin-commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_commissions")
        .select(`
          *,
          affiliate:affiliates(id, contact_name, company_name, email),
          voucher:vouchers(id, code)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useAllPayouts() {
  return useQuery({
    queryKey: ["admin-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_payouts")
        .select(`
          *,
          affiliate:affiliates(id, contact_name, company_name, email)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateCommissionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending" | "approved" | "paid" | "cancelled" }) => {
      const { error } = await supabase
        .from("affiliate_commissions")
        .update({ status })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-commissions"] });
      toast.success("Status aktualisiert");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdatePayoutStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      payout_reference,
      processed_by 
    }: { 
      id: string; 
      status: string;
      payout_reference?: string;
      processed_by?: string;
    }) => {
      const updateData: any = { 
        status,
        ...(payout_reference && { payout_reference }),
        ...(processed_by && { processed_by }),
        ...(status === 'completed' && { processed_at: new Date().toISOString() })
      };

      const { error } = await supabase
        .from("affiliate_payouts")
        .update(updateData)
        .eq("id", id);
      
      if (error) throw error;

      // If completed, update commission statuses and affiliate balance
      if (status === 'completed') {
        // Get the payout to update related commissions
        const { data: payout } = await supabase
          .from("affiliate_payouts")
          .select("affiliate_id, amount")
          .eq("id", id)
          .single();

        if (payout) {
          // Update commissions linked to this payout
          await supabase
            .from("affiliate_commissions")
            .update({ status: 'paid' as const })
            .eq("payout_id", id);

          // Update affiliate's pending balance
          const { data: affiliate } = await supabase
            .from("affiliates")
            .select("pending_balance")
            .eq("id", payout.affiliate_id)
            .single();

          if (affiliate) {
            await supabase
              .from("affiliates")
              .update({ 
                pending_balance: Math.max(0, Number(affiliate.pending_balance) - Number(payout.amount))
              })
              .eq("id", payout.affiliate_id);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-commissions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-affiliates"] });
      toast.success("Auszahlung aktualisiert");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCreateAffiliate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      contact_name: string;
      email: string;
      company_name?: string;
      phone?: string;
      website?: string;
      tax_id?: string;
      commission_type?: "percentage" | "fixed";
      commission_rate?: number;
      status?: "pending" | "active" | "suspended" | "terminated";
      tier?: "bronze" | "silver" | "gold" | "platinum";
      notes?: string;
    }) => {
      const { error } = await supabase
        .from("affiliates")
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-affiliates"] });
      toast.success("Partner erstellt");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateAffiliate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("affiliates")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-affiliates"] });
      toast.success("Partner aktualisiert");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useAssignVoucherToAffiliate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      affiliate_id, 
      voucher_id,
      custom_commission_type,
      custom_commission_rate
    }: { 
      affiliate_id: string; 
      voucher_id: string;
      custom_commission_type?: "percentage" | "fixed";
      custom_commission_rate?: number;
    }) => {
      const insertData: any = {
        affiliate_id,
        voucher_id,
      };
      if (custom_commission_type) insertData.custom_commission_type = custom_commission_type;
      if (custom_commission_rate) insertData.custom_commission_rate = custom_commission_rate;
      
      const { error } = await supabase
        .from("affiliate_vouchers")
        .insert([insertData]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-affiliates"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate-vouchers"] });
      toast.success("Gutschein zugewiesen");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}