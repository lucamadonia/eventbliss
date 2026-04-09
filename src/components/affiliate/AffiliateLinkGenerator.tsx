import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useState, useMemo } from "react";
import {
  Link,
  Copy,
  Check,
  QrCode,
  Download,
  RefreshCw,
  Smartphone,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAffiliateStats, useAffiliateVouchers } from "@/hooks/useAffiliate";
import { toast } from "sonner";

const UTM_SOURCES = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "twitter", label: "Twitter/X" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "email", label: "E-Mail" },
  { value: "website", label: "Website" },
  { value: "blog", label: "Blog" },
  { value: "other", label: "Andere" },
];

const UTM_MEDIUMS = [
  { value: "social", label: "Social Media" },
  { value: "story", label: "Story" },
  { value: "post", label: "Post" },
  { value: "reel", label: "Reel/Video" },
  { value: "bio", label: "Bio Link" },
  { value: "email", label: "E-Mail" },
  { value: "banner", label: "Banner" },
  { value: "referral", label: "Empfehlung" },
  { value: "cpc", label: "CPC/Paid" },
];

export function AffiliateLinkGenerator() {
  const { t } = useTranslation();
  const { data: stats } = useAffiliateStats();
  const { data: vouchers } = useAffiliateVouchers(stats?.affiliate?.id);
  
  const [selectedVoucher, setSelectedVoucher] = useState<string>("");
  const [utmSource, setUtmSource] = useState<string>("");
  const [utmMedium, setUtmMedium] = useState<string>("");
  const [utmCampaign, setUtmCampaign] = useState<string>("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseUrl = "https://event-bliss.com";
  const affiliateId = stats?.affiliate?.id?.slice(0, 8) || "affiliate";

  const generatedUrl = useMemo(() => {
    const params = new URLSearchParams();
    
    if (affiliateId) params.set("ref", affiliateId);
    if (selectedVoucher) params.set("code", selectedVoucher);
    if (utmSource) params.set("utm_source", utmSource);
    if (utmMedium) params.set("utm_medium", utmMedium);
    if (utmCampaign) params.set("utm_campaign", utmCampaign);

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }, [affiliateId, selectedVoucher, utmSource, utmMedium, utmCampaign]);

  const shortUrl = useMemo(() => {
    // Simulated short URL - in production this would call a URL shortener service
    const hash = btoa(`${affiliateId}-${selectedVoucher || 'default'}`).slice(0, 8);
    return `evtbl.is/${hash}`;
  }, [affiliateId, selectedVoucher]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(t("common.copied", "Kopiert!"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("common.error", "Fehler beim Kopieren"));
    }
  };

  const resetForm = () => {
    setSelectedVoucher("");
    setUtmSource("");
    setUtmMedium("");
    setUtmCampaign("");
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generatedUrl)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center">
            <Link className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t("affiliate.linkGenerator.title", "Link-Generator")}</h3>
            <p className="text-sm text-muted-foreground">{t("affiliate.linkGenerator.subtitle", "Erstelle trackbare Affiliate-Links")}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={resetForm}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Voucher Selection */}
        <div className="space-y-2">
          <Label>{t("affiliate.linkGenerator.voucher", "Gutscheincode")}</Label>
          <Select value={selectedVoucher} onValueChange={setSelectedVoucher}>
            <SelectTrigger>
              <SelectValue placeholder={t("affiliate.linkGenerator.selectVoucher", "Gutschein wählen (optional)")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Kein Gutschein</SelectItem>
              {vouchers?.map((v: any) => (
                <SelectItem key={v.id} value={v.voucher?.code || ""}>
                  {v.voucher?.code} ({v.voucher?.discount_value}{v.voucher?.discount_type === "percentage" ? "%" : "€"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* UTM Source */}
        <div className="space-y-2">
          <Label>{t("affiliate.linkGenerator.source", "Traffic-Quelle (utm_source)")}</Label>
          <Select value={utmSource} onValueChange={setUtmSource}>
            <SelectTrigger>
              <SelectValue placeholder={t("affiliate.linkGenerator.selectSource", "Quelle wählen")} />
            </SelectTrigger>
            <SelectContent>
              {UTM_SOURCES.map((source) => (
                <SelectItem key={source.value} value={source.value}>
                  {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* UTM Medium */}
        <div className="space-y-2">
          <Label>{t("affiliate.linkGenerator.medium", "Medium (utm_medium)")}</Label>
          <Select value={utmMedium} onValueChange={setUtmMedium}>
            <SelectTrigger>
              <SelectValue placeholder={t("affiliate.linkGenerator.selectMedium", "Medium wählen")} />
            </SelectTrigger>
            <SelectContent>
              {UTM_MEDIUMS.map((medium) => (
                <SelectItem key={medium.value} value={medium.value}>
                  {medium.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* UTM Campaign */}
        <div className="space-y-2">
          <Label>{t("affiliate.linkGenerator.campaign", "Kampagne (utm_campaign)")}</Label>
          <Input
            value={utmCampaign}
            onChange={(e) => setUtmCampaign(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
            placeholder={t("affiliate.linkGenerator.campaignPlaceholder", "z.B. summer_sale_2025")}
          />
        </div>
      </div>

      {/* Generated URL */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <Label>{t("affiliate.linkGenerator.generatedUrl", "Generierter Link")}</Label>
        </div>
        
        <div className="flex gap-2">
          <Input
            value={generatedUrl}
            readOnly
            className="font-mono text-sm bg-muted/50"
          />
          <Button
            variant="outline"
            className="gap-2 shrink-0"
            onClick={() => copyToClipboard(generatedUrl)}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-success" />
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>

        {/* Short URL */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Smartphone className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t("affiliate.linkGenerator.shortUrl", "Kurzlink")}:</span>
          <code className="font-mono text-sm text-primary">{shortUrl}</code>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 gap-1"
            onClick={() => copyToClipboard(`https://${shortUrl}`)}
          >
            <Copy className="w-3 h-3" />
            {t("common.copy", "Kopieren")}
          </Button>
        </div>
      </div>

      {/* URL Parameters Preview */}
      {(selectedVoucher || utmSource || utmMedium || utmCampaign) && (
        <div className="flex flex-wrap gap-2">
          {affiliateId && (
            <Badge variant="outline" className="gap-1">
              <span className="text-muted-foreground">ref:</span> {affiliateId}
            </Badge>
          )}
          {selectedVoucher && (
            <Badge variant="outline" className="gap-1">
              <span className="text-muted-foreground">code:</span> {selectedVoucher}
            </Badge>
          )}
          {utmSource && (
            <Badge variant="outline" className="gap-1">
              <span className="text-muted-foreground">source:</span> {utmSource}
            </Badge>
          )}
          {utmMedium && (
            <Badge variant="outline" className="gap-1">
              <span className="text-muted-foreground">medium:</span> {utmMedium}
            </Badge>
          )}
          {utmCampaign && (
            <Badge variant="outline" className="gap-1">
              <span className="text-muted-foreground">campaign:</span> {utmCampaign}
            </Badge>
          )}
        </div>
      )}

      {/* QR Code Section */}
      <div className="border-t border-border pt-4">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setShowQR(!showQR)}
        >
          <QrCode className="w-4 h-4" />
          {showQR ? t("affiliate.linkGenerator.hideQR", "QR-Code ausblenden") : t("affiliate.linkGenerator.showQR", "QR-Code anzeigen")}
        </Button>

        {showQR && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 flex flex-col items-center gap-4"
          >
            <div className="p-4 bg-white rounded-xl">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-48 h-48"
              />
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                const link = document.createElement("a");
                link.href = qrCodeUrl.replace("200x200", "400x400");
                link.download = `eventbliss-qr-${selectedVoucher || "affiliate"}.png`;
                link.click();
                toast.success(t("affiliate.linkGenerator.qrDownloaded", "QR-Code heruntergeladen"));
              }}
            >
              <Download className="w-4 h-4" />
              {t("affiliate.linkGenerator.downloadQR", "QR-Code herunterladen")}
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
