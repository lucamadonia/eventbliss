import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Play,
  Pause,
  Trash2,
  CalendarClock,
  Sparkles,
  Loader2,
  X,
  Save,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  useRecurringTemplates,
  useCreateRecurringTemplate,
  useToggleRecurringTemplate,
} from "@/hooks/expenses";
import { useHaptics } from "@/hooks/useHaptics";
import { formatMoney, computeShares } from "@/lib/expenses-v2/types";
import type { RecurringFrequency } from "@/lib/expenses-v2/types";

interface Participant {
  id: string;
  user_id?: string | null;
  name?: string;
}

interface RecurringPanelProps {
  eventId: string;
  participants: Participant[];
  currency?: string;
  defaultPayerId?: string;
}

const FREQ_LABELS: Record<RecurringFrequency, { label: string; emoji: string }> = {
  daily: { label: "Täglich", emoji: "🔁" },
  weekly: { label: "Wöchentlich", emoji: "📅" },
  biweekly: { label: "Alle 2 Wochen", emoji: "↔️" },
  monthly: { label: "Monatlich", emoji: "📆" },
};

/**
 * RecurringPanel — list + create + toggle recurring expense templates.
 * Templates automatically materialize into real expenses on their
 * next_run_date via a (future) scheduled edge function.
 */
