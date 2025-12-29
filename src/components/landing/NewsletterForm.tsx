import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, Check, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email().max(255);

interface NewsletterFormProps {
  variant?: "inline" | "stacked";
  className?: string;
}

export function NewsletterForm({ variant = "stacked", className = "" }: NewsletterFormProps) {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(t("newsletter.errors.invalidEmail"));
      return;
    }

    if (!gdprConsent) {
      setError(t("newsletter.errors.gdprRequired"));
      return;
    }

    setIsLoading(true);

    try {
      const { error: dbError } = await supabase
        .from("newsletter_subscribers")
        .insert({
          email: email.toLowerCase().trim(),
          locale: i18n.language,
          gdpr_consent: gdprConsent,
          marketing_consent: marketingConsent,
          source: "landing_page",
        });

      if (dbError) {
        if (dbError.code === "23505") {
          // Unique constraint violation - email already exists
          setError(t("newsletter.errors.alreadySubscribed"));
        } else {
          throw dbError;
        }
      } else {
        setIsSuccess(true);
        toast.success(t("newsletter.success"));
        setEmail("");
        setGdprConsent(false);
        setMarketingConsent(false);
        
        // Reset success state after 5 seconds
        setTimeout(() => setIsSuccess(false), 5000);
      }
    } catch (err) {
      console.error("Newsletter subscription error:", err);
      setError(t("newsletter.errors.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/30 ${className}`}
      >
        <div className="p-2 rounded-full bg-success/20">
          <Check className="w-5 h-5 text-success" />
        </div>
        <div>
          <p className="font-medium text-success">{t("newsletter.successTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("newsletter.successMessage")}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className={variant === "inline" ? "flex gap-2" : "space-y-4"}>
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder={t("newsletter.placeholder")}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            className="pl-10 bg-background/50 border-border/50"
            disabled={isLoading}
          />
        </div>
        
        {variant === "inline" ? (
          <Button
            type="submit"
            disabled={isLoading || !email}
            className="gradient-primary text-primary-foreground shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isLoading || !email || !gdprConsent}
            className="w-full gradient-primary text-primary-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("common.loading")}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {t("newsletter.subscribe")}
              </>
            )}
          </Button>
        )}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-destructive mt-2"
        >
          {error}
        </motion.p>
      )}

      <div className="space-y-3 mt-4">
        <label className="flex items-start gap-3 cursor-pointer group">
          <Checkbox
            checked={gdprConsent}
            onCheckedChange={(checked) => setGdprConsent(checked === true)}
            className="mt-0.5"
          />
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
            {t("newsletter.gdprConsent")} *
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <Checkbox
            checked={marketingConsent}
            onCheckedChange={(checked) => setMarketingConsent(checked === true)}
            className="mt-0.5"
          />
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
            {t("newsletter.marketingConsent")}
          </span>
        </label>
      </div>
    </form>
  );
}