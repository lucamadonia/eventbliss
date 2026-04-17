import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ShoppingBag,
  Euro,
  Wallet,
  AlertTriangle,
  AlertCircle,
  MoreHorizontal,
  Eye,
  XCircle,
  RotateCcw,
  Clock,
  CheckCircle2,
  Ban,
  MessageSquareWarning,
  Users,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

type BookingStatus =
  | "pending_payment"
  | "pending_confirmation"
  | "confirmed"
  | "completed"
  | "cancelled_by_customer"
  | "disputed";

type PaymentMethod = "online" | "on_site" | null;

interface Booking {
  id: string;
  nr: string;
  service: string;
  agency: string;
  customer: string;
  email: string;
  date: string;
  total: number;
  fee: number;
  status: BookingStatus;
  participants: number;
  paymentMethod: PaymentMethod;
  stripePaymentIntentId: string | null;
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending_payment: {
    label: "Zahlung ausstehend",
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-100 dark:bg-amber-500/20 border border-amber-500/30",
    icon: AlertCircle,
  },
  pending_confirmation: {
    label: "Ausstehend",
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    icon: Clock,
  },
  confirmed: {
    label: "Bestätigt",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    icon: CheckCircle2,
  },
  completed: {
    label: "Abgeschlossen",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    icon: CheckCircle2,
  },
  cancelled_by_customer: {
    label: "Storniert",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    icon: Ban,
  },
  disputed: {
    label: "Disputed",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    icon: MessageSquareWarning,
  },
};

const FILTER_TABS: { label: string; value: BookingStatus | "all" }[] = [
  { label: "Alle", value: "all" },
  { label: "Unbezahlt", value: "pending_payment" },
  { label: "Ausstehend", value: "pending_confirmation" },
  { label: "Bestätigt", value: "confirmed" },
  { label: "Abgeschlossen", value: "completed" },
  { label: "Storniert", value: "cancelled_by_customer" },
  { label: "Disputed", value: "disputed" },
];

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const TIMELINE_STEPS: Record<BookingStatus, string[]> = {
  pending_payment: ["Buchung erstellt", "Warte auf Zahlung"],
  pending_confirmation: ["Buchung erstellt", "Warte auf Bestätigung"],
  confirmed: ["Buchung erstellt", "Bestätigt durch Agentur"],
  completed: ["Buchung erstellt", "Bestätigt durch Agentur", "Service durchgeführt", "Abgeschlossen"],
  cancelled_by_customer: ["Buchung erstellt", "Vom Kunden storniert"],
  disputed: ["Buchung erstellt", "Bestätigt durch Agentur", "Dispute eröffnet"],
};

