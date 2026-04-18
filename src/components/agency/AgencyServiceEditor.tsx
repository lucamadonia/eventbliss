import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Image, Send, Save, Loader2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCreateService, useUpdateService, useSubmitForReview } from "@/hooks/useAgencyServices";
import { AgencyAvailabilityEditor } from "./AgencyAvailabilityEditor";
import { paymentMethods, type PaymentMethodValue } from "./service-editor-options";

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
  paymentMethod: PaymentMethodValue;
  capacityPerSlot: string;
  groupsPerSlot: string;
  groupsPerGuide: string;
  // Scheduling
  durationMinutes: string;
  bufferBeforeMinutes: string;
  bufferAfterMinutes: string;
  schedulingMode: "always_available" | "weekly_recurring" | "specific_dates" | "mixed";
  recurrenceInterval: string;
  recurrenceAnchorDate: string; // ISO date or ""
  specificDates: string;        // newline-separated list of "YYYY-MM-DD HH:mm-HH:mm" lines
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
    paymentMethod?: string;
    capacityPerSlot?: number;
    groupsPerSlot?: number;
    groupsPerGuide?: number;
    durationMinutes?: number | null;
    bufferBeforeMinutes?: number;
    bufferAfterMinutes?: number;
    schedulingMode?: string;
    recurrenceInterval?: number;
    recurrenceAnchorDate?: string | null;
  } | null;
}

const schedulingModes = [
  {
    value: "always_available" as const,
    label: "Jederzeit verfügbar",
    description: "Kunde wählt Datum/Zeit frei (nach Vorlaufzeit).",
    icon: "🌐",
  },
  {
    value: "weekly_recurring" as const,
    label: "Wiederkehrend wöchentlich",
    description: "Feste Wochentage & Uhrzeiten (alle X Wochen).",
    icon: "📅",
  },
  {
    value: "specific_dates" as const,
    label: "Nur Einzeltermine",
    description: "Nur an konkreten Tagen buchbar.",
    icon: "📌",
  },
  {
    value: "mixed" as const,
    label: "Mixed (wöchentlich + Einzeltermine)",
    description: "Wöchentliche Slots + zusätzliche Sondertermine.",
    icon: "🔀",
  },
];

