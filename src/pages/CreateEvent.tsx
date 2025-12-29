import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  PartyPopper, 
  Cake, 
  Plane, 
  Users,
  Calendar,
  Check,
  Copy,
  Share2,
  MessageCircle
} from "lucide-react";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TemplateSelector } from "@/components/create-event/TemplateSelector";
import { type EventTemplate } from "@/lib/event-templates";

interface EventFormData {
  event_type: string;
  name: string;
  honoree_name: string;
  event_date: string;
  description: string;
  organizer_name: string;
  organizer_email: string;
  participants: string[];
  no_gos: string[];
  focus_points: string[];
  template_id?: string;
  custom_template?: object;
}

const eventTypes = [
  { value: "bachelor", labelKey: "createEvent.types.bachelor", icon: PartyPopper, emoji: "🎉" },
  { value: "bachelorette", labelKey: "createEvent.types.bachelorette", icon: Sparkles, emoji: "💅" },
  { value: "birthday", labelKey: "createEvent.types.birthday", icon: Cake, emoji: "🎂" },
  { value: "trip", labelKey: "createEvent.types.trip", icon: Plane, emoji: "✈️" },
  { value: "other", labelKey: "createEvent.types.other", icon: Users, emoji: "🎊" },
];

const defaultNoGos = [
  "No strippers",
  "No street selling / embarrassing tasks",
  "No pub crawl / bar hopping",
];

const defaultFocusPoints = [
  "Action, fun, activities",
  "Shared experiences",
  "Cool, not embarrassing",
  "No one is forced to do anything",
];

