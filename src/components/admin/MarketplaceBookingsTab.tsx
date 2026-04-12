import { useState } from "react";
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
  MoreHorizontal,
  Eye,
  XCircle,
  RotateCcw,
  Clock,
  CheckCircle2,
  Ban,
  MessageSquareWarning,
  Users,
} from "lucide-react";

type BookingStatus =
  | "pending_confirmation"
  | "confirmed"
  | "completed"
  | "cancelled_by_customer"
  | "disputed";

interface Booking {
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
}

const MOCK_BOOKINGS: Booking[] = [
  { nr: "EB-2026-00142", service: "Cocktail Workshop", agency: "Berlin Events GmbH", customer: "Sarah Mueller", email: "sarah@mail.de", date: "2026-04-18", total: 15600, fee: 1560, status: "confirmed", participants: 4 },
  { nr: "EB-2026-00141", service: "Wine Tasting Premium", agency: "Gourmet Events", customer: "Max Hoffmann", email: "max@mail.de", date: "2026-04-15", total: 24500, fee: 2450, status: "completed", participants: 5 },
  { nr: "EB-2026-00140", service: "Escape Room", agency: "Fun Factory", customer: "Lisa Weber", email: "lisa@mail.de", date: "2026-04-20", total: 10000, fee: 1000, status: "pending_confirmation", participants: 4 },
  { nr: "EB-2026-00139", service: "DJ Party Paket", agency: "Berlin Events GmbH", customer: "Tom Schmidt", email: "tom@mail.de", date: "2026-04-12", total: 59900, fee: 5990, status: "completed", participants: 1 },
  { nr: "EB-2026-00138", service: "Private Chef Dinner", agency: "Gourmet Events", customer: "Anna Klein", email: "anna@mail.de", date: "2026-04-25", total: 44500, fee: 4450, status: "confirmed", participants: 5 },
  { nr: "EB-2026-00137", service: "Go-Kart Racing", agency: "Speed Events", customer: "Felix Braun", email: "felix@mail.de", date: "2026-04-08", total: 19200, fee: 1920, status: "cancelled_by_customer", participants: 6 },
  { nr: "EB-2026-00136", service: "Yoga Retreat", agency: "Zen Space", customer: "Julia Fischer", email: "julia@mail.de", date: "2026-04-22", total: 14500, fee: 1450, status: "disputed", participants: 5 },
  { nr: "EB-2026-00135", service: "Graffiti Workshop", agency: "Urban Arts", customer: "Lukas Meyer", email: "lukas@mail.de", date: "2026-04-05", total: 14000, fee: 1400, status: "completed", participants: 4 },
];

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending_confirmation: {
    label: "Ausstehend",
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    icon: Clock,
  },
  confirmed: {
    label: "Bestaetigt",
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
  { label: "Ausstehend", value: "pending_confirmation" },
  { label: "Bestaetigt", value: "confirmed" },
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
  pending_confirmation: ["Buchung erstellt", "Warte auf Bestaetigung"],
  confirmed: ["Buchung erstellt", "Bestaetigt durch Agentur"],
  completed: ["Buchung erstellt", "Bestaetigt durch Agentur", "Service durchgefuehrt", "Abgeschlossen"],
  cancelled_by_customer: ["Buchung erstellt", "Vom Kunden storniert"],
  disputed: ["Buchung erstellt", "Bestaetigt durch Agentur", "Dispute eroeffnet"],
};

export default function MarketplaceBookingsTab() {
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const filtered =
    filter === "all"
      ? MOCK_BOOKINGS
      : MOCK_BOOKINGS.filter((b) => b.status === filter);

  const totalBookings = 267;
  const totalRevenue = 4835000;
  const platformFees = 483500;
  const openDisputes = 2;

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
      label: "Platform-Gebuehren",
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
                  {MOCK_BOOKINGS.filter((b) =>
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
              Gesamt: {MOCK_BOOKINGS.length} von {totalBookings}
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
                  const statusCfg = STATUS_CONFIG[booking.status];
                  const StatusIcon = statusCfg.icon;
                  return (
                    <TableRow
                      key={booking.nr}
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
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.color} ${statusCfg.bgColor}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </span>
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
                              onClick={(e) => e.stopPropagation()}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Stornieren
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => e.stopPropagation()}
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
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[selectedBooking.status].color} ${STATUS_CONFIG[selectedBooking.status].bgColor}`}
                  >
                    {STATUS_CONFIG[selectedBooking.status].label}
                  </span>
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
                    {TIMELINE_STEPS[selectedBooking.status].map((step, idx, arr) => {
                      const isLast = idx === arr.length - 1;
                      return (
                        <div key={step} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`h-3 w-3 rounded-full mt-0.5 ${
                                isLast
                                  ? STATUS_CONFIG[selectedBooking.status].bgColor.split(" ")[0]
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
                  Schliessen
                </Button>
                {selectedBooking.status !== "cancelled_by_customer" &&
                  selectedBooking.status !== "completed" && (
                    <Button variant="destructive" size="sm">
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
