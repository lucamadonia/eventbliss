import { Compass, Gift, Lightbulb, MapPin, Martini, Music2 } from "lucide-react";
import type { PinCategory } from "@/hooks/useIdeaBoard";
import { cn } from "@/lib/utils";

const COLORS: Record<PinCategory, string> = {
  deko: "text-rose-300",
  outfit: "text-violet-300",
  food: "text-amber-300",
  drinks: "text-cyan-300",
  activity: "text-orange-300",
  location: "text-emerald-300",
  gift: "text-pink-300",
  playlist: "text-indigo-300",
  other: "text-slate-300",
};

export function IdeaCategoryIcon({ category, className }: { category: PinCategory; className?: string }) {
  const base = cn("h-5 w-5", COLORS[category], className);
  if (category === "deko") return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 5.5c5.7 5.8 13.3 5.8 19 0" />
      <path d="m5.5 7.8 1.1 5 3-3.3M11 9.3l1.2 5 2.9-5M17 8.3l1.2 4.5 2.1-5.5" />
      <path d="M4 17h.01M12 19h.01M20 16h.01" strokeWidth="2.5" />
    </svg>
  );
  if (category === "outfit") return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 5a2 2 0 1 1 3.1 1.7L12 8v1.5" />
      <path d="m12 9.5 8.5 7a1.7 1.7 0 0 1-1.1 3H4.6a1.7 1.7 0 0 1-1.1-3l8.5-7Z" />
      <path d="m18.7 5 .4 1.3 1.3.4-1.3.4-.4 1.3-.4-1.3-1.3-.4 1.3-.4.4-1.3Z" />
    </svg>
  );
  if (category === "food") return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="3.5" />
      <path d="M3 4v5a2 2 0 0 0 2 2v9M5 4v5M7 4v5M21 4c-2 1.3-3 3.3-3 6v2h3V4Zm0 8v8" />
    </svg>
  );
  const Icon = ({ drinks: Martini, activity: Compass, location: MapPin, gift: Gift, playlist: Music2, other: Lightbulb } as const)[category];
  return <Icon className={base} strokeWidth={1.8} aria-hidden="true" />;
}