async function fetchBookings(): Promise<Booking[]> {
  const { data: bookings, error } = await (supabase.from as any)("marketplace_bookings")
    .select("*, marketplace_services(slug), agencies(name)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const serviceIds = [...new Set((bookings || []).map((b: any) => b.service_id).filter(Boolean))];

  let titleMap: Record<string, string> = {};
  if (serviceIds.length > 0) {
    const { data: translations } = await (supabase.from as any)("marketplace_service_translations")
      .select("service_id, locale, title")
      .in("service_id", serviceIds)
      .in("locale", ["de", "en"]);

    if (translations) {
      for (const t of translations) {
        if (!titleMap[t.service_id] || t.locale === "de") {
          titleMap[t.service_id] = t.title;
        }
      }
    }
  }

  return (bookings || []).map((b: any) => ({
    id: b.id,
    nr: b.booking_number || b.id.slice(0, 14).toUpperCase(),
    service: titleMap[b.service_id] || b.marketplace_services?.slug || "Unbekannt",
    agency: b.agencies?.name || "Unbekannt",
    customer: b.customer_name || "Unbekannt",
    email: b.customer_email || "",
    date: b.event_date || b.created_at?.split("T")[0] || "",
    total: b.total_price_cents || 0,
    fee: b.platform_fee_cents || 0,
    status: (b.status as BookingStatus) || "pending_confirmation",
    participants: b.participants || 1,
    paymentMethod: (b.payment_method as PaymentMethod) ?? null,
    stripePaymentIntentId: b.stripe_payment_intent_id ?? null,
  }));
}

export default function MarketplaceBookingsTab() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["admin-marketplace-bookings"],
    queryFn: fetchBookings,
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await (supabase.from as any)("marketplace_bookings")
        .update({ status: "cancelled_by_customer" })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-marketplace-bookings"] });
      toast.success("Buchung storniert");
      setSelectedBooking(null);
    },
    onError: () => toast.error("Fehler beim Stornieren"),
  });

  const refundMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await (supabase.from as any)("marketplace_bookings")
        .update({ status: "cancelled_by_customer", refunded: true })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-marketplace-bookings"] });
      toast.success("Erstattung eingeleitet");
      setSelectedBooking(null);
    },
    onError: () => toast.error("Fehler bei der Erstattung"),
  });

  const filtered =
    filter === "all"
      ? bookings
      : bookings.filter((b) => b.status === filter);

  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((sum, b) => sum + b.total, 0);
  const platformFees = bookings.reduce((sum, b) => sum + b.fee, 0);
  const openDisputes = bookings.filter((b) => b.status === "disputed").length;

  const statsCards = [
    {
      label: "Total Buchungen",
      value: totalBookings.toString(),
      icon: ShoppingBag,
      iconColor: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Gesamtumsatz",
      value: formatCurrency(totalRevenue),
      icon: Euro,
      iconColor: "text-gray-600",
      bg: "bg-gray-50 dark:bg-gray-900/20",
    },
    {
      label: "Platform-Gebühren",
      value: formatCurrency(platformFees),
      icon: Wallet,
      iconColor: "text-green-600",
      bg: "bg-green-50 dark:bg-green-900/20",
      valueColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "Offene Disputes",
      value: openDisputes.toString(),
      icon: AlertTriangle,
      iconColor: "text-red-600",
      bg: "bg-red-50 dark:bg-red-900/20",
      valueColor: "text-red-600 dark:text-red-400",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <Card key={card.label} className={card.bg}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`rounded-lg p-2.5 bg-white/60 dark:bg-white/10`}>
                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold tracking-tight ${card.valueColor || ""}`}>
                  {card.value}
                </p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => {
          const isActive = filter === tab.value;
          return (
            <Button
              key={tab.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(tab.value)}
              className={isActive ? "" : "hover:bg-muted"}
            >
              {tab.label}
              {tab.value !== "all" && (
                <span className="ml-1.5 text-xs opacity-60">
                  {bookings.filter((b) =>
                    tab.value === "all" ? true : b.status === tab.value
                  ).length}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Buchungen ({filtered.length})</span>
            <span className="text-sm font-normal text-muted-foreground">
              Gesamt: {totalBookings}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Buchung #</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Agentur</TableHead>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((booking) => {
                  const statusCfg =
                    STATUS_CONFIG[booking.status] ??
                    STATUS_CONFIG["pending_confirmation"];
                  const StatusIcon = statusCfg.icon;
                  return (
                    <TableRow
                      key={booking.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        {booking.nr}
                      </TableCell>
                      <TableCell className="font-medium">{booking.service}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {booking.agency}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{booking.customer}</p>
                          <p className="text-xs text-muted-foreground">{booking.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(booking.date)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <span className="font-medium">{formatCurrency(booking.total)}</span>
                        <span className="text-green-600 dark:text-green-400 text-xs ml-1">
                          / {formatCurrency(booking.fee)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.color} ${statusCfg.bgColor}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusCfg.label}
                          </span>
                          {booking.paymentMethod && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                booking.paymentMethod === "on_site"
                                  ? "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                              }`}
                              title={
                                booking.paymentMethod === "on_site"
                                  ? "Zahlung vor Ort"
                                  : "Online-Zahlung"
                              }
                            >
                              {booking.paymentMethod === "on_site" ? "Vor Ort" : "Online"}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBooking(booking);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Anzeigen
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelMutation.mutate(booking.id);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Stornieren
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                refundMutation.mutate(booking.id);
                              }}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Erstatten
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Keine Buchungen mit diesem Status gefunden.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-lg">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Buchung {selectedBooking.nr}
                  {(() => {
                    const cfg = STATUS_CONFIG[selectedBooking.status] ?? STATUS_CONFIG.pending_confirmation;
                    return (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color} ${cfg.bgColor}`}
                      >
                        {cfg.label}
                      </span>
                    );
                  })()}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 mt-2">
                {/* Customer Info */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Kunde</h4>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                    <p className="font-medium">{selectedBooking.customer}</p>
                    <p className="text-sm text-muted-foreground">{selectedBooking.email}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {selectedBooking.participants} Teilnehmer
                    </div>
                  </div>
                </div>

                {/* Service Info */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Service</h4>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                    <p className="font-medium">{selectedBooking.service}</p>
                    <p className="text-sm text-muted-foreground">
                      Agentur: {selectedBooking.agency}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Datum: {formatDate(selectedBooking.date)}
                    </p>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                    Zahlungsdetails
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Zahlungsart</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          selectedBooking.paymentMethod === "on_site"
                            ? "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {selectedBooking.paymentMethod === "on_site" ? "Vor Ort" : "Online"}
                        {selectedBooking.stripePaymentIntentId && (
                          <span className="opacity-70">· bezahlt</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Gesamtbetrag</span>
                      <span className="font-bold">{formatCurrency(selectedBooking.total)}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between items-center">
                      <span className="text-sm">Agency-Anteil (90%)</span>
                      <span className="font-medium">
                        {formatCurrency(selectedBooking.total - selectedBooking.fee)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Platform-Fee (10%)</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(selectedBooking.fee)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Timeline */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                    Status-Verlauf
                  </h4>
                  <div className="space-y-0">
                    {(TIMELINE_STEPS[selectedBooking.status] ?? TIMELINE_STEPS.pending_confirmation).map((step, idx, arr) => {
                      const isLast = idx === arr.length - 1;
                      const cfg = STATUS_CONFIG[selectedBooking.status] ?? STATUS_CONFIG.pending_confirmation;
                      return (
                        <div key={step} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`h-3 w-3 rounded-full mt-0.5 ${
                                isLast
                                  ? cfg.bgColor.split(" ")[0]
                                  : "bg-green-500"
                              }`}
                            />
                            {!isLast && (
                              <div className="w-0.5 h-6 bg-border" />
                            )}
                          </div>
                          <p
                            className={`text-sm ${
                              isLast ? "font-medium" : "text-muted-foreground"
                            }`}
                          >
                            {step}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Dialog Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                  Schließen
                </Button>
                {selectedBooking.status !== "cancelled_by_customer" &&
                  selectedBooking.status !== "completed" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => cancelMutation.mutate(selectedBooking.id)}
                      disabled={cancelMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Stornieren
                    </Button>
                  )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
