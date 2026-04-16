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
import { CalendarPlus, Loader2, Users, Euro, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgencyServices, useAgencyTeamMembers, useCreateManualBooking } from "@/hooks/useManualBooking";
import { useAgencyGuidesList } from "@/hooks/useAgencyEarnings";

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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Abbrechen")}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || createBooking.isPending}>
            {createBooking.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <CalendarPlus className="w-4 h-4 mr-2" />
            {t("bookingCalendar.createSubmit", "Termin anlegen")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
