import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  ArrowRightLeft,
  Receipt as ReceiptIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useExpenseActivity } from "@/hooks/expenses";
import { formatMoney } from "@/lib/expenses-v2/types";
import type { ExpenseActivityEntry } from "@/lib/expenses-v2/types";

interface Participant {
  id: string;
  user_id?: string | null;
  name?: string;
}

interface ActivityTimelineProps {
  eventId: string;
  participants: Participant[];
  currency?: string;
}

/**
 * Activity-Timeline — Append-only feed aller Expenses-Events.
 * Liest aus expense_activity_log (automatisch befüllt durch Trigger).
 * Gruppiert nach Tag, nutzt Verb-spezifische Icons + Farben.
 */
export function ActivityTimeline({ eventId, currency = "EUR", participants }: ActivityTimelineProps) {
  const { data, fetchNextPage, hasNextPage, isFetching, isLoading } = useExpenseActivity(eventId, 30);

  const flat = data?.pages.flat() ?? [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (flat.length === 0) {
    return (
      <div className="p-8 text-center rounded-3xl bg-white/[0.03] border border-white/[0.06]">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/15 border border-violet-500/20 flex items-center justify-center mb-3">
          <ArrowRightLeft className="w-5 h-5 text-violet-300" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200 mb-1">Noch nichts passiert</h3>
        <p className="text-xs text-slate-500">
          Alle Änderungen an Ausgaben & Zahlungen landen hier im Verlauf.
        </p>
      </div>
    );
  }

  // Group by day
  const grouped = new Map<string, ExpenseActivityEntry[]>();
  for (const e of flat) {
    const day = e.created_at.slice(0, 10);
    const list = grouped.get(day) ?? [];
    list.push(e);
    grouped.set(day, list);
  }
  const groups = Array.from(grouped.entries()).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div className="space-y-6">
      {groups.map(([day, entries]) => (
        <div key={day}>
          <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold mb-3 px-1">
            {formatDayLabel(day)}
          </div>
          <div className="relative space-y-0">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-white/[0.06] via-white/[0.10] to-white/[0.02]" />
            {entries.map((e, idx) => (
              <ActivityItem
                key={e.id}
                entry={e}
                participants={participants}
                currency={currency}
                last={idx === entries.length - 1}
              />
            ))}
          </div>
        </div>
      ))}

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetching}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
          >
            {isFetching ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Lade…
              </>
            ) : (
              "Ältere anzeigen"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------

interface ActivityItemProps {
  entry: ExpenseActivityEntry;
  participants: Participant[];
  currency: string;
  last: boolean;
}

function ActivityItem({ entry, participants, currency }: ActivityItemProps) {
  const actorName =
    participants.find((p) => p.user_id === entry.actor_user_id)?.name ?? "Jemand";
  const verbInfo = describeAction(entry);
  const time = new Date(entry.created_at).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="relative flex items-start gap-3 py-2 pl-0"
    >
      {/* Icon node */}
      <div
        className={cn(
          "relative z-10 flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border",
          verbInfo.bg,
          verbInfo.border,
        )}
      >
        <verbInfo.Icon className={cn("w-3.5 h-3.5", verbInfo.text)} />
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="text-sm text-slate-200 leading-snug">
          <span className="font-semibold text-white">{actorName}</span>{" "}
          <span className="text-slate-400">{verbInfo.verb}</span>
          {verbInfo.subject && (
            <>
              {" "}
              <span className="font-semibold text-white">{verbInfo.subject}</span>
            </>
          )}
          {verbInfo.amount !== undefined && (
            <>
              {" "}
              <span className="font-mono tabular-nums text-slate-100">
                ({formatMoney(verbInfo.amount, currency)})
              </span>
            </>
          )}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">{time}</div>
      </div>
    </motion.div>
  );
}

// -----------------------------------------------------------------------------

function describeAction(entry: ExpenseActivityEntry) {
  const payload = entry.payload as Record<string, unknown>;
  switch (entry.action) {
    case "expense.created":
      return {
        Icon: Plus,
        verb: "hat eine Ausgabe angelegt",
        subject: (payload.description as string) ?? undefined,
        amount: typeof payload.amount === "number" ? payload.amount : undefined,
        bg: "bg-violet-500/15",
        border: "border-violet-500/25",
        text: "text-violet-300",
      };
    case "expense.amount_changed":
      return {
        Icon: Pencil,
        verb: `hat den Betrag geändert von ${typeof payload.from === "number" ? formatMoney(payload.from, "EUR") : "?"} auf`,
        subject: typeof payload.to === "number" ? formatMoney(payload.to, "EUR") : undefined,
        amount: undefined,
        bg: "bg-amber-500/15",
        border: "border-amber-500/25",
        text: "text-amber-300",
      };
    case "expense.deleted":
      return {
        Icon: Trash2,
        verb: "hat eine Ausgabe gelöscht",
        subject: (payload.reason as string) ?? undefined,
        amount: undefined,
        bg: "bg-rose-500/15",
        border: "border-rose-500/25",
        text: "text-rose-300",
      };
    case "settlement.confirmed":
      return {
        Icon: CheckCircle2,
        verb: "hat eine Zahlung bestätigt",
        subject: typeof payload.method === "string" ? `via ${payload.method}` : undefined,
        amount: typeof payload.amount === "number" ? payload.amount : undefined,
        bg: "bg-emerald-500/15",
        border: "border-emerald-500/25",
        text: "text-emerald-300",
      };
    case "expense.receipt_uploaded":
      return {
        Icon: ReceiptIcon,
        verb: "hat einen Beleg hinzugefügt",
        subject: undefined,
        amount: undefined,
        bg: "bg-cyan-500/15",
        border: "border-cyan-500/25",
        text: "text-cyan-300",
      };
    default:
      return {
        Icon: ArrowRightLeft,
        verb: entry.action,
        subject: undefined,
        amount: undefined,
        bg: "bg-white/[0.06]",
        border: "border-white/[0.08]",
        text: "text-slate-400",
      };
  }
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Heute";
  if (diff === 1) return "Gestern";
  return d.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}
