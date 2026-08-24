import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { Trophy, Map as MapIcon, PartyPopper, Gamepad2, Tv, BookOpen } from "lucide-react";

import { useHaptics } from "@/hooks/useHaptics";
import { cn } from "@/lib/utils";
import { getTvView, setTvView, subscribeTvView, tvViewServerSnapshot, type TvView } from "@/games/tv/tv-view";

/**
 * TVRemote — die Erlebnis-Ansichten des Fernsehers vom Telefon aus schalten.
 *
 * WARUM ES DAS GIBT: Bis hierher war die Nacht-Route nur ueber einen
 * unsichtbaren Klick auf den Fernseher erreichbar, der Zwischenstand nur
 * automatisch zwischen zwei Spielen, und die fertig gebaute Siegerehrung
 * (`TVPartyFinale`) wurde von NIRGENDWO ausgeloest. Es gab schlicht keine
 * Bedienung.
 *
 * Umschalten heisst hier nur: `setTvView`. Gesendet wird die Ansicht von den
 * ohnehin laufenden Broadcasts (`useTVGameBridge`), damit sie den naechsten
 * Spielzustand ueberlebt. Kein Eingriff in irgendein Spiel — gespielt wird
 * weiterhin auf dem Telefon.
 */
export interface TVRemoteProps {
  /** Ohne verbundenen Fernseher waere die Leiste eine Luege. */
  isActive: boolean;
  /** Kompakt fuer die schwebende Pille, breit fuer die Lobby-Karte. */
  variant?: "compact" | "card";
  className?: string;
}

const VIEWS: { view: TvView; key: string; Icon: typeof Trophy }[] = [
  { view: "between", key: "standings", Icon: Trophy },
  { view: "map", key: "map", Icon: MapIcon },
  { view: "rules", key: "rules", Icon: BookOpen },
  { view: "finale", key: "finale", Icon: PartyPopper },
  { view: "intro", key: "intro", Icon: Tv },
  { view: "ingame", key: "game", Icon: Gamepad2 },
];

export function TVRemote({ isActive, variant = "compact", className }: TVRemoteProps) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const view = useSyncExternalStore(subscribeTvView, getTvView, tvViewServerSnapshot);

  if (!isActive) return null;

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      {VIEWS.map(({ view: v, key, Icon }) => {
        const active = view === v;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={active}
            onClick={() => { haptics.light(); setTvView(v); }}
            className={cn(
              "cursor-pointer min-h-[44px] rounded-xl border px-3 flex items-center gap-2 text-xs font-semibold transition-colors",
              // Der letzte Eintrag ("zum Spiel") bekommt die volle Breite: Er ist
              // der Rueckweg und soll nicht mit den Ansichten verwechselt werden.
              v === "ingame" && "col-span-2 justify-center",
              active
                ? "bg-[#df8eff]/15 border-[#df8eff]/45 text-violet-500 dark:text-[#df8eff]"
                : "bg-foreground/5 border-border text-muted-foreground active:bg-foreground/10",
              variant === "card" && "min-h-[48px] text-sm"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden />
            <span className="truncate">{t(`tv.remote.${key}`)}</span>
          </button>
        );
      })}
    </div>
  );
}
