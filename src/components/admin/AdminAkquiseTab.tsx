import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Kanban, Megaphone, Table2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import AkquiseDashboard from "@/components/admin/AkquiseDashboard";
import AkquisePipelineKanban from "@/components/admin/AkquisePipelineKanban";
import AkquiseCampaignManager from "@/components/admin/AkquiseCampaignManager";
import AkquiseAgencyTable from "@/components/admin/AkquiseAgencyTable";
import AkquiseAgencyDetail from "@/components/admin/AkquiseAgencyDetail";

type SubTab = "dashboard" | "pipeline" | "campaigns" | "table";

const SUB_TABS: { key: SubTab; labelKey: string; defaultLabel: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", labelKey: "admin.akquise.tabDashboard", defaultLabel: "Dashboard", icon: LayoutDashboard },
  { key: "pipeline", labelKey: "admin.akquise.tabPipeline", defaultLabel: "Pipeline", icon: Kanban },
  { key: "campaigns", labelKey: "admin.akquise.tabCampaigns", defaultLabel: "Kampagnen", icon: Megaphone },
  { key: "table", labelKey: "admin.akquise.tabTable", defaultLabel: "Tabelle", icon: Table2 },
];

export default function AdminAkquiseTab() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SubTab>("dashboard");
  const [selectedAgencyId, setSelectedAgencyId] = useState<number | null>(null);

  const openAgencyDetail = (id: number) => setSelectedAgencyId(id);
  const closeAgencyDetail = () => setSelectedAgencyId(null);

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
          {t("admin.akquise.title", "Agentur-Akquise CRM")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("admin.akquise.subtitle", "Outreach, Pipeline & Kampagnen verwalten")}
        </p>
      </motion.div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10 w-fit">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.key
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {t(tab.labelKey, tab.defaultLabel)}
          </button>
        ))}
      </div>

      {/* Sub-view */}
      <div>
        {activeTab === "dashboard" && <AkquiseDashboard onOpenAgency={openAgencyDetail} />}
        {activeTab === "pipeline" && <AkquisePipelineKanban onOpenAgency={openAgencyDetail} />}
        {activeTab === "campaigns" && <AkquiseCampaignManager />}
        {activeTab === "table" && <AkquiseAgencyTable onOpenAgency={openAgencyDetail} />}
      </div>

      {/* Agency detail slide-over */}
      <AnimatePresence>
        {selectedAgencyId !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={closeAgencyDetail}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full md:w-[600px] bg-[#070012] border-l border-white/10 overflow-y-auto"
            >
              <AkquiseAgencyDetail agencyId={selectedAgencyId} onClose={closeAgencyDetail} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