const recurrenceIntervalOptions = [
  { value: "1", label: "Jede Woche" },
  { value: "2", label: "Alle zwei Wochen" },
  { value: "3", label: "Alle drei Wochen" },
  { value: "4", label: "Alle vier Wochen (~monatlich)" },
];

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
  paymentMethod: "online",
  capacityPerSlot: "10",
  groupsPerSlot: "1",
  groupsPerGuide: "1",
  durationMinutes: "120",
  bufferBeforeMinutes: "0",
  bufferAfterMinutes: "15",
  schedulingMode: "weekly_recurring",
  recurrenceInterval: "1",
  recurrenceAnchorDate: "",
  specificDates: "",
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
        bookingMode: (service.bookingMode as ServiceFormData["bookingMode"]) || "internal",
        externalBookingUrl: service.externalBookingUrl || "",
        paymentMethod:
          service.paymentMethod === "on_site" ? "on_site" : "online",
        capacityPerSlot: service.capacityPerSlot ? String(service.capacityPerSlot) : "10",
        groupsPerSlot: service.groupsPerSlot ? String(service.groupsPerSlot) : "1",
        groupsPerGuide: service.groupsPerGuide ? String(service.groupsPerGuide) : "1",
        durationMinutes: service.durationMinutes ? String(service.durationMinutes) : "120",
        bufferBeforeMinutes: typeof service.bufferBeforeMinutes === "number" ? String(service.bufferBeforeMinutes) : "0",
        bufferAfterMinutes: typeof service.bufferAfterMinutes === "number" ? String(service.bufferAfterMinutes) : "15",
        schedulingMode: (service.schedulingMode as ServiceFormData["schedulingMode"]) || "weekly_recurring",
        recurrenceInterval: service.recurrenceInterval ? String(service.recurrenceInterval) : "1",
        recurrenceAnchorDate: service.recurrenceAnchorDate || "",
        specificDates: "",
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
    // Comma-safe parse: "12,50" is a common German input but parseFloat strips
    // at the comma and would silently truncate to 12. Normalize first.
    price_cents: Math.max(
      0,
      Math.round(parseFloat(String(form.price || "0").replace(",", ".")) * 100) || 0,
    ),
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
    payment_method: form.paymentMethod,
    capacity_per_slot: Math.max(1, parseInt(form.capacityPerSlot || "10") || 10),
    groups_per_slot: Math.max(1, parseInt(form.groupsPerSlot || "1") || 1),
    groups_per_guide: Math.max(1, parseInt(form.groupsPerGuide || "1") || 1),
    duration_minutes: form.durationMinutes ? Math.max(1, parseInt(form.durationMinutes)) : undefined,
    buffer_before_minutes: Math.max(0, Math.min(1440, parseInt(form.bufferBeforeMinutes || "0") || 0)),
    buffer_after_minutes: Math.max(0, Math.min(1440, parseInt(form.bufferAfterMinutes || "0") || 0)),
    scheduling_mode: form.schedulingMode,
    recurrence_interval: Math.max(1, Math.min(12, parseInt(form.recurrenceInterval || "1") || 1)),
    recurrence_anchor_date: form.recurrenceAnchorDate || undefined,
    specific_dates: form.schedulingMode === "specific_dates" || form.schedulingMode === "mixed"
      ? parseSpecificDates(form.specificDates)
      : [],
  });

  // Parse user textarea into array of { date, start_time, end_time, notes? }
  // Accepted formats per line:
  //   2026-05-12 14:00-17:00
  //   2026-05-12 14:00-17:00 Sommer-Special
  //   2026-05-12T14:00
  //   2026-05-12  (uses service duration)
  interface ParsedDate {
    date: string;
    start_time: string;
    end_time: string;
    notes?: string;
  }
  function parseSpecificDates(raw: string): ParsedDate[] {
    if (!raw?.trim()) return [];
    const duration = form.durationMinutes ? parseInt(form.durationMinutes) : 120;
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const out: ParsedDate[] = [];
    for (const line of lines) {
      // 2026-05-12 14:00-17:00 [notes...]
      const withRange = line.match(/^(\d{4}-\d{2}-\d{2})[T\s]+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})(?:\s+(.+))?$/);
      if (withRange) {
        out.push({
          date: withRange[1],
          start_time: withRange[2].length === 4 ? `0${withRange[2]}` : withRange[2],
          end_time: withRange[3].length === 4 ? `0${withRange[3]}` : withRange[3],
          notes: withRange[4],
        });
        continue;
      }
      // 2026-05-12 14:00 [notes...] (auto-compute end from duration)
      const withStart = line.match(/^(\d{4}-\d{2}-\d{2})[T\s]+(\d{1,2}:\d{2})(?:\s+(.+))?$/);
      if (withStart) {
        const [h, m] = withStart[2].split(":").map(Number);
        const endMinutes = h * 60 + m + duration;
        const eh = Math.floor(endMinutes / 60) % 24;
        const em = endMinutes % 60;
        out.push({
          date: withStart[1],
          start_time: withStart[2].length === 4 ? `0${withStart[2]}` : withStart[2],
          end_time: `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`,
          notes: withStart[3],
        });
        continue;
      }
      // Nur Datum
      const onlyDate = line.match(/^(\d{4}-\d{2}-\d{2})$/);
      if (onlyDate) {
        out.push({ date: onlyDate[1], start_time: "10:00", end_time: "12:00" });
      }
    }
    return out;
  }

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
                    <p className="text-xs text-slate-500">Weitere Bilder hinzufügen</p>
                  </div>
                </FormField>
              </FormSection>

              {/* Details */}
              <FormSection title="Details">
                <FormField label="Beschreibung">
                  <textarea
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Ausführliche Beschreibung deines Service..."
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

              {/* Zahlung */}
              <FormSection title="Zahlung">
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => update("paymentMethod", method.value)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer",
                        form.paymentMethod === method.value
                          ? "border-violet-500/40 bg-violet-500/10"
                          : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] text-sm shrink-0 mt-0.5">
                          {method.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-xs font-medium",
                            form.paymentMethod === method.value ? "text-violet-300" : "text-slate-300"
                          )}>
                            {method.label}
                          </p>
                          <p className="text-[10px] text-slate-600 mt-0.5">{method.description}</p>
                        </div>
                        <div className={cn(
                          "w-4 h-4 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center transition-colors",
                          form.paymentMethod === method.value
                            ? "border-violet-500 bg-violet-500"
                            : "border-white/[0.15]"
                        )}>
                          {form.paymentMethod === method.value && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {form.paymentMethod === "on_site" && (
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                    <p className="text-[10px] text-amber-300/80 leading-relaxed">
                      Vor-Ort-Zahlung bedeutet kein Stripe-Schutz bei Kündigung. Du bist vertraglich verpflichtet, die Plattformgebühr binnen 14 Tagen nach Leistung abzuführen.
                    </p>
                  </div>
                )}
              </FormSection>

              {/* Kapazität pro Slot */}
              <FormSection title="Kapazität pro Slot">
                <p className="text-[11px] text-slate-500 -mt-1 mb-2 leading-relaxed">
                  Wie viele Personen und parallele Gruppen passen in einen Zeitslot? Ist ein Slot voll, wird die Uhrzeit im Kunden-Buchungsdialog automatisch ausgegraut.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Personen pro Gruppe">
                    <Input
                      type="number"
                      min={1}
                      value={form.capacityPerSlot}
                      onChange={(e) => update("capacityPerSlot", e.target.value)}
                      placeholder="10"
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="Parallele Gruppen pro Slot">
                    <Input
                      type="number"
                      min={1}
                      value={form.groupsPerSlot}
                      onChange={(e) => update("groupsPerSlot", e.target.value)}
                      placeholder="1"
                      className={inputClass}
                    />
                  </FormField>
                </div>
                <FormField label="Gruppen pro Guide">
                  <Input
                    type="number"
                    min={1}
                    value={form.groupsPerGuide}
                    onChange={(e) => update("groupsPerGuide", e.target.value)}
                    placeholder="1"
                    className={inputClass}
                  />
                  <p className="text-[10px] text-slate-600 mt-1">
                    Wie viele Gruppen kann ein Guide gleichzeitig betreuen? Beeinflusst die Guide-Zuweisung im Dashboard.
                  </p>
                </FormField>
                <div className="px-3 py-2 rounded-xl bg-violet-500/5 border border-violet-500/15">
                  <p className="text-[11px] text-violet-300/80 leading-relaxed">
                    Effektive Slot-Kapazität:&nbsp;
                    <strong className="text-violet-200">
                      {Math.max(1, parseInt(form.capacityPerSlot || "10") || 10) *
                        Math.max(1, parseInt(form.groupsPerSlot || "1") || 1)}
                    </strong>
                    &nbsp;Personen je Uhrzeit.
                  </p>
                </div>
              </FormSection>

              {/* Dauer & Puffer */}
              <FormSection title="Dauer & Puffer">
                <p className="text-[11px] text-slate-500 -mt-1 mb-2 leading-relaxed">
                  Wie lange dauert die Leistung, und wieviel Pause brauchst du vor/nach der Buchung?
                </p>
                <FormField label="Dauer der Leistung (Minuten)">
                  <Input
                    type="number"
                    min={1}
                    value={form.durationMinutes}
                    onChange={(e) => update("durationMinutes", e.target.value)}
                    placeholder="120"
                    className={inputClass}
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Puffer davor (Min.)">
                    <Input
                      type="number"
                      min={0}
                      value={form.bufferBeforeMinutes}
                      onChange={(e) => update("bufferBeforeMinutes", e.target.value)}
                      placeholder="0"
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="Puffer danach (Min.)">
                    <Input
                      type="number"
                      min={0}
                      value={form.bufferAfterMinutes}
                      onChange={(e) => update("bufferAfterMinutes", e.target.value)}
                      placeholder="15"
                      className={inputClass}
                    />
                  </FormField>
                </div>
                <div className="px-3 py-2 rounded-xl bg-violet-500/5 border border-violet-500/15">
                  <p className="text-[11px] text-violet-300/80 leading-relaxed">
                    Abstand zwischen zwei Buchungen:&nbsp;
                    <strong className="text-violet-200">
                      {(parseInt(form.bufferBeforeMinutes || "0") || 0) +
                        (parseInt(form.durationMinutes || "0") || 0) +
                        (parseInt(form.bufferAfterMinutes || "0") || 0)}
                      &nbsp;Min.
                    </strong>
                  </p>
                </div>
              </FormSection>

              {/* Terminmodus / Wiederholung */}
              <FormSection title="Terminmodus">
                <p className="text-[11px] text-slate-500 -mt-1 mb-2 leading-relaxed">
                  Wie soll der Service angeboten werden? Wöchentlich wiederkehrend, nur an Einzelterminen oder kombiniert?
                </p>
                <div className="space-y-2">
                  {schedulingModes.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => update("schedulingMode", mode.value)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer",
                        form.schedulingMode === mode.value
                          ? "border-violet-500/40 bg-violet-500/10"
                          : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] text-sm shrink-0 mt-0.5">
                          {mode.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-xs font-medium",
                            form.schedulingMode === mode.value ? "text-violet-300" : "text-slate-300"
                          )}>
                            {mode.label}
                          </p>
                          <p className="text-[10px] text-slate-600 mt-0.5">{mode.description}</p>
                        </div>
                        <div className={cn(
                          "w-4 h-4 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center transition-colors",
                          form.schedulingMode === mode.value
                            ? "border-violet-500 bg-violet-500"
                            : "border-white/[0.15]"
                        )}>
                          {form.schedulingMode === mode.value && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {(form.schedulingMode === "weekly_recurring" || form.schedulingMode === "mixed") && (
                  <div className="space-y-3 pt-2">
                    <FormSelect
                      label="Wiederholungsintervall"
                      value={form.recurrenceInterval}
                      onChange={(v) => update("recurrenceInterval", v)}
                      options={recurrenceIntervalOptions}
                    />
                    {parseInt(form.recurrenceInterval) > 1 && (
                      <FormField label="Anker-Datum (erster Termin)">
                        <Input
                          type="date"
                          value={form.recurrenceAnchorDate}
                          onChange={(e) => update("recurrenceAnchorDate", e.target.value)}
                          className={inputClass}
                        />
                        <p className="text-[10px] text-slate-600 mt-1">
                          Nötig für „alle X Wochen" — legt den Start der Zählung fest.
                        </p>
                      </FormField>
                    )}
                    {isEditing && service ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAvailabilityOpen(true)}
                        className="w-full border-white/[0.1] text-slate-300 hover:bg-white/[0.04] cursor-pointer"
                      >
                        <CalendarClock className="w-4 h-4 mr-2" />
                        Wochentage & Uhrzeiten bearbeiten
                      </Button>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">
                        Wochentage & Uhrzeiten kannst du nach dem Speichern konfigurieren.
                      </p>
                    )}
                  </div>
                )}

                {(form.schedulingMode === "specific_dates" || form.schedulingMode === "mixed") && (
                  <FormField label="Einzeltermine">
                    <textarea
                      value={form.specificDates}
                      onChange={(e) => update("specificDates", e.target.value)}
                      placeholder={"z. B.\n2026-05-12 14:00-17:00 Sommer-Special\n2026-06-09 10:00 (Dauer automatisch)\n2026-07-03"}
                      rows={5}
                      className={textareaClass + " font-mono text-[12px]"}
                    />
                    <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                      Ein Termin pro Zeile: <code>YYYY-MM-DD HH:MM-HH:MM Notizen</code> oder <code>YYYY-MM-DD HH:MM</code> (Ende wird aus Dauer berechnet) oder nur <code>YYYY-MM-DD</code> (10:00-12:00 Default).
                    </p>
                  </FormField>
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
                    <p className="text-xs font-medium text-slate-300">Auto-Bestätigung</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      Buchungen automatisch bestätigen
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
