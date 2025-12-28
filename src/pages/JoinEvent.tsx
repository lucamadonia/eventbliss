import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Users, Sparkles } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const JoinEvent = () => {
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [eventPreview, setEventPreview] = useState<{
    slug: string;
    name: string;
    honoree_name: string;
    event_type: string;
  } | null>(null);

  const handleLookup = async () => {
    if (!accessCode.trim()) {
      toast({
        title: "Enter a code",
        description: "Please enter the access code you received.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("join-event", {
        body: { access_code: accessCode.toUpperCase() },
      });

      if (error) throw error;

      if (data?.success) {
        setEventPreview(data.event);
      } else {
        toast({
          title: "Invalid Code",
          description: data?.error || "No event found with this code.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error looking up event:", error);
      toast({
        title: "Error",
        description: "Failed to find event. Please check the code and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = () => {
    if (eventPreview) {
      navigate(`/e/${eventPreview.slug}`);
    }
  };

  const getEventEmoji = (type: string) => {
    switch (type) {
      case "bachelor":
        return "🎉";
      case "bachelorette":
        return "💅";
      case "birthday":
        return "🎂";
      case "trip":
        return "✈️";
      default:
        return "🎊";
    }
  };

  return (
    <AnimatedBackground>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Home</span>
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-16 h-16 mx-auto rounded-full bg-gradient-secondary flex items-center justify-center mb-6"
              >
                <Users className="w-8 h-8 text-secondary-foreground" />
              </motion.div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
                Join an Event
              </h1>
              <p className="text-muted-foreground">
                Enter the access code you received from the organizer.
              </p>
            </motion.div>

            {!eventPreview ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <GlassCard className="p-6 space-y-6">
                  <div>
                    <Label htmlFor="code">Access Code</Label>
                    <Input
                      id="code"
                      placeholder="e.g., ABC123"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                      className="bg-background/50 border-border/50 text-center font-mono text-2xl tracking-wider uppercase mt-2"
                      maxLength={6}
                    />
                  </div>

                  <GradientButton
                    className="w-full"
                    onClick={handleLookup}
                    loading={isLoading}
                    icon={<ArrowRight className="w-5 h-5" />}
                  >
                    Find Event
                  </GradientButton>
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <GlassCard className="p-6 space-y-6">
                  <div className="text-center">
                    <span className="text-5xl mb-4 block">
                      {getEventEmoji(eventPreview.event_type)}
                    </span>
                    <h2 className="font-display text-2xl font-bold mb-1">
                      {eventPreview.name}
                    </h2>
                    <p className="text-muted-foreground">
                      for {eventPreview.honoree_name}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <GradientButton
                      className="w-full"
                      onClick={handleJoin}
                      icon={<Sparkles className="w-5 h-5" />}
                    >
                      Join & Fill Survey
                    </GradientButton>
                    <GradientButton
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setEventPreview(null);
                        setAccessCode("");
                      }}
                    >
                      Try Different Code
                    </GradientButton>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center text-muted-foreground text-sm mt-6"
            >
              Don't have a code?{" "}
              <button
                onClick={() => navigate("/create")}
                className="text-primary hover:underline"
              >
                Create your own event
              </button>
            </motion.p>
          </div>
        </main>
      </div>
    </AnimatedBackground>
  );
};

export default JoinEvent;
