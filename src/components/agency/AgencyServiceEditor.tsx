import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Image, Send, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────────── */
interface ServiceFormData {
  title: string;
  shortDescription: string;
  category: string;
  price: string;
  priceType: string;
  minParticipants: string;
  maxParticipants: string;
  locationType: string;
  address: string;
  city: string;
  description: string;
  included: string;
  requirements: string;
  leadTimeDays: string;
  cancellationPolicy: string;
  autoConfirm: boolean;
}

interface ServiceEditorProps {
  open: boolean;
  onClose: () => void;
  service?: {
    id: string;
    title: string;
    category: string;
    price: number;
    priceType: string;
  } | null;
}

const categories = [
  { value: "workshop", label: "Workshop" },
  { value: "entertainment", label: "Entertainment" },
  { value: "catering", label: "Catering" },
  { value: "music", label: "Musik" },
  { value: "photography", label: "Fotografie" },
  { value: "venue", label: "Location" },
  { value: "wellness", label: "Wellness" },
  { value: "sport", label: "Sport" },
  { value: "decoration", label: "Dekoration" },
  { value: "transport", label: "Transport" },
  { value: "other", label: "Sonstiges" },
];

const priceTypes = [
  { value: "per_person", label: "pro Person" },
  { value: "flat", label: "Pauschal" },
  { value: "per_hour", label: "pro Stunde" },
];

const locationTypes = [
  { value: "onsite", label: "Vor Ort beim Kunden" },
  { value: "own_venue", label: "Eigene Location" },
  { value: "outdoor", label: "Outdoor" },
  { value: "online", label: "Online" },
  { value: "flexible", label: "Flexibel" },
];

const cancellationPolicies = [
  { value: "flexible", label: "Flexibel (24h vorher)" },
  { value: "moderate", label: "Moderat (7 Tage vorher)" },
  { value: "strict", label: "Streng (14 Tage vorher)" },
  { value: "none", label: "Keine Stornierung" },
];

const emptyForm: ServiceFormData = {
  title: "",
  shortDescription: "",
  category: "workshop",
  price: "",
  priceType: "per_person",
  minParticipants: "",
  maxParticipants: "",
  locationType: "flexible",
  address: "",
  city: "",
  description: "",
  included: "",
  requirements: "",
  leadTimeDays: "7",
  cancellationPolicy: "moderate",
  autoConfirm: false,
};

/* ─── Select Component ───────────────────────────────── */
function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 text-sm bg-white/[0.04] border border-white/[0.08] text-slate-100 rounded-xl outline-none focus:border-violet-500/40 focus:shadow-[0_0_12px_rgba(139,92,246,0.1)] transition-all appearance-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#1a1625] text-slate-200">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ─── Section Wrapper ────────────────────────────────── */
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

/* ─── Field Wrapper ──────────────────────────────────── */
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-400">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-white/[0.04] border-white/[0.08] text-slate-100 text-sm placeholder:text-slate-600 rounded-xl focus:border-violet-500/40 focus:shadow-[0_0_12px_rgba(139,92,246,0.1)] transition-all";

const textareaClass =
  "w-full bg-white/[0.04] border border-white/[0.08] text-slate-100 text-sm placeholder:text-slate-600 rounded-xl px-3 py-2.5 outline-none resize-none focus:border-violet-500/40 focus:shadow-[0_0_12px_rgba(139,92,246,0.1)] transition-all";

