import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarPlus, Loader2, Users, Euro, AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgencyServices, useAgencyTeamMembers, useCreateManualBooking } from "@/hooks/useManualBooking";
import { useAgencyGuidesList } from "@/hooks/useAgencyEarnings";
import { useAgencyBookings } from "@/hooks/useMarketplaceBookings";

const UNASSIGNED = "__unassigned__";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyId: string;
  presetDate?: string;     // YYYY-MM-DD
  presetTime?: string;     // HH:MM
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatEUR(cents: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function CreateBookingDialog({ open, onOpenChange, agencyId, presetDate, presetTime }: Props) {
  const { t } = useTranslation();
  const { data: services = [], isLoading: loadingServices } = useAgencyServices(agencyId);
  const { data: guides = [] } = useAgencyGuidesList(agencyId);
  const { data: teamMembers = [] } = useAgencyTeamMembers(agencyId);
  const { data: existingBookings = [] } = useAgencyBookings(agencyId);
  const createBooking = useCreateManualBooking();

  const [serviceId, setServiceId] = useState<string>("");
  const [bookingDate, setBookingDate] = useState(presetDate ?? todayISO());
  const [bookingTime, setBookingTime] = useState(presetTime ?? "10:00");
  const [participants, setParticipants] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [assignedGuideId, setAssignedGuideId] = useState<string>(UNASSIGNED);
  const [assignedTeamId, setAssignedTeamId] = useState<string>(UNASSIGNED);
  const [priceOverride, setPriceOverride] = useState<string>(""); // cents as string

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId]
  );

  // Reset + reset preset on open
  useEffect(() => {
    if (open) {
      setBookingDate(presetDate ?? todayISO());
      setBookingTime(presetTime ?? "10:00");
      setServiceId("");
      setParticipants(1);
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setCustomerNotes("");
      setAssignedGuideId(UNASSIGNED);
      setAssignedTeamId(UNASSIGNED);
      setPriceOverride("");
    }
  }, [open, presetDate, presetTime]);

  // Auto-adjust participants when service changes
  useEffect(() => {
    if (!selectedService) return;
    const min = selectedService.min_participants ?? 1;
    if (participants < min) setParticipants(min);
    const max = selectedService.max_participants;
    if (max && participants > max) setParticipants(max);
  }, [selectedService]); // eslint-disable-line react-hooks/exhaustive-deps

  // Price calculation
  const unitPriceCents = useMemo(() => {
    if (priceOverride && !isNaN(Number(priceOverride))) {
      return Math.round(Number(priceOverride) * 100);
    }
    return selectedService?.price_cents ?? 0;
  }, [priceOverride, selectedService]);

  const totalPriceCents = unitPriceCents * participants;

  const minParticipants = selectedService?.min_participants ?? 1;
  const maxParticipants = selectedService?.max_participants ?? 999;
  const participantsValid = participants >= minParticipants && participants <= maxParticipants;
  const emailValid = /.+@.+\..+/.test(customerEmail);
  const canSubmit = Boolean(
    serviceId && bookingDate && bookingTime && customerName && emailValid && participantsValid
  );

  // Live conflict detection for the draft booking
  const draftConflicts = useMemo(() => {
    const conflicts: Array<{ severity: "warning" | "error"; message: string }> = [];
    if (!bookingDate || !bookingTime || !serviceId) return conflicts;

    const draftStart = new Date(`${bookingDate}T${bookingTime}`);
    if (Number.isNaN(draftStart.getTime())) return conflicts;
    const draftDurationMin = 60; // fallback; real duration_minutes not in AgencyServiceOption
    const draftEnd = new Date(draftStart.getTime() + draftDurationMin * 60_000);

    const ACTIVE = new Set(["pending_confirmation", "confirmed", "completed"]);
    const activeGuideId = assignedGuideId !== UNASSIGNED ? assignedGuideId : null;

    existingBookings.forEach((b) => {
      if (!ACTIVE.has(b.status)) return;
      const bStart = new Date(`${b.booking_date}T${b.booking_time}`);
      if (Number.isNaN(bStart.getTime())) return;
      const bEnd = new Date(bStart.getTime() + 60 * 60_000);
      const overlap = draftStart < bEnd && bStart < draftEnd;

      // Guide overlap
      const bGuideId = (b as unknown as { assigned_guide_id?: string | null }).assigned_guide_id;
      if (activeGuideId && bGuideId === activeGuideId && overlap) {
        conflicts.push({
          severity: "error",
          message: `Guide ist zeitgleich bei "${b.service_title}" (${b.booking_time?.slice(0, 5)} · ${b.customer_name}) gebucht`,
        });
      }

      // Same service same slot
      if (b.service_id === serviceId && b.booking_date === bookingDate && b.booking_time?.slice(0, 5) === bookingTime) {
        conflicts.push({
          severity: "error",
          message: `Dieser Service ist um ${bookingTime} bereits gebucht (Kunde: ${b.customer_name})`,
        });
      }
    });

    // Guide daily limit
    if (activeGuideId) {
      const guide = guides.find((g) => g.id === activeGuideId);
      const limit = guide?.max_daily_bookings ?? null;
      if (limit !== null && limit > 0) {
        const count = existingBookings.filter((b) =>
          ACTIVE.has(b.status) &&
          (b as unknown as { assigned_guide_id?: string | null }).assigned_guide_id === activeGuideId &&
          b.booking_date === bookingDate
        ).length;
        if (count >= limit) {
          conflicts.push({
            severity: "warning",
            message: `Guide hat heute schon ${count} Buchung${count > 1 ? "en" : ""} — Tageslimit: ${limit}`,
          });
        }
      }
    }

    // Capacity warning — participants vs max
    if (selectedService?.max_participants && participants > selectedService.max_participants) {
      conflicts.push({
        severity: "error",
        message: `Teilnehmer (${participants}) überschreitet Service-Limit (${selectedService.max_participants})`,
      });
    }

    return conflicts;
  }, [bookingDate, bookingTime, serviceId, assignedGuideId, existingBookings, guides, selectedService, participants]);

  const hasBlockingConflict = draftConflicts.some((c) => c.severity === "error");

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await createBooking.mutateAsync({
        agencyId,
        serviceId,
        bookingDate,
        bookingTime,
        participantCount: participants,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        customerNotes: customerNotes || null,
        assignedGuideId: assignedGuideId === UNASSIGNED ? null : assignedGuideId,
        assignedTeamMemberId: assignedTeamId === UNASSIGNED ? null : assignedTeamId,
        unitPriceCentsOverride: priceOverride ? Math.round(Number(priceOverride) * 100) : null,
      });
      toast.success(t("bookingCalendar.createSuccess", "Termin angelegt"));
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`${t("common.error", "Fehler")}: ${msg}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5" />
            {t("bookingCalendar.createTitle", "Neuer Termin")}
          </DialogTitle>
          <DialogDescription>
            {t("bookingCalendar.createDescription", "Manuelle Buchung — z. B. für Telefon-/Walk-in-Kunden. Kein Stripe-Checkout, sofort bestätigt.")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Service */}
          <div>
            <Label htmlFor="service">{t("bookingCalendar.service", "Service")} *</Label>
            {loadingServices ? (
              <div className="h-10 rounded-md bg-muted animate-pulse" />
            ) : services.length === 0 ? (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                {t("bookingCalendar.noServices", "Noch keine approved Services — erstelle erst einen im Marketplace-Modul.")}
              </div>
            ) : (
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger id="service">
                  <SelectValue placeholder={t("bookingCalendar.selectService", "Service auswählen")} />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <span>{s.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatEUR(s.price_cents)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">{t("bookingCalendar.date", "Datum")} *</Label>
              <Input id="date" type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="time">{t("bookingCalendar.time", "Uhrzeit")} *</Label>
              <Input id="time" type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} />
            </div>
          </div>

          {/* Participants + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="participants" className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {t("bookingCalendar.participants", "Teilnehmer")} *
              </Label>
              <Input
                id="participants"
                type="number"
                min={minParticipants}
                max={maxParticipants}
                value={participants}
                onChange={(e) => setParticipants(parseInt(e.target.value, 10) || 1)}
                className={cn(!participantsValid && "border-red-500")}
              />
              {selectedService && (
                <div className="text-xs text-muted-foreground mt-1">
                  {t("bookingCalendar.range", "Erlaubt")}: {minParticipants}–{selectedService.max_participants ?? "∞"}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="price-override" className="flex items-center gap-1.5">
                <Euro className="w-3.5 h-3.5" />
                {t("bookingCalendar.priceOverride", "Preis pro Person (optional)")}
              </Label>
              <Input
                id="price-override"
                type="number"
                step="0.01"
                placeholder={selectedService ? (selectedService.price_cents / 100).toFixed(2) : "0.00"}
                value={priceOverride}
                onChange={(e) => setPriceOverride(e.target.value)}
              />
            </div>
          </div>

          {/* Total preview */}
          {selectedService && participantsValid && (
            <div className="rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20 p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("bookingCalendar.totalPreview", "Summe")} ({participants} × {formatEUR(unitPriceCents)})
              </span>
              <span className="text-lg font-black">{formatEUR(totalPriceCents)}</span>
            </div>
          )}

          {/* Customer */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              {t("bookingCalendar.customerSection", "Kunde")}
            </div>
            <div>
              <Label htmlFor="cname">{t("bookingCalendar.customerName", "Name")} *</Label>
              <Input id="cname" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cemail">{t("bookingCalendar.customerEmail", "E-Mail")} *</Label>
                <Input
                  id="cemail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className={cn(customerEmail && !emailValid && "border-red-500")}
                />
              </div>
              <div>
                <Label htmlFor="cphone">{t("bookingCalendar.customerPhone", "Telefon")}</Label>
                <Input id="cphone" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="cnotes">{t("bookingCalendar.notes", "Notizen")}</Label>
              <Textarea id="cnotes" rows={2} value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} />
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              {t("bookingCalendar.assignmentSection", "Zuweisung")}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>{t("bookingCalendar.assignGuide", "Guide")}</Label>
                <Select value={assignedGuideId} onValueChange={setAssignedGuideId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("bookingCalendar.noGuide", "— kein Guide —")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>— {t("bookingCalendar.noGuide", "kein Guide")} —</SelectItem>
                    {guides.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("bookingCalendar.assignTeam", "Team-Mitglied")}</Label>
                <Select value={assignedTeamId} onValueChange={setAssignedTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("bookingCalendar.noTeam", "— niemand —")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>— {t("bookingCalendar.noTeam", "niemand")} —</SelectItem>
                    {teamMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.email} <Badge variant="outline" className="ml-2 text-[10px]">{m.role}</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {draftConflicts.length > 0 && (
          <div className={cn(
            "mt-1 rounded-lg border p-3 space-y-1.5",
            hasBlockingConflict
              ? "border-red-500/40 bg-red-500/10"
              : "border-amber-500/40 bg-amber-500/10",
          )}>
            <div className={cn(
              "flex items-center gap-2 text-sm font-semibold",
              hasBlockingConflict ? "text-red-400" : "text-amber-400",
            )}>
              <AlertTriangle className="w-4 h-4" />
              {hasBlockingConflict
                ? t("bookingCalendar.conflictBlocking", "Konflikte erkannt")
                : t("bookingCalendar.conflictWarning", "Achtung — mögliche Überschneidungen")}
            </div>
            <ul className="space-y-1 pl-6 list-disc marker:text-current">
              {draftConflicts.map((c, i) => (
                <li
                  key={i}
                  className={cn("text-xs leading-snug", c.severity === "error" ? "text-red-300" : "text-amber-300")}
                >
                  {c.message}
                </li>
              ))}
            </ul>
            {!hasBlockingConflict && (
              <p className="text-[10px] italic text-amber-400/70 pl-6">
                {t("bookingCalendar.conflictContinueHint", "Du kannst trotzdem anlegen — bitte prüfe vorher.")}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Abbrechen")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || createBooking.isPending || hasBlockingConflict}
            className={hasBlockingConflict ? "opacity-50 cursor-not-allowed" : ""}
            title={hasBlockingConflict ? t("bookingCalendar.conflictBlockedTooltip", "Bitte Konflikte auflösen bevor du anlegst") : undefined}
          >
            {createBooking.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <CalendarPlus className="w-4 h-4 mr-2" />
            {t("bookingCalendar.createSubmit", "Termin anlegen")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
