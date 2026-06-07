/**
 * GuestEventWarning — handles the lifecycle of an UNCLAIMED event
 * (events.created_by is null, created by a guest without an account):
 *
 *  • Not logged in  → prominent warning that the organizer will lose access
 *    unless they register, with a "secure for free" CTA → registration.
 *  • Logged in + a pending claim token for this event on the device → auto-claim
 *    via the claim-invite edge function, linking the organizer participant to the
 *    account (after reload the dashboard recognizes them as organizer).
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowRight, Loader2 } from "lucide-react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { getPendingClaim, clearPendingClaim } from "@/lib/guest-claim";

export function GuestEventWarning({ event }: { event: { created_by?: string | null; slug?: string } | null | undefined }) {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const [claiming, setClaiming] = useState(false);

  // Auto-claim once the guest organizer has registered/logged in.
  useEffect(() => {
    if (!event || event.created_by || !user || !event.slug) return;
    const pending = getPendingClaim();
    if (!pending || pending.slug !== event.slug) return;
    let cancelled = false;
    setClaiming(true);
    (async () => {
      const { data, error } = await supabase.functions.invoke("claim-invite", {
        body: { token: pending.token, user_id: user.id },
      });
      if (cancelled) return;
      if (!error && (data as { success?: boolean } | null)?.success !== false) {
        clearPendingClaim();
        // Reload so get-event re-authorizes the now-linked organizer.
        setTimeout(() => window.location.reload(), 700);
      } else {
        setClaiming(false);
      }
    })();
    return () => { cancelled = true; };
  }, [event, user]);

  if (!event || event.created_by) return null;

  // Logged-in + claiming in progress → brief linking state.
  if (user) {
    if (!claiming) return null;
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm font-medium text-primary">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("dashboard.guestWarning.claiming", "Event wird mit deinem Konto verknüpft…")}
      </div>
    );
  }

  // Guest (not logged in) → warning + secure CTA.
  const goSecure = () => {
    const redirect = event.slug ? `/e/${event.slug}/dashboard` : "/";
    navigate(`/auth?redirect=${encodeURIComponent(redirect)}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-400/20">
          <ShieldAlert className="h-5 w-5 text-amber-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
            {t("dashboard.guestWarning.title", "Event noch nicht gesichert")}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {t(
              "dashboard.guestWarning.body",
              "Ohne kostenloses Konto verlierst du den Zugriff auf die Verwaltung. Verknüpfe dein Event jetzt mit deinem Account, um die volle Kontrolle zu behalten.",
            )}
          </p>
          <button
            type="button"
            onClick={goSecure}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(245,158,11,0.6)] active:scale-95 transition-transform"
          >
            {t("dashboard.guestWarning.cta", "Kostenlos sichern")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default GuestEventWarning;
