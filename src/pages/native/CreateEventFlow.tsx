/**
 * CreateEventFlow — native multi-step event creation.
 *
 * Steps:
 *   1. Type     — emoji cards (bachelor, bachelorette, birthday, trip, other)
 *   2. Details  — name, honoree, date picker
 *   3. Guests   — add participant names
 *   4. Review   — summary + submit
 *   5. Success  — share link + WhatsApp
 *
 * Reuses the same Supabase Edge Function (create-event) as desktop.
 */
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  PartyPopper,
  Sparkles,
  Cake,
  Plane,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
  Copy,
  Share2,
  Plus,
  X,
  Calendar,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getBaseUrl } from "@/lib/platform";
import { useHaptics } from "@/hooks/useHaptics";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { spring, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { MobileHeader } from "@/components/native/MobileHeader";

const EVENT_TYPES = [
  { value: "bachelor", label: "JGA (Männer)", emoji: "🎉", gradient: "from-violet-500 to-fuchsia-500" },
  { value: "bachelorette", label: "JGA (Frauen)", emoji: "💅", gradient: "from-pink-500 to-rose-500" },
  { value: "birthday", label: "Geburtstag", emoji: "🎂", gradient: "from-amber-500 to-orange-500" },
  { value: "trip", label: "Gruppenreise", emoji: "✈️", gradient: "from-cyan-500 to-teal-500" },
  { value: "other", label: "Anderes Event", emoji: "🎊", gradient: "from-emerald-500 to-green-500" },
];

interface FormData {
  event_type: string;
  name: string;
  honoree_name: string;
  event_date: string;
  organizer_name: string;
  participants: string[];
}

const stepVariants = {
  enter: { x: "60%", opacity: 0 },
  center: { x: 0, opacity: 1, transition: spring.soft },
  exit: { x: "-30%", opacity: 0, transition: { duration: 0.2, ease: ease.in } },
};

const stepBackVariants = {
  enter: { x: "-60%", opacity: 0 },
  center: { x: 0, opacity: 1, transition: spring.soft },
  exit: { x: "30%", opacity: 0, transition: { duration: 0.2, ease: ease.in } },
};

export default function CreateEventFlow() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { user } = useAuthContext();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participantInput, setParticipantInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<{
    slug: string;
    access_code: string;
    share_link: string;
  } | null>(null);

  const [form, setForm] = useState<FormData>({
    event_type: "",
    name: "",
    honoree_name: "",
    event_date: "",
    organizer_name: user?.user_metadata?.first_name || user?.email?.split("@")[0] || "",
    participants: [],
  });

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const next = () => {
    haptics.light();
    setDirection(1);
    setStep((s) => s + 1);
  };
  const back = () => {
    haptics.light();
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const addParticipant = () => {
    const name = participantInput.trim();
    if (!name) return;
    haptics.light();
    update("participants", [...form.participants, name]);
    setParticipantInput("");
  };

  const removeParticipant = (i: number) => {
    haptics.light();
    update("participants", form.participants.filter((_, idx) => idx !== i));
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!form.event_type;
      case 2: return !!form.name && !!form.honoree_name;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    haptics.medium();
    try {
      const { data, error } = await supabase.functions.invoke("create-event", {
        body: {
          name: form.name,
          honoree_name: form.honoree_name,
          event_type: form.event_type,
          event_date: form.event_date || null,
          organizer_name: form.organizer_name,
          participants: form.participants.map((name) => ({ name })),
          template_id: "flexible",
          no_gos: [],
          focus_points: [],
        },
      });
      if (error) throw error;
      if (data?.success) {
        haptics.celebrate();
        setCreatedEvent({
          slug: data.event.slug,
          access_code: data.event.access_code,
          share_link: data.share_link || `${getBaseUrl()}/e/${data.event.slug}`,
        });
        setDirection(1);
        setStep(5);
      } else throw new Error(data?.error || "Failed");
    } catch (err) {
      haptics.error();
      console.error("Create event failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = async () => {
    if (!createdEvent) return;
    haptics.success();
    await navigator.clipboard.writeText(createdEvent.share_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    if (!createdEvent) return;
    haptics.light();
    const text = `🎉 Du bist eingeladen!\n\nKomm zu "${form.name}" für ${form.honoree_name}!\n\n👉 ${createdEvent.share_link}\n📝 Code: ${createdEvent.access_code}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const totalSteps = 4;
  const isSuccess = step === 5;

  return (
    <div className="h-full flex flex-col bg-background">
      <MobileHeader
        title={isSuccess ? "Fertig!" : "Event erstellen"}
        showBack={!isSuccess}
        onBack={step > 1 && !isSuccess ? back : undefined}
      />

      {/* Progress bar */}
      {!isSuccess && (
        <div className="px-5 pb-4">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }, (_, i) => (
              <motion.div
                key={i}
                className="flex-1 h-1 rounded-full"
                animate={{
                  backgroundColor: i < step ? "rgb(139, 92, 246)" : "rgba(255,255,255,0.1)",
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
          <p className="text-xs text-white/40 mt-2">
            Schritt {step} von {totalSteps}
          </p>
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            variants={direction === 1 ? stepVariants : stepBackVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 overflow-y-auto native-scroll px-5 pb-8"
          >
            {step === 1 && (
              <StepType
                selected={form.event_type}
                onSelect={(v) => { haptics.medium(); update("event_type", v); }}
              />
            )}
            {step === 2 && (
              <StepDetails form={form} update={update} />
            )}
            {step === 3 && (
              <StepGuests
                participants={form.participants}
                input={participantInput}
                onInputChange={setParticipantInput}
                onAdd={addParticipant}
                onRemove={removeParticipant}
              />
            )}
            {step === 4 && (
              <StepReview form={form} />
            )}
            {step === 5 && createdEvent && (
              <StepSuccess
                event={createdEvent}
                formName={form.name}
                copied={copied}
                onCopy={copyLink}
                onWhatsApp={shareWhatsApp}
                onDashboard={() => {
                  haptics.light();
                  navigate(`/e/${createdEvent.slug}/dashboard`);
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      {!isSuccess && (
        <div className="safe-bottom px-5 pb-4 pt-2">
          <motion.button
            onClick={step === 4 ? handleSubmit : next}
            disabled={!canProceed() || isSubmitting}
            whileTap={{ scale: canProceed() ? 0.96 : 1 }}
            transition={spring.snappy}
            className={cn(
              "w-full h-14 rounded-2xl font-display font-bold text-lg flex items-center justify-center gap-2 transition-all",
              canProceed()
                ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.5)]"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : step === 4 ? (
              <>
                Event erstellen
                <Check className="w-5 h-5" />
              </>
            ) : (
              <>
                Weiter
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </div>
      )}
    </div>
  );
}

/* ────── Step Sub-Components ────── */

function StepType({ selected, onSelect }: { selected: string; onSelect: (v: string) => void }) {
  return (
    <div className="pt-2">
      <h2 className="text-2xl font-display font-bold text-white mb-1">
        Was feiert ihr?
      </h2>
      <p className="text-sm text-white/50 mb-6">Wähle den Event-Typ</p>
      <div className="space-y-3">
        {EVENT_TYPES.map((type) => {
          const active = selected === type.value;
          return (
            <motion.button
              key={type.value}
              onClick={() => onSelect(type.value)}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all",
                active
                  ? `bg-gradient-to-r ${type.gradient} border-transparent shadow-lg`
                  : "bg-white/5 border-white/10 hover:border-white/20"
              )}
            >
              <span className="text-3xl">{type.emoji}</span>
              <span className={cn(
                "text-base font-semibold",
                active ? "text-white" : "text-white/80"
              )}>
                {type.label}
              </span>
              {active && (
                <motion.div
                  className="ml-auto w-6 h-6 rounded-full bg-white/30 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={spring.bouncy}
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function StepDetails({
  form,
  update,
}: {
  form: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <div className="pt-2 space-y-5">
      <div>
        <h2 className="text-2xl font-display font-bold text-white mb-1">Details</h2>
        <p className="text-sm text-white/50">Die Basics für dein Event</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-white/70 mb-1.5 block">Event-Name *</label>
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="z.B. Tims JGA Amsterdam"
            className="w-full h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-base focus:outline-none focus:border-primary/50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-white/70 mb-1.5 block">Für wen? *</label>
          <input
            value={form.honoree_name}
            onChange={(e) => update("honoree_name", e.target.value)}
            placeholder="z.B. Tim"
            className="w-full h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-base focus:outline-none focus:border-primary/50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-white/70 mb-1.5 block">
            <Calendar className="w-4 h-4 inline mr-1.5" />
            Datum (optional)
          </label>
          <input
            type="date"
            value={form.event_date}
            onChange={(e) => update("event_date", e.target.value)}
            className="w-full h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-white text-base focus:outline-none focus:border-primary/50 [color-scheme:dark]"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-white/70 mb-1.5 block">Dein Name *</label>
          <input
            value={form.organizer_name}
            onChange={(e) => update("organizer_name", e.target.value)}
            placeholder="Dein Vorname"
            className="w-full h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-base focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>
    </div>
  );
}

function StepGuests({
  participants,
  input,
  onInputChange,
  onAdd,
  onRemove,
}: {
  participants: string[];
  input: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="pt-2">
      <h2 className="text-2xl font-display font-bold text-white mb-1">Gäste</h2>
      <p className="text-sm text-white/50 mb-5">Wer kommt mit? (optional, kannst du später ergänzen)</p>

      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          placeholder="Name eingeben..."
          className="flex-1 h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-base focus:outline-none focus:border-primary/50"
        />
        <motion.button
          onClick={onAdd}
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0"
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      {participants.length > 0 && (
        <div className="space-y-2">
          {participants.map((name, i) => (
            <motion.div
              key={`${name}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white">
                {name.slice(0, 1).toUpperCase()}
              </div>
              <span className="flex-1 text-sm text-white font-medium">{name}</span>
              <button onClick={() => onRemove(i)} className="text-white/30 hover:text-white/60">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
          <p className="text-xs text-white/40 text-center mt-2">
            {participants.length} Gäst{participants.length === 1 ? "" : "e"}
          </p>
        </div>
      )}

      {participants.length === 0 && (
        <div className="rounded-2xl p-8 border border-dashed border-white/15 text-center mt-4">
          <Users className="w-10 h-10 text-white/20 mx-auto mb-2" />
          <p className="text-sm text-white/40">
            Noch keine Gäste — du kannst sie auch später einladen.
          </p>
        </div>
      )}
    </div>
  );
}

function StepReview({ form }: { form: FormData }) {
  const type = EVENT_TYPES.find((t) => t.value === form.event_type);
  return (
    <div className="pt-2">
      <h2 className="text-2xl font-display font-bold text-white mb-1">Alles korrekt?</h2>
      <p className="text-sm text-white/50 mb-5">Überprüfe dein Event</p>

      <div className="space-y-3">
        <div className="rounded-2xl p-4 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{type?.emoji}</span>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider font-semibold">
                {type?.label}
              </p>
              <h3 className="text-xl font-display font-bold text-white">{form.name}</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-white/40 text-xs">Für</p>
              <p className="text-white font-medium">{form.honoree_name}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Datum</p>
              <p className="text-white font-medium">
                {form.event_date
                  ? new Date(form.event_date).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "Noch offen"}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Organisator</p>
              <p className="text-white font-medium">{form.organizer_name}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Gäste</p>
              <p className="text-white font-medium">{form.participants.length || "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepSuccess({
  event,
  formName,
  copied,
  onCopy,
  onWhatsApp,
  onDashboard,
}: {
  event: { slug: string; access_code: string; share_link: string };
  formName: string;
  copied: boolean;
  onCopy: () => void;
  onWhatsApp: () => void;
  onDashboard: () => void;
}) {
  return (
    <div className="pt-6 flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={spring.bouncy}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.4)]"
      >
        <Check className="w-10 h-10 text-white" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-display font-bold text-white mb-1"
      >
        Event erstellt! 🎉
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-white/50 mb-8"
      >
        Teile den Link mit deinen Freunden
      </motion.p>

      {/* Access code */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full rounded-2xl p-4 bg-white/5 border border-white/10 mb-3"
      >
        <p className="text-xs text-white/50 mb-1">Zugangscode</p>
        <p className="text-2xl font-display font-bold text-primary tracking-wider">
          {event.access_code}
        </p>
      </motion.div>

      {/* Share link */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full rounded-2xl p-4 bg-white/5 border border-white/10 mb-6"
      >
        <p className="text-xs text-white/50 mb-1">Link</p>
        <p className="text-sm text-white/80 truncate">{event.share_link}</p>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full space-y-3"
      >
        <motion.button
          onClick={onCopy}
          whileTap={{ scale: 0.96 }}
          className="w-full h-13 rounded-2xl bg-white/10 border border-white/10 text-white font-semibold flex items-center justify-center gap-2 py-3"
        >
          {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
          {copied ? "Kopiert!" : "Link kopieren"}
        </motion.button>

        <motion.button
          onClick={onWhatsApp}
          whileTap={{ scale: 0.96 }}
          className="w-full h-13 rounded-2xl bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 py-3"
        >
          <Share2 className="w-5 h-5" />
          WhatsApp teilen
        </motion.button>

        <motion.button
          onClick={onDashboard}
          whileTap={{ scale: 0.96 }}
          className="w-full h-13 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold flex items-center justify-center gap-2 py-3 shadow-[0_8px_30px_-6px_rgba(139,92,246,0.4)]"
        >
          Zum Dashboard
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </div>
  );
}
