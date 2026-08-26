/**
 * Influencer im Adminbereich — die Huelle mit vier Reitern.
 *
 * BEWUSST GETRENNT VON DER AGENTUR-AKQUISE. Beide Programme laufen nach
 * demselben Muster, aber mit anderen Groessen: eine Agentur hat eine Stadt und
 * ein Angebot, ein Influencer hat eine Plattform und eine Reichweite. Eine
 * gemeinsame Liste haette bei jedem Eintrag die Haelfte der Spalten leer.
 *
 * Aufbau wie AdminAkquiseTab: eine schmale Huelle, die Reiter umschaltet, und
 * pro Reiter eine eigene Datei. Keine 1500-Zeilen-Komponente.
 */
import { useState } from "react";
import { ClipboardCheck, LayoutDashboard, Settings2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import InfluencerOverview from "./InfluencerOverview";
import InfluencerDirectory from "./InfluencerDirectory";
import InfluencerDeliverables from "./InfluencerDeliverables";
import InfluencerGroups from "./InfluencerGroups";

const TABS = [
  { key: "overview", label: "Übersicht", icon: LayoutDashboard },
  { key: "directory", label: "Influencer", icon: Users },
  { key: "deliverables", label: "Leistungen", icon: ClipboardCheck },
  { key: "groups", label: "Gruppen & Pakete", icon: Settings2 },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function InfluencerTab() {
  const [tab, setTab] = useState<TabKey>("directory");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && <InfluencerOverview onJump={() => setTab("directory")} />}
      {tab === "directory" && <InfluencerDirectory />}
      {tab === "deliverables" && <InfluencerDeliverables />}
      {tab === "groups" && <InfluencerGroups />}
    </div>
  );
}
