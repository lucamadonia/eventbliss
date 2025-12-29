import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAllCommissions, useUpdateCommissionStatus } from "@/hooks/useAffiliate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Coins, Check, X, Clock, CreditCard, MoreVertical, Download, Filter } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  approved: "bg-blue-500",
  paid: "bg-green-500",
  cancelled: "bg-red-500",
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  approved: Check,
  paid: CreditCard,
  cancelled: X,
};

export function CommissionsTab() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const { data: commissions, isLoading } = useAllCommissions();
  const updateStatus = useUpdateCommissionStatus();

  const filteredCommissions = commissions?.filter((c) => {
    const matchesSearch =
      c.affiliate?.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.affiliate?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.voucher?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || c.status === statusFilter;

    const matchesDate =
      (!dateRange.start || new Date(c.created_at) >= new Date(dateRange.start)) &&
      (!dateRange.end || new Date(c.created_at) <= new Date(dateRange.end));

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Stats
  const stats = {
    total: commissions?.length || 0,
    pending: commissions?.filter((c) => c.status === "pending").length || 0,
    approved: commissions?.filter((c) => c.status === "approved").length || 0,
    paid: commissions?.filter((c) => c.status === "paid").length || 0,
    totalPending: commissions
      ?.filter((c) => c.status === "pending")
      .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0,
    totalApproved: commissions
      ?.filter((c) => c.status === "approved")
      .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0,
    totalPaid: commissions
      ?.filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const handleStatusChange = (id: string, newStatus: "pending" | "approved" | "paid" | "cancelled") => {
    updateStatus.mutate({ id, status: newStatus });
  };

  const handleBulkApprove = () => {
    const pendingCommissions = filteredCommissions?.filter((c) => c.status === "pending") || [];
    pendingCommissions.forEach((c) => {
      updateStatus.mutate({ id: c.id, status: "approved" });
    });
  };

  const exportCSV = () => {
    if (!filteredCommissions) return;

    const headers = [
      "Datum",
      "Partner",
      "E-Mail",
      "Gutschein",
      "Kunde",
      "Bestellwert",
      "Provision",
      "Status",
    ];
    const rows = filteredCommissions.map((c) => [
      format(new Date(c.created_at), "dd.MM.yyyy HH:mm", { locale: de }),
      c.affiliate?.contact_name || "",
      c.affiliate?.email || "",
      c.voucher?.code || "",
      c.customer_email || "",
      c.order_amount,
      c.commission_amount,
      c.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `provisionen_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("affiliate.commission.pending", "Ausstehend")}</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(stats.totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Check className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("affiliate.commission.approved", "Genehmigt")}</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(stats.totalApproved)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CreditCard className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("affiliate.commission.paid", "Ausbezahlt")}</p>
                <p className="text-2xl font-bold">{stats.paid}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(stats.totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("affiliate.commission.total", "Gesamt")}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(stats.totalPending + stats.totalApproved + stats.totalPaid)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder={t("affiliate.admin.searchPlaceholder", "Suchen...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t("common.status", "Status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all", "Alle")}</SelectItem>
              <SelectItem value="pending">{t("affiliate.commission.pending", "Ausstehend")}</SelectItem>
              <SelectItem value="approved">{t("affiliate.commission.approved", "Genehmigt")}</SelectItem>
              <SelectItem value="paid">{t("affiliate.commission.paid", "Ausbezahlt")}</SelectItem>
              <SelectItem value="cancelled">{t("affiliate.commission.cancelled", "Storniert")}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="w-40"
          />
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="w-40"
          />
        </div>
        <div className="flex gap-2">
          {stats.pending > 0 && (
            <Button variant="outline" onClick={handleBulkApprove}>
              <Check className="h-4 w-4 mr-2" />
              {t("affiliate.admin.approveAll", "Alle genehmigen")} ({stats.pending})
            </Button>
          )}
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            {t("affiliate.admin.export", "Exportieren")}
          </Button>
        </div>
      </div>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            {t("affiliate.admin.commissionsList", "Provisionen")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("affiliate.admin.date", "Datum")}</TableHead>
                  <TableHead>{t("affiliate.admin.partner", "Partner")}</TableHead>
                  <TableHead>{t("affiliate.admin.voucher", "Gutschein")}</TableHead>
                  <TableHead>{t("affiliate.admin.customer", "Kunde")}</TableHead>
                  <TableHead className="text-right">{t("affiliate.admin.orderAmount", "Bestellwert")}</TableHead>
                  <TableHead className="text-right">{t("affiliate.admin.commission", "Provision")}</TableHead>
                  <TableHead>{t("common.status", "Status")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommissions?.map((commission) => {
                  const StatusIcon = statusIcons[commission.status] || Clock;
                  return (
                    <TableRow key={commission.id}>
                      <TableCell>
                        {format(new Date(commission.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{commission.affiliate?.contact_name}</p>
                          <p className="text-sm text-muted-foreground">{commission.affiliate?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{commission.voucher?.code || "-"}</Badge>
                      </TableCell>
                      <TableCell>{commission.customer_email || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(commission.order_amount))}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(commission.commission_amount))}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({commission.commission_type === "percentage" ? `${commission.commission_rate}%` : "fix"})
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[commission.status]} text-white`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {t(`affiliate.commission.${commission.status}`, commission.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {commission.status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(commission.id, "approved")}>
                                  <Check className="h-4 w-4 mr-2" />
                                  {t("affiliate.admin.approve", "Genehmigen")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(commission.id, "cancelled")}>
                                  <X className="h-4 w-4 mr-2" />
                                  {t("affiliate.admin.cancel", "Stornieren")}
                                </DropdownMenuItem>
                              </>
                            )}
                            {commission.status === "approved" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(commission.id, "paid")}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                {t("affiliate.admin.markPaid", "Als bezahlt markieren")}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!filteredCommissions || filteredCommissions.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {t("affiliate.admin.noCommissions", "Keine Provisionen gefunden")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}