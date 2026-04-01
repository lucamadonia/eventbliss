import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, ChevronDown, ChevronUp, Users, Send,
  Copy, Check, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const EP = {
  bg: "#0a0e14",
  surface1: "#151a21",
  surface2: "#1b2028",
  surface3: "#20262f",
  neonPurple: "#df8eff",
  neonPink: "#ff6b98",
  neonCyan: "#8ff5ff",
  border: "rgba(223,142,255,0.12)",
} as const;

interface EventInviteProps {
  roomCode: string;
  gameId: string;
}

interface EventItem {
  id: string;
  name: string;
}

interface Participant {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export default function EventInvite({ roomCode, gameId }: EventInviteProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const baseLink = `${window.location.origin}/games/${gameId}?room=${roomCode}`;
  const personalLink = (name: string) => `${baseLink}&name=${encodeURIComponent(name)}`;
  const shareLink = baseLink;

  // Fetch user's events
  useEffect(() => {
    if (!user?.id || !isOpen) return;
    let cancelled = false;

    const fetchEvents = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("events")
        .select("id, name")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!cancelled && !error && data) {
        setEvents(data as EventItem[]);
      }
      if (!cancelled) setLoading(false);
    };

    fetchEvents();
    return () => { cancelled = true; };
  }, [user?.id, isOpen]);

  // Fetch participants when an event is selected
  useEffect(() => {
    if (!selectedEventId) {
      setParticipants([]);
      return;
    }
    let cancelled = false;

    const fetchParticipants = async () => {
      setLoadingParticipants(true);
      const { data, error } = await supabase
        .from("participants")
        .select("id, name, email, phone")
        .eq("event_id", selectedEventId)
        .limit(100);

      if (!cancelled && !error && data) {
        setParticipants(data as Participant[]);
      }
      if (!cancelled) setLoadingParticipants(false);
    };

    fetchParticipants();
    return () => { cancelled = true; };
  }, [selectedEventId]);

  const buildWhatsAppMessage = useCallback(
    (name: string) =>
      `Hey ${name}! Komm in unser EventBliss Spiel! 🎮\nRoom: ${roomCode}\n👉 ${personalLink(name)}`,
    [roomCode, baseLink],
  );

  const whatsAppUrl = useCallback(
    (name: string, phone?: string | null) => {
      const msg = encodeURIComponent(buildWhatsAppMessage(name));
      return phone ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${msg}` : `https://wa.me/?text=${msg}`;
    },
    [buildWhatsAppMessage],
  );

  const handleCopyAll = useCallback(() => {
    const msg = participants
      .map((p) => buildWhatsAppMessage(p.name))
      .join("\n\n");
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    });
  }, [participants, buildWhatsAppMessage]);

  const handleCopySingle = useCallback(
    (participant: Participant) => {
      const msg = buildWhatsAppMessage(participant.name);
      navigator.clipboard.writeText(msg).then(() => {
        setCopiedId(participant.id);
        setTimeout(() => setCopiedId(null), 2000);
      });
    },
    [buildWhatsAppMessage],
  );

  if (!user) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: EP.surface1, border: `1px solid ${EP.border}` }}>
      {/* Toggle header */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" style={{ color: EP.neonCyan }} />
          <span className="text-xs font-semibold text-white/70 font-['Be_Vietnam_Pro']">
            Event-Gaeste einladen
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-white/30" />
        ) : (
          <ChevronDown className="h-4 w-4 text-white/30" />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Event selector */}
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: EP.neonPurple }} />
                </div>
              ) : events.length === 0 ? (
                <p className="text-xs text-white/30 font-['Be_Vietnam_Pro'] py-2 text-center">
                  Keine Events gefunden.
                </p>
              ) : (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30 font-['Be_Vietnam_Pro']">
                    Event waehlen
                  </span>
                  <div className="max-h-32 overflow-y-auto space-y-1 scrollbar-hide">
                    {events.map((ev) => (
                      <motion.button
                        key={ev.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() =>
                          setSelectedEventId(selectedEventId === ev.id ? null : ev.id)
                        }
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors"
                        style={{
                          backgroundColor:
                            selectedEventId === ev.id
                              ? "rgba(143,245,255,0.1)"
                              : EP.surface2,
                          border:
                            selectedEventId === ev.id
                              ? "1px solid rgba(143,245,255,0.25)"
                              : `1px solid transparent`,
                        }}
                      >
                        <CalendarDays
                          className="h-3.5 w-3.5 flex-shrink-0"
                          style={{
                            color:
                              selectedEventId === ev.id
                                ? EP.neonCyan
                                : "rgba(255,255,255,0.3)",
                          }}
                        />
                        <span
                          className="truncate text-xs font-medium font-['Be_Vietnam_Pro']"
                          style={{
                            color:
                              selectedEventId === ev.id
                                ? EP.neonCyan
                                : "rgba(255,255,255,0.6)",
                          }}
                        >
                          {ev.name}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Participants list */}
              {selectedEventId && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  {loadingParticipants ? (
                    <div className="flex items-center justify-center py-3">
                      <Loader2 className="h-4 w-4 animate-spin" style={{ color: EP.neonPurple }} />
                    </div>
                  ) : participants.length === 0 ? (
                    <p className="text-xs text-white/30 font-['Be_Vietnam_Pro'] py-2 text-center">
                      Keine Teilnehmer gefunden.
                    </p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30 font-['Be_Vietnam_Pro']">
                          Teilnehmer ({participants.length})
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={handleCopyAll}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold"
                          style={{
                            backgroundColor: copiedAll
                              ? "rgba(143,245,255,0.15)"
                              : "rgba(223,142,255,0.12)",
                            color: copiedAll ? EP.neonCyan : EP.neonPurple,
                          }}
                        >
                          {copiedAll ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          {copiedAll ? "Kopiert!" : "Alle einladen"}
                        </motion.button>
                      </div>

                      <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-hide">
                        {participants.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center gap-2 rounded-xl px-3 py-2"
                            style={{ backgroundColor: EP.surface2 }}
                          >
                            <div
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                              style={{
                                background: `linear-gradient(135deg, ${EP.neonPurple}, ${EP.neonPink})`,
                              }}
                            >
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="flex-1 truncate text-xs font-medium text-white/60 font-['Be_Vietnam_Pro']">
                              {p.name}
                            </span>
                            <div className="flex items-center gap-1">
                              {/* WhatsApp direct */}
                              <a href={whatsAppUrl(p.name, p.phone)} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold"
                                style={{ backgroundColor: "rgba(37,211,102,0.12)", color: "#25d366" }}>
                                <Send className="h-3 w-3" /> WA
                              </a>
                              {/* Copy personalized link */}
                              <motion.button whileTap={{ scale: 0.85 }}
                                onClick={() => { navigator.clipboard.writeText(personalLink(p.name)); setCopiedId(p.id); setTimeout(() => setCopiedId(null), 2000); }}
                                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold"
                                style={{ backgroundColor: copiedId === p.id ? "rgba(143,245,255,0.15)" : "rgba(223,142,255,0.08)", color: copiedId === p.id ? EP.neonCyan : EP.neonPurple }}>
                                {copiedId === p.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                {copiedId === p.id ? "✓" : "Link"}
                              </motion.button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Share link display */}
              <div className="rounded-xl px-3 py-2" style={{ backgroundColor: EP.surface3 }}>
                <span className="text-[10px] text-white/25 font-['Be_Vietnam_Pro'] block mb-1">
                  Einladungslink
                </span>
                <div className="flex items-center gap-2">
                  <span className="flex-1 truncate text-[11px] font-medium font-['Be_Vietnam_Pro']" style={{ color: EP.neonCyan }}>
                    {shareLink}
                  </span>
                  <CopyLinkButton text={shareLink} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CopyLinkButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="flex-shrink-0 rounded-lg p-1.5"
      style={{
        backgroundColor: copied ? "rgba(143,245,255,0.15)" : "rgba(223,142,255,0.1)",
      }}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" style={{ color: EP.neonCyan }} />
      ) : (
        <Copy className="h-3.5 w-3.5" style={{ color: EP.neonPurple }} />
      )}
    </motion.button>
  );
}