const CreateEvent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<{
    slug: string;
    access_code: string;
    share_link: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState<EventFormData>({
    event_type: "",
    name: "",
    honoree_name: "",
    event_date: "",
    description: "",
    organizer_name: "",
    organizer_email: "",
    participants: [],
    no_gos: defaultNoGos,
    focus_points: defaultFocusPoints,
    template_id: undefined,
    custom_template: undefined,
  });

  const [participantInput, setParticipantInput] = useState("");

  // Total steps: 1=Type, 2=Template, 3=Details, 4=Participants, 5=Summary, 6=Success
  const totalSteps = 5;

  const updateFormData = (field: keyof EventFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addParticipant = () => {
    if (participantInput.trim()) {
      updateFormData("participants", [...formData.participants, participantInput.trim()]);
      setParticipantInput("");
    }
  };

  const removeParticipant = (index: number) => {
    updateFormData(
      "participants",
      formData.participants.filter((_, i) => i !== index)
    );
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!formData.event_type;
      case 2:
        // Template step - always can proceed (template is optional)
        return true;
      case 3:
        return !!formData.name && !!formData.honoree_name && !!formData.organizer_name;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleSelectTemplate = (template: EventTemplate | null, customConfig?: object) => {
    if (template) {
      setFormData((prev) => ({ 
        ...prev, 
        template_id: template.id,
        custom_template: undefined,
      }));
    } else if (customConfig) {
      setFormData((prev) => ({ 
        ...prev, 
        template_id: undefined,
        custom_template: customConfig,
      }));
    }
    setStep(3);
  };

  const handleSkipTemplate = () => {
    setFormData((prev) => ({ 
      ...prev, 
      template_id: 'flexible',
      custom_template: undefined,
    }));
    setStep(3);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-event", {
        body: {
          name: formData.name,
          honoree_name: formData.honoree_name,
          event_type: formData.event_type,
          event_date: formData.event_date || null,
          description: formData.description || null,
          organizer_name: formData.organizer_name,
          organizer_email: formData.organizer_email || null,
          participants: formData.participants.map((name) => ({ name })),
          no_gos: formData.no_gos,
          focus_points: formData.focus_points,
          template_id: formData.template_id,
          custom_template: formData.custom_template,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setCreatedEvent({
          slug: data.event.slug,
          access_code: data.event.access_code,
          share_link: data.share_link || `${window.location.origin}/e/${data.event.slug}`,
        });
        setStep(6);
        toast({
          title: t('createEvent.success.title'),
          description: t('createEvent.success.description'),
        });
      } else {
        throw new Error(data?.error || "Failed to create event");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: t('common.error'),
        description: t('createEvent.error.failed'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: t('common.copied'), description: t('createEvent.success.linkCopied') });
  };

  const shareWhatsApp = () => {
    const text = t('createEvent.success.whatsappMessage', {
      name: formData.name,
      honoree: formData.honoree_name,
      link: createdEvent?.share_link,
      code: createdEvent?.access_code,
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                {t('createEvent.step1.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('createEvent.step1.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {eventTypes.map((type) => (
                <GlassCard
                  key={type.value}
                  className={`p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${
                    formData.event_type === type.value
                      ? "ring-2 ring-primary bg-primary/10"
                      : ""
                  }`}
                  onClick={() => {
                    updateFormData("event_type", type.value);
                    // Auto-advance to template selection
                    setTimeout(() => setStep(2), 300);
                  }}
                >
                  <div className="text-center">
                    <span className="text-4xl mb-3 block">{type.emoji}</span>
                    <p className="font-medium text-sm">{t(type.labelKey)}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <TemplateSelector
            eventType={formData.event_type}
            onSelectTemplate={handleSelectTemplate}
            onSkip={handleSkipTemplate}
          />
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                {t('createEvent.step2.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('createEvent.step2.subtitle')}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="honoree_name">{t('createEvent.step2.honoreeName')}</Label>
                <Input
                  id="honoree_name"
                  placeholder={t('createEvent.step2.honoreeNamePlaceholder')}
                  value={formData.honoree_name}
                  onChange={(e) => updateFormData("honoree_name", e.target.value)}
                  className="bg-background/50 border-border/50"
                />
              </div>

              <div>
                <Label htmlFor="name">{t('createEvent.step2.eventName')}</Label>
                <Input
                  id="name"
                  placeholder={t('createEvent.step2.eventNamePlaceholder')}
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  className="bg-background/50 border-border/50"
                />
              </div>

              <div>
                <Label htmlFor="event_date">{t('createEvent.step2.eventDate')}</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => updateFormData("event_date", e.target.value)}
                  className="bg-background/50 border-border/50"
                />
              </div>

              <div>
                <Label htmlFor="organizer_name">{t('createEvent.step2.organizerName')}</Label>
                <Input
                  id="organizer_name"
                  placeholder={t('createEvent.step2.organizerNamePlaceholder')}
                  value={formData.organizer_name}
                  onChange={(e) => updateFormData("organizer_name", e.target.value)}
                  className="bg-background/50 border-border/50"
                />
              </div>

              <div>
                <Label htmlFor="organizer_email">{t('createEvent.step2.organizerEmail')}</Label>
                <Input
                  id="organizer_email"
                  type="email"
                  placeholder={t('createEvent.step2.organizerEmailPlaceholder')}
                  value={formData.organizer_email}
                  onChange={(e) => updateFormData("organizer_email", e.target.value)}
                  className="bg-background/50 border-border/50"
                />
              </div>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                {t('createEvent.step3.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('createEvent.step3.subtitle')}
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder={t('createEvent.step3.namePlaceholder')}
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addParticipant()}
                className="bg-background/50 border-border/50"
              />
              <GradientButton onClick={addParticipant} size="sm">
                {t('common.add')}
              </GradientButton>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.participants.map((name, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30"
                >
                  <span className="text-sm">{name}</span>
                  <button
                    onClick={() => removeParticipant(index)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </div>

            {formData.participants.length === 0 && (
              <p className="text-center text-muted-foreground text-sm">
                {t('createEvent.step3.noParticipants')}
              </p>
            )}
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                {t('createEvent.step4.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('createEvent.step4.subtitle')}
              </p>
            </div>

            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {eventTypes.find((type) => type.value === formData.event_type)?.emoji}
                </span>
                <div>
                  <h3 className="font-bold text-lg">{formData.name}</h3>
                  <p className="text-muted-foreground">{t('createEvent.step4.forHonoree', { name: formData.honoree_name })}</p>
                </div>
              </div>

              {formData.event_date && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(formData.event_date).toLocaleDateString()}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>
                  {t('createEvent.step4.participantCount', { count: formData.participants.length + 1 })}
                </span>
              </div>

              <div className="text-sm text-muted-foreground">
                {t('createEvent.step4.organizedBy', { name: formData.organizer_name })}
              </div>
            </GlassCard>

            <Textarea
              placeholder={t('createEvent.step4.descriptionPlaceholder')}
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              className="bg-background/50 border-border/50 min-h-[100px]"
            />
          </motion.div>
        );

      case 6:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 mx-auto rounded-full bg-gradient-primary flex items-center justify-center"
            >
              <Check className="w-10 h-10 text-primary-foreground" />
            </motion.div>

            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                {t('createEvent.success.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('createEvent.success.shareMessage')}
              </p>
            </div>

            <GlassCard className="p-6 space-y-4">
              <div>
                <Label className="text-muted-foreground text-sm">{t('createEvent.success.accessCode')}</Label>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="font-mono text-3xl font-bold tracking-wider text-gradient-primary">
                    {createdEvent?.access_code}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <Label className="text-muted-foreground text-sm">{t('createEvent.success.shareLink')}</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    readOnly
                    value={createdEvent?.share_link}
                    className="bg-background/30 text-sm"
                  />
                  <GradientButton
                    size="sm"
                    onClick={() => copyToClipboard(createdEvent?.share_link || "")}
                    icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  >
                    {copied ? t('common.copied') : t('common.copy')}
                  </GradientButton>
                </div>
              </div>
            </GlassCard>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <GradientButton onClick={shareWhatsApp} icon={<MessageCircle className="w-5 h-5" />}>
                {t('createEvent.success.shareWhatsApp')}
              </GradientButton>
              <GradientButton
                variant="outline"
                onClick={() => navigate(`/e/${createdEvent?.slug}/dashboard`)}
                icon={<ArrowRight className="w-5 h-5" />}
              >
                {t('createEvent.success.goToDashboard')}
              </GradientButton>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatedBackground>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-4 flex items-center justify-between">
          <button
            onClick={() => (step > 1 && step < 6 ? setStep(step - 1) : navigate("/"))}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{step > 1 && step < 6 ? t('common.back') : t('common.home')}</span>
          </button>

          {step < 6 && (
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i + 1 <= step
                      ? "w-8 bg-gradient-primary"
                      : "w-2 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-lg">
            <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

            {/* Navigation - hide for step 2 (template selector has its own nav) */}
            {step < 6 && step !== 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end mt-8"
              >
                {step < 5 ? (
                  <GradientButton
                    onClick={() => setStep(step + 1)}
                    disabled={!canProceed()}
                    icon={<ArrowRight className="w-5 h-5" />}
                  >
                    {t('common.next')}
                  </GradientButton>
                ) : (
                  <GradientButton
                    onClick={handleSubmit}
                    disabled={!canProceed() || isSubmitting}
                    loading={isSubmitting}
                    icon={<Sparkles className="w-5 h-5" />}
                  >
                    {t('createEvent.submit')}
                  </GradientButton>
                )}
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </AnimatedBackground>
  );
};

export default CreateEvent;
