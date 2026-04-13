import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarSync,
  Copy,
  Check,
  RefreshCw,
  Plus,
  ExternalLink,
  Clock,
  Shield,
  Info,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GlassCard } from "./ui/GlassCard";
import { useAgency } from "@/hooks/useAgency";
import {
  useCalendarTokens,
  useCreateCalendarToken,
  useRevokeCalendarToken,
  useRegenerateCalendarToken,
  getICalFeedUrl,
  getWebcalUrl,
  getOutlookSubscribeUrl,
  getGoogleCalendarUrl,
  CalendarToken,
} from "@/hooks/useCalendarSync";

// ---------------------------------------------------------------------------
// Inline SVG icons for calendar providers
// ---------------------------------------------------------------------------

function OutlookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.42.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.01V2.63q0-.46.33-.8.33-.33.8-.33h14.54q.46 0 .8.33.32.34.32.8V12zM7.01 13.19q0-.66-.17-1.24-.18-.58-.5-1.03-.31-.45-.77-.72Q5.1 9.93 4.5 9.93q-.6 0-1.07.27-.46.26-.79.71-.32.45-.49 1.03-.17.59-.17 1.24 0 .67.17 1.24.17.58.49 1.03.32.45.77.72.47.26 1.09.26.59 0 1.06-.27.47-.27.79-.72.32-.45.49-1.03.17-.57.17-1.22zM6.01 18V7H1v11h5.01zm17 .77V18h-4.37v-1.5h3.87V15h-3.87v-1.5h4.37v-2H18v6.77h5.01zM24 12V2.63H7.94v3.37h4.56q.46 0 .8.33.32.34.32.8V12H24z"/>
    </svg>
  );
}

function GoogleCalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M19.5 3h-3V1.5H15V3H9V1.5H7.5V3h-3C3.675 3 3 3.675 3 4.5v15c0 .825.675 1.5 1.5 1.5h15c.825 0 1.5-.675 1.5-1.5v-15c0-.825-.675-1.5-1.5-1.5zm0 16.5h-15V8.25h15v11.25zM7.5 10.5h3v3h-3v-3zm4.5 0h3v3h-3v-3zm4.5 0h3v3h-3v-3zM7.5 15h3v3h-3v-3zm4.5 0h3v3h-3v-3z"/>
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Copy button with feedback
// ---------------------------------------------------------------------------

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={cn(
        "h-8 px-3 text-xs transition-all duration-200 cursor-pointer",
        copied
          ? "text-emerald-400 bg-emerald-500/10"
          : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]"
      )}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 mr-1.5" />
      ) : (
        <Copy className="w-3.5 h-3.5 mr-1.5" />
      )}
      {label || (copied ? "Kopiert!" : "Kopieren")}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Token row
// ---------------------------------------------------------------------------

