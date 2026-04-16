import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Zap, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tier = "starter" | "professional" | "enterprise";

interface Props {
  tier: Tier;
  collapsed?: boolean;
}

export function SidebarUpgradeCard({ tier, collapsed = false }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (tier === "enterprise") return null;

  const isStarter = tier === "starter";
  const Icon = isStarter ? Zap : Crown;
  const gradient = isStarter
    ? "from-violet-600 via-pink-600 to-amber-500"
    : "from-amber-500 via-orange-600 to-red-600";
  const ctaLabel = isStarter
    ? t("agency.sidebar.upgradeToPro", "Auf Professional")
    : t("agency.sidebar.upgradeToEnt", "Auf Enterprise");
  const tagline = isStarter
    ? t("agency.sidebar.starterTagline", "Schalte 6 weitere Module frei")
    : t("agency.sidebar.proTagline", "Command Center für Marktführer");

  if (collapsed) {
    return (
      <button
        onClick={() => navigate("/agency/pricing")}
        title={ctaLabel}
        className={`mx-auto w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer`}
      >
        <Icon className="w-4 h-4 text-white" />
      </button>
    );
  }

  return (
    <div className="m-3 rounded-xl bg-white/[0.03] border border-white/10 p-4 relative overflow-hidden">
      <div className={`absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br ${gradient} opacity-20 blur-2xl rounded-full`} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
            {t("agency.sidebar.upgradePill", "Upgrade")}
          </span>
        </div>
        <p className="text-xs text-white/80 leading-snug mb-3">{tagline}</p>
        <Button
          onClick={() => navigate("/agency/pricing")}
          size="sm"
          className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90 text-white border-0 font-bold text-xs h-8 rounded-lg cursor-pointer transition-all`}
        >
          {ctaLabel}
          <ArrowRight className="w-3 h-3 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
