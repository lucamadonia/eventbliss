import { useState } from "react";
import { MessageSquare, Copy, Check, ExternalLink, Send } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Button } from "@/components/ui/button";
import type { EventData } from "@/hooks/useEvent";

interface MessagesTabProps {
  event: EventData;
  slug: string;
}

interface MessageTemplate {
  id: string;
  emoji: string;
  title: string;
  description: string;
  template: string;
}

export const MessagesTab = ({ event, slug }: MessagesTabProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const surveyLink = `${window.location.origin}/e/${slug}`;
  const dashboardLink = `${window.location.origin}/e/${slug}/dashboard`;
  const accessCode = (event.settings as Record<string, unknown>)?.access_code as string || "STAG2025";

  const templates: MessageTemplate[] = [
    {
      id: "kickoff",
      emoji: "🎉",
      title: "Kickoff-Nachricht",
      description: "Erste Einladung an die Gruppe",
      template: `Hey Jungs! 🎉

Es ist soweit - wir planen den JGA für ${event.honoree_name}! 🥳

Bitte füllt alle das kurze Formular aus (dauert nur 2 Min):
👉 ${surveyLink}

Gruppencode: ${accessCode}

Je schneller alle antworten, desto besser können wir planen. 
Deadline wird noch bekannt gegeben!

Los geht's! 💪`,
    },
    {
      id: "reminder",
      emoji: "⏰",
      title: "Erinnerung",
      description: "Für Teilnehmer, die noch nicht geantwortet haben",
      template: `Hey! ⏰

Kurze Erinnerung: Hast du schon das JGA-Formular ausgefüllt?

👉 ${surveyLink}
Code: ${accessCode}

Wir brauchen noch deine Stimme für die Planung!

Danke! 🙏`,
    },
    {
      id: "deadline",
      emoji: "🚨",
      title: "Deadline-Warnung",
      description: "Letzte Chance vor Deadline",
      template: `🚨 LETZTE CHANCE! 🚨

Die Umfrage für ${event.honoree_name}s JGA schließt bald!

Wer noch nicht abgestimmt hat:
👉 ${surveyLink}

Danach wird der Termin festgelegt. 
Nicht abstimmen = Automatisch dabei 😜`,
    },
    {
      id: "locked",
      emoji: "🔒",
      title: "Termin steht fest",
      description: "Nach Festlegung des Termins",
      template: `🔒 TERMIN STEHT FEST! 🔒

Der JGA für ${event.honoree_name} findet statt:
📅 [DATUM EINFÜGEN]

Bitte tragt euch den Termin ein! 
Details zur Location und Ablauf folgen.

ACHTUNG: ${event.honoree_name} darf davon NICHTS erfahren! 🤫`,
    },
    {
      id: "budget",
      emoji: "💸",
      title: "Budget-Info",
      description: "Kosten und Zahlung",
      template: `💸 BUDGET-UPDATE 💸

Geschätzte Kosten pro Person: [BETRAG] €

Bitte überweist auf:
IBAN: [IBAN EINFÜGEN]
Verwendungszweck: JGA ${event.honoree_name}

Deadline: [DATUM]

Bei Fragen meldet euch! 👍`,
    },
    {
      id: "packing",
      emoji: "🧳",
      title: "Packliste",
      description: "Was mitbringen?",
      template: `🧳 PACKLISTE für den JGA! 🧳

Bitte mitbringen:
✅ Gute Laune
✅ [SPEZIFISCHE ITEMS]
✅ Bargeld für Extras
✅ Bequeme Schuhe

Wir freuen uns! 🎉`,
    },
  ];

  const handleCopy = async (template: MessageTemplate) => {
    try {
      await navigator.clipboard.writeText(template.template);
      setCopiedId(template.id);
      toast.success(`"${template.title}" kopiert!`);
      
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error("Kopieren fehlgeschlagen");
    }
  };

  const handleWhatsApp = (template: MessageTemplate) => {
    const encoded = encodeURIComponent(template.template);
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
            <h3 className="font-display text-xl font-bold">Nachrichten-Vorlagen</h3>
            <p className="text-sm text-muted-foreground">
              Vorgefertigte WhatsApp-Nachrichten für die Gruppe
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-background/30">
          <div>
            <p className="text-xs text-muted-foreground">Survey-Link</p>
            <code className="text-xs text-primary break-all">{surveyLink}</code>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Gruppencode</p>
            <code className="text-xs text-primary">{accessCode}</code>
          </div>
        </div>
      </GlassCard>

      {/* Templates */}
      <div className="space-y-4">
        {templates.map((template) => (
          <GlassCard
            key={template.id}
            className="p-4 hover:bg-background/30 transition-colors"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{template.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold">{template.title}</h4>
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
                  {template.description}
                </p>
                
                {/* Preview */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <pre className="text-xs whitespace-pre-wrap font-sans text-muted-foreground">
                    {template.template.slice(0, 150)}...
                  </pre>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Quick Actions */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(surveyLink);
              toast.success("Link kopiert!");
            }}
          >
            <Copy className="w-4 h-4 mr-2" />
            Link kopieren
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(accessCode);
              toast.success("Code kopiert!");
            }}
          >
            <Copy className="w-4 h-4 mr-2" />
            Code kopieren
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(surveyLink, "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Survey öffnen
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};