function TokenRow({
  token,
  agencyId,
}: {
  token: CalendarToken;
  agencyId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const revoke = useRevokeCalendarToken();
  const regenerate = useRegenerateCalendarToken();

  const feedUrl = getICalFeedUrl(token.token);
  const webcalUrl = getWebcalUrl(token.token);
  const outlookUrl = getOutlookSubscribeUrl(token.token);
  const googleUrl = getGoogleCalendarUrl(token.token);

  const scopeLabels: Record<string, string> = {
    all: "Alle Buchungen",
    confirmed_only: "Nur bestaetigte",
    guide_personal: "Guide-spezifisch",
  };

  const lastAccessed = token.last_accessed_at
    ? new Date(token.last_accessed_at).toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Noch nie";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <CalendarSync className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-slate-200">
              {token.guide_id ? "Guide-Kalender" : "Agentur-Kalender"}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-violet-500/30 text-violet-300"
              >
                {scopeLabels[token.scope] || token.scope}
              </Badge>
              <span className="text-[10px] text-slate-600 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                Letzter Zugriff: {lastAccessed}
              </span>
            </div>
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-500"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-white/[0.04] pt-3">
              {/* Feed URL */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-600 mb-1 block">
                  Feed-URL
                </label>
                <div className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.06]">
                  <code className="text-xs text-slate-400 truncate flex-1 select-all">
                    {feedUrl}
                  </code>
                  <CopyButton text={feedUrl} />
                </div>
              </div>

              {/* Quick action buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <a
                  href={outlookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#0078D4]/10 border border-[#0078D4]/20 text-[#4BA3E3] hover:bg-[#0078D4]/15 transition-colors text-xs font-medium cursor-pointer"
                >
                  <OutlookIcon className="w-4 h-4" />
                  In Outlook oeffnen
                  <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                </a>
                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#4285F4]/10 border border-[#4285F4]/20 text-[#7BAAF7] hover:bg-[#4285F4]/15 transition-colors text-xs font-medium cursor-pointer"
                >
                  <GoogleCalIcon className="w-4 h-4" />
                  In Google Calendar
                  <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                </a>
                <a
                  href={webcalUrl}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:bg-white/[0.06] transition-colors text-xs font-medium cursor-pointer"
                >
                  <AppleIcon className="w-4 h-4" />
                  Apple Kalender
                  <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                </a>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    regenerate.mutate({
                      tokenId: token.id,
                      agencyId,
                      guideId: token.guide_id || undefined,
                      scope: token.scope,
                    })
                  }
                  disabled={regenerate.isPending}
                  className="h-8 px-3 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                >
                  <RefreshCw
                    className={cn(
                      "w-3.5 h-3.5 mr-1.5",
                      regenerate.isPending && "animate-spin"
                    )}
                  />
                  Token erneuern
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revoke.mutate({ tokenId: token.id, agencyId })}
                  disabled={revoke.isPending}
                  className="h-8 px-3 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Deaktivieren
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AgencyCalendarSync() {
  const { agency } = useAgency();
  const agencyId = agency?.id;

  const { data: tokens, isLoading } = useCalendarTokens(agencyId);
  const createToken = useCreateCalendarToken();

  const [showScopeSelect, setShowScopeSelect] = useState(false);

  const handleCreateToken = (
    scope: "all" | "confirmed_only" | "guide_personal"
  ) => {
    if (!agencyId) return;
    createToken.mutate({ agencyId, scope });
    setShowScopeSelect(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="p-6" hoverGlow>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <CalendarSync className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-50">
                Kalender abonnieren
              </h2>
              <p className="text-sm text-slate-500">
                Synchronisiere Buchungen mit deinem Kalender
              </p>
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 mb-5">
          <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            Erstelle einen Kalender-Feed-Link und fuege ihn in deiner
            Kalender-App (Outlook, Google Calendar, Apple Kalender) als
            Abonnement hinzu. Neue Buchungen erscheinen dann automatisch in
            deinem Kalender und werden regelmaessig aktualisiert.
          </p>
        </div>

        {/* Existing tokens */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-violet-500 border-t-transparent" />
          </div>
        ) : tokens && tokens.length > 0 ? (
          <div className="space-y-3 mb-4">
            {tokens.map((token) => (
              <TokenRow key={token.id} token={token} agencyId={agencyId!} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 mb-4">
            <CalendarSync className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              Noch kein Kalender-Feed erstellt
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Erstelle einen Token, um deine Buchungen mit deinem Kalender zu
              synchronisieren
            </p>
          </div>
        )}

        {/* Create new token */}
        <AnimatePresence>
          {showScopeSelect ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2"
            >
              <button
                onClick={() => handleCreateToken("all")}
                disabled={createToken.isPending}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-violet-500/30 hover:bg-white/[0.05] transition-all cursor-pointer group"
              >
                <CalendarSync className="w-5 h-5 text-violet-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-slate-200">
                  Alle Buchungen
                </span>
                <span className="text-[10px] text-slate-600">
                  Inkl. ausstehende
                </span>
              </button>
              <button
                onClick={() => handleCreateToken("confirmed_only")}
                disabled={createToken.isPending}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-emerald-500/30 hover:bg-white/[0.05] transition-all cursor-pointer group"
              >
                <Shield className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-slate-200">
                  Nur bestaetigte
                </span>
                <span className="text-[10px] text-slate-600">
                  Bestaetigte Buchungen
                </span>
              </button>
              <button
                onClick={() => setShowScopeSelect(false)}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all cursor-pointer text-slate-500 hover:text-slate-300"
              >
                <span className="text-xs">Abbrechen</span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Button
                onClick={() => setShowScopeSelect(true)}
                className="bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
                disabled={createToken.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                Neuen Token erstellen
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}
