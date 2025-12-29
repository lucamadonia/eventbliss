import { useState } from "react";
import { MessageSquare, Copy, Check, ExternalLink, Send, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import type { EventData } from "@/hooks/useEvent";

interface MessagesTabProps {
  event: EventData;
  slug: string;
}

interface MessageTemplate {
  id: string;
  emoji: string;
  titleKey: string;
  descriptionKey: string;
  templateKey: string;
}

const TEMPLATE_IDS: MessageTemplate[] = [
  {
    id: "kickoff",
    emoji: "🎉",
    titleKey: "messages.templates.kickoff.title",
    descriptionKey: "messages.templates.kickoff.description",
    templateKey: "messages.templates.kickoff.template",
  },
  {
    id: "reminder",
    emoji: "⏰",
    titleKey: "messages.templates.reminder.title",
    descriptionKey: "messages.templates.reminder.description",
    templateKey: "messages.templates.reminder.template",
  },
  {
    id: "deadline",
    emoji: "🚨",
    titleKey: "messages.templates.deadline.title",
    descriptionKey: "messages.templates.deadline.description",
    templateKey: "messages.templates.deadline.template",
  },
  {
    id: "dateConfirmed",
    emoji: "🔒",
    titleKey: "messages.templates.dateConfirmed.title",
    descriptionKey: "messages.templates.dateConfirmed.description",
    templateKey: "messages.templates.dateConfirmed.template",
  },
  {
    id: "budget",
    emoji: "💸",
    titleKey: "messages.templates.budget.title",
    descriptionKey: "messages.templates.budget.description",
    templateKey: "messages.templates.budget.template",
  },
  {
    id: "packingList",
    emoji: "🧳",
    titleKey: "messages.templates.packingList.title",
    descriptionKey: "messages.templates.packingList.description",
    templateKey: "messages.templates.packingList.template",
  },
];

export const MessagesTab = ({ event, slug }: MessagesTabProps) => {
  const { t } = useTranslation();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const surveyLink = `${window.location.origin}/e/${slug}`;
  const accessCode = event.access_code || "STAG2025";

  const getTemplateText = (templateKey: string) => {
    return t(templateKey, {
      honoree: event.honoree_name,
      surveyLink,
      accessCode,
      eventDate: event.event_date || "[DATE]",
      responseCount: "X",
      totalCount: "Y",
      deadline: "[DEADLINE]",
      budgetPerPerson: "[AMOUNT]",
      depositAmount: "[DEPOSIT]",
      depositDeadline: "[DATE]",
      cashAmount: "[AMOUNT]",
    });
  };

  const handleCopy = async (template: MessageTemplate) => {
    try {
      const text = getTemplateText(template.templateKey);
      await navigator.clipboard.writeText(text);
      setCopiedId(template.id);
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

      {/* Templates */}
      <div className="space-y-4">
        {TEMPLATE_IDS.map((template) => {
          const templateText = getTemplateText(template.templateKey);
          
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
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold">{t(template.titleKey)}</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(template)}
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
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <pre className="text-xs whitespace-pre-wrap font-sans text-muted-foreground">
                      {templateText.slice(0, 180)}...
                    </pre>
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
    </div>
  );
};
