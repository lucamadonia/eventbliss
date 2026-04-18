import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, Calendar, StickyNote, Receipt as ReceiptIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SplitConfigurator } from "./SplitConfigurator";
import { ReceiptAttach } from "./ReceiptAttach";
import { useAddExpenseV2, useExpenseCategories, useReceiptUpload } from "@/hooks/expenses";
import { computeShares, formatMoney } from "@/lib/expenses-v2/types";
import type { SplitType, ReceiptOcrResult } from "@/lib/expenses-v2/types";
import { useHaptics } from "@/hooks/useHaptics";

interface Participant {
  id: string;
  name?: string;
}

interface AddExpenseSheetProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  participants: Participant[];
  currency?: string;
  defaultPayerId?: string;
}

/**
 * AddExpenseSheet — 3-snap-point bottom sheet:
 *  1) Quick (compact) — amount + title + primary payer (all you NEED)
 *  2) Detail — category, date, notes, receipt
 *  3) Split — the configurator
 *
 * Keyboard auto-focuses the amount field. Save enabled as soon as
 * amount > 0 and a description is present. Split defaults to equal
 * across all event participants.
 */
export function AddExpenseSheet({
  open,
  onClose,
  eventId,
  participants,
  currency = "EUR",
  defaultPayerId,
}: AddExpenseSheetProps) {
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState("");
  const [payerId, setPayerId] = useState<string>(defaultPayerId ?? "");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [emoji, setEmoji] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState<SplitType>("equal");
  const [shares, setShares] = useState<Array<{ participant_id: string; amount: number }>>([]);
  const [step, setStep] = useState<"quick" | "detail" | "split">("quick");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptOcr, setReceiptOcr] = useState<ReceiptOcrResult | null>(null);
  const [ocrScanning, setOcrScanning] = useState(false);

  const addExpense = useAddExpenseV2();
  const receiptUpload = useReceiptUpload();
  const haptics = useHaptics();
  const { data: categories = [] } = useExpenseCategories(eventId);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setAmount("");
    setDescription("");
    setPayerId(defaultPayerId ?? (participants[0]?.id ?? ""));
    setDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setCategoryId(null);
    setEmoji(null);
    setSplitMode("equal");
    setStep("quick");
    setShares([]);
    setReceiptFile(null);
    setReceiptPreview(null);
    setReceiptOcr(null);
    setOcrScanning(false);
  }, [open, defaultPayerId, participants]);

  // Kick off receipt upload + OCR as soon as a file is picked so the UX feels snappy
  useEffect(() => {
    if (!receiptFile) {
      setReceiptPreview(null);
      return;
    }
    setReceiptPreview(URL.createObjectURL(receiptFile));
    (async () => {
      setOcrScanning(true);
      try {
        const res = await receiptUpload.mutateAsync({
          eventId,
          file: receiptFile,
          dispatchOcr: true,
        });
        if (res.ocr) {
          setReceiptOcr(res.ocr);
          void haptics.success();
        }
      } catch {
        // handled by toast in hook
      } finally {
        setOcrScanning(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptFile, eventId]);

  const applyOcr = (ocr: ReceiptOcrResult) => {
    if (ocr.total != null) setAmount(String(ocr.total).replace(".", ","));
    if (ocr.merchant && !description) setDescription(ocr.merchant);
    if (ocr.date) setDate(ocr.date.slice(0, 10));
    void haptics.medium();
  };

  // Keep shares in sync with amount in equal mode
  const amountNum = useMemo(() => parseFloat(amount.replace(",", ".") || "0") || 0, [amount]);
  useEffect(() => {
    if (splitMode === "equal") {
      setShares(
        computeShares(amountNum, participants.map((p) => p.id), { type: "equal" }),
      );
    }
  }, [amountNum, splitMode, participants]);

  const canSave = amountNum > 0 && description.trim().length > 0 && payerId;
  const sumShares = shares.reduce((s, x) => s + x.amount, 0);
  const splitValid = Math.abs(sumShares - amountNum) < 0.01;

  const handleSave = async () => {
    if (!canSave || !splitValid) return;
    await addExpense.mutateAsync({
      eventId,
      amount: amountNum,
      currency,
      description: description.trim(),
      expenseDate: date,
      notes: notes.trim() || undefined,
      categoryId,
      emoji,
      splitType: splitMode,
      payers: [{ participant_id: payerId, amount: amountNum }],
      shares,
      createdVia: "manual",
    });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="bg-[#0B0D12] border-t border-white/10 text-white p-0 h-[92vh] max-h-[92vh] rounded-t-3xl flex flex-col"
      >
        <SheetTitle className="sr-only">Ausgabe hinzufügen</SheetTitle>

        {/* Drag handle */}
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-white/[0.06]">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Schließen"
          >
            <X className="w-4 h-4 text-slate-300" />
          </button>
          <div className="flex-1 text-center">
            <h2 className="text-base font-bold text-white">Neue Ausgabe</h2>
          </div>
          <Button
            onClick={handleSave}
            disabled={!canSave || !splitValid || addExpense.isPending}
            size="sm"
            className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {addExpense.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Speichern
              </>
            )}
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* 1) Quick — amount + title */}
          <div className="px-5 py-6">
            {/* Big amount input */}
            <div className="text-center mb-6">
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-semibold mb-2">
                Betrag
              </div>
              <div className="relative inline-flex items-baseline gap-1">
                <input
                  type="text"
                  inputMode="decimal"
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                  placeholder="0,00"
                  className="w-64 max-w-full text-center text-6xl sm:text-7xl font-black bg-transparent border-0 outline-none text-white placeholder:text-slate-700 tabular-nums tracking-tighter"
                  aria-label="Betrag"
                />
                <span className="text-2xl sm:text-3xl font-bold text-slate-500">€</span>
              </div>
            </div>

            {/* Description */}
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Wofür? z. B. Pizza, Tankstelle, Airbnb"
              className="w-full h-12 px-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-violet-400/40 transition-colors"
            />

            {/* Payer row */}
            <div className="mt-4">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
                Gezahlt von
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
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
                          : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-slate-200",
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
          </div>

          {/* 2) Detail — expand */}
          <AnimatePresence initial={false}>
            {step !== "quick" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-5 pb-4 space-y-4"
              >
                {/* Categories */}
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
                    Kategorie
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {categories.map((c) => {
                      const active = categoryId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setCategoryId(active ? null : c.id);
                            setEmoji(active ? null : c.emoji ?? null);
                          }}
                          className={cn(
                            "flex-shrink-0 h-10 px-3 rounded-full border text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5",
                            active
                              ? "bg-violet-500/20 border-violet-400/50 text-white"
                              : "bg-white/[0.03] border-white/[0.08] text-slate-400",
                          )}
                        >
                          <span>{c.emoji}</span>
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Datum
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm [color-scheme:dark] focus:outline-none focus:border-violet-400/40"
                  />
                </div>

                {/* Notes */}
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2 flex items-center gap-1.5">
                    <StickyNote className="w-3 h-3" /> Notiz (optional)
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Zusatzinfo, z. B. 'Trinkgeld schon drin'"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-violet-400/40 resize-none"
                  />
                </div>

                {/* Receipt + OCR */}
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2 flex items-center gap-1.5">
                    <ReceiptIcon className="w-3 h-3" /> Beleg (optional)
                  </div>
                  <ReceiptAttach
                    onFile={setReceiptFile}
                    onOcr={applyOcr}
                    previewUrl={receiptPreview}
                    ocr={receiptOcr}
                    isScanning={ocrScanning}
                    compact
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3) Split */}
          <AnimatePresence initial={false}>
            {step === "split" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-5 pb-4"
              >
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
                  Aufteilung
                </div>
                <SplitConfigurator
                  amount={amountNum}
                  currency={currency}
                  participants={participants}
                  value={shares}
                  onChange={setShares}
                  mode={splitMode}
                  onModeChange={setSplitMode}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expand toggles */}
          <div className="px-5 pb-5 space-y-2">
            <button
              type="button"
              onClick={() => setStep(step === "quick" ? "detail" : "quick")}
              className="w-full h-11 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-slate-300 hover:text-white hover:bg-white/[0.05] cursor-pointer transition-colors flex items-center justify-center gap-2"
            >
              {step === "quick" ? "Details hinzufügen" : "Details verbergen"}
            </button>
            <button
              type="button"
              onClick={() => setStep(step === "split" ? "detail" : "split")}
              className="w-full h-11 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-slate-300 hover:text-white hover:bg-white/[0.05] cursor-pointer transition-colors flex items-center justify-center gap-2"
            >
              {step === "split"
                ? "Aufteilung verbergen"
                : `Aufteilung anpassen (${formatMoney(sumShares, currency)})`}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
