import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingCart,
  Euro,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "disputed";

interface Booking {
  id: string;
  bookingNumber: string;
  service: string;
  agency: string;
  customer: string;
  date: string;
  amount: number;
  platformFee: number;
  status: BookingStatus;
}

const MOCK_BOOKINGS: Booking[] = [
  { id: "1", bookingNumber: "EB-2026-00142", service: "Cocktail Workshop Berlin", agency: "Berlin Events GmbH", customer: "Max Mustermann", date: "2026-04-15", amount: 3900, platformFee: 390, status: "confirmed" },
  { id: "2", bookingNumber: "EB-2026-00141", service: "Wine Tasting Premium", agency: "Gourmet Events", customer: "Anna Schmidt", date: "2026-04-12", amount: 4900, platformFee: 490, status: "completed" },
  { id: "3", bookingNumber: "EB-2026-00140", service: "DJ Party Paket", agency: "Berlin Events GmbH", customer: "Tech Startup GmbH", date: "2026-04-20", amount: 59900, platformFee: 5990, status: "pending" },
  { id: "4", bookingNumber: "EB-2026-00139", service: "Escape Room Adventure", agency: "Fun Factory", customer: "Lisa Weber", date: "2026-04-08", amount: 2500, platformFee: 250, status: "completed" },
  { id: "5", bookingNumber: "EB-2026-00138", service: "Private Chef Dinner", agency: "Gourmet Events", customer: "Michael Braun", date: "2026-04-18", amount: 8900, platformFee: 890, status: "confirmed" },
  { id: "6", bookingNumber: "EB-2026-00137", service: "Yoga Retreat", agency: "Zen Space", customer: "Sarah Mueller", date: "2026-04-06", amount: 2900, platformFee: 290, status: "cancelled" },
  { id: "7", bookingNumber: "EB-2026-00136", service: "Go-Kart Racing", agency: "Speed Events", customer: "Thomas Klein", date: "2026-03-30", amount: 3200, platformFee: 320, status: "disputed" },
  { id: "8", bookingNumber: "EB-2026-00135", service: "Graffiti Workshop", agency: "Urban Arts", customer: "Julia Fischer", date: "2026-03-25", amount: 3500, platformFee: 350, status: "completed" },
];

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: "Ausstehend", color: "text-yellow-700 dark:text-yellow-400", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  confirmed: { label: "Bestaetigt", color: "text-blue-700 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  completed: { label: "Abgeschlossen", color: "text-green-700 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/30" },
  cancelled: { label: "Storniert", color: "text-red-700 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/30" },
  disputed: { label: "Disputed", color: "text-orange-700 dark:text-orange-400", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
};

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);

export default function MarketplaceBookingsTab() {
  const [filter, setFilter] = useState<BookingStatus | "all">("all");

  const filtered = filter === "all" ? MOCK_BOOKINGS : MOCK_BOOKINGS.filter((b) => b.status === filter);

  const totalBookings = 267;
  const totalRevenue = 4835000;
  const platformFees = 483500;
  const openDisputes = 2;

  const statsCards = [
    { label: "Total Buchungen", value: totalBookings.toString(), icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Gesamtumsatz", value: formatCurrency(totalRevenue), icon: Euro, color: "text-gray-600", bg: "bg-gray-50 dark:bg-gray-900/20" },
    { label: "Platform-Gebuehren", value: formatCurrency(platformFees), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20", valueColor: "text-green-600" },
    { label: "Offene Disputes", value: openDisputes.toString(), icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20" },
  ];

  const filterButtons: { label: string; value: BookingStatus | "all" }[] = [
    { label: "Alle", value: "all" },
    { label: "Ausstehend", value: "pending" },
    { label: "Bestaetigt", value: "confirmed" },
    { label: "Abgeschlossen", value: "completed" },
    { label: "Storniert", value: "cancelled" },
    { label: "Disputed", value: "disputed" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <Card key={card.label} className={card.bg}>
            <CardContent className="p-4 flex items-center gap-3">
              <card.icon className={`h-8 w-8 ${card.color}`} />
              <div>
                <p className={`text-2xl font-bold ${card.valueColor || ""}`}>{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((btn) => (
          <Button
            key={btn.value}
            variant={filter === btn.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(btn.value)}
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Buchungen ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buchung #</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Agentur</TableHead>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Betrag</TableHead>
                  <TableHead>Platform Fee</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((booking) => {
                  const statusCfg = STATUS_CONFIG[booking.status];
                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-sm font-medium">{booking.bookingNumber}</TableCell>
                      <TableCell className="font-medium">{booking.service}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{booking.agency}</TableCell>
                      <TableCell className="text-sm">{booking.customer}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{booking.date}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(booking.amount)}</TableCell>
                      <TableCell className="font-medium text-green-600">{formatCurrency(booking.platformFee)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color} ${statusCfg.bgColor}`}>
                          {statusCfg.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
