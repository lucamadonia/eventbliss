import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  Image,
  Share2,
  Mail,
  Download,
  Copy,
  Check,
  Instagram,
  Facebook,
  MessageCircle,
  FileText,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAffiliateStats, useAffiliateVouchers } from "@/hooks/useAffiliate";
import { toast } from "sonner";

interface BannerTemplate {
  id: string;
  name: string;
  size: string;
  dimensions: string;
  preview: string;
}

interface SocialTemplate {
  id: string;
  platform: "instagram" | "facebook" | "whatsapp" | "twitter";
  type: string;
  text: string;
}

const bannerTemplates: BannerTemplate[] = [
  { id: "leaderboard", name: "Leaderboard", size: "728x90", dimensions: "728×90px", preview: "bg-gradient-to-r from-primary to-pink-500" },
  { id: "medium-rect", name: "Medium Rectangle", size: "300x250", dimensions: "300×250px", preview: "bg-gradient-to-br from-accent to-cyan-400" },
  { id: "wide-skyscraper", name: "Wide Skyscraper", size: "160x600", dimensions: "160×600px", preview: "bg-gradient-to-b from-success to-emerald-400" },
  { id: "square", name: "Square", size: "250x250", dimensions: "250×250px", preview: "bg-gradient-to-br from-pink-500 to-rose-400" },
  { id: "mobile", name: "Mobile Banner", size: "320x50", dimensions: "320×50px", preview: "bg-gradient-to-r from-violet-500 to-purple-400" },
  { id: "large-rect", name: "Large Rectangle", size: "336x280", dimensions: "336×280px", preview: "bg-gradient-to-br from-amber-500 to-orange-400" },
];

