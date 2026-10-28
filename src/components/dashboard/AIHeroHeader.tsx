import { useTranslation } from "react-i18next";
import { ArrowUpRight, CalendarDays, Check, Compass, MapPin, Users, WandSparkles } from "lucide-react";
import { CreditIndicator } from "@/components/ai/CreditIndicator";

interface AIHeroHeaderProps {
  eventName?: string;
  eventType?: string;
  city?: string;
  honoreeName?: string;
  participantCount?: number;
  surveyResponses?: number;
  isLoadingResponses?: boolean;
  onGeneratePlan: () => void;
  disabled?: boolean;
  credits: { used: number; limit: number; remaining: number; resetDate: Date; loading?: boolean };
  creditsAnimating?: boolean;
}

export default function AIHeroHeader({
  eventName, eventType, city, honoreeName, participantCount,
  surveyResponses = 0, isLoadingResponses, onGeneratePlan, disabled,
  credits, creditsAnimating,
}: AIHeroHeaderProps) {
  const { t, i18n } = useTranslation();
  const de = i18n.language.toLowerCase().startsWith("de");
  const destination = city?.replace(/^(?:de|en|es|fr|it|nl|pl|pt|tr|ar)_/i, "").replace(/_/g, " ");
  const hasDestination = destination && !/^(city|either)$/i.test(destination);
  const answers = isLoadingResponses ? "…" : String(surveyResponses);

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[#a69bd6]/20 bg-[#151321] text-white shadow-[0_18px_60px_-32px_rgba(103,74,194,.6)]">
      <div aria-hidden="true" className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#6146ae]/30 blur-[70px]" />
      <div aria-hidden="true" className="absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-[#287e88]/20 blur-[80px]" />
      <div className="relative p-5 sm:p-8">
        <div className="mb-7 flex items-start justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-3 py-1.5 text-[11px] font-semibold tracking-[.14em] uppercase text-[#d4c9ff]">
            <WandSparkles className="h-3.5 w-3.5" />
            {de ? "Dein Planungsstudio" : "Your planning studio"}
          </div>
          <CreditIndicator used={credits.used} limit={credits.limit} remaining={credits.remaining} resetDate={credits.resetDate} loading={credits.loading} variant="compact" showAnimation={creditsAnimating} />
        </div>

        <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-xl">
            <p className="mb-2 flex items-center gap-2 text-xs font-medium text-[#b9aee4]">
              <Compass className="h-3.5 w-3.5" />
              {eventType ? t(`eventTypes.${eventType}`, eventType) : de ? "Dein Event" : "Your event"}
            </p>
            <h2 className="text-[clamp(1.8rem,5vw,3.2rem)] font-semibold leading-[1.08] tracking-[-.04em]">
              {de ? "Aus Antworten wird" : "Turn answers into"}<br />
              <span className="text-[#cbb8ff]">{de ? "ein Erlebnis." : "an experience."}</span>
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/65">
              {de
                ? `${eventName || "Dein Event"}${honoreeName ? ` für ${honoreeName}` : ""}: Wir verbinden Wünsche aus dem Formular mit Zeitplan, Budget und passenden Erlebnissen.`
                : `${eventName || "Your event"}${honoreeName ? ` for ${honoreeName}` : ""}: Turn survey preferences into a schedule, budget and matching experiences.`}
            </p>
          </div>
          <button type="button" disabled={disabled} onClick={onGeneratePlan} className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-[#d9c9ff] px-5 py-3 text-sm font-bold text-[#201338] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">
            <CalendarDays className="h-5 w-5" />
            {surveyResponses > 0 ? (de ? "Plan aus Antworten erstellen" : "Create plan from answers") : (de ? "Ersten Entwurf erstellen" : "Create first draft")}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 text-xs sm:gap-4">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-1.5 text-white/45"><Check className="h-3.5 w-3.5" />{de ? "Antworten" : "Answers"}</div>
            <strong className="block truncate text-base font-semibold">{answers}</strong>
          </div>
          <div className="min-w-0 border-l border-white/10 pl-3 sm:pl-5">
            <div className="mb-1 flex items-center gap-1.5 text-white/45"><Users className="h-3.5 w-3.5" />{de ? "Eingeladen" : "Invited"}</div>
            <strong className="block truncate text-base font-semibold">{participantCount ?? "—"}</strong>
          </div>
          <div className="min-w-0 border-l border-white/10 pl-3 sm:pl-5">
            <div className="mb-1 flex items-center gap-1.5 text-white/45"><MapPin className="h-3.5 w-3.5" />{de ? "Ziel" : "Destination"}</div>
            <strong className="block truncate text-base font-semibold capitalize">{hasDestination ? destination : "—"}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
