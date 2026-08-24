/**
 * GameReportModal — "hier stimmt etwas nicht" aus dem laufenden Spiel melden.
 *
 * Warum es das braucht: Inhalte veralten. Eine Schätzfrage bekommt eine falsche
 * Zahl, ein Song-Link stirbt, ein Begriff passt nicht zur Kategorie. Bisher
 * konnte ein Spieler das nur bemerken — nicht sagen. Die Diagnose starb im
 * Client, und wir haben es erst erfahren, wenn jemand von Hand nachgesehen hat.
 *
 * Bauplan bewusst von `GameRulesModal.tsx` übernommen (handgebautes Overlay mit
 * AnimatePresence statt Radix), damit sich beides über einem laufenden Spiel
 * gleich anfühlt. Bewusst KEIN Drawer: `GameRoomSheet.tsx` begründet, dass die
 * iOS-Tastatur Drawer-Inhalte wegschiebt — und hier wird getippt.
 *
 * Der Inhaltsbezug kommt aus `useReportContext()`. Fehlt er, wird trotzdem
 * gemeldet — nur eben ohne Inhalts-ID. Eine Meldung ohne Kontext ist schwächer,
 * aber immer noch besser als keine.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Check, Flag, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useReportContext } from "./useReportContext";

/** Fehlerarten. Die Schlüssel landen so in der Datenbank — nicht übersetzen. */
const REPORT_TYPES = [
  { key: "wrong_answer", labelKey: "games.report.types.wrongAnswer", fallback: "Antwort ist falsch" },
  { key: "not_loading", labelKey: "games.report.types.notLoading", fallback: "Inhalt lädt nicht" },
  { key: "inappropriate", labelKey: "games.report.types.inappropriate", fallback: "Unpassender Inhalt" },
  { key: "other", labelKey: "games.report.types.other", fallback: "Etwas anderes" },
] as const;

interface GameReportModalProps {
  gameId: string;
  open: boolean;
  onClose: () => void;
  /** Vorbelegte Fehlerart — genutzt, wenn die App den Fehler selbst bemerkt hat. */
  presetType?: string;
}

export function GameReportModal({ gameId, open, onClose, presetType }: GameReportModalProps) {
  const { t } = useTranslation();
  const ctx = useReportContext();
  const [type, setType] = useState<string>(presetType ?? "wrong_answer");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  // Beim Öffnen zurücksetzen: Sonst steht beim zweiten Melden noch die alte
  // Eingabe da und wird versehentlich mitgeschickt.
  useEffect(() => {
    if (!open) return;
    setType(presetType ?? "wrong_answer");
    setMessage("");
    setDone(false);
    setSending(false);
  }, [open, presetType]);

  const submit = async () => {
    if (sending) return;
    setSending(true);

    // Der Kontext wandert zusätzlich in den Text. Grund: Die Spalten sind neu,
    // und eine Meldung soll auch dann lesbar sein, wenn jemand sie roh in der
    // Datenbank ansieht.
    const kontext = ctx
      ? [
          ctx.label ? `Inhalt: ${ctx.label}` : null,
          ctx.contentId ? `ID: ${ctx.contentId}` : null,
          ...Object.entries(ctx.extra ?? {})
            .filter(([, v]) => v !== null && v !== undefined && v !== "")
            .map(([k, v]) => `${k}: ${v}`),
        ]
          .filter(Boolean)
          .join("\n")
      : "";

    const text = [message.trim(), kontext].filter(Boolean).join("\n\n");

    try {
      await supabase.from("user_feedback").insert({
        message: text || `[${type}] ohne weitere Angabe`,
        page_url: typeof location !== "undefined" ? location.href : null,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        game_id: gameId,
        content_id: ctx?.contentId ?? null,
        report_type: type,
      } as never);
      setDone(true);
      setTimeout(onClose, 1400);
    } catch {
      // Eine fehlgeschlagene Meldung darf das Spiel nicht stören. Wir zeigen
      // trotzdem den Dank — alles andere hielte den Spieler mitten in der Runde
      // mit einem Problem auf, das er ohnehin nicht lösen kann.
      setDone(true);
      setTimeout(onClose, 1400);
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            className="relative w-full max-w-sm rounded-3xl bg-[#0d0d15] border border-white/10 p-6 shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label={t("common.close")}
            >
              <X className="w-4 h-4 text-white/50" />
            </button>

            {done ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center mb-4">
                  <Check className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-white font-semibold">
                  {t("games.report.thanks")}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center">
                    <Flag className="w-5 h-5 text-amber-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white">
                    {t("games.report.title")}
                  </h2>
                </div>

                {ctx?.label ? (
                  <p className="text-xs text-white/40 mb-4 mt-2 line-clamp-2">{ctx.label}</p>
                ) : (
                  <p className="text-xs text-white/30 mb-4 mt-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    {t("games.report.noContext")}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {REPORT_TYPES.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => setType(r.key)}
                      className={
                        "px-3 py-2.5 rounded-xl text-xs font-medium border transition-colors text-left " +
                        (type === r.key
                          ? "bg-amber-500/20 border-amber-400/40 text-white"
                          : "bg-white/[0.04] border-white/10 text-white/60 hover:bg-white/[0.08]")
                      }
                    >
                      {t(r.labelKey, r.fallback)}
                    </button>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder={t("games.report.placeholder")}
                  className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-amber-400/40 resize-none"
                />

                <button
                  onClick={submit}
                  disabled={sending}
                  className="mt-4 w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm disabled:opacity-50 transition-opacity"
                >
                  {sending
                    ? t("games.report.sending")
                    : t("games.report.submit")}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