export function AffiliateMarketingTab() {
  const { t } = useTranslation();
  const { data: stats } = useAffiliateStats();
  const { data: vouchers } = useAffiliateVouchers(stats?.affiliate?.id);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<string>("");

  const firstVoucher = vouchers?.[0]?.voucher?.code || "DEINCODE";
  const activeVoucher = selectedVoucher || firstVoucher;

  const socialTemplates: SocialTemplate[] = [
    {
      id: "instagram-story",
      platform: "instagram",
      type: "Story",
      text: `🎉 Plane dein perfektes Event mit EventBliss!\n\n✨ Spare ${vouchers?.[0]?.voucher?.discount_value || 20}% mit meinem Code: ${activeVoucher}\n\n👆 Link in Bio\n\n#EventBliss #Partyplanung #JGA #Geburtstag`,
    },
    {
      id: "instagram-post",
      platform: "instagram",
      type: "Post",
      text: `Du planst einen JGA, Geburtstag oder Gruppenausflug? 🎊\n\nMit EventBliss wird alles einfacher:\n✅ Smarte Kostenaufteilung\n✅ Terminabstimmung\n✅ KI-Vorschläge\n\nSpar ${vouchers?.[0]?.voucher?.discount_value || 20}% mit Code: ${activeVoucher}\n\n#EventPlanning #EventBliss`,
    },
    {
      id: "facebook-post",
      platform: "facebook",
      type: "Post",
      text: `🎉 TIPP für alle, die ein Event planen!\n\nIch nutze EventBliss für die Planung von Gruppenevents und bin begeistert. Kostenaufteilung, Terminabstimmung, Vorschläge – alles in einer App!\n\nMit meinem Code "${activeVoucher}" bekommst du ${vouchers?.[0]?.voucher?.discount_value || 20}% Rabatt! 🎁\n\n👉 eventbliss.app`,
    },
    {
      id: "whatsapp-share",
      platform: "whatsapp",
      type: "Nachricht",
      text: `Hey! 👋\n\nKennst du schon EventBliss? Mega praktisch für JGAs, Geburtstage etc.!\n\nMit meinem Code ${activeVoucher} sparst du ${vouchers?.[0]?.voucher?.discount_value || 20}%! 🎉\n\n👉 eventbliss.app`,
    },
  ];

  const emailTemplates = [
    {
      id: "newsletter",
      name: "Newsletter-Einbindung",
      subject: "Exklusiver Rabatt für dein nächstes Event",
      preview: `Spare ${vouchers?.[0]?.voucher?.discount_value || 20}% mit dem Code ${activeVoucher}`,
    },
    {
      id: "personal",
      name: "Persönliche Empfehlung",
      subject: "Tipp: Eventplanung leicht gemacht",
      preview: "Ich habe da was für dich entdeckt...",
    },
  ];

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success(t("common.copied", "Kopiert!"));
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error(t("common.error", "Fehler beim Kopieren"));
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram": return Instagram;
      case "facebook": return Facebook;
      case "whatsapp": return MessageCircle;
      default: return Share2;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "instagram": return "from-pink-500 to-purple-500";
      case "facebook": return "from-blue-600 to-blue-400";
      case "whatsapp": return "from-green-500 to-emerald-400";
      default: return "from-primary to-pink-500";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold">{t("affiliate.marketing.title", "Marketing-Materialien")}</h2>
        <p className="text-muted-foreground">{t("affiliate.marketing.subtitle", "Banner, Social Media Templates und E-Mail-Vorlagen für deine Werbung")}</p>
      </motion.div>

      {/* Voucher Selector */}
      {vouchers && vouchers.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">{t("affiliate.marketing.selectVoucher", "Gutschein für Templates:")}</span>
            {vouchers.map((v: any) => (
              <Button
                key={v.id}
                variant={activeVoucher === v.voucher?.code ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedVoucher(v.voucher?.code || "")}
              >
                {v.voucher?.code}
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      <Tabs defaultValue="banners" className="space-y-6">
        <TabsList className="glass-card p-1">
          <TabsTrigger value="banners" className="gap-2">
            <Image className="w-4 h-4" />
            {t("affiliate.marketing.banners", "Banner")}
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Share2 className="w-4 h-4" />
            {t("affiliate.marketing.social", "Social Media")}
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            {t("affiliate.marketing.email", "E-Mail")}
          </TabsTrigger>
        </TabsList>

        {/* Banners Tab */}
        <TabsContent value="banners" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {bannerTemplates.map((banner, index) => (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card-hover p-4 group"
              >
                {/* Banner Preview */}
                <div className={`${banner.preview} rounded-xl mb-4 flex items-center justify-center p-4 min-h-[120px]`}>
                  <div className="text-white text-center">
                    <p className="font-bold text-lg">EventBliss</p>
                    <p className="text-sm opacity-90">{vouchers?.[0]?.voucher?.discount_value || 20}% Rabatt mit {activeVoucher}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{banner.name}</h4>
                    <p className="text-sm text-muted-foreground">{banner.dimensions}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => toast.info(t("affiliate.marketing.bannerDownload", "Banner-Download wird vorbereitet..."))}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">{t("affiliate.marketing.customBanner", "Individueller Banner")}</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              {t("affiliate.marketing.customBannerDesc", "Benötigst du einen Banner in einer anderen Größe oder mit individuellem Design? Kontaktiere unser Team!")}
            </p>
            <Button variant="outline" className="gap-2">
              <Mail className="w-4 h-4" />
              {t("affiliate.marketing.contactTeam", "Team kontaktieren")}
            </Button>
          </motion.div>
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {socialTemplates.map((template, index) => {
              const Icon = getPlatformIcon(template.platform);
              
              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card-hover p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getPlatformColor(template.platform)} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold capitalize">{template.platform}</h4>
                      <Badge variant="secondary">{template.type}</Badge>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-xl p-4 mb-4 text-sm whitespace-pre-wrap">
                    {template.text}
                  </div>
                  
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => copyToClipboard(template.text, template.id)}
                  >
                    {copiedId === template.id ? (
                      <>
                        <Check className="w-4 h-4 text-success" />
                        {t("common.copied", "Kopiert!")}
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        {t("affiliate.marketing.copyText", "Text kopieren")}
                      </>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>

          {/* Hashtags */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <h3 className="font-semibold mb-4">{t("affiliate.marketing.popularHashtags", "Beliebte Hashtags")}</h3>
            <div className="flex flex-wrap gap-2">
              {["#EventBliss", "#Partyplanung", "#JGA", "#Junggesellenabschied", "#Geburtstag", "#Gruppenreise", "#EventPlanning", "#Hochzeit", "#TeamEvent", "#Kostenteilen"].map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => copyToClipboard(tag, tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-6">
          {emailTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card-hover p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold">{template.name}</h4>
                  <p className="text-sm text-muted-foreground">{template.preview}</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 mb-4">
                <div className="border-b border-border pb-2 mb-2">
                  <p className="text-sm text-muted-foreground">{t("affiliate.marketing.subject", "Betreff")}:</p>
                  <p className="font-medium">{template.subject}</p>
                </div>
                <div className="space-y-2 text-sm">
                  <p>Hallo [Name],</p>
                  <p>
                    {template.id === "newsletter" 
                      ? `ich möchte dir EventBliss vorstellen – die perfekte App für die Planung von JGAs, Geburtstagen und Gruppenreisen. Mit meinem exklusiven Code "${activeVoucher}" sparst du ${vouchers?.[0]?.voucher?.discount_value || 20}%!`
                      : `ich habe kürzlich EventBliss entdeckt und bin begeistert! Die App macht Gruppenplanung so viel einfacher. Nutze meinen Code "${activeVoucher}" für ${vouchers?.[0]?.voucher?.discount_value || 20}% Rabatt.`
                    }
                  </p>
                  <p>Probier es aus: eventbliss.app</p>
                  <p className="text-muted-foreground">Liebe Grüße</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    const body = template.id === "newsletter" 
                      ? `ich möchte dir EventBliss vorstellen – die perfekte App für die Planung von JGAs, Geburtstagen und Gruppenreisen. Mit meinem exklusiven Code "${activeVoucher}" sparst du ${vouchers?.[0]?.voucher?.discount_value || 20}%!\n\nProbier es aus: eventbliss.app`
                      : `ich habe kürzlich EventBliss entdeckt und bin begeistert! Die App macht Gruppenplanung so viel einfacher. Nutze meinen Code "${activeVoucher}" für ${vouchers?.[0]?.voucher?.discount_value || 20}% Rabatt.\n\nProbier es aus: eventbliss.app`;
                    copyToClipboard(body, template.id);
                  }}
                >
                  {copiedId === template.id ? (
                    <>
                      <Check className="w-4 h-4 text-success" />
                      {t("common.copied", "Kopiert!")}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      {t("affiliate.marketing.copyText", "Text kopieren")}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
