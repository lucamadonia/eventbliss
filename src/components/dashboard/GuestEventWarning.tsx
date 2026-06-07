/**
 * GuestEventWarning — shown on the dashboard of an UNCLAIMED event (created by a
 * guest without an account, i.e. events.created_by is null). Warns the organizer
 * that they will lose access to managing the event unless they register and link
 * it to an account, and offers a one-tap path to do so.
 */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { useAuthContext } from "@/components/auth/AuthProvider";

export function GuestEventWarning({ event }: { event: { created_by?: string | null; slug?: string } | null | undefined }) {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { t } = useTranslation();

  // Only for a not-logged-in viewer on an unclaimed (guest-created) event.
  if (!event || event.created_by || user) return null;

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
