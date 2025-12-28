import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useEvent } from "@/hooks/useEvent";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import Hero from "@/components/Hero";
import InfoCard from "@/components/InfoCard";
import ProgressIndicator from "@/components/ProgressIndicator";
import SurveyForm from "@/components/SurveyForm";

const EventSurvey = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { event, participants, responseCount, isLoading, error } = useEvent(slug);

  if (isLoading) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading event...</p>
          </motion.div>
        </div>
      </AnimatedBackground>
    );
  }

  if (error || !event) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
            <GlassCard className="p-8">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h1 className="font-display text-2xl font-bold mb-2">Event Not Found</h1>
              <p className="text-muted-foreground mb-6">{error || "This event doesn't exist."}</p>
              <div className="flex flex-col gap-3">
                <GradientButton onClick={() => navigate("/join")}>Try a Different Code</GradientButton>
                <GradientButton variant="outline" onClick={() => navigate("/")}>Go Home</GradientButton>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </AnimatedBackground>
    );
  }

  const isFormLocked = event.is_form_locked || !!event.locked_block;
  const lockedBlock = event.locked_block
    ? { block: event.locked_block, label: event.settings?.date_blocks?.[event.locked_block] || event.locked_block }
    : undefined;

  return (
    <main className="min-h-screen hero-gradient">
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors glass-card px-3 py-2 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Home</span>
        </button>
      </div>

      <Hero />
      <InfoCard />
      <ProgressIndicator responseCount={responseCount} deadline={event.survey_deadline} lockedBlock={lockedBlock} />
      <SurveyForm isLocked={isFormLocked} />
    </main>
  );
};

export default EventSurvey;
