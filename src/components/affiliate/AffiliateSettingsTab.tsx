import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { 
  User, 
  Building2,
  Mail,
  Phone,
  Globe,
  Receipt,
  CreditCard,
  Save,
  Loader2,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAffiliateStats, useUpdateAffiliate } from "@/hooks/useAffiliate";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function AffiliateSettingsTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: stats, isLoading } = useAffiliateStats();
  const updateAffiliate = useUpdateAffiliate();
  
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    website: "",
    tax_id: "",
    payout_method: "bank_transfer" as "bank_transfer" | "paypal",
    iban: "",
    bic: "",
    paypal_email: "",
  });

  const [affiliateId, setAffiliateId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAffiliateData = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from("affiliates")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setAffiliateId(data.id);
        const payoutDetails = data.payout_details as any || {};
        setFormData({
          company_name: data.company_name || "",
          contact_name: data.contact_name || "",
          email: data.email || "",
          phone: data.phone || "",
          website: data.website || "",
          tax_id: data.tax_id || "",
          payout_method: (data.payout_method as "bank_transfer" | "paypal") || "bank_transfer",
          iban: payoutDetails.iban || "",
          bic: payoutDetails.bic || "",
          paypal_email: payoutDetails.paypal_email || "",
        });
      }
    };

    fetchAffiliateData();
  }, [user?.id]);

  const handleSave = async () => {
    if (!affiliateId) return;

    const payoutDetails = formData.payout_method === "bank_transfer"
      ? { iban: formData.iban, bic: formData.bic }
      : { paypal_email: formData.paypal_email };

    try {
      await updateAffiliate.mutateAsync({
        id: affiliateId,
        company_name: formData.company_name || null,
        contact_name: formData.contact_name,
        email: formData.email,
        phone: formData.phone || null,
        website: formData.website || null,
        tax_id: formData.tax_id || null,
        payout_method: formData.payout_method,
        payout_details: payoutDetails,
      });
      toast.success(t("affiliate.settings.saved", "Einstellungen gespeichert"));
    } catch (error) {
      toast.error(t("common.error", "Fehler beim Speichern"));
    }
  };

  const tierColors: Record<string, string> = {
    bronze: "from-amber-600 to-amber-400",
    silver: "from-gray-400 to-gray-200",
    gold: "from-yellow-500 to-amber-300",
    platinum: "from-violet-500 to-purple-300",
  };

  const tierThresholds = {
    bronze: { min: 0, next: "silver", needed: 10 },
    silver: { min: 10, next: "gold", needed: 25 },
    gold: { min: 25, next: "platinum", needed: 50 },
    platinum: { min: 50, next: null, needed: 0 },
  };

  const currentTier = stats?.affiliate?.tier || "bronze";
  const tierInfo = tierThresholds[currentTier as keyof typeof tierThresholds];
  const conversions = stats?.vouchers?.totalRedemptions || 0;
  const progress = tierInfo.next 
    ? Math.min(100, ((conversions - tierInfo.min) / (tierInfo.needed - tierInfo.min)) * 100)
    : 100;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-6 h-48 shimmer" />
        <div className="glass-card p-6 h-64 shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tier Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 relative overflow-hidden"
      >
        <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${tierColors[currentTier]}`} />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tierColors[currentTier]} flex items-center justify-center shadow-lg`}>
              <Award className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("affiliate.settings.yourTier", "Dein Tier")}
              </p>
              <Badge className={`text-lg font-bold px-3 py-1 bg-gradient-to-r ${tierColors[currentTier]} text-white border-0`}>
                {t(`affiliate.tiers.${currentTier}`, currentTier.toUpperCase())}
              </Badge>
            </div>
          </div>

          {tierInfo.next && (
            <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  {String(t("affiliate.tiers.nextTier", "Nächstes Tier"))}: {String(t(`affiliate.tiers.${tierInfo.next}`, tierInfo.next))}
                </span>
                <span className="font-medium">{conversions} / {tierInfo.needed}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${tierColors[tierInfo.next]}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t("affiliate.tiers.conversionsNeeded", { needed: tierInfo.needed - conversions })}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Profile Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <User className="w-5 h-5" />
          {t("affiliate.settings.profile", "Profil")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {t("affiliate.settings.companyName", "Firmenname")}
            </Label>
            <Input
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder={t("affiliate.settings.companyNamePlaceholder", "Deine Firma GmbH")}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {t("affiliate.settings.contactName", "Kontaktname")} *
            </Label>
            <Input
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              placeholder={t("affiliate.settings.contactNamePlaceholder", "Max Mustermann")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {t("auth.email", "E-Mail")} *
            </Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="partner@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {t("affiliate.settings.phone", "Telefon")}
            </Label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+49 123 456789"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {t("affiliate.settings.website", "Website")}
            </Label>
            <Input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.example.com"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              {t("affiliate.settings.taxId", "Steuernummer / USt-ID")}
            </Label>
            <Input
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              placeholder="DE123456789"
            />
          </div>
        </div>
      </motion.div>

      {/* Payment Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          {t("affiliate.settings.paymentMethod", "Zahlungsmethode")}
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("affiliate.settings.paymentType", "Auszahlungsart")}</Label>
            <Select 
              value={formData.payout_method} 
              onValueChange={(value: "bank_transfer" | "paypal") => 
                setFormData({ ...formData, payout_method: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">
                  {t("affiliate.settings.bankTransfer", "Banküberweisung")}
                </SelectItem>
                <SelectItem value="paypal">
                  {t("affiliate.settings.paypal", "PayPal")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.payout_method === "bank_transfer" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("affiliate.settings.iban", "IBAN")}</Label>
                <Input
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  placeholder="DE89 3704 0044 0532 0130 00"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("affiliate.settings.bic", "BIC")}</Label>
                <Input
                  value={formData.bic}
                  onChange={(e) => setFormData({ ...formData, bic: e.target.value })}
                  placeholder="COBADEFFXXX"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t("affiliate.settings.paypalEmail", "PayPal E-Mail")}</Label>
              <Input
                type="email"
                value={formData.paypal_email}
                onChange={(e) => setFormData({ ...formData, paypal_email: e.target.value })}
                placeholder="paypal@example.com"
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-end"
      >
        <Button 
          onClick={handleSave}
          disabled={updateAffiliate.isPending}
          className="btn-glow gap-2"
        >
          {updateAffiliate.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {t("common.save", "Speichern")}
        </Button>
      </motion.div>
    </div>
  );
}