export function RecurringPanel({
  eventId,
  participants,
  currency = "EUR",
  defaultPayerId,
}: RecurringPanelProps) {
  const { data: templates = [], isLoading } = useRecurringTemplates(eventId);
  const toggle = useToggleRecurringTemplate(eventId);
  const haptics = useHaptics();
  const [createOpen, setCreateOpen] = useState(false);

  const active = templates.filter((t) => t.is_active);
  const paused = templates.filter((t) => !t.is_active);

  return (
    <div className="space-y-5">
      {/* Header + create button */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-violet-300" />
            Wiederkehrende Ausgaben
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Miete, Groceries, Abos — werden automatisch angelegt
          </p>
        </div>
        <Button
          size="sm"
          onClick={async () => {
            await haptics.medium();
            setCreateOpen(true);
          }}
          className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Neu
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse"
            />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyRecurring onAdd={() => setCreateOpen(true)} />
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-300 font-bold mb-2 px-1">
                Aktiv ({active.length})
              </div>
              <div className="space-y-2">
                {active.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    currency={currency}
                    onToggle={async () => {
                      await haptics.light();
                      toggle.mutate({ id: t.id, active: false });
                    }}
                  />
                ))}
              </div>
            </section>
          )}
          {paused.length > 0 && (
            <section>
              <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold mb-2 px-1">
                Pausiert ({paused.length})
              </div>
              <div className="space-y-2">
                {paused.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    currency={currency}
                    paused
                    onToggle={async () => {
                      await haptics.light();
                      toggle.mutate({ id: t.id, active: true });
                    }}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <CreateRecurringSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        eventId={eventId}
        participants={participants}
        currency={currency}
        defaultPayerId={defaultPayerId}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------

function TemplateCard({
  template: t,
  currency,
  paused,
  onToggle,
}: {
  template: ReturnType<typeof useRecurringTemplates>["data"] extends Array<infer T>
    ? T
    : never;
  currency: string;
  paused?: boolean;
  onToggle: () => void;
}) {
  const freq = FREQ_LABELS[t.frequency] ?? FREQ_LABELS.monthly;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "rounded-2xl border p-4 flex items-center gap-3",
        paused
          ? "bg-white/[0.02] border-white/[0.06] opacity-60"
          : "bg-gradient-to-br from-violet-500/[0.06] via-[#14171F] to-[#14171F] border-violet-500/20",
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border shrink-0",
          paused
            ? "bg-white/[0.03] border-white/[0.08]"
            : "bg-white/[0.05] border-white/[0.08]",
        )}
      >
        {t.emoji ?? "🔁"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{t.title}</div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
          <span>{freq.emoji}</span>
          <span>{freq.label}</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-500">
            Nächste: {new Date(t.next_run_date).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-sm font-bold tabular-nums text-white">
          {formatMoney(t.amount, t.currency ?? currency)}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center border cursor-pointer transition-colors",
            paused
              ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/25"
              : "bg-white/[0.05] border-white/[0.08] text-slate-300 hover:bg-white/[0.1]",
          )}
          aria-label={paused ? "Aktivieren" : "Pausieren"}
        >
          {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
        </button>
      </div>
    </motion.div>
  );
}

// -----------------------------------------------------------------------------

function EmptyRecurring({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 text-center rounded-3xl bg-gradient-to-br from-violet-500/[0.05] via-[#14171F] to-cyan-500/[0.04] border border-violet-500/15"
    >
      <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mb-3 shadow-lg shadow-violet-500/30">
        <CalendarClock className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-base font-bold text-white mb-1">Noch keine Vorlagen</h3>
      <p className="text-xs text-slate-400 mb-4 max-w-xs mx-auto leading-relaxed">
        Leg wiederkehrende Ausgaben wie Miete, Streaming oder Wochenend-Groceries einmal an — der Rest passiert automatisch.
      </p>
      <Button
        onClick={onAdd}
        className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white"
      >
        <Plus className="w-4 h-4 mr-1.5" />
        Erste Vorlage anlegen
      </Button>
    </motion.div>
  );
}

// -----------------------------------------------------------------------------
// Create sheet
// -----------------------------------------------------------------------------

function CreateRecurringSheet({
  open,
  onClose,
  eventId,
  participants,
  currency,
  defaultPayerId,
}: {
  open: boolean;
  onClose: () => void;
  eventId: string;
  participants: Participant[];
  currency: string;
  defaultPayerId?: string;
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [emoji, setEmoji] = useState<string>("🔁");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [nextRunDate, setNextRunDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  );
  const [payerId, setPayerId] = useState(defaultPayerId ?? participants[0]?.id ?? "");

  const create = useCreateRecurringTemplate();
  const haptics = useHaptics();

  const amountNum = parseFloat(amount.replace(",", ".") || "0") || 0;
  const canSave = title.trim().length > 0 && amountNum > 0 && payerId && nextRunDate;

  const handleSave = async () => {
    if (!canSave) return;
    const shares = computeShares(
      amountNum,
      participants.map((p) => p.id),
      { type: "equal" },
    );
    await haptics.medium();
    await create.mutateAsync({
      eventId,
      title: title.trim(),
      amount: amountNum,
      currency,
      emoji,
      splitConfig: { type: "equal" },
      payerConfig: [{ participant_id: payerId, amount: amountNum }],
      frequency,
      nextRunDate,
    });
    setTitle("");
    setAmount("");
    setEmoji("🔁");
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="bg-[#0B0D12] border-t border-white/10 text-white p-0 h-[80vh] max-h-[80vh] rounded-t-3xl flex flex-col"
      >
        <SheetTitle className="sr-only">Neue wiederkehrende Ausgabe</SheetTitle>

        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-white/20" />
        </div>

        <div className="px-5 py-3 flex items-center justify-between border-b border-white/[0.06]">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center cursor-pointer"
            aria-label="Schließen"
          >
            <X className="w-4 h-4 text-slate-300" />
          </button>
          <h2 className="text-base font-bold text-white">Neue Vorlage</h2>
          <Button
            onClick={handleSave}
            disabled={!canSave || create.isPending}
            size="sm"
            className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white disabled:opacity-40"
          >
            {create.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1" />
                Speichern
              </>
            )}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Title + emoji */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const picks = ["🔁", "🏠", "🛒", "☕", "🎬", "🚗", "💡", "📱", "🎵"];
                setEmoji(picks[(picks.indexOf(emoji) + 1) % picks.length]);
              }}
              className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-2xl cursor-pointer hover:border-violet-400/40"
              aria-label="Emoji wechseln"
            >
              {emoji}
            </button>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titel, z. B. Miete"
              className="flex-1 h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500"
            />
          </div>

          {/* Amount */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
              Betrag
            </div>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                placeholder="0,00"
                className="w-full h-14 px-4 pr-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white text-2xl font-bold placeholder:text-slate-500 tabular-nums focus:outline-none focus:border-violet-400/40"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">€</span>
            </div>
          </div>

          {/* Frequency */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
              Häufigkeit
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(FREQ_LABELS) as RecurringFrequency[]).map((f) => {
                const active = frequency === f;
                const cfg = FREQ_LABELS[f];
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className={cn(
                      "h-11 px-3 rounded-xl border flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors",
                      active
                        ? "bg-gradient-to-r from-violet-500/25 to-cyan-500/20 border-violet-400/50 text-white"
                        : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-slate-200",
                    )}
                  >
                    <span>{cfg.emoji}</span>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Next run */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
              Start-Datum
            </div>
            <input
              type="date"
              value={nextRunDate}
              onChange={(e) => setNextRunDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full h-11 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm [color-scheme:dark]"
            />
          </div>

          {/* Payer */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
              Gezahlt von
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {participants.map((p) => {
                const active = payerId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPayerId(p.id)}
                    className={cn(
                      "flex-shrink-0 h-11 px-4 rounded-full border text-sm font-medium cursor-pointer transition-colors flex items-center gap-2",
                      active
                        ? "bg-gradient-to-r from-violet-500/25 to-cyan-500/25 border-violet-400/50 text-white"
                        : "bg-white/[0.03] border-white/[0.08] text-slate-400",
                    )}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center",
                        active ? "bg-white/20" : "bg-white/[0.06]",
                      )}
                    >
                      {(p.name ?? "?").slice(0, 1).toUpperCase()}
                    </div>
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-4 py-3 rounded-xl bg-violet-500/5 border border-violet-500/15">
            <p className="text-[11px] text-violet-300/80 leading-relaxed flex items-start gap-2">
              <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>
                Aufteilung: <strong>gleichmäßig</strong> auf alle {participants.length} Teilnehmer.
                Ab Phase 5b sind Prozent/Custom-Splits für Vorlagen möglich.
              </span>
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
