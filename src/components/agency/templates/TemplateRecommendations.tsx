import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Clock } from "lucide-react";
import { EventTemplate } from "@/hooks/useEventTemplates";
import { TemplateCard } from "./TemplateCard";

interface TemplateRecommendationsProps {
  templates: EventTemplate[];
  onUseTemplate: (id: string) => void;
  onClickTemplate?: (template: EventTemplate) => void;
}

interface SectionProps {
  title: string;
  icon: typeof Sparkles;
  items: EventTemplate[];
  onUse: (id: string) => void;
  onClick?: (template: EventTemplate) => void;
}

function RecommendationSection({ title, icon: Icon, items, onUse, onClick }: SectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-violet-400" />
        <h4 className="text-sm font-semibold text-white/70">{title}</h4>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((tpl, i) => (
          <motion.div
            key={tpl.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="w-[260px] shrink-0"
          >
            <TemplateCard
              template={tpl}
              onUse={onUse}
              onClick={onClick}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function TemplateRecommendations({ templates, onUseTemplate, onClickTemplate }: TemplateRecommendationsProps) {
  const { recommended, popular, recent } = useMemo(() => {
    if (templates.length < 4) {
      return { recommended: [], popular: [], recent: [] };
    }

    // Find most common category for "recommended"
    const categoryCounts: Record<string, number> = {};
    templates.forEach((t) => {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });
    const topCategory = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    const recommended = topCategory
      ? templates.filter((t) => t.category === topCategory).slice(0, 4)
      : [];

    // Popular: sorted by times_used descending
    const popular = [...templates]
      .sort((a, b) => (b.times_used || 0) - (a.times_used || 0))
      .slice(0, 4);

    // Recently added: sorted by created_at descending
    const recent = [...templates]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 4);

    return { recommended, popular, recent };
  }, [templates]);

  if (templates.length < 4) return null;

  return (
    <div className="space-y-6">
      <RecommendationSection
        title="Recommended for You"
        icon={Sparkles}
        items={recommended}
        onUse={onUseTemplate}
        onClick={onClickTemplate}
      />
      <RecommendationSection
        title="Popular"
        icon={TrendingUp}
        items={popular}
        onUse={onUseTemplate}
        onClick={onClickTemplate}
      />
      <RecommendationSection
        title="Recently Added"
        icon={Clock}
        items={recent}
        onUse={onUseTemplate}
        onClick={onClickTemplate}
      />
    </div>
  );
}
