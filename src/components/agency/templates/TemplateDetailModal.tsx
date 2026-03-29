import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Heart, PartyPopper, Cake, Presentation, Music,
  ListChecks, Wallet, ClipboardList, Store, CheckCircle2, Calendar, TrendingUp, Clock,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventTemplate } from "@/hooks/useEventTemplates";

interface TemplateDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EventTemplate | null;
  onUse: (id: string) => void;
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
  corporate: "Corporate", wedding: "Wedding", jga: "JGA",
  birthday: "Birthday", conference: "Conference", festival: "Festival", other: "Other",
};

const includedItems = [
  { icon: ListChecks, label: "Timeline Items", key: "timeline_items", fallback: "8 items" },
  { icon: Wallet, label: "Budget Categories", key: "budget_categories", fallback: "5 categories" },
  { icon: ClipboardList, label: "Task Templates", key: "tasks", fallback: "12 tasks" },
  { icon: Store, label: "Vendor Suggestions", key: "vendors", fallback: "6 vendors" },
  { icon: CheckCircle2, label: "Checklists", key: "checklists", fallback: "15 items" },
];

export function TemplateDetailModal({ open, onOpenChange, template, onUse }: TemplateDetailModalProps) {
  if (!template) return null;

  const config = categoryConfig[template.category] || categoryConfig.other;
  const Icon = config.icon;
  const data = (template.template_data || {}) as Record<string, unknown>;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1625] border-white/10 text-white max-w-2xl p-0 overflow-hidden">
        {/* Gradient banner */}
        <div className={`relative h-36 bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
          <Icon className="w-16 h-16 text-white/80" />
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-white drop-shadow-lg">{template.name}</h2>
              <Badge variant="outline" className={`mt-1 text-xs ${config.badge} border bg-black/20 backdrop-blur-sm`}>
                {categoryLabels[template.category] || template.category}
              </Badge>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {template.description && (
            <p className="text-sm text-white/50">{template.description}</p>
          )}

          {/* What's Included */}
          <div>
            <h3 className="text-sm font-semibold text-white/80 mb-3">What's Included</h3>
            <div className="space-y-2">
              <AnimatePresence>
                {includedItems.map((item, i) => {
                  const count = data[item.key];
                  const display = count != null ? String(count) : item.fallback;
                  return (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 * i }}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]"
                    >
                      <div className="p-1.5 rounded-md bg-violet-500/10">
                        <item.icon className="w-4 h-4 text-violet-400" />
                      </div>
                      <span className="text-sm text-white/70 flex-1">{item.label}</span>
                      <span className="text-xs text-white/40 font-medium">{display}</span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 py-3 px-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
              <span>{template.times_used || 0}x used</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Clock className="w-3.5 h-3.5 text-violet-400" />
              <span>Last used {formatDate(template.created_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Calendar className="w-3.5 h-3.5 text-violet-400" />
              <span>Created {formatDate(template.created_at)}</span>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white cursor-pointer"
              onClick={() => { onUse(template.id); onOpenChange(false); }}
            >
              Use This Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
