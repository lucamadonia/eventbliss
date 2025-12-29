import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAllPayouts, useUpdatePayoutStatus, useAllAffiliates } from "@/hooks/useAffiliate";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Banknote,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  processing: "bg-blue-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  processing: Loader2,
  completed: CheckCircle,
  failed: XCircle,
};

const methodLabels: Record<string, string> = {
  bank_transfer: "Banküberweisung",
  paypal: "PayPal",
  stripe: "Stripe",
};

export function PayoutsTab() {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isProcessOpen, setIsProcessOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [payoutReference, setPayoutReference] = useState("");

  const { data: payouts, isLoading } = useAllPayouts();
  const { data: affiliates } = useAllAffiliates();
  const updateStatus = useUpdatePayoutStatus();

  const filteredPayouts = payouts?.filter((p) => {
    const matchesSearch =
      p.affiliate?.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.affiliate?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.payout_reference?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: payouts?.length || 0,
    pending: payouts?.filter((p) => p.status === "pending").length || 0,
    processing: payouts?.filter((p) => p.status === "processing").length || 0,
    completed: payouts?.filter((p) => p.status === "completed").length || 0,
    totalPending: payouts
      ?.filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0,
    totalProcessing: payouts
      ?.filter((p) => p.status === "processing")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0,
    totalCompleted: payouts
      ?.filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const handleProcess = (payout: any) => {
    setSelectedPayout(payout);
    setPayoutReference("");
    setIsProcessOpen(true);
  };

  const handleStartProcessing = () => {
    if (!selectedPayout) return;
    updateStatus.mutate({
      id: selectedPayout.id,
      status: "processing",
    });
    setIsProcessOpen(false);
  };

  const handleComplete = () => {
    if (!selectedPayout) return;
    updateStatus.mutate({
      id: selectedPayout.id,
      status: "completed",
      payout_reference: payoutReference,
      processed_by: user?.id,
    });
    setIsProcessOpen(false);
  };

  const handleMarkFailed = (id: string) => {
    updateStatus.mutate({
      id,
      status: "failed",
      processed_by: user?.id,
    });
  };

  const exportCSV = () => {
    if (!filteredPayouts) return;

    const headers = [
      "Datum",
      "Partner",
      "E-Mail",
      "Betrag",
      "Methode",
      "Referenz",
      "Status",
      "Verarbeitet am",
    ];
    const rows = filteredPayouts.map((p) => [
      format(new Date(p.created_at), "dd.MM.yyyy HH:mm", { locale: de }),
      p.affiliate?.contact_name || "",
      p.affiliate?.email || "",
      p.amount,
      methodLabels[p.payout_method] || p.payout_method,
      p.payout_reference || "",
      p.status,
      p.processed_at ? format(new Date(p.processed_at), "dd.MM.yyyy HH:mm", { locale: de }) : "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `auszahlungen_${format(new Date(), "yyyy-MM-dd")}.csv`;
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
                <p className="text-sm text-muted-foreground">{t("affiliate.payout.pending", "Ausstehend")}</p>
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
                <Loader2 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("affiliate.payout.processing", "In Bearbeitung")}</p>
                <p className="text-2xl font-bold">{stats.processing}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(stats.totalProcessing)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("affiliate.payout.completed", "Abgeschlossen")}</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(stats.totalCompleted)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Banknote className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("affiliate.payout.total", "Gesamt")}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(stats.totalPending + stats.totalProcessing + stats.totalCompleted)}
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
              <SelectItem value="pending">{t("affiliate.payout.pending", "Ausstehend")}</SelectItem>
              <SelectItem value="processing">{t("affiliate.payout.processing", "In Bearbeitung")}</SelectItem>
              <SelectItem value="completed">{t("affiliate.payout.completed", "Abgeschlossen")}</SelectItem>
              <SelectItem value="failed">{t("affiliate.payout.failed", "Fehlgeschlagen")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" />
          {t("affiliate.admin.export", "Exportieren")}
        </Button>
      </div>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            {t("affiliate.admin.payoutsList", "Auszahlungen")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("affiliate.admin.date", "Datum")}</TableHead>
                  <TableHead>{t("affiliate.admin.partner", "Partner")}</TableHead>
                  <TableHead className="text-right">{t("affiliate.admin.amount", "Betrag")}</TableHead>
                  <TableHead>{t("affiliate.admin.method", "Methode")}</TableHead>
                  <TableHead>{t("affiliate.admin.period", "Zeitraum")}</TableHead>
                  <TableHead>{t("affiliate.admin.reference", "Referenz")}</TableHead>
                  <TableHead>{t("common.status", "Status")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayouts?.map((payout) => {
                  const StatusIcon = statusIcons[payout.status] || Clock;
                  return (
                    <TableRow key={payout.id}>
                      <TableCell>
                        {format(new Date(payout.created_at), "dd.MM.yyyy", { locale: de })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payout.affiliate?.contact_name}</p>
                          <p className="text-sm text-muted-foreground">{payout.affiliate?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(parseFloat(payout.amount))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {t(`affiliate.payoutMethod.${payout.payout_method}`, methodLabels[payout.payout_method] || payout.payout_method)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payout.period_start && payout.period_end ? (
                          <span className="text-sm">
                            {format(new Date(payout.period_start), "dd.MM.yy")} -{" "}
                            {format(new Date(payout.period_end), "dd.MM.yy")}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {payout.payout_reference ? (
                          <span className="font-mono text-sm">{payout.payout_reference}</span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[payout.status]} text-white`}>
                          <StatusIcon className={`h-3 w-3 mr-1 ${payout.status === "processing" ? "animate-spin" : ""}`} />
                          {t(`affiliate.payout.${payout.status}`, payout.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {payout.status === "pending" && (
                            <Button size="sm" onClick={() => handleProcess(payout)}>
                              {t("affiliate.admin.process", "Bearbeiten")}
                            </Button>
                          )}
                          {payout.status === "processing" && (
                            <>
                              <Button size="sm" onClick={() => handleProcess(payout)}>
                                {t("affiliate.admin.complete", "Abschließen")}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleMarkFailed(payout.id)}
                              >
                                {t("affiliate.admin.failed", "Fehlgeschlagen")}
                              </Button>
                            </>
                          )}
                          {payout.status === "completed" && (
                            <Button size="sm" variant="ghost" onClick={() => handleProcess(payout)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!filteredPayouts || filteredPayouts.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {t("affiliate.admin.noPayouts", "Keine Auszahlungen gefunden")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Process Payout Dialog */}
      <Dialog open={isProcessOpen} onOpenChange={setIsProcessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("affiliate.admin.processPayout", "Auszahlung verarbeiten")}</DialogTitle>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">{t("affiliate.admin.partner", "Partner")}</p>
                  <p className="font-medium">{selectedPayout.affiliate?.contact_name}</p>
                  <p className="text-sm">{selectedPayout.affiliate?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("affiliate.admin.amount", "Betrag")}</p>
                  <p className="text-2xl font-bold">{formatCurrency(parseFloat(selectedPayout.amount))}</p>
                </div>
              </div>

              <div>
                <Label>{t("affiliate.admin.method", "Auszahlungsmethode")}</Label>
                <p className="font-medium">
                  {t(`affiliate.payoutMethod.${selectedPayout.payout_method}`, methodLabels[selectedPayout.payout_method])}
                </p>
              </div>

              {selectedPayout.status === "processing" && (
                <div>
                  <Label>{t("affiliate.admin.reference", "Transaktionsreferenz")}</Label>
                  <Input
                    value={payoutReference}
                    onChange={(e) => setPayoutReference(e.target.value)}
                    placeholder={t("affiliate.admin.referencePlaceholder", "z.B. SEPA-Überweisungsreferenz")}
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end">
                {selectedPayout.status === "pending" && (
                  <Button onClick={handleStartProcessing} disabled={updateStatus.isPending}>
                    {updateStatus.isPending ? t("common.loading", "Laden...") : t("affiliate.admin.startProcessing", "Bearbeitung starten")}
                  </Button>
                )}
                {selectedPayout.status === "processing" && (
                  <Button onClick={handleComplete} disabled={updateStatus.isPending}>
                    {updateStatus.isPending ? t("common.loading", "Laden...") : t("affiliate.admin.markCompleted", "Als abgeschlossen markieren")}
                  </Button>
                )}
                {selectedPayout.status === "completed" && (
                  <Button variant="outline" onClick={() => setIsProcessOpen(false)}>
                    {t("common.close", "Schließen")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}