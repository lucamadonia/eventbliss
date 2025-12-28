import { useState } from "react";
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
}

const eventTypes = [
  { value: "bachelor", label: "Bachelor Party", icon: PartyPopper, emoji: "🎉" },
  { value: "bachelorette", label: "Bachelorette", icon: Sparkles, emoji: "💅" },
  { value: "birthday", label: "Birthday", icon: Cake, emoji: "🎂" },
  { value: "trip", label: "Group Trip", icon: Plane, emoji: "✈️" },
  { value: "other", label: "Other Event", icon: Users, emoji: "🎊" },
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
  });

  const [participantInput, setParticipantInput] = useState("");

  const totalSteps = 4;

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
        return !!formData.name && !!formData.honoree_name && !!formData.organizer_name;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
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
        },
      });

      if (error) throw error;

      if (data?.success) {
        setCreatedEvent({
          slug: data.event.slug,
          access_code: data.event.access_code,
          share_link: data.share_link || `${window.location.origin}/e/${data.event.slug}`,
        });
        setStep(5);
        toast({
          title: "Event created! 🎉",
          description: "Share the code with your friends.",
        });
      } else {
        throw new Error(data?.error || "Failed to create event");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
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
    toast({ title: "Copied!", description: "Link copied to clipboard." });
  };

  const shareWhatsApp = () => {
    const text = `🎉 You're invited!\n\nJoin "${formData.name}" for ${formData.honoree_name}'s celebration!\n\n👉 ${createdEvent?.share_link}\n📝 Code: ${createdEvent?.access_code}`;
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
                What are you planning?
              </h2>
              <p className="text-muted-foreground">
                Choose the type of event you want to organize.
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
                  onClick={() => updateFormData("event_type", type.value)}
                >
                  <div className="text-center">
                    <span className="text-4xl mb-3 block">{type.emoji}</span>
                    <p className="font-medium text-sm">{type.label}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                Event Details
              </h2>
              <p className="text-muted-foreground">
                Tell us about the event and who it's for.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="honoree_name">Who is the guest of honor?</Label>
                <Input
                  id="honoree_name"
                  placeholder="e.g., Dominik"
                  value={formData.honoree_name}
                  onChange={(e) => updateFormData("honoree_name", e.target.value)}
                  className="bg-background/50 border-border/50"
                />
              </div>

              <div>
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Dominik's Epic Bachelor Party"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  className="bg-background/50 border-border/50"
                />
              </div>

              <div>
                <Label htmlFor="event_date">Event Date (optional)</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => updateFormData("event_date", e.target.value)}
                  className="bg-background/50 border-border/50"
                />
              </div>

              <div>
                <Label htmlFor="organizer_name">Your Name (Organizer)</Label>
                <Input
                  id="organizer_name"
                  placeholder="e.g., Luca"
                  value={formData.organizer_name}
                  onChange={(e) => updateFormData("organizer_name", e.target.value)}
                  className="bg-background/50 border-border/50"
                />
              </div>

              <div>
                <Label htmlFor="organizer_email">Your Email (optional)</Label>
                <Input
                  id="organizer_email"
                  type="email"
                  placeholder="luca@example.com"
                  value={formData.organizer_email}
                  onChange={(e) => updateFormData("organizer_email", e.target.value)}
                  className="bg-background/50 border-border/50"
                />
              </div>
            </div>
          </motion.div>
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
                Add Participants
              </h2>
              <p className="text-muted-foreground">
                Add the people you want to invite (you can add more later).
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Enter name..."
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addParticipant()}
                className="bg-background/50 border-border/50"
              />
              <GradientButton onClick={addParticipant} size="sm">
                Add
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
                No participants added yet. You can skip this step and add them later.
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
                Review & Create
              </h2>
              <p className="text-muted-foreground">
                Everything looks good? Let's create your event!
              </p>
            </div>

            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {eventTypes.find((t) => t.value === formData.event_type)?.emoji}
                </span>
                <div>
                  <h3 className="font-bold text-lg">{formData.name}</h3>
                  <p className="text-muted-foreground">for {formData.honoree_name}</p>
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
                  {formData.participants.length + 1} participants (including you)
                </span>
              </div>

              <div className="text-sm text-muted-foreground">
                Organized by <span className="text-foreground">{formData.organizer_name}</span>
              </div>
            </GlassCard>

            <Textarea
              placeholder="Add a description or notes for your guests (optional)"
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              className="bg-background/50 border-border/50 min-h-[100px]"
            />
          </motion.div>
        );

      case 5:
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
                Event Created! 🎉
              </h2>
              <p className="text-muted-foreground">
                Share the link or code with your friends.
              </p>
            </div>

            <GlassCard className="p-6 space-y-4">
              <div>
                <Label className="text-muted-foreground text-sm">Access Code</Label>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="font-mono text-3xl font-bold tracking-wider text-gradient-primary">
                    {createdEvent?.access_code}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <Label className="text-muted-foreground text-sm">Share Link</Label>
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
                    {copied ? "Copied" : "Copy"}
                  </GradientButton>
                </div>
              </div>
            </GlassCard>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <GradientButton onClick={shareWhatsApp} icon={<MessageCircle className="w-5 h-5" />}>
                Share via WhatsApp
              </GradientButton>
              <GradientButton
                variant="outline"
                onClick={() => navigate(`/e/${createdEvent?.slug}/dashboard`)}
                icon={<ArrowRight className="w-5 h-5" />}
              >
                Go to Dashboard
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
            onClick={() => (step > 1 && step < 5 ? setStep(step - 1) : navigate("/"))}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{step > 1 && step < 5 ? "Back" : "Home"}</span>
          </button>

          {step < 5 && (
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

            {/* Navigation */}
            {step < 5 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end mt-8"
              >
                {step < 4 ? (
                  <GradientButton
                    onClick={() => setStep(step + 1)}
                    disabled={!canProceed()}
                    icon={<ArrowRight className="w-5 h-5" />}
                  >
                    Continue
                  </GradientButton>
                ) : (
                  <GradientButton
                    onClick={handleSubmit}
                    disabled={!canProceed() || isSubmitting}
                    loading={isSubmitting}
                    icon={<Sparkles className="w-5 h-5" />}
                  >
                    Create Event
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
