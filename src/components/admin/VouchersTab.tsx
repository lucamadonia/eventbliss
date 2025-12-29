import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, RefreshCw, Copy, Power } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Voucher {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number | null;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export function VouchersTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newVoucher, setNewVoucher] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    max_uses: "",
    valid_until: "",
  });

  const fetchVouchers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("vouchers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVouchers(data || []);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      toast({
        title: t("common.error"),
        description: t("admin.vouchers.fetchError", "Fehler beim Laden der Voucher"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "EVB-";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewVoucher((prev) => ({ ...prev, code }));
  };

  const handleCreateVoucher = async () => {
    if (!newVoucher.code) {
      toast({
        title: t("common.error"),
        description: t("admin.vouchers.codeRequired", "Code ist erforderlich"),
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("vouchers").insert({
        code: newVoucher.code.toUpperCase(),
        discount_type: newVoucher.discount_type,
        discount_value: newVoucher.discount_value ? parseFloat(newVoucher.discount_value) : null,
        max_uses: newVoucher.max_uses ? parseInt(newVoucher.max_uses) : null,
        valid_until: newVoucher.valid_until ? new Date(newVoucher.valid_until).toISOString() : null,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: t("admin.vouchers.created", "Voucher erstellt"),
      });

      setCreateDialogOpen(false);
      setNewVoucher({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        max_uses: "",
        valid_until: "",
      });
      fetchVouchers();
    } catch (error: any) {
      console.error("Error creating voucher:", error);
      toast({
        title: t("common.error"),
        description: error.message?.includes("duplicate")
          ? t("admin.vouchers.duplicateCode", "Dieser Code existiert bereits")
          : t("admin.vouchers.createError", "Fehler beim Erstellen"),
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("vouchers")
        .update({ is_active: !currentState })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: currentState
          ? t("admin.vouchers.deactivated", "Voucher deaktiviert")
          : t("admin.vouchers.activated", "Voucher aktiviert"),
      });

      fetchVouchers();
    } catch (error) {
      console.error("Error toggling voucher:", error);
      toast({
        title: t("common.error"),
        variant: "destructive",
      });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: t("common.copied"),
    });
  };

  const getTypeBadge = (type: string) => {
    const types: Record<string, { label: string; className: string }> = {
      percentage: { label: "% Rabatt", className: "bg-blue-500/10 text-blue-600" },
      fixed: { label: "€ Rabatt", className: "bg-green-500/10 text-green-600" },
      free_trial: { label: "Testphase", className: "bg-purple-500/10 text-purple-600" },
      lifetime: { label: "Lifetime", className: "bg-amber-500/10 text-amber-600" },
    };
    const t = types[type] || types.percentage;
    return <Badge className={t.className}>{t.label}</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>{t("admin.vouchers.title", "Voucher-Verwaltung")}</CardTitle>
            <div className="flex gap-2">
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("admin.vouchers.create", "Voucher erstellen")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("admin.vouchers.createTitle", "Neuen Voucher erstellen")}</DialogTitle>
                    <DialogDescription>
                      {t("admin.vouchers.createDescription", "Erstelle einen Rabatt- oder Freischalt-Code")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>{t("admin.vouchers.code", "Code")}</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newVoucher.code}
                          onChange={(e) =>
                            setNewVoucher((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                          }
                          placeholder="EVB-XXXXX"
                        />
                        <Button variant="outline" onClick={generateCode}>
                          Generieren
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.vouchers.type", "Typ")}</Label>
                      <Select
                        value={newVoucher.discount_type}
                        onValueChange={(v) => setNewVoucher((prev) => ({ ...prev, discount_type: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Prozent-Rabatt (%)</SelectItem>
                          <SelectItem value="fixed">Fester Rabatt (€)</SelectItem>
                          <SelectItem value="free_trial">Kostenlose Testphase</SelectItem>
                          <SelectItem value="lifetime">Lifetime-Freischaltung</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(newVoucher.discount_type === "percentage" || newVoucher.discount_type === "fixed") && (
                      <div className="space-y-2">
                        <Label>
                          {newVoucher.discount_type === "percentage" ? "Rabatt (%)" : "Rabatt (€)"}
                        </Label>
                        <Input
                          type="number"
                          value={newVoucher.discount_value}
                          onChange={(e) =>
                            setNewVoucher((prev) => ({ ...prev, discount_value: e.target.value }))
                          }
                          placeholder={newVoucher.discount_type === "percentage" ? "20" : "10"}
                        />
                      </div>
                    )}
                    {newVoucher.discount_type === "free_trial" && (
                      <div className="space-y-2">
                        <Label>Testtage</Label>
                        <Input
                          type="number"
                          value={newVoucher.discount_value}
                          onChange={(e) =>
                            setNewVoucher((prev) => ({ ...prev, discount_value: e.target.value }))
                          }
                          placeholder="30"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>{t("admin.vouchers.maxUses", "Max. Einlösungen")}</Label>
                      <Input
                        type="number"
                        value={newVoucher.max_uses}
                        onChange={(e) =>
                          setNewVoucher((prev) => ({ ...prev, max_uses: e.target.value }))
                        }
                        placeholder={t("admin.vouchers.unlimited", "Unbegrenzt")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.vouchers.validUntil", "Gültig bis")}</Label>
                      <Input
                        type="date"
                        value={newVoucher.valid_until}
                        onChange={(e) =>
                          setNewVoucher((prev) => ({ ...prev, valid_until: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      {t("common.cancel")}
                    </Button>
                    <Button onClick={handleCreateVoucher}>{t("common.save")}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="icon" onClick={fetchVouchers}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.vouchers.code", "Code")}</TableHead>
                    <TableHead>{t("admin.vouchers.type", "Typ")}</TableHead>
                    <TableHead>{t("admin.vouchers.value", "Wert")}</TableHead>
                    <TableHead>{t("admin.vouchers.usage", "Nutzung")}</TableHead>
                    <TableHead>{t("admin.vouchers.validUntil", "Gültig bis")}</TableHead>
                    <TableHead>{t("admin.vouchers.status", "Status")}</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {t("admin.vouchers.noVouchers", "Keine Voucher vorhanden")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    vouchers.map((voucher) => (
                      <TableRow key={voucher.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-bold bg-muted px-2 py-1 rounded">
                              {voucher.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyCode(voucher.code)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(voucher.discount_type)}</TableCell>
                        <TableCell>
                          {voucher.discount_type === "percentage" && `${voucher.discount_value}%`}
                          {voucher.discount_type === "fixed" && `${voucher.discount_value}€`}
                          {voucher.discount_type === "free_trial" && `${voucher.discount_value} Tage`}
                          {voucher.discount_type === "lifetime" && "—"}
                        </TableCell>
                        <TableCell>
                          <span className={voucher.max_uses && voucher.used_count >= voucher.max_uses ? "text-destructive" : ""}>
                            {voucher.used_count} / {voucher.max_uses || "∞"}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {voucher.valid_until
                            ? format(new Date(voucher.valid_until), "dd.MM.yyyy", { locale: de })
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={voucher.is_active ? "default" : "secondary"}>
                            {voucher.is_active ? "Aktiv" : "Inaktiv"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(voucher.id, voucher.is_active)}
                          >
                            <Power className={`h-4 w-4 ${voucher.is_active ? "text-green-500" : "text-muted-foreground"}`} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
