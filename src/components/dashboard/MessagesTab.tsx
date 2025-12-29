import { useState } from "react";
import { MessageSquare, Copy, Check, ExternalLink, Send, Sparkles, ChevronDown, ChevronUp, Wand2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { format } from "date-fns";
import { de, enUS, es, fr, it, nl, pt, pl, tr, ar, Locale } from "date-fns/locale";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { EventData, Participant } from "@/hooks/useEvent";

interface MessagesTabProps {
  event: EventData;
  slug: string;
  participants?: Participant[];
  responseCount?: number;
}

interface MessageTemplate {
  id: string;
  emoji: string;
  titleKey: string;
  descriptionKey: string;
  templateKey: string;
  category: "before" | "planning" | "confirmed" | "after";
}

type EnhancementType = "casual" | "formal" | "shorter" | "detailed" | "custom";

const localeMap: Record<string, Locale> = {
  de, en: enUS, es, fr, it, nl, pt, pl, tr, ar,
};

const TEMPLATE_IDS: MessageTemplate[] = [
  // Before Event - Initial Phase
  {
    id: "kickoff",
    emoji: "🎉",
    titleKey: "messages.templates.kickoff.title",
    descriptionKey: "messages.templates.kickoff.description",
    templateKey: "messages.templates.kickoff.template",
    category: "before",
  },
  {
    id: "welcome",
    emoji: "👋",
    titleKey: "messages.templates.welcome.title",
    descriptionKey: "messages.templates.welcome.description",
    templateKey: "messages.templates.welcome.template",
    category: "before",
  },
  {
    id: "reminder",
    emoji: "⏰",
    titleKey: "messages.templates.reminder.title",
    descriptionKey: "messages.templates.reminder.description",
    templateKey: "messages.templates.reminder.template",
    category: "before",
  },
  {
    id: "deadline",
    emoji: "🚨",
    titleKey: "messages.templates.deadline.title",
    descriptionKey: "messages.templates.deadline.description",
    templateKey: "messages.templates.deadline.template",
    category: "before",
  },
  // Planning Phase
  {
    id: "dateConfirmed",
    emoji: "📅",
    titleKey: "messages.templates.dateConfirmed.title",
    descriptionKey: "messages.templates.dateConfirmed.description",
    templateKey: "messages.templates.dateConfirmed.template",
    category: "planning",
  },
  {
    id: "budget",
    emoji: "💸",
    titleKey: "messages.templates.budget.title",
    descriptionKey: "messages.templates.budget.description",
    templateKey: "messages.templates.budget.template",
    category: "planning",
  },
  {
    id: "locationShare",
    emoji: "📍",
    titleKey: "messages.templates.locationShare.title",
    descriptionKey: "messages.templates.locationShare.description",
    templateKey: "messages.templates.locationShare.template",
    category: "planning",
  },
  // Confirmed Phase
  {
    id: "finalDetails",
    emoji: "✅",
    titleKey: "messages.templates.finalDetails.title",
    descriptionKey: "messages.templates.finalDetails.description",
    templateKey: "messages.templates.finalDetails.template",
    category: "confirmed",
  },
  {
    id: "packingList",
    emoji: "🎒",
    titleKey: "messages.templates.packingList.title",
    descriptionKey: "messages.templates.packingList.description",
    templateKey: "messages.templates.packingList.template",
    category: "confirmed",
  },
  // After Event
  {
    id: "thankYou",
    emoji: "🙏",
    titleKey: "messages.templates.thankYou.title",
    descriptionKey: "messages.templates.thankYou.description",
    templateKey: "messages.templates.thankYou.template",
    category: "after",
  },
];

const CATEGORY_INFO: Record<string, { labelKey: string; color: string }> = {
  before: { labelKey: "messages.categories.before", color: "bg-blue-500/20 text-blue-400" },
  planning: { labelKey: "messages.categories.planning", color: "bg-amber-500/20 text-amber-400" },
  confirmed: { labelKey: "messages.categories.confirmed", color: "bg-green-500/20 text-green-400" },
  after: { labelKey: "messages.categories.after", color: "bg-purple-500/20 text-purple-400" },
};

const ENHANCEMENT_OPTIONS: { type: EnhancementType; labelKey: string; emoji: string }[] = [
  { type: "casual", labelKey: "messages.ai.casual", emoji: "😊" },
  { type: "formal", labelKey: "messages.ai.formal", emoji: "👔" },
  { type: "shorter", labelKey: "messages.ai.shorter", emoji: "✂️" },
  { type: "detailed", labelKey: "messages.ai.detailed", emoji: "📝" },
  { type: "custom", labelKey: "messages.ai.custom", emoji: "✨" },
];

export const MessagesTab = ({ event, slug, participants = [], responseCount = 0 }: MessagesTabProps) => {
  const { t, i18n } = useTranslation();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // AI Enhancement State
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [enhancementType, setEnhancementType] = useState<EnhancementType>("casual");
  const [customInstruction, setCustomInstruction] = useState("");
  const [enhancedText, setEnhancedText] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);

  const currentLocale = localeMap[i18n.language] || de;
  const surveyLink = `${window.location.origin}/e/${slug}`;
  const accessCode = event.access_code || "STAG2025";
  const totalCount = participants.length;

  // Format event date if available
  const formattedEventDate = event.event_date 
    ? format(new Date(event.event_date), "EEEE, d. MMMM yyyy", { locale: currentLocale })
    : t('messages.placeholders.dateNotSet');

  // Format deadline if available
  const formattedDeadline = event.survey_deadline
    ? format(new Date(event.survey_deadline), "d. MMMM yyyy", { locale: currentLocale })
    : t('messages.placeholders.deadlineNotSet');

  const getTemplateText = (templateKey: string) => {
    return t(templateKey, {
      honoree: event.honoree_name,
      surveyLink,
      accessCode,
      eventDate: formattedEventDate,
      responseCount: responseCount.toString(),
      totalCount: totalCount.toString(),
      deadline: formattedDeadline,
      budgetPerPerson: "XXX",
      depositAmount: "XX",
      depositDeadline: formattedDeadline,
      cashAmount: "XXX",
      eventName: event.name,
      destination: "[" + t('messages.placeholders.destination') + "]",
      meetingPoint: "[" + t('messages.placeholders.meetingPoint') + "]",
      meetingTime: "[" + t('messages.placeholders.meetingTime') + "]",
    });
  };

  const handleCopy = async (text: string, templateId?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (templateId) setCopiedId(templateId);
      toast.success(t('notifications.messageCopied'));
      
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error(t('notifications.errorOccurred'));
    }
  };

  const handleWhatsApp = (template: MessageTemplate) => {
    const text = getTemplateText(template.templateKey);
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const openAiDialog = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setEnhancedText("");
    setCustomInstruction("");
    setEnhancementType("casual");
    setAiDialogOpen(true);
  };

  const handleEnhance = async () => {
    if (!selectedTemplate) return;
    
    setIsEnhancing(true);
    try {
      const originalText = getTemplateText(selectedTemplate.templateKey);
      
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: "message_enhance",
          context: {
            event_type: event.event_type,
            honoree_name: event.honoree_name,
            participant_count: totalCount,
            original_text: originalText,
            enhancement_type: enhancementType,
            custom_instruction: enhancementType === "custom" ? customInstruction : undefined,
            template_type: selectedTemplate.id,
          },
        },
      });

      if (error) throw error;
      
      if (data?.success && data?.response) {
        setEnhancedText(data.response);
      } else {
        throw new Error(data?.error || "Unknown error");
      }
    } catch (error) {
      console.error("AI enhancement error:", error);
      toast.error(t('messages.ai.error'));
    } finally {
      setIsEnhancing(false);
    }
  };

  const filteredTemplates = selectedCategory 
    ? TEMPLATE_IDS.filter(t => t.category === selectedCategory)
    : TEMPLATE_IDS;

  const categories = ["before", "planning", "confirmed", "after"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold">{t('messages.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('messages.subtitle')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-background/30">
          <div>
            <p className="text-xs text-muted-foreground">{t('messages.surveyLink')}</p>
            <code className="text-xs text-primary break-all">{surveyLink}</code>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('messages.accessCode')}</p>
            <code className="text-xs text-primary">{accessCode}</code>
          </div>
        </div>
      </GlassCard>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          {t('common.all')}
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className={selectedCategory === cat ? "" : CATEGORY_INFO[cat].color}
          >
            {t(CATEGORY_INFO[cat].labelKey)}
          </Button>
        ))}
      </div>

      {/* Templates */}
      <div className="space-y-4">
        {filteredTemplates.map((template) => {
          const templateText = getTemplateText(template.templateKey);
          const isExpanded = expandedId === template.id;
          
          return (
            <GlassCard
              key={template.id}
              className="p-4 hover:bg-background/30 transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl p-2 bg-muted/30 rounded-xl group-hover:bg-primary/20 transition-colors">
                  {template.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold">{t(template.titleKey)}</h4>
                      <Badge variant="secondary" className={CATEGORY_INFO[template.category].color}>
                        {t(CATEGORY_INFO[template.category].labelKey)}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAiDialog(template)}
                        className="text-xs text-primary hover:text-primary"
                        title={t('messages.ai.enhance')}
                      >
                        <Wand2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(templateText, template.id)}
                        className="text-xs"
                      >
                        {copiedId === template.id ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleWhatsApp(template)}
                        className="text-xs text-green-400 hover:text-green-300"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t(template.descriptionKey)}
                  </p>
                  
                  {/* Preview */}
                  <div 
                    className="p-3 rounded-lg bg-muted/30 border border-border cursor-pointer"
                    onClick={() => toggleExpand(template.id)}
                  >
                    <pre className="text-xs whitespace-pre-wrap font-sans text-muted-foreground">
                      {isExpanded ? templateText : templateText.slice(0, 200) + (templateText.length > 200 ? "..." : "")}
                    </pre>
                    {templateText.length > 200 && (
                      <div className="flex items-center justify-center mt-2 text-xs text-primary">
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" />
                            {t('messages.showLess')}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" />
                            {t('messages.showMore')}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Pro Tip */}
      <GlassCard className="p-4 border-primary/30">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">{t('messages.proTip.title')}</h4>
            <p className="text-xs text-muted-foreground">
              {t('messages.proTip.description')}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Quick Actions */}
      <GlassCard className="p-4">
        <h4 className="font-bold text-sm mb-3">{t('messages.quickActions.title')}</h4>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(surveyLink);
              toast.success(t('notifications.linkCopied'));
            }}
          >
            <Copy className="w-4 h-4 mr-2" />
            {t('messages.quickActions.copySurveyLink')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(accessCode);
              toast.success(t('notifications.codeCopied'));
            }}
          >
            <Copy className="w-4 h-4 mr-2" />
            {t('messages.quickActions.copyAccessCode')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(surveyLink, "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {t('messages.quickActions.openSurvey')}
          </Button>
        </div>
      </GlassCard>

      {/* AI Enhancement Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              {t('messages.ai.dialogTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('messages.ai.dialogDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Enhancement Options */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t('messages.ai.selectStyle')}</label>
              <div className="flex flex-wrap gap-2">
                {ENHANCEMENT_OPTIONS.map((option) => (
                  <Button
                    key={option.type}
                    variant={enhancementType === option.type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEnhancementType(option.type)}
                  >
                    <span className="mr-1">{option.emoji}</span>
                    {t(option.labelKey)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Instruction (if custom selected) */}
            {enhancementType === "custom" && (
              <div>
                <label className="text-sm font-medium mb-2 block">{t('messages.ai.customPrompt')}</label>
                <Textarea
                  placeholder={t('messages.ai.customPlaceholder')}
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            )}

            {/* Original Text Preview */}
            {selectedTemplate && (
              <div>
                <label className="text-sm font-medium mb-2 block">{t('messages.ai.originalText')}</label>
                <div className="p-3 rounded-lg bg-muted/30 border border-border max-h-[150px] overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap font-sans text-muted-foreground">
                    {getTemplateText(selectedTemplate.templateKey)}
                  </pre>
                </div>
              </div>
            )}

            {/* Enhance Button */}
            <Button 
              onClick={handleEnhance} 
              disabled={isEnhancing || (enhancementType === "custom" && !customInstruction.trim())}
              className="w-full"
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('messages.ai.enhancing')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t('messages.ai.generateButton')}
                </>
              )}
            </Button>

            {/* Enhanced Result */}
            {enhancedText && (
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  {t('messages.ai.result')}
                </label>
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <pre className="text-sm whitespace-pre-wrap font-sans">
                    {enhancedText}
                  </pre>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button 
                    onClick={() => handleCopy(enhancedText)}
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {t('common.copy')}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const encoded = encodeURIComponent(enhancedText);
                      window.open(`https://wa.me/?text=${encoded}`, "_blank");
                    }}
                    className="text-green-400"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