/* ─── Main Component ─────────────────────────────────── */
export function AgencyServiceEditor({ open, onClose, service }: ServiceEditorProps) {
  const [form, setForm] = useState<ServiceFormData>(emptyForm);
  const isEditing = !!service;

  useEffect(() => {
    if (service) {
      setForm({
        ...emptyForm,
        title: service.title,
        category: categories.find((c) => c.label === service.category)?.value || "workshop",
        price: String(service.price),
        priceType: service.priceType === "Pauschal" ? "flat" : service.priceType === "pro Stunde" ? "per_hour" : "per_person",
      });
    } else {
      setForm(emptyForm);
    }
  }, [service, open]);

  const update = <K extends keyof ServiceFormData>(key: K, value: ServiceFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSaveDraft = () => {
    // Mock: would save to backend
    onClose();
  };

  const handleSubmitForReview = () => {
    // Mock: would submit for review
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#1a1625]/98 backdrop-blur-2xl border-l border-white/[0.06] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
              <h3 className="text-base font-semibold text-slate-50">
                {isEditing ? "Service bearbeiten" : "Service erstellen"}
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/5 px-6 py-5 space-y-6">
              {/* Basis */}
              <FormSection title="Basis">
                <FormField label="Titel">
                  <Input
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="z.B. Premium Cocktail Workshop"
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Kurzbeschreibung">
                  <textarea
                    value={form.shortDescription}
                    onChange={(e) => update("shortDescription", e.target.value)}
                    placeholder="Max. 160 Zeichen"
                    rows={2}
                    maxLength={160}
                    className={textareaClass}
                  />
                </FormField>
                <FormSelect
                  label="Kategorie"
                  value={form.category}
                  onChange={(v) => update("category", v)}
                  options={categories}
                />
              </FormSection>

              {/* Preis */}
              <FormSection title="Preis">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Preis (EUR)">
                    <Input
                      type="number"
                      value={form.price}
                      onChange={(e) => update("price", e.target.value)}
                      placeholder="0.00"
                      className={inputClass}
                    />
                  </FormField>
                  <FormSelect
                    label="Preistyp"
                    value={form.priceType}
                    onChange={(v) => update("priceType", v)}
                    options={priceTypes}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Min. Teilnehmer">
                    <Input
                      type="number"
                      value={form.minParticipants}
                      onChange={(e) => update("minParticipants", e.target.value)}
                      placeholder="1"
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="Max. Teilnehmer">
                    <Input
                      type="number"
                      value={form.maxParticipants}
                      onChange={(e) => update("maxParticipants", e.target.value)}
                      placeholder="50"
                      className={inputClass}
                    />
                  </FormField>
                </div>
              </FormSection>

              {/* Ort */}
              <FormSection title="Ort">
                <FormSelect
                  label="Ortstyp"
                  value={form.locationType}
                  onChange={(v) => update("locationType", v)}
                  options={locationTypes}
                />
                <FormField label="Adresse">
                  <Input
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    placeholder="Strasse und Hausnummer"
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Stadt">
                  <Input
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    placeholder="z.B. Hamburg"
                    className={inputClass}
                  />
                </FormField>
              </FormSection>

              {/* Medien */}
              <FormSection title="Medien">
                <FormField label="Cover-Bild">
                  <div className="border-2 border-dashed border-white/[0.08] rounded-xl p-8 text-center hover:border-violet-500/30 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">
                      Bild hierher ziehen oder <span className="text-violet-400">durchsuchen</span>
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">JPG, PNG, WebP — max. 5 MB</p>
                  </div>
                </FormField>
                <FormField label="Galerie">
                  <div className="border-2 border-dashed border-white/[0.08] rounded-xl p-6 text-center hover:border-violet-500/30 transition-colors cursor-pointer">
                    <Image className="w-6 h-6 text-slate-600 mx-auto mb-1.5" />
                    <p className="text-xs text-slate-500">Weitere Bilder hinzufuegen</p>
                  </div>
                </FormField>
              </FormSection>

              {/* Details */}
              <FormSection title="Details">
                <FormField label="Beschreibung">
                  <textarea
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Ausfuehrliche Beschreibung deines Service..."
                    rows={6}
                    className={textareaClass}
                  />
                </FormField>
                <FormField label="Inklusive (kommagetrennt)">
                  <Input
                    value={form.included}
                    onChange={(e) => update("included", e.target.value)}
                    placeholder="z.B. Material, Getraenke, Anleitung"
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Voraussetzungen">
                  <Input
                    value={form.requirements}
                    onChange={(e) => update("requirements", e.target.value)}
                    placeholder="z.B. Mindestalter 18, wetterfeste Kleidung"
                    className={inputClass}
                  />
                </FormField>
              </FormSection>

              {/* Buchungseinstellungen */}
              <FormSection title="Buchungseinstellungen">
                <FormField label="Vorlaufzeit (Tage)">
                  <Input
                    type="number"
                    value={form.leadTimeDays}
                    onChange={(e) => update("leadTimeDays", e.target.value)}
                    placeholder="7"
                    className={inputClass}
                  />
                </FormField>
                <FormSelect
                  label="Stornierungspolitik"
                  value={form.cancellationPolicy}
                  onChange={(v) => update("cancellationPolicy", v)}
                  options={cancellationPolicies}
                />
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-medium text-slate-300">Auto-Bestaetigung</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      Buchungen automatisch bestaetigen
                    </p>
                  </div>
                  <button
                    onClick={() => update("autoConfirm", !form.autoConfirm)}
                    className={cn(
                      "w-10 h-5.5 rounded-full transition-colors cursor-pointer relative",
                      form.autoConfirm ? "bg-violet-500" : "bg-white/[0.1]"
                    )}
                  >
                    <motion.div
                      animate={{ x: form.autoConfirm ? 18 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm"
                    />
                  </button>
                </div>
              </FormSection>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-white/[0.06] shrink-0">
              <Button
                onClick={handleSaveDraft}
                variant="outline"
                className="flex-1 border-white/[0.1] text-slate-300 hover:bg-white/[0.04] cursor-pointer"
              >
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </Button>
              <Button
                onClick={handleSubmitForReview}
                className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white cursor-pointer"
              >
                <Send className="w-4 h-4 mr-2" />
                Zur Pruefung einreichen
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
