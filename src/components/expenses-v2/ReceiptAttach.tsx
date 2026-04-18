import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Image as ImageIcon, X, Loader2, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/expenses-v2/types";
import type { ReceiptOcrResult } from "@/lib/expenses-v2/types";
import { useHaptics } from "@/hooks/useHaptics";

interface ReceiptAttachProps {
  onOcr?: (ocr: ReceiptOcrResult) => void;
  onFile: (file: File | null) => void;
  previewUrl?: string | null;
  ocr?: ReceiptOcrResult | null;
  isScanning?: boolean;
  compact?: boolean;
}

/**
 * ReceiptAttach — Camera / Gallery picker with OCR preview.
 * Two entry points: "Foto aufnehmen" (capture=environment) for iOS/
 * Android camera, and "Aus Galerie" for file picker. After capture we
 * render a thumbnail + OCR summary (merchant / total / currency /
 * confidence badge). Parent decides whether to auto-fill the expense
 * form fields.
 */
export function ReceiptAttach({
  onOcr,
  onFile,
  previewUrl,
  ocr,
  isScanning,
  compact,
}: ReceiptAttachProps) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const haptics = useHaptics();
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const pickFromCamera = async () => {
    await haptics.medium();
    cameraInput.current?.click();
  };
  const pickFromGallery = async () => {
    await haptics.light();
    galleryInput.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    onFile(file);
  };

  const preview = previewUrl ?? localPreview;

  if (!preview && !isScanning) {
    return (
      <div>
        <input
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          ref={cameraInput}
          onChange={handleChange}
          className="hidden"
        />
        <input
          type="file"
          accept="image/*,application/pdf"
          ref={galleryInput}
          onChange={handleChange}
          className="hidden"
        />
        <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2")}>
          <button
            type="button"
            onClick={pickFromCamera}
            className="h-14 rounded-2xl bg-gradient-to-br from-violet-500/15 to-cyan-500/10 border border-violet-400/25 hover:border-violet-400/50 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Camera className="w-4 h-4 text-violet-200" />
            <span className="text-sm font-semibold text-violet-100">Foto aufnehmen</span>
          </button>
          <button
            type="button"
            onClick={pickFromGallery}
            className="h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-slate-300" />
            <span className="text-sm font-semibold text-slate-200">Aus Galerie</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
      <div className="relative">
        {preview && (
          /* eslint-disable-next-line jsx-a11y/alt-text */
          <img
            src={preview}
            alt="Beleg"
            className="w-full max-h-64 object-contain bg-black/30"
          />
        )}
        <button
          type="button"
          onClick={async () => {
            await haptics.light();
            setLocalPreview(null);
            onFile(null);
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur border border-white/10 flex items-center justify-center text-white cursor-pointer"
          aria-label="Beleg entfernen"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* OCR status strip */}
      <AnimatePresence mode="wait">
        {isScanning && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-3 flex items-center gap-2 text-xs text-violet-200 border-t border-white/[0.06]"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Beleg wird analysiert …</span>
          </motion.div>
        )}
        {!isScanning && ocr && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border-t border-white/[0.06]"
          >
            <div className="px-4 py-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-emerald-300 font-bold">
              <Sparkles className="w-3 h-3" />
              OCR-Ergebnis
              <span className="ml-auto font-mono text-[10px] text-slate-400 normal-case tracking-normal">
                {Math.round((ocr.confidence ?? 0) * 100)}% sicher
              </span>
            </div>
            <div className="px-4 pb-3 text-xs text-slate-300 space-y-1">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Händler</span>
                <span className="font-medium text-slate-100 truncate">{ocr.merchant ?? "—"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Betrag</span>
                <span className="font-mono font-semibold text-white">
                  {ocr.total != null
                    ? formatMoney(ocr.total, ocr.currency ?? "EUR")
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Datum</span>
                <span className="font-mono text-slate-200">{ocr.date ?? "—"}</span>
              </div>
              {ocr.line_items?.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-slate-400 text-[11px] hover:text-slate-200">
                    {ocr.line_items.length} Positionen
                  </summary>
                  <div className="mt-1.5 space-y-0.5 font-mono text-[11px]">
                    {ocr.line_items.slice(0, 12).map((li, i) => (
                      <div key={i} className="flex justify-between gap-2 text-slate-300">
                        <span className="truncate">{li.qty ? `${li.qty}× ` : ""}{li.label}</span>
                        <span>{formatMoney(li.amount, ocr.currency ?? "EUR")}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
            {ocr.total != null && ocr.confidence >= 0.75 && onOcr && (
              <button
                type="button"
                onClick={() => onOcr(ocr)}
                className="w-full h-11 bg-gradient-to-r from-emerald-500/20 to-cyan-500/15 border-t border-emerald-500/25 text-emerald-200 text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-500/25 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Werte ins Formular übernehmen
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
