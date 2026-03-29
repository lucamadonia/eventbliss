import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Heart, PartyPopper, Cake, Presentation, Music, TrendingUp, Pencil, Trash2, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventTemplate } from "@/hooks/useEventTemplates";

interface TemplateCardProps {
  template: EventTemplate;
  onUse: (id: string) => void;
  onEdit?: (template: EventTemplate) => void;
  onDelete?: (id: string) => void;
  onClick?: (template: EventTemplate) => void;
}

const categoryConfig: Record<string, { icon: typeof Building2; gradient: string; badge: string }> = {
  corporate: { icon: Building2, gradient: "from-blue-500 to-indigo-600", badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  wedding: { icon: Heart, gradient: "from-pink-500 to-rose-600", badge: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  jga: { icon: PartyPopper, gradient: "from-violet-500 to-purple-600", badge: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  birthday: { icon: Cake, gradient: "from-amber-500 to-orange-600", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  conference: { icon: Presentation, gradient: "from-cyan-500 to-blue-600", badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  festival: { icon: Music, gradient: "from-green-500 to-emerald-600", badge: "bg-green-500/20 text-green-300 border-green-500/30" },
  other: { icon: Building2, gradient: "from-slate-500 to-slate-600", badge: "bg-white/10 text-slate-300 border-white/20" },
};

const categoryLabels: Record<string, string> = {
  corporate: "Corporate",
  wedding: "Wedding",
  jga: "JGA",
  birthday: "Birthday",
  conference: "Conference",
  festival: "Festival",
  other: "Other",
};

function ComplexityDots({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i <= level ? "bg-violet-400" : "bg-white/10"}`}
        />
      ))}
    </div>
  );
}

export function TemplateCard({ template, onUse, onEdit, onDelete, onClick }: TemplateCardProps) {
  const [hovered, setHovered] = useState(false);
  const config = categoryConfig[template.category] || categoryConfig.other;
  const Icon = config.icon;

  const complexity = Math.min(3, Math.max(1, Math.ceil((template.times_used || 0) / 5) || 1));
  const lastUsedDate = template.created_at
    ? new Date(template.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })
    : null;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl overflow-hidden cursor-pointer group"
      style={{ boxShadow: hovered ? "0 20px 60px rgba(139,92,246,0.15)" : "none" }}
      onClick={() => onClick?.(template)}
    >
      {/* Gradient thumbnail */}
      <div className={`relative h-28 bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
        <Icon className="w-12 h-12 text-white/80" />

        {/* Hover overlay */}
        <motion.div
          initial={false}
          animate={{ opacity: hovered ? 1 : 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center gap-2"
        >
          <Button
            size="sm"
            className="bg-white text-black hover:bg-white/90 text-xs font-medium cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onUse(template.id); }}
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            Use Template
          </Button>
          {onEdit && (
            <Button size="icon" variant="ghost" className="w-8 h-8 text-white/80 hover:bg-white/20 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onEdit(template); }}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button size="icon" variant="ghost" className="w-8 h-8 text-red-400 hover:bg-red-500/20 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onDelete(template.id); }}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2.5">
        <h4 className="font-semibold text-white text-sm truncate">{template.name}</h4>
        <p className="text-xs text-white/40 line-clamp-2 min-h-[2rem]">
          {template.description || "No description provided"}
        </p>

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-[10px] ${config.badge}`}>
            {categoryLabels[template.category] || template.category}
          </Badge>
          <span className="flex items-center gap-1 text-[10px] text-white/30">
            <TrendingUp className="w-3 h-3" />
            {template.times_used || 0}x used
          </span>
          <ComplexityDots level={complexity} />
        </div>

        {/* Footer */}
        {lastUsedDate && (
          <p className="text-[10px] text-white/20 pt-1 border-t border-white/[0.06]">
            Last used {lastUsedDate}
          </p>
        )}
      </div>
    </motion.div>
  );
}
