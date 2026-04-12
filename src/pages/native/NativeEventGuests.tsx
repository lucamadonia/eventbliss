/**
 * NativeEventGuests — guest management tab for the Event Dashboard.
 * Displays RSVP stats, searchable guest list with swipe actions,
 * and invite tools (share link, access code).
 */
import { useMemo, useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import {
  Search,
  UserPlus,
  Copy,
  Check,
  Mail,
  Trash2,
  Shield,
  Link2,
  Hash,
} from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { spring, stagger, staggerItem, blissBloom } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type GuestStatus = "confirmed" | "maybe" | "declined" | "invited";
type GuestRole = "organizer" | "guest";

interface Guest {
  id: string;
  name: string;
  email: string;
  role: GuestRole;
  status: GuestStatus;
  avatar: string;
}

interface NativeEventGuestsProps {
  eventSlug: string;
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_GUESTS: Guest[] = [
  { id: "1",  name: "Sarah Mueller",   email: "sarah@mail.de",  role: "organizer", status: "confirmed", avatar: "S" },
  { id: "2",  name: "Max Hoffmann",    email: "max@mail.de",    role: "guest",     status: "confirmed", avatar: "M" },
  { id: "3",  name: "Lisa Weber",      email: "lisa@mail.de",   role: "guest",     status: "confirmed", avatar: "L" },
  { id: "4",  name: "Tom Schmidt",     email: "tom@mail.de",    role: "guest",     status: "maybe",     avatar: "T" },
  { id: "5",  name: "Anna Klein",      email: "anna@mail.de",   role: "guest",     status: "confirmed", avatar: "A" },
  { id: "6",  name: "Felix Braun",     email: "felix@mail.de",  role: "guest",     status: "confirmed", avatar: "F" },
  { id: "7",  name: "Julia Fischer",   email: "julia@mail.de",  role: "guest",     status: "maybe",     avatar: "J" },
  { id: "8",  name: "Lukas Meyer",     email: "lukas@mail.de",  role: "guest",     status: "confirmed", avatar: "L" },
  { id: "9",  name: "Emma Richter",    email: "emma@mail.de",   role: "guest",     status: "maybe",     avatar: "E" },
  { id: "10", name: "Paul Wagner",     email: "paul@mail.de",   role: "guest",     status: "declined",  avatar: "P" },
];

const ACCESS_CODE = "ABCD1234";

/* ------------------------------------------------------------------ */
/*  Status config                                                      */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<GuestStatus, { dot: string; bg: string; label: string }> = {
  confirmed: { dot: "bg-emerald-500", bg: "from-emerald-500 to-emerald-600", label: "Zusage" },
  maybe:     { dot: "bg-amber-500",   bg: "from-amber-500 to-amber-600",     label: "Vielleicht" },
  declined:  { dot: "bg-red-500",     bg: "from-red-500 to-red-600",         label: "Absage" },
  invited:   { dot: "bg-zinc-400",    bg: "from-zinc-400 to-zinc-500",       label: "Eingeladen" },
};

const AVATAR_GRADIENTS: Record<GuestStatus, string> = {
  confirmed: "from-emerald-500 to-teal-600",
  maybe:     "from-amber-400 to-orange-500",
  declined:  "from-red-400 to-rose-600",
  invited:   "from-zinc-400 to-zinc-500",
};

/* ------------------------------------------------------------------ */
/*  Swipeable Guest Card                                               */
/* ------------------------------------------------------------------ */

function GuestCard({ guest }: { guest: Guest }) {
  const haptics = useHaptics();
  const x = useMotionValue(0);
  const actionOpacity = useTransform(x, [-120, -60, 0], [1, 0.6, 0]);
  const actionScale = useTransform(x, [-120, -60, 0], [1, 0.85, 0.6]);

  const cfg = STATUS_CONFIG[guest.status];
  const grad = AVATAR_GRADIENTS[guest.status];

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Swipe-behind actions */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-center gap-2 pr-4"
        style={{ opacity: actionOpacity, scale: actionScale }}
      >
        <button
          className="w-10 h-10 rounded-xl bg-blue-500/90 flex items-center justify-center shadow-lg"
          onClick={() => haptics.light()}
        >
          <Mail className="w-4 h-4 text-white" />
        </button>
        <button
          className="w-10 h-10 rounded-xl bg-red-500/90 flex items-center justify-center shadow-lg"
          onClick={() => haptics.light()}
        >
          <Trash2 className="w-4 h-4 text-white" />
        </button>
      </motion.div>

      {/* Card body — draggable */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.15}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.x) < 40) {
            // snap back
          }
          haptics.light();
        }}
        whileTap={{ scale: 0.98 }}
        transition={spring.snappy}
        className="relative z-10 flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border"
      >
        {/* Avatar */}
        <div
          className={cn(
            "w-11 h-11 rounded-full flex items-center justify-center shrink-0",
            "bg-gradient-to-br shadow-lg",
            grad
          )}
        >
          <span className="text-sm font-bold text-white">{guest.avatar}</span>
        </div>

        {/* Name + Email */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{guest.name}</p>
          <p className="text-xs text-muted-foreground truncate">{guest.email}</p>
        </div>

        {/* Role badge */}
        {guest.role === "organizer" ? (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/20">
            <Shield className="w-2.5 h-2.5" />
            Organisator
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-foreground/5 text-muted-foreground border border-border">
            Gast
          </span>
        )}

        {/* Status dot */}
        <div className="relative shrink-0">
          <div className={cn("w-2.5 h-2.5 rounded-full", cfg.dot)} />
          {guest.status === "confirmed" && (
            <div className={cn("absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping opacity-30", cfg.dot)} />
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function NativeEventGuests({ eventSlug }: NativeEventGuestsProps) {
  const haptics = useHaptics();
  const [search, setSearch] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const confirmed = MOCK_GUESTS.filter((g) => g.status === "confirmed").length;
    const maybe = MOCK_GUESTS.filter((g) => g.status === "maybe").length;
    const declined = MOCK_GUESTS.filter((g) => g.status === "declined").length;
    return { confirmed, maybe, declined };
  }, []);

  // Filtered guests
  const filtered = useMemo(() => {
    if (!search.trim()) return MOCK_GUESTS;
    const q = search.toLowerCase();
    return MOCK_GUESTS.filter(
      (g) => g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q)
    );
  }, [search]);

  // Copy helpers
  const copyLink = useCallback(() => {
    navigator.clipboard?.writeText(`https://event-bliss.com/e/${eventSlug}`);
    setCopiedLink(true);
    haptics.success();
    setTimeout(() => setCopiedLink(false), 2000);
  }, [eventSlug, haptics]);

  const copyCode = useCallback(() => {
    navigator.clipboard?.writeText(ACCESS_CODE);
    setCopiedCode(true);
    haptics.success();
    setTimeout(() => setCopiedCode(false), 2000);
  }, [haptics]);

  const isEmpty = filtered.length === 0 && search.trim() !== "";
  const noGuests = MOCK_GUESTS.length === 0;

  return (
    <div className="relative flex flex-col h-full">
      {/* Stats Row */}
      <div className="px-5 pt-4 pb-3">
        <motion.div
          className="flex gap-2"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {/* Confirmed */}
          <motion.div
            variants={staggerItem}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20"
          >
            <span className="text-xs font-bold text-emerald-500">&#10003;</span>
            <span className="text-xs font-semibold text-emerald-400">
              {stats.confirmed} Zusagen
            </span>
          </motion.div>

          {/* Maybe */}
          <motion.div
            variants={staggerItem}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full bg-amber-500/10 border border-amber-500/20"
          >
            <span className="text-xs font-bold text-amber-500">?</span>
            <span className="text-xs font-semibold text-amber-400">
              {stats.maybe} Vielleicht
            </span>
          </motion.div>

          {/* Declined */}
          <motion.div
            variants={staggerItem}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full bg-red-500/10 border border-red-500/20"
          >
            <span className="text-xs font-bold text-red-500">&#10007;</span>
            <span className="text-xs font-semibold text-red-400">
              {stats.declined} Absage
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Search Bar */}
      <div className="px-5 pb-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.soft}
          className="relative"
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Gaeste suchen..."
            className={cn(
              "w-full h-10 pl-10 pr-4 rounded-xl text-sm",
              "bg-foreground/[0.06] backdrop-blur-lg border border-border",
              "text-foreground placeholder:text-muted-foreground/60",
              "focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40",
              "transition-all"
            )}
          />
        </motion.div>
      </div>

      {/* Guest List */}
      <div className="flex-1 overflow-y-auto native-scroll px-5 pb-4">
        {noGuests ? (
          /* Empty State — no guests at all */
          <motion.div
            {...blissBloom}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <UserPlus className="w-7 h-7 text-violet-400" />
            </div>
            <p className="text-base font-display font-semibold text-foreground mb-1">
              Noch keine Gaeste
            </p>
            <p className="text-sm text-muted-foreground max-w-[240px]">
              Lade Freunde und Familie ein, damit sie zusagen koennen.
            </p>
          </motion.div>
        ) : isEmpty ? (
          /* Empty search results */
          <motion.div
            {...blissBloom}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-foreground/5 border border-border flex items-center justify-center mb-3">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-0.5">
              Kein Ergebnis
            </p>
            <p className="text-xs text-muted-foreground">
              Kein Gast passt zu "{search}"
            </p>
          </motion.div>
        ) : (
          /* Guest cards */
          <motion.div
            className="flex flex-col gap-2"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((guest) => (
                <motion.div
                  key={guest.id}
                  variants={staggerItem}
                  layout
                  exit={{ opacity: 0, x: -60, transition: { duration: 0.2 } }}
                >
                  <GuestCard guest={guest} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Invite Section */}
        {!noGuests && (
          <motion.div
            className="mt-6 flex flex-col gap-3 pb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.soft, delay: 0.3 }}
          >
            {/* Invite Button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
              onClick={() => haptics.medium()}
              className={cn(
                "w-full py-3.5 rounded-2xl font-semibold text-sm text-white",
                "bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600",
                "shadow-[0_4px_24px_rgba(139,92,246,0.35)]",
                "active:shadow-[0_2px_12px_rgba(139,92,246,0.25)]",
                "flex items-center justify-center gap-2",
                "transition-shadow"
              )}
            >
              <UserPlus className="w-4.5 h-4.5" />
              Gaeste einladen
            </motion.button>

            {/* Share Link Card */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              transition={spring.snappy}
              onClick={copyLink}
              className={cn(
                "flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer",
                "bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur",
                "border border-border"
              )}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                <Link2 className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">Einladungslink</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  event-bliss.com/e/{eventSlug}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-foreground/5 border border-border flex items-center justify-center shrink-0">
                {copiedLink ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
            </motion.div>

            {/* Access Code Card */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              transition={spring.snappy}
              onClick={copyCode}
              className={cn(
                "flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer",
                "bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur",
                "border border-border"
              )}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(139,92,246,0.25)]">
                <Hash className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">Event-Code</p>
                <p className="text-sm font-mono font-bold tracking-widest text-foreground">
                  {ACCESS_CODE}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-foreground/5 border border-border flex items-center justify-center shrink-0">
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
