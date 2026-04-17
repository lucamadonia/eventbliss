import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventTemplates, EventTemplate } from "@/hooks/useEventTemplates";
import { AddTemplateDialog, TemplateFormData } from "@/components/agency/dialogs/AddTemplateDialog";
import { TemplateCategoryFilter } from "./templates/TemplateCategoryFilter";
import { TemplateCard } from "./templates/TemplateCard";
import { TemplateDetailModal } from "./templates/TemplateDetailModal";
import { TemplateRecommendations } from "./templates/TemplateRecommendations";

export function AgencyTemplates() {
  const { templates, isLoading, createTemplate, deleteTemplate, useTemplate } = useEventTemplates();

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Filter templates by category and search query
  const filtered = useMemo(() => {
    let result = templates;

    if (activeCategory !== "all") {
      result = result.filter((t) => t.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    return result;
  }, [templates, activeCategory, searchQuery]);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    templates.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [templates]);

  // Handle create from AddTemplateDialog
  const handleCreate = async (data: TemplateFormData) => {
    await createTemplate({
      name: data.name,
      description: data.description || undefined,
      category: data.category,
      event_type: data.eventType,
    });
  };

  // Handle use template
  const handleUse = async (id: string) => {
    await useTemplate(id);
  };

  // Handle delete template
  const handleDelete = async (id: string) => {
    await deleteTemplate(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h3 className="text-lg font-semibold text-white">Event-Vorlagen</h3>
          <p className="text-sm text-white/40">{templates.length} Vorlagen verfügbar</p>
        </div>
        <Button
          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white cursor-pointer"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Vorlage erstellen
        </Button>
      </motion.div>

      {/* Recommendations */}
      {!isLoading && templates.length > 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <TemplateRecommendations
            templates={templates}
            onUseTemplate={handleUse}
            onClickTemplate={setSelectedTemplate}
          />
        </motion.div>
      )}

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <TemplateCategoryFilter
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categoryCounts={categoryCounts}
        />
      </motion.div>

      {/* Template Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64 bg-white/5 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="p-4 rounded-full bg-white/[0.04] border border-white/[0.08] mb-4">
            <FileText className="w-8 h-8 text-white/20" />
          </div>
          <h4 className="text-sm font-medium text-white/50 mb-1">Keine Vorlagen gefunden</h4>
          <p className="text-xs text-white/30 max-w-xs">
            {searchQuery
              ? "Versuche einen anderen Suchbegriff oder aendere die Kategorie."
              : "Erstelle deine erste Vorlage, um loszulegen."}
          </p>
          {!searchQuery && (
            <Button
              size="sm"
              className="mt-4 bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Vorlage erstellen
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tpl, i) => (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.04 }}
            >
              <TemplateCard
                template={tpl}
                onUse={handleUse}
                onDelete={handleDelete}
                onClick={setSelectedTemplate}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <TemplateDetailModal
        open={selectedTemplate !== null}
        onOpenChange={(open) => { if (!open) setSelectedTemplate(null); }}
        template={selectedTemplate}
        onUse={handleUse}
      />

      {/* Create Dialog */}
      <AddTemplateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={handleCreate}
      />
    </div>
  );
}
