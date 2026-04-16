import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Lock, Crown, Star, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ComponentType } from "react";

type Tier = "starter" | "professional" | "enterprise";

function GhostKanban({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-3 gap-3 p-6", className)}>
      {["Open", "Active", "Done"].map((col, i) => (
        <div key={col} className="flex flex-col gap-2">
          <div className="h-3 w-16 rounded bg-white/15" />
          {Array.from({ length: 3 + (i % 2) }).map((_, j) => (
            <div key={j} className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
              <div className="h-2.5 w-3/4 rounded bg-white/20" />
              <div className="h-2 w-1/2 rounded bg-white/10" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function GhostTable({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 space-y-3", className)}>
      <div className="grid grid-cols-5 gap-4 pb-3 border-b border-white/10">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-2.5 rounded bg-white/20" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, row) => (
        <div key={row} className="grid grid-cols-5 gap-4 py-2">
          {Array.from({ length: 5 }).map((_, col) => (
            <div key={col} className={cn("h-2 rounded", col === 0 ? "bg-white/25" : "bg-white/10")} />
          ))}
        </div>
      ))}
    </div>
  );
}

function GhostBudgetChart({ className }: { className?: string }) {
  const bars = [80, 45, 72, 58, 90, 34, 66];
  return (
    <div className={cn("p-6 space-y-4", className)}>
      <div className="flex items-end justify-between gap-2 h-40">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-violet-500/30 to-pink-500/30 border border-white/10"
              style={{ height: `${h}%` }}
            />
            <div className="h-2 w-4/5 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function GhostCalendar({ className }: { className?: string }) {
  return (
    <div className={cn("p-6", className)}>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => {
          const hasEvent = [3, 7, 11, 15, 18, 22, 27].includes(i);
          return (
            <div key={i} className="aspect-square rounded-md border border-white/5 bg-white/5 p-1.5 flex flex-col gap-1">
              <div className="h-1.5 w-4 rounded bg-white/15" />
              {hasEvent && <div className="h-2 rounded bg-pink-500/30 border border-pink-500/20" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GhostRunOfShow({ className }: { className?: string }) {
  const items = [
    { w: 70 }, { w: 55 }, { w: 85 }, { w: 40 }, { w: 60 }, { w: 75 },
  ];
  return (
    <div className={cn("p-6 space-y-2", className)}>
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="h-2.5 w-12 rounded bg-pink-400/40 font-mono" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2 rounded bg-white/20" style={{ width: `${it.w}%` }} />
            <div className="h-1.5 w-1/3 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function GhostReports({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 grid grid-cols-2 gap-4", className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-3">
          <div className="h-2 w-20 rounded bg-white/15" />
          <div className="h-8 w-24 rounded bg-white/25" />
          <div className="h-16 rounded bg-gradient-to-t from-violet-500/20 to-transparent border border-white/5" />
        </div>
      ))}
    </div>
  );
}

function GhostFiles({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 grid grid-cols-4 gap-3", className)}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-[3/4] rounded-lg bg-white/5 border border-white/10 p-3 flex flex-col gap-2">
          <div className="h-3/5 rounded bg-gradient-to-b from-white/10 to-transparent" />
          <div className="h-1.5 w-full rounded bg-white/20" />
          <div className="h-1.5 w-2/3 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

// section-id (as used in sidebar) → camelCase i18n key + ghost component
const MODULE_CONFIG: Record<string, { i18nKey: string; ghost: ComponentType<{ className?: string }> }> = {
  contacts: { i18nKey: "contacts", ghost: GhostTable },
  templates: { i18nKey: "templates", ghost: GhostFiles },
  calendar: { i18nKey: "calendar", ghost: GhostCalendar },
  "booking-calendar": { i18nKey: "bookingCalendar", ghost: GhostCalendar },
  budgetengine: { i18nKey: "budgetengine", ghost: GhostBudgetChart },
  runofshow: { i18nKey: "runofshow", ghost: GhostRunOfShow },
  team: { i18nKey: "team", ghost: GhostKanban },
  files: { i18nKey: "files", ghost: GhostFiles },
  reports: { i18nKey: "reports", ghost: GhostReports },
  guides: { i18nKey: "guides", ghost: GhostTable },
  "calendar-sync": { i18nKey: "calendarSync", ghost: GhostCalendar },
};

interface Props {
  sectionId: string;
  requiredTier: Tier;
  onUpgrade: () => void;
}

export function LockedModuleUpsell({ sectionId, requiredTier, onUpgrade }: Props) {
  const { t } = useTranslation();
  const cfg = MODULE_CONFIG[sectionId];
  const Ghost = cfg?.ghost ?? GhostTable;
  const mKey = cfg?.i18nKey ?? sectionId;

  const isEnterprise = requiredTier === "enterprise";
  const tierName = isEnterprise ? "Enterprise" : "Professional";
  const tierPrice = isEnterprise ? "149" : "49";
  const savings = isEnterprise ? "298" : "98";
  const gradient = isEnterprise
    ? "from-amber-500 via-orange-600 to-red-600"
    : "from-violet-600 via-pink-600 to-amber-500";
  const TierIcon = isEnterprise ? Crown : Star;
  const tierBadgeClass = isEnterprise
    ? "bg-amber-500/20 border-amber-500/40 text-amber-200"
    : "bg-violet-500/20 border-violet-500/40 text-violet-200";

  const title = t(`agency.locked.${mKey}.title`, sectionId);
  const hook = t(`agency.locked.${mKey}.hook`, "");
  const benefits = [0, 1, 2]
    .map((i) => t(`agency.locked.${mKey}.b${i}`, ""))
    .filter((s) => s.length > 0);
  const founderQuote = t("agency.locked.shared.founderQuote", "");
  const unlockLabel = t("agency.locked.shared.unlock", `Upgrade to ${tierName}`, { tier: tierName });
  const savingsLabel = t("agency.locked.shared.savingsLabel", "LAUNCH");
  const perMonth = t("agency.locked.shared.perMonth", "/ month");

  return (
    <div className="relative min-h-[75vh] rounded-3xl overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          filter: "blur(3px) saturate(0.6)",
          opacity: 0.5,
          maskImage: "linear-gradient(to bottom, black 0%, black 50%, transparent 92%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 50%, transparent 92%)",
        }}
      >
        <Ghost className="min-h-[75vh]" />
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(10,1,24,0.35) 0%, rgba(10,1,24,0.75) 55%, rgba(10,1,24,0.95) 100%)",
        }}
      />

      <div className="relative z-10 flex items-center justify-center min-h-[75vh] p-6">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg"
        >
          <div className={cn("absolute -inset-6 bg-gradient-to-br blur-3xl opacity-30 rounded-full", gradient)} />

          <div className="relative bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
            <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden">
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(236,72,153,0.6), transparent)",
                  animation: "shimmer 8s linear infinite",
                }}
              />
            </div>
            <style>{`@keyframes shimmer{0%{transform:translateX(-100%);}100%{transform:translateX(100%);}}`}</style>

            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className={cn("relative w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg", gradient)}>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br opacity-50 blur-md" />
                  <Lock className="relative w-5 h-5 text-white" />
                </div>
                <Badge className={cn("font-bold px-3 py-1", tierBadgeClass)}>
                  <TierIcon className="w-3.5 h-3.5 mr-1.5" />
                  {tierName}
                </Badge>
              </div>

              <h3 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight">
                {title}
              </h3>
              {hook && (
                <p className="text-white/70 text-base mb-6 leading-relaxed italic">
                  „{hook}"
                </p>
              )}

              {benefits.length > 0 && (
                <ul className="space-y-3 mb-7">
                  {benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={cn("mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br flex items-center justify-center", gradient)}>
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-white/85 text-sm leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="pt-6 border-t border-white/10">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-white/40 line-through text-base font-semibold">{savings}€</span>
                  <Badge className="bg-red-500/25 border-red-500/40 text-red-200 text-[10px] font-bold">-50% {savingsLabel}</Badge>
                </div>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-4xl font-black text-white">{tierPrice}</span>
                  <span className="text-xl font-bold text-white/80">€</span>
                  <span className="text-sm text-white/50 ml-1">{perMonth}</span>
                </div>

                <Button
                  onClick={onUpgrade}
                  size="lg"
                  className={cn(
                    "w-full bg-gradient-to-r text-white border-0 font-bold h-12 rounded-xl cursor-pointer transition-all",
                    gradient,
                    "hover:shadow-[0_16px_48px_rgba(236,72,153,0.5)]",
                  )}
                >
                  {unlockLabel}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                {founderQuote && (
                  <p className="text-center text-white/50 text-xs mt-4 italic">{founderQuote}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
