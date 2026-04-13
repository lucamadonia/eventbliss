import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Image, Send, Save, Loader2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCreateService, useUpdateService, useSubmitForReview } from "@/hooks/useAgencyServices";
import { AgencyAvailabilityEditor } from "./AgencyAvailabilityEditor";

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
  bookingMode: "internal" | "external_redirect" | "external_api";
  externalBookingUrl: string;
}

interface ServiceEditorProps {
  open: boolean;
  onClose: () => void;
  agencyId: string;
  service?: {
    id: string;
    title: string;
    category: string;
    price: number;
    priceType: string;
    shortDescription?: string;
    description?: string;
    includes?: string[];
    requirements?: string[];
    minParticipants?: number;
    maxParticipants?: number;
    locationType?: string;
    locationAddress?: string;
    locationCity?: string;
    leadTimeDays?: number;
    cancellationPolicy?: string;
    autoConfirm?: boolean;
    bookingMode?: string;
    externalBookingUrl?: string;
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
  bookingMode: "internal",
  externalBookingUrl: "",
};

const bookingModes = [
  {
    value: "internal" as const,
    label: "Intern",
    description: "EventBliss Buchungssystem mit eigenem Kalender",
    icon: "📅",
  },
  {
    value: "external_redirect" as const,
    label: "Externer Link",
    description: "Weiterleitung zu deinem eigenen Buchungssystem",
    icon: "🔗",
  },
  {
    value: "external_api" as const,
    label: "API-Integration",
    description: "Verbindung mit Calendly, cal.com oder eigenem System",
    icon: "⚡",
    comingSoon: true,
  },
];

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
export function AgencyServiceEditor({ open, onClose, agencyId, service }: ServiceEditorProps) {
  const [form, setForm] = useState<ServiceFormData>(emptyForm);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const isEditing = !!service;
  const createService = useCreateService();
  const updateService = useUpdateService();
  const submitForReview = useSubmitForReview();

  useEffect(() => {
    if (service) {
      setForm({
        ...emptyForm,
        title: service.title || "",
        shortDescription: service.shortDescription || "",
        description: service.description || "",
        category: categories.find((c) => c.value === service.category || c.label === service.category)?.value || "workshop",
        price: String(service.price || 0),
        priceType: service.priceType === "Pauschal" ? "flat" : service.priceType === "pro Stunde" ? "per_hour" : service.priceType || "per_person",
        minParticipants: service.minParticipants ? String(service.minParticipants) : "",
        maxParticipants: service.maxParticipants ? String(service.maxParticipants) : "",
        locationType: service.locationType || "flexible",
        address: service.locationAddress || "",
        city: service.locationCity || "",
        included: (service.includes || []).join("\n"),
        requirements: (service.requirements || []).join("\n"),
        leadTimeDays: service.leadTimeDays ? String(service.leadTimeDays) : "7",
        cancellationPolicy: service.cancellationPolicy || "moderate",
        autoConfirm: service.autoConfirm || false,
        bookingMode: (service.bookingMode as any) || "internal",
        externalBookingUrl: service.externalBookingUrl || "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [service, open]);

  const update = <K extends keyof ServiceFormData>(key: K, value: ServiceFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isSaving = createService.isPending || updateService.isPending || submitForReview.isPending;

  const buildInput = () => ({
    agency_id: agencyId,
    title: form.title,
    short_description: form.shortDescription || undefined,
    description: form.description || undefined,
    category: form.category,
    price_cents: Math.round(parseFloat(form.price || "0") * 100),
    price_type: form.priceType,
    min_participants: form.minParticipants ? parseInt(form.minParticipants) : undefined,
    max_participants: form.maxParticipants ? parseInt(form.maxParticipants) : undefined,
    location_type: form.locationType || "flexible",
    location_address: form.address || undefined,
    location_city: form.city || undefined,
    advance_booking_days: form.leadTimeDays ? parseInt(form.leadTimeDays) : 2,
    cancellation_policy: form.cancellationPolicy || "moderate",
    auto_confirm: form.autoConfirm,
    includes: form.included ? form.included.split("\n").filter(Boolean) : [],
    requirements: form.requirements ? form.requirements.split("\n").filter(Boolean) : [],
    booking_mode: form.bookingMode,
    external_booking_url: form.bookingMode === "external_redirect" ? form.externalBookingUrl || undefined : undefined,
  });

  const handleSaveDraft = () => {
    if (!form.title || !form.price) return;
    const input = buildInput();
    if (isEditing && service) {
      const { agency_id, ...fields } = input;
      updateService.mutate({ id: service.id, agencyId: agency_id, ...fields }, { onSuccess: () => onClose() });
    } else {
      createService.mutate(input, { onSuccess: () => { setForm(emptyForm); onClose(); } });
    }
  };

  const handleSubmitForReview = () => {
    if (!form.title || !form.price) return;
    const input = buildInput();
    if (isEditing && service) {
      submitForReview.mutate({ id: service.id, agencyId: agencyId }, { onSuccess: () => onClose() });
    } else {
      createService.mutate(input, {
        onSuccess: (data) => {
          submitForReview.mutate({ id: data.id, agencyId }, { onSuccess: () => { setForm(emptyForm); onClose(); } });
        },
      });
    }
  };

  return (
    <>
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

              {/* Verfügbarkeit */}
              <FormSection title="Verfügbarkeit">
                {isEditing && service ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAvailabilityOpen(true)}
                    className="w-full border-white/[0.1] text-slate-300 hover:bg-white/[0.04] cursor-pointer"
                  >
                    <CalendarClock className="w-4 h-4 mr-2" />
                    Verfügbarkeit bearbeiten
                  </Button>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Verfügbarkeit kann nach dem Speichern konfiguriert werden.
                  </p>
                )}
              </FormSection>

              {/* Buchungsmodus */}
              <FormSection title="Buchungsmodus">
                <div className="space-y-2">
                  {bookingModes.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      disabled={mode.comingSoon}
                      onClick={() => !mode.comingSoon && update("bookingMode", mode.value)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-all duration-200 relative",
                        mode.comingSoon
                          ? "opacity-50 cursor-not-allowed border-white/[0.04] bg-white/[0.01]"
                          : "cursor-pointer",
                        !mode.comingSoon && form.bookingMode === mode.value
                          ? "border-violet-500/40 bg-violet-500/10"
                          : !mode.comingSoon
                            ? "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
                            : ""
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] text-sm shrink-0 mt-0.5">
                          {mode.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn(
                              "text-xs font-medium",
                              form.bookingMode === mode.value && !mode.comingSoon ? "text-violet-300" : "text-slate-300"
                            )}>
                              {mode.label}
                            </p>
                            {mode.comingSoon && (
                              <span className="text-[8px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
                                Demnächst
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-600 mt-0.5">{mode.description}</p>
                        </div>
                        {!mode.comingSoon && (
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center transition-colors",
                            form.bookingMode === mode.value
                              ? "border-violet-500 bg-violet-500"
                              : "border-white/[0.15]"
                          )}>
                            {form.bookingMode === mode.value && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* External URL field (shown for external_redirect) */}
                {form.bookingMode === "external_redirect" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FormField label="Buchungs-URL">
                      <Input
                        type="url"
                        value={form.externalBookingUrl}
                        onChange={(e) => update("externalBookingUrl", e.target.value)}
                        placeholder="https://dein-buchungssystem.de/buchen"
                        className={inputClass}
                      />
                      <p className="text-[10px] text-slate-600 mt-1">
                        Kunden werden zu dieser URL weitergeleitet, um eine Buchung abzuschließen.
                      </p>
                    </FormField>
                  </motion.div>
                )}

                {/* Coming soon message for API mode */}
                {form.bookingMode === "external_api" && (
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                    <p className="text-[10px] text-amber-300/70">
                      API-Integrationen mit Calendly, cal.com und weiteren Anbietern sind in Kürze verfügbar.
                    </p>
                  </div>
                )}
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
                disabled={isSaving || !form.title || !form.price}
                variant="outline"
                className="flex-1 border-white/[0.1] text-slate-300 hover:bg-white/[0.04] cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {isSaving ? "Speichern..." : "Speichern"}
              </Button>
              <Button
                onClick={handleSubmitForReview}
                disabled={isSaving || !form.title || !form.price}
                className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {isSaving ? "Wird eingereicht..." : "Zur Prüfung einreichen"}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Availability Editor */}
    {isEditing && service && (
      <AgencyAvailabilityEditor
        serviceId={service.id}
        open={availabilityOpen}
        onClose={() => setAvailabilityOpen(false)}
      />
    )}
    </>
  );
}
